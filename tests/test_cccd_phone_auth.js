const http = require('http');
const { db } = require('../database/db');
const { parseCccd } = require('../utils/cccd');

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (e) {
            json = { raw: data };
          }
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================================');
  console.log(' KIỂM THỬ XÁC THỰC CĂN CƯỚC CÔNG DÂN (CCCD 12 SỐ) & ĐĂNG NHẬP BẰNG SĐT/CCCD');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  const testPhone = '0989001122';
  const testCccd = '001198009988'; // 001: Hà Nội, 1: Nữ thế kỷ 20, 98: 1998, 009988
  const testPass = 'MatKhau@123';

  try {
    // Dọn dẹp dữ liệu kiểm thử cũ nếu có
    const oldUsers = db.prepare("SELECT id FROM users WHERE phone = ? OR cccd = ? OR username = ?").all(testPhone, testCccd, testPhone);
    for (const u of oldUsers) {
      db.prepare("DELETE FROM audit_logs WHERE user_id = ?").run(u.id);
      db.prepare("DELETE FROM users WHERE id = ?").run(u.id);
    }
    db.prepare("DELETE FROM sms_otp_verifications WHERE phone = ?").run(testPhone);

    // 1. Kiểm thử Unit Test bộ giải mã & thẩm định CCCD 12 số
    console.log('--- 1. Kiểm thử Thuật toán thẩm định số CCCD chuẩn Bộ Công An ---');
    const validParsed = parseCccd(testCccd);
    assert(validParsed.valid === true, 'Số CCCD 001198009988 hợp lệ');
    assert(validParsed.province === 'TP. Hà Nội', `Nhận diện chính xác tỉnh/thành: ${validParsed.province}`);
    assert(validParsed.gender === 'Nữ', `Nhận diện chính xác giới tính: ${validParsed.gender}`);
    assert(validParsed.birth_year === 1998, `Nhận diện chính xác năm sinh: ${validParsed.birth_year}`);

    const invalidLength = parseCccd('123456');
    assert(invalidLength.valid === false, 'Chặn số CCCD không đủ 12 chữ số');

    const invalidProvince = parseCccd('999095012345');
    assert(invalidProvince.valid === false, 'Chặn mã tỉnh/thành phố không tồn tại (999)');

    // 2. Kiểm thử API POST /api/auth/verify-cccd
    console.log('\n--- 2. Kiểm thử API Thẩm định số CCCD thời gian thực (/api/auth/verify-cccd) ---');
    const verifyCccdRes = await request('POST', '/api/auth/verify-cccd', { cccd: testCccd });
    assert(verifyCccdRes.status === 200, 'API verify-cccd trả về HTTP 200');
    assert(verifyCccdRes.data.province === 'TP. Hà Nội', 'API bóc tách đúng thông tin quê quán');
    assert(verifyCccdRes.data.is_registered === false, 'Xác nhận số CCCD này chưa từng đăng ký tài khoản');

    // 3. Quy trình gửi và xác nhận SMS OTP cho số điện thoại kiểm thử
    console.log('\n--- 3. Chuẩn bị xác thực SMS OTP cho số điện thoại mới ---');
    const sendOtpRes = await request('POST', '/api/auth/send-otp', { phone: testPhone });
    assert(sendOtpRes.status === 200, 'Gửi mã SMS OTP thành công');
    const otpCode = sendOtpRes.data.simulated_sms.otp_code;

    const verifyOtpRes = await request('POST', '/api/auth/verify-otp', { phone: testPhone, otp_code: otpCode });
    assert(verifyOtpRes.status === 200, 'Xác thực OTP thành công');
    const verificationToken = verifyOtpRes.data.verification_token;

    // 4. Đăng ký tài khoản công dân KHÔNG CẦN TÊN ĐĂNG NHẬP (Chỉ dùng SĐT + CCCD)
    console.log('\n--- 4. Đăng ký tài khoản công dân (Tự động lấy SĐT làm tên tài khoản) ---');
    const registerRes = await request('POST', '/api/auth/register', {
      full_name: 'Trần Thị Thuỷ',
      phone: testPhone,
      cccd: testCccd,
      password: testPass,
      confirm_password: testPass,
      role: 'citizen',
      verification_token: verificationToken
    });

    assert(registerRes.status === 201, 'Tạo tài khoản công dân thành công (HTTP 201 Created)');
    assert(registerRes.data.user && registerRes.data.user.username === testPhone, `Tên tài khoản tự động được gán bằng SĐT: ${registerRes.data.user?.username}`);
    assert(registerRes.data.user && registerRes.data.user.cccd === testCccd, `Đã gắn chính xác số CCCD: ${registerRes.data.user?.cccd}`);

    // 5. Kiểm thử Chặn đăng ký trùng số CCCD
    console.log('\n--- 5. Kiểm thử Chống gian lận / Chặn trùng số CCCD ---');
    // Gửi OTP cho số điện thoại khác nhưng cố tình dùng CCCD của người khác
    const otherPhone = '0989334455';
    db.prepare("DELETE FROM sms_otp_verifications WHERE phone = ?").run(otherPhone);
    const sendOtp2 = await request('POST', '/api/auth/send-otp', { phone: otherPhone });
    const otp2 = sendOtp2.data.simulated_sms.otp_code;
    const verifyOtp2 = await request('POST', '/api/auth/verify-otp', { phone: otherPhone, otp_code: otp2 });

    const dupCccdRes = await request('POST', '/api/auth/register', {
      full_name: 'Kẻ Giả Mạo CCCD',
      phone: otherPhone,
      cccd: testCccd, // Trùng số CCCD của Trần Thị Thuỷ
      password: testPass,
      confirm_password: testPass,
      role: 'citizen',
      verification_token: verifyOtp2.data.verification_token
    });
    assert(dupCccdRes.status === 400, 'Chặn thành công đăng ký trùng số CCCD (HTTP 400)');
    assert(dupCccdRes.data.error.includes('đã được đăng ký'), 'Thông báo lỗi rõ ràng về trùng số CCCD');

    // 6. Kiểm thử Đăng nhập bằng Số điện thoại
    console.log('\n--- 6. Kiểm thử Đăng nhập hệ thống bằng SỐ ĐIỆN THOẠI ---');
    const loginByPhoneRes = await request('POST', '/api/auth/login', {
      username: testPhone, // Truyền số điện thoại vào ô đăng nhập
      password: testPass
    });
    assert(loginByPhoneRes.status === 200, 'Đăng nhập thành công bằng Số điện thoại');
    assert(loginByPhoneRes.data.token && loginByPhoneRes.data.user.full_name === 'Trần Thị Thuỷ', 'Nhận diện đúng tài khoản công dân vừa đăng ký');

    // 7. Kiểm thử Đăng nhập bằng Số Căn cước công dân (CCCD 12 số)
    console.log('\n--- 7. Kiểm thử Đăng nhập hệ thống bằng SỐ CĂN CƯỚC CÔNG DÂN (CCCD) ---');
    const loginByCccdRes = await request('POST', '/api/auth/login', {
      username: testCccd, // Truyền số CCCD vào ô đăng nhập
      password: testPass
    });
    assert(loginByCccdRes.status === 200, 'Đăng nhập thành công bằng Số CCCD 12 số');
    assert(loginByCccdRes.data.token && loginByCccdRes.data.user.cccd === testCccd, 'Nhận diện đúng tài khoản qua số CCCD');

    // 8. Kiểm thử Đăng nhập tài khoản cán bộ có sẵn (Admin / Chủ tịch)
    console.log('\n--- 8. Kiểm thử Khả năng tương thích ngược (Cán bộ đăng nhập bằng Username hoặc SĐT) ---');
    const loginAdminUser = await request('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
    assert(loginAdminUser.status === 200, 'Admin đăng nhập bình thường bằng username [admin]');

    const loginAdminPhone = await request('POST', '/api/auth/login', { username: '0981112233', password: 'admin123' });
    assert(loginAdminPhone.status === 200, 'Admin đăng nhập thành công bằng Số điện thoại [0981112233]');

    // Dọn dẹp dữ liệu kiểm thử
    const cleanupUsers = db.prepare("SELECT id FROM users WHERE phone IN (?, ?) OR cccd = ?").all(testPhone, otherPhone, testCccd);
    for (const u of cleanupUsers) {
      db.prepare("DELETE FROM audit_logs WHERE user_id = ?").run(u.id);
      db.prepare("DELETE FROM users WHERE id = ?").run(u.id);
    }
    db.prepare("DELETE FROM sms_otp_verifications WHERE phone IN (?, ?)").run(testPhone, otherPhone);

    console.log('\n========================================================================');
    console.log(`KẾT QUẢ KIỂM THỬ: ${passed} PASSED | ${failed} FAILED`);
    console.log('========================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Lỗi khi chạy kiểm thử:', err);
    process.exit(1);
  }
}

runTests();
