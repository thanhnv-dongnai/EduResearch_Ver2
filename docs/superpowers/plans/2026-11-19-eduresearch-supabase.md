# Kế hoạch triển khai: EduResearch-Supabase

> **Dành cho các worker tự động:** CẦN DÙNG SUB-SKILL: Dùng superpowers:subagent-driven-development (khuyến nghị) hoặc superpowers:executing-plans để thực thi plan này theo từng task. Các bước dùng cú pháp checkbox (`- [ ]`) để theo dõi.

**Mục tiêu:** Xây dựng `eduresearch-supabase`, một dự án React+Vite mới clone
các tính năng khảo sát/thống kê/báo cáo của EduResearch nhưng thay backend
Express/SQLite bằng Supabase (Postgres + Auth + Storage + 2 Edge Function
nhỏ), seed sẵn khảo sát "Phân tích và dự đoán xu hướng chuyển đổi của giáo
dục đại học dựa trên các yếu tố lợi thế cạnh tranh" cùng ~100 phản hồi giả.

**Kiến trúc:** Frontend (React 19 + Vite) gọi trực tiếp Supabase qua
`@supabase/supabase-js` thông qua 1 module façade duy nhất `src/services/api.js`
xuất ra *đúng tên các object* (`authAPI`, `dashboardAPI`, `surveysAPI`,
`responsesAPI`, `documentsAPI`, `usersAPI`) mà `src/services/api.js` bản gốc
đã xuất — nhờ vậy mọi page component port từ dự án gốc được copy **giữ nguyên
từng byte** trừ 2 file có đúng 1 chỗ sửa mỗi file (`PublicSurvey.jsx`,
`Documents.jsx`). RLS trên Postgres là ranh giới bảo mật thật (không còn
server nào để kiểm tra quyền).

**Tech Stack:** React 19, Vite, React Router v7, Recharts, lucide-react,
qrcode, @supabase/supabase-js, Vitest (chỉ test đơn vị cho statistics
engine), Supabase CLI (migration + Edge Function, Deno/TypeScript).

**Spec:** [docs/superpowers/specs/2026-11-19-eduresearch-supabase-clone-design.md](../specs/2026-11-19-eduresearch-supabase-clone-design.md)

**Dự án nguồn tham chiếu (chỉ đọc, không sửa):**
`D:\Thanh\Hoc CNTT\Cao hoc CNTT\Luan van Ths\Edu Research\eduresearch-main\eduresearch-main`

**Thư mục gốc dự án mới:**
`D:\Thanh\Hoc CNTT\Cao hoc CNTT\Luan van Ths\Edu Research\eduresearch-supabase`

## Ràng buộc chung (áp dụng cho mọi task)

- Tên dự án/thư mục: `eduresearch-supabase`, tạo tại đường dẫn gốc nêu trên (spec §10).
- Stack frontend: React 19 + Vite, giữ nguyên như bản gốc (spec §2).
- Không có server Express/Node; không có SQLite (spec §2).
- RLS là ranh giới phân quyền duy nhất — mọi bảng phải có policy rõ ràng trước khi bất kỳ trang nào chạm vào bảng đó được nối dây (spec §3).
- Giá trị `surveys.status` chính xác là `Draft` | `Active` | `Closed` (viết hoa, đúng literal frontend đang dùng — KHÔNG phải `draft/open/closed`).
- Giá trị `surveys.scale` chính xác là `Likert 5` | `Likert 7` (đúng literal frontend đang dùng).
- Giá trị `responses.status` chính xác là `valid` | `invalid` (KHÔNG phải `excluded/flagged`).
- `responses.time_taken` là kiểu **text** định dạng như `"3p 15s"` hoặc `"12s"` (KHÔNG phải cột số nguyên) — `statisticsEngine.parseTimeTakenSeconds` tự parse chuỗi này.
- Tài khoản tự đăng ký mới luôn nhận `role = 'viewer'` phía server, bất kể client gửi field role gì (bảo mật — spec §4). Admin sẽ nâng quyền lên `researcher`/`admin` sau qua trang Users.
- Tính năng duy nhất không thể làm chỉ bằng RLS — admin tạo tài khoản người dùng trực tiếp — đi qua 2 Supabase Edge Function (`admin-create-user`, `admin-delete-user`) giữ service role key an toàn phía server; service role key tuyệt đối không được xuất hiện trong code frontend hay biến môi trường có tiền tố `VITE_` (spec §2, §6).
- Phần toán học (`statisticsEngine.js`) được port **không đổi 1 dòng logic** — đây là JS thuần, không phụ thuộc Node API (spec §5).
- Xuất báo cáo Word APA7 (`handleExportAPAReport` trong `Analytics.jsx`) đã là client-side 100% (Blob + HTML giả `.doc`) ở bản gốc — port nguyên vẹn, chỉ sửa tên field nếu cần.
- Chỉ seed đúng 1 khảo sát — bộ câu hỏi "leadership" (Ban Giám hiệu) từ `backend/data/questionnaires.js`, `OFFICIAL_SURVEYS[0]` — cùng ~100 phản hồi giả sinh sẵn (spec §9, §10).

---

## Task 1: Dựng khung dự án

**Files:**
- Tạo (qua `npm create vite`, giữ nguyên bản mặc định lúc này): `eduresearch-supabase/package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`
- Tạo: `.gitignore`, `.env.example`
- Sửa: `src/App.css`, `src/index.css` (ghi đè bằng nội dung của bản gốc)
- Tạo (copy nguyên văn từ dự án gốc, không sửa gì): `src/layouts/AuthLayout.jsx`, `src/layouts/DashboardLayout.jsx`, `src/layouts/PublicLayout.jsx`, `src/components/GaugeMeter.jsx`, `src/components/Sidebar.jsx`, `src/components/Toast.jsx`

**Interfaces:**
- Đầu ra: dev server Vite chạy được tại `http://localhost:5173`, hiển thị template Vite+React mặc định (`main.jsx`/`App.jsx` sẽ bị ghi đè bằng app thật ở Task 4, khi đó `AuthContext.jsx` đã tồn tại để `main.jsx` import).

- [ ] **Bước 1: Dựng project Vite React**

```bash
cd "D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research"
npm create vite@latest eduresearch-supabase -- --template react
cd eduresearch-supabase
npm install
npm install react-router-dom@^7 recharts@^3 lucide-react@^1 qrcode@^1 clsx@^2 @supabase/supabase-js
npm install -D vitest
```

- [ ] **Bước 2: Copy tài nguyên tĩnh và CSS chung từ dự án gốc, giữ nguyên**

```bash
SRC="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-main/eduresearch-main"
DST="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-supabase"
cp "$SRC/src/App.css" "$DST/src/App.css"
cp "$SRC/src/index.css" "$DST/src/index.css"
cp "$SRC/src/assets/hero.png" "$DST/src/assets/hero.png"
cp "$SRC/public/favicon.svg" "$DST/public/favicon.svg"
cp "$SRC/public/icons.svg" "$DST/public/icons.svg"
mkdir -p "$DST/src/layouts" "$DST/src/components"
cp "$SRC/src/layouts/AuthLayout.jsx" "$DST/src/layouts/AuthLayout.jsx"
cp "$SRC/src/layouts/DashboardLayout.jsx" "$DST/src/layouts/DashboardLayout.jsx"
cp "$SRC/src/layouts/PublicLayout.jsx" "$DST/src/layouts/PublicLayout.jsx"
cp "$SRC/src/components/GaugeMeter.jsx" "$DST/src/components/GaugeMeter.jsx"
cp "$SRC/src/components/Sidebar.jsx" "$DST/src/components/Sidebar.jsx"
cp "$SRC/src/components/Toast.jsx" "$DST/src/components/Toast.jsx"
```

**Chưa** copy `main.jsx` — bản gốc import `AuthContext.jsx`, file này chưa tồn
tại cho đến Task 4. Cứ để `src/main.jsx` do Vite tự sinh y như vậy.

- [ ] **Bước 3: Viết `.env.example` và `.gitignore`**

```
# eduresearch-supabase/.env.example
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

```
# eduresearch-supabase/.gitignore (thêm vào phần mặc định của Vite)
.env.local
supabase/.temp
```

- [ ] **Bước 4: Kiểm tra dev server chạy được**

Chạy: `npm run dev`
Kỳ vọng: Vite in ra 1 URL local (ví dụ `http://localhost:5173`), không lỗi
build. `App.jsx` lúc này vẫn còn nội dung template mặc định của Vite — việc
này bình thường, sẽ bị thay thế ở Task 4.

- [ ] **Bước 5: Commit**

```bash
cd "D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-supabase"
git init
git add -A
git commit -m "chore: scaffold eduresearch-supabase Vite project + copy static assets/layouts"
```

---

## Task 2: Dự án Supabase, schema, RLS, và migration seed dữ liệu

**Files:**
- Tạo: `eduresearch-supabase/supabase/migrations/0001_schema.sql`
- Tạo: `eduresearch-supabase/supabase/migrations/0002_rls.sql`
- Tạo: `eduresearch-supabase/supabase/migrations/0003_seed_survey.sql`

**Interfaces:**
- Đầu ra: các bảng `profiles`, `surveys`, `responses`, `documents` có RLS bật; 1 dòng khảo sát đã seed sẵn (bộ câu hỏi leadership/BGH).

- [ ] **Bước 1: Tạo dự án Supabase và link CLI local**

Tạo 1 dự án Supabase mới (qua dashboard Supabase, hoặc tool MCP Supabase có
sẵn trong session này) tên `eduresearch-supabase`. Ghi lại project ref và mật
khẩu database. Sau đó, từ thư mục dự án:

