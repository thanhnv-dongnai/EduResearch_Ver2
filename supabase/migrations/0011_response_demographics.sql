-- Khôi phục tính năng nhân khẩu học phân hóa theo từng Bộ câu hỏi (đã có ở
-- dự án gốc nhưng bị rơi mất khi port sang Supabase): mỗi Bộ 1/2/3/4 có câu
-- hỏi INFO_POSITION (-> role, đã có cột) và 1 câu hỏi phụ khác nhau
-- (Thâm niên / Trình độ / Khối ngành) lưu vào cột riêng để dễ lọc/thống kê.
alter table public.responses add column tenure text;
alter table public.responses add column education text;
alter table public.responses add column major text;
