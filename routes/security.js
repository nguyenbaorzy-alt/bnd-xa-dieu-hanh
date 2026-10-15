const express = require('express');
const crypto = require('crypto');
const { db, logAudit, getVietnamNow } = require('../database/db');

const router = express.Router();

// Helper lấy IP chuẩn của client
function getClientIp(req) {
  let ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip || '127.0.0.1';
  if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
  return ip;
}

// ==========================================
// 1. CAPTCHA ENGINE (BẢO MẬT XÁC MINH CHỐNG ROBOT / GACHA PUZZLE)
// ==========================================

// Sinh thử thách Captcha mới (Math Puzzle / Gacha Verification)
router.get('/captcha/generate', (req, res) => {
  const token = 'cpt_' + crypto.randomBytes(16).toString('hex');
  
  // Tạo bài toán bảo mật ngẫu nhiên
  const num1 = Math.floor(Math.random() * 50) + 10;
  const num2 = Math.floor(Math.random() * 40) + 5;
  const operators = ['+', '-'];
  const op = operators[Math.floor(Math.random() * operators.length)];
  
  let answer;
  let question;
  if (op === '+') {
    answer = String(num1 + num2);
    question = `${num1} + ${num2}`;
  } else {
    // Luôn đảm bảo số dương
    const high = Math.max(num1, num2);
    const low = Math.min(num1, num2);
    answer = String(high - low);
    question = `${high} - ${low}`;
  }

  // Lưu vào database với thời hạn 5 phút
  db.prepare(`
    INSERT INTO captcha_challenges (token, answer, puzzle_type, expires_at)
    VALUES (?, ?, 'math', datetime('now', '+5 minutes', 'localtime'))
  `).run(token, answer);

  // Dọn dẹp các captcha hết hạn cũ
  db.prepare("DELETE FROM captcha_challenges WHERE expires_at < datetime('now', 'localtime')").run();

  // Tạo SVG badge trực quan đẹp mắt
  const svgBadge = `
    <svg xmlns="http://www.w3.org/2000/svg" width="130" height="42" viewBox="0 0 130 42">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="130" height="42" rx="8" fill="url(#g)" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3 3"/>
      <path d="M5 21 Q 30 10, 60 21 T 120 21" fill="none" stroke="#334155" stroke-width="1.5"/>
      <path d="M10 12 Q 50 30, 90 12 T 125 15" fill="none" stroke="#1e3a8a" stroke-width="1"/>
      <text x="65" y="27" font-family="Courier New, monospace" font-size="20" font-weight="900" fill="#38bdf8" text-anchor="middle" letter-spacing="3">${question} = ?</text>
    </svg>
  `.trim();

  res.json({
    token,
    type: 'math',
    question: `${question} = ?`,
    svg: `data:image/svg+xml;utf8,${encodeURIComponent(svgBadge)}`,
    expires_in_seconds: 300,
    instruction: 'Nhập kết quả phép tính toán học trên hình để xác nhận bạn không phải Robot'
  });
});

// Xác thực câu trả lời Captcha
router.post('/captcha/verify', (req, res) => {
  const { token, answer } = req.body;
  if (!token || !answer) {
    return res.status(400).json({ error: 'Vui lòng cung cấp mã thử thách và câu trả lời Captcha' });
  }

  const record = db.prepare(`
    SELECT * FROM captcha_challenges 
    WHERE token = ? AND expires_at > datetime('now', 'localtime')
  `).get(token);

  if (!record) {
    return res.status(400).json({ error: 'Mã Captcha đã hết hạn hoặc không tồn tại. Vui lòng tải lại mã mới.' });
  }

  if (record.answer.trim() !== String(answer).trim()) {
    return res.status(400).json({ error: 'Mã xác nhận Robot không chính xác. Vui lòng kiểm tra lại kết quả.' });
  }

  // Xóa mã đã sử dụng để chống dùng lại (Replay Attack)
  db.prepare('DELETE FROM captcha_challenges WHERE id = ?').run(record.id);

  res.json({
    success: true,
    message: 'Xác minh Robot thành công! Bạn là con người thực sự.'
  });
});

const { inspectIpThreat, resolveIpDetails } = require('../services/ip_intel');

// ==========================================
// 2. PHÂN HỆ QUẢN TRỊ AN NINH MẠNG & QUẢN LÝ IP (B-FIREWALL STUDIO)
// ==========================================

// Tra cứu IP hiện tại của client
router.get('/my-ip', (req, res) => {
  const ip = getClientIp(req);
  const inspection = inspectIpThreat(ip);
  res.json({
    ip,
    ...inspection
  });
});

// Tra cứu Chuyên Sâu Địa Chỉ IP (Deep Forensic Threat Inspection API)
router.get('/ip-inspect/:ip', (req, res) => {
  const targetIp = (req.params.ip || getClientIp(req)).trim();
  const report = inspectIpThreat(targetIp);
  res.json(report);
});