```bash
cd "D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-supabase"
npx supabase init
npx supabase link --project-ref <your-project-ref>
```

Copy URL và anon key của project (Project Settings → API) vào file
`.env.local` mới (không commit):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

- [ ] **Bước 2: Viết migration schema**

```sql
-- supabase/migrations/0001_schema.sql

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

-- Tự động đồng bộ surveys.responses_count
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

-- Tự tạo 1 dòng profile (luôn role='viewer') khi có user auth mới đăng ký
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
```

- [ ] **Bước 3: Viết migration RLS**

```sql
-- supabase/migrations/0002_rls.sql

alter table public.profiles enable row level security;
alter table public.surveys enable row level security;
alter table public.responses enable row level security;
alter table public.documents enable row level security;

-- Hàm hỗ trợ: role của user hiện tại, '' nếu chưa đăng nhập hoặc chưa có profile
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
```

- [ ] **Bước 4: Viết migration seed khảo sát** (bộ câu hỏi leadership/BGH, từ `backend/data/questionnaires.js` `OFFICIAL_SURVEYS[0]`)

```sql
-- supabase/migrations/0003_seed_survey.sql

insert into public.surveys (
  title, subtitle, institution, audience, status, scale, target,
  variables, questions, hypotheses, questions_count
) values (
  'Phân tích và dự đoán xu hướng chuyển đổi của giáo dục đại học dựa trên các yếu tố lợi thế cạnh tranh',
  'Đánh giá ở tầm vĩ mô: Thể chế, chiến lược, quản trị số, phân bổ nguồn lực và lợi thế cạnh tranh tổng thể',
  'Đơn vị khảo sát mẫu',
  'leadership',
  'Active',
  'Likert 5',
  50,
  '["STR", "LEA", "CAP", "RES", "SER", "REA"]'::jsonb,
  '[
    {"code":"INFO_POSITION","text":"Chức vụ / Vị trí công tác","variable":"INFO","type":"choice","section":"demographics","mapsTo":"role","options":["Chủ tịch / Phó Chủ tịch Hội đồng trường","Hiệu trưởng / Phó Hiệu trưởng","Thành viên Hội đồng trường / Đảng ủy viên"]},
    {"code":"INFO_TENURE","text":"Thâm niên quản lý ở cấp trường","variable":"INFO","type":"choice","section":"demographics","options":["Dưới 3 năm","Từ 3 – 5 năm","Từ 5 – 10 năm","Trên 10 năm"]},
    {"code":"STR1","text":"Nhà trường đã xây dựng chiến lược phát triển tổng thể, tích hợp rõ ràng các xu hướng số hóa và chuyển đổi giáo dục đại học.","variable":"STR","type":"likert","group":"1. Chiến lược & Thể chế vĩ mô (STR)"},
    {"code":"STR2","text":"Kế hoạch chiến lược của nhà trường được rà soát, định kỳ điều chỉnh linh hoạt theo sự biến động của môi trường giáo dục.","variable":"STR","type":"likert","group":"1. Chiến lược & Thể chế vĩ mô (STR)"},
    {"code":"LEA1","text":"Hội đồng trường / Ban Giám hiệu thể hiện tầm nhìn và năng lực lãnh đạo số mạnh mẽ trong chỉ đạo và điều hành.","variable":"LEA","type":"likert","group":"2. Năng lực Lãnh đạo số (LEA)"},
    {"code":"LEA2","text":"Nhà trường ban hành các cơ chế, thể chế quản trị linh hoạt, phân cấp mạnh mẽ cho các đơn vị để tạo sự chủ động.","variable":"LEA","type":"likert","group":"2. Năng lực Lãnh đạo số (LEA)"},
    {"code":"CAP1","text":"Cơ cấu tổ chức của nhà trường có khả năng tái cấu trúc và thích ứng nhanh trước các mô hình đào tạo mới.","variable":"CAP","type":"likert","group":"3. Năng lực Thích ứng Tổ chức (CAP)"},
    {"code":"RES1","text":"Việc phân bổ ngân sách, tài chính và hạ tầng CNTT được ưu tiên gắn liền với các mục tiêu chiến lược trọng điểm.","variable":"RES","type":"likert","group":"4. Phân bổ Nguồn lực & Đầu tư (RES)"},
    {"code":"RES2","text":"Nhà trường có chính sách thu hút, phát triển và giữ chân đội ngũ nhân sự chất lượng cao đáp ứng chuẩn mực mới.","variable":"RES","type":"likert","group":"4. Phân bổ Nguồn lực & Đầu tư (RES)"},
    {"code":"SER1","text":"Nhà trường duy trì được vị thế, uy tín và lợi thế cạnh tranh bền vững so với các cơ sở giáo dục đại học khác.","variable":"SER","type":"likert","group":"5. Lợi thế Cạnh tranh & Uy tín (SER)"},
    {"code":"REA1","text":"Toàn hệ thống nhà trường đã đạt được sự sẵn sàng cao về mọi mặt để thích ứng thành công với các xu hướng giáo dục mới.","variable":"REA","type":"likert","group":"6. Mức độ Sẵn sàng Thích ứng (REA)"},
    {"code":"REA2","text":"Nhà trường có khả năng dự báo và ứng phó hiệu quả trước các rủi ro, thách thức trong quá trình chuyển đổi tổ chức.","variable":"REA","type":"likert","group":"6. Mức độ Sẵn sàng Thích ứng (REA)"},
    {"code":"TXT_BARRIER_BGH","text":"Theo Ông/Bà, đâu là rào cản lớn nhất về mặt cơ chế, thể chế hoặc nguồn lực trong quá trình chuyển đổi của nhà trường?","variable":"QUALITATIVE","type":"textarea","placeholder":"Ý kiến về cơ chế, thể chế, phân bổ nguồn lực, văn hóa tổ chức..."},
    {"code":"TXT_SUGGESTION_BGH","text":"Ông/Bà có đề xuất định hướng chiến lược trọng tâm gì để gia tăng lợi thế cạnh tranh của nhà trường trong 3–5 năm tới?","variable":"QUALITATIVE","type":"textarea","placeholder":"Đề xuất định hướng chiến lược trọng tâm..."}
  ]'::jsonb,
  '[
    {"code":"H1","name":"STR ➔ REA","description":"Chiến lược phát triển (STR) tác động thuận chiều đến mức độ sẵn sàng chuyển đổi (REA)","independent":"STR","dependent":"REA","status":"pending"},
    {"code":"H2","name":"LEA ➔ REA","description":"Lãnh đạo số (LEA) tác động thuận chiều đến mức độ sẵn sàng chuyển đổi (REA)","independent":"LEA","dependent":"REA","status":"pending"},
    {"code":"H3","name":"CAP ➔ SER","description":"Năng lực thích ứng tổ chức (CAP) có tác động tích cực đến lợi thế cạnh tranh (SER)","independent":"CAP","dependent":"SER","status":"pending"},
    {"code":"H4","name":"RES ➔ REA","description":"Nguồn lực và ngân sách (RES) tác động thuận chiều đến sự sẵn sàng tổ chức (REA)","independent":"RES","dependent":"REA","status":"pending"}
  ]'::jsonb,
  14
);
```

- [ ] **Bước 5: Tạo bucket Storage cho documents**

Qua dashboard Supabase (Storage → New bucket), hoặc SQL:

```sql
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

create policy "documents_bucket_select_signed_in" on storage.objects
  for select using (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "documents_bucket_insert_researcher_or_admin" on storage.objects
  for insert with check (bucket_id = 'documents' and public.current_role() in ('admin', 'researcher'));

create policy "documents_bucket_delete_researcher_or_admin" on storage.objects
  for delete using (bucket_id = 'documents' and public.current_role() in ('admin', 'researcher'));
```

Lưu thành `supabase/migrations/0004_storage.sql`.

- [ ] **Bước 6: Apply migration và kiểm tra**

```bash
cd "D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-supabase"
npx supabase db push
```

Kỳ vọng: không lỗi. Sau đó vào Table Editor của dashboard Supabase, xác nhận
`surveys` có đúng 1 dòng tên "Phân tích và dự đoán xu hướng chuyển đổi của
giáo dục đại học dựa trên các yếu tố lợi thế cạnh tranh" với 14 phần tử trong
cột `questions`.

- [ ] **Bước 7: Commit**

```bash
git add supabase/migrations
git commit -m "feat: add Supabase schema, RLS policies, storage bucket, and seed survey"
```

---

## Task 3: Port statistics engine kèm unit test

**Files:**
- Tạo: `eduresearch-supabase/src/lib/statisticsEngine.js` (port từ `backend/services/statisticsEngine.js`)
- Tạo: `eduresearch-supabase/src/lib/statisticsEngine.test.js`
- Tạo: `eduresearch-supabase/vitest.config.js`

**Interfaces:**
- Đầu ra: `export { runSmartDataCleaning, runReliabilityAndValidity, runDescriptivePearsonAndProfiling, runSEMAndMachineLearning, runQualitativeTextAnalytics, runCompleteAcademicPipeline }` — đúng signature như module Node gốc.

- [ ] **Bước 1: Viết test fail trước cho Cronbach's Alpha trên 1 ví dụ đã biết kết quả**

