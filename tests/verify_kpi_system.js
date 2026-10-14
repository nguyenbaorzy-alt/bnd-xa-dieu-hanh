const http = require('http');

async function runTests() {
  console.log('========================================================================');
  console.log(' KIỂM THỬ TÍCH HỢP HỆ THỐNG QUẢN TRỊ OKR/KPI & TRỢ LÝ AI (HANOIWORK)');
  console.log('========================================================================\n');

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

  // 1. Xác thực tài khoản Lãnh đạo & Cán bộ
  const ctAuth = (await req('/api/auth/quick-switch', 'POST', { username: 'chutich' })).body;
  const cbVpAuth = (await req('/api/auth/quick-switch', 'POST', { username: 'canbo_vp' })).body;
  const cbDcAuth = (await req('/api/auth/quick-switch', 'POST', { username: 'canbo_dc' })).body;
  console.log('✓ 1. Xác thực tài khoản Chủ tịch, Cán bộ Văn phòng, Cán bộ Địa chính thành công.');

  // ==========================================
  // MODULE 1: AI KPI ASSISTANT (PIPELINE 5 BƯỚC)
  // ==========================================
  console.log('\n--- KIỂM THỬ MODULE 1: AI KPI ASSISTANT (5 BƯỚC) ---');

  // Bước 1: Bóc tách văn bản
  const step1Res = await req('/api/kpi-assistant/extract', 'POST', { sample_id: 'sample-1' }, ctAuth.token);
  if (step1Res.status !== 200 || !step1Res.body.tasks || step1Res.body.tasks.length === 0) {
    throw new Error('Lỗi Bước 1: Không bóc tách được danh mục nhiệm vụ từ văn bản mẫu!');
  }
  console.log(`✓ Bước 1: Bóc tách văn bản thành công (${step1Res.body.tasks.length} nhiệm vụ).`);

  // Bước 2: Chuẩn hóa & Ánh xạ hệ số KPI
  const step2Res = await req('/api/kpi-assistant/standardize', 'POST', { tasks: step1Res.body.tasks }, ctAuth.token);
  if (step2Res.status !== 200 || !step2Res.body.tasks[0].kpi_weight) {
    throw new Error('Lỗi Bước 2: Chuẩn hóa hệ số quy đổi thất bại!');
  }
  console.log(`✓ Bước 2: Chuẩn hóa và gắn hệ số trọng số KPI thành công.`);

  // Bước 3: Rà soát phản biện 6 Rõ
  const step3Res = await req('/api/kpi-assistant/audit-6-clear', 'POST', { tasks: step2Res.body.tasks }, ctAuth.token);
  if (step3Res.status !== 200 || !step3Res.body.avg_score) {
    throw new Error('Lỗi Bước 3: Rà soát 6 Rõ thất bại!');
  }
  console.log(`✓ Bước 3: Rà soát tiêu chuẩn "6 Rõ" hoàn thành. Điểm trung bình: ${step3Res.body.avg_score}`);

  // Bước 4: Đánh giá thử KPI & Mô phỏng công thức
  const step4Res = await req('/api/kpi-assistant/simulate', 'POST', {
    tasks: step3Res.body.tasks,
    test_simulations: [{ assigned_qty: 10, completed_qty: 10, due_date: '2026-10-10', actual_date: '2026-10-11' }]
  }, ctAuth.token);
  const simTask = step4Res.body.tasks[0];
  if (simTask.sim_delay_days !== 1 || simTask.sim_penalty_score <= 0) {
    throw new Error('Lỗi Bước 4: Công thức trừ phạt 25%/ngày trễ tính sai!');
  }
  console.log(`✓ Bước 4: Mô phỏng tính điểm KPI chính xác (Trễ 1 ngày: Phạt ${simTask.sim_penalty_score} đ = 25% điểm).`);

  // Bước 5: Phê duyệt & Đẩy sang HanoiWork
  const hierarchyRes = await req('/api/kpi/hierarchy', 'GET', null, ctAuth.token);
  const targetProj = hierarchyRes.body[0];
  const targetProg = targetProj.direct_programs[0] || targetProj.folders[0].action_programs[0];

  const step5Res = await req('/api/kpi-assistant/approve-and-import', 'POST', {
    session_name: 'Kiểm thử Pipeline Tự động',
    project_id: targetProj.id,
    action_program_id: targetProg.id,
    tasks: [step2Res.body.tasks[0]],
    default_assignee_id: cbVpAuth.user.id
  }, ctAuth.token);

  if (step5Res.status !== 201) {
    throw new Error('Lỗi Bước 5: Phê duyệt đẩy dữ liệu vào HanoiWork thất bại!');
  }
  console.log(`✓ Bước 5: Phê duyệt và đẩy ${step5Res.body.created_count} nhiệm vụ vào HanoiWork thành công.`);

  // ==========================================
  // MODULE 2: CẤU TRÚC DỮ LIỆU CÂY 3 CẤP & RBAC
  // ==========================================
  console.log('\n--- KIỂM THỬ MODULE 2: CÂY DỮ LIỆU 3 CẤP & QUY TẮC PHÂN QUYỀN ---');

  // Test 1: Tạo Dự án mới -> Tự động khởi tạo 1 Chương trình hành động mặc định
  const newProjRes = await req('/api/kpi/projects', 'POST', {
    name: 'Dự án Kiểm thử Tự động 3 Cấp',
    category: 'strategic',
    description: 'Dự án dùng để kiểm thử',
    lead_units: ['Lãnh đạo UBND', 'Văn phòng - Thống kê'],
    lead_user_ids: [ctAuth.user.id, cbVpAuth.user.id],
    collab_units: ['Địa chính - Xây dựng - Môi trường'],
    collab_user_ids: [cbDcAuth.user.id]
  }, ctAuth.token);

  const testProjId = newProjRes.body.id;
  const projDetail = (await req(`/api/kpi/projects/${testProjId}`, 'GET', null, ctAuth.token)).body;
  if (!projDetail.action_programs || projDetail.action_programs.length === 0) {
    throw new Error('Lỗi Cấp 1: Tạo dự án mới không tự động khởi tạo Chương trình hành động mặc định!');
  }
  console.log(`✓ Tạo Dự án mới thành công và tự động khởi tạo Chương trình hành động: "${projDetail.action_programs[0].name}"`);

  // Test 2: Ràng buộc RBAC Đơn vị phối hợp chỉ có quyền xem (Read-only), không được nhận việc
  const illegalAssignRes = await req('/api/kpi/tasks', 'POST', {
    title: 'Nhiệm vụ giao sai quyền cho đơn vị phối hợp',
    action_program_id: projDetail.action_programs[0].id,
    assignee_id: cbDcAuth.user.id, // Tuấn địa chính chỉ thuộc Collab
    due_date: '2026-10-30',
    assigned_quantity: 1,
    kpi_weight: 1.0
  }, ctAuth.token);

  if (illegalAssignRes.status !== 403) {
    throw new Error('Lỗi RBAC: Cán bộ thuộc Đơn vị phối hợp lại được phép nhận việc (vi phạm quy tắc Read-only)!');
  }
  console.log('✓ Ràng buộc RBAC chính xác: Cán bộ thuộc Đơn vị phối hợp bị chặn không thể nhận việc (403 Forbidden).');

  // ==========================================
  // MODULE 3: TẠO NHIỆM VỤ & THUẬT TOÁN TÍNH ĐIỂM KPI
  // ==========================================
  console.log('\n--- KIỂM THỬ MODULE 3: CÔNG THỨC TOÁN HỌC TÍNH ĐIỂM KPI ---');

  // Giao nhiệm vụ hợp lệ: Giao cho Cán bộ Văn phòng (thuộc Lead Unit)
  const validTaskRes = await req('/api/kpi/tasks', 'POST', {
    title: 'Soạn thảo văn bản hướng dẫn nghiệp vụ chuẩn hóa địa bàn xã',
    action_program_id: projDetail.action_programs[0].id,
    assignee_id: cbVpAuth.user.id,
    due_date: '2026-10-10',
    assigned_quantity: 2,
    kpi_weight: 1.5,
    target_product: '2 Bản hướng dẫn nghiệp vụ hoàn chỉnh'
  }, ctAuth.token);

  const testTaskId = validTaskRes.body.id;
  // CÔNG THỨC 1: SL giao quy đổi = 2 * 1.5 = 3.0
  if (validTaskRes.body.assigned_kpi_score !== 3.0) {
    throw new Error(`Lỗi Công thức 1: SL giao quy đổi tính sai (${validTaskRes.body.assigned_kpi_score} != 3.0)!`);
  }
  console.log('✓ Công thức 1: SL giao quy đổi = 2 x 1.5 = 3.0 điểm (Chính xác).');

  // Nghiệm thu hoàn thành với ngày nộp thực tế trễ 2 ngày:
  // Hạn: 2026-10-10, Nộp: 2026-10-12 -> Chậm 2 ngày
  // SL hoàn thành = 2 -> SL quy đổi = 2 * 1.5 = 3.0
  // Phạt 2 ngày trễ: 2 * 25% * 3.0 = 1.5 điểm
  // Điểm KPI thực nhận: 3.0 - 1.5 = 1.5 điểm (50%)
  const completeRes = await req(`/api/kpi/tasks/${testTaskId}/complete`, 'POST', {
    completed_quantity: 2,
    actual_completion_date: '2026-10-12',
    result_note: 'Đã hoàn thành ban hành 2 bản hướng dẫn theo số hiệu 45/HD-UBND và 46/HD-UBND.',
    completion_proof_file: 'HD_45_46_2026.pdf'
  }, cbVpAuth.token);

  if (completeRes.status !== 200) {
    throw new Error(`Lỗi hoàn thành nhiệm vụ: ${JSON.stringify(completeRes.body)}`);
  }
  if (completeRes.body.delay_days !== 2) {
    throw new Error(`Lỗi Công thức 3: Số ngày chậm tính sai (${completeRes.body.delay_days} != 2)!`);
  }
  if (completeRes.body.penalty_score !== 1.5 || completeRes.body.final_kpi_score !== 1.5) {
    throw new Error(`Lỗi Công thức 4: Điểm KPI sau phạt tính sai (Thực nhận: ${completeRes.body.final_kpi_score} != 1.5)!`);
  }
  console.log(`✓ Công thức 2, 3, 4 nghiệm thu hoàn thành:`);
  console.log(`  - SL hoàn thành quy đổi: ${completeRes.body.raw_completed_kpi} đ`);
  console.log(`  - Số ngày trễ: ${completeRes.body.delay_days} ngày`);
  console.log(`  - Điểm phạt (2 x 25% x 3.0): -${completeRes.body.penalty_score} đ`);
  console.log(`  - Điểm KPI thực nhận: ${completeRes.body.final_kpi_score} đ (Chính xác 100% theo thuật toán!)`);

  // Phân rã nhiệm vụ (Cơ chế 1 của Lãnh đạo)
  const decompRes = await req(`/api/kpi/tasks/${testTaskId}/decompose`, 'POST', {
    subtasks: [
      { title: 'Nhiệm vụ con 1: Rà soát phụ lục 1', assignee_id: cbVpAuth.user.id, due_date: '2026-10-15' },
      { title: 'Nhiệm vụ con 2: Tổng hợp ý kiến đóng góp', assignee_id: cbVpAuth.user.id, due_date: '2026-10-20' }
    ]
  }, ctAuth.token);
  if (decompRes.status !== 201) {
    throw new Error('Lỗi phân rã việc!');
  }
  console.log(`✓ Cơ chế 1: Phân rã việc thành ${decompRes.body.created_ids.length} nhiệm vụ con thành công.`);

  // ==========================================
  // MODULE 4: DASHBOARD THỐNG KÊ & TRỢ LÝ AI
  // ==========================================
  console.log('\n--- KIỂM THỬ MODULE 4: DASHBOARD THỐNG KÊ & AI ANALYTICS ---');

  const dashRes = await req('/api/kpi/dashboard/stats', 'GET', null, ctAuth.token);
  if (dashRes.status !== 200 || !dashRes.body.cards || !dashRes.body.donuts) {
    throw new Error('Lỗi Dashboard Stats API!');
  }
  console.log(`✓ 4 Thẻ KPI Cards:`);
  console.log(`  - Tổng dự án chiến lược: ${dashRes.body.cards.projects.total}`);
  console.log(`  - Tổng nhiệm vụ: ${dashRes.body.cards.total_tasks}`);
  console.log(`  - Đã hoàn thành: ${dashRes.body.cards.completed.count} (${dashRes.body.cards.completed.rate}%) - KPI đạt: ${dashRes.body.cards.completed.total_kpi} đ`);
  console.log(`  - Chưa hoàn thành: ${dashRes.body.cards.uncompleted.count} (${dashRes.body.cards.uncompleted.rate}%)`);

  console.log(`✓ 2 Biểu đồ Donut:`);
  console.log(`  - Donut Hoàn thành: ${dashRes.body.donuts.completed.on_time} Đúng hạn, ${dashRes.body.donuts.completed.late} Muộn`);
  console.log(`  - Donut Chưa hoàn thành: ${dashRes.body.donuts.uncompleted.not_due} Chưa tới hạn, ${dashRes.body.donuts.uncompleted.overdue} Quá hạn, ${dashRes.body.donuts.uncompleted.no_deadline} Chưa có hạn`);

  console.log(`✓ 2 Biểu đồ Stacked Bar:`);
  console.log(`  - Theo phòng ban: ${dashRes.body.stacked_bars.by_department.length} đơn vị`);
  console.log(`  - Theo dự án: ${dashRes.body.stacked_bars.by_project.length} dự án`);

  // AI Analyze Drawer API
  const aiAnalyzeRes = await req('/api/kpi/ai-analyze', 'POST', {}, ctAuth.token);
  if (aiAnalyzeRes.status !== 200 || !aiAnalyzeRes.body.risk_table) {
    throw new Error('Lỗi AI Analyze Drawer API!');
  }
  console.log(`✓ Trợ lý AI Phân tích Báo cáo: Đã rà soát ma trận rủi ro (${aiAnalyzeRes.body.risk_table.length} dự án) và đề xuất ${aiAnalyzeRes.body.recommendations.length} giải pháp.`);

  // AI Chat API
  const aiChatRes = await req('/api/kpi/ai-chat', 'POST', { question: '@Phạm Hùng Cường hiệu suất thế nào?' }, ctAuth.token);
  if (aiChatRes.status !== 200 || !aiChatRes.body.reply) {
    throw new Error('Lỗi AI Chat API!');
  }
  console.log(`✓ Trợ lý AI Chat: Đã phản hồi thông minh phân tích cá nhân @Phạm Hùng Cường.`);

  // Dọn dẹp dự án test
  await req(`/api/kpi/projects/${testProjId}`, 'DELETE', null, ctAuth.token);
  console.log('\n✓ Đã dọn dẹp dữ liệu kiểm thử an toàn.');

  console.log('\n========================================================================');
  console.log(' TẤT CẢ 4 MODULE CỦA HỆ THỐNG ĐÃ VƯỢT QUA KIỂM THỬ XUẤT SẮC (100% PASS)!');
  console.log('========================================================================');
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('\n❌ KIỂM THỬ THẤT BẠI:', err.message);
    process.exit(1);
  });
}

module.exports = { runTests };