// Thống kê an ninh mạng tổng thể & Phân tích dải mạng
router.get('/stats', (req, res) => {
  const totalLogs = db.prepare('SELECT COUNT(*) as count FROM ip_access_logs').get().count;
  const blockedLogs = db.prepare('SELECT COUNT(*) as count FROM ip_access_logs WHERE is_blocked = 1').get().count;
  const activeBlacklist = db.prepare("SELECT COUNT(*) as count FROM ip_rules WHERE rule_type = 'blacklist' AND is_active = 1").get().count;
  const suspiciousToday = db.prepare("SELECT COUNT(*) as count FROM ip_access_logs WHERE threat_level IN ('suspicious', 'danger') AND created_at >= date('now', 'localtime')").get().count;

  // Lấy top 8 IP truy cập nhiều nhất kèm phân tích ISP
  const rawTopIps = db.prepare(`
    SELECT ip_address, COUNT(*) as hits, 
           MAX(created_at) as last_seen,
           SUM(CASE WHEN is_blocked = 1 THEN 1 ELSE 0 END) as blocked_count,
           SUM(CASE WHEN threat_level = 'danger' THEN 1 ELSE 0 END) as danger_count
    FROM ip_access_logs
    GROUP BY ip_address
    ORDER BY hits DESC LIMIT 8
  `).all();

  const topIps = rawTopIps.map(item => {
    const geo = resolveIpDetails(item.ip_address);
    return {
      ...item,
      isp: geo.isp,
      location: geo.location
    };
  });

  // Lấy các dải IP đang bị chặn
  const blacklistedList = db.prepare(`
    SELECT id, ip_address, reason, is_active, created_at
    FROM ip_rules
    WHERE rule_type = 'blacklist' AND is_active = 1
    ORDER BY id DESC LIMIT 20
  `).all();

  res.json({
    summary: {
      total_requests: totalLogs,
      blocked_attempts: blockedLogs,
      active_blacklist_count: activeBlacklist,
      suspicious_today: suspiciousToday,
      firewall_status: 'ACTIVE_GUARD_24_7',
      system_protection: 'SHIELD_LEVEL_MAX'
    },
    top_ips: topIps,
    blacklisted_ips: blacklistedList
  });
});

// Lấy danh sách lịch sử truy cập IP gần đây có làm giàu thông tin địa lý & nhà mạng
router.get('/ip-logs', (req, res) => {
  const { ip, threat, blocked, limit = 50 } = req.query;

  let sql = 'SELECT * FROM ip_access_logs WHERE 1=1';
  const params = [];

  if (ip && ip.trim()) {
    sql += ' AND ip_address LIKE ?';
    params.push(`%${ip.trim()}%`);
  }
  if (threat && threat !== 'all') {
    sql += ' AND threat_level = ?';
    params.push(threat);
  }
  if (blocked !== undefined && blocked !== 'all') {
    sql += ' AND is_blocked = ?';
    params.push(blocked === '1' ? 1 : 0);
  }

  sql += ' ORDER BY id DESC LIMIT ?';
  params.push(parseInt(limit, 10));

  const logs = db.prepare(sql).all(...params);
  
  // Làm giàu dữ liệu ISP & Vị trí cho từng IP trong log
  const enrichedLogs = logs.map(l => {
    const geo = resolveIpDetails(l.ip_address);
    return {
      ...l,
      isp: geo.isp,
      location: geo.location
    };
  });

  res.json(enrichedLogs);
});

// Lấy danh sách quy tắc IP (Blacklist & Whitelist)
router.get('/ip-rules', (req, res) => {
  const rules = db.prepare(`
    SELECT r.*, u.full_name as author_name
    FROM ip_rules r
    LEFT JOIN users u ON r.created_by = u.id
    ORDER BY r.id DESC
  `).all();
  res.json(rules);
});