```js
// src/lib/statisticsEngine.test.js
import { describe, it, expect } from 'vitest';
import { runReliabilityAndValidity } from './statisticsEngine';

describe('runReliabilityAndValidity', () => {
  it('computes a Cronbach alpha close to 1 for perfectly correlated items', () => {
    // 10 người trả lời 2 câu hỏi của biến "STR" luôn di chuyển cùng nhau
    const likertQuestions = [
      { code: 'STR1', variable: 'STR', type: 'likert' },
      { code: 'STR2', variable: 'STR', type: 'likert' }
    ];
    const cleanResponses = Array.from({ length: 10 }, (_, i) => {
      const score = (i % 5) + 1;
      return { parsedAnswers: { STR1: score, STR2: score } };
    });

    const result = runReliabilityAndValidity(cleanResponses, likertQuestions, ['STR']);
    const strAlpha = result.alphaByVariable?.STR?.alpha ?? result.reliabilityTable?.find(r => r.variable === 'STR')?.alpha;

    expect(strAlpha).toBeGreaterThan(0.95);
  });
});
```

- [ ] **Bước 2: Chạy test để xác nhận nó fail (module chưa tồn tại)**

Chạy: `npx vitest run src/lib/statisticsEngine.test.js`
Kỳ vọng: FAIL với lỗi "Cannot find module './statisticsEngine'" (hoặc tương tự).

- [ ] **Bước 3: Port file engine**

```bash
SRC="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-main/eduresearch-main/backend/services/statisticsEngine.js"
DST="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-supabase/src/lib/statisticsEngine.js"
cp "$SRC" "$DST"
```

Sau đó sửa đúng mấy dòng cuối của `src/lib/statisticsEngine.js` — thay:

```js
module.exports = {
  runSmartDataCleaning,
  runReliabilityAndValidity,
  runDescriptivePearsonAndProfiling,
  runSEMAndMachineLearning,
  runQualitativeTextAnalytics,
  runCompleteAcademicPipeline
};
```

bằng:

```js
export {
  runSmartDataCleaning,
  runReliabilityAndValidity,
  runDescriptivePearsonAndProfiling,
  runSEMAndMachineLearning,
  runQualitativeTextAnalytics,
  runCompleteAcademicPipeline
};
```

Không sửa dòng nào khác trong file — mọi hàm toán học giữ nguyên 100% như bản gốc.

- [ ] **Bước 4: Chạy test; nếu shape thật của giá trị trả về từ `runReliabilityAndValidity` khác với dự đoán trong test, sửa test (không sửa engine) để khớp shape thật**

Chạy: `npx vitest run src/lib/statisticsEngine.test.js`

Nếu fail vì `strAlpha` là `undefined`, mở `src/lib/statisticsEngine.js`, tìm
câu lệnh `return` của `runReliabilityAndValidity` (khoảng dòng 600), đọc đúng
tên property thực tế nó trả về cho Cronbach alpha theo từng biến, rồi sửa
dòng `result.alphaByVariable?.STR?.alpha ?? ...` trong test cho đúng đường
dẫn thật. Không sửa logic engine để chạy khớp test.

Kỳ vọng sau khi sửa: PASS, `strAlpha` > 0.95.

- [ ] **Bước 5: Thêm script và config vitest**

```js
// vitest.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node'
  }
});
```

Sửa `package.json` phần `scripts`, thêm:

```json
"test": "vitest run"
```

- [ ] **Bước 6: Chạy toàn bộ test suite**

Chạy: `npm test`
Kỳ vọng: 1 passed.

- [ ] **Bước 7: Commit**

```bash
git add src/lib/statisticsEngine.js src/lib/statisticsEngine.test.js vitest.config.js package.json
git commit -m "feat: port statisticsEngine to browser module with Cronbach alpha unit test"
```

---

## Task 4: Supabase client, auth service, và các trang auth

**Files:**
- Tạo: `eduresearch-supabase/src/lib/supabaseClient.js`
- Tạo: `eduresearch-supabase/src/services/api.js` (bắt đầu chỉ với `authAPI`; các object `*API` khác thêm ở các task sau)
- Tạo (copy nguyên văn, không sửa): `src/context/AuthContext.jsx`, `src/pages/auth/Login.jsx`, `src/pages/auth/Register.jsx`, `src/pages/auth/ForgotPassword.jsx`, `src/pages/Profile.jsx`
- Sửa: `src/App.jsx` (routing, điều chỉnh từ `App.jsx` gốc)

**Interfaces:**
- Đầu ra: `authAPI.login({email,password}) -> Promise<{user, token}>`, `authAPI.register({name,email,password,unit}) -> Promise<void>`, `authAPI.getMe() -> Promise<{user}>`, `authAPI.updateProfile({name,unit,email}) -> Promise<{user}>`, `authAPI.changePassword({oldPassword,newPassword}) -> Promise<void>`, `authAPI.forgotPassword(email) -> Promise<{message}>`. Shape của `user`: `{ id, email, name, role, unit }` — khớp với những gì `AuthContext.jsx`, `DashboardLayout.jsx`, `Login.jsx`, `Profile.jsx` đang mong đợi từ API gốc.

- [ ] **Bước 1: Viết `supabaseClient.js`**

```js
// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY trong .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Bước 2: Viết `src/services/api.js` với `authAPI`**

```js
// src/services/api.js
import { supabase } from '../lib/supabaseClient';

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role, unit, academic_title')
    .eq('id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

function toUser(authUser, profile) {
  return {
    id: authUser.id,
    email: authUser.email,
    name: profile?.name || authUser.email,
    role: profile?.role || 'viewer',
    unit: profile?.unit || ''
  };
}

export const authAPI = {
  login: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Email hoặc mật khẩu không đúng.');
    const profile = await fetchProfile(data.user.id);
    return { user: toUser(data.user, profile), token: data.session.access_token };
  },

  register: async ({ name, email, password, unit }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, unit } }
    });
    if (error) throw new Error(error.message || 'Không thể tạo tài khoản.');
    if (!data.session) {
      // Dự án Supabase yêu cầu xác nhận email.
      return;
    }
  },

  getMe: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData.session?.user;
    if (!authUser) throw new Error('Chưa đăng nhập.');
    const profile = await fetchProfile(authUser.id);
    return { user: toUser(authUser, profile) };
  },

  updateProfile: async ({ name, unit }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData.session?.user;
    if (!authUser) throw new Error('Chưa đăng nhập.');
    const { data, error } = await supabase
      .from('profiles')
      .update({ name, unit })
      .eq('id', authUser.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { user: toUser(authUser, data) };
  },

  changePassword: async ({ oldPassword, newPassword }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user?.email;
    if (!email) throw new Error('Chưa đăng nhập.');
    // Xác minh lại mật khẩu cũ trước khi cho đổi (updateUser() của Supabase
    // không tự kiểm tra việc này).
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: oldPassword });
    if (verifyError) throw new Error('Mật khẩu hiện tại không chính xác.');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },

  forgotPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
    return { message: 'Một liên kết đặt lại mật khẩu đã được gửi đến email của bạn.' };
  }
};
```

- [ ] **Bước 3: Copy các trang auth/profile và context nguyên văn**

```bash
SRC="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-main/eduresearch-main"
DST="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-supabase"
mkdir -p "$DST/src/context" "$DST/src/pages/auth"
cp "$SRC/src/context/AuthContext.jsx" "$DST/src/context/AuthContext.jsx"
cp "$SRC/src/pages/auth/Login.jsx" "$DST/src/pages/auth/Login.jsx"
cp "$SRC/src/pages/auth/Register.jsx" "$DST/src/pages/auth/Register.jsx"
cp "$SRC/src/pages/auth/ForgotPassword.jsx" "$DST/src/pages/auth/ForgotPassword.jsx"
cp "$SRC/src/pages/Profile.jsx" "$DST/src/pages/Profile.jsx"
cp "$SRC/src/main.jsx" "$DST/src/main.jsx"
```

Không sửa gì ở 6 file này — chúng chỉ gọi `authAPI.*` và `useAuth()`, mà hợp
đồng (contract) của 2 cái này đã được giữ đúng ở Bước 2. `main.jsx` giờ copy
nguyên văn được vì `context/AuthContext.jsx` (file nó import) đã tồn tại tính
đến bước này.

- [ ] **Bước 4: Viết `App.jsx`** (chỉ gồm route auth + khung dashboard có bảo vệ — các route khác thêm ở task sau)

```jsx
// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Profile from './pages/Profile';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải...</div>;
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<div>Dashboard — sẽ làm ở Task 10</div>} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Bước 5: Kiểm tra bằng tay toàn bộ luồng auth với dự án Supabase thật**

Chạy: `npm run dev`, mở `http://localhost:5173/register`.

1. Đăng ký 1 tài khoản mới (ví dụ `test1@example.com` / `password123`, đơn vị "Phòng Test").
2. Trong dashboard Supabase, xác nhận có 1 dòng mới xuất hiện ở cả `auth.users` và `profiles` (với `role = 'viewer'`).
3. Vào `/login`, đăng nhập với tài khoản đó — kỳ vọng redirect về `/` và hiện placeholder "Dashboard — sẽ làm ở Task 10", không lỗi console.
4. Vào `/profile`, đổi tên, lưu — xác nhận dòng `profiles` được update.
5. Trong SQL Editor của Supabase, chạy `UPDATE profiles SET role = 'admin' WHERE id = '<uuid lấy từ bước 2>';` — đây là bước thao tác tay duy nhất được ghi trong tài liệu (spec §4) để tạo admin đầu tiên.

Kỳ vọng: cả 5 mục kiểm tra đều đạt, không lỗi console.

- [ ] **Bước 6: Commit**

