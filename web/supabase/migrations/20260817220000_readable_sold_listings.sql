-- P1.8 / #76: sold listings must remain browsable (PRD BR-003) even though
-- they no longer receive offers. The original "readable when published" policy
-- (20260812200000) gated select on status = 'published', which silently drops
-- sold listings from anon/authenticated reads. Replace it with a policy that
-- also exposes sold rows; the browse feed (fetchListings) and the card ribbon
-- (ListingCard) handle the display + Sold badge, while the offer boundary is
-- enforced separately (accept/counter on a sold row is rejected by the offers
-- write policy). Idempotent: rename-on-rerun via IF EXISTS guards.
--
-- The previous policy is dropped and a broader one created; we do not mutate
-- 20260812200000 because migrations are immutable.

drop policy if exists "Listings are readable when published" on public.listings;

create policy "Listings are readable when published or sold"
  on public.listings for select
  to authenticated, anon
  using (status in ('published', 'sold') and deleted_at is null);
