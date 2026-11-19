-- Fix: scope surveys UPDATE/DELETE RLS policies to the owning researcher.
-- Previously ANY researcher could update/delete ANY survey because the
-- policy only checked public.current_role() in ('admin', 'researcher').
-- Per spec section 3: INSERT/UPDATE/DELETE chi admin/researcher da dang
-- nhap, tren khao sat cua minh (admin khong gioi han).

drop policy if exists "surveys_update_researcher_or_admin" on public.surveys;
create policy "surveys_update_researcher_or_admin" on public.surveys
  for update using (
    public.current_role() = 'admin'
    or (public.current_role() = 'researcher' and created_by = auth.uid())
  );

drop policy if exists "surveys_delete_researcher_or_admin" on public.surveys;
create policy "surveys_delete_researcher_or_admin" on public.surveys
  for delete using (
    public.current_role() = 'admin'
    or (public.current_role() = 'researcher' and created_by = auth.uid())
  );
