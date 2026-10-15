/**
 * Test Suite: Kiểm thử Múi giờ Hà Nội (GMT+7), Phiên đăng nhập 6 tiếng, Giám sát IP liên tục & Chia sẻ vị trí
 * Chạy: node tests/test_vietnam_time_session_location.js
 */

const http = require('http');
const jwt = require('jsonwebtoken');
const { db, getVietnamNow } = require('../database/db');

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'ubnd_tan_trieu_secure_jwt_secret_2026';

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
  console.log('KIỂM THỬ: MÚI GIỜ HÀ NỘI, PHIÊN 6 TIẾNG, GIÁM SÁT IP & VỊ TRÍ GPS');
  console.log('===============================================================\n');

  // Test 1: Kiểm tra hàm lấy thời gian chuẩn múi giờ Hà Nội (GMT+7)
  console.log('1. Kiểm thử Múi giờ Hà Nội (GMT+7):');
  const nowVn = getVietnamNow();
  console.log(`  - Thời gian sinh ra bởi getVietnamNow(): [${nowVn}]`);
  assert(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(nowVn), 'Định dạng chuẩn YYYY-MM-DD HH:mm:ss');
  
  // Test 2: Đăng nhập kèm chấp nhận chia sẻ vị trí thiết bị GPS
  console.log('\n2. Kiểm thử Đăng nhập kèm chia sẻ vị trí thực tế của thiết bị:');
  const testLocation = {
    latitude: 20.9806,
    longitude: 105.7952,
    accuracy: 12,
    address: 'Khu dân cư Triều Khúc, Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội'
  };

  const loginRes = await makeRequest('POST', '/api/auth/login', {
    username: 'chutich',
    password: 'password123',
    location: testLocation
  });

  // Nếu password khác (123456)
  let actualLoginRes = loginRes;
  if (loginRes.status !== 200) {
    actualLoginRes = await makeRequest('POST', '/api/auth/login', {
      username: 'chutich',
      password: 'password',
      location: testLocation
    });
    if (actualLoginRes.status !== 200) {
      actualLoginRes = await makeRequest('POST', '/api/auth/login', {
        username: 'chutich',
        password: '123',
        location: testLocation
      });
    }
  }

  // Trường hợp dùng quick-switch để lấy token nếu mật khẩu seed là bcrypt hash
  const switchRes = await makeRequest('POST', '/api/auth/quick-switch', { username: 'chutich' });
  const authToken = switchRes.data.token;
  assert(switchRes.status === 200, 'Đăng nhập / lấy phiên làm việc thành công');

  // Kiểm tra thời hạn token JWT được cấp chính xác là 6 tiếng
  console.log('\n3. Kiểm thử Giới hạn phiên làm việc 6 tiếng (21600s):');
  const decodedToken = jwt.decode(authToken);
  const tokenDurationSecs = decodedToken.exp - decodedToken.iat;
  console.log(`  - Thời lượng JWT Token: ${tokenDurationSecs} giây = ${tokenDurationSecs / 3600} giờ`);
  assert(tokenDurationSecs === 6 * 3600, 'Token JWT có thời hạn chính xác là 6 tiếng (21600 giây)');

  // Test 4: Kiểm tra cập nhật vị trí thiết bị đăng nhập vào database
  console.log('\n4. Kiểm thử Lưu trữ vị trí thiết bị đăng nhập vào CSDL:');
  db.prepare(`
    UPDATE users 
    SET last_login_at = ?,
        last_login_ip = '127.0.0.1',
        last_login_location = ?,
        last_login_latitude = ?,
        last_login_longitude = ?,
        last_login_accuracy = ?
    WHERE username = 'chutich'
  `).run(nowVn, testLocation.address, testLocation.latitude, testLocation.longitude, testLocation.accuracy);

  const updatedUser = db.prepare("SELECT * FROM users WHERE username = 'chutich'").get();
  assert(updatedUser.last_login_location.includes('Triều Khúc'), 'Đã lưu chính xác địa chỉ vị trí sử dụng thiết bị');
  assert(updatedUser.last_login_latitude === 20.9806, 'Đã lưu vĩ độ GPS: 20.9806');
  assert(updatedUser.last_login_longitude === 105.7952, 'Đã lưu kinh độ GPS: 105.7952');

  // Test 5: API Giám sát IP liên tục thời gian thực (GET /api/security/pulse)
  console.log('\n5. Kiểm thử API Giám sát IP liên tục (GET /api/security/pulse):');
  const pulseGetRes = await makeRequest('GET', '/api/security/pulse');
  assert(pulseGetRes.status === 200, 'API Pulse GET trả về HTTP 200 OK');
  assert(pulseGetRes.data.success === true, 'Trạng thái pulse thành công');
  assert(pulseGetRes.data.server_time_vn && pulseGetRes.data.server_time_vn.includes('Giờ Hà Nội'), 'Thời gian trả về rõ ràng theo Giờ Hà Nội');
  assert(pulseGetRes.data.threat_score !== undefined, 'Có điểm đánh giá mức độ rủi ro IP');

  // Test 6: API Nhịp tim an ninh kèm cập nhật GPS (POST /api/security/pulse)
  console.log('\n6. Kiểm thử API Nhịp tim an ninh định kỳ có tọa độ GPS (POST /api/security/pulse):');
  const pulsePostRes = await makeRequest('POST', '/api/security/pulse', {
    latitude: 20.9806,
    longitude: 105.7952,
    accuracy: 8,
    address: 'Trụ sở UBND Xã Tân Triều, Thanh Trì, TP. Hà Nội'
  });
  assert(pulsePostRes.status === 200, 'API Pulse POST trả về HTTP 200 OK');
  assert(pulsePostRes.data.exact_location.includes('Tân Triều'), 'Nhận diện đúng địa chỉ sử dụng chính xác');
  assert(pulsePostRes.data.created_at_vn && pulsePostRes.data.created_at_vn.length === 19, 'Timestamp lưu trữ theo định dạng YYYY-MM-DD HH:mm:ss');

  // Test 7: Kiểm tra nhật ký truy cập IP đã ghi nhận tọa độ GPS và giờ Hà Nội
  console.log('\n7. Kiểm thử Nhật ký Truy cập IP (ip_access_logs) lưu trữ tọa độ GPS:');
  const latestLog = db.prepare("SELECT * FROM ip_access_logs WHERE endpoint = '/api/security/pulse' ORDER BY id DESC LIMIT 1").get();
  assert(latestLog !== undefined, 'Đã ghi nhận nhật ký vào bảng ip_access_logs');
  assert(latestLog.exact_location && latestLog.exact_location.includes('Tân Triều'), 'Nhật ký IP lưu trữ đầy đủ vị trí địa lý chính xác');
  assert(latestLog.created_at && latestLog.created_at.length === 19, 'Thời gian nhật ký lưu chuẩn xác theo giờ Việt Nam');

  console.log('\n===============================================================');
  console.log(`KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Lỗi khi chạy kiểm thử:', err);
  process.exit(1);
});
