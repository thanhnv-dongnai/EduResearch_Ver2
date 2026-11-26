# Thiết kế: Dự án "EduResearch trên Supabase"

- Ngày: 2026-11-19
- Trạng thái: Đã duyệt từng phần qua brainstorming, chờ người dùng review bản spec này
- Dự án tham chiếu: `eduresearch-main/eduresearch-main` 

## 1. Mục tiêu & phạm vi

Xây dựng một dự án EduResearch mới (khảo sát giáo dục đại học, chuẩn APA 7), giữ
nguyên lĩnh vực (giáo dục đại học) với đề tài **"Phân tích và dự đoán xu hướng
chuyển đổi của giáo dục đại học dựa trên các yếu tố lợi thế cạnh tranh"**. Bộ
câu hỏi/biến nghiên cứu cho đề tài này **được seed sẵn trong migration**, tái sử
dụng gần như nguyên vẹn bộ câu hỏi `bghQuestions` (6 biến: STR - Chiến lược, LEA -
Lãnh đạo số, CAP - Năng lực thích ứng tổ chức, RES - Phân bổ nguồn lực, SER - Lợi
thế cạnh tranh/uy tín, REA - Mức độ sẵn sàng thích ứng) hiện có trong
`backend/data/questionnaires.js` của bản gốc. Người dùng vẫn có thể tạo thêm
khảo sát khác qua giao diện sau khi hệ thống chạy.

Thay đổi cốt lõi so với bản gốc: giữ nguyên **frontend (React 19 + Vite)**, thay
backend bằng **Supabase** (Postgres + Auth + Storage) — frontend gọi trực tiếp
Supabase SDK, không còn server Node riêng.

Ngoài phạm vi (không làm ở giai đoạn này):
- Không seed thêm khảo sát/đề tài nào khác ngoài đề tài nêu trên.
- Không làm E2E/integration test tự động ngay từ đầu.
- Không triển khai production/CI-CD — chỉ thiết kế để chạy dev + deploy thủ công sau.

## 2. Kiến trúc tổng thể

```
┌─────────────────────────────────────────┐
│  Frontend: React 19 + Vite (SPA)         │
│  - React Router, Recharts, lucide-react  │
│  - qrcode (QR), xlsx (import/export)     │
│  - @supabase/supabase-js (client SDK)    │
│  - statisticsEngine (module JS thuần,    │
│    chạy trong browser)                   │
│  - Xuất Word APA7: Blob + HTML giả MSWord│
│    (client-side, không cần lib ngoài)    │
└───────────────┬───────────────────────────┘
                │  REST/Realtime qua supabase-js
┌───────────────▼───────────────────────────┐
│  Supabase project                          │
│  - Postgres: profiles, surveys, responses, │
│    documents                               │
│  - Auth (email/password, JWT built-in)     │
│  - Storage (bucket "documents")            │
│  - Row Level Security (RLS) theo role      │
└─────────────────────────────────────────────┘
```

Không còn: Express server, controllers/routes/middlewares Node, SQLite,
JWT/bcrypt tự viết, `multer` (upload file qua server).

**Ngoại lệ nhỏ (đã quyết định khi rà chi tiết):** tính năng "Admin tạo tài khoản
người dùng mới trực tiếp" (`Users.jsx`) cần gọi Supabase Admin API
(`auth.admin.createUser`/`deleteUser`), API này yêu cầu **service role key** —
không thể đặt trong code frontend vì lộ key sẽ mất toàn quyền hệ thống. Giải
pháp: 2 **Supabase Edge Function** nhỏ (`admin-create-user`, `admin-delete-user`)
giữ service role key an toàn phía server-side của Supabase (không phải server
Node riêng — vẫn đúng tinh thần "không dựng backend Node").

## 3. Mô hình dữ liệu (Postgres / Supabase)

### `profiles` (1-1 với `auth.users`)
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid (PK, FK → auth.users.id) | |
| name | text | |
| role | text | `admin` \| `researcher` \| `viewer`, default `viewer` |
| unit | text | Đơn vị công tác |
| academic_title | text | Học hàm/học vị |
| created_at | timestamptz | default now() |

Trigger `handle_new_user` trên `auth.users` (AFTER INSERT) tự tạo row `profiles`
với `role = 'viewer'`.

### `surveys`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid (PK) | default gen_random_uuid() |
| title, subtitle, institution, audience | text | |
| status | text | **`Draft` \| `Active` \| `Closed`** (đúng giá trị literal frontend đang dùng — không phải `draft/open/closed`) |
| scale | text | ví dụ `Likert 5` \| `Likert 7` (đúng chuỗi frontend dùng) |
| target | int | cỡ mẫu kỳ vọng N |
| variables | jsonb | danh sách biến tiềm ẩn, dạng mảng string (không phải chuỗi comma như SQLite cũ) |
| questions | jsonb | mảng câu hỏi |
| hypotheses | jsonb | giả thuyết SEM |
| responses_count | int | cập nhật qua trigger khi insert/delete response |
| created_by | uuid (FK → profiles.id) | |
| created_at | timestamptz | default now() |

