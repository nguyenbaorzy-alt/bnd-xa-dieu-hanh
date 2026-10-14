const http = require('http');

async function testAlgoEngine() {
  console.log('========================================================================');
  console.log(' KIỂM THỬ THUẬT TOÁN ĐỘC QUYỀN B-ALGO™ & AI KPI ALGORITHM ENGINE');
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

  // 1. Login as Chairman (Admin/Leader)
  const ctAuth = (await req('/api/auth/quick-switch', 'POST', { username: 'chutich' })).body;
  if (!ctAuth.token) {
    throw new Error('Đăng nhập thất bại!');
  }
  console.log('✓ Đăng nhập thành công với vai trò Lãnh đạo.');

  // 2. Test GET /api/kpi/algo/current
  const currentAlgoRes = await req('/api/kpi/algo/current', 'GET', null, ctAuth.token);
  if (currentAlgoRes.status !== 200 || !currentAlgoRes.body.data) {
    throw new Error('Lỗi lấy cấu hình thuật toán hiện tại!');
  }
  console.log(`✓ Lấy thuật toán hiện tại thành công: [${currentAlgoRes.body.data.mode}] - ${currentAlgoRes.body.data.name}`);
  console.log(`  LaTeX: ${currentAlgoRes.body.data.latex_formula}`);

  // 3. Test POST /api/kpi/algo/generate with preset
  const genPresetRes = await req('/api/kpi/algo/generate', 'POST', {
    mode: 'discipline',
    prompt: 'Siết chặt kỷ cương, phạt nặng trễ hạn 35% mỗi ngày, không ân hạn'
  }, ctAuth.token);
  if (genPresetRes.status !== 200 || !genPresetRes.body.data || genPresetRes.body.data.penalty_rate_per_day !== 0.35) {
    throw new Error('Lỗi sinh thuật toán chế độ Kỷ luật nghiêm ngặt!');
  }
  console.log(`✓ AI sinh thuật toán kỷ cương thành công. Phạt: ${genPresetRes.body.data.penalty_rate_per_day * 100}%/ngày`);

  // 4. Test POST /api/kpi/algo/generate with custom prompt
  const genCustomRes = await req('/api/kpi/algo/generate', 'POST', {
    mode: 'custom',
    prompt: 'Khen thưởng cao hoàn thành trước hạn 15%, phạt trễ 20%, ân hạn 1 ngày'
  }, ctAuth.token);
  if (genCustomRes.status !== 200 || !genCustomRes.body.data) {
    throw new Error('Lỗi sinh thuật toán tùy biến!');
  }
  console.log(`✓ AI bóc tách chỉ đạo & tự sinh thuật toán tùy biến thành công!`);
  console.log(`  Tên thuật toán: ${genCustomRes.body.data.name}`);
  console.log(`  Phạt trễ: ${genCustomRes.body.data.penalty_rate_per_day * 100}%/ngày, Thưởng sớm: ${genCustomRes.body.data.early_bonus_rate * 100}%/ngày`);

  // 5. Test POST /api/kpi/algo/apply
  const applyRes = await req('/api/kpi/algo/apply', 'POST', {
    algoConfig: genCustomRes.body.data
  }, ctAuth.token);
  if (applyRes.status !== 200 || !applyRes.body.data) {
    throw new Error('Lỗi áp dụng thuật toán vào hệ thống!');
  }
  console.log('✓ Kích hoạt và lưu vết áp dụng thuật toán vào hệ sinh thái BAO-WORK thành công!');

  // Reset back to standard balanced mode so all tests pass cleanly
  const resetAlgo = {
    mode: 'balanced',
    name: 'Mô hình Cân bằng Chuẩn Hà Nội (Hanoi Standard Balance)',
    version: '2.5.0-BaoAlgo',
    penalty_rate_per_day: 0.25,
    early_bonus_rate: 0.05,
    max_penalty_cap: 1.0,
    grace_period_days: 0,
    complexity_multiplier: true
  };
  await req('/api/kpi/algo/apply', 'POST', { algoConfig: resetAlgo }, ctAuth.token);
  console.log('✓ Đã khôi phục cấu hình thuật toán chuẩn (25%/ngày) để đảm bảo tương thích mọi quy trình.');

  console.log('\n========================================================================');
  console.log(' TẤT CẢ CÁC BƯỚC TEST B-ALGO™ ENGINE ĐÃ HOÀN TOÀN ĐẠT CHUẨN 100%!');
  console.log('========================================================================\n');
}

testAlgoEngine().catch(err => {
  console.error('❌ Kiểm thử B-Algo thất bại:', err);
  process.exit(1);
});
