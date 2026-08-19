-- Fix the listing-photo storage policy: storage.foldername() returns a
-- 1-indexed array, so [0] was always NULL and every upload to listing-images
-- was denied by RLS. The avatar policy (profiles bucket) already uses [1];
-- align the listing policy with it. (Source bug fixed in
-- 20260812200000_create_listings.sql; this repairs already-applied DBs.)
drop policy if exists "Listing photos are writable by the listing owner"
  on storage.objects;

create policy "Listing photos are writable by the listing owner"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1]::uuid in (
      select l.id from public.listings l where l.seller_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1]::uuid in (
      select l.id from public.listings l where l.seller_id = (select auth.uid())
    )
  );