### `responses`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid (PK) | default gen_random_uuid() |
| survey_id | uuid (FK → surveys.id, on delete cascade) | |
| role, unit, institution, gender | text | biến nhân khẩu học |
| time_taken | text | **chuỗi định dạng "Xp Ys" hoặc "X phút"** (đúng format frontend dùng để hiển thị — không phải số giây nguyên; `statisticsEngine.parseTimeTakenSeconds` tự parse chuỗi này khi tính speeders) |
| status | text | **`valid` \| `invalid`** (đúng 2 giá trị frontend dùng — không phải `excluded/flagged`), default `valid` |
| answers | jsonb | câu trả lời Likert + tự luận |
| date | text | chuỗi "D/M/YYYY" format sẵn, tạo tại thời điểm insert — giữ để tương thích hiển thị trực tiếp như bản gốc |
| submitted_at | timestamptz | default now() — dùng cho sắp xếp/metadata, không hiển thị trực tiếp |

### `documents`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | uuid (PK) | default gen_random_uuid() |
| title, type | text | |
| file_path | text | path trong bucket Storage `documents` |
| size | bigint | |
| uploaded_by | uuid (FK → profiles.id) | |
| created_at | timestamptz | default now() |

### Row Level Security (lớp bảo mật chính, bắt buộc — không có server trung gian kiểm tra quyền)
- `profiles`: user đọc/sửa row của chính mình; `admin` đọc/sửa tất cả.
- `surveys`:
  - `SELECT`: `admin`/`researcher` đã đăng nhập xem khảo sát của mình (admin xem tất cả); **anon được `SELECT` khi `status = 'Active'`** (phục vụ trang điền khảo sát public).
  - `INSERT`/`UPDATE`/`DELETE`: chỉ `admin`/`researcher` đã đăng nhập, trên khảo sát của mình (admin không giới hạn).
- `responses`:
  - **`INSERT`: cho phép `anon`** (ai cũng điền khảo sát public được, không cần đăng nhập).
  - `SELECT`/`UPDATE`/`DELETE`: chỉ `admin`/`researcher` đã đăng nhập.
- `documents`:
  - `SELECT`: user đã đăng nhập (mọi role).
  - `INSERT`/`DELETE`: chỉ `admin`/`researcher`.

## 4. Xác thực & phân quyền

- Đăng ký/đăng nhập/quên mật khẩu dùng `supabase.auth.signUp / signInWithPassword / resetPasswordForEmail` — bỏ hoàn toàn JWT/bcrypt tự viết.
- `AuthContext.jsx` dùng `supabase.auth.onAuthStateChange()` + `getSession()`; sau khi có session, query thêm `profiles` để lấy `role`.
- Vai trò giữ nguyên 3 cấp: `admin` (Super Admin), `researcher`, `viewer` — kiểm soát ở **2 lớp**: ẩn UI theo role (như cũ) + RLS Postgres chặn thật (lớp quyết định).
- Tài khoản admin đầu tiên: đăng ký bình thường (role mặc định `viewer`), sau đó chạy 1 câu lệnh SQL thủ công (qua Supabase SQL Editor) để `UPDATE profiles SET role = 'admin' WHERE id = '<uuid>'`. Không làm script/Edge Function tự động cho việc này vì chỉ cần làm 1 lần lúc setup.

## 5. Port Statistics Engine & Xuất báo cáo APA 7

- `backend/services/statisticsEngine.js` (1274 dòng, thuần hàm toán học, không phụ thuộc Node API) → copy sang `src/lib/statisticsEngine.js`, đổi `module.exports` thành `export`. **Không sửa logic toán học.**
- Các hàm giữ nguyên signature: `runSmartDataCleaning`, `runReliabilityAndValidity`, `runDescriptivePearsonAndProfiling`, `runSEMAndMachineLearning`, `runQualitativeTextAnalytics`, `runCompleteAcademicPipeline`.
- Trang `Analytics.jsx`: tự fetch `surveys` + `responses` theo `survey_id` qua Supabase SDK, gọi `runCompleteAcademicPipeline(survey, responses, options)` ngay trong component (thay cho gọi `GET /api/analysis/:id`).
- `backend/services/seedResponsesService.js` (sinh dữ liệu mẫu) → port thành hàm JS insert theo batch vào Supabase (`supabase.from('responses').insert([...])`).
- Xuất Word APA7: hàm `handleExportAPAReport` trong `Analytics.jsx` (bản gốc) **đã là client-side 100%** — build HTML giả định dạng Word, tạo Blob, trigger download `.doc`. Giữ nguyên logic, chỉ chỉnh tên field nếu đổi quy ước cột khi viết code thật (ví dụ `survey_id` giữ snake_case theo Postgres).

