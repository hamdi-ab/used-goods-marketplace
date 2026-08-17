-- P1.16 (#83): Align trust-score formula with PRD.
-- PRD FR 140-147 / FS "Trust Score Formula" derive trust from profile
-- completion + ratings + successful listings + verification + reports. The
-- pre-fix implementation only wrote round(avg(rating)*20) inside submit_review
-- and +/- deltas inside record_verification (the T12 migration's own note
-- called the unified service "Future Component"). This migration introduces ONE
-- composite recompute and rewires every write path to it:
--
--   trust = round(
--       0.35 * ratings          -- round(avg(rating) * 20): 1-5 stars -> 20-100 (0 if none)
--     + 0.25 * completion       -- profiles.profile_completion (0-100, generated column, #82)
--     + 0.20 * sales            -- least(10, sold listings) * 10 (0-100)
--     + 0.10 * verification     -- (phone_verified + fayda_verified) * 50 (0/50/100)
--     + 0.10 * report_signal    -- greatest(0, 100 - resolved reports * 25) (0-100)
--   ), clamped to 0-100
--
-- Weights are the audit decision (35/25/20/10/10, recorded in DB spec §6):
-- ratings stay dominant, completed profiles matter, completed sales and
-- verified identity earn, and only an actionable (resolved) report penalizes --
-- rejected reports are noise and count for nothing. At the margin each resolved
-- report knocks 2.5 points off the final score.

create or replace function public.recompute_trust_score(p_user_id uuid)
returns smallint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rating numeric;
  v_completion smallint;
  v_phone_verified boolean;
  v_fayda_verified boolean;
  v_sold_count integer;
  v_resolved_reports integer;
  v_trust numeric;
begin
  if p_user_id is null then
    return null;
  end if;

  -- Ratings component: the existing review formula, 0 until the first review.
  select coalesce(round(avg(rating) * 20), 0) into v_rating
  from public.reviews
  where seller_id = p_user_id;

  -- Completion + verification components read the profile itself.
  select profile_completion, phone_verified, fayda_verified
    into v_completion, v_phone_verified, v_fayda_verified
  from public.profiles
  where id = p_user_id;
  if not found then
    return null;
  end if;

  -- Successful-listings component: sold listings only, capped at ten.
  select count(*) into v_sold_count
  from public.listings
  where seller_id = p_user_id
    and status = 'sold'
    and deleted_at is null;

  -- Reports component: each resolved (actionable) report costs 25 signal
  -- points, floor 0. A report counts against a seller whether it targets them
  -- directly or targets one of their listings. 'rejected' reports never count
  -- against the seller.
  select count(*) into v_resolved_reports
  from public.reports r
  where r.status = 'resolved'
    and (
      r.reported_seller_id = p_user_id
      or exists (
        select 1 from public.listings l
        where l.id = r.reported_listing_id and l.seller_id = p_user_id
      )
    );

  v_trust := round(
      0.35 * v_rating
    + 0.25 * v_completion
    + 0.20 * least(10, v_sold_count) * 10
    + 0.10 * (case when v_phone_verified then 50 else 0 end
              + case when v_fayda_verified then 50 else 0 end)
    + 0.10 * greatest(0, 100 - v_resolved_reports * 25)
  );

  update public.profiles
    set trust_score = least(100, greatest(0, v_trust))::smallint
    where id = p_user_id;

  return least(100, greatest(0, v_trust))::smallint;
end;
$$;

-- The composite recompute is an internal primitive: only the write paths below
-- (and seed) may invoke it. No direct client call.
revoke all on function public.recompute_trust_score from public;

--------------------------------------------------------------------------------
-- submit_review: keep the DB-side recompute on review, but with the composite
-- (PRD FR 145). Replacing the trust write with perform keeps the review insert
-- and the score update atomic in the same RPC as before.
--------------------------------------------------------------------------------
create or replace function public.submit_review(p_offer_id uuid, p_rating smallint, p_comment text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers;
  v_listing public.listings;
  v_seller_id uuid;
  v_rows integer;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    return jsonb_build_object('ok', false, 'error', 'rating must be between 1 and 5');
  end if;
  if p_comment is not null and char_length(p_comment) > 1000 then
    return jsonb_build_object('ok', false, 'error', 'comment is too long');
  end if;

  select * into v_offer from public.offers where id = p_offer_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'offer not found');
  end if;

  -- INV-008: a review must reference a completed transaction (an accepted
  -- offer), and only the transaction's buyer may write it.
  if v_offer.status <> 'accepted' or v_offer.buyer_id <> (select auth.uid()) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  select * into v_listing from public.listings where id = v_offer.listing_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'listing not found');
  end if;
  v_seller_id := v_listing.seller_id;

  insert into public.reviews (offer_id, seller_id, buyer_id, rating, comment)
  values (p_offer_id, v_seller_id, v_offer.buyer_id, p_rating, nullif(p_comment, ''))
  on conflict (offer_id) do nothing;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'error', 'offer already reviewed');
  end if;

  -- ReviewSubmitted -> Recalculate Trust Score (domain model §9); the composite
  -- includes this review's rating through the ratings component (#83).
  perform public.recompute_trust_score(v_seller_id);

  return jsonb_build_object('ok', true, 'error', null, 'seller_id', v_seller_id);
