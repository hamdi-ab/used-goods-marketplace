-- P1.7 (#75): Add offer expiry.
-- PRD FR 303-307 lists "Expired" as an offer status; the enum only had
-- pending/countered/accepted/declined, so a stale pending offer could hold a
-- listing hostage forever. Add an 'expired' status + an expires_at column, a
-- cancel_expired_offers job, stamp expiry on new offers, and surface the
-- window in the buyer/seller flows.
--
-- Expiry horizon: offers lapse OFFER_EXPIRY_MS (7 days), mirrored in SQL here
-- and in lib/offers/constants.ts OFFER_EXPIRY_MS. The single cron job runs
-- cancel_expired_offers; on the local Supabase stack pg_cron is not installed,
-- so tests invoke the function directly (the RPC is the testable seam).

-- 'expired' closes an offer that no one acted on in time. ALTER TYPE ... ADD
-- VALUE cannot run inside a transaction block; the Supabase migration runner
-- applies migrations statement-by-statement (verified), so this is safe here.
alter type public.offer_status add value if not exists 'expired';

-- The deadline a buyer/seller is racing against. NULL means the offer is no
-- longer awaiting a reply (accepted/declined/countered/expired).
alter table public.offers add column if not exists expires_at timestamptz;

--------------------------------------------------------------------------------
-- cancel_expired_offers: the cleanup job. Transitions every still-pending offer
-- whose deadline has passed to 'expired'. Only 'pending' offers expire; the
-- owner-driven transitions (accept/decline/counter) clear expires_at themselves,
-- so a countered/accepted offer is never erroneously closed here.
--------------------------------------------------------------------------------
create or replace function public.cancel_expired_offers()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.offers
    set status = 'expired'::public.offer_status,
        updated_at = now()
    where status = 'pending'
      and expires_at is not null
      and expires_at < now();
end;
$$;

-- Callable via the REST RPC (admin invokes it through the SDK; tests trigger a
-- cleanup cycle). SECURITY DEFINER + idempotent: it only ever flips a still-pending
-- offer whose deadline has already passed to 'expired', so a caller cannot reach
-- another user's not-yet-lapsed offers or read any rows.
revoke all on function public.cancel_expired_offers() from public;
grant execute on function public.cancel_expired_offers() to authenticated;

-- Backfill: pending offers (none in the seed, but safe on a live DB) get the
-- full horizon from their creation. The job then closes any that already lapsed.
update public.offers
  set expires_at = created_at + interval '7 days'
  where status = 'pending'
    and expires_at is null;

select public.cancel_expired_offers();

-- Supports the cron scan (pending + not-yet-deadline) and the buyer/seller reads
-- that filter expired offers out of the open set.
create index if not exists offers_pending_expires_at_idx
  on public.offers (expires_at)
  where status = 'pending' and expires_at is not null;

-- Schedule the cleanup job on hosts that have pg_cron (the local Supabase
-- stack does not). The job name makes cron.schedule idempotent across
-- re-applies. Scheduling is best-effort: even if pg_cron is absent, the
-- function above remains callable as an RPC for tests and manual runs.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (
      select 1 from cron.job where jobname = 'cancel-expired-offers'
    ) then
      perform cron.schedule(
        'cancel-expired-offers',
        '*/5 * * * *',
        'select public.cancel_expired_offers()'
      );
    end if;
  end if;
end;
$$;

--------------------------------------------------------------------------------
-- Rewire the offer transitions so the expiry clock lives only on the offer
-- while it is genuinely "awaiting a reply":
--   * submit_offer stamps the new pending offer with the full horizon.
--   * accept/decline/counter clear expires_at (the offer is no longer a
--     pending offer racing the clock; counters are a future extension of the
--     expiry window per scope P1.7).
--------------------------------------------------------------------------------

-- submit_offer: stamp expires_at on insert. (Re-declared verbatim from
-- 20260815000000_security_hardening with the single added expires_at column.)
create or replace function public.submit_offer(
  p_listing_id uuid,
  p_amount numeric,
  p_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
  v_recent integer;
begin
  v_buyer := auth.uid();
  if v_buyer is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid amount');
  end if;
  if p_amount > 100000000 then
    return jsonb_build_object('ok', false, 'error', 'amount too large');
  end if;
  if p_message is not null and char_length(p_message) > 500 then
    return jsonb_build_object('ok', false, 'error', 'message too long');
  end if;

  -- The listing must be live, published, and not the buyer's own (INV-005).
  if not exists (
    select 1 from public.listings
    where id = p_listing_id
      and status = 'published'
      and deleted_at is null
      and seller_id <> v_buyer
  ) then
    return jsonb_build_object('ok', false, 'error', 'listing is not available for offers');
  end if;

  -- Rate limit: max 10 offers per buyer per listing within the last hour.
  select count(*) into v_recent
  from public.offers
  where buyer_id = v_buyer
    and listing_id = p_listing_id
    and created_at > now() - interval '1 hour';

  if v_recent >= 10 then
    return jsonb_build_object('ok', false, 'error', 'rate limit exceeded, please wait before submitting another offer');
  end if;

  insert into public.offers (listing_id, buyer_id, amount, message, expires_at)
  values (p_listing_id, v_buyer, p_amount, nullif(trim(p_message), ''),
          now() + interval '7 days');

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

-- accept_offer: clear the expiry clock once the listing is sold.
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
  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'offer not found');
  end if;

  select * into v_listing from public.listings where id = v_offer.listing_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'listing not found');
  end if;

  v_is_seller := v_listing.seller_id = (select auth.uid());
  v_is_buyer := v_offer.buyer_id = (select auth.uid());

  if not (
    public.is_admin()
    or (v_is_seller and v_offer.status = 'pending')
    or (v_is_buyer and v_offer.status = 'countered')
  ) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  if v_listing.status <> 'published' or v_listing.deleted_at is not null then
    return jsonb_build_object('ok', false, 'error', 'listing is no longer available');
  end if;

  -- OfferResolved: leaving the pending window clears the expiry clock.
  update public.offers
    set status = 'accepted', expires_at = null
    where id = p_offer_id;

  update public.listings
    set status = 'sold', sold_to_buyer_id = v_offer.buyer_id
    where id = v_listing.id;

  perform public.recompute_trust_score(v_listing.seller_id);

  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

