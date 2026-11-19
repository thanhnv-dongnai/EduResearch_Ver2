-- Fix from Task 11 review: profiles had no email column, so the Users
-- page's "getAll()" (which only selects from profiles) could never show
-- email for any pre-existing account. auth.users holds email but isn't
-- queryable via PostgREST for regular users, so we mirror it onto profiles.

alter table public.profiles add column email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, unit, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'unit',
    'viewer',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;
