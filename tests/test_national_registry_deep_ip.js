/**
 * Test Suite: Cổng Tra Cứu CSDL Dân Cư Quốc Gia (C06 - BCA) & Hệ Thống Điều Tra IP Chuyên Sâu
 * Chạy: node tests/test_national_registry_deep_ip.js
 */

const http = require('http');

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
  console.log('\n===============================================================');
  console.log('BẮT ĐẦU KIỂM THỬ: CỔNG DÂN CƯ QUỐC GIA (C06) & ĐIỀU TRA IP B-FIREWALL');
  console.log('===============================================================\n');

  // Test 1: Tra cứu CSDL Dân cư Quốc gia (Hà Nội)
  console.log('1. Kiểm thử Tra cứu CSDL Dân cư Quốc gia (Hà Nội):');
  const res1 = await makeRequest('POST', '/api/ekyc/national-lookup', {
    cccd: '001195000007',
    full_name: 'Vũ Thị Lan'
  });
  assert(res1.status === 200, 'HTTP Status 200 OK');
  assert(res1.data.success === true, 'Tra cứu thành công');
  assert(res1.data.citizen.full_name === 'Vũ Thị Lan', 'Đúng họ tên công dân');
  assert(res1.data.citizen.dob === '1995-10-15', 'Ngày sinh chuẩn xác 1995-10-15');
  assert(res1.data.citizen.birthplace && res1.data.citizen.birthplace.includes('Hà Nội'), 'Có nơi sinh (khai sinh) tại Hà Nội');
  assert(res1.data.gateway_info.official_stamp === 'C06_BCA_CERTIFIED_2026', 'Có dấu mộc xác thực C06');

  // Test 2: Chống giả mạo danh tính - Tên không khớp với CCCD
  console.log('\n2. Kiểm thử Chống mạo danh: Tên người nhập không khớp với chủ CCCD:');
  const res2 = await makeRequest('POST', '/api/ekyc/national-lookup', {
    cccd: '001195000007',
    full_name: 'Nguyễn Kẻ Gian'
  });
  assert(res2.status === 400, 'Bị chặn từ chối với HTTP 400');
  assert(res2.data.error.includes('KHÔNG TRÙNG KHỚP'), 'Báo lỗi không khớp họ tên');
  assert(res2.data.mismatched === true, 'Đánh dấu mismatched');

  // Test 3: Tra cứu công dân TP. Hồ Chí Minh
  console.log('\n3. Kiểm thử Tra cứu công dân TP. Hồ Chí Minh (079):');
  const res3 = await makeRequest('POST', '/api/ekyc/national-lookup', {
    cccd: '079198024519',
    full_name: 'Trần Thị Thu Thảo'
  });
  assert(res3.status === 200, 'HTTP 200 OK');
  assert(res3.data.citizen.full_name === 'Trần Thị Thu Thảo', 'Khớp họ tên');
  assert(res3.data.citizen.dob === '1998-04-22', 'Ngày sinh chính xác 1998-04-22');
  assert(res3.data.citizen.birthplace.includes('Từ Dũ'), 'Nơi sinh tại Bệnh viện Từ Dũ, TP.HCM');

  // Test 4: Tra cứu công dân Đà Nẵng
  console.log('\n4. Kiểm thử Tra cứu công dân TP. Đà Nẵng (048):');
  const res4 = await makeRequest('POST', '/api/ekyc/national-lookup', {
    cccd: '048094008765',
    full_name: 'Phan Thanh Tùng'
  });
  assert(res4.status === 200, 'HTTP 200 OK');
  assert(res4.data.citizen.dob === '1994-05-12', 'Ngày sinh chính xác 1994-05-12');
  assert(res4.data.citizen.birthplace.includes('Đà Nẵng'), 'Nơi sinh tại Đà Nẵng');

  // Test 5: Tra cứu công dân Thanh Hóa
  console.log('\n5. Kiểm thử Tra cứu công dân Tỉnh Thanh Hóa (038):');
  const res5 = await makeRequest('POST', '/api/ekyc/national-lookup', {
    cccd: '038092019842',
    full_name: 'Lê Đình Trọng'
  });
  assert(res5.status === 200, 'HTTP 200 OK');
  assert(res5.data.citizen.dob === '1992-08-19', 'Ngày sinh chính xác 1992-08-19');
  assert(res5.data.citizen.birthplace.includes('Hoằng Hóa'), 'Nơi sinh tại Huyện Hoằng Hóa');

  // Test 6: Tra cứu NFC Chip đọc đầy đủ thông tin
  console.log('\n6. Kiểm thử Đọc NFC Chip CCCD (/api/ekyc/nfc-read):');
  const res6 = await makeRequest('POST', '/api/ekyc/nfc-read', {
    cccd: '038092019842'
  });
  assert(res6.status === 200, 'NFC read HTTP 200');
  assert(res6.data.citizen.birthplace.includes('Thanh Hóa'), 'NFC trả về đúng nơi sinh');
  assert(res6.data.nfc_chip.chip_status === 'AUTHENTIC_VALID', 'Chip ICAO 9303 hợp lệ');

  // Test 7: AI Face Match eKYC có lưu Nơi sinh vào ekyc_token
  console.log('\n7. Kiểm thử Đối soát AI Face Match (/api/ekyc/face-match):');
  const res7 = await makeRequest('POST', '/api/ekyc/face-match', {
    cccd: '038092019842',
    full_name: 'Lê Đình Trọng',
    selfie_image: 'data:image/jpeg;base64,sample_face',
    liveness_check: true
  });
  assert(res7.status === 200, 'Face match HTTP 200');
  assert(res7.data.match_score >= 90, 'Điểm khớp AI cao');
  assert(res7.data.citizen.birthplace.includes('Hoằng Hóa'), 'Trả về nơi sinh công dân');
  assert(!!res7.data.ekyc_token, 'Cấp ekyc token JWT');

  // Test 8: Danh sách công dân mẫu toàn quốc
  console.log('\n8. Kiểm thử Danh bạ công dân mẫu toàn quốc (/api/ekyc/demo-citizens):');
  const res8 = await makeRequest('GET', '/api/ekyc/demo-citizens');
  assert(res8.status === 200, 'HTTP 200');
  assert(Array.isArray(res8.data.citizens) && res8.data.citizens.length >= 8, 'Có danh sách công dân đại diện toàn quốc');
  assert(res8.data.citizens[0].birthplace !== undefined, 'Mỗi công dân có trường birthplace');

  // Test 9: Điều tra IP chuyên sâu (Deep IP Forensic Inspector - Viettel)
  console.log('\n9. Kiểm thử Điều tra IP Chuyên Sâu (Viettel Telecom Hà Nội):');
  const res9 = await makeRequest('GET', '/api/security/ip-inspect/113.190.22.41');
  assert(res9.status === 200, 'HTTP 200');
  assert(res9.data.geo_intel.isp.includes('Viettel'), 'Nhận diện đúng nhà mạng Viettel');
  assert(res9.data.geo_intel.location.includes('Hà Nội'), 'Nhận diện đúng vị trí Hà Nội');
  assert(res9.data.threat_analysis.threat_score >= 0, 'Có tính điểm Threat Score');

  // Test 10: Điều tra IP Nặc danh Tor Darkweb
  console.log('\n10. Kiểm thử Điều tra IP Độc hại (Tor Exit Node Darkweb):');
  const res10 = await makeRequest('GET', '/api/security/ip-inspect/185.220.101.5');
  assert(res10.status === 200, 'HTTP 200');
  assert(res10.data.geo_intel.is_vpn_tor === true, 'Phát hiện Tor Anonymizer');
  assert(res10.data.threat_analysis.threat_score >= 50, 'Điểm đe dọa cao');
  assert(res10.data.threat_analysis.recommendation.length > 0, 'Có khuyến nghị an ninh');

  // Test 11: Tra cứu IP Client hiện tại (/api/security/my-ip)
  console.log('\n11. Kiểm thử Tra cứu IP Client (/api/security/my-ip):');
  const res11 = await makeRequest('GET', '/api/security/my-ip');
  assert(res11.status === 200, 'HTTP 200');
  assert(!!res11.data.ip_address, 'Trả về IP address');
  assert(!!res11.data.geo_intel, 'Trả về geo intel');

  // Test 12: Đăng ký tài khoản công dân với C06 & lưu Nơi sinh vào cơ sở dữ liệu
  console.log('\n12. Kiểm thử Đăng ký tài khoản công dân đã thẩm định C06:');
  const phoneRandom = `097${Math.floor(1000000 + Math.random() * 9000000)}`;
  
  // 12a. Gửi OTP
  const otpRes = await makeRequest('POST', '/api/auth/send-otp', { phone: phoneRandom });
  assert(otpRes.status === 200, 'Gửi OTP thành công');
  const otpCode = otpRes.data.simulated_sms.otp_code;

  // 12b. Xác minh OTP
  const verifyOtpRes = await makeRequest('POST', '/api/auth/verify-otp', {
    phone: phoneRandom,
    otp_code: otpCode
  });
  assert(verifyOtpRes.status === 200, 'Xác minh OTP thành công');
  const verificationToken = verifyOtpRes.data.verification_token;

  // 12c. Đăng ký tài khoản với công dân Đà Nẵng
  const regRes = await makeRequest('POST', '/api/auth/register', {
    phone: phoneRandom,
    password: 'password123',
    confirm_password: 'password123',
    full_name: 'Phan Thanh Tùng',
    cccd: '048094008765',
    role: 'citizen',
    verification_token: verificationToken,
    ekyc_token: res7.data.ekyc_token
  });
  
  // Nếu CCCD này đã đăng ký trước đó, API trả về 400 báo trùng CCCD; nếu chưa, trả về 201
  if (regRes.status === 201) {
    assert(regRes.data.user.birthplace.includes('Đà Nẵng'), 'Lưu nơi sinh vào tài khoản công dân');
    assert(regRes.data.user.dob === '1994-05-12', 'Lưu ngày sinh chuẩn xác vào tài khoản');
  } else {
    assert(regRes.data.error.includes('đã được đăng ký'), 'Chặn trùng CCCD thành công');
  }

  console.log('\n===============================================================');
  console.log(`KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
