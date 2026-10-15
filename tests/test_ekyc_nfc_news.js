const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:3001';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = { raw: data };
        }
        resolve({ status: res.statusCode, body: json });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('BẮT ĐẦU KIỂM THỬ TÍCH HỢP eKYC CCCD GẮN CHIP, NFC & BẢN TIN XÃ');
  console.log('================================================================');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✓ [PASS ${total}] ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL ${total}] ${name}`);
      console.error('  Chi tiết:', err.message);
    }
  }

  // TEST 1: Quét NFC chip CCCD hợp lệ
  console.log('\n--- 1. Kiểm tra Quét NFC thẻ CCCD gắn chip ---');
  const nfcRes = await request('/api/ekyc/nfc-read', {
    method: 'POST',
    body: { cccd: '001095018273' } // Hoàng Gia Bảo
  });
  test('NFC read thành công cho công dân hợp lệ trên CSDL Dân cư', () => {
    assert.strictEqual(nfcRes.status, 200);
    assert.strictEqual(nfcRes.body.success, true);
    assert.strictEqual(nfcRes.body.citizen.full_name, 'Hoàng Gia Bảo');
    assert.strictEqual(nfcRes.body.nfc_chip.chip_serial, 'VN-CHIP-95018273');
    assert.strictEqual(nfcRes.body.nfc_chip.protocol, 'ISO/IEC 14443-A (ICAO Doc 9303)');
  });

  // TEST 2: Quét NFC số CCCD không có trên CSDL Dân cư
  const nfcNotFound = await request('/api/ekyc/nfc-read', {
    method: 'POST',
    body: { cccd: '001099999999' }
  });
  test('NFC read từ chối số CCCD không có trong CSDL Dân cư (404)', () => {
    assert.strictEqual(nfcNotFound.status, 404);
    assert.ok(nfcNotFound.body.error.includes('Không tìm thấy dữ liệu công dân'));
  });

  // TEST 3: Xác thực Face eKYC - Sai họ tên (Chống giả mạo / lấy CCCD của người khác)
  console.log('\n--- 2. Kiểm tra Đối soát Họ tên & Sinh trắc học Face Match ---');
  const fakeNameRes = await request('/api/ekyc/face-match', {
    method: 'POST',
    body: {
      cccd: '001095018273',
      full_name: 'Nguyễn Văn Kẻ Gian', // Sai tên so với Hoàng Gia Bảo
      selfie_image: 'data:image/jpeg;base64,mock_selfie_data'
    }
  });
  test('Đối soát họ tên từ chối ngay khi họ tên không khớp với CCCD (400)', () => {
    assert.strictEqual(fakeNameRes.status, 400);
    assert.ok(fakeNameRes.body.error.includes('KHÔNG TRÙNG KHỚP'));
  });

  // TEST 4: Xác thực Face eKYC - Đúng họ tên & Khuôn mặt thành công
  const faceMatchRes = await request('/api/ekyc/face-match', {
    method: 'POST',
    body: {
      cccd: '001095018273',
      full_name: 'Hoàng Gia Bảo',
      selfie_image: 'data:image/jpeg;base64,mock_valid_selfie'
    }
  });
  test('Đối soát sinh trắc học AI thành công khi đúng CCCD và Họ tên', () => {
    assert.strictEqual(faceMatchRes.status, 200);
    assert.strictEqual(faceMatchRes.body.success, true);
    assert.ok(faceMatchRes.body.match_score >= 95.0);
    assert.ok(faceMatchRes.body.ekyc_token);
  });

  const validEkycToken = faceMatchRes.body.ekyc_token;

  // TEST 5: Đăng ký tài khoản công dân với eKYC & SMS OTP
  console.log('\n--- 3. Kiểm tra Đăng ký tài khoản Công dân chính danh ---');
  const testPhone = '0981999888';
  // Gửi OTP
  const otpRes = await request('/api/auth/send-otp', {
    method: 'POST',
    body: { phone: testPhone }
  });
  const otpCode = otpRes.body.simulated_sms.otp_code;

  // Xác nhận OTP
  const verifyOtpRes = await request('/api/auth/verify-otp', {
    method: 'POST',
    body: { phone: testPhone, otp_code: otpCode }
  });
  const phoneVerificationToken = verifyOtpRes.body.verification_token;

  // Cố tình đăng ký với tên sai
  const regMismatched = await request('/api/auth/register', {
    method: 'POST',
    body: {
      full_name: 'Trần Văn Sai Tên',
      phone: testPhone,
      cccd: '001095018273',
      password: 'password123',
      verification_token: phoneVerificationToken
    }
  });
  test('Đăng ký bị từ chối nếu tên nhập không trùng với chủ CCCD', () => {
    assert.strictEqual(regMismatched.status, 400);
    assert.ok(regMismatched.body.error.includes('KHÔNG TRÙNG KHỚP'));
  });

  // Đăng ký đúng với eKYC
  const regSuccess = await request('/api/auth/register', {
    method: 'POST',
    body: {
      full_name: 'Hoàng Gia Bảo',
      phone: testPhone,
      cccd: '001095018273',
      password: 'password123',
      verification_token: phoneVerificationToken,
      ekyc_token: validEkycToken
    }
  });
  test('Đăng ký thành công và lưu toàn bộ hồ sơ công dân vào database', () => {
    assert.strictEqual(regSuccess.status, 201);
    assert.strictEqual(regSuccess.body.user.full_name, 'Hoàng Gia Bảo');
    assert.strictEqual(regSuccess.body.user.cccd, '001095018273');
    assert.strictEqual(regSuccess.body.user.ekyc_status, 'verified');
    assert.strictEqual(regSuccess.body.user.chip_serial, 'VN-CHIP-95018273');
    assert.strictEqual(regSuccess.body.user.dob, '1995-11-28');
    assert.strictEqual(regSuccess.body.user.permanent_address, 'Số 88 Đường Chiến Thắng, Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội');
  });

  // TEST 6: Đăng nhập bằng SĐT hoặc CCCD của tài khoản mới
  console.log('\n--- 4. Kiểm tra Đăng nhập tài khoản công dân mới ---');
  const loginByPhone = await request('/api/auth/login', {
    method: 'POST',
    body: { username: testPhone, password: 'password123' }
  });
  test('Đăng nhập thành công bằng Số điện thoại của tài khoản công dân mới', () => {
    assert.strictEqual(loginByPhone.status, 200);
    assert.strictEqual(loginByPhone.body.user.cccd, '001095018273');
  });

  const loginByCccd = await request('/api/auth/login', {
    method: 'POST',
    body: { username: '001095018273', password: 'password123' }
  });
  test('Đăng nhập thành công bằng số CCCD 12 số của tài khoản công dân mới', () => {
    assert.strictEqual(loginByCccd.status, 200);
    assert.strictEqual(loginByCccd.body.user.phone, testPhone);
  });

  const citizenAuthToken = loginByPhone.body.token;

  // TEST 7: Gửi yêu cầu phản ánh trực tuyến của công dân đã eKYC
  console.log('\n--- 5. Kiểm tra Gửi phản ánh trực tuyến gắn CCCD ---');
  const reqSubmit = await request('/api/public/requests', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${citizenAuthToken}` },
    body: {
      citizen_name: 'Hoàng Gia Bảo',
      phone: testPhone,
      email: 'giabao@gmail.com',
      address: 'Số 88 Đường Chiến Thắng',
      category: 'Môi trường',
      title: 'Phản ánh tình trạng xả rác tại đầu ngõ 88 Chiến Thắng',
      content: 'Kính gửi UBND Xã Tân Triều xem xét kiểm tra và đặt biển cấm đổ rác tại ngõ 88.'
    }
  });
  test('Công dân gửi phản ánh thành công, tự động gán mã hồ sơ và CCCD', () => {
    assert.strictEqual(reqSubmit.status, 201);
    assert.ok(reqSubmit.body.code);
  });

  // TEST 8: Bản tin & Thông báo UBND Xã
  console.log('\n--- 6. Kiểm tra Bản tin & Thông báo Xã ---');
  const newsList = await request('/api/news');
  test('Lấy danh sách bản tin thành công kèm danh mục và số lượng', () => {
    assert.strictEqual(newsList.status, 200);
    assert.strictEqual(newsList.body.success, true);
    assert.ok(newsList.body.news.length >= 5);
    assert.ok(newsList.body.categories.length >= 5);
  });

  const firstArticleId = newsList.body.news[0].id;
  const initialViews = newsList.body.news[0].views_count;

  const articleDetail = await request(`/api/news/${firstArticleId}`);
  test('Xem chi tiết bản tin và tự động tăng lượt xem', () => {
    assert.strictEqual(articleDetail.status, 200);
    assert.strictEqual(articleDetail.body.article.id, firstArticleId);
    assert.strictEqual(articleDetail.body.article.views_count, initialViews + 1);
  });

  // Đăng nhập cán bộ lãnh đạo để đăng bài
  const leaderLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { username: 'chutich', password: '123456' }
  });
  const leaderToken = leaderLogin.body.token;

  const postNewsRes = await request('/api/news', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${leaderToken}` },
    body: {
      title: 'UBND Xã Tân Triều thông báo lịch tiếp công dân định kỳ tháng 4/2026',
      summary: 'Chủ tịch UBND Xã tổ chức tiếp công dân vào các ngày thứ Năm hàng tuần tại Phòng Tiếp dân.',
      content: 'Ủy ban nhân dân Xã Tân Triều trân trọng thông báo lịch tiếp công dân định kỳ của Lãnh đạo UBND xã.',
      category: 'thong_bao',
      is_featured: true
    }
  });
  test('Lãnh đạo UBND đăng tải bản tin mới thành công', () => {
    assert.strictEqual(postNewsRes.status, 201);
    assert.strictEqual(postNewsRes.body.success, true);
    assert.strictEqual(postNewsRes.body.article.title, 'UBND Xã Tân Triều thông báo lịch tiếp công dân định kỳ tháng 4/2026');
  });

  console.log('\n================================================================');
  console.log(`KẾT QUẢ KIỂM THỬ: ${passed}/${total} TESTS HOÀN THÀNH XUẤT SẮC! (${Math.round((passed/total)*100)}%)`);
  console.log('================================================================');

  // Dọn dẹp dữ liệu test
  const { db } = require('../database/db');
  try {
    const u = db.prepare('SELECT id FROM users WHERE phone = ?').get(testPhone);
    if (u) {
      db.prepare('DELETE FROM audit_logs WHERE user_id = ?').run(u.id);
      db.prepare('DELETE FROM online_requests WHERE phone = ?').run(testPhone);
      db.prepare('DELETE FROM users WHERE id = ?').run(u.id);
    }
  } catch (e) {}

  if (passed !== total) process.exit(1);
}

runTests().catch(err => {
  console.error('Lỗi khi chạy kiểm thử:', err);
  process.exit(1);
});
