-- Private 'resumes' storage bucket + owner-only access policies.
-- Run in the Supabase SQL editor.
--
-- The resume route uploads to `resumes/{user_id}/resume.{ext}`. The bucket MUST
-- be private (no public URL) and each user may only touch their own folder.

-- Ensure the bucket exists and is private.
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do update set public = false;

-- Owner-only object access: the first path segment must equal the caller's uid.
drop policy if exists resumes_owner_read   on storage.objects;
drop policy if exists resumes_owner_insert on storage.objects;
drop policy if exists resumes_owner_update on storage.objects;
drop policy if exists resumes_owner_delete on storage.objects;

create policy resumes_owner_read on storage.objects
  for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy resumes_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy resumes_owner_update on storage.objects
  for update to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy resumes_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
