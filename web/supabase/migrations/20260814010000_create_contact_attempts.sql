-- T13 - Contact: Telegram/call buttons
-- contact_attempts: records each time a buyer initiates contact with a seller,
-- per docs/02-architecture/03-database-design-specification.md §20 (RLS) and
-- §22 (migration naming). The contact method and listing context are captured
-- so the admin queue and trust-score RPC can audit contact-driven traffic.
--
-- Phone privacy is enforced at the data-access layer: the app fetches phone
-- only when the owner opted in (see the T03 migration 20260812120000
-- profile_phone_public.sql and lib/profiles.ts fetchPublicProfile /
-- lib/contact.ts fetchSellerContactInfo). Postgres row policies do not
-- restrict columns, so phone is never selected in a public query unless
-- phone_public is set. (Security spec §19: phone is private by default.)

create type public.contact_method as enum ('telegram', 'phone');

create table if not exists public.contact_attempts (
  id uuid primary key default gen_random_uuid(),
  contact_method public.contact_method not null,
  listing_id uuid references public.listings (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists contact_attempts_seller_id_idx on public.contact_attempts (seller_id);
create index if not exists contact_attempts_listing_id_idx on public.contact_attempts (listing_id);
create index if not exists contact_attempts_method_idx on public.contact_attempts (contact_method);
create index if not exists contact_attempts_created_at_idx on public.contact_attempts (created_at);

------------------------------------------------------------------------------
-- RLS: a user can read their own contact attempts (as buyer-side initiator
-- context is implicit); admins can read all for moderation/audit. The table
-- is insertable by any authenticated user — recording a contact attempt is
-- an audit log, not a privilege.
------------------------------------------------------------------------------
alter table public.contact_attempts enable row level security;

-- Any authenticated user may record a contact attempt (audit log).
-- RLS still scopes what they can read back.
create policy "Contact attempts are insertable by everyone"
  on public.contact_attempts for insert
  to authenticated
  with check (auth.uid() is not null);

-- Only the attempt's own target relationship is visible — for now, admins
-- have full read access and no per-user read policy is needed beyond admin.
-- (Buyer read-back of "my contact attempts" is a future enhancement.)
create policy "Contact attempts are readable by admins"
  on public.contact_attempts for select
  to authenticated
  using (public.is_admin());

create policy "Contact attempts are manageable by admins"
  on public.contact_attempts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select, insert on public.contact_attempts to authenticated;
