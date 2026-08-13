-- T07 - Favorites service
-- favorites join table (user_id -> listing_id), per docs/02-architecture/03-database-design-specification.md
-- §11 (favorites), §18 (unique (user_id, listing_id)), §20 (RLS: "Users can only access their own favorites"),
-- §22 (migration naming). Keeps listings.favorite_count in sync via trigger.

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- §18: a user can favorite a listing at most once.
  constraint favorites_user_listing_unique unique (user_id, listing_id)
);

-- Listing-side lookups (counts, "who favorited this") and delete-by-listing cleanup.
create index if not exists favorites_listing_id_idx on public.favorites (listing_id);

-- Keep listings.favorite_count (denormalized, DB spec §8) in sync so later
-- "popular first" sorting never reads stale counters.
create or replace function public.sync_favorite_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.listings set favorite_count = favorite_count + 1 where id = new.listing_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.listings set favorite_count = greatest(favorite_count - 1, 0) where id = old.listing_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger if not exists favorites_sync_listing_count
  after insert or delete on public.favorites
  for each row execute function public.sync_favorite_count();

-----------------------------------------------------------------------------
-- RLS (DB spec §20 Favorites): a user only sees and writes their own rows.
-- No update policy: a favorite is created or removed, never edited.
-----------------------------------------------------------------------------
alter table public.favorites enable row level security;

create policy if not exists "Favorites are readable by the owner"
  on public.favorites for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy if not exists "Favorites are insertable by the owner"
  on public.favorites for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy if not exists "Favorites are deletable by the owner"
  on public.favorites for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select, insert, delete on public.favorites to authenticated;
