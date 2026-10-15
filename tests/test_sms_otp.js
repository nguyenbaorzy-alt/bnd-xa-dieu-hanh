const http = require('http');

async function testSmsOtpFlow() {
  console.log('========================================================================');
  console.log(' KIỂM THỬ TÍNH NĂNG BẢO MẬT: XÁC MINH SỐ ĐIỆN THOẠI QUA MÃ SMS OTP');
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

  const testPhone = '0988112233';
  const { db } = require('../database/db');
  const oldUsers = db.prepare("SELECT id FROM users WHERE phone = ?").all(testPhone);
  for (const u of oldUsers) {
    db.prepare("DELETE FROM audit_logs WHERE user_id = ?").run(u.id);
    db.prepare("DELETE FROM users WHERE id = ?").run(u.id);
  }
  db.prepare("DELETE FROM sms_otp_verifications WHERE phone = ?").run(testPhone);

  // 1. Kiểm tra chặn số điện thoại sai định dạng
  console.log('--- 1. Kiểm tra kiểm duyệt định dạng số điện thoại ---');
  const invalidRes = await req('/api/auth/send-otp', 'POST', { phone: '12345' });
  if (invalidRes.status !== 400) {
    throw new Error('Chưa chặn số điện thoại sai định dạng!');
  }
  console.log('✓ Chặn thành công số điện thoại không hợp lệ (400 Bad Request).');

  // 2. Gửi mã xác thực SMS OTP cho số hợp lệ
  console.log('\n--- 2. Gửi mã xác thực SMS OTP ---');
  const sendRes = await req('/api/auth/send-otp', 'POST', { phone: testPhone });
  if (sendRes.status !== 200 || !sendRes.body.simulated_sms || !sendRes.body.simulated_sms.otp_code) {
    throw new Error('Gửi mã OTP thất bại!');
  }
  const otpCode = sendRes.body.simulated_sms.otp_code;
  console.log(`✓ Đã gửi mã SMS OTP thành công tới số [${testPhone}]: Mã OTP = ${otpCode}`);
  console.log(`  Nội dung SMS: "${sendRes.body.simulated_sms.content}"`);

  // 3. Kiểm tra cơ chế chống spam (Rate-limit 30s)
  console.log('\n--- 3. Kiểm tra cơ chế chống spam gửi mã dồn dập (Rate-limit 30s) ---');
  const spamRes = await req('/api/auth/send-otp', 'POST', { phone: testPhone });
  if (spamRes.status !== 429) {
    throw new Error('Chưa chặn gửi OTP dồn dập trong 30s!');
  }
  console.log(`✓ Chặn spam gửi mã thành công: "${spamRes.body.error}" (429 Too Many Requests).`);

  // 4. Kiểm tra xác minh mã OTP sai
  console.log('\n--- 4. Kiểm tra xác minh OTP với mã sai ---');
  const wrongRes = await req('/api/auth/verify-otp', 'POST', { phone: testPhone, otp_code: '000000' });
  if (wrongRes.status !== 400) {
    throw new Error('Chưa chặn khi nhập mã OTP sai!');
  }
  console.log(`✓ Chặn mã OTP sai thành công: "${wrongRes.body.error}"`);

  // 5. Xác minh với mã OTP đúng
  console.log('\n--- 5. Xác minh với mã OTP chính xác ---');
  const verifyRes = await req('/api/auth/verify-otp', 'POST', { phone: testPhone, otp_code: otpCode });
  if (verifyRes.status !== 200 || !verifyRes.body.verification_token) {
    throw new Error('Xác minh mã OTP đúng thất bại!');
  }
  const verificationToken = verifyRes.body.verification_token;
  console.log('✓ Xác minh mã OTP thành công! Đã cấp token chứng nhận số điện thoại chính chủ.');

  // 6. Kiểm tra đăng ký khi số điện thoại CHƯA xác minh
  console.log('\n--- 6. Kiểm tra chặn tạo tài khoản khi chưa xác minh số điện thoại ---');
  const unverifiedPhone = '0977445566';
  const rejectRegRes = await req('/api/auth/register', 'POST', {
    username: 'test_unverified_' + Date.now(),
    password: 'password123',
    confirm_password: 'password123',
    full_name: 'Người dùng thử nghiệm',
    phone: unverifiedPhone,
    role: 'citizen'
  });
  if (rejectRegRes.status !== 400 || !rejectRegRes.body.requires_otp) {
    throw new Error('Chưa chặn tạo tài khoản khi chưa xác thực SMS OTP!');
  }
  console.log(`✓ Chặn đăng ký chưa xác thực SMS thành công: "${rejectRegRes.body.error}"`);

  // 7. Đăng ký tài khoản thành công với số điện thoại đã xác minh SMS
  console.log('\n--- 7. Đăng ký tài khoản thành công với số điện thoại ĐÃ XÁC MINH SMS ---');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const successRegRes = await req('/api/auth/register', 'POST', {
    username: `congdan_otp_${randomSuffix}`,
    password: 'password123',
    confirm_password: 'password123',
    full_name: 'Nguyễn Văn Đã Xác Minh OTP',
    phone: testPhone,
    cccd: `00119800${randomSuffix}`,
    verification_token: verificationToken,
    otp_code: otpCode,
    role: 'citizen'
  });
  if (successRegRes.status !== 201 || !successRegRes.body.token || successRegRes.body.user.is_phone_verified !== 1) {
    throw new Error('Đăng ký tài khoản với số điện thoại đã xác minh thất bại!');
  }
  console.log(`✓ Tạo tài khoản thành công cho [${successRegRes.body.user.username}] - Họ tên: ${successRegRes.body.user.full_name}`);
  console.log(`  Trạng thái xác minh số điện thoại: is_phone_verified = ${successRegRes.body.user.is_phone_verified} (Đã xác minh qua SMS)`);

  console.log('\n========================================================================');
  console.log(' TẤT CẢ CÁC BƯỚC TEST TÍNH NĂNG SMS OTP ĐÃ VƯỢT QUA XUẤT SẮC 100%!');
  console.log('========================================================================\n');
}

testSmsOtpFlow().catch(err => {
  console.error('❌ Kiểm thử SMS OTP thất bại:', err);
  process.exit(1);
});
