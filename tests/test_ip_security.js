const http = require('http');
const { db } = require('../database/db');

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
  console.log('=== BẮT ĐẦU KIỂM THỬ HỆ THỐNG AN NINH IP B-FIREWALL & CAPTCHA ===\n');

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

  try {
    // Dọn dẹp dữ liệu kiểm thử cũ nếu có
    db.prepare("DELETE FROM ip_rules WHERE ip_address = '203.0.113.195'").run();
    db.prepare("DELETE FROM ip_access_logs WHERE ip_address = '203.0.113.195'").run();

    // 1. Kiểm tra sinh mã Captcha
    console.log('--- 1. Kiểm thử sinh mã Robot Captcha ---');
    const cptGen = await request('GET', '/api/security/captcha/generate');
    assert(cptGen.status === 200, 'Tạo Captcha trả về mã HTTP 200');
    assert(cptGen.data.token && cptGen.data.token.startsWith('cpt_'), 'Token captcha đúng định dạng');
    assert(cptGen.data.svg && cptGen.data.svg.startsWith('data:image/svg+xml'), 'Trả về ảnh SVG vector');
    assert(cptGen.data.question && cptGen.data.question.includes('='), 'Có nội dung câu hỏi phép tính');

    const token = cptGen.data.token;

    // 2. Kiểm tra xác minh Captcha với đáp án sai
    console.log('\n--- 2. Kiểm thử xác minh Captcha với đáp án sai ---');
    const wrongVerify = await request('POST', '/api/security/captcha/verify', {
      token: token,
      answer: '999999'
    });
    assert(wrongVerify.status === 400, 'Đáp án sai trả về HTTP 400');
    assert(wrongVerify.data.error.includes('không chính xác'), 'Báo lỗi đáp án captcha không chính xác');

    // 3. Kiểm tra xác minh Captcha với đáp án đúng từ DB
    console.log('\n--- 3. Kiểm thử xác minh Captcha với đáp án đúng ---');
    const cptRow = db.prepare('SELECT * FROM captcha_challenges WHERE token = ?').get(token);
    assert(!!cptRow, 'Mã Captcha được lưu trong bảng captcha_challenges');

    const correctVerify = await request('POST', '/api/security/captcha/verify', {
      token: token,
      answer: cptRow.answer
    });
    assert(correctVerify.status === 200, 'Xác minh đáp án đúng trả về HTTP 200');
    assert(correctVerify.data.success === true, 'Xác thực Robot thành công');

    // Kiểm tra replay attack (dùng lại mã)
    const replayVerify = await request('POST', '/api/security/captcha/verify', {
      token: token,
      answer: cptRow.answer
    });
    assert(replayVerify.status === 400, 'Không cho phép dùng lại mã Captcha (chống Replay Attack)');

    // 4. Kiểm tra lấy thống kê an ninh mạng
    console.log('\n--- 4. Kiểm thử API Thống kê B-Firewall Stats ---');
    const statsRes = await request('GET', '/api/security/stats');
    assert(statsRes.status === 200, 'Lấy thống kê an ninh trả về HTTP 200');
    assert(typeof statsRes.data.summary?.total_requests === 'number', 'Có thông tin tổng số lượt truy cập');
    assert(typeof statsRes.data.summary?.blocked_attempts === 'number', 'Có thông tin số lượt bị tường lửa chặn');

    // 5. Kiểm thử Tường lửa Chặn IP (B-Firewall Blacklist Enforcement)
    console.log('\n--- 5. Kiểm thử Tường lửa Chặn IP (Blacklist Rule & 403 Forbidden) ---');
    const testMaliciousIp = '203.0.113.195'; // RFC 5737 TEST-NET-3 (IP độc hại giả lập)

    // Tạo rule chặn IP
    const addRuleRes = await request('POST', '/api/security/ip-rules', {
      ip_address: testMaliciousIp,
      rule_type: 'blacklist',
      reason: 'Phát hiện hành vi quét lỗ hổng SQLi/XSS tự động'
    });
    assert(addRuleRes.status === 200, `Thêm IP ${testMaliciousIp} vào Blacklist thành công`);
    const ruleId = addRuleRes.data.id;

    // Gửi yêu cầu từ IP bị chặn thông qua header x-forwarded-for
    const blockedReq = await request('GET', '/api/security/stats', null, {
      'x-forwarded-for': testMaliciousIp
    });
    assert(blockedReq.status === 403, `Yêu cầu từ IP ${testMaliciousIp} bị B-Firewall chặn với HTTP 403 Forbidden`);
    assert(blockedReq.data.error?.includes('TƯỜNG LỬA'), 'Thông báo lỗi xác nhận chặn bởi TƯỜNG LỬA AN NINH MẠNG');

    // 6. Kiểm tra Nhật ký Truy cập IP (Access Logs)
    console.log('\n--- 6. Kiểm thử Nhật ký Truy cập IP (IP Access Logs) ---');
    const logsRes = await request('GET', `/api/security/ip-logs?ip=${testMaliciousIp}`);
    assert(logsRes.status === 200, 'Lấy danh sách nhật ký IP thành công');
    const logs = Array.isArray(logsRes.data) ? logsRes.data : [];
    assert(logs.length > 0, `Đã ghi nhận nhật ký của IP ${testMaliciousIp}`);
    if (logs.length > 0) {
      assert(logs[0].is_blocked === 1, 'Nhật ký đánh dấu chính xác là bị chặn (is_blocked = 1)');
    }

    // 7. Mở chặn IP (Unban) và kiểm tra lại
    console.log('\n--- 7. Kiểm thử Mở chặn IP (Unban) ---');
    const deleteRes = await request('DELETE', `/api/security/ip-rules/${ruleId}`);
    assert(deleteRes.status === 200, `Xóa IP ${testMaliciousIp} khỏi Blacklist thành công`);

    const unblockedReq = await request('GET', '/api/security/stats', null, {
      'x-forwarded-for': testMaliciousIp
    });
    assert(unblockedReq.status === 200, `Sau khi Unban, IP ${testMaliciousIp} truy cập lại bình thường (HTTP 200)`);

    console.log('\n======================================================');
    console.log(`KẾT QUẢ KIỂM THỬ: ${passed} PASSED | ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Lỗi khi chạy kiểm thử:', err);
    process.exit(1);
  }
}

runTests();