```bash
git add src/lib/supabaseClient.js src/services/api.js src/context src/pages/auth src/pages/Profile.jsx src/App.jsx src/main.jsx
git commit -m "feat: Supabase-backed auth (login/register/profile/password) with verbatim-ported pages"
```

---

## Task 5: CRUD khảo sát + chia sẻ QR

**Files:**
- Sửa: `src/services/api.js` (thêm `surveysAPI`)
- Tạo (copy nguyên văn): `src/pages/Surveys.jsx`
- Sửa: `src/App.jsx` (thêm route `/surveys`)

**Interfaces:**
- Dùng: client `supabase` từ Task 4.
- Đầu ra: `surveysAPI.getAll() -> Promise<Survey[]>`, `getById(id)`, `create(formData)`, `update(id, formData)`, `updateStatus(id, status)`, `clone(id)`, `delete(id)`. Shape `Survey`: `{ id, title, subtitle, institution, audience, status, scale, target, variables: string[], questions: object[], hypotheses: object[], questions_count, responses_count, created_at }`.

- [ ] **Bước 1: Thêm `surveysAPI` vào `src/services/api.js`**

```js
// thêm vào src/services/api.js
async function currentProfileId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id || null;
}

export const surveysAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  getById: async (id) => {
    const { data, error } = await supabase.from('surveys').select('*').eq('id', id).single();
    if (error) throw new Error('Không tìm thấy khảo sát');
    return data;
  },

  create: async (formData) => {
    const created_by = await currentProfileId();
    const questions = formData.questions || [];
    const row = {
      title: formData.title,
      subtitle: formData.subtitle || '',
      institution: formData.institution || 'Cơ sở giáo dục đại học',
      audience: formData.audience || null,
      status: formData.status || 'Draft',
      scale: formData.scale || 'Likert 5',
      target: parseInt(formData.target) || 100,
      variables: Array.isArray(formData.variables)
        ? formData.variables
        : String(formData.variables || '').split(',').map((v) => v.trim()).filter(Boolean),
      questions,
      hypotheses: formData.hypotheses || [],
      questions_count: questions.length,
      created_by
    };
    const { data, error } = await supabase.from('surveys').insert(row).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  update: async (id, formData) => {
    const patch = {};
    if (formData.title !== undefined) patch.title = formData.title;
    if (formData.subtitle !== undefined) patch.subtitle = formData.subtitle;
    if (formData.institution !== undefined) patch.institution = formData.institution;
    if (formData.audience !== undefined) patch.audience = formData.audience;
    if (formData.status !== undefined) patch.status = formData.status;
    if (formData.scale !== undefined) patch.scale = formData.scale;
    if (formData.target !== undefined) patch.target = parseInt(formData.target);
    if (formData.variables !== undefined) {
      patch.variables = Array.isArray(formData.variables)
        ? formData.variables
        : String(formData.variables).split(',').map((v) => v.trim()).filter(Boolean);
    }
    if (formData.questions !== undefined) {
      patch.questions = formData.questions;
      patch.questions_count = formData.questions.length;
    }
    if (formData.hypotheses !== undefined) patch.hypotheses = formData.hypotheses;

    const { data, error } = await supabase.from('surveys').update(patch).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateStatus: async (id, status) => {
    const { data, error } = await supabase.from('surveys').update({ status }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  clone: async (id) => {
    const original = await surveysAPI.getById(id);
    const created_by = await currentProfileId();
    const { id: _drop, created_at: _drop2, responses_count: _drop3, ...rest } = original;
    const { data, error } = await supabase
      .from('surveys')
      .insert({ ...rest, title: `${original.title} (Bản sao)`, responses_count: 0, created_by })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase.from('surveys').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
};
```

- [ ] **Bước 2: Copy `Surveys.jsx` nguyên văn**

```bash
SRC="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-main/eduresearch-main"
DST="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-supabase"
cp "$SRC/src/pages/Surveys.jsx" "$DST/src/pages/Surveys.jsx"
```

Không sửa gì — nó chỉ gọi `surveysAPI.*`.

- [ ] **Bước 3: Nối route trong `App.jsx`**

Thêm vào trong block `<Route path="/" element={<ProtectedRoute>...}>`, cạnh `profile`:

```jsx
<Route path="surveys" element={<Surveys />} />
```

Và thêm `import Surveys from './pages/Surveys';` ở phần import đầu file.

- [ ] **Bước 4: Kiểm tra bằng tay**

Chạy: `npm run dev`, đăng nhập, vào `/surveys`.

1. Xác nhận khảo sát đã seed ("Phân tích và dự đoán...") hiện trong danh sách với 14 câu hỏi và trạng thái "Đang mở"/style Active.
2. Bấm "Nhân bản" (clone) — xác nhận xuất hiện khảo sát mới "... (Bản sao)".
3. Mở modal QR/Chia sẻ cho khảo sát đã seed — xác nhận ảnh QR hiện ra và "Sao chép" copy đúng URL dạng `/survey/<uuid>`.
4. Xóa khảo sát bản sao — xác nhận nó biến mất khỏi danh sách.

Kỳ vọng: cả 4 mục kiểm tra đạt, không lỗi console.

- [ ] **Bước 5: Commit**

```bash
git add src/services/api.js src/pages/Surveys.jsx src/App.jsx
git commit -m "feat: survey CRUD, clone, and QR sharing via Supabase"
```

---

## Task 6: Thu thập khảo sát public

**Files:**
- Sửa: `src/services/api.js` (chỉ thêm `responsesAPI.create` — phần còn lại của `responsesAPI` làm ở Task 7)
- Tạo (copy kèm 1 chỗ sửa): `src/pages/PublicSurvey.jsx`
- Sửa: `src/App.jsx` (thêm route public `/survey` và `/survey/:id`)

**Interfaces:**
- Đầu ra: `responsesAPI.create({survey_id, role, unit, institution, gender, time_taken, status, answers}) -> Promise<Response>`, cho phép insert bởi khách ẩn danh (chưa đăng nhập) theo policy RLS đã tạo ở Task 2.

- [ ] **Bước 1: Thêm `responsesAPI.create` vào `src/services/api.js`**

```js
// thêm vào src/services/api.js
function formatDateVN(d = new Date()) {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export const responsesAPI = {
  create: async (payload) => {
    const row = {
      survey_id: payload.survey_id,
      role: payload.role,
      unit: payload.unit,
      institution: payload.institution,
      gender: payload.gender,
      time_taken: payload.time_taken,
      status: payload.status || 'valid',
      answers: payload.answers || {},
      date: formatDateVN()
    };
    const { data, error } = await supabase.from('responses').insert(row).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
};
```

- [ ] **Bước 2: Copy `PublicSurvey.jsx` và sửa đúng 1 dòng gây lỗi UUID**

```bash
SRC="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-main/eduresearch-main"
DST="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-supabase"
cp "$SRC/src/pages/PublicSurvey.jsx" "$DST/src/pages/PublicSurvey.jsx"
```

Mở `src/pages/PublicSurvey.jsx`, tìm dòng này (backend gốc dùng id dạng số
nguyên; Supabase dùng uuid, nên `parseInt()` âm thầm làm hỏng giá trị thành
`NaN -> 1`):

```js
survey_id: parseInt(surveyId) || 1,
```

Thay bằng:

```js
survey_id: surveyId,
```

Đây là chỗ sửa duy nhất trong file này.

- [ ] **Bước 3: Nối route public trong `App.jsx`**

Thêm `import PublicLayout from './layouts/PublicLayout';` và
`import PublicSurvey from './pages/PublicSurvey';`, sau đó thêm block route
này bên ngoài block `<ProtectedRoute>`:

```jsx
<Route element={<PublicLayout />}>
  <Route path="/survey" element={<PublicSurvey />} />
  <Route path="/survey/:id" element={<PublicSurvey />} />
</Route>
```

- [ ] **Bước 4: Kiểm tra bằng tay với vai trò khách ẩn danh**

Chạy: `npm run dev`. Mở 1 trình duyệt ẩn danh/riêng tư (không có session
Supabase), vào `/survey/<uuid-khao-sat-da-seed>` (lấy uuid từ trang Surveys
hoặc Table Editor Supabase).

1. Xác nhận form 2 bước hiện ra: trường thông tin nhân khẩu học, rồi 12 câu hỏi Likert/text.
2. Điền và nộp form.
3. Trong Table Editor của Supabase, xác nhận có 1 dòng mới trong `responses` với `survey_id` đúng (1 uuid thật, không phải `1`), và `surveys.responses_count` của khảo sát đó tăng thêm 1 (trigger từ Task 2).
4. Thử mở `/survey/<uuid-khao-sat-da-seed>?preview=true` — xác nhận nộp form ở chế độ preview KHÔNG tạo dòng `responses` mới (cơ chế bảo vệ preview-mode của bản gốc, không đổi).

Kỳ vọng: cả 4 mục kiểm tra đạt.

- [ ] **Bước 5: Commit**

```bash
git add src/services/api.js src/pages/PublicSurvey.jsx src/App.jsx
git commit -m "feat: public survey collection via Supabase anon insert"
```

---

## Task 7: Quản lý phản hồi và làm sạch dữ liệu thông minh

**Files:**
- Sửa: `src/services/api.js` (mở rộng `responsesAPI`: `getBySurvey`, `getAll`, `bulkStatus`, `bulkDelete`, `delete`, `import`)
- Tạo (copy nguyên văn): `src/pages/Responses.jsx`
- Sửa: `src/App.jsx` (thêm route `/responses`)

