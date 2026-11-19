-- Fixes from Task 2 review:
-- 1. surveys.scale had no CHECK enum constraint (status already had one).
-- 2. bump_responses_count() was SECURITY DEFINER without a pinned
--    search_path, unlike the other two SECURITY DEFINER functions in
--    0001_schema.sql/0002_rls.sql.

alter table public.surveys
  add constraint surveys_scale_check check (scale in ('Likert 5', 'Likert 7'));

create or replace function public.bump_responses_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.surveys set responses_count = responses_count + 1 where id = new.survey_id;
  elsif (tg_op = 'DELETE') then
    update public.surveys set responses_count = greatest(0, responses_count - 1) where id = old.survey_id;
  end if;
  return null;
end;
$$ language plpgsql security definer set search_path = public;
