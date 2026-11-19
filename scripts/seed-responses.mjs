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

export function generateResponses(survey, count) {
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

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
