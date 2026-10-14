const http = require('http');

async function testEditReason() {
  console.log('===============================================================');
  console.log('KIỂM THỬ HIỂN THỊ LÝ DO YÊU CẦU CHỈNH SỬA VĂN BẢN');
  console.log('===============================================================');

  const req = (path, method = 'GET', body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const r = http.request(`http://localhost:3001${path}`, { method, headers }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });
      r.on('error', reject);
      if (body) r.write(JSON.stringify(body));
      r.end();
    });
  };

  // 1. Đăng nhập Cán bộ Địa chính và Phó Chủ tịch
  const cb = (await req('/api/auth/quick-switch', 'POST', { username: 'canbo_dc' })).body;
  const pct = (await req('/api/auth/quick-switch', 'POST', { username: 'phochutich' })).body;

  // 2. Kiểm tra văn bản mẫu số 6 (đang trong trạng thái needs_edit)
  const doc6Detail = (await req('/api/doc-out/6', 'GET', null, cb.token)).body;
  console.log('✓ Chi tiết văn bản 6:', doc6Detail.subject);
  console.log('  Trạng thái:', doc6Detail.status);
  console.log('  Lý do yêu cầu sửa trả về từ API:', doc6Detail.latest_edit_reason);
  console.log('  Người yêu cầu:', doc6Detail.edit_requested_by);
  console.log('  Chức vụ người yêu cầu:', doc6Detail.edit_requested_by_position);

  if (!doc6Detail.latest_edit_reason || !doc6Detail.latest_edit_reason.includes('phụ lục 02')) {
    throw new Error('Lỗi: Lý do yêu cầu chỉnh sửa không được trả về chính xác!');
  }
  console.log('✓ Kiểm tra dữ liệu lý do sửa mẫu số 6: CHÍNH XÁC 100%');

  // 3. Kiểm tra danh sách công văn đi trả về lý do sửa
  const docList = (await req('/api/doc-out?status=needs_edit', 'GET', null, cb.token)).body;
  const docInList = docList.find(d => d.id === 6);
  if (!docInList || !docInList.latest_edit_reason) {
    throw new Error('Lỗi: Danh sách công văn đi không kèm lý do yêu cầu sửa!');
  }
  console.log('✓ Danh sách công văn đi chứa lý do sửa hiển thị trực tiếp cho người dùng');

  // 4. Tạo công văn mới và thử nghiệm quy trình yêu cầu chỉnh sửa thực tế
  const newDoc = (await req('/api/doc-out', 'POST', {
    doc_type: 'Kế hoạch',
    subject: 'Kế hoạch tổng kiểm tra ATTP tại các bếp ăn trường học học kỳ I năm học 2026',
    recipient_unit: 'Các trường Mầm non, Tiểu học, THCS trên địa bàn xã',
    signer_title: 'Chủ tịch UBND xã',
    priority: 'urgent',
    content: 'Dự thảo kế hoạch kiểm tra ATTP...',
    action_type: 'submit'
  }, cb.token)).body;
  console.log(`✓ Cán bộ tạo và nộp công văn ID ${newDoc.id}`);

  // Phó Chủ tịch yêu cầu chỉnh sửa kèm lý do chi tiết
  const editReasonText = 'Đề nghị bổ sung thành phần tham gia có đại diện Trạm Y tế xã và Hội Phụ huynh học sinh, đồng thời quy định cụ thể thời gian kiểm tra đột xuất.';
  const reqEditRes = (await req(`/api/doc-out/${newDoc.id}/request-edit`, 'POST', {
    comment: editReasonText
  }, pct.token)).body;
  console.log(`✓ Lãnh đạo gửi yêu cầu chỉnh sửa: ${reqEditRes.message}`);

  // Kiểm tra chi tiết văn bản sau khi bị yêu cầu sửa
  const newDocAfter = (await req(`/api/doc-out/${newDoc.id}`, 'GET', null, cb.token)).body;
  if (newDocAfter.status !== 'needs_edit') {
    throw new Error(`Lỗi: Trạng thái không phải needs_edit, hiện tại là ${newDocAfter.status}`);
  }
  if (newDocAfter.latest_edit_reason !== editReasonText) {
    throw new Error(`Lỗi: Lý do chỉnh sửa không khớp! Nhận: ${newDocAfter.latest_edit_reason}`);
  }
  console.log(`✓ Văn bản ID ${newDoc.id} ghi nhận chính xác lý do yêu cầu sửa: "${newDocAfter.latest_edit_reason}"`);
  console.log(`  Bởi lãnh đạo: ${newDocAfter.edit_requested_by} (${newDocAfter.edit_requested_by_position}) lúc ${newDocAfter.edit_requested_at}`);

  // Cán bộ cập nhật và nộp lại
  const updateRes = (await req(`/api/doc-out/${newDoc.id}`, 'PUT', {
    doc_type: 'Kế hoạch',
    subject: 'Kế hoạch tổng kiểm tra ATTP tại các bếp ăn trường học học kỳ I năm học 2026 (Đã cập nhật theo chỉ đạo)',
    recipient_unit: 'Các trường Mầm non, Tiểu học, THCS trên địa bàn xã',
    signer_title: 'Chủ tịch UBND xã',
    priority: 'urgent',
    content: 'Đã bổ sung Trạm Y tế và Hội Phụ huynh theo đúng chỉ đạo của Phó Chủ tịch.'
  }, cb.token)).body;
  console.log(`✓ Cán bộ cập nhật nội dung văn bản: ${updateRes.message}`);

  const reSubmitRes = (await req(`/api/doc-out/${newDoc.id}/submit`, 'POST', {
    comment: 'Đã bổ sung Trạm Y tế và đại diện Phụ huynh theo đúng yêu cầu chỉ đạo của Lãnh đạo.'
  }, cb.token)).body;
  console.log(`✓ Cán bộ trình duyệt lại văn bản: ${reSubmitRes.message}`);

  // Phó Chủ tịch xem lại và phê duyệt thành công
  const approveRes = (await req(`/api/doc-out/${newDoc.id}/approve`, 'POST', {
    comment: 'Nội dung đã chỉnh sửa đầy đủ, đạt yêu cầu. Đồng ý chuyển Chủ tịch ký.'
  }, pct.token)).body;
  console.log(`✓ Lãnh đạo phê duyệt văn bản sau chỉnh sửa: ${approveRes.message}`);

  console.log('===============================================================');
  console.log('KẾT QUẢ: 100% CÁC BƯỚC XỬ LÝ VÀ HIỂN THỊ LÝ DO SỬA ĐỀU HOÀN HẢO!');
  console.log('===============================================================');
}

testEditReason().catch(err => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