end;
$$;

--------------------------------------------------------------------------------
-- accept_offer: a completed sale is a successful listing, so the seller's
-- trust score is recomputed the moment the listing closes (PRD FR 146).
--------------------------------------------------------------------------------
create or replace function public.accept_offer(p_offer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers;
  v_listing public.listings;
  v_is_seller boolean;
  v_is_buyer boolean;
begin
  -- Lock the offer row, then the listing row. With both held, a second accept
  -- (of this offer, or of another offer on the same listing) blocks until this
  -- one commits, then re-reads the now-sold listing and bails -- so a
  -- double-accept really is impossible.
  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'offer not found');
  end if;

  select * into v_listing from public.listings where id = v_offer.listing_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'listing not found');
  end if;

  -- The seller may accept a pending offer; the buyer may accept a counter;
  -- admins have full access (DB spec §20).
  v_is_seller := v_listing.seller_id = (select auth.uid());
  v_is_buyer := v_offer.buyer_id = (select auth.uid());

  if not (
    public.is_admin()
    or (v_is_seller and v_offer.status = 'pending')
    or (v_is_buyer and v_offer.status = 'countered')
  ) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  -- The listing must still be for sale. With the row locked this cannot race:
  -- once a listing is sold the check fails for everyone else.
  if v_listing.status <> 'published' or v_listing.deleted_at is not null then
    return jsonb_build_object('ok', false, 'error', 'listing is no longer available');
  end if;

  update public.offers set status = 'accepted' where id = p_offer_id;
  -- ListingMarkedSold: an accepted offer closes the listing to further offers,
  -- and stamps the winner so the sale stays visible to both parties.
  update public.listings
    set status = 'sold', sold_to_buyer_id = v_offer.buyer_id
    where id = v_listing.id;

  -- ListingMarkedSold -> Recalculate Trust Score: the fresh sale feeds the
  -- successful-listings component (#83).
  perform public.recompute_trust_score(v_listing.seller_id);

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

--------------------------------------------------------------------------------
-- record_verification: the verification signal is part of the composite, so
-- the +/- delta writes are replaced by a single recompute. Approving phone (50)
-- or fayda (50) feeds the verification component; rejecting restores the prior
-- component value. Flags update first so the recompute reads the new state.
--------------------------------------------------------------------------------
create or replace function public.record_verification(
  p_user_id uuid,
  p_type public.verification_type,
  p_status public.verification_status,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'admin only');
  end if;
  if p_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'user id is required');
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    return jsonb_build_object('ok', false, 'error', 'profile not found');
  end if;
  if p_notes is not null and char_length(p_notes) > 2000 then
    return jsonb_build_object('ok', false, 'error', 'notes are too long');
  end if;

  -- One live verification per (user, type). A re-verification issues a fresh
  -- audit row; the prior live row is soft-deleted FIRST (its status stays
  -- immutable per INV-009, so an approved record is never "un-approved" in
  -- place) so the one-live-per-type index no longer counts it when we insert.
  update public.verifications
    set deleted_at = now()
    where user_id = p_user_id
      and type = p_type
      and deleted_at is null;

  insert into public.verifications (user_id, type, status, verifier_id, verified_at, notes)
  values (p_user_id, p_type, p_status, (select auth.uid()),
          case when p_status = 'verified' then now() end, nullif(p_notes, ''));

  if p_type = 'phone' then
    update public.profiles set phone_verified = (p_status = 'verified') where id = p_user_id;
  elsif p_type = 'fayda' then
    update public.profiles set fayda_verified = (p_status = 'verified') where id = p_user_id;
  end if;

  -- VerificationApproved/rejected -> Recalculate Trust Score (#83): the flag
  -- change above feeds the verification component of the composite.
  perform public.recompute_trust_score(p_user_id);

  return jsonb_build_object('ok', true, 'error', null, 'user_id', p_user_id, 'type', p_type);
end;
$$;

--------------------------------------------------------------------------------
-- resolve_report: an actionable verdict (remove_listing / block_seller) now
-- recomputes the reported seller's trust so the reports deduction applies
-- immediately (PRD FR 147). A listing-targeted report resolves to the listing's
-- seller. Rejected reports are spam/mistaken -- no penalty, so no recompute.
--------------------------------------------------------------------------------
create or replace function public.resolve_report(
  p_report_id uuid,
  p_action text,
  p_admin_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.reports;
  v_seller_id uuid;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  select * into v_report from public.reports where id = p_report_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'report not found');
  end if;

  if v_report.status <> 'open' then
    return jsonb_build_object('ok', false, 'error', 'report already resolved');
  end if;

  if p_action = 'remove_listing' then
    if v_report.reported_listing_id is null then
      return jsonb_build_object('ok', false, 'error', 'report has no listing target');
    end if;
    -- Soft-delete the listing (mirrors softDeleteListing; RLS already gives
    -- admins full access via the "manageable by admins" policy).
    update public.listings
      set deleted_at = now(), status = 'archived'
      where id = v_report.reported_listing_id;
  elsif p_action = 'block_seller' then
    if v_report.reported_seller_id is null then
      return jsonb_build_object('ok', false, 'error', 'report has no seller target');
    end if;
    -- Revoke seller privileges: demote to buyer. This strips the seller
    -- role so the profile gate (requireSeller) blocks them. Any active
    -- listings they have are soft-deleted so they disappear from all reads.
    update public.profiles
      set role = 'buyer'
      where id = v_report.reported_seller_id;
    update public.listings
      set deleted_at = now(), status = 'archived'
      where seller_id = v_report.reported_seller_id
        and deleted_at is null
        and status in ('published', 'draft');
  elsif p_action = 'reject' then
    -- No content change; just close the report.
  else
    return jsonb_build_object('ok', false, 'error', 'invalid action');
  end if;

  update public.reports
    set status = case
      when p_action = 'reject' then 'rejected'::public.report_status
      else 'resolved'::public.report_status
    end,
    note = case
      when p_admin_note is not null then
        -- Truncate to honour the reports_note_length check (1000 chars).
        left(coalesce(note, '') || ' [admin: ' || p_admin_note || ']', 1000)
      else note
    end
    where id = p_report_id;

  -- An actionable verdict penalizes the seller through the reports component.
  -- A listing-targeted report resolves to that listing's seller.
  if p_action <> 'reject' then
    if v_report.reported_seller_id is not null then
      v_seller_id := v_report.reported_seller_id;
    elsif v_report.reported_listing_id is not null then
      select seller_id into v_seller_id
      from public.listings
      where id = v_report.reported_listing_id;
    end if;
    if v_seller_id is not null then
      perform public.recompute_trust_score(v_seller_id);
    end if;
  end if;

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

-- RPC grants: only authenticated (admin checks happen inside each function).
revoke all on function public.resolve_report from public;
grant execute on function public.resolve_report to authenticated;

-- Reports follow the listings "manageable by admins" pattern: the RLS policy
-- above already gates every statement to admins, and this table grant makes
-- the delete surface actually reachable (the original migration only granted
-- SELECT). Clients still never touch the table directly — submit_report and
-- resolve_report remain the sole write paths; admins can clean resolved rows.
grant delete on public.reports to authenticated;
