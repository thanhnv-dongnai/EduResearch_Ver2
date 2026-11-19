insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

create policy "documents_bucket_select_signed_in" on storage.objects
  for select using (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "documents_bucket_insert_researcher_or_admin" on storage.objects
  for insert with check (bucket_id = 'documents' and public.current_role() in ('admin', 'researcher'));

create policy "documents_bucket_delete_researcher_or_admin" on storage.objects
  for delete using (bucket_id = 'documents' and public.current_role() in ('admin', 'researcher'));
