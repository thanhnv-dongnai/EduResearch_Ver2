-- Link rút gọn cho khảo sát công khai: thay vì chia sẻ URL dài chứa UUID
-- (/survey/<uuid>), tạo mã ngắn 6 ký tự (/s/<code>) để dễ đọc/gõ tay hơn
-- khi không quét được QR.
create table public.short_links (
  code text primary key,
  survey_id uuid not null references public.surveys(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index short_links_survey_id_idx on public.short_links (survey_id);

alter table public.short_links enable row level security;

-- Ai cũng đọc được (trang /s/<code> là public, phục vụ cả người trả lời ẩn danh).
create policy "short_links_select_anyone" on public.short_links
  for select using (true);

-- Chỉ admin/researcher mới tạo được link rút gọn (khớp quyền tạo/sửa khảo sát).
create policy "short_links_insert_researcher_or_admin" on public.short_links
  for insert with check (public.current_role() in ('admin', 'researcher'));
