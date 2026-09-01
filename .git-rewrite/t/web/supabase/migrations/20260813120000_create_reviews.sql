-- T10 - Reviews & ratings
-- reviews: post-transaction buyer rating of the seller, one per accepted offer
-- (INV-008), per docs/02-architecture/03-database-design-specification.md §12
-- (schema), §20 (RLS Reviews), and docs/02-architecture/02-domain-model.md
-- (INV-008, ReviewSubmitted event, Trust Score Service).
--
-- Writes go through the SECURITY DEFINER submit_review RPC (the same pattern as
-- the offer transitions in T08) so seller_id is derived from the offer instead
-- of client input, the reviewer is verified as the accepted-offer buyer, and the
-- seller's trust_score is recomputed from ratings atomically with the insert.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null unique references public.offers (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.reviews
  add constraint reviews_comment_length
  check (comment is null or char_length(comment) between 1 and 1000);

-- Lookup paths: the seller's profile review list and "recent first".
create index if not exists reviews_seller_id_idx on public.reviews (seller_id);
create index if not exists reviews_seller_created_idx on public.reviews (seller_id, created_at desc);

------------------------------------------------------------------------------
-- RLS (DB spec §20 Reviews): public can read; the only write path is the
-- submit_review RPC, so no INSERT/UPDATE/DELETE policies are granted to the
-- client at all — a row can only arrive as the accepted-offer buyer, with
-- seller_id taken from the offer.
------------------------------------------------------------------------------
alter table public.reviews enable row level security;

create policy "Reviews are publicly readable"
  on public.reviews for select
  to authenticated, anon
  using (true);

------------------------------------------------------------------------------
-- submit_review: only the buyer of an ACCEPTED offer may review (INV-008).
-- The UNIQUE(offer_id) constraint enforces "one review per completed
-- transaction"; the `on conflict do nothing` guard turns the constraint into a
-- clean "already reviewed" response instead of a thrown unique violation.
-- After insert, the seller's trust_score is recomputed from their average
-- rating on a 0-100 scale (rating 1-5 -> score 20-100), which is what makes
-- the rating visible as the seller badge's Trust score (AC5, INV-007).
------------------------------------------------------------------------------
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

  -- ReviewSubmitted -> Recalculate Trust Score (domain model §9).
  update public.profiles
    set trust_score = (
      select round(avg(rating) * 20)::smallint
      from public.reviews where seller_id = v_seller_id
    )
    where id = v_seller_id;

  return jsonb_build_object('ok', true, 'error', null, 'seller_id', v_seller_id);
end;
$$;

grant usage on schema public to anon, authenticated;
grant select on public.reviews to authenticated, anon;

-- RPC grant: authenticated only; revoking from public keeps the implicit
-- EXECUTE grant from exposing it.
revoke all on function public.submit_review(uuid, smallint, text) from public;
grant execute on function public.submit_review(uuid, smallint, text) to authenticated;
