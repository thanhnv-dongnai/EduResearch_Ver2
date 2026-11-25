import React, { useState, useEffect } from 'react';
import { Plus, Edit, Share2, Trash2, BarChart2, X, AlertTriangle, FileSpreadsheet, ListPlus, Sparkles, CheckCircle, QrCode, Copy, Eye, Download, Check, Building2, Users, GraduationCap, Briefcase, Filter } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { surveysAPI, shortLinksAPI } from '../services/api';
import Toast from '../components/Toast';

// 4 MẪU BỘ CÂU HỎI CHUẨN THEO CHỨC VỤ
const ROLE_QUESTIONNAIRES = {
  leadership: {
    code: 'leadership',
    roleName: 'Ban Giám hiệu & Hội đồng trường',
    badgeColor: '#1E3A8A',
    badgeBg: '#DBEAFE',
    icon: Building2,
    defaultTitle: 'Bộ 1: Ban Giám hiệu & Hội đồng trường — Chiến lược, thể chế và quản trị vĩ mô',
    subtitle: 'Đánh giá ở tầm vĩ mô: Thể chế, chiến lược, quản trị, phân bổ nguồn lực và lợi thế cạnh tranh tổng thể',
    variables: 'SP, LD, DX, RO, CS, AT',
    defaultTarget: 50,
    questions: [
      { code: 'INFO_POSITION', text: 'Chức vụ / Vị trí công tác', variable: 'INFO', type: 'choice', section: 'demographics', mapsTo: 'role', options: ['Chủ tịch / Phó Chủ tịch Hội đồng trường', 'Hiệu trưởng / Phó Hiệu trưởng', 'Thành viên Hội đồng trường / Đảng ủy viên'] },
      { code: 'INFO_TENURE', text: 'Thâm niên quản lý ở cấp trường', variable: 'INFO', type: 'choice', section: 'demographics', mapsTo: 'tenure', options: ['Dưới 3 năm', 'Từ 3 – 5 năm', 'Từ 5 – 10 năm', 'Trên 10 năm'] },
      { code: 'G1_SP01', text: 'Nhà trường đã xây dựng chiến lược chuyển đổi số và phát triển dài hạn rõ ràng, gắn kết chặt chẽ với sứ mạng, tầm nhìn và định vị cạnh tranh trong hệ thống giáo dục đại học.', variable: 'SP', type: 'likert', group: '1. Lập kế hoạch chiến lược phát triển (SP)' },
      { code: 'G1_SP02', text: 'Các mục tiêu chiến lược về đổi mới mô hình đào tạo và quản trị của nhà trường được rà soát, cập nhật linh hoạt trước những biến động của thị trường lao động và công nghệ giáo dục.', variable: 'SP', type: 'likert', group: '1. Lập kế hoạch chiến lược phát triển (SP)' },
      { code: 'G1_LD01', text: 'Ban Giám hiệu và Hội đồng trường luôn tiên phong trong việc dẫn dắt tư duy đổi mới, tạo dựng văn hóa ra quyết định dựa trên dữ liệu (data-driven) trong toàn trường.', variable: 'LD', type: 'likert', group: '2. Năng lực lãnh đạo số & quản trị (LD)' },
      { code: 'G1_LD02', text: 'Cơ chế phân cấp, phân quyền và trao quyền tự chủ cho các đơn vị trực thuộc được thiết lập minh bạch, tạo điều kiện thúc đẩy sáng kiến chuyển đổi từ cơ sở.', variable: 'LD', type: 'likert', group: '2. Năng lực lãnh đạo số & quản trị (LD)' },
      { code: 'G1_DX01', text: 'Nhà trường đã tái cấu trúc thành công các quy trình quản trị cốt lõi theo hướng tinh gọn, tích hợp và vận hành trên nền tảng số đồng bộ.', variable: 'DX', type: 'likert', group: '3. Năng lực số hóa & đổi mới sáng tạo (DX)' },
      { code: 'G1_RO01', text: 'Nhà trường có đủ năng lực tài chính và cơ chế huy động các nguồn lực xã hội hóa để đầu tư bền vững cho các dự án chuyển đổi trọng điểm.', variable: 'RO', type: 'likert', group: '4. Nguồn lực & cơ sở hạ tầng (RO)' },
      { code: 'G1_RO02', text: 'Hạ tầng công nghệ thông tin, hệ thống dữ liệu tập trung và cơ sở vật chất hiện tại đáp ứng tốt yêu cầu mở rộng quy mô và đổi mới phương thức hoạt động của nhà trường.', variable: 'RO', type: 'likert', group: '4. Nguồn lực & cơ sở hạ tầng (RO)' },
      { code: 'G1_CS01', text: 'Hệ sinh thái dịch vụ số của nhà trường (cổng thông tin, quản lý đào tạo, hành chính công trực tuyến) bảo đảm tính liên thông, an toàn và nâng cao trải nghiệm cho các bên liên quan.', variable: 'CS', type: 'likert', group: '5. Chất lượng dịch vụ & uy tín (CS)' },
      { code: 'G1_AT01', text: 'Nhà trường có khả năng nhận diện sớm các cơ hội và rủi ro từ sự phát triển của trí tuệ nhân tạo (AI) cũng như các mô hình giáo dục linh hoạt để kịp thời điều chỉnh chiến lược.', variable: 'AT', type: 'likert', group: '6. Mức độ sẵn sàng chuyển đổi số (AT)' },
      { code: 'G1_AT02', text: 'Tổng thể tổ chức của nhà trường hiện đạt mức độ sẵn sàng cao để chuyển đổi toàn diện và duy trì lợi thế cạnh tranh bền vững trong 3–5 năm tới.', variable: 'AT', type: 'likert', group: '6. Mức độ sẵn sàng chuyển đổi số (AT)' },
      { code: 'G1_OPEN01', text: 'Từ góc độ hoạch định chiến lược và quản trị cấp cao, đâu là 2–3 rào cản lớn nhất (về cơ chế, nguồn lực tài chính, hay văn hóa tổ chức) đang cản trở tiến trình chuyển đổi của nhà trường hiện nay?', variable: 'QUALITATIVE', type: 'textarea', placeholder: 'Ý kiến về cơ chế, nguồn lực tài chính, văn hóa tổ chức...' },
      { code: 'G1_OPEN02', text: 'Nhà trường cần ưu tiên thực hiện những đột phá chính sách hoặc phân bổ nguồn lực trọng tâm nào trong giai đoạn tới để nâng cao năng lực thích ứng và vị thế cạnh tranh?', variable: 'QUALITATIVE', type: 'textarea', placeholder: 'Đề xuất đột phá chính sách, phân bổ nguồn lực trọng tâm...' }
    ],
    hypotheses: [
      { code: 'H1', name: 'SP ➔ AT', description: 'Chiến lược chuyển đổi số và phát triển dài hạn (SP) tác động thuận chiều đến mức độ sẵn sàng chuyển đổi tổng thể (AT)', independent: 'SP', dependent: 'AT' },
      { code: 'H2', name: 'LD ➔ AT', description: 'Năng lực lãnh đạo số và cơ chế trao quyền (LD) tác động thuận chiều đến mức độ sẵn sàng chuyển đổi (AT)', independent: 'LD', dependent: 'AT' },
      { code: 'H3', name: 'RO ➔ DX', description: 'Năng lực tài chính và hạ tầng (RO) tác động thuận chiều đến năng lực số hóa quy trình quản trị (DX)', independent: 'RO', dependent: 'DX' },
      { code: 'H4', name: 'DX ➔ CS', description: 'Năng lực số hóa quy trình quản trị (DX) tác động thuận chiều đến chất lượng hệ sinh thái dịch vụ số (CS)', independent: 'DX', dependent: 'CS' }
    ]
  },
  dept_head: {
    code: 'dept_head',
    roleName: 'Trưởng / Phó Khoa, Phòng / Ban',
    badgeColor: '#065F46',
    badgeBg: '#D1FAE5',
    icon: Briefcase,
    defaultTitle: 'Bộ 2: Trưởng / Phó Khoa, Phòng / Ban — Triển khai chiến lược và quy trình vận hành cấp trung',
    subtitle: 'Đánh giá ở cấp trung: Triển khai chiến lược, quy trình vận hành, quản lý nhân sự và chất lượng dịch vụ nội bộ',
    variables: 'SP, LD, DX, RO, CS, AT',
    defaultTarget: 80,
    questions: [
      { code: 'INFO_POSITION', text: 'Chức vụ / Vị trí công tác', variable: 'INFO', type: 'choice', section: 'demographics', mapsTo: 'role', options: ['Trưởng Khoa / Viện trưởng đào tạo', 'Phó Trưởng Khoa / Phó Viện trưởng', 'Trưởng Phòng / Ban / Trung tâm chức năng', 'Phó Trưởng Phòng / Ban / Trung tâm'] },
      { code: 'INFO_TENURE', text: 'Thâm niên quản lý ở cấp đơn vị', variable: 'INFO', type: 'choice', section: 'demographics', mapsTo: 'tenure', options: ['Dưới 3 năm', 'Từ 3 – 5 năm', 'Từ 5 – 10 năm', 'Trên 10 năm'] },
      { code: 'G2_SP01', text: 'Các mục tiêu chiến lược của nhà trường được cụ thể hóa thành kế hoạch hành động và bộ chỉ số đo lường hiệu quả công việc (KPI) rõ ràng, khả thi tại đơn vị tôi phụ trách.', variable: 'SP', type: 'likert', group: '1. Lập kế hoạch chiến lược phát triển (SP)' },
      { code: 'G2_SP02', text: 'Đơn vị tôi chủ động điều chỉnh kế hoạch đào tạo, nghiên cứu hoặc vận hành hàng năm để bám sát định hướng chuyển đổi của nhà trường.', variable: 'SP', type: 'likert', group: '1. Lập kế hoạch chiến lược phát triển (SP)' },
      { code: 'G2_LD01', text: 'Đội ngũ lãnh đạo cấp trung được Ban Giám hiệu trao đủ thẩm quyền và hỗ trợ kịp thời để giải quyết các vướng mắc phát sinh trong quá trình triển khai đổi mới.', variable: 'LD', type: 'likert', group: '2. Năng lực lãnh đạo số & quản trị (LD)' },
      { code: 'G2_LD02', text: 'Ban lãnh đạo khoa/phòng/ban thường xuyên khuyến khích, tạo động lực và đánh giá công bằng đối với các cá nhân tích cực ứng dụng công nghệ vào công việc.', variable: 'LD', type: 'likert', group: '2. Năng lực lãnh đạo số & quản trị (LD)' },
      { code: 'G2_DX01', text: 'Công tác phối hợp và chia sẻ dữ liệu giữa đơn vị tôi với các khoa, phòng, ban chức năng khác diễn ra thông suốt trên môi trường số.', variable: 'DX', type: 'likert', group: '3. Năng lực số hóa & đổi mới sáng tạo (DX)' },
      { code: 'G2_DX02', text: 'Các quy trình nghiệp vụ nội bộ tại đơn vị đã được chuẩn hóa và số hóa, giúp giảm thiểu đáng kể thủ tục hành chính thủ công.', variable: 'DX', type: 'likert', group: '3. Năng lực số hóa & đổi mới sáng tạo (DX)' },
      { code: 'G2_RO01', text: 'Đơn vị được phân bổ ngân sách, trang thiết bị và phần mềm chuyên dụng tương xứng với nhiệm vụ chuyển đổi được giao.', variable: 'RO', type: 'likert', group: '4. Nguồn lực & cơ sở hạ tầng (RO)' },
      { code: 'G2_RO02', text: 'Đội ngũ nhân sự tại đơn vị hiện có đủ năng lực chuyên môn và kỹ năng số để đáp ứng yêu cầu đổi mới quy trình vận hành.', variable: 'RO', type: 'likert', group: '4. Nguồn lực & cơ sở hạ tầng (RO)' },
      { code: 'G2_CS01', text: 'Các nền tảng số và dịch vụ hỗ trợ kỹ thuật nội bộ của nhà trường hoạt động ổn định, đáp ứng kịp thời nhu cầu quản lý, điều hành của đơn vị.', variable: 'CS', type: 'likert', group: '5. Chất lượng dịch vụ & uy tín (CS)' },
      { code: 'G2_AT01', text: 'Đơn vị tôi có đủ sự linh hoạt và năng lực tổ chức để triển khai nhanh chóng các chương trình, quy trình mới khi nhà trường có chủ trương thay đổi.', variable: 'AT', type: 'likert', group: '6. Mức độ sẵn sàng chuyển đổi số (AT)' },
      { code: 'G2_OPEN01', text: 'Trong quá trình chuyển hóa định hướng của nhà trường thành hoạt động thực tế tại đơn vị, Anh/Chị gặp phải những điểm nghẽn nào về quy trình vận hành, nhân sự hoặc sự phối hợp liên đơn vị?', variable: 'QUALITATIVE', type: 'textarea', placeholder: 'Ý kiến về quy trình vận hành, nhân sự, phối hợp liên đơn vị...' },
      { code: 'G2_OPEN02', text: 'Anh/Chị có đề xuất cụ thể gì về cơ chế phân quyền, đầu tư công cụ quản lý hoặc đào tạo nhân sự để giúp đơn vị nâng cao hiệu quả triển khai chuyển đổi số?', variable: 'QUALITATIVE', type: 'textarea', placeholder: 'Đề xuất cơ chế phân quyền, công cụ quản lý, đào tạo nhân sự...' }
    ],
    hypotheses: [
      { code: 'H1', name: 'SP ➔ AT', description: 'Cụ thể hóa chiến lược thành KPI (SP) tác động thuận chiều đến năng lực linh hoạt triển khai thay đổi của đơn vị (AT)', independent: 'SP', dependent: 'AT' },
      { code: 'H2', name: 'LD ➔ DX', description: 'Sự trao quyền của lãnh đạo cấp trung (LD) thúc đẩy số hóa và chuẩn hóa quy trình nội bộ (DX)', independent: 'LD', dependent: 'DX' },
      { code: 'H3', name: 'RO ➔ DX', description: 'Nguồn lực ngân sách, nhân sự (RO) tác động thuận chiều đến năng lực số hóa quy trình (DX)', independent: 'RO', dependent: 'DX' },
      { code: 'H4', name: 'CS ➔ AT', description: 'Chất lượng nền tảng số nội bộ (CS) tác động thuận chiều đến khả năng triển khai nhanh các thay đổi (AT)', independent: 'CS', dependent: 'AT' }
    ]
  },
  lecturer_staff: {
    code: 'lecturer_staff',
    roleName: 'Giảng viên / Giáo viên / Nhân viên',
    badgeColor: '#7C2D12',
    badgeBg: '#FFEDD5',
    icon: Users,
    defaultTitle: 'Bộ 3: Giảng viên / Giáo viên / Nhân viên — Công cụ làm việc, phương pháp giảng dạy và văn hóa đổi mới',
    subtitle: 'Đánh giá trực tiếp: Công cụ làm việc, phương pháp giảng dạy, văn hóa đổi mới và sự hỗ trợ từ tổ chức',
    variables: 'SP, LD, DX, RO, CS, AT',
    defaultTarget: 150,
    questions: [
      { code: 'INFO_POSITION', text: 'Vị trí công tác', variable: 'INFO', type: 'choice', section: 'demographics', mapsTo: 'role', options: ['Giảng viên trực tiếp giảng dạy', 'Giáo viên / Trợ giảng', 'Chuyên viên / Nhân viên hành chính nghiệp vụ', 'Nghiên cứu viên'] },
      { code: 'INFO_EDUCATION', text: 'Trình độ chuyên môn cao nhất', variable: 'INFO', type: 'choice', section: 'demographics', mapsTo: 'education', options: ['Cử nhân / Kỹ sư', 'Thạc sĩ', 'Tiến sĩ', 'Phó Giáo sư / Giáo sư'] },
      { code: 'G3_SP01', text: 'Tôi nắm rõ mục tiêu, lộ trình chuyển đổi số của nhà trường cũng như vai trò cụ thể của bản thân trong tiến trình này.', variable: 'SP', type: 'likert', group: '1. Lập kế hoạch chiến lược phát triển (SP)' },
      { code: 'G3_LD01', text: 'Lãnh đạo đơn vị và nhà trường luôn lắng nghe phản hồi, ghi nhận nỗ lực và có chính sách khuyến khích thiết thực cho giảng viên/nhân viên khi đổi mới phương pháp làm việc.', variable: 'LD', type: 'likert', group: '2. Năng lực lãnh đạo số & quản trị (LD)' },
      { code: 'G3_DX01', text: 'Tôi thành thạo việc sử dụng các công cụ số, hệ thống quản lý học tập (LMS) hoặc phần mềm nghiệp vụ để tối ưu hóa công tác giảng dạy, nghiên cứu và hành chính.', variable: 'DX', type: 'likert', group: '3. Năng lực số hóa & đổi mới sáng tạo (DX)' },
      { code: 'G3_DX02', text: 'Việc ứng dụng công nghệ và dữ liệu số trong công việc hàng ngày giúp tôi nâng cao năng suất và chất lượng chuyên môn rõ rệt.', variable: 'DX', type: 'likert', group: '3. Năng lực số hóa & đổi mới sáng tạo (DX)' },
      { code: 'G3_RO01', text: 'Hạ tầng mạng, máy tính, phòng học thông minh và các công cụ làm việc số do nhà trường trang bị đáp ứng tốt nhu cầu thực tế của tôi.', variable: 'RO', type: 'likert', group: '4. Nguồn lực & cơ sở hạ tầng (RO)' },
      { code: 'G3_RO02', text: 'Nhà trường thường xuyên tổ chức các khóa tập huấn, bồi dưỡng kỹ năng số sát với nhu cầu thực tiễn công việc của giảng viên và nhân viên.', variable: 'RO', type: 'likert', group: '4. Nguồn lực & cơ sở hạ tầng (RO)' },
      { code: 'G3_CS01', text: 'Hệ thống phần mềm quản lý đào tạo, LMS và các cổng dịch vụ nội bộ của nhà trường có giao diện thân thiện, vận hành ổn định và ít xảy ra lỗi kỹ thuật.', variable: 'CS', type: 'likert', group: '5. Chất lượng dịch vụ & uy tín (CS)' },
      { code: 'G3_CS02', text: 'Bộ phận kỹ thuật và hành chính luôn hỗ trợ kịp thời, hiệu quả mỗi khi tôi gặp sự cố trong quá trình sử dụng các nền tảng số của nhà trường.', variable: 'CS', type: 'likert', group: '5. Chất lượng dịch vụ & uy tín (CS)' },
      { code: 'G3_AT01', text: 'Tôi sẵn sàng chủ động học hỏi các công nghệ mới (như trí tuệ nhân tạo, phân tích dữ liệu học tập) để đổi mới phương pháp giảng dạy hoặc quy trình làm việc.', variable: 'AT', type: 'likert', group: '6. Mức độ sẵn sàng chuyển đổi số (AT)' },
      { code: 'G3_AT02', text: 'Tôi cảm thấy tự tin và dễ dàng thích nghi trước những thay đổi về công nghệ và yêu cầu công việc tại nhà trường trong thời gian qua.', variable: 'AT', type: 'likert', group: '6. Mức độ sẵn sàng chuyển đổi số (AT)' },
      { code: 'G3_OPEN01', text: 'Những khó khăn, bất cập nào về hạ tầng công nghệ, phần mềm nghiệp vụ hoặc khối lượng công việc đang ảnh hưởng trực tiếp đến quá trình ứng dụng công nghệ số của Thầy/Cô/Anh/Chị?', variable: 'QUALITATIVE', type: 'textarea', placeholder: 'Ý kiến về hạ tầng, phần mềm, khối lượng công việc...' },
      { code: 'G3_OPEN02', text: 'Thầy/Cô/Anh/Chị mong muốn nhà trường bổ sung những công cụ, khóa đào tạo kỹ năng hoặc chính sách hỗ trợ nào để công tác giảng dạy/vận hành đạt hiệu quả cao hơn?', variable: 'QUALITATIVE', type: 'textarea', placeholder: 'Đề xuất công cụ, khóa đào tạo, chính sách hỗ trợ...' }
    ],
    hypotheses: [
      { code: 'H1', name: 'LD ➔ AT', description: 'Sự đồng hành, ghi nhận của lãnh đạo (LD) tác động thuận chiều đến tâm thế sẵn sàng thích ứng của cá nhân (AT)', independent: 'LD', dependent: 'AT' },
      { code: 'H2', name: 'RO ➔ DX', description: 'Hạ tầng, trang thiết bị và tập huấn (RO) tác động thuận chiều đến năng lực số cá nhân (DX)', independent: 'RO', dependent: 'DX' },
      { code: 'H3', name: 'CS ➔ DX', description: 'Chất lượng nền tảng số và hỗ trợ kỹ thuật (CS) tác động thuận chiều đến năng lực ứng dụng công nghệ (DX)', independent: 'CS', dependent: 'DX' },
      { code: 'H4', name: 'DX ➔ AT', description: 'Năng lực số cá nhân (DX) tác động thuận chiều đến sự tự tin và sẵn sàng thích ứng (AT)', independent: 'DX', dependent: 'AT' }
    ]
  },
  student_alumni: {
    code: 'student_alumni',
    roleName: 'Học sinh / Sinh viên / Cựu SV / Sau ĐH',
    badgeColor: '#4C1D95',
    badgeBg: '#EDE9FE',
    icon: GraduationCap,
    defaultTitle: 'Bộ 4: Người học & Cựu người học — Trải nghiệm dịch vụ đào tạo, môi trường và uy tín thương hiệu',
    subtitle: 'Đánh giá từ góc độ thụ hưởng: Trải nghiệm người học, chất lượng dịch vụ đào tạo, môi trường và giá trị thương hiệu',
    variables: 'SP, DX, RO, CS, AT',
    defaultTarget: 200,
    questions: [
      { code: 'INFO_POSITION', text: 'Đối tượng người học', variable: 'INFO', type: 'choice', section: 'demographics', mapsTo: 'role', options: ['Sinh viên đang theo học (Năm 1 - 2)', 'Sinh viên đang theo học (Năm 3 - 4)', 'Học viên Sau đại học (ThS, NCS)', 'Cựu người học / Cựu sinh viên'] },
      { code: 'INFO_MAJOR', text: 'Khối ngành đào tạo', variable: 'INFO', type: 'choice', section: 'demographics', mapsTo: 'major', options: ['Khoa học Tự nhiên & Kỹ thuật', 'Kinh tế, Quản trị & Luật', 'Khoa học Xã hội, Nhân văn & Sư phạm'] },
      { code: 'G4_SP01', text: 'Chương trình đào tạo và định hướng phát triển của nhà trường cập nhật kịp thời xu hướng công nghệ và đáp ứng tốt yêu cầu thực tiễn của thị trường lao động.', variable: 'SP', type: 'likert', group: '1. Lập kế hoạch chiến lược phát triển (SP)' },
      { code: 'G4_DX01', text: 'Giảng viên ứng dụng hiệu quả công nghệ số và các phương pháp giảng dạy linh hoạt (học tập kết hợp, tương tác trực tuyến) giúp nâng cao hiệu quả tiếp thu kiến thức.', variable: 'DX', type: 'likert', group: '2. Năng lực số hóa & đổi mới sáng tạo (DX)' },
      { code: 'G4_RO01', text: 'Cơ sở vật chất, phòng thực hành, thư viện số và đường truyền Internet/Wi-Fi tại trường đáp ứng tốt nhu cầu học tập và nghiên cứu của người học.', variable: 'RO', type: 'likert', group: '3. Nguồn lực & cơ sở hạ tầng (RO)' },
      { code: 'G4_RO02', text: 'Nguồn học liệu điện tử, giáo trình số và các phần mềm chuyên ngành do nhà trường cung cấp phong phú, dễ truy cập và hữu ích.', variable: 'RO', type: 'likert', group: '3. Nguồn lực & cơ sở hạ tầng (RO)' },
      { code: 'G4_CS01', text: 'Hệ thống quản lý học tập trực tuyến (LMS) hoạt động ổn định, thuận tiện cho việc theo dõi bài giảng, nộp bài tập và tương tác với giảng viên.', variable: 'CS', type: 'likert', group: '4. Chất lượng dịch vụ & uy tín (CS)' },
      { code: 'G4_CS02', text: 'Các thủ tục hành chính và dịch vụ học vụ trực tuyến (đăng ký học phần, xin giấy xác nhận, tra cứu điểm, đóng học phí) được xử lý nhanh chóng, minh bạch.', variable: 'CS', type: 'likert', group: '4. Chất lượng dịch vụ & uy tín (CS)' },
      { code: 'G4_CS03', text: 'Cổng thông tin người học và các ứng dụng di động của nhà trường cung cấp thông tin chính xác, kịp thời và dễ sử dụng.', variable: 'CS', type: 'likert', group: '4. Chất lượng dịch vụ & uy tín (CS)' },
      { code: 'G4_CS04', text: 'Các kênh tiếp nhận phản hồi và hỗ trợ người học trực tuyến giải đáp thắc mắc, xử lý sự cố kỹ thuật nhanh chóng và thỏa đáng.', variable: 'CS', type: 'likert', group: '4. Chất lượng dịch vụ & uy tín (CS)' },
      { code: 'G4_AT01', text: 'Môi trường học tập số của nhà trường giúp tôi rèn luyện tốt kỹ năng tự học, tư duy số và khả năng thích ứng với môi trường làm việc hiện đại.', variable: 'AT', type: 'likert', group: '5. Mức độ sẵn sàng chuyển đổi số (AT)' },
      { code: 'G4_AT02', text: 'Tôi hài lòng với tốc độ đổi mới chất lượng đào tạo và dịch vụ hỗ trợ người học của nhà trường trước các xu hướng giáo dục mới.', variable: 'AT', type: 'likert', group: '5. Mức độ sẵn sàng chuyển đổi số (AT)' },
      { code: 'G4_OPEN01', text: 'Trong quá trình học tập và sử dụng các dịch vụ trực tuyến (hệ thống LMS, cổng thông tin, thủ tục hành chính, Wi-Fi/thiết bị), Bạn gặp phải những bất tiện hoặc lỗi kỹ thuật nào gây ảnh hưởng nhiều nhất đến trải nghiệm của mình?', variable: 'QUALITATIVE', type: 'textarea', placeholder: 'Ý kiến về LMS, cổng thông tin, thủ tục hành chính, Wi-Fi...' },
      { code: 'G4_OPEN02', text: 'Bạn có đề xuất cải tiến cụ thể nào về phương pháp giảng dạy số, hệ thống công nghệ hoặc dịch vụ hỗ trợ để nâng cao chất lượng học tập tại nhà trường?', variable: 'QUALITATIVE', type: 'textarea', placeholder: 'Đề xuất cải tiến phương pháp giảng dạy, công nghệ, dịch vụ hỗ trợ...' }
    ],
    hypotheses: [
      { code: 'H1', name: 'RO ➔ CS', description: 'Cơ sở vật chất và học liệu số (RO) tác động thuận chiều đến chất lượng dịch vụ/hệ thống hỗ trợ người học (CS)', independent: 'RO', dependent: 'CS' },
      { code: 'H2', name: 'CS ➔ AT', description: 'Chất lượng dịch vụ hỗ trợ người học (CS) tác động thuận chiều đến mức độ hài lòng và sẵn sàng thích ứng (AT)', independent: 'CS', dependent: 'AT' },
      { code: 'H3', name: 'DX ➔ AT', description: 'Ứng dụng công nghệ và phương pháp giảng dạy số (DX) tác động thuận chiều đến khả năng tự học và thích ứng của người học (AT)', independent: 'DX', dependent: 'AT' }
    ]
  }
};

