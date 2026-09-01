-- T24 - Account tier model (map #54, monetization slice)
-- profiles.tier enum (free/pro/business, default free); existing rows get free.
-- The tier is the server-side source of truth for quotas (T26/T28). Self-serve
-- tier changes are blocked (upgrade is demo-only, T27): a trigger permits tier
-- writes only from an admin, so a client can never promote itself.

create type public.account_tier as enum ('free', 'pro', 'business');

alter table public.profiles
  add column if not exists tier public.account_tier not null default 'free';

-- Only admins may change a profile's tier. The owner update policy on profiles
-- (create_profiles.sql) would otherwise let any user promote themselves via a
-- direct UPDATE; this trigger closes that hole before the row is written.
create or replace function public.guard_tier_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and new.tier is distinct from old.tier then
    raise exception 'tier changes require an admin';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_tier_change
  before update of tier on public.profiles
  for each row execute function public.guard_tier_change();