// Thêm IP vào danh sách đen chặn truy cập (Ban IP)
router.post('/ip-rules', (req, res) => {
  const { ip_address, rule_type = 'blacklist', reason } = req.body;
  if (!ip_address || !ip_address.trim()) {
    return res.status(400).json({ error: 'Vui lòng cung cấp địa chỉ IP cần chặn hoặc cấp quyền' });
  }

  const cleanIp = ip_address.trim();
  const ruleReason = (reason || 'Phát hiện hành vi quét cổng hoặc dò mật khẩu trái phép').trim();

  // Kiểm tra đã có quy tắc chưa
  const existing = db.prepare('SELECT id FROM ip_rules WHERE ip_address = ? AND rule_type = ?').get(cleanIp, rule_type);
  let ruleId;
  if (existing) {
    db.prepare("UPDATE ip_rules SET is_active = 1, reason = ?, created_at = datetime('now', 'localtime') WHERE id = ?")
      .run(ruleReason, existing.id);
    ruleId = existing.id;
  } else {
    const info = db.prepare(`
      INSERT INTO ip_rules (ip_address, rule_type, reason, created_by, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run(cleanIp, rule_type, ruleReason, req.user?.id || 1);
    ruleId = Number(info.lastInsertRowid);
  }

  logAudit(req.user?.id || 1, req.user?.username || 'admin', 'admin', 'BAN_IP_ADDRESS', 'security', cleanIp, `Thêm IP ${cleanIp} vào danh sách chặn (${rule_type}): ${ruleReason}`, getClientIp(req));

  res.json({
    success: true,
    id: ruleId,
    message: `Đã đưa địa chỉ IP ${cleanIp} vào danh sách ${rule_type === 'blacklist' ? 'CHẶN TRUY CẬP (Blacklist)' : 'DANH SÁCH TIN CẬY (Whitelist)'} thành công!`
  });
});

// Gỡ chặn IP (Unban IP)
router.delete('/ip-rules/:id', (req, res) => {
  const ruleId = req.params.id;
  const rule = db.prepare('SELECT * FROM ip_rules WHERE id = ?').get(ruleId);
  if (!rule) {
    return res.status(404).json({ error: 'Không tìm thấy quy tắc IP này' });
  }

  db.prepare('DELETE FROM ip_rules WHERE id = ?').run(ruleId);

  logAudit(req.user?.id || 1, req.user?.username || 'admin', 'admin', 'UNBAN_IP_ADDRESS', 'security', rule.ip_address, `Gỡ chặn IP ${rule.ip_address} khỏi tường lửa`, getClientIp(req));

  res.json({
    success: true,
    message: `Đã gỡ chặn địa chỉ IP ${rule.ip_address} thành công. IP này có thể truy cập lại bình thường.`
  });
});

// ==========================================
// 3. CONTINUOUS REAL-TIME IP MONITORING PULSE (GIÁM SÁT IP LIÊN TỤC THEO GIỜ HÀ NỘI)
// ==========================================

// Nhận nhịp tim an ninh định kỳ (Heartbeat Pulse) từ trình duyệt / thiết bị người dùng
router.get('/pulse', (req, res) => {
  const ip = getClientIp(req);
  const geo = resolveIpDetails(ip);
  const report = inspectIpThreat(ip);
  const isBlocked = db.prepare("SELECT id FROM ip_rules WHERE ip_address = ? AND rule_type = 'blacklist' AND is_active = 1").get(ip);
  const threatScore = report.threat_analysis?.threat_score ?? 0;
  const threatLevel = report.threat_analysis?.threat_level ?? 'normal';
  
  const now = new Date();
  const vnTimeStr = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour12: false
  }).format(now);
  const vnTimestamp = getVietnamNow();

  res.json({
    success: true,
    status: 'MONITORING_ACTIVE',
    ip_address: ip,
    isp: geo.isp,
    asn: geo.asn,
    location: geo.location,
    connection_type: geo.connection_type,
    threat_score: threatScore,
    threat_level: threatLevel,
    is_blocked: !!isBlocked,
    server_time_vn: `${vnTimeStr} (Giờ Hà Nội - GMT+7)`,
    created_at_vn: vnTimestamp,
    timestamp: Date.now()
  });
});

router.post('/pulse', (req, res) => {
  const ip = getClientIp(req);
  const { latitude, longitude, accuracy, address } = req.body || {};
  const geo = resolveIpDetails(ip);
  const report = inspectIpThreat(ip);
  const isBlocked = db.prepare("SELECT id FROM ip_rules WHERE ip_address = ? AND rule_type = 'blacklist' AND is_active = 1").get(ip);
  const threatScore = report.threat_analysis?.threat_score ?? 0;
  const threatLevel = report.threat_analysis?.threat_level ?? 'normal';
  
  const now = new Date();
  const vnTimeStr = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour12: false
  }).format(now);
  const vnTimestamp = getVietnamNow();

  let locDesc = geo.location;
  if (latitude && longitude) {
    locDesc = address || `Tọa độ GPS: ${Number(latitude).toFixed(4)}°N, ${Number(longitude).toFixed(4)}°E (±${Math.round(accuracy || 0)}m)`;
  }

  // Ghi nhật ký giám sát liên tục vào database
  try {
    db.prepare(`
      INSERT INTO ip_access_logs (ip_address, user_agent, endpoint, method, status_code, username, is_blocked, threat_level, created_at, latitude, longitude, exact_location)
      VALUES (?, ?, '/api/security/pulse', 'POST', 200, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ip,
      (req.headers['user-agent'] || 'B-Firewall Pulse Agent').substring(0, 150),
      req.user?.username || 'client_monitor',
      isBlocked ? 1 : 0,
      threatLevel,
      vnTimestamp,
      latitude || null,
      longitude || null,
      locDesc
    );
  } catch (e) {}

  res.json({
    success: true,
    status: 'MONITORING_ACTIVE',
    ip_address: ip,
    isp: geo.isp,
    asn: geo.asn,
    location: geo.location,
    exact_location: locDesc,
    threat_score: threatScore,
    threat_level: threatLevel,
    is_blocked: !!isBlocked,
    server_time_vn: `${vnTimeStr} (Giờ Hà Nội - GMT+7)`,
    created_at_vn: vnTimestamp,
    timestamp: Date.now()
  });
});

module.exports = {
  securityRouter: router,
  getClientIp
};