**Interfaces:**
- Dùng: không cần `statisticsEngine` ở đây (cờ làm sạch được tính ngay trong `Responses.jsx` ở bản gốc, bằng check string thuần — đã xác minh: `Responses.jsx` tự làm heuristic straightlining/speeder client-side sẵn, không gọi engine).
- Đầu ra: `responsesAPI.getBySurvey(surveyId) -> Promise<{list, stats: {total, valid, invalid}, charts: {roleData, genderData, institutionData}, textComments}>` — đúng shape tổng hợp mà backend gốc từng trả về.

- [ ] **Bước 1: Mở rộng `responsesAPI` trong `src/services/api.js`**

```js
// mở rộng object responsesAPI đã tạo ở Task 6 — thay toàn bộ block
// `export const responsesAPI = { create: ... };` bằng:
export const responsesAPI = {
  create: async (payload) => {
    const row = {
      survey_id: payload.survey_id,
      role: payload.role,
      unit: payload.unit,
      institution: payload.institution,
      gender: payload.gender,
      time_taken: payload.time_taken,
      status: payload.status || 'valid',
      answers: payload.answers || {},
      date: formatDateVN()
    };
    const { data, error } = await supabase.from('responses').insert(row).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  getBySurvey: async (surveyId) => {
    let query = supabase.from('responses').select('*').order('id', { ascending: false });
    if (surveyId && surveyId !== 'all') {
      query = query.eq('survey_id', surveyId);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const total = rows.length;
    const valid = rows.filter((r) => r.status === 'valid').length;
    const invalid = total - valid;

    const groupCount = (key) => {
      const counts = rows.reduce((acc, r) => {
        acc[r[key]] = (acc[r[key]] || 0) + 1;
        return acc;
      }, {});
      return Object.keys(counts).map((k) => ({ name: k, value: counts[k] }));
    };

    const textComments = [];
    rows.forEach((r) => {
      const answers = r.answers || {};
      Object.keys(answers).forEach((key) => {
        const val = answers[key];
        if (typeof val === 'string' && val.length > 5 && isNaN(Number(val))) {
          textComments.push({
            id: r.id,
            role: r.role,
            unit: r.unit,
            institution: r.institution,
            questionKey: key,
            content: val,
            date: r.date
          });
        }
      });
    });

    return {
      list: rows,
      stats: { total, valid, invalid },
      charts: {
        roleData: groupCount('role'),
        genderData: groupCount('gender'),
        institutionData: groupCount('institution')
      },
      textComments
    };
  },

  getAll: async (surveyId) => responsesAPI.getBySurvey(surveyId),

  delete: async (id) => {
    const { error } = await supabase.from('responses').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  bulkStatus: async (ids, status) => {
    if (!['valid', 'invalid'].includes(status)) throw new Error('Trạng thái không hợp lệ (valid hoặc invalid).');
    const { error, count } = await supabase.from('responses').update({ status }).in('id', ids).select('id', { count: 'exact' });
    if (error) throw new Error(error.message);
    return { message: `Đã cập nhật trạng thái ${status} cho ${ids.length} phản hồi.`, updatedCount: count ?? ids.length };
  },

  bulkDelete: async (ids) => {
    const { error } = await supabase.from('responses').delete().in('id', ids);
    if (error) throw new Error(error.message);
    return { message: `Đã xóa thành công ${ids.length} phản hồi.`, deletedCount: ids.length };
  },

  import: async (surveyIdOrData, items) => {
    const survey_id = typeof surveyIdOrData === 'object' ? surveyIdOrData.survey_id : surveyIdOrData;
    const list = typeof surveyIdOrData === 'object' ? surveyIdOrData.items : items;
    const rows = list.map((item) => ({
      survey_id,
      role: item.role || 'Người tham gia',
      unit: item.unit || 'Khoa / Đơn vị',
      institution: item.institution || 'Cơ sở giáo dục đại học',
      gender: item.gender || 'Không nêu',
      time_taken: item.time_taken || '3 phút',
      status: item.status || 'valid',
      answers: typeof item.answers === 'object' ? item.answers : JSON.parse(item.answers || '{}'),
      date: item.date || formatDateVN()
    }));
    const { error } = await supabase.from('responses').insert(rows);
    if (error) throw new Error(error.message);
    return { message: `Đã nhập thành công ${rows.length} phản hồi vào khảo sát.`, count: rows.length };
  }
};
```

- [ ] **Bước 2: Copy `Responses.jsx` nguyên văn**

```bash
SRC="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-main/eduresearch-main"
DST="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-supabase"
cp "$SRC/src/pages/Responses.jsx" "$DST/src/pages/Responses.jsx"
```

- [ ] **Bước 3: Nối route trong `App.jsx`**

Thêm `import Responses from './pages/Responses';` và
`<Route path="responses" element={<Responses />} />` trong block protected.

- [ ] **Bước 4: Kiểm tra bằng tay**

Chạy: `npm run dev`, đăng nhập, vào `/responses`.

1. Xác nhận phản hồi đã nộp ở bước kiểm tra Task 6 hiện trong danh sách với số liệu đúng (Tổng/Hợp lệ).
2. Chọn nó, bấm "Đánh dấu không hợp lệ" (bulk status → invalid) — xác nhận status cập nhật trong bảng và trong Supabase.
3. Bấm "Xóa" — xác nhận bị xóa và `surveys.responses_count` giảm (trigger từ Task 2).
4. Nộp thêm 2-3 phản hồi qua `/survey/:id` (Task 6), rồi thử luồng import CSV với file CSV nhỏ 1 dòng — xác nhận dòng import xuất hiện.

Kỳ vọng: cả 4 mục kiểm tra đạt.

- [ ] **Bước 5: Commit**

```bash
git add src/services/api.js src/pages/Responses.jsx src/App.jsx
git commit -m "feat: response management, bulk actions, and CSV import via Supabase"
```

---

## Task 8: Seed ~100 phản hồi giả cho khảo sát leadership

**Files:**
- Tạo: `eduresearch-supabase/scripts/seed-responses.mjs`
- Tạo: `eduresearch-supabase/.env.seed.example`

**Interfaces:**
- Đầu ra: 1 script Node chạy 1 lần (dùng **service role key**, không bao giờ đóng gói vào frontend) insert ~100 phản hồi sinh sẵn vào khảo sát đã seed, port từ hàm `generateResponsesForSurvey` trong `backend/services/seedResponsesService.js`.

- [ ] **Bước 1: Viết `.env.seed.example`**

```
# Chỉ dùng cho scripts/seed-responses.mjs, chạy local bằng `node`. TUYỆT ĐỐI
# không đưa key này vào bất kỳ biến VITE_ nào hay code frontend.
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-Project-Settings-API>
```

- [ ] **Bước 2: Viết `scripts/seed-responses.mjs`** (port logic sinh dữ liệu từ `seedResponsesService.js`, chỉ nhánh `audience='leadership'` vì chỉ seed đúng khảo sát này)

