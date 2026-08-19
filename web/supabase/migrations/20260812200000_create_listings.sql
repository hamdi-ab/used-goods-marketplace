-- T04 - Listings service (CRUD, photos, search index)
-- categories + listings + listing_images, per docs/02-architecture/03-database-design-specification.md
-- §7 (categories), §8 (listings), §7 listing_images, §17 (indexes), §19 (images: max 10),
-- §20 (RLS), §22 (migration naming). Full-text search index per resolved #3 (tsvector + GIN + pg_trgm).
-- File-storage layout: avatars/, listing-images/ (docs/02-architecture/00-system-architecture.md §10).

create extension if not exists pg_trgm;

-- Categories (top-level + optional parent for sub-categories; T06 search facets them).
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories (id) on delete set null,
  icon text,
  created_at timestamptz not null default now()
);

-- Listing condition + status constrained to the documented value sets.
create type public.listing_condition as enum ('Brand New', 'Lightly Used', 'Fair');
create type public.listing_status as enum ('draft', 'published', 'sold', 'archived');

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.categories (id),
  title text not null,
  description text,
  price numeric(12, 2) not null check (price > 0),
  condition public.listing_condition not null,
  negotiable boolean not null default false,
  city text,
  sub_city text,
  address text,
  status public.listing_status not null default 'published',
  view_count integer not null default 0,
  favorite_count integer not null default 0,
  published_at timestamptz not null default now(),
  search_vector tsvector
    generated always as
      (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')))
    stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Constraint ranges from DB spec §18: title 5-120, description 20-2000 (null allowed).
alter table public.listings
  add constraint listings_title_len check (char_length(title) between 5 and 120),
  add constraint listings_description_len check (description is null or char_length(description) between 20 and 2000);

-- Indexes (DB spec §17 + §19 full-text, now resolved by #3).
create index if not exists listings_seller_id_idx on public.listings (seller_id);
create index if not exists listings_category_id_idx on public.listings (category_id);
create index if not exists listings_city_idx on public.listings (city);
create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_price_idx on public.listings (price);
create index if not exists listings_published_at_idx on public.listings (published_at);
create index if not exists listings_search_idx on public.listings using gin (search_vector);
create index if not exists listings_trgm_idx on public.listings
  using gin (title gin_trgm_ops, description gin_trgm_ops);

-- Images: max 10 per listing (§19), enforced in app logic + FK.
create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  image_url text not null,
  display_order smallint not null default 0,
  alt_text text,
  created_at timestamptz not null default now()
);
create index if not exists listing_images_listing_id_idx on public.listing_images (listing_id);
create index if not exists listing_images_display_order_idx on public.listing_images (listing_id, display_order);

-- Keep listings.updated_at in sync (reuse the generic trigger from T02).
create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.handle_updated_at();

------------------------------------------------------------------------------
-- RLS (DB spec §20 Listings):
--   - Public can read PUBLISHED, non-deleted listings.
--   - Sellers create listings (row bound to the seller via auth.uid()).
--   - Sellers update/delete only their OWN listings; admins full access.
------------------------------------------------------------------------------
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;

create policy "Listings are readable when published"
  on public.listings for select
  to authenticated, anon
  using (status = 'published' and deleted_at is null);

create policy "Listings are readable by the owner"
  on public.listings for select
  to authenticated
  using ((select auth.uid()) = seller_id);

create policy "Listings are insertable by the owner"
  on public.listings for insert
  to authenticated
  with check ((select auth.uid()) = seller_id);

create policy "Listings are updatable by the owner"
  on public.listings for update
  to authenticated
  using ((select auth.uid()) = seller_id)
  with check ((select auth.uid()) = seller_id);

create policy "Listings are deletable by the owner"
  on public.listings for delete
  to authenticated
  using ((select auth.uid()) = seller_id);

create policy "Listings are manageable by admins"
  on public.listings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Listing images are readable with published listings"
  on public.listing_images for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
        and l.status = 'published'
        and l.deleted_at is null
    )
  );

create policy "Listing images are writable by the listing owner"
  on public.listing_images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
        and l.seller_id = (select auth.uid())
    )
  );

create policy "Listing images are updatable by the listing owner"
  on public.listing_images for update
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
        and l.seller_id = (select auth.uid())
    )
  );

create policy "Listing images are deletable by the listing owner"
  on public.listing_images for delete
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
        and l.seller_id = (select auth.uid())
    )
  );

create policy "Listing image admins full access"
  on public.listing_images for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.listings, public.listing_images, public.categories
  to authenticated;
grant select on public.listings, public.listing_images, public.categories to anon;

------------------------------------------------------------------------------
-- Storage (design §10): listing photos in the `listing-images` bucket.
-- Public read (bucket is public); only the listing owner may write to
-- listing-images/{listing_id}/... (foldername()[0] is the listing id).
-- 5 MB per image, JPG/JPEG/PNG/WebP; magic-byte + size validation happens in
-- the upload service (app/lib/listings.ts) — Storage RLS is defense-in-depth.
------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('listing-images', 'listing-images', true, 5242880)
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit;

create policy "Listing photos are publicly readable"
  on storage.objects for select
  to authenticated, anon
  using (bucket_id = 'listing-images');

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

------------------------------------------------------------------------------
-- Seed categories (DB spec §23).
------------------------------------------------------------------------------
insert into public.categories (name, slug, parent_id) values
  ('Electronics', 'electronics', null),
  ('Furniture', 'furniture', null),
  ('Home Appliances', 'home-appliances', null),
  ('Vehicles', 'vehicles', null),
  ('Fashion', 'fashion', null),
  ('Books', 'books', null),
  ('Sports', 'sports', null),
  ('Baby & Kids', 'baby-and-kids', null),
  ('Other', 'other', null)
on conflict (slug) do nothing;
