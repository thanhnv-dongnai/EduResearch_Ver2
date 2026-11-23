-- Thêm cột "location" (tỉnh/thành phố) vào app_settings, dùng cho dòng
-- "<Nơi>, ngày ..." ở chữ ký cuối các báo cáo xuất — thay vì hardcode "Hà Nội".
alter table public.app_settings add column location text not null default '';
