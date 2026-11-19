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
