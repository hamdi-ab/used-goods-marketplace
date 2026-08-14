-- T08 - Offers service
-- offers: buyer price proposals on published listings, with a status machine
-- (pending/countered/accepted/declined), per
-- docs/02-architecture/03-database-design-specification.md §10 (offers), §18
-- (amount + message constraints), §20 (RLS: buyer sees own offers, seller sees
-- offers on own listings, admin has full access), §22 (migration naming), and
-- the domain model (INV-005: no offers on your own listing; ListingMarkedSold:
-- an accepted offer closes the listing).
--
-- Status transitions run through SECURITY DEFINER RPCs (accept/decline/counter)
-- instead of client-side UPDATE so the accept path atomically marks the listing
-- sold, a buyer accepting a counter can mark a listing they don't own, and each
-- transition re-checks the caller against the offer row. RLS below therefore
-- only grants SELECT (participants + admins) and INSERT (the buyer), never
-- UPDATE/DELETE.
--
-- T08 adds listings.sold_to_buyer_id (not in DB spec §8): accept_offer stamps
-- the winning buyer on the listing so the sold listing stays readable to that
-- buyer (and its images to both parties) WITHOUT an offers<->listings RLS
-- cycle. The sold-read policies read only the stamp, while the offers SELECT
-- policy references listings one way — no policy queries the other table, so
-- RLS expansion cannot recurse.

create type if not exists public.offer_status as enum ('pending', 'countered', 'accepted', 'declined');

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  message text,
  status public.offer_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.offers
  add constraint if not exists offers_message_length
  check (message is null or char_length(message) between 1 and 500);

-- App-side ceiling (app/lib/offers/constants.ts OFFER_AMOUNT_MAX), enforced at
-- the write boundary so submit and counter both reject absurd amounts.
alter table public.offers
  add constraint if not exists offers_amount_cap
  check (amount <= 100000000);

-- ListingMarkedSold bookkeeping: who won the sale, stamped by accept_offer.
-- See header note for why this lives on listings rather than a join.
alter table public.listings
  add column if not exists sold_to_buyer_id uuid references public.profiles (id);

-- Lookup paths: the buyer's "my offers", the seller's "incoming offers", and
-- open offers on a listing.
create index if not exists offers_buyer_id_idx on public.offers (buyer_id);
create index if not exists offers_listing_id_idx on public.offers (listing_id);
create index if not exists offers_status_idx on public.offers (status);

create trigger if not exists offers_set_updated_at
  before update on public.offers
  for each row execute function public.handle_updated_at();

-----------------------------------------------------------------------------
-- RLS (DB spec §20 Offers): a user sees their own offers or offers on
-- listings they own (the seller dashboard); admins have full access. No one
-- else can see an offer, so amounts and messages never leak to other buyers.
-----------------------------------------------------------------------------
alter table public.offers enable row level security;

create policy if not exists "Offers are readable by the buyer or the listing seller"
  on public.offers for select
  to authenticated
  using (
    (select auth.uid()) = buyer_id
    or exists (
      select 1 from public.listings l
      where l.id = offers.listing_id and l.seller_id = (select auth.uid())
    )
    or public.is_admin()
  );

-- INV-005 + ListingMarkedSold: offers only land on published, live listings the
-- buyer does not own. Blocking the insert for non-published listings is what
-- stops new offers once a listing is sold (its status flips to 'sold').
create policy if not exists "Offers are insertable by the buyer"
  on public.offers for insert
  to authenticated
  with check (
    (select auth.uid()) = buyer_id
    and exists (
      select 1 from public.listings l
      where l.id = offers.listing_id
        and l.status = 'published'
        and l.deleted_at is null
        and l.seller_id <> (select auth.uid())
    )
  );

-- DB spec §20: admins can read and write any offer. The transition RPCs below
-- accept admins too (each guards on public.is_admin()).
create policy if not exists "Offers are manageable by admins"
  on public.offers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-----------------------------------------------------------------------------
-- Sold-listing readability (T08): once a listing is sold it stops matching the
-- "readable when published" policy, which would silently drop it from the
-- accepted-offer buyer's dashboard and from both participants' image feeds.
-- Both policies read only the sold_to_buyer_id stamp (see header note) so they
-- stay out of the offers policy graph.
-----------------------------------------------------------------------------
create policy if not exists "Sold listings are readable by the accepted-offer buyer"
  on public.listings for select
  to authenticated
  using ((select auth.uid()) = sold_to_buyer_id);

create policy if not exists "Listing images are readable by the seller or accepted-offer buyer"
  on public.listing_images for select
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
        and ((select auth.uid()) in (l.seller_id, l.sold_to_buyer_id))
    )
  );

-----------------------------------------------------------------------------
-- Status-transition RPCs (SECURITY DEFINER; each one re-checks the caller).
-- Bypassing RLS is deliberate: accept/decline/counter mutate the offer (and,
-- for accept, the listing) on behalf of whichever participant is acting, and
-- the caller check inside each function replaces the UPDATE policy. Rows are
-- locked offer-then-listing so concurrent transitions on one offer or one
-- listing serialize instead of lost-updating each other.
-----------------------------------------------------------------------------

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
  -- one commits, then re-reads the now-sold listing and bails — so a
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
  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

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

  -- A pending offer is declined by the seller; a counter is declined by the
  -- buyer (who declines = walks away from the counter); admins have full access.
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

  update public.offers set status = 'declined' where id = p_offer_id;
  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

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

  -- Only the seller (or an admin) counters a pending offer, and only while the
  -- listing is still live — countering an offer on a sold/deleted listing would
  -- strand the buyer, whose later accept could never succeed.
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

  update public.offers set status = 'countered', amount = p_amount where id = p_offer_id;
  return jsonb_build_object('ok', true, 'error', null);
end;
$$;

grant usage on schema public to anon, authenticated;
grant select, insert on public.offers to authenticated;

-- RPC grants: offered to authenticated only (offers are always owner-scoped),
-- and revoking from public keeps the implicit EXECUTE grant from exposing them.
revoke all on function public.accept_offer(uuid) from public;
revoke all on function public.decline_offer(uuid) from public;
revoke all on function public.counter_offer(uuid, numeric) from public;
grant execute on function public.accept_offer(uuid) to authenticated;
grant execute on function public.decline_offer(uuid) to authenticated;
grant execute on function public.counter_offer(uuid, numeric) to authenticated;
