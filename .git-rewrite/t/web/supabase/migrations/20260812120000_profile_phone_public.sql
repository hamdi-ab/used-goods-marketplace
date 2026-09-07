-- T03 - User & seller profiles
-- Extends profiles with a phone public-opt-in flag and a public-readable view of
-- the profile surface (DB spec §6, §20; Security §18/19: phone is private by default
-- and only surfaced when the owner consents).
--
-- Privacy note: RLS row policies control WHICH rows a caller sees, not which
-- columns. Phone is therefore never selected in a public query unless the row's
-- phone_public flag is true (see app/users/[id]/page.tsx). Public column exposure
-- is enforced at the data-access layer.

-- Public-opt-in for phone visibility.
alter table public.profiles add column if not exists phone_public boolean not null default false;

-- Public profiles are readable (rows) by anyone. Postgres has no column-level
-- RLS, so phone exposure is gated at the data-access layer (Privacy §18/19):
-- fetchPublicProfile in lib/profiles.ts selects phone only when the owner's
-- phone_public flag is set; public queries never include the column.
create policy "Profiles are publicly readable"
  on public.profiles for select
  to authenticated, anon
  using (true);

-- Keep the existing owner/admin policies (they remain in force; row policies are
-- additive). No changes to insert/update/delete policies here — owners still
-- edit only their own row via the previous policies.

-- Avatar storage bucket for profile pictures (public read, owner write).
-- 5 MB per file (Security §11). Idempotent so it is safe across db reset.
insert into storage.buckets (id, name, public, file_size_limit)
values ('profiles', 'profiles', true, 5242880)
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit;

-- Allow any reader to resolve public avatar URLs (public bucket reads are
-- served without RLS checks at /storage/v1/object/public/profiles/...).
create policy "Profile avatars are publicly readable"
  on storage.objects for select
  to authenticated, anon
  using (bucket_id = 'profiles');

-- Owners may manage their own avatar objects only (path prefix avatars/{uid}).
create policy "Profile avatars are writable by the owner"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'profiles'
    and (storage.foldername(name))[0] = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profiles'
    and (storage.foldername(name))[0] = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
