const http = require('http');

async function run() {
  console.log('===============================================================');
  console.log('KIỂM THỬ HỆ THỐNG ĐIỀU HÀNH CÔNG VĂN & LUẬN CHUYỂN PHÊ DUYỆT');
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

  // 1. Auth check
  const pct = (await req('/api/auth/quick-switch', 'POST', { username: 'phochutich' })).body;
  const ct = (await req('/api/auth/quick-switch', 'POST', { username: 'chutich' })).body;
  const cb = (await req('/api/auth/quick-switch', 'POST', { username: 'canbo_vp' })).body;
  console.log('✓ Xác thực tài khoản nhanh: Phó Chủ tịch, Chủ tịch, Cán bộ Văn phòng');

  // 2. Phó Chủ tịch soạn công văn -> Gửi thẳng Chủ tịch
  const pctDoc = (await req('/api/doc-out', 'POST', {
    doc_type: 'Tờ trình',
    subject: 'Tờ trình xin phê duyệt phương án đảm bảo an ninh trật tự Lễ hội Triều Khúc',
    recipient_unit: 'Chủ tịch UBND xã Tân Triều',
    signer_title: 'Chủ tịch UBND xã',
    priority: 'urgent',
    content: 'Kính trình đồng chí Chủ tịch phê duyệt kế hoạch...',
    action_type: 'submit'
  }, pct.token)).body;

  console.log(`✓ Phó Chủ tịch tạo & trình công văn ID ${pctDoc.id}: ${pctDoc.message}`);

  const detailDoc = (await req(`/api/doc-out/${pctDoc.id}`, 'GET', null, ct.token)).body;
  if (detailDoc.current_approver_id !== ct.user.id) {
    throw new Error(`Lỗi: Công văn do PCT soạn không gửi lên Chủ tịch mà gửi tới ${detailDoc.current_approver_id}`);
  }
  console.log(`✓ Người nhận duyệt được gán chính xác: ${detailDoc.current_approver_name} (Chủ tịch UBND xã)`);

  // Kiểm tra hộp thư Chờ tôi phê duyệt của PCT
  const pctInbox = (await req('/api/approvals/pending', 'GET', null, pct.token)).body;
  const foundSelf = pctInbox.find(d => d.id === pctDoc.id);
  if (foundSelf) {
    throw new Error('Lỗi: Công văn do PCT soạn lại xuất hiện trong hộp thư chờ duyệt của chính PCT!');
  }
  console.log('✓ Đã kiểm tra: Văn bản do Phó Chủ tịch soạn KHÔNG xuất hiện trong hộp thư chờ duyệt của PCT (tránh tự duyệt)');

  // Kiểm tra hộp thư Chờ tôi phê duyệt của Chủ tịch
  const ctInbox = (await req('/api/approvals/pending', 'GET', null, ct.token)).body;
  const foundInCt = ctInbox.find(d => d.id === pctDoc.id);
  if (!foundInCt) {
    throw new Error('Lỗi: Văn bản do PCT soạn không xuất hiện trong hộp thư chờ duyệt của Chủ tịch!');
  }
  console.log('✓ Đã kiểm tra: Văn bản do Phó Chủ tịch soạn ĐÃ NẰM trong hộp thư chờ duyệt của Chủ tịch UBND xã');

  // 3. Chủ tịch phê duyệt văn bản của Phó Chủ tịch
  const approveRes = (await req(`/api/doc-out/${pctDoc.id}/approve`, 'POST', {
    comment: 'Đồng ý phê duyệt phương án. Giao Công an xã phối hợp triển khai.'
  }, ct.token)).body;
  console.log(`✓ Chủ tịch phê duyệt thành công: ${approveRes.message}`);

  const detailApproved = (await req(`/api/doc-out/${pctDoc.id}`, 'GET', null, ct.token)).body;
  if (detailApproved.status !== 'approved') {
    throw new Error(`Lỗi: Trạng thái văn bản không phải 'approved', mà là ${detailApproved.status}`);
  }
  console.log(`✓ Trạng thái công văn chuyển sang: ${detailApproved.status} (Sẵn sàng phát hành)`);

  // 4. Cán bộ văn phòng phát hành công văn
  const publishRes = (await req(`/api/doc-out/${pctDoc.id}/publish`, 'POST', {}, cb.token)).body;
  console.log(`✓ Bộ phận Văn thư phát hành chính thức: Số ${publishRes.official_number}`);

  // 5. Cán bộ soạn công văn -> Mặc định gửi Phó Chủ tịch thẩm định Cấp 1
  const cbDoc = (await req('/api/doc-out', 'POST', {
    doc_type: 'Báo cáo',
    subject: 'Báo cáo kết quả rà soát trật tự đô thị tuyến phố Yên Xá',
    recipient_unit: 'Lãnh đạo UBND xã',
    signer_title: 'Chủ tịch UBND xã',
    priority: 'normal',
    content: 'Báo cáo số liệu kiểm tra xử lý vi phạm...',
    action_type: 'submit'
  }, cb.token)).body;
  const detailCbDoc = (await req(`/api/doc-out/${cbDoc.id}`, 'GET', null, pct.token)).body;
  if (detailCbDoc.current_approver_id !== pct.user.id) {
    throw new Error(`Lỗi: Công văn do Cán bộ soạn không gửi tới PCT thẩm định cấp 1`);
  }
  console.log(`✓ Cán bộ soạn văn bản ID ${cbDoc.id} được gửi chính xác tới Phó Chủ tịch thẩm định Cấp 1 (${detailCbDoc.current_approver_name})`);

  // 6. Chủ tịch trực tiếp soạn công văn -> Ký duyệt trực tiếp
  const ctDoc = (await req('/api/doc-out', 'POST', {
    doc_type: 'Quyết định',
    subject: 'Quyết định khen thưởng đột xuất các tập thể, cá nhân có thành tích xuất sắc',
    recipient_unit: 'Các ban ngành, đoàn thể và thôn xóm',
    signer_title: 'Chủ tịch UBND xã',
    priority: 'urgent',
    content: 'Chủ tịch ký duyệt ban hành...',
    action_type: 'submit'
  }, ct.token)).body;
  const detailCtDoc = (await req(`/api/doc-out/${ctDoc.id}`, 'GET', null, ct.token)).body;
  if (detailCtDoc.status !== 'approved') {
    throw new Error(`Lỗi: Công văn do Chủ tịch trực tiếp soạn khi submit phải chuyển sang 'approved'`);
  }
  console.log(`✓ Công văn ID ${ctDoc.id} do Chủ tịch soạn khi submit đã ký duyệt trực tiếp (Trạng thái: ${detailCtDoc.status})`);

  console.log('===============================================================');
  console.log('KẾT QUẢ: 100% CÁC QUY TRÌNH HÀNH CHÍNH THEO VAI TRÒ ĐỀU CHÍNH XÁC!');
  console.log('===============================================================');
}

run().catch(err => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
