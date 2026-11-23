-- Cấu hình thông tin trường/cơ sở đào tạo + quản lý năm học khảo sát.
-- Đồng thời vá lỗ hổng RLS: profiles cho phép tự sửa email/role của chính
-- mình (do "update_own_or_admin" chỉ kiểm tra id, không giới hạn cột) —
-- giờ chỉ admin mới được đổi role/email qua bảng profiles.

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.current_role() = 'admin')
  with check (
    public.current_role() = 'admin'
    or (
      id = auth.uid()
      and role = (select p2.role from public.profiles p2 where p2.id = auth.uid())
      and email is not distinct from (select p2.email from public.profiles p2 where p2.id = auth.uid())
    )
  );

-- app_settings: 1 dòng duy nhất chứa tên trường/cơ sở đào tạo + hiệu trưởng,
-- dùng làm tiêu đề cho các báo cáo xuất và hiển thị trên Topbar.
create table public.app_settings (
  id boolean primary key default true,
  institution_name text not null default 'Trường Đại học',
  principal_name text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint app_settings_singleton check (id)
);

insert into public.app_settings (id, institution_name, principal_name) values (true, 'Trường Đại học', '');

alter table public.app_settings enable row level security;
create policy "app_settings_select_anyone" on public.app_settings for select using (true);
create policy "app_settings_update_admin" on public.app_settings for update using (public.current_role() = 'admin');

-- academic_years: danh sách năm học; mọi khảo sát đi theo 1 năm học.
create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index academic_years_one_current on public.academic_years (is_current) where is_current;

insert into public.academic_years (label, is_current) values ('2026 - 2027', true);

alter table public.academic_years enable row level security;
create policy "academic_years_select_anyone" on public.academic_years for select using (true);
create policy "academic_years_write_admin" on public.academic_years
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- surveys.academic_year_id: gắn mỗi khảo sát với 1 năm học; khảo sát cũ
-- được gán vào năm học hiện tại.
alter table public.surveys add column academic_year_id uuid references public.academic_years(id);
update public.surveys set academic_year_id = (select id from public.academic_years where is_current limit 1)
  where academic_year_id is null;
