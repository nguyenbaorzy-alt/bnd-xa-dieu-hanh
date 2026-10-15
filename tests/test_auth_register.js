const http = require('http');

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

async function testAuth() {
  console.log('========================================================================');
  console.log('KIỂM THỬ CHỨC NĂNG ĐĂNG NHẬP & TẠO TÀI KHOẢN MỚI BẰNG TÀI KHOẢN / MẬT KHẨU');
  console.log('========================================================================');

  // Test 1: Đăng nhập tài khoản mẫu có sẵn
  console.log('\n--- 1. Kiểm tra đăng nhập tài khoản có sẵn ---');
  const loginAdmin = await req('/api/auth/login', 'POST', { username: 'admin', password: 'admin123' });
  if (loginAdmin.status !== 200 || !loginAdmin.body.token) {
    throw new Error('Đăng nhập admin thất bại: ' + JSON.stringify(loginAdmin.body));
  }
  console.log(`✓ Đăng nhập thành công Admin: ${loginAdmin.body.user.full_name} (${loginAdmin.body.user.role})`);

  const loginChutich = await req('/api/auth/login', 'POST', { username: 'chutich', password: '123456' });
  if (loginChutich.status !== 200 || !loginChutich.body.token) {
    throw new Error('Đăng nhập Chủ tịch thất bại: ' + JSON.stringify(loginChutich.body));
  }
  console.log(`✓ Đăng nhập thành công Chủ tịch: ${loginChutich.body.user.full_name} (${loginChutich.body.user.role})`);

  // Test 2: Đăng nhập với mật khẩu sai
  const loginFail = await req('/api/auth/login', 'POST', { username: 'admin', password: 'sai_mat_khau' });
  if (loginFail.status !== 401) {
    throw new Error('Lỗi: Hệ thống không chặn mật khẩu sai!');
  }
  console.log('✓ Chặn đăng nhập mật khẩu sai chính xác (401 Unauthorized)');

  // Test 3: Đăng ký tài khoản mới - kiểm tra validation
  console.log('\n--- 2. Kiểm tra xác thực khi đăng ký tài khoản mới ---');
  
  // Mật khẩu ngắn
  const regShortPass = await req('/api/auth/register', 'POST', {
    username: 'test_user_' + Date.now(),
    password: '123',
    confirm_password: '123',
    full_name: 'Người dùng thử nghiệm'
  });
  if (regShortPass.status !== 400) {
    throw new Error('Lỗi: Không chặn mật khẩu dưới 6 ký tự!');
  }
  console.log('✓ Chặn mật khẩu quá ngắn (< 6 ký tự)');

  // Mật khẩu không khớp
  const regMismatch = await req('/api/auth/register', 'POST', {
    username: 'test_user_' + Date.now(),
    password: 'password123',
    confirm_password: 'different_pass',
    full_name: 'Người dùng thử nghiệm'
  });
  if (regMismatch.status !== 400) {
    throw new Error('Lỗi: Không chặn mật khẩu xác nhận không khớp!');
  }
  console.log('✓ Chặn mật khẩu xác nhận không khớp');

  // Test 4: Đăng ký thành công tài khoản Người dân (Kèm xác minh SMS OTP)
  console.log('\n--- 3. Đăng ký tài khoản Người dân mới (Kèm xác minh SMS OTP) ---');
  const citizenPhone = '0912' + Math.floor(100000 + Math.random() * 900000);
  const otpRes1 = await req('/api/auth/send-otp', 'POST', { phone: citizenPhone });
  const otpCode1 = otpRes1.body.simulated_sms?.otp_code;
  const verRes1 = await req('/api/auth/verify-otp', 'POST', { phone: citizenPhone, otp_code: otpCode1 });

  const citizenUsername = 'congdan_' + Math.floor(Math.random() * 10000);
  const regCitizen = await req('/api/auth/register', 'POST', {
    username: citizenUsername,
    password: 'securePassword123',
    confirm_password: 'securePassword123',
    full_name: 'Nguyễn Văn Công Dân Mới',
    phone: citizenPhone,
    verification_token: verRes1.body.verification_token,
    otp_code: otpCode1,
    email: 'congdan@test.com',
    role: 'citizen'
  });
  if (regCitizen.status !== 201 || !regCitizen.body.token) {
    throw new Error('Đăng ký người dân thất bại: ' + JSON.stringify(regCitizen.body));
  }
  console.log(`✓ Đăng ký thành công tài khoản Người dân [${citizenUsername}]: ${regCitizen.body.user.full_name}`);
  console.log(`  Xác minh số điện thoại: ${regCitizen.body.user.is_phone_verified === 1 ? 'ĐÃ XÁC THỰC' : 'CHƯA'}`);

  // Test 5: Trùng tên đăng nhập
  const regDup = await req('/api/auth/register', 'POST', {
    username: citizenUsername,
    password: 'securePassword123',
    confirm_password: 'securePassword123',
    full_name: 'Tên trùng lặp',
    phone: citizenPhone,
    verification_token: verRes1.body.verification_token
  });
  if (regDup.status !== 400) {
    throw new Error('Lỗi: Cho phép tạo tên đăng nhập trùng lặp!');
  }
  console.log('✓ Chặn tên đăng nhập đã tồn tại chính xác');

  // Test 6: Đăng nhập bằng tài khoản người dân vừa tạo
  console.log('\n--- 4. Đăng nhập bằng tài khoản Người dân vừa tạo ---');
  const loginNewCitizen = await req('/api/auth/login', 'POST', {
    username: citizenUsername,
    password: 'securePassword123'
  });
  if (loginNewCitizen.status !== 200 || !loginNewCitizen.body.token) {
    throw new Error('Đăng nhập tài khoản mới tạo thất bại: ' + JSON.stringify(loginNewCitizen.body));
  }
  console.log(`✓ Đăng nhập thành công tài khoản vừa tạo: ${loginNewCitizen.body.user.full_name} (${loginNewCitizen.body.user.role})`);

  // Test 7: Đăng ký tài khoản Cán bộ xã mới
  console.log('\n--- 5. Đăng ký tài khoản Cán bộ công chức xã mới (Kèm xác minh SMS OTP) ---');
  const officerPhone = '0988' + Math.floor(100000 + Math.random() * 900000);
  const otpRes2 = await req('/api/auth/send-otp', 'POST', { phone: officerPhone });
  const otpCode2 = otpRes2.body.simulated_sms?.otp_code;
  const verRes2 = await req('/api/auth/verify-otp', 'POST', { phone: officerPhone, otp_code: otpCode2 });

  const officerUsername = 'canbo_' + Math.floor(Math.random() * 10000);
  const regOfficer = await req('/api/auth/register', 'POST', {
    username: officerUsername,
    password: 'officerPass456',
    confirm_password: 'officerPass456',
    full_name: 'Lê Văn Cán Bộ Xã',
    phone: officerPhone,
    verification_token: verRes2.body.verification_token,
    otp_code: otpCode2,
    email: 'canbo@tantrieu.gov.vn',
    role: 'officer',
    department: 'Địa chính - Nông nghiệp - Xây dựng & Môi trường',
    position: 'Chuyên viên Địa chính'
  });
  if (regOfficer.status !== 201 || !regOfficer.body.token) {
    throw new Error('Đăng ký cán bộ thất bại: ' + JSON.stringify(regOfficer.body));
  }
  console.log(`✓ Đăng ký thành công Cán bộ [${officerUsername}]: ${regOfficer.body.user.full_name} - ${regOfficer.body.user.department}`);

  // Test 8: Đăng nhập Cán bộ mới
  const loginNewOfficer = await req('/api/auth/login', 'POST', {
    username: officerUsername,
    password: 'officerPass456'
  });
  if (loginNewOfficer.status !== 200 || !loginNewOfficer.body.token) {
    throw new Error('Đăng nhập Cán bộ mới thất bại: ' + JSON.stringify(loginNewOfficer.body));
  }
  console.log(`✓ Đăng nhập thành công Cán bộ vừa tạo: ${loginNewOfficer.body.user.full_name}`);

  console.log('\n========================================================================');
  console.log(' TẤT CẢ CÁC BÀI KIỂM THỬ ĐĂNG NHẬP & TẠO TÀI KHOẢN ĐÃ VƯỢT QUA 100%!');
  console.log('========================================================================');
}

testAuth().catch(err => {
  console.error('LỖI KIỂM THỬ:', err);
  process.exit(1);
});
