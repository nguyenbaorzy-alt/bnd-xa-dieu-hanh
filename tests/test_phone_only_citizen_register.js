/**
 * Test Suite: Đăng ký tài khoản công dân đơn giản hóa bằng Số điện thoại (SMS OTP), Không cần xác minh CCCD
 * Chạy: node tests/test_phone_only_citizen_register.js
 */

const http = require('http');
const { db } = require('../database/db');

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n========================================================================');
  console.log('KIỂM THỬ: ĐĂNG KÝ TÀI KHOẢN CÔNG DÂN BẰNG SĐT (SMS OTP) - KHÔNG CẦN CCCD');
  console.log('========================================================================\n');

  const testPhone = '0981992233';
  const testFullName = 'Nguyễn Văn Bình';
  const testPassword = 'Password123@';

  // Dọn dẹp dữ liệu cũ nếu có
  db.prepare('PRAGMA foreign_keys = OFF').run();
  db.prepare('DELETE FROM users WHERE phone = ?').run(testPhone);
  db.prepare('PRAGMA foreign_keys = ON').run();

  // Test 1: Gửi mã xác minh SMS OTP tới số điện thoại
  console.log('1. Gửi mã SMS OTP tới số điện thoại:');
  const otpRes = await makeRequest('POST', '/api/auth/send-otp', { phone: testPhone });
  assert(otpRes.status === 200, 'Gửi SMS OTP trả về HTTP 200');
  assert(otpRes.data.success === true, 'Gửi OTP thành công');
  const otpCode = otpRes.data.simulated_sms.otp_code;
  assert(!!otpCode && otpCode.length === 6, `Nhận mã OTP 6 số: ${otpCode}`);

  // Test 2: Xác thực mã SMS OTP
  console.log('\n2. Xác nhận mã SMS OTP:');
  const verifyRes = await makeRequest('POST', '/api/auth/verify-otp', {
    phone: testPhone,
    otp_code: otpCode
  });
  assert(verifyRes.status === 200, 'Xác nhận OTP trả về HTTP 200');
  assert(verifyRes.data.success === true, 'Xác nhận OTP thành công');
  const verificationToken = verifyRes.data.verification_token;
  assert(!!verificationToken, 'Được cấp verification_token');

  // Test 3: Tạo Captcha an ninh
  console.log('\n3. Lấy thử thách xác minh Robot (B-Firewall Captcha):');
  const captchaRes = await makeRequest('GET', '/api/security/captcha/generate');
  assert(captchaRes.status === 200, 'Lấy Captcha HTTP 200');
  const { captcha_token, answer: captchaAnswer } = captchaRes.data;

  // Test 4: Đăng ký tài khoản công dân HOÀN TOÀN KHÔNG CẦN CCCD
  console.log('\n4. Đăng ký tài khoản công dân (Chỉ cần Họ tên + SĐT OTP + Mật khẩu, KHÔNG CẦN CCCD):');
  const regRes = await makeRequest('POST', '/api/auth/register', {
    full_name: testFullName,
    phone: testPhone,
    password: testPassword,
    confirm_password: testPassword,
    role: 'citizen',
    verification_token: verificationToken,
    otp_code: otpCode,
    captcha_token: captcha_token,
    captcha_answer: captchaAnswer
    // KHÔNG TRUYỀN CCCD
  });

  assert(regRes.status === 201, 'Đăng ký thành công trả về HTTP 201 Created');
  assert(regRes.data.user.full_name === testFullName, `Họ tên chính xác: ${regRes.data.user.full_name}`);
  assert(regRes.data.user.phone === testPhone, `Số điện thoại chính xác: ${regRes.data.user.phone}`);
  assert(regRes.data.user.username === testPhone, `Tên đăng nhập tự động là SĐT: ${regRes.data.user.username}`);
  assert(regRes.data.user.cccd === null, 'Trường CCCD không bắt buộc (null)');
  assert(regRes.data.user.is_phone_verified === 1, 'Số điện thoại đã được xác minh chính chủ');
  assert(!!regRes.data.token, 'Cấp mã đăng nhập (JWT token)');

  // Test 5: Đăng nhập vào hệ thống bằng Số điện thoại + Mật khẩu
  console.log('\n5. Đăng nhập ngay vào hệ thống bằng Số điện thoại vừa đăng ký:');
  const loginRes = await makeRequest('POST', '/api/auth/login', {
    username: testPhone,
    password: testPassword,
    location: { address: 'Xã Tân Triều, Thanh Trì, Hà Nội', latitude: 20.9806, longitude: 105.7952 }
  });

  assert(loginRes.status === 200, 'Đăng nhập thành công HTTP 200');
  assert(loginRes.data.user.phone === testPhone, 'Nhận diện đúng tài khoản công dân');
  assert(loginRes.data.user.full_name === testFullName, 'Đúng họ tên công dân');

  // Test 6: Chặn đăng ký khi chưa xác thực OTP
  console.log('\n6. Chặn đăng ký khi số điện thoại chưa xác thực OTP:');
  const unverifiedPhone = '0988001122';
  const invalidReg = await makeRequest('POST', '/api/auth/register', {
    full_name: 'Người chưa xác thực',
    phone: unverifiedPhone,
    password: 'password123',
    confirm_password: 'password123',
    role: 'citizen'
  });
  assert(invalidReg.status === 400, 'Bị chặn với HTTP 400');
  assert(invalidReg.data.error.includes('chưa được xác minh qua SMS OTP'), 'Thông báo yêu cầu xác minh OTP');

  // Dọn dẹp
  db.prepare('PRAGMA foreign_keys = OFF').run();
  db.prepare('DELETE FROM users WHERE phone = ?').run(testPhone);
  db.prepare('PRAGMA foreign_keys = ON').run();

  console.log('\n========================================================================');
  console.log(`TỔNG KẾT: ${passed} PASS, ${failed} FAIL`);
  console.log('========================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(e => {
  console.error('Lỗi kiểm thử:', e);
  process.exit(1);
});
