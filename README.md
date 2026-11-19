# EduResearch-Supabase

Bản clone EduResearch (khảo sát giáo dục đại học, chuẩn APA 7) chạy hoàn toàn
trên Supabase (Postgres + Auth + Storage + 2 Edge Function nhỏ cho quản trị
người dùng) — không có server Node riêng.

## Chạy thử

1. Tạo file `.env.local` với `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`
   (xem `.env.example`).
2. `npm install`
3. `npm run dev` → mở `http://localhost:5173`
4. Tài khoản admin: tự đăng ký ở `/register`, rồi chạy SQL
   `UPDATE profiles SET role='admin' WHERE id='<uuid>';` trong Supabase SQL
   Editor để trở thành Super Admin (xem spec, Phần 4). (Một tài khoản admin
   test đã tồn tại trên project — xem Supabase Dashboard > Authentication
   để biết email, không ghi mật khẩu vào README.)

## Khảo sát đã seed sẵn

"Phân tích và dự đoán xu hướng chuyển đổi của giáo dục đại học dựa trên các
yếu tố lợi thế cạnh tranh" (bộ câu hỏi Ban Giám hiệu & Hội đồng trường,
6 biến STR/LEA/CAP/RES/SER/REA, 14 câu hỏi, 4 giả thuyết SEM) kèm 100 phản
hồi mẫu sinh sẵn (chạy `scripts/seed-responses.mjs` nếu cần seed lại — cần
`.env.seed` với service role key, xem `.env.seed.example`).

## Supabase project

Project được tạo và migrate qua Supabase MCP tool (không qua CLI) — xem
`supabase/README.md` để biết chi tiết và cách link CLI lại nếu cần.
2 Edge Function `admin-create-user`/`admin-delete-user` (giữ service role
key an toàn phía server) đã được deploy; code nguồn ở
`supabase/functions/`.

## Thiết kế & kế hoạch

- Spec: `docs/superpowers/specs/2026-11-19-eduresearch-supabase-clone-design.md`
  (trong repo `eduresearch-main`)
- Plan: `docs/superpowers/plans/2026-11-19-eduresearch-supabase.md`
  (trong repo `eduresearch-main`)

## Kiểm tra đã thực hiện (Subagent-Driven Development)

Cả 12 task của plan đã hoàn tất, mỗi task được implement bởi 1 subagent
riêng, review bởi 1 reviewer riêng, và với các phần cần trình duyệt thật
(đăng ký/đăng nhập, upload tài liệu, xuất Word, quản lý người dùng qua Edge
Function) đã được controller verify trực tiếp bằng browser thật, bao gồm:

- Đăng ký → đăng nhập → đổi hồ sơ (tài khoản thật qua Supabase Auth).
- CRUD khảo sát, nhân bản, chia sẻ QR.
- Nộp khảo sát ẩn danh (RLS anon insert).
- Quản lý phản hồi, thao tác hàng loạt, import CSV.
- Pipeline phân tích 5 khâu APA7 (Cronbach's Alpha, EFA/KMO, Pearson, SEM,
  định tính) trên 100 phản hồi thật + xuất báo cáo Word.
- Bản đồ phân cụm (K-Means).
- Upload/xóa tài liệu qua Supabase Storage, Dashboard KPI.
- Quản trị người dùng qua Edge Function (tạo/đổi quyền/xóa tài khoản),
  khóa quyền viewer đúng thiết kế.

Một số lỗi thật được phát hiện và sửa trong quá trình verify (không chỉ
đọc code): RLS chặn `.select()` sau insert ẩn danh (Task 6), thiếu CHECK
constraint + search_path (Task 2), CORS thiếu trên Edge Function (Task 11),
thiếu cột `email` trên `profiles` (Task 11) — tất cả đã có migration/fix
tương ứng trong `supabase/migrations/`.
