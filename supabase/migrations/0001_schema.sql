create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text not null default 'viewer' check (role in ('admin', 'researcher', 'viewer')),
  unit text,
  academic_title text,
  created_at timestamptz not null default now()
);

create table public.surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text default '',
  institution text default 'Cơ sở giáo dục đại học',
  audience text,
  status text not null default 'Draft' check (status in ('Draft', 'Active', 'Closed')),
  scale text not null default 'Likert 5',
  target integer not null default 100,
  variables jsonb not null default '[]'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  hypotheses jsonb not null default '[]'::jsonb,
  questions_count integer not null default 0,
  responses_count integer not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  role text not null default 'Người tham gia',
  unit text not null default 'Khoa / Đơn vị',
  institution text not null default 'Cơ sở giáo dục đại học',
  gender text not null default 'Không nêu',
  time_taken text not null default '3p 0s',
  status text not null default 'valid' check (status in ('valid', 'invalid')),
  answers jsonb not null default '{}'::jsonb,
  date text not null default to_char(now(), 'DD/MM/YYYY'),
  submitted_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'Tham khảo',
  size text not null default '0 MB',
  color text not null default '#3B82F6',
  bg text not null default '#EFF6FF',
  date text not null default to_char(now(), 'DD/MM/YYYY'),
  file_path text,
  original_name text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Keep surveys.responses_count in sync automatically
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
$$ language plpgsql security definer;

create trigger trg_responses_count
after insert or delete on public.responses
for each row execute function public.bump_responses_count();

-- Auto-create a profile row (always role='viewer') when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, unit, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'unit',
    'viewer'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_handle_new_user
after insert on auth.users
for each row execute function public.handle_new_user();
