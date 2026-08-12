-- T02 - Auth, roles & onboarding
-- Profiles table per docs/02-architecture/03-database-design-specification.md §6 + §20
-- Description: public user info, role model (buyer/seller/admin), RLS baseline.
-- A fresh auth user is given an empty profile row (role defaults to "buyer") by the
-- on_auth_user_created trigger; the row is completed during onboarding.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  telegram_username text,
  city text,
  sub_city text,
  bio text,
  trust_score smallint not null default 50 check (trust_score between 0 and 100),
  profile_completion smallint not null default 0 check (profile_completion between 0 and 100),
  role text not null default 'buyer' check (role in ('buyer', 'seller', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists profiles_phone_idx on public.profiles (phone);
create index if not exists profiles_city_idx on public.profiles (city);
create index if not exists profiles_role_idx on public.profiles (role);

-- Keep updated_at in sync.
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create a profile row for every new auth user (role defaults to "buyer").
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin role helper for RLS. Reads only the caller's own role.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- RLS baseline: users read/write only their own profile; admins may read/update all.
alter table public.profiles enable row level security;

create policy "Profiles are selectable by the owner"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Profiles are insertable by the owner"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Profiles are updatable by the owner"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check (
    (select auth.uid()) = id
    and role in ('buyer', 'seller')
  );

create policy "Profiles are deletable by the owner"
  on public.profiles for delete
  to authenticated
  using ((select auth.uid()) = id);

create policy "Profiles are readable by admins"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "Profiles are updatable by admins"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Expose the table to the Data API roles (RLS still gates rows).
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select on table public.profiles to anon;

-- Note: reading other users' *public* profile fields (display name, city) is a
-- T03 (profiles) concern. Public browse pages will relax this via column-level
-- read policies, while the owner-only baseline above stays the private-data gate.