const SAMPLE_QUESTIONS = {
  SP: [
    { code: 'SP1', text: 'Đơn vị/Nhà trường có chiến lược rõ ràng, gắn kết chặt chẽ với chuyển đổi số và năng lực cạnh tranh.', variable: 'SP', type: 'likert' },
    { code: 'SP2', text: 'Mục tiêu chiến lược được rà soát, cập nhật linh hoạt theo biến động thực tế.', variable: 'SP', type: 'likert' }
  ],
  LD: [
    { code: 'LD1', text: 'Lãnh đạo thể hiện năng lực dẫn dắt đổi mới và ra quyết định dựa trên dữ liệu.', variable: 'LD', type: 'likert' },
    { code: 'LD2', text: 'Cơ chế phân quyền, trao quyền tự chủ được thiết lập rõ ràng, minh bạch.', variable: 'LD', type: 'likert' }
  ],
  DX: [
    { code: 'DX1', text: 'Các quy trình đã được số hóa, tinh gọn và vận hành đồng bộ trên nền tảng số.', variable: 'DX', type: 'likert' },
    { code: 'DX2', text: 'Việc ứng dụng công nghệ số giúp nâng cao hiệu quả và năng suất công việc.', variable: 'DX', type: 'likert' }
  ],
  RO: [
    { code: 'RO1', text: 'Nguồn lực tài chính, nhân sự và hạ tầng đáp ứng tốt yêu cầu chuyển đổi.', variable: 'RO', type: 'likert' },
    { code: 'RO2', text: 'Cơ sở vật chất, trang thiết bị số được đầu tư đầy đủ, ổn định.', variable: 'RO', type: 'likert' }
  ],
  CS: [
    { code: 'CS1', text: 'Hệ sinh thái dịch vụ số bảo đảm liên thông, an toàn và trải nghiệm tốt cho người dùng.', variable: 'CS', type: 'likert' },
    { code: 'CS2', text: 'Bộ phận hỗ trợ kỹ thuật phản hồi kịp thời, hiệu quả mỗi khi có sự cố.', variable: 'CS', type: 'likert' }
  ],
  AT: [
    { code: 'AT1', text: 'Tổ chức/cá nhân đạt mức độ sẵn sàng cao để thích ứng với các xu hướng mới.', variable: 'AT', type: 'likert' },
    { code: 'AT2', text: 'Có khả năng nhận diện sớm cơ hội, rủi ro và kịp thời điều chỉnh.', variable: 'AT', type: 'likert' }
  ]
};