```js
// scripts/seed-responses.mjs
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.seed (xem .env.seed.example).');
  process.exit(1);
}
const supabase = createClient(url, key);

const BGH_ROLES = [
  'Hiệu trưởng / Phó Hiệu trưởng',
  'Chủ tịch / Phó Chủ tịch Hội đồng trường',
  'Thành viên Hội đồng trường / Đảng ủy viên'
];
const BGH_UNITS = ['Ban Giám hiệu', 'Hội đồng trường', 'Đảng ủy trường', 'Ban Đào tạo & Quản lý Khoa học'];
const BGH_BARRIERS = [
  'Rào cản lớn nhất nằm ở khung thể chế và cơ chế tự chủ tài chính còn vướng mắc theo các quy định hiện hành.',
  'Quy trình phê duyệt phân bổ ngân sách đầu tư cho hạ tầng số còn kéo dài qua nhiều cấp, chưa theo kịp tốc độ đổi mới.',
  'Sức ỳ tâm lý và sự ngại thay đổi thói quen làm việc truyền thống của một bộ phận cán bộ quản lý lâu năm.',
  'Nguồn lực đầu tư cho trung tâm dữ liệu và phần mềm dùng chung còn phân tán, thiếu liên thông đồng bộ.',
  'Cơ chế đãi ngộ và giữ chân nhân lực chuyên trách công nghệ thông tin và AI trình độ cao còn hạn chế.',
  'Thiếu khung tiêu chí định lượng chuẩn mực để đánh giá mức độ sẵn sàng chuyển đổi số giữa các khoa và viện.'
];
const BGH_SUGGESTIONS = [
  'Cần đẩy mạnh phân cấp phân quyền tự chủ toàn diện cho các khoa phòng, gắn liền trách nhiệm với kết quả đầu ra.',
  'Ban hành nghị quyết chuyên đề về chuyển đổi số giáo dục đại học giai đoạn 2026-2030, dành tối thiểu 10% ngân sách cho hạ tầng số.',
  'Xây dựng hệ thống Data Warehouse và Dashboard chỉ đạo điều hành thời gian thực cho Ban Giám hiệu.',
  'Thành lập Trung tâm Đổi mới Sáng tạo và Chuyển giao Tri thức liên kết chặt chẽ với các doanh nghiệp công nghệ.',
  'Đổi mới chính sách thi đua khen thưởng, ghi nhận kịp thời các sáng kiến số hóa quy trình quản trị học thuật.'
];
const INSTITUTIONS = [
  'Trường Đại học Bách Khoa',
  'Trường Đại học Kinh Tế Quốc Dân',
  'Trường Đại học Sư Phạm',
  'Trường Đại học Quốc Gia',
  'Trường Đại học Y Dược'
];

function generateResponses(survey, count) {
  const questions = survey.questions || [];
  const likertQuestions = questions.filter((q) => !q.type || q.type === 'likert');
  const qualitativeQuestions = questions.filter((q) => q.type === 'textarea');

  const numStraightlining = Math.min(2, Math.max(1, Math.floor(count * 0.03)));
  const numSpeeders = Math.min(2, Math.max(1, Math.floor(count * 0.03)));

  const responses = [];
  for (let i = 0; i < count; i++) {
    const isStraightliner = i < numStraightlining;
    const isSpeeder = !isStraightliner && i < numStraightlining + numSpeeders;
    const answers = {};

    if (isStraightliner) {
      const straightScore = i % 2 === 0 ? 5 : 1;
      likertQuestions.forEach((q) => { answers[q.code] = straightScore; });
    } else {
      const u1 = Math.max(1e-5, Math.random());
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const respondentTendency = Math.max(2.0, Math.min(4.8, 3.9 + z0 * 0.72));
      const constructLatents = {};
      likertQuestions.forEach((q) => {
        const v = q.variable || 'VAR';
        if (constructLatents[v] === undefined) {
          const varOffset = (Math.random() - 0.5) * 0.4;
          constructLatents[v] = Math.max(1.8, Math.min(4.8, respondentTendency + varOffset));
        }
        const latent = constructLatents[v];
        const itemNoise = (Math.random() - 0.5) * 0.9;
        const itemVal = Math.round(latent + itemNoise);
        answers[q.code] = Math.max(1, Math.min(5, itemVal));
      });
    }

    if (qualitativeQuestions.length > 0) {
      const qBarrier = qualitativeQuestions.find((q) => q.code.includes('BARRIER'));
      if (qBarrier) answers[qBarrier.code] = BGH_BARRIERS[i % BGH_BARRIERS.length];
      const qSugg = qualitativeQuestions.find((q) => q.code.includes('SUGGESTION'));
      if (qSugg) answers[qSugg.code] = BGH_SUGGESTIONS[i % BGH_SUGGESTIONS.length];
    }

    let timeTaken;
    if (isSpeeder) {
      const sec = 8 + Math.floor(Math.random() * 10);
      timeTaken = `${sec}s`;
    } else {
      const min = 2 + Math.floor(Math.random() * 4);
      const sec = Math.floor(Math.random() * 59);
      timeTaken = `${min}p ${sec}s`;
    }

    const now = new Date();
    const dayOffset = Math.floor(Math.random() * 15);
    const d = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

    responses.push({
      survey_id: survey.id,
      role: BGH_ROLES[i % BGH_ROLES.length],
      unit: BGH_UNITS[i % BGH_UNITS.length],
      institution: INSTITUTIONS[i % INSTITUTIONS.length],
      gender: i % 2 === 0 ? 'Nam' : 'Nữ',
      time_taken: timeTaken,
      status: 'valid',
      answers,
      date: dateStr
    });
  }
  return responses;
}

async function main() {
  const { data: survey, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('audience', 'leadership')
    .single();
  if (error || !survey) {
    console.error('Không tìm thấy khảo sát "leadership" đã seed. Chạy migration Task 2 trước.', error?.message);
    process.exit(1);
  }

  const responses = generateResponses(survey, 100);
  const { error: insertError } = await supabase.from('responses').insert(responses);
  if (insertError) {
    console.error('Lỗi khi chèn phản hồi mẫu:', insertError.message);
    process.exit(1);
  }
  console.log(`Đã sinh thành công ${responses.length} phản hồi mẫu cho khảo sát "${survey.title}".`);
}

main();
```

- [ ] **Bước 3: Cài dependency dotenv và chạy script**

```bash
cd "D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-supabase"
npm install -D dotenv
cp .env.seed.example .env.seed
# sửa .env.seed với service role key thật, sau đó:
node -r dotenv/config scripts/seed-responses.mjs dotenv_config_path=.env.seed
```

Kỳ vọng đầu ra: `Đã sinh thành công 100 phản hồi mẫu cho khảo sát "Phân tích và dự đoán xu hướng chuyển đổi của giáo dục đại học dựa trên các yếu tố lợi thế cạnh tranh".`

- [ ] **Bước 4: Kiểm tra trong dashboard Supabase**

Table Editor → `responses`: xác nhận ~100 dòng với `survey_id` khớp khảo sát
đã seed, và `surveys.responses_count` của khảo sát đó giờ đọc là 100 (trigger
từ Task 2).

- [ ] **Bước 5: Commit** (chỉ commit script và file env mẫu — tuyệt đối không commit `.env.seed`)

```bash
echo ".env.seed" >> .gitignore
git add scripts/seed-responses.mjs .env.seed.example .gitignore package.json package-lock.json
git commit -m "feat: add one-off script to seed ~100 fake responses for the leadership survey"
```

---

## Task 9: Analytics (pipeline thống kê + xuất APA7) và Clustering

**Files:**
- Sửa: `src/services/api.js` (thêm `surveysAPI.getAnalysis`, `surveysAPI.seedResponses`, `surveysAPI.seedAll` — wrapper mỏng dùng bởi `Analytics.jsx`/`Clustering.jsx`)
- Tạo (copy nguyên văn): `src/pages/Analytics.jsx`, `src/pages/Clustering.jsx`
- Sửa: `src/App.jsx` (thêm route `/analytics` và `/clustering`)

**Interfaces:**
- Dùng: `runCompleteAcademicPipeline` từ `src/lib/statisticsEngine.js` (Task 3), `responsesAPI.getBySurvey` (Task 7).
- Đầu ra: `surveysAPI.getAnalysis(id, filterOutliers) -> Promise<{hasData, surveyInfo, khau1_cleaning, khau2_reliability, khau3_descriptive, khau4_sem_ml, khau5_qualitative, metadata}>` — đúng shape mà `analysisController.getSurveyAnalysis` từng trả về.

- [ ] **Bước 1: Thêm wrapper phân tích vào `src/services/api.js`**

```js
// thêm vào src/services/api.js
import { runCompleteAcademicPipeline } from '../lib/statisticsEngine';

// mở rộng surveysAPI (đã tạo ở Task 5) với 2 method này —
// thêm chúng vào object literal `export const surveysAPI = { ... }` đã có:
//
//   getAnalysis: async (id, filterOutliers = true) => { ... },
//   seedResponses: async () => { throw new Error('Sinh dữ liệu mẫu chỉ chạy qua scripts/seed-responses.mjs trong dự án này.'); },
//   seedAll: async () => { throw new Error('Sinh dữ liệu mẫu chỉ chạy qua scripts/seed-responses.mjs trong dự án này.'); }
//
// Toàn bộ nội dung hàm cho getAnalysis:
async function getAnalysisImpl(id, filterOutliers = true) {
  const survey = await surveysAPI.getById(id);
  const { data: rawResponses, error } = await supabase
    .from('responses')
    .select('*')
    .eq('survey_id', id)
    .order('id', { ascending: true });
  if (error) throw new Error(error.message);

  if (!rawResponses || rawResponses.length === 0) {
    return {
      surveyInfo: {
        id: survey.id,
        title: survey.title,
        subtitle: survey.subtitle,
        audience: survey.audience,
        institution: survey.institution,
        target: survey.target,
        scale: survey.scale,
        variables: survey.variables
      },
      hasData: false,
      message: 'Khảo sát này chưa có phản hồi nào. Vui lòng thu thập phản hồi hoặc chạy scripts/seed-responses.mjs.'
    };
  }

  const analysisResults = runCompleteAcademicPipeline(survey, rawResponses, { filterOutliers });
  return { hasData: true, ...analysisResults };
}
```

Sau đó sửa object literal `surveysAPI` ở Task 5, thêm vào:

```js
  getAnalysis: (id, filterOutliers = true) => getAnalysisImpl(id, filterOutliers),
  seedResponses: async () => {
    throw new Error('Sinh dữ liệu mẫu chỉ chạy qua "node scripts/seed-responses.mjs" ở máy phát triển (cần service role key).');
  },
  seedAll: async () => {
    throw new Error('Sinh dữ liệu mẫu chỉ chạy qua "node scripts/seed-responses.mjs" ở máy phát triển (cần service role key).');
  }
```

