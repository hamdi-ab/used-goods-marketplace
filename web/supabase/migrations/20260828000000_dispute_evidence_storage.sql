-- Dispute evidence storage bucket and policies for image uploads

-- Create bucket for dispute evidence (public read for admin review)
insert into storage.buckets (id, name, public)
values ('dispute_evidence', 'dispute_evidence', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload evidence to their dispute's folder
create policy "Users can upload dispute evidence"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'dispute_evidence'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to delete their own evidence
create policy "Users can delete their own dispute evidence"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'dispute_evidence'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public read access (admins review via signed URLs or public)
create policy "Public can read dispute evidence"
on storage.objects for select
to public
using (bucket_id = 'dispute_evidence');
