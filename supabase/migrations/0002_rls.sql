alter table public.profiles enable row level security;
alter table public.surveys enable row level security;
alter table public.responses enable row level security;
alter table public.documents enable row level security;

-- Helper: current user's role, '' if not signed in or no profile row yet
create or replace function public.current_role()
returns text as $$
  select coalesce((select role from public.profiles where id = auth.uid()), '');
$$ language sql stable security definer set search_path = public;

-- profiles
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.current_role() = 'admin');

create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.current_role() = 'admin');

-- surveys
create policy "surveys_select_own_admin_or_public_active" on public.surveys
  for select using (
    public.current_role() in ('admin', 'researcher')
    or status = 'Active'
  );

create policy "surveys_insert_researcher_or_admin" on public.surveys
  for insert with check (public.current_role() in ('admin', 'researcher'));

create policy "surveys_update_researcher_or_admin" on public.surveys
  for update using (public.current_role() in ('admin', 'researcher'));

create policy "surveys_delete_researcher_or_admin" on public.surveys
  for delete using (public.current_role() in ('admin', 'researcher'));

-- responses
create policy "responses_insert_anyone" on public.responses
  for insert with check (true);

create policy "responses_select_researcher_or_admin" on public.responses
  for select using (public.current_role() in ('admin', 'researcher'));

create policy "responses_update_researcher_or_admin" on public.responses
  for update using (public.current_role() in ('admin', 'researcher'));

create policy "responses_delete_researcher_or_admin" on public.responses
  for delete using (public.current_role() in ('admin', 'researcher'));

-- documents
create policy "documents_select_signed_in" on public.documents
  for select using (auth.role() = 'authenticated');

create policy "documents_insert_researcher_or_admin" on public.documents
  for insert with check (public.current_role() in ('admin', 'researcher'));

create policy "documents_delete_researcher_or_admin" on public.documents
  for delete using (public.current_role() in ('admin', 'researcher'));