(2 stub này chỉ để nút "Sinh dữ liệu mẫu thực tế" trong `Analytics.jsx" — UI
hiện nút này khi khảo sát có 0 phản hồi — xuống nước nhẹ nhàng thành 1 lỗi rõ
ràng thay vì crash im lặng; khảo sát duy nhất đã seed sẵn của chúng ta đã có
100 phản hồi từ Task 8 nên nút này không bao giờ cần dùng trong vận hành
thường.)

- [ ] **Bước 2: Copy `Analytics.jsx` và `Clustering.jsx` nguyên văn**

```bash
SRC="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-main/eduresearch-main"
DST="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-supabase"
cp "$SRC/src/pages/Analytics.jsx" "$DST/src/pages/Analytics.jsx"
cp "$SRC/src/pages/Clustering.jsx" "$DST/src/pages/Clustering.jsx"
```

- [ ] **Bước 3: Nối route trong `App.jsx`**

Thêm import và:

```jsx
<Route path="analytics" element={<Analytics />} />
<Route path="clustering" element={<Clustering />} />
```

- [ ] **Bước 4: Kiểm tra bằng tay toàn bộ pipeline học thuật 5 khâu**

Chạy: `npm run dev`, đăng nhập, vào `/analytics`, chọn khảo sát đã seed.

1. Xác nhận "Khâu 1" hiện kết quả làm sạch: ~96 phản hồi sạch trong 100 phản hồi thô (2 straightliner + 2 speeder bị đánh dấu, theo generator ở Task 8).
2. Xác nhận "Khâu 2" hiện bảng Cronbach's Alpha với giá trị cho STR, LEA, CAP, RES, SER, REA.
3. Xác nhận "Khâu 3" hiện ma trận tương quan Pearson.
4. Xác nhận "Khâu 4" hiện 4 giả thuyết SEM (H1–H4) với kết luận Supported/Not supported.
5. Xác nhận "Khâu 5" hiện phân phối cảm xúc và word cloud từ các câu trả lời định tính.
6. Bấm "Xuất Báo cáo Học thuật APA 7 (.doc)" — xác nhận file `.doc` tải xuống và mở được trong Word/LibreOffice với đủ 6 phần (không trống/lỗi).
7. Vào `/clustering` — xác nhận bản đồ K-Means/profile render không lỗi.

Kỳ vọng: cả 7 mục kiểm tra đạt.

- [ ] **Bước 5: Commit**

```bash
git add src/services/api.js src/pages/Analytics.jsx src/pages/Clustering.jsx src/App.jsx
git commit -m "feat: analytics pipeline, clustering, and APA7 Word export via Supabase data"
```

---

## Task 10: Tài liệu (Supabase Storage) và Dashboard

**Files:**
- Sửa: `src/services/api.js` (thêm `documentsAPI`, `dashboardAPI`)
- Tạo (copy kèm 1 chỗ sửa): `src/pages/Documents.jsx`
- Tạo (copy nguyên văn): `src/pages/Dashboard.jsx`
- Sửa: `src/App.jsx` (thêm route `/documents`, thay route `index` placeholder của Task 4 bằng Dashboard thật)

**Interfaces:**
- Đầu ra: `documentsAPI.getAll()`, `.create(formData)`, `.delete(id)`; `dashboardAPI.getStats(surveyId)`.

- [ ] **Bước 1: Thêm `documentsAPI` vào `src/services/api.js`**

```js
// thêm vào src/services/api.js
const DOC_TYPE_STYLE = {
  'Lý thuyết': { color: '#3B82F6', bg: '#EFF6FF' },
  'Báo cáo': { color: '#8B5CF6', bg: '#F3E8FF' },
  'Tham khảo': { color: '#10B981', bg: '#D1FAE5' },
  'Dữ liệu': { color: '#F59E0B', bg: '#FEF3C7' }
};

export const documentsAPI = {
  getAll: async () => {
    const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  create: async (formData) => {
    const title = formData.get('title');
    const type = formData.get('type') || 'Tham khảo';
    const file = formData.get('file');
    if (!file) throw new Error('Vui lòng chọn file.');

    const uploaded_by = await currentProfileId();
    const storagePath = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, file);
    if (uploadError) throw new Error(uploadError.message);

    const styling = DOC_TYPE_STYLE[type] || DOC_TYPE_STYLE['Tham khảo'];
    const sizeInMB = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    const { data, error } = await supabase
      .from('documents')
      .insert({
        title,
        type,
        size: sizeInMB,
        color: styling.color,
        bg: styling.bg,
        date: formatDateVN(),
        file_path: storagePath,
        original_name: file.name,
        uploaded_by
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  delete: async (id) => {
    const { data: doc } = await supabase.from('documents').select('file_path').eq('id', id).single();
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) throw new Error(error.message);
    if (doc?.file_path) {
      await supabase.storage.from('documents').remove([doc.file_path]);
    }
  },

  getDownloadUrl: async (filePath) => {
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 60);
    if (error) throw new Error(error.message);
    return data.signedUrl;
  }
};
```

- [ ] **Bước 2: Thêm `dashboardAPI` vào `src/services/api.js`**

```js
// thêm vào src/services/api.js
export const dashboardAPI = {
  getStats: async (surveyId = '') => {
    const isSpecific = surveyId && surveyId !== 'all';

    const { data: surveysList, error: surveysErr } = await supabase
      .from('surveys')
      .select('id, title, target, responses_count, audience, scale, status')
      .order('created_at', { ascending: true });
    if (surveysErr) throw new Error(surveysErr.message);

    const totalSurveys = surveysList.length;
    const selectedSurvey = isSpecific ? surveysList.find((s) => s.id === surveyId) : null;

    let responsesQuery = supabase.from('responses').select('role, status, answers', { count: 'exact' });
    if (isSpecific) responsesQuery = responsesQuery.eq('survey_id', surveyId);
    const { data: respRows, error: respErr } = await responsesQuery;
    if (respErr) throw new Error(respErr.message);

    const totalResponses = respRows.length;
    const validResponses = respRows.filter((r) => r.status === 'valid').length;

    let pieData = [];
    if (isSpecific) {
      const roleCounts = respRows.reduce((acc, r) => {
        acc[r.role] = (acc[r.role] || 0) + 1;
        return acc;
      }, {});
      pieData = Object.keys(roleCounts).map((k) => ({ name: k, value: roleCounts[k] }));
    } else {
      const { data: allResp } = await supabase.from('responses').select('survey_id');
      const bySurvey = (allResp || []).reduce((acc, r) => {
        acc[r.survey_id] = (acc[r.survey_id] || 0) + 1;
        return acc;
      }, {});
      pieData = surveysList
        .filter((s) => bySurvey[s.id])
        .map((s) => ({
          name: s.title.split('—')[0].replace(/Bộ \d:/, '').trim(),
          fullName: s.title,
          surveyId: s.id,
          value: bySurvey[s.id]
        }));
    }

    const validAnswerRows = respRows.filter((r) => r.status === 'valid');
    let totalScore = 0;
    let countItems = 0;
    validAnswerRows.forEach((r) => {
      const ans = r.answers || {};
      Object.keys(ans).forEach((k) => {
        const num = parseFloat(ans[k]);
        if (!isNaN(num) && num >= 1 && num <= 5) {
          totalScore += num;
          countItems++;
        }
      });
    });
    const avgScore = countItems > 0 ? totalScore / countItems : 3.85;
    const readinessIndex = Math.min(100, Math.max(0, avgScore * 20));

    const areaData = [
      { name: 'Thứ 2', value: Math.max(1, Math.round(totalResponses * 0.12)) },
      { name: 'Thứ 3', value: Math.max(2, Math.round(totalResponses * 0.18)) },
      { name: 'Thứ 4', value: Math.max(3, Math.round(totalResponses * 0.24)) },
      { name: 'Thứ 5', value: Math.max(2, Math.round(totalResponses * 0.2)) },
      { name: 'Thứ 6', value: Math.max(2, Math.round(totalResponses * 0.15)) },
      { name: 'Thứ 7', value: Math.max(1, Math.round(totalResponses * 0.07)) },
      { name: 'Chủ nhật', value: Math.max(1, Math.round(totalResponses * 0.04)) }
    ];

    const totalSystemTarget = surveysList.reduce((acc, s) => acc + (s.target || 0), 0);
    const target = selectedSurvey ? selectedSurvey.target || 100 : totalSystemTarget;
    const pilotTarget = Math.round(target * 0.15);

    return {
      surveyId: isSpecific ? surveyId : 'all',
      isAllSurveys: !isSpecific,
      selectedSurvey,
      surveysList,
      totalSurveys,
      totalResponses,
      validResponses,
      target,
      pilotTarget,
      totalAnalysis: 5,
      readinessIndex: parseFloat(readinessIndex.toFixed(1)),
      areaData,
      pieData
    };
  }
};
```

- [ ] **Bước 3: Copy `Dashboard.jsx` nguyên văn và `Documents.jsx` kèm 1 chỗ sửa**

```bash
SRC="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-main/eduresearch-main"
DST="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-supabase"
cp "$SRC/src/pages/Dashboard.jsx" "$DST/src/pages/Dashboard.jsx"
cp "$SRC/src/pages/Documents.jsx" "$DST/src/pages/Documents.jsx"
```

Trong `src/pages/Documents.jsx`, tìm hàm `handleDownload`, hiện đang là:

```js
const downloadUrl = `http://localhost:5000/uploads/${doc.file_path}`;
const element = document.createElement('a');
element.href = downloadUrl;
```

Thay bằng (đổi `handleDownload` thành `async`, await 1 signed URL thay vì
hard-code path static-file cũ của Express):

```js
const downloadUrl = await documentsAPI.getDownloadUrl(doc.file_path);
const element = document.createElement('a');
element.href = downloadUrl;
```

Đồng thời đổi chữ ký hàm từ `const handleDownload = (doc) => {` thành
`const handleDownload = async (doc) => {`; các chỗ gọi `onClick={() =>
handleDownload(doc)}` không cần đổi gì (React gọi async handler kiểu này vẫn
bình thường). Đây là chỗ sửa duy nhất trong file này.

- [ ] **Bước 4: Nối route trong `App.jsx`**, thay placeholder của Task 4

```jsx
<Route index element={<Dashboard />} />
<Route path="documents" element={<Documents />} />
```

- [ ] **Bước 5: Kiểm tra bằng tay**

Chạy: `npm run dev`, đăng nhập.

1. Vào `/` (Dashboard) — xác nhận thẻ KPI hiện số liệu khớp khảo sát đã seed (100 phản hồi, ~96 hợp lệ), gauge readiness render, biểu đồ area/pie render không lỗi.
2. Vào `/documents`, upload 1 file PDF nhỏ với tên "Tài liệu test" và loại "Tham khảo" — xác nhận nó xuất hiện trong lưới với màu xanh "Tham khảo".
3. Bấm icon tải xuống — xác nhận file tải xuống đúng (signed URL hoạt động).
4. Xóa tài liệu đó — xác nhận nó biến mất khỏi lưới và khỏi bucket Storage của Supabase (kiểm tra Storage browser trong dashboard).

Kỳ vọng: cả 4 mục kiểm tra đạt.

- [ ] **Bước 6: Commit**

```bash
git add src/services/api.js src/pages/Dashboard.jsx src/pages/Documents.jsx src/App.jsx
git commit -m "feat: dashboard KPIs and document storage via Supabase"
```

---

## Task 11: Quản lý người dùng Admin (Edge Function + trang Users)

**Files:**
- Tạo: `eduresearch-supabase/supabase/functions/admin-create-user/index.ts`
- Tạo: `eduresearch-supabase/supabase/functions/admin-delete-user/index.ts`
- Sửa: `src/services/api.js` (thêm `usersAPI`)
- Tạo (copy nguyên văn): `src/pages/Users.jsx`
- Sửa: `src/App.jsx` (thêm route `/users`)

**Interfaces:**
- Đầu ra: `usersAPI.getAll()`, `.create({name,email,password,role,unit})`, `.update(id,{name,email,role,unit})`, `.delete(id)`.

- [ ] **Bước 1: Viết Edge Function `admin-create-user`**

```ts
// supabase/functions/admin-create-user/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  // Client gắn với JWT của người gọi, chỉ dùng để kiểm tra role của họ.
  const callerClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data: callerAuth, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr || !callerAuth?.user) {
    return new Response(JSON.stringify({ error: 'Chưa đăng nhập.' }), { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', callerAuth.user.id)
    .single();
  if (callerProfile?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Chỉ Quản trị viên mới được tạo tài khoản.' }), { status: 403 });
  }

  const { name, email, password, role = 'viewer', unit = '' } = await req.json();
  if (!name || !email || !password) {
    return new Response(JSON.stringify({ error: 'Họ tên, email và mật khẩu là bắt buộc.' }), { status: 400 });
  }

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, unit }
  });
  if (createErr) {
    return new Response(JSON.stringify({ error: createErr.message }), { status: 400 });
  }

  // Trigger handle_new_user đã tự tạo 1 dòng profile role='viewer' —
  // cập nhật lại thành role được yêu cầu.
  await adminClient.from('profiles').update({ role }).eq('id', created.user.id);

  return new Response(
    JSON.stringify({ id: created.user.id, name, email, role, unit, created_at: created.user.created_at }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
});
```

- [ ] **Bước 2: Viết Edge Function `admin-delete-user`**

```ts
// supabase/functions/admin-delete-user/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  const callerClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data: callerAuth, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr || !callerAuth?.user) {
    return new Response(JSON.stringify({ error: 'Chưa đăng nhập.' }), { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', callerAuth.user.id)
    .single();
  if (callerProfile?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Chỉ Quản trị viên mới được xóa tài khoản.' }), { status: 403 });
  }

  const { id } = await req.json();
  if (id === callerAuth.user.id) {
    return new Response(JSON.stringify({ error: 'Không thể tự xóa tài khoản đang đăng nhập.' }), { status: 400 });
  }

  const { error: deleteErr } = await adminClient.auth.admin.deleteUser(id);
  if (deleteErr) {
    return new Response(JSON.stringify({ error: deleteErr.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ message: 'Xóa tài khoản thành công.' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});
```

- [ ] **Bước 3: Deploy 2 function**

```bash
cd "D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-supabase"
npx supabase functions deploy admin-create-user
npx supabase functions deploy admin-delete-user
```

Kỳ vọng: cả 2 deploy thành công (Supabase CLI tự inject
`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` vào Edge Function — không cần tự
set 2 biến môi trường built-in này).

- [ ] **Bước 4: Thêm `usersAPI` vào `src/services/api.js`**

```js
// thêm vào src/services/api.js
export const usersAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role, unit, created_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  create: async (formData) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: formData,
      headers: { Authorization: `Bearer ${sessionData.session?.access_token}` }
    });
    if (error) throw new Error(error.message || 'Lỗi khi tạo tài khoản.');
    return data;
  },

  update: async (id, formData) => {
    const patch = {};
    if (formData.name !== undefined) patch.name = formData.name;
    if (formData.role !== undefined) patch.role = formData.role;
    if (formData.unit !== undefined) patch.unit = formData.unit;
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  delete: async (id) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const { error } = await supabase.functions.invoke('admin-delete-user', {
      body: { id },
      headers: { Authorization: `Bearer ${sessionData.session?.access_token}` }
    });
    if (error) throw new Error(error.message || 'Lỗi khi xóa tài khoản.');
  }
};
```

- [ ] **Bước 5: Copy `Users.jsx` nguyên văn**

```bash
SRC="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-main/eduresearch-main"
DST="D:/Thanh/Hoc CNTT/Cao hoc CNTT/Luan van Ths/Edu Research/eduresearch-supabase"
cp "$SRC/src/pages/Users.jsx" "$DST/src/pages/Users.jsx"
```

- [ ] **Bước 6: Nối route trong `App.jsx`**

Thêm `import Users from './pages/Users';` và
`<Route path="users" element={<Users />} />` trong block protected.

- [ ] **Bước 7: Kiểm tra bằng tay (với tài khoản admin đã nâng quyền ở Task 4, Bước 5)**

Chạy: `npm run dev`, đăng nhập với tài khoản admin, vào `/users`.

1. Xác nhận danh sách hiện cả 2 tài khoản đang có (admin + viewer test1@example.com từ Task 4).
2. Tạo 1 user mới: tên "Nghiên cứu viên Test", email `researcher-test@example.com`, mật khẩu, role "researcher" — xác nhận xuất hiện trong danh sách và tài khoản đăng nhập được với mật khẩu đó.
3. Đổi role user đó thành "viewer" qua form sửa — xác nhận cập nhật đúng.
4. Xóa user đó — xác nhận bị xóa khỏi cả `profiles` và `auth.users` (kiểm tra tab Authentication trong dashboard Supabase).
5. Khi đăng nhập bằng tài khoản `test1@example.com` **viewer** (không phải admin), xác nhận `/users` bị redirect đi hoặc các action tạo/xóa đều lỗi vì không có quyền (RLS + kiểm tra admin trong Edge Function ở Bước 1-2).

Kỳ vọng: cả 5 mục kiểm tra đạt.

- [ ] **Bước 8: Commit**

```bash
git add supabase/functions src/services/api.js src/pages/Users.jsx src/App.jsx
git commit -m "feat: admin user management via Supabase Edge Functions"
```

---

## Task 12: Kiểm tra toàn app lần cuối và viết README

**Files:**
- Tạo: `eduresearch-supabase/README.md`

**Interfaces:** không có (task kiểm tra + viết tài liệu).

- [ ] **Bước 1: Viết README**

```markdown
# EduResearch-Supabase

Bản clone EduResearch (khảo sát giáo dục đại học, chuẩn APA 7) chạy hoàn toàn
trên Supabase (Postgres + Auth + Storage + 2 Edge Function nhỏ cho quản trị
người dùng) — không có server Node riêng.

## Chạy thử

1. Tạo file `.env.local` với `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`
   (xem `.env.example`).
2. `npm install`
3. `npm run dev` → mở `http://localhost:5173`
4. Tài khoản đầu tiên: tự đăng ký ở `/register`, rồi chạy SQL
   `UPDATE profiles SET role='admin' WHERE id='<uuid>';` trong Supabase SQL
   Editor để trở thành Super Admin (xem spec, Phần 4).

## Thiết kế & kế hoạch

- Spec: `docs/superpowers/specs/2026-11-19-eduresearch-supabase-clone-design.md`
- Plan: `docs/superpowers/plans/2026-11-19-eduresearch-supabase.md`
```

- [ ] **Bước 2: Kiểm tra click-through toàn app theo cả 3 vai trò**

Chạy: `npm run dev`.

1. **Ẩn danh (incognito, chưa đăng nhập):** nộp khảo sát public tại `/survey/<uuid>` — thành công; thử vào `/surveys` trực tiếp — bị redirect về `/login`.
2. **Viewer:** đăng nhập bằng `test1@example.com` — xem được Dashboard/Surveys/Responses/Analytics/Documents ở chế độ đọc; xác nhận các nút tạo/sửa/xóa khảo sát/phản hồi/tài liệu bị ẩn hoặc lỗi theo đúng check `currentUser?.role !== 'viewer'` đã có sẵn trong các trang đã copy.
3. **Researcher:** nâng quyền 1 tài khoản test thành `researcher` qua `/users` (admin), đăng nhập bằng tài khoản đó — xác nhận tạo được khảo sát, import CSV, chạy Analytics, upload tài liệu.
4. **Admin:** xác nhận CRUD đầy đủ ở `/users` hoạt động và xuất Word ở `/analytics` vẫn chạy trọn luồng.

Kỳ vọng: không lỗi console ở cả 4 lượt kiểm tra; mọi ranh giới phân quyền do RLS quyết định từ Task 2 hoạt động đúng như thiết kế.

- [ ] **Bước 3: Chạy lại automated test suite 1 lần nữa**

Chạy: `npm test`
Kỳ vọng: PASS (test Cronbach's Alpha từ Task 3).

- [ ] **Bước 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions and first-admin bootstrap step"
```