-- decline_offer: clears the clock like accept.
create or replace function public.decline_offer(p_offer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers;
  v_is_seller boolean;
  v_is_buyer boolean;
begin
  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'offer not found');
  end if;

  v_is_seller := exists (
    select 1 from public.listings l
    where l.id = v_offer.listing_id and l.seller_id = (select auth.uid())
  );
  v_is_buyer := v_offer.buyer_id = (select auth.uid());

  if not (
    public.is_admin()
    or (v_is_seller and v_offer.status = 'pending')
    or (v_is_buyer and v_offer.status = 'countered')
  ) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  -- OfferResolved: leaving the pending window clears the expiry clock.
  update public.offers
    set status = 'declined', expires_at = null
    where id = p_offer_id;
  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

-- counter_offer: clears the buyer's pending clock when the seller counters.
create or replace function public.counter_offer(p_offer_id uuid, p_amount numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.offers;
  v_listing public.listings;
begin
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid amount');
  end if;
  if p_amount > 100000000 then
    return jsonb_build_object('ok', false, 'error', 'amount too large');
  end if;

  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'offer not found');
  end if;

  select * into v_listing from public.listings where id = v_offer.listing_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'listing not found');
  end if;

  if not (
    public.is_admin()
    or v_listing.seller_id = (select auth.uid())
  ) then
    return jsonb_build_object('ok', false, 'error', 'not allowed');
  end if;

  if v_offer.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'offer is no longer pending');
  end if;

  if v_listing.status <> 'published' or v_listing.deleted_at is not null then
    return jsonb_build_object('ok', false, 'error', 'listing is no longer available');
  end if;

  -- OfferResolved: leaving the pending window clears the expiry clock.
  update public.offers
    set status = 'countered', amount = p_amount, expires_at = null
    where id = p_offer_id;
  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

-- RPC grants are preserved across CREATE OR REPLACE (the original migration's
-- revoke/grant lines already restricted them to authenticated).

