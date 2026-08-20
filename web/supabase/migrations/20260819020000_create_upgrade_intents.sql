-- T27 (parent #54, ticket #27) - Pro-upgrade intent capture (demo, no billing).
-- upgrade_intents is a lightweight ledger of "notify me when billing opens"
-- signals; no money changes hands and no tier is ever changed server-side
-- (upgrade is demo-only per strategy §32).

create table if not exists public.upgrade_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  email text not null,
  tier public.account_tier not null default 'pro',
  created_at timestamptz not null default now()
);

create index if not exists upgrade_intents_user_id_idx
  on public.upgrade_intents (user_id);

alter table public.upgrade_intents enable row level security;

-- Owner-only insert/select keeps a user's intent to themselves; admins audit.
-- The tier column is set server-side by the action (default 'pro') and is never
-- supplied by the client, so it cannot be tampered into a different plan.
create policy "upgrade_intents are insertable by the owner"
  on public.upgrade_intents for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "upgrade_intents are readable by the owner"
  on public.upgrade_intents for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "upgrade_intents are readable by admins"
  on public.upgrade_intents for select
  to authenticated
  using (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on table public.upgrade_intents to authenticated;