const Surveys = () => {
  const { currentUser } = useAuth();
  const { selectedYearId } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc danh sách khảo sát theo Trường và Chức vụ
  const [filterInstitution, setFilterInstitution] = useState('all');
  const [filterAudience, setFilterAudience] = useState('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isQuestionBuilderOpen, setIsQuestionBuilderOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // QR Code Modal State
  const [qrModalSurvey, setQrModalSurvey] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Question builder tabs
  const [builderTab, setBuilderTab] = useState('questions'); // questions, hypotheses
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentHypotheses, setCurrentHypotheses] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCode, setNewQuestionCode] = useState('');
  const [newQuestionVar, setNewQuestionVar] = useState('SP');
  const [newQuestionType, setNewQuestionType] = useState('likert');

  // Form states cho Tạo mới / Chỉnh sửa
  const [selectedRoleTemplate, setSelectedRoleTemplate] = useState('leadership');
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    institution: 'Trường Đại học Lạc Hồng',
    audience: 'leadership',
    questions_count: 12,
    status: 'Active',
    scale: 'Likert 5',
    target: 50,
    variables: 'SP, LD, DX, RO, CS, AT',
    questions: [],
    hypotheses: []
  });

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const result = await surveysAPI.getAll();
      setSurveys(result);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      showToast('Không thể tải danh sách khảo sát', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  // Menu "Tạo bộ khảo sát" (Quản trị) điều hướng tới /surveys/new để tự
  // động mở modal khởi tạo ngay khi vào trang.
  useEffect(() => {
    if (location.pathname === '/surveys/new') {
      handleOpenCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Khi chọn một template bộ câu hỏi theo chức vụ
  const applyRoleTemplate = (roleKey, instName) => {
    const tmpl = ROLE_QUESTIONNAIRES[roleKey];
    setSelectedRoleTemplate(roleKey);
    const inst = instName !== undefined ? instName : formData.institution;
    if (tmpl) {
      setFormData(prev => ({
        ...prev,
        audience: roleKey,
        title: `${tmpl.defaultTitle} — ${inst || 'Trường Đại học'}`,
        subtitle: tmpl.subtitle,
        variables: tmpl.variables,
        target: tmpl.defaultTarget,
        questions_count: tmpl.questions.length,
        questions: tmpl.questions,
        hypotheses: tmpl.hypotheses
      }));
    } else {
      // Custom
      setFormData(prev => ({
        ...prev,
        audience: 'custom',
        title: prev.title || `Khảo sát chuyên đề — ${inst || 'Trường Đại học'}`,
        subtitle: 'Bảng hỏi khảo sát tự thiết kế tùy biến',
        variables: 'SP, LD, DX, RO, CS, AT',
        questions_count: 10,
        questions: [],
        hypotheses: []
      }));
    }
  };

  const handleOpenCreate = () => {
    const defaultInst = 'Trường Đại học Lạc Hồng';
    const tmpl = ROLE_QUESTIONNAIRES.leadership;
    setSelectedRoleTemplate('leadership');
    setFormData({
      title: `${tmpl.defaultTitle} — ${defaultInst}`,
      subtitle: tmpl.subtitle,
      institution: defaultInst,
      audience: 'leadership',
      questions_count: tmpl.questions.length,
      status: 'Active',
      scale: 'Likert 5',
      target: tmpl.defaultTarget,
      variables: tmpl.variables,
      questions: tmpl.questions,
      hypotheses: tmpl.hypotheses
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Vui lòng nhập tiêu đề khảo sát', 'error');
      return;
    }
    if (!formData.institution.trim()) {
      showToast('Vui lòng nhập tên Trường / Đơn vị khảo sát', 'error');
      return;
    }
    try {
      const created = await surveysAPI.create({ ...formData, academicYearId: selectedYearId });
      setSurveys([created, ...surveys]);
      setIsCreateOpen(false);

      // Tới từ menu "Tạo bộ khảo sát" (Quản trị) -> nối tiếp sang popup
      // Thiết kế bộ câu hỏi & Giả thuyết SEM để rà soát/chỉnh sửa ngay.
      if (location.pathname === '/surveys/new') {
        navigate('/surveys', { replace: true });
        setSelectedSurvey(created);
        setCurrentQuestions(created.questions || []);
        setCurrentHypotheses(created.hypotheses || []);
        setBuilderTab('questions');
        setIsQuestionBuilderOpen(true);
        showToast(`Đã tạo bộ khảo sát cho ${formData.institution}! Tiếp tục rà soát bộ câu hỏi & giả thuyết bên dưới.`);
      } else {
        showToast(`Đã tạo thành công bộ khảo sát cho ${formData.institution}!`);
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi tạo khảo sát', 'error');
    }
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    if (location.pathname === '/surveys/new') {
      navigate('/surveys', { replace: true });
    }
  };

  const handleOpenEdit = (survey) => {
    setSelectedSurvey(survey);
    setSelectedRoleTemplate(survey.audience || 'custom');
    setFormData({
      title: survey.title,
      subtitle: survey.subtitle || '',
      institution: survey.institution || 'Cơ sở giáo dục đại học',
      audience: survey.audience || 'custom',
      questions_count: survey.questions_count,
      status: survey.status,
      scale: survey.scale,
      target: survey.target,
      variables: Array.isArray(survey.variables) ? survey.variables.join(', ') : (survey.variables || ''),
      questions: survey.questions || [],
      hypotheses: survey.hypotheses || []
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSurvey) return;
    try {
      const updated = await surveysAPI.update(selectedSurvey.id, formData);
      setSurveys(surveys.map(s => s.id === updated.id ? updated : s));
      setIsEditOpen(false);
      setSelectedSurvey(null);
      showToast('Cập nhật khảo sát thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật khảo sát', 'error');
    }
  };

  // Nút đổi trạng thái nhanh trực tiếp trên bảng
  const handleToggleStatus = async (survey) => {
    if (currentUser?.role === 'viewer') return;
    const nextStatus = survey.status === 'Active' ? 'Closed' : (survey.status === 'Closed' ? 'Draft' : 'Active');
    try {
      await surveysAPI.updateStatus(survey.id, nextStatus);
      setSurveys(surveys.map(s => s.id === survey.id ? { ...s, status: nextStatus } : s));
      showToast(`Đã đổi trạng thái khảo sát thành: ${nextStatus === 'Active' ? 'Đang mở' : (nextStatus === 'Closed' ? 'Đã đóng' : 'Bản nháp')}`);
    } catch (err) {
      showToast('Không thể đổi trạng thái', 'error');
    }
  };

  // Mở modal tạo mã QR code
  const handleOpenQRModal = async (survey) => {
    setQrModalSurvey(survey);
    setCopiedLink(false);
    setShortUrl('');

    let linkToEncode = `${window.location.origin}/survey/${survey.id}`;
    try {
      const code = await shortLinksAPI.getOrCreate(survey.id);
      const short = `${window.location.origin}/s/${code}`;
      setShortUrl(short);
      linkToEncode = short;
    } catch (err) {
      console.error('Error creating short link, falling back to full URL:', err);
    }

    try {
      const url = await QRCode.toDataURL(linkToEncode, {
        width: 280,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(url);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl || !qrModalSurvey) return;
    const link = document.createElement('a');
    link.download = `QR_KhaoSat_${qrModalSurvey.id}_${qrModalSurvey.institution || 'Edu'}.png`;
    link.href = qrCodeDataUrl;
    link.click();
    showToast('Đã tải xuống ảnh mã QR (.png)!');
  };

  const handleCopySurveyLink = (surveyId) => {
    const url = shortUrl || `${window.location.origin}/survey/${surveyId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('Đã sao chép đường dẫn khảo sát vào Clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Nhân bản khảo sát 1-Click
  const handleCloneSurvey = async (survey) => {
    if (currentUser?.role === 'viewer') return;
    try {
      const cloned = await surveysAPI.clone(survey.id);
      setSurveys([cloned, ...surveys]);
      showToast(`Đã nhân bản thành công bảng hỏi: ${cloned.title}!`);
    } catch (err) {
      showToast(err.message || 'Lỗi khi nhân bản bảng hỏi', 'error');
    }
  };

  // Xem trước khảo sát (Preview mode)
  const handlePreviewSurvey = (surveyId) => {
    window.open(`/survey/${surveyId}?preview=true`, '_blank');
  };

  // Mở modal Thiết kế câu hỏi & Khai báo giả thuyết
  const handleOpenQuestionBuilder = (survey) => {
    setSelectedSurvey(survey);
    setCurrentQuestions(survey.questions || []);
    setCurrentHypotheses(survey.hypotheses || []);
    setBuilderTab('questions');
    setIsQuestionBuilderOpen(true);
  };

  // Nạp nguyên vẹn một bộ câu hỏi mẫu vào bảng hỏi
  const handleLoadFullRoleQuestions = (roleKey) => {
    const tmpl = ROLE_QUESTIONNAIRES[roleKey];
    if (!tmpl) return;
    setCurrentQuestions(tmpl.questions);
    setCurrentHypotheses(tmpl.hypotheses);
    showToast(`Đã nạp trọn bộ ${tmpl.questions.length} câu hỏi & ${tmpl.hypotheses.length} giả thuyết của ${tmpl.roleName}!`);
  };

  // Sinh câu hỏi mẫu theo biến
  const handleGenerateSampleQuestions = (varName) => {
    const samples = SAMPLE_QUESTIONS[varName] || [
      { code: `${varName}1`, text: `Nhận định 1 của nhân tố ${varName} trong thực tế.`, variable: varName, type: 'likert' },
      { code: `${varName}2`, text: `Nhận định 2 của nhân tố ${varName} trong thực tế.`, variable: varName, type: 'likert' }
    ];

    const existingCodes = currentQuestions.map(q => q.code);
    const toAdd = samples.filter(s => !existingCodes.includes(s.code));

    if (toAdd.length === 0) {
      showToast(`Các câu hỏi mẫu của biến ${varName} đã có trong bảng hỏi!`, 'info');
      return;
    }

    setCurrentQuestions([...currentQuestions, ...toAdd]);
    showToast(`Đã tự động sinh ${toAdd.length} câu hỏi mẫu chuẩn cho biến ${varName}!`);
  };

  // Thêm câu hỏi tùy chỉnh
  const handleAddCustomQuestion = () => {
    if (!newQuestionText.trim()) {
      showToast('Vui lòng nhập nội dung câu hỏi', 'error');
      return;
    }
    const defaultPrefix = newQuestionType === 'textarea' || newQuestionType === 'text' ? 'TXT' : newQuestionVar;
    const code = newQuestionCode.trim() || `${defaultPrefix}${currentQuestions.length + 1}`;
    const newQ = {
      code,
      text: newQuestionText.trim(),
      variable: newQuestionType === 'textarea' || newQuestionType === 'text' ? 'QUALITATIVE' : newQuestionVar,
      type: newQuestionType
    };
    setCurrentQuestions([...currentQuestions, newQ]);
    setNewQuestionText('');
    setNewQuestionCode('');
    showToast(`Đã thêm câu hỏi ${code}!`);
  };

  // Xóa câu hỏi
  const handleDeleteQuestion = (index) => {
    const updated = currentQuestions.filter((_, i) => i !== index);
    setCurrentQuestions(updated);
  };

  // Thêm giả thuyết nghiên cứu
  const handleAddHypothesis = (indVar, depVar) => {
    const code = `H${currentHypotheses.length + 1}`;
    const newHypo = {
      code,
      name: `${indVar} ➔ ${depVar}`,
      description: `Nhân tố ${indVar} có tác động tích cực và có ý nghĩa thống kê đến ${depVar}`,
      independent: indVar,
      dependent: depVar
    };
    setCurrentHypotheses([...currentHypotheses, newHypo]);
    showToast(`Đã khai báo giả thuyết ${code}!`);
  };

  // Lưu cấu hình câu hỏi và giả thuyết vào CSDL
  const handleSaveQuestionBuilder = async () => {
    if (!selectedSurvey) return;
    try {
      const updated = await surveysAPI.update(selectedSurvey.id, {
        questions: currentQuestions,
        questions_count: currentQuestions.length,
        hypotheses: currentHypotheses
      });
      setSurveys(surveys.map(s => s.id === updated.id ? updated : s));
      setIsQuestionBuilderOpen(false);
      showToast('Đã lưu thiết kế câu hỏi & giả thuyết nghiên cứu vào CSDL!');
    } catch (err) {
      showToast('Lỗi khi lưu bộ câu hỏi', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await surveysAPI.delete(id);
      setSurveys(surveys.filter(s => s.id !== id));
      setDeleteConfirmId(null);
      showToast('Đã xóa khảo sát thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa khảo sát', 'error');
    }
  };

  const handleShare = async (survey) => {
    let shareUrl = `${window.location.origin}/survey/${survey.id}`;
    try {
      const code = await shortLinksAPI.getOrCreate(survey.id);
      shareUrl = `${window.location.origin}/s/${code}`;
    } catch (err) {
      console.error('Error creating short link, falling back to full URL:', err);
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast(`Đã sao chép link khảo sát: ${survey.title}!`);
    } else {
      showToast(`Link khảo sát: ${shareUrl}`);
    }
  };

  const handleAnalyze = (survey) => {
    navigate(`/analytics?surveyId=${survey.id}`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return <span className="badge badge-success" title="Bấm để chuyển trạng thái">Đang mở (Active)</span>;
      case 'Draft': return <span className="badge badge-neutral" title="Bấm để chuyển trạng thái">Nháp (Draft)</span>;
      case 'Closed': return <span className="badge badge-warning" title="Bấm để chuyển trạng thái">Đã đóng (Closed)</span>;
      default: return null;
    }
  };

  const getRoleBadge = (audience) => {
    const tmpl = ROLE_QUESTIONNAIRES[audience];
    if (tmpl) {
      return (
        <span style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600', backgroundColor: tmpl.badgeBg, color: tmpl.badgeColor, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <tmpl.icon size={12} />
          {tmpl.roleName}
        </span>
      );
    }
    return (
      <span style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '500', backgroundColor: '#F3F4F6', color: '#4B5563' }}>
        Khảo sát chung
      </span>
    );
  };

  // Danh sách các trường có trong DB để lọc
  const uniqueInstitutions = Array.from(new Set(surveys.map(s => s.institution).filter(Boolean)));

  // Lọc khảo sát — tất cả dữ liệu khảo sát đi theo năm học chọn trên Topbar
  const filteredSurveys = surveys.filter(s => {
    const matchInst = filterInstitution === 'all' || s.institution === filterInstitution;
    const matchAud = filterAudience === 'all' || s.audience === filterAudience;
    const matchYear = !selectedYearId || !s.academic_year_id || s.academic_year_id === selectedYearId;
    return matchInst && matchAud && matchYear;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div style={{ color: 'var(--text-muted)' }}>Đang tải danh sách bảng hỏi...</div>
      </div>
    );
  }

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      {/* HEADER & NÚT TẠO MỚI */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Bảng hỏi khảo sát
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Quản trị 4 bộ câu hỏi theo chức vụ, định danh theo trường/đơn vị và khai báo giả thuyết mô hình SEM
          </p>
        </div>
        {currentUser?.role !== 'viewer' && (
          <button className="btn btn-primary" onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} />
            Tạo bảng hỏi mới
          </button>
        )}
      </div>

      {/* THANH BỘ LỌC ĐỊNH DANH THEO TRƯỜNG & CHỨC VỤ */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'white', padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600' }}>
          <Filter size={16} /> Bộ lọc:
        </div>

        {/* Lọc theo Trường / Cơ sở */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={16} color="var(--primary)" />
          <select 
            className="input" 
            style={{ minWidth: '220px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            value={filterInstitution}
            onChange={(e) => setFilterInstitution(e.target.value)}
          >
            <option value="all">-- Tất cả Trường / Cơ sở ({surveys.length}) --</option>
            {uniqueInstitutions.map(inst => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
        </div>

        {/* Lọc theo Bộ chức vụ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={16} color="#059669" />
          <select 
            className="input" 
            style={{ minWidth: '220px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            value={filterAudience}
            onChange={(e) => setFilterAudience(e.target.value)}
          >
            <option value="all">-- Tất cả nhóm chức vụ --</option>
            <option value="leadership">Bộ 1: Ban Giám hiệu & Hội đồng trường</option>
            <option value="dept_head">Bộ 2: Trưởng / Phó Khoa, Phòng / Ban</option>
            <option value="lecturer_staff">Bộ 3: Giảng viên / Giáo viên / Nhân viên</option>
            <option value="student_alumni">Bộ 4: Người học & Cựu người học</option>
          </select>
        </div>

        {(filterInstitution !== 'all' || filterAudience !== 'all') && (
          <button 
            className="btn btn-outline" 
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            onClick={() => { setFilterInstitution('all'); setFilterAudience('all'); }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {filteredSurveys.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FileSpreadsheet size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Chưa có bảng hỏi nào phù hợp</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '400px' }}>
            Không tìm thấy bảng hỏi nào khớp với bộ lọc hiện tại. Hãy chọn bộ lọc khác hoặc tạo bảng hỏi mới!
          </p>
          {currentUser?.role !== 'viewer' && (
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <Plus size={18} />
              Tạo khảo sát ngay
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead style={{ backgroundColor: '#F9FAFB' }}>
                <tr>
                  <th>Tiêu đề &amp; Đơn vị định danh</th>
                  <th>Đối tượng chức vụ</th>
                  <th>Trạng thái</th>
                  <th>Thang đo</th>
                  <th>Tiến độ mẫu (N)</th>
                  <th>Biến nghiên cứu</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredSurveys.map((survey) => (
                  <tr key={survey.id}>
                    <td>
                      <div style={{ fontWeight: '600', marginBottom: '0.35rem', color: '#1E293B' }}>{survey.title}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                        {/* THẺ ĐỊNH DANH TRƯỜNG / ĐƠN VỊ */}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.5rem', backgroundColor: '#F3E8FF', color: '#6B21A8', borderRadius: '4px', fontWeight: '600' }}>
                          <Building2 size={12} />
                          {survey.institution || 'Cơ sở giáo dục đại học'}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span style={{ color: 'var(--text-muted)' }}>{survey.questions_count} câu hỏi</span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span style={{ color: 'var(--text-muted)' }}>{(survey.hypotheses || []).length} giả thuyết SEM</span>
                      </div>
                    </td>
                    <td>
                      {getRoleBadge(survey.audience)}
                    </td>
                    <td>
                      <button 
                        onClick={() => handleToggleStatus(survey)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: currentUser?.role !== 'viewer' ? 'pointer' : 'default' }}
                      >
                        {getStatusBadge(survey.status)}
                      </button>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#EFF6FF', color: '#3B82F6', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '500' }}>
                        {survey.scale}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                        {survey.responses_count} / {survey.target}
                      </div>
                      <div style={{ width: '100px', height: '5px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${Math.min(100, (survey.responses_count / (survey.target || 1)) * 100)}%`, 
                            height: '100%', 
                            backgroundColor: survey.responses_count >= survey.target ? '#10B981' : 'var(--primary)', 
                            borderRadius: '3px' 
                          }}
                        ></div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {Array.isArray(survey.variables) && survey.variables.map(v => (
                          <span key={v} style={{ fontSize: '0.65rem', border: '1px solid var(--border-color)', borderRadius: '3px', padding: '0.1rem 0.3rem', color: '#475569', backgroundColor: '#F8FAFC', fontWeight: '600' }}>
                            {v}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* NÚT PHÂN TÍCH 5 KHÂU APA 7 */}
                        <Link 
                          to={`/analytics?surveyId=${survey.id}`}
                          className="btn-outline" 
                          style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: '#047857', backgroundColor: 'var(--primary-tint)', borderColor: 'var(--primary-tint-border)', display: 'inline-flex', alignItems: 'center' }} 
                          title="Phân tích thống kê 5 khâu chuẩn APA 7 cho khảo sát này"
                        >
                          <BarChart2 size={16} />
                        </Link>

                        {/* NÚT THIẾT KẾ CÂU HỎI & GIẢ THUYẾT */}
                        <button 
                          className="btn-outline" 
                          style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)', backgroundColor: 'var(--primary-tint)', borderColor: 'var(--primary-tint-border)' }} 
                          title="Thiết kế bộ câu hỏi & Khai báo giả thuyết"
                          onClick={() => handleOpenQuestionBuilder(survey)}
                        >
                          <ListPlus size={16} />
                        </button>


                        {/* NÚT MÃ QR CODE */}
                        <button 
                          className="btn-outline" 
                          style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: '#0284C7', backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }} 
                          title="Tạo mã QR Code để quét điện thoại"
                          onClick={() => handleOpenQRModal(survey)}
                        >
                          <QrCode size={16} />
                        </button>

                        {/* NÚT XEM TRƯỚC (PREVIEW) */}
                        <button 
                          className="btn-outline" 
                          style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: '#059669', backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }} 
                          title="Xem trước biểu mẫu khảo sát (Preview)"
                          onClick={() => handlePreviewSurvey(survey.id)}
                        >
                          <Eye size={16} />
                        </button>

                        {/* NÚT NHÂN BẢN (CLONE) 1-CLICK */}
                        {currentUser?.role !== 'viewer' && (
                          <button 
                            className="btn-outline" 
                            style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: '#D97706', backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }} 
                            title="Nhân bản bảng hỏi (Clone)"
                            onClick={() => handleCloneSurvey(survey)}
                          >
                            <Copy size={16} />
                          </button>
                        )}

                        {currentUser?.role !== 'viewer' && (
                          <button 
                            className="btn-outline" 
                            style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }} 
                            title="Chỉnh sửa thông tin"
                            onClick={() => handleOpenEdit(survey)}
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        <button 
                          className="btn-outline" 
                          style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }} 
                          title="Sao chép link khảo sát"
                          onClick={() => handleShare(survey)}
                        >
                          <Share2 size={16} />
                        </button>
                        <button 
                          className="btn-outline" 
                          style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: '#8B5CF6' }} 
                          title="Phân tích dữ liệu học thuật"
                          onClick={() => handleAnalyze(survey)}
                        >
                          <BarChart2 size={16} />
                        </button>
                        {currentUser?.role !== 'viewer' && (
                          <button 
                            className="btn-outline" 
                            style={{ padding: '0.35rem', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }} 
                            title="Xóa khảo sát"
                            onClick={() => setDeleteConfirmId(survey.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL TẠO MỚI BẢNG HỎI (HỖ TRỢ THEO CHỨC VỤ & ĐƠN VỊ ĐỊNH DANH) */}
      {/* ========================================================= */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={closeCreateModal}>
          <div className="modal-content" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Khởi tạo Bảng hỏi Khảo sát mới</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Lựa chọn bộ mẫu chuẩn hóa theo chức vụ và định danh theo trường/cơ sở giáo dục để thu thập xử lý
                </p>
              </div>
              <button className="modal-close-btn" onClick={closeCreateModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                
                {/* 1. CHỌN MẪU BỘ CÂU HỎI THEO CHỨC VỤ */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} color="var(--primary)" />
                    Bước 1: Chọn Bộ câu hỏi chuẩn hóa theo Chức vụ / Đối tượng:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                    {Object.keys(ROLE_QUESTIONNAIRES).map((roleKey) => {
                      const tmpl = ROLE_QUESTIONNAIRES[roleKey];
                      const isSelected = selectedRoleTemplate === roleKey;
                      const IconComp = tmpl.icon;

                      return (
                        <div
                          key={roleKey}
                          onClick={() => applyRoleTemplate(roleKey)}
                          style={{
                            padding: '0.875rem 1rem',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                            backgroundColor: isSelected ? '#EFF6FF' : '#F9FAFB',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <div style={{ padding: '0.35rem', borderRadius: '6px', backgroundColor: tmpl.badgeBg, color: tmpl.badgeColor }}>
                              <IconComp size={16} />
                            </div>
                            <span style={{ fontWeight: '700', fontSize: '0.875rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                              {tmpl.roleName}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                            {tmpl.subtitle}
                          </div>
                          <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '600' }}>
                            ✓ 10 câu Likert + 2 câu mở định tính
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. ĐỊNH DANH THEO TRƯỜNG / ĐƠN VỊ ĐIỀN */}
                <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={16} color="var(--primary)" />
                    Bước 2: Tên Trường / Đơn vị thực hiện khảo sát (Định danh dữ liệu) *
                  </label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="VD: Trường Đại học Sư phạm Hà Nội, Trường ĐH Bách Khoa..." 
                    value={formData.institution}
                    onChange={(e) => {
                      const newInst = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        institution: newInst,
                        title: selectedRoleTemplate && ROLE_QUESTIONNAIRES[selectedRoleTemplate] 
                          ? `${ROLE_QUESTIONNAIRES[selectedRoleTemplate].defaultTitle} — ${newInst || 'Trường Đại học'}`
                          : prev.title
                      }));
                    }}
                    required
                  />
                  <span className="form-hint">Mọi phiếu phản hồi thu thập sẽ được gắn định danh vào trường/cơ sở này để phục vụ phân tích so sánh và làm sạch dữ liệu.</span>
                </div>

                {/* 3. TIÊU ĐỀ & MÔ TẢ CHI TIẾT */}
                <div className="form-group">
                  <label className="form-label">Tiêu đề bảng hỏi khảo sát *</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mục tiêu &amp; Phạm vi nghiên cứu (Subtitle)</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Thang đo đo lường</label>
                    <select 
                      className="input"
                      value={formData.scale}
                      onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                    >
                      <option value="Likert 5">Likert 5 mức độ (Chuẩn)</option>
                      <option value="Likert 7">Likert 7 mức độ</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mục tiêu số mẫu (N)</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={formData.target}
                      onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 50 })}
                      min="10"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Trạng thái khởi tạo</label>
                    <select 
                      className="input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Đang mở (Active)</option>
                      <option value="Draft">Bản nháp (Draft)</option>
                      <option value="Closed">Đã đóng (Closed)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Các biến nghiên cứu trong mô hình</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                  />
                </div>

                {/* XEM TRƯỚC SỐ CÂU HỎI ĐÃ NẠP TỰ ĐỘNG */}
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#ECFDF5', borderRadius: '6px', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: '#065F46', fontWeight: '600' }}>
                    ✓ Đã tự động nạp {formData.questions.length} câu hỏi &amp; {formData.hypotheses.length} giả thuyết SEM cho bộ này.
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#047857' }}>
                    Có thể tùy biến thêm bớt trong mục Thiết kế câu hỏi sau khi tạo.
                  </span>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeCreateModal}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  Tạo khảo sát
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CHỈNH SỬA BẢNG HỎI */}
      {/* ========================================================= */}
      {isEditOpen && selectedSurvey && (
        <div className="modal-backdrop" onClick={() => setIsEditOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Chỉnh sửa bảng hỏi #{selectedSurvey.id}</h2>
              <button className="modal-close-btn" onClick={() => setIsEditOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên Trường / Đơn vị khảo sát (Định danh) *</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tiêu đề khảo sát *</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mục tiêu &amp; Phạm vi (Subtitle)</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Nhóm chức vụ / Đối tượng</label>
                    <select
                      className="input"
                      value={formData.audience}
                      onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    >
                      <option value="leadership">Ban Giám hiệu &amp; Hội đồng trường</option>
                      <option value="dept_head">Trưởng / Phó Khoa, Phòng / Ban</option>
                      <option value="lecturer_staff">Giảng viên / Giáo viên / Nhân viên</option>
                      <option value="student_alumni">Học sinh / Sinh viên / Cựu SV / Sau ĐH</option>
                      <option value="custom">Tùy chỉnh khác</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mục tiêu số mẫu (N)</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={formData.target}
                      onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Thang đo đo lường</label>
                    <select 
                      className="input"
                      value={formData.scale}
                      onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                    >
                      <option value="Likert 5">Likert 5 mức độ</option>
                      <option value="Likert 7">Likert 7 mức độ</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Trạng thái</label>
                    <select 
                      className="input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Đang mở (Active)</option>
                      <option value="Draft">Bản nháp (Draft)</option>
                      <option value="Closed">Đã đóng (Closed)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Các biến nghiên cứu</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsEditOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL THIẾT KẾ BỘ CÂU HỎI & KHAI BÁO GIẢ THUYẾT */}
      {/* ========================================================= */}
      {isQuestionBuilderOpen && selectedSurvey && (
        <div className="modal-backdrop" onClick={() => setIsQuestionBuilderOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '840px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Thiết kế bộ câu hỏi: {selectedSurvey.title}</h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span>Trường: <strong>{selectedSurvey.institution || 'Chung'}</strong></span>
                  <span>•</span>
                  <span>Thang đo: {selectedSurvey.scale}</span>
                  <span>•</span>
                  <span>Tổng số: {currentQuestions.length} câu hỏi</span>
                  <span>•</span>
                  <span>{currentHypotheses.length} giả thuyết SEM</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsQuestionBuilderOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: '#F9FAFB', padding: '0 1.5rem' }}>
              <button
                onClick={() => setBuilderTab('questions')}
                style={{
                  padding: '0.75rem 1.25rem',
                  fontWeight: builderTab === 'questions' ? '700' : '500',
                  color: builderTab === 'questions' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: builderTab === 'questions' ? '2px solid var(--primary)' : '2px solid transparent',
                  background: 'none'
                }}
              >
                1. Bộ câu hỏi nghiên cứu ({currentQuestions.length})
              </button>
              <button
                onClick={() => setBuilderTab('hypotheses')}
                style={{
                  padding: '0.75rem 1.25rem',
                  fontWeight: builderTab === 'hypotheses' ? '700' : '500',
                  color: builderTab === 'hypotheses' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: builderTab === 'hypotheses' ? '2px solid var(--primary)' : '2px solid transparent',
                  background: 'none'
                }}
              >
                2. Khai báo Giả thuyết SEM ({currentHypotheses.length})
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '62vh', overflowY: 'auto' }}>
              {builderTab === 'questions' ? (
                <div>
                  {/* THANH NẠP NHANH TRỌN BỘ CÂU HỎI THEO CHỨC VỤ */}
                  <div style={{ padding: '0.875rem 1rem', backgroundColor: '#F0FDF4', borderRadius: 'var(--radius-md)', border: '1px solid #BBF7D0', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <CheckCircle size={16} color="#16A34A" />
                      <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#15803D' }}>
                        Nạp nhanh trọn bộ 10 câu Likert theo nhóm chức vụ:
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', backgroundColor: 'white', color: '#1E3A8A', border: '1px solid #BFDBFE' }}
                        onClick={() => handleLoadFullRoleQuestions('leadership')}
                      >
                        Nạp Bộ 1 (BGH &amp; Hội đồng trường)
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', backgroundColor: 'white', color: '#065F46', border: '1px solid #A7F3D0' }}
                        onClick={() => handleLoadFullRoleQuestions('dept_head')}
                      >
                        Nạp Bộ 2 (Trưởng/Phó Khoa, Phòng)
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', backgroundColor: 'white', color: '#7C2D12', border: '1px solid #FED7AA' }}
                        onClick={() => handleLoadFullRoleQuestions('lecturer_staff')}
                      >
                        Nạp Bộ 3 (Giảng viên &amp; CBNV)
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', backgroundColor: 'white', color: '#4C1D95', border: '1px solid #DDD6FE' }}
                        onClick={() => handleLoadFullRoleQuestions('student_alumni')}
                      >
                        Nạp Bộ 4 (Người học &amp; Cựu SV)
                      </button>
                    </div>
                  </div>

                  {/* TÍNH NĂNG SINH THEO TỪNG BIẾN */}
                  <div style={{ padding: '0.875rem 1rem', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-md)', border: '1px solid #BFDBFE', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#1E40AF', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Hoặc chèn câu hỏi đo lường theo từng biến nghiên cứu:
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {['SP', 'LD', 'DX', 'RO', 'CS', 'AT'].map(v => (
                        <button
                          key={v}
                          type="button"
                          className="btn"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', backgroundColor: 'white', color: '#1E40AF', border: '1px solid #93C5FD' }}
                          onClick={() => handleGenerateSampleQuestions(v)}
                        >
                          + Biến <strong>{v}</strong>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FORM THÊM CÂU HỎI TÙY CHỈNH */}
                  <div style={{ padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem', display: 'block', marginBottom: '0.75rem' }}>
                      Thêm câu hỏi tùy chỉnh mới:
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 140px 100px 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <select 
                        className="input" 
                        value={newQuestionVar}
                        onChange={(e) => setNewQuestionVar(e.target.value)}
                        title="Thuộc biến nghiên cứu"
                      >
                        {['SP', 'LD', 'DX', 'RO', 'CS', 'AT', 'QUALITATIVE', 'KHAC'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>

                      <select
                        className="input"
                        value={newQuestionType}
                        onChange={(e) => setNewQuestionType(e.target.value)}
                        title="Loại câu hỏi"
                      >
                        <option value="likert">Thang đo Likert</option>
                        <option value="textarea">Tự luận (Văn bản)</option>
                        <option value="text">Câu trả lời ngắn</option>
                        <option value="choice">Một lựa chọn</option>
                      </select>

                      <input 
                        type="text" 
                        className="input" 
                        placeholder="Mã (STR3/TXT)" 
                        value={newQuestionCode}
                        onChange={(e) => setNewQuestionCode(e.target.value)}
                      />

                      <input 
                        type="text" 
                        className="input" 
                        placeholder={newQuestionType === 'textarea' ? 'VD: Ý kiến nhận xét, đề xuất của bạn...' : 'Nội dung câu hỏi khảo sát...'} 
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomQuestion(); } }}
                      />

                      <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={handleAddCustomQuestion}
                      >
                        Thêm
                      </button>
                    </div>
                  </div>

                  {/* DANH SÁCH CÂU HỎI HIỆN TẠI */}
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.75rem', display: 'block' }}>
                      Danh sách câu hỏi trong bảng ({currentQuestions.length} câu):
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {currentQuestions.map((q, idx) => {
                        const isText = q.type === 'textarea' || q.type === 'text';
                        const typeLabel = q.type === 'textarea' ? 'Tự luận' : (q.type === 'text' ? 'Text ngắn' : (q.type === 'choice' ? 'Trắc nghiệm' : 'Likert'));
                        const typeBadgeStyle = isText
                          ? { backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }
                          : (q.type === 'choice' ? { backgroundColor: '#F3E8FF', color: '#6B21A8' } : { backgroundColor: 'var(--primary-tint)', color: '#065F46' });

                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'white', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                              <span style={{ fontWeight: '700', fontSize: '0.8rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--primary-tint)', color: 'var(--primary)', borderRadius: '4px', minWidth: '50px', textAlign: 'center' }}>
                                {q.code}
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.15rem 0.5rem', borderRadius: '4px', ...typeBadgeStyle }}>
                                {typeLabel}
                              </span>
                              {q.variable && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: '#F9FAFB' }}>
                                  {q.variable}
                                </span>
                              )}
                              <span style={{ fontSize: '0.875rem', color: 'var(--text-main)', flex: 1 }}>{q.text}</span>
                            </div>
                            <button 
                              type="button" 
                              style={{ color: 'var(--danger)', padding: '0.25rem', background: 'none' }}
                              onClick={() => handleDeleteQuestion(idx)}
                              title="Xóa câu hỏi này"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* TAB GIẢ THUYẾT NGHIÊN CỨU SEM */
                <div>
                  <div style={{ padding: '1rem', backgroundColor: '#F0FDF4', borderRadius: 'var(--radius-md)', border: '1px solid #BBF7D0', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <CheckCircle size={18} color="#16A34A" />
                      <span style={{ fontWeight: '700', fontSize: '0.875rem', color: '#15803D' }}>
                        Khai báo giả thuyết nghiên cứu (Mô hình SEM):
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#15803D', marginBottom: '0.75rem' }}>
                      Các giả thuyết này sẽ được sử dụng trực tiếp trong tab Kiểm định giả thuyết (Phân tích hồi quy &amp; PLS-SEM):
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: '0.75rem', backgroundColor: 'white', color: '#15803D', border: '1px solid #86EFAC' }}
                        onClick={() => handleAddHypothesis('SP', 'AT')}
                      >
                        + Khai báo H: SP ➔ AT
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: '0.75rem', backgroundColor: 'white', color: '#15803D', border: '1px solid #86EFAC' }}
                        onClick={() => handleAddHypothesis('LD', 'AT')}
                      >
                        + Khai báo H: LD ➔ AT
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: '0.75rem', backgroundColor: 'white', color: '#15803D', border: '1px solid #86EFAC' }}
                        onClick={() => handleAddHypothesis('DX', 'CS')}
                      >
                        + Khai báo H: DX ➔ CS
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: '0.75rem', backgroundColor: 'white', color: '#15803D', border: '1px solid #86EFAC' }}
                        onClick={() => handleAddHypothesis('RO', 'AT')}
                      >
                        + Khai báo H: RO ➔ AT
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: '0.75rem', backgroundColor: 'white', color: '#15803D', border: '1px solid #86EFAC' }}
                        onClick={() => handleAddHypothesis('RO', 'DX')}
                      >
                        + Khai báo H: RO ➔ DX
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {currentHypotheses.map((h, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{h.code}:</span>
                            <span style={{ fontWeight: '600' }}>{h.name}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.description}</div>
                        </div>
                        <button 
                          type="button" 
                          style={{ color: 'var(--danger)', padding: '0.25rem', background: 'none' }}
                          onClick={() => setCurrentHypotheses(currentHypotheses.filter((_, i) => i !== idx))}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setIsQuestionBuilderOpen(false)}>
                Đóng
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveQuestionBuilder}>
                Lưu cấu hình câu hỏi &amp; giả thuyết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL MÃ QR CODE */}
      {/* ========================================================= */}
      {qrModalSurvey && (
        <div className="modal-backdrop" onClick={() => setQrModalSurvey(null)}>
          <div className="modal-content" style={{ maxWidth: '460px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Mã QR khảo sát</h2>
              <button className="modal-close-btn" onClick={() => setQrModalSurvey(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#F3E8FF', color: '#6B21A8', borderRadius: '4px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Building2 size={12} />
                  {qrModalSurvey.institution || 'Cơ sở giáo dục đại học'}
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                {qrModalSurvey.title}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Người tham gia chỉ cần mở Camera điện thoại hoặc Zalo quét mã dưới đây để vào làm bài ngay lập tức:
              </p>

              {qrCodeDataUrl && (
                <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '12px', border: '2px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '1.25rem' }}>
                  <img src={qrCodeDataUrl} alt="Mã QR Khảo sát" style={{ width: '220px', height: '220px', display: 'block' }} />
                </div>
              )}

              <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <input
                  type="text"
                  readOnly
                  value={shortUrl || `${window.location.origin}/survey/${qrModalSurvey.id}`}
                  style={{ flex: 1, background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--text-main)', outline: 'none' }}
                />
                <button 
                  type="button" 
                  className="btn" 
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', backgroundColor: copiedLink ? '#10B981' : 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  onClick={() => handleCopySurveyLink(qrModalSurvey.id)}
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  {copiedLink ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setQrModalSurvey(null)}>
                Đóng
              </button>
              <button type="button" className="btn btn-primary" onClick={handleDownloadQR}>
                <Download size={16} /> Tải ảnh QR (.png)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA */}
      {deleteConfirmId && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', paddingTop: '2rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Xác nhận xóa bảng hỏi?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Hành động này sẽ xóa vĩnh viễn bảng hỏi cùng tất cả các dữ liệu phản hồi liên quan đã thu thập. Không thể hoàn tác!
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setDeleteConfirmId(null)}>
                Hủy bỏ
              </button>
              <button 
                className="btn" 
                style={{ backgroundColor: '#EF4444', color: 'white' }}
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Surveys;