## 6. Các module nghiệp vụ khác

| Module | Thay đổi so với bản gốc |
|---|---|
| Khảo sát & QR (`Surveys.jsx`) | CRUD/nhân bản qua `supabase.from('surveys')`; QR (`qrcode` lib) không đổi |
| Điền khảo sát public (`PublicSurvey.jsx`) | Fetch khảo sát `open` + insert response bằng anon key, theo RLS Phần 3 |
| Thu thập & làm sạch (`Responses.jsx`) | Thao tác hàng loạt qua `.update()/.delete().in('id', [...])`; import/export Excel/CSV chuyển hẳn sang xử lý client-side (đọc/ghi file bằng lib `xlsx` trong browser, không qua `multer`/server) |
| Tài liệu (`Documents.jsx`) | **Module duy nhất đổi hạ tầng lưu trữ thật**: chuyển từ lưu file trên đĩa server sang Supabase Storage bucket `documents` |
| Dashboard (`dashboardController.js` → query trực tiếp) | Số liệu tổng hợp qua Supabase query/`count`, hoặc Postgres view/RPC nếu cần gộp nhiều bảng |
| Quản lý người dùng (`Users.jsx`) | Xem/đổi role/xóa: query/update `profiles` (RLS chỉ admin); **tạo tài khoản mới**: gọi Edge Function `admin-create-user` (giữ service role key an toàn, xem Phần 2) |
| Hồ sơ cá nhân (`Profile.jsx`) | Đổi mật khẩu qua `supabase.auth.updateUser()`; cập nhật thông tin qua update `profiles` |

Ước tính: ~90% UI/component giữ nguyên; thay đổi chủ yếu ở lớp `src/services/`
(gọi Supabase thay Express) và module Documents (chuyển sang Storage thật).

## 7. Cấu trúc project

```
<ten-du-an-moi>/
├── index.html, vite.config.js, package.json
├── .env.local                    # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── supabase/
│   ├── migrations/*.sql          # schema + RLS, quản lý qua Supabase CLI
│   └── seed.sql                  # (tuỳ chọn) ghi chú bước nâng quyền admin đầu
├── src/
│   ├── lib/
│   │   ├── supabaseClient.js     # khởi tạo supabase-js 1 lần
│   │   └── statisticsEngine.js   # port từ backend/services/statisticsEngine.js
│   ├── services/                 # surveyService.js, responseService.js, documentService.js, authService.js...
│   ├── context/AuthContext.jsx
│   ├── layouts/, components/, pages/   # giữ cấu trúc như bản gốc
├── README.md
```

Không có thư mục `backend/`.

## 8. Testing

- Unit test cho `src/lib/statisticsEngine.js` bằng Vitest — ưu tiên cao nhất vì sai
  số liệu thống kê là rủi ro lớn nhất của hệ thống (vd. kiểm Cronbach's Alpha,
  Pearson r với bộ số liệu mẫu đã biết kết quả tay).
- Không làm E2E/integration test ở giai đoạn khởi tạo — bổ sung sau khi có khảo sát
  thật chạy thử, tránh over-engineering sớm.

## 9. Kế hoạch khởi tạo (thực hiện ở bước implementation, không nằm trong spec này)

1. Tạo Supabase project mới.
2. Chạy migration tạo 4 bảng + RLS (Phần 3).
3. Seed 1 khảo sát mẫu theo đề tài "Phân tích và dự đoán xu hướng chuyển đổi của
   giáo dục đại học dựa trên các yếu tố lợi thế cạnh tranh" — port nguyên bộ câu
   hỏi `bghQuestions` (STR/LEA/CAP/RES/SER/REA) từ
   `backend/data/questionnaires.js` sang `jsonb` trong migration/seed SQL.
4. `npm create vite@latest <ten-du-an> -- --template react`; cài
   `@supabase/supabase-js`, `qrcode`, `recharts`, `lucide-react`,
   `react-router-dom`, `clsx`, `xlsx`.
5. Port theo thứ tự ưu tiên: Auth → Surveys (CRUD cơ bản) → PublicSurvey
   (thu thập) → Responses (làm sạch) → Analytics (engine + export) →
   Documents/Dashboard/Users/Profile.

## 10. Quyết định đã chốt (bổ sung khi lập implementation plan)

- Tên dự án/thư mục: **`eduresearch-supabase`**, tạo tại
  `D:\Thanh\Hoc CNTT\Cao hoc CNTT\Luan van Ths\Edu Research\eduresearch-supabase`
  (cùng cấp với `eduresearch-main`).
- Seed ~100 phản hồi giả cho khảo sát mẫu (port từ `seedResponsesService.js` của
  bản gốc) để Analytics có dữ liệu test ngay sau khi dựng xong, không phải điền tay.
