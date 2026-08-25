-- Fix: avatar upload fails with "new row violates row-level security policy"
-- The profiles storage bucket needs INSERT/UPDATE policies so users can upload their own avatars.

-- Ensure bucket exists (idempotent)
insert into storage.buckets (id, name, public)
values ('profiles', 'profiles', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own avatar folder
-- Path format: avatars/{uid}/{timestamp}.{ext}
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profiles'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to update their own avatar
create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profiles'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatar
create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profiles'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public read access (bucket is public)
create policy "Public can read avatars"
on storage.objects for select
to public
using (bucket_id = 'profiles');
