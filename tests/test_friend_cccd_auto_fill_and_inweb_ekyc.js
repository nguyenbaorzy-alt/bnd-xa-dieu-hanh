/**
 * Test Suite: Kiểm thử Định danh bất kỳ CCCD (Bạn bè, người thân), Tự động điền & eKYC trong web
 * Chạy: node tests/test_friend_cccd_auto_fill_and_inweb_ekyc.js
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
  console.log('KIỂM THỬ: ĐỊNH DANH BẤT KỲ CCCD, TỰ ĐỘNG ĐIỀN DỮ LIỆU & eKYC TRONG WEB');
  console.log('========================================================================\n');

  // Test 1: Tra cứu CCCD mới bất kỳ của bạn bè (Hà Nội: 001, Nam: 0, Năm sinh 1998: 98, số cuối: 789123)
  console.log('1. Kiểm thử Tra cứu & Định danh CCCD mới hoàn toàn của bạn bè (001098789123):');
  const friendCccd = '001098789123';
  const lookupFriend = await makeRequest('POST', '/api/ekyc/nfc-read', { cccd: friendCccd });
  
  assert(lookupFriend.status === 200, 'Tra cứu CCCD của bạn bè trả về HTTP 200 (Không bị báo sai/không tìm thấy)');
  assert(lookupFriend.data.success === true, 'Định danh dữ liệu công dân thành công');
  assert(lookupFriend.data.citizen.full_name && lookupFriend.data.citizen.full_name.length > 3, `Tự động gán họ tên chuẩn mực: [${lookupFriend.data.citizen.full_name}]`);
  assert(lookupFriend.data.citizen.dob.startsWith('1998-'), `Giải mã đúng năm sinh 1998: [${lookupFriend.data.citizen.dob}]`);
  assert(lookupFriend.data.citizen.gender === 'Nam', 'Giải mã đúng giới tính: Nam');
  assert(lookupFriend.data.citizen.birthplace && lookupFriend.data.citizen.birthplace.includes('Hà Nội'), `Tự động gán nơi sinh theo tỉnh/thành: [${lookupFriend.data.citizen.birthplace}]`);
  assert(lookupFriend.data.citizen.permanent_address && lookupFriend.data.citizen.permanent_address.length > 5, 'Tự động gán địa chỉ thường trú');

  // Test 2: Tra cứu CCCD bạn nữ từ TP. Hồ Chí Minh (079, Nữ: 1, Năm sinh 1999: 99, số cuối: 456789)
  console.log('\n2. Kiểm thử Tra cứu CCCD bạn nữ TP. Hồ Chí Minh (079199456789):');
  const femaleFriendCccd = '079199456789';
  const lookupFemale = await makeRequest('POST', '/api/ekyc/national-lookup', { cccd: femaleFriendCccd });
  assert(lookupFemale.status === 200, 'HTTP 200 cho CCCD TP.HCM mới');
  assert(lookupFemale.data.citizen.gender === 'Nữ', 'Giải mã đúng giới tính Nữ');
  assert(lookupFemale.data.citizen.dob.startsWith('1999-'), 'Giải mã đúng năm sinh 1999');
  assert(lookupFemale.data.citizen.birthplace.includes('Hồ Chí Minh'), 'Nơi sinh tại TP. Hồ Chí Minh');

  // Test 3: Đăng ký tài khoản công dân chỉ cần CCCD + SĐT OTP + Mật khẩu (KHÔNG BẮT BUỘC QUÉT MẶT Ở NGOÀI)
  console.log('\n3. Kiểm thử Đăng ký tài khoản nhanh (CCCD + SĐT OTP + Mật khẩu):');
  const testPhone = '0977889911';
  // Dọn dẹp dữ liệu cũ nếu có
  db.prepare('PRAGMA foreign_keys = OFF').run();
  db.prepare('DELETE FROM users WHERE phone = ? OR cccd = ?').run(testPhone, friendCccd);
  db.prepare('PRAGMA foreign_keys = ON').run();

  // Gửi OTP
  const otpRes = await makeRequest('POST', '/api/auth/send-otp', { phone: testPhone });
  assert(otpRes.status === 200, 'Gửi OTP thành công');
  const otpCode = otpRes.data.simulated_sms.otp_code;

  // Xác minh OTP
  const verifyRes = await makeRequest('POST', '/api/auth/verify-otp', { phone: testPhone, otp_code: otpCode });
  assert(verifyRes.status === 200, 'Xác minh OTP thành công');
  const vToken = verifyRes.data.verification_token;

  // Đăng ký không có ekyc_token (theo đúng yêu cầu của người dùng)
  const regRes = await makeRequest('POST', '/api/auth/register', {
    full_name: lookupFriend.data.citizen.full_name,
    phone: testPhone,
    cccd: friendCccd,
    password: 'password123',
    confirm_password: 'password123',
    role: 'citizen',
    verification_token: vToken
  });

  assert(regRes.status === 201, 'Tạo tài khoản thành công HTTP 201');
  assert(regRes.data.user.full_name === lookupFriend.data.citizen.full_name, 'Họ tên tài khoản tự khớp với C06');
  assert(regRes.data.user.phone === testPhone, 'Số điện thoại chính xác');
  assert(regRes.data.user.cccd === friendCccd, 'Số CCCD chính xác');
  assert(regRes.data.user.birthplace.includes('Hà Nội'), 'Lưu nơi sinh vào tài khoản');

  // Test 4: Đăng nhập vào hệ thống
  console.log('\n4. Kiểm thử Đăng nhập vào hệ thống:');
  const loginRes = await makeRequest('POST', '/api/auth/login', {
    username: testPhone,
    password: 'password123',
    location: { address: 'Tân Triều, Hà Nội', latitude: 20.9806, longitude: 105.7952 }
  });
  assert(loginRes.status === 200, 'Đăng nhập vào hệ thống thành công');
  const authToken = loginRes.data.token;
  assert(!!authToken, 'Đã cấp token đăng nhập');

  // Test 5: Quét NFC & Xác minh khuôn mặt eKYC TRONG WEB sau khi đã đăng nhập
  console.log('\n5. Kiểm thử Quét NFC & Xác minh khuôn mặt eKYC (Mức 2) khi đã vào trong web:');
  
  // Tạo eKYC token từ face-match
  const faceRes = await makeRequest('POST', '/api/ekyc/face-match', {
    cccd: friendCccd,
    full_name: lookupFriend.data.citizen.full_name,
    selfie_image: 'data:image/jpeg;base64,camera_face_image_data'
  });
  assert(faceRes.status === 200, 'Đối soát sinh trắc học AI thành công');
  const inwebEkycToken = faceRes.data.ekyc_token;

  // Nâng cấp định danh trong web
  const upgradeRes = await makeRequest('POST', '/api/ekyc/upgrade-citizen-ekyc', {
    ekyc_token: inwebEkycToken,
    match_score: faceRes.data.match_score
  }, {
    Authorization: `Bearer ${authToken}`
  });

  assert(upgradeRes.status === 200, 'Nâng cấp eKYC trong web HTTP 200');
  assert(upgradeRes.data.success === true, 'Nâng cấp thành công');
  assert(upgradeRes.data.user.ekyc_status === 'verified', 'Trạng thái eKYC đạt verified (Mức 2)');
  assert(upgradeRes.data.user.chip_serial && upgradeRes.data.user.chip_serial.startsWith('VN-CHIP'), 'Có số seri chip điện tử ICAO');

  // Test 6: Chính danh hóa Họ tên & Địa chỉ thật của công dân vào C06 (/api/ekyc/sync-citizen-registry)
  console.log('\n6. Kiểm thử Đồng bộ & Chính danh hóa Họ tên, Địa chỉ thật của công dân vào C06:');
  const userRealCccd = '037095001234';
  
  // Bước 6a: Tra cứu ban đầu (sinh họ tên mẫu)
  const initialLookup = await makeRequest('POST', '/api/ekyc/nfc-read', { cccd: userRealCccd });
  assert(initialLookup.status === 200, 'Tra cứu CCCD mới ban đầu HTTP 200');
  const sampleName = initialLookup.data.citizen.full_name;
  assert(!!sampleName, `Hệ thống tạm gán tên mẫu: ${sampleName}`);

  // Bước 6b: Công dân nhập và lưu họ tên thật & địa chỉ thật
  const syncRes = await makeRequest('POST', '/api/ekyc/sync-citizen-registry', {
    cccd: userRealCccd,
    full_name: 'NGUYỄN VĂN AN',
    permanent_address: 'Số 88 Phố Triều Khúc, Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội'
  });
  assert(syncRes.status === 200, 'Đồng bộ hồ sơ thật HTTP 200');
  assert(syncRes.data.success === true, 'Đồng bộ chính danh thành công');
  assert(syncRes.data.citizen.full_name === 'NGUYỄN VĂN AN', 'Họ tên được cập nhật thành NGUYỄN VĂN AN');
  assert(syncRes.data.citizen.permanent_address.includes('Số 88 Phố Triều Khúc'), 'Địa chỉ thường trú được cập nhật chính xác');

  // Bước 6c: Tra cứu lại đảm bảo 100% CSDL C06 đã lưu vĩnh viễn danh tính thật
  const reLookup = await makeRequest('POST', '/api/ekyc/nfc-read', { cccd: userRealCccd });
  assert(reLookup.status === 200, 'Tra cứu lại CCCD HTTP 200');
  assert(reLookup.data.citizen.full_name === 'NGUYỄN VĂN AN', 'Dữ liệu C06 trả về đúng chính xác họ tên thật NGUYỄN VĂN AN');
  assert(reLookup.data.citizen.permanent_address.includes('Số 88 Phố Triều Khúc'), 'Dữ liệu C06 trả về đúng địa chỉ thật');

  // Dọn dẹp
  db.prepare('PRAGMA foreign_keys = OFF').run();
  db.prepare('DELETE FROM users WHERE phone = ? OR cccd = ?').run(testPhone, friendCccd);
  db.prepare('DELETE FROM national_citizen_registry WHERE cccd IN (?, ?)').run(friendCccd, userRealCccd);
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
