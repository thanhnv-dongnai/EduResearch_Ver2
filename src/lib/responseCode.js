// Mã định danh dễ đọc cho từng phiếu phản hồi, thay cho UUID thô:
// - 3 ký tự: mã Bộ câu hỏi (B01 Ban Giám hiệu, B02 Trưởng/Phó Khoa,
//   B03 Giảng viên/Nhân viên, B04 Người học/Cựu người học)
// - 12 ký tự: thời điểm nộp phiếu, định dạng ddMMyyHHmmss
// - 4 ký tự: số thứ tự, đánh theo từng Bộ và sắp xếp theo thời gian nộp
export const BO_CODE_BY_AUDIENCE = {
  leadership: 'B01',
  dept_head: 'B02',
  lecturer_staff: 'B03',
  student_alumni: 'B04'
};

function pad(value, length = 2) {
  return String(value).padStart(length, '0');
}

function formatSubmittedAt(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '0'.repeat(12);
  return [
    pad(d.getDate()),
    pad(d.getMonth() + 1),
    pad(d.getFullYear() % 100),
    pad(d.getHours()),
    pad(d.getMinutes()),
    pad(d.getSeconds())
  ].join('');
}

// responses: mảng phản hồi (cần trường id + submitted_at).
// getAudience(response): trả về audience ('leadership'/'dept_head'/...) của
// khảo sát chứa phản hồi đó, dùng để nhóm theo Bộ trước khi đánh số thứ tự.
export function buildResponseCodeMap(responses, getAudience) {
  const groups = new Map();
  (responses || []).forEach((r) => {
    const key = getAudience(r) || 'unknown';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  });

  const map = {};
  groups.forEach((group, audienceKey) => {
    const boCode = BO_CODE_BY_AUDIENCE[audienceKey] || 'B00';
    const sorted = [...group].sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
    sorted.forEach((r, idx) => {
      map[r.id] = `${boCode}${formatSubmittedAt(r.submitted_at)}${pad(idx + 1, 4)}`;
    });
  });
  return map;
}
