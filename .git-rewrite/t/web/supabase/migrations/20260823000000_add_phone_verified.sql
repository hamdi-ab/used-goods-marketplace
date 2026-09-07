-- Add phone_verified badge to profiles
-- Phone verification is optional — gives users a verified badge on their profile.

alter table public.profiles
  add column if not exists phone_verified boolean not null default false;

create index if not exists profiles_phone_verified_idx on public.profiles (phone_verified);

grant update (phone_verified) on table public.profiles to authenticated;
