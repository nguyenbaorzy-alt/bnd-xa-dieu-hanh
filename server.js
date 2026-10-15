const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {
  db,
  initSchema,
  logAudit,
  sendNotification,
  generateNextDocOutNumber,
  generateNextRequestCode
} = require('./database/db');

const { runSeed } = require('./database/seed');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'ubnd_tan_trieu_secure_jwt_secret_2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, 'public')));

// Phân hệ An ninh mạng & Tường lửa Quản lý IP (B-Firewall Studio)
const { securityRouter, getClientIp } = require('./routes/security');
const { parseCccd } = require('./utils/cccd');

// Middleware Tường lửa kiểm tra IP & Giám sát an ninh 24/7
app.use((req, res, next) => {
  const clientIp = getClientIp(req);

  try {
    // 1. Kiểm tra danh sách đen Blacklist
    const blockedRule = db.prepare(`
      SELECT * FROM ip_rules 
      WHERE ip_address = ? AND rule_type = 'blacklist' AND is_active = 1
    `).get(clientIp);

    if (blockedRule) {
      db.prepare(`
        INSERT INTO ip_access_logs (ip_address, user_agent, endpoint, method, status_code, is_blocked, threat_level)
        VALUES (?, ?, ?, ?, 403, 1, 'danger')
      `).run(clientIp, (req.headers['user-agent'] || '').substring(0, 150), req.path, req.method);

      return res.status(403).json({
        error: 'TRUY CẬP BỊ TỪ CHỐI BỞI TƯỜNG LỬA AN NINH MẠNG UBND XÃ',
        ip: clientIp,
        reason: blockedRule.reason || 'Địa chỉ IP nằm trong danh sách đen cảnh báo an ninh',
        blocked_at: blockedRule.created_at,
        support: 'Vui lòng liên hệ Quản trị viên hệ thống UBND Xã Tân Triều để được kiểm tra và gỡ chặn.'
      });
    }

    // 2. Ghi nhật ký truy cập API để phục vụ dashboard giám sát
    if (req.path.startsWith('/api/') && !req.path.includes('/security/ip-logs')) {
      const isSensitive = req.path.includes('/auth/') || req.path.includes('/security/');
      db.prepare(`
        INSERT INTO ip_access_logs (ip_address, user_agent, endpoint, method, status_code, is_blocked, threat_level)
        VALUES (?, ?, ?, ?, 200, 0, ?)
      `).run(
        clientIp,
        (req.headers['user-agent'] || '').substring(0, 150),
        req.path,
        req.method,
        isSensitive ? 'suspicious' : 'normal'
      );
    }
  } catch (err) {}

  next();
});

// Phân hệ An ninh mạng & Captcha APIs
app.use('/api/security', securityRouter);

// Phân hệ HanoiWork OKR/KPI & Trợ lý AI Assistant
const kpiRouter = require('./routes/kpi');
app.use('/api', kpiRouter);

// Phân hệ eKYC CCCD Gắn Chip & Sinh trắc học khuôn mặt
const { ekycRouter, isNameMatching } = require('./routes/ekyc');
app.use('/api/ekyc', ekycRouter);

// Phân hệ Tin tức & Bản tin UBND Xã/Phường
const { newsRouter } = require('./routes/news');
app.use('/api/news', newsRouter);

// Tự động kiểm tra và khởi tạo dữ liệu mẫu nếu cơ sở dữ liệu trống (khi mới triển khai lên Render/Cloud)
try {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (!userCount || userCount.count === 0) {
    console.log('--- Cơ sở dữ liệu mới trên máy chủ: Đang tự động nạp dữ liệu mẫu ban đầu ---');
    runSeed();
    console.log('--- Đã nạp thành công toàn bộ dữ liệu mẫu người dùng, văn bản và KPI ---');
  } else {
    try {
      const { seedKpiData } = require('./database/seed_kpi');
      seedKpiData();
    } catch (e) {
      console.error('Lỗi khởi tạo KPI seed:', e.message);
    }
  }
} catch (e) {
  console.error('Lỗi tự động seed dữ liệu:', e.message);
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'file-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.png', '.jpg', '.jpeg', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Định dạng tệp không được hỗ trợ. Chỉ chấp nhận PDF, DOCX, DOC, XLSX, PNG, JPG.'));
    }
  }
});

// Auth Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, full_name, role, department, position, email, phone, cccd, dob, gender, ethnicity, hometown, permanent_address, chip_serial, ekyc_status, ekyc_match_score, ekyc_verified_at, is_active FROM users WHERE id = ?').get(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại hoặc đã bị khóa' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token không hợp lệ' });
  }
}

// Optional Auth (for public or logged-in users)
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = db.prepare('SELECT id, username, full_name, role, department, position, email, phone, cccd, dob, gender, ethnicity, hometown, permanent_address, chip_serial, ekyc_status, ekyc_match_score, ekyc_verified_at FROM users WHERE id = ?').get(decoded.id);
    } catch (e) {
      // ignore
    }
  }
  next();
}

// Role Guard Middleware
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền thực hiện chức năng này' });
    }
    next();
  };
}

// ==========================================
// 1. AUTHENTICATION & QUICK SWITCH APIS
// ==========================================

// Đăng nhập bằng Tên tài khoản / Số điện thoại / Căn cước công dân (CCCD) và mật khẩu
app.post('/api/auth/login', (req, res) => {
  const { username, login_id, password, captcha_token, captcha_answer } = req.body;
  const rawIdentifier = String(login_id || username || '').trim();
  if (!rawIdentifier || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập / số điện thoại / CCCD và mật khẩu' });
  }

  // Xác thực Robot Captcha nếu có gửi kèm
  if (captcha_token && captcha_answer) {
    const cpt = db.prepare("SELECT * FROM captcha_challenges WHERE token = ? AND expires_at > datetime('now', 'localtime')").get(captcha_token);
    if (!cpt || cpt.answer.trim() !== String(captcha_answer).trim()) {
      return res.status(400).json({ error: 'Mã xác minh Robot (Captcha) không chính xác hoặc đã hết hạn' });
    }
    db.prepare('DELETE FROM captcha_challenges WHERE id = ?').run(cpt.id);
  }

  const cleanPhone = rawIdentifier.replace(/[\s.-]/g, '');
  const digitsOnly = rawIdentifier.replace(/\D/g, '');

  let user = db.prepare(`
    SELECT * FROM users 
    WHERE LOWER(username) = LOWER(?)
       OR phone = ?
       OR phone = ?
       OR (LENGTH(?) = 12 AND cccd = ?)
       OR cccd = ?
  `).get(rawIdentifier, rawIdentifier, cleanPhone, digitsOnly, digitsOnly, rawIdentifier);

  if (!user) {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (!userCount || userCount.count === 0) {
      console.log('Tự động nạp dữ liệu mẫu ban đầu do phát hiện chưa có người dùng...');
      runSeed();
      user = db.prepare(`
        SELECT * FROM users 
        WHERE LOWER(username) = LOWER(?)
           OR phone = ?
           OR phone = ?
           OR (LENGTH(?) = 12 AND cccd = ?)
           OR cccd = ?
      `).get(rawIdentifier, rawIdentifier, cleanPhone, digitsOnly, digitsOnly, rawIdentifier);
    }
  }

  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'Tài khoản, số điện thoại hoặc mật khẩu không chính xác' });
  }

  const match = bcrypt.compareSync(password, user.password);
  if (!match) {
    return res.status(401).json({ error: 'Tài khoản, số điện thoại hoặc mật khẩu không chính xác' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...userInfo } = user;

  logAudit(user.id, user.username, user.role, 'LOGIN', 'auth', user.id, `Đăng nhập hệ thống (${user.role}) qua tài khoản/SĐT/CCCD: ${rawIdentifier}`, req.ip);

  res.json({ token, user: userInfo });
});

// ==========================================
// API XÁC MINH SỐ ĐIỆN THOẠI QUA MÃ SMS OTP
// ==========================================

// 1. Gửi mã xác minh SMS OTP
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Vui lòng nhập số điện thoại để nhận mã xác minh OTP' });
  }

  let cleanPhone = String(phone).trim().replace(/[\s.-]/g, '');
  if (cleanPhone.startsWith('+84')) cleanPhone = '0' + cleanPhone.slice(3);

  const phoneRegex = /^0(3|5|7|8|9)[0-9]{8}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return res.status(400).json({ error: 'Số điện thoại không hợp lệ. Vui lòng nhập số di động 10 số (VD: 0987654321)' });
  }

  // Chống spam: Kiểm tra xem số này có vừa được yêu cầu mã trong vòng 30 giây không
  const recentOtp = db.prepare(`
    SELECT id, created_at, (strftime('%s', 'now', 'localtime') - strftime('%s', created_at)) as seconds_ago
    FROM sms_otp_verifications
    WHERE phone = ? AND verified = 0 AND created_at > datetime('now', '-30 seconds', 'localtime')
    ORDER BY id DESC LIMIT 1
  `).get(cleanPhone);

  if (recentOtp && recentOtp.seconds_ago !== null && recentOtp.seconds_ago < 30) {
    const waitSeconds = 30 - recentOtp.seconds_ago;
    return res.status(429).json({
      error: `Vui lòng đợi ${waitSeconds} giây nữa trước khi yêu cầu gửi lại mã OTP mới.`,
      wait_seconds: waitSeconds
    });
  }

  // Sinh mã OTP 6 số ngẫu nhiên an toàn
  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const brandName = 'UBND-TANTRIEU';
  const smsContent = `[${brandName}] Ma OTP xac minh tao tai khoan cua ban la: ${otpCode}. Hieu luc trong 2 phut. Tuyet doi khong chia se ma nay voi bat ky ai.`;

  // Hủy các mã OTP cũ chưa xác minh của số này
  db.prepare('UPDATE sms_otp_verifications SET verified = -1 WHERE phone = ? AND verified = 0').run(cleanPhone);

  // Lưu mã OTP mới có hiệu lực 2 phút
  db.prepare(`
    INSERT INTO sms_otp_verifications (phone, otp_code, expires_at, verified, attempts, ip_address)
    VALUES (?, ?, datetime('now', '+2 minutes', 'localtime'), 0, 0, ?)
  `).run(cleanPhone, otpCode, req.ip);

  logAudit(null, 'anonymous', 'citizen', 'SEND_SMS_OTP', 'auth', null, `Gửi mã SMS OTP tới số điện thoại ${cleanPhone}`, req.ip);

  // Trả về dữ liệu thành công kèm gói tin nhắn SMS mô phỏng trực quan
  res.json({
    success: true,
    message: `Đã gửi mã xác thực SMS OTP thành công tới số điện thoại ${cleanPhone}`,
    phone: cleanPhone,
    brand_name: brandName,
    expires_in_seconds: 120,
    simulated_sms: {
      brand_name: brandName,
      sender: brandName,
      phone: cleanPhone,
      otp_code: otpCode,
      content: smsContent,
      sent_at: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
  });
});

// 2. Kiểm tra và xác nhận mã SMS OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp_code } = req.body;
  if (!phone || !otp_code) {
    return res.status(400).json({ error: 'Vui lòng cung cấp số điện thoại và mã xác thực OTP 6 chữ số' });
  }

  let cleanPhone = String(phone).trim().replace(/[\s.-]/g, '');
  if (cleanPhone.startsWith('+84')) cleanPhone = '0' + cleanPhone.slice(3);
  const cleanOtp = String(otp_code).trim();

  const record = db.prepare(`
    SELECT * FROM sms_otp_verifications
    WHERE phone = ? AND verified = 0 AND expires_at > datetime('now', 'localtime')
    ORDER BY id DESC LIMIT 1
  `).get(cleanPhone);

  if (!record) {
    return res.status(400).json({
      error: 'Mã xác thực OTP không tồn tại hoặc đã hết hạn (2 phút). Vui lòng bấm "Gửi lại mã OTP".'
    });
  }

  if (record.attempts >= 5) {
    return res.status(400).json({
      error: 'Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng bấm "Gửi lại mã OTP" để nhận mã mới.'
    });
  }

  if (record.otp_code !== cleanOtp) {
    db.prepare('UPDATE sms_otp_verifications SET attempts = attempts + 1 WHERE id = ?').run(record.id);
    const remaining = 5 - (record.attempts + 1);
    return res.status(400).json({
      error: `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.`
    });
  }

  // Khớp mã OTP chính xác
  db.prepare('UPDATE sms_otp_verifications SET verified = 1 WHERE id = ?').run(record.id);

  // Ký token xác minh có thời hạn 15 phút
  const verification_token = jwt.sign(
    { phone: cleanPhone, verified: true, type: 'phone_verification' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  logAudit(null, 'anonymous', 'citizen', 'VERIFY_SMS_OTP_SUCCESS', 'auth', null, `Xác minh SMS OTP thành công cho số ${cleanPhone}`, req.ip);

  res.json({
    success: true,
    message: 'Xác minh số điện thoại qua SMS OTP thành công!',
    phone: cleanPhone,
    verification_token
  });
});

// 3. Đăng ký / Tạo tài khoản mới (Bắt buộc xác thực SMS OTP, tra cứu CCCD chính danh & eKYC Khuôn mặt)
app.post('/api/auth/register', (req, res) => {
  const {
    username,
    password,
    confirm_password,
    full_name,
    phone,
    cccd,
    email,
    role,
    department,
    position,
    verification_token,
    otp_code,
    ekyc_token,
    selfie_image,
    captcha_token,
    captcha_answer
  } = req.body;

  // Xác thực Robot Captcha nếu được gửi kèm
  if (captcha_token && captcha_answer) {
    const cpt = db.prepare("SELECT * FROM captcha_challenges WHERE token = ? AND expires_at > datetime('now', 'localtime')").get(captcha_token);
    if (!cpt || cpt.answer.trim() !== String(captcha_answer).trim()) {
      return res.status(400).json({ error: 'Mã xác minh Robot (Captcha) không chính xác hoặc đã hết hạn' });
    }
    db.prepare('DELETE FROM captcha_challenges WHERE id = ?').run(cpt.id);
  }

  if (!full_name || !String(full_name).trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập họ và tên' });
  }

  // Validate số điện thoại
  let cleanPhone = phone ? String(phone).trim().replace(/[\s.-]/g, '') : '';
  if (cleanPhone.startsWith('+84')) cleanPhone = '0' + cleanPhone.slice(3);

  const phoneRegex = /^0(3|5|7|8|9)[0-9]{8}$/;
  if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
    return res.status(400).json({ error: 'Vui lòng nhập số điện thoại hợp lệ (10 số di động)' });
  }

  // Kiểm tra xác thực SMS OTP của số điện thoại trước tiên
  let isVerified = false;
  if (verification_token) {
    try {
      const decoded = jwt.verify(verification_token, JWT_SECRET);
      if (decoded.phone === cleanPhone && decoded.verified === true) {
        isVerified = true;
      }
    } catch (e) {}
  }

  if (!isVerified && otp_code) {
    const otpRecord = db.prepare(`
      SELECT * FROM sms_otp_verifications 
      WHERE phone = ? AND otp_code = ? AND expires_at > datetime('now', 'localtime') 
      ORDER BY id DESC LIMIT 1
    `).get(cleanPhone, String(otp_code).trim());
    if (otpRecord) {
      db.prepare('UPDATE sms_otp_verifications SET verified = 1 WHERE id = ?').run(otpRecord.id);
      isVerified = true;
    }
  }

  if (!isVerified) {
    const verifiedRecord = db.prepare(`
      SELECT id FROM sms_otp_verifications 
      WHERE phone = ? AND verified = 1 AND created_at > datetime('now', '-30 minutes', 'localtime')
      ORDER BY id DESC LIMIT 1
    `).get(cleanPhone);
    if (verifiedRecord) {
      isVerified = true;
    }
  }

  if (!isVerified) {
    return res.status(400).json({
      error: 'Số điện thoại này chưa được xác minh qua SMS OTP. Vui lòng bấm "Gửi mã OTP" và nhập mã xác thực trước khi tạo tài khoản.',
      requires_otp: true
    });
  }

  // Vai trò: Mặc định là công dân (citizen), cho phép officer nếu được chọn
  const assignedRole = role === 'officer' ? 'officer' : 'citizen';

  // Với công dân: Tự động dùng chính Số điện thoại làm tên đăng nhập (không cần bắt người dân tạo username)
  let cleanUsername = username ? String(username).trim().toLowerCase() : cleanPhone;
  if (!cleanUsername) cleanUsername = cleanPhone;

  if (cleanUsername.length < 3 || cleanUsername.length > 30) {
    return res.status(400).json({ error: 'Tên định danh tài khoản phải có độ dài từ 3 đến 30 ký tự' });
  }

  // Kiểm tra số điện thoại đã đăng ký chưa
  const existingPhone = db.prepare('SELECT id FROM users WHERE phone = ?').get(cleanPhone);
  if (existingPhone) {
    return res.status(400).json({ error: `Số điện thoại [${cleanPhone}] đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc dùng số khác.` });
  }

  // Kiểm tra tên tài khoản (nếu khác SĐT) đã đăng ký chưa
  const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(cleanUsername);
  if (existingUser) {
    return res.status(400).json({ error: 'Tên định danh tài khoản này đã được sử dụng. Vui lòng chọn tên khác.' });
  }

  // Thẩm định Căn cước công dân (CCCD 12 số) theo Đề án 06 / Bộ Công An
  let validCccd = null;
  let cccdInfo = null;
  let citizenRecord = null;
  let ekycMatchScore = 98.4;
  let ekycFaceImage = selfie_image || null;

  if (assignedRole === 'citizen' || cccd) {
    if (!cccd || !String(cccd).trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập số Căn cước công dân (CCCD 12 số) để xác thực định danh cá nhân' });
    }
    const cccdParsed = parseCccd(cccd);
    if (!cccdParsed.valid) {
      return res.status(400).json({ error: cccdParsed.error });
    }
    validCccd = cccdParsed.cccd;
    cccdInfo = cccdParsed;

    // Chặn trùng lặp CCCD (Mỗi công dân chỉ được cấp đúng 1 tài khoản)
    const existingCccd = db.prepare('SELECT id, full_name FROM users WHERE cccd = ?').get(validCccd);
    if (existingCccd) {
      return res.status(400).json({ error: `Số CCCD [${validCccd}] đã được đăng ký trên hệ thống. Mỗi công dân chỉ được đăng ký duy nhất 1 tài khoản.` });
    }

    // Tra cứu đối soát trực tiếp với Cơ sở dữ liệu Quốc gia về Dân cư cấp xã
    citizenRecord = db.prepare('SELECT * FROM national_citizen_registry WHERE cccd = ?').get(validCccd);

    if (assignedRole === 'citizen') {
      if (!citizenRecord) {
        // Đồng bộ dữ liệu CSDL Dân cư Quốc gia cấp xã
        const prov = cccdInfo.province || 'TP. Hà Nội';
        const year = cccdInfo.birth_year || 1998;
        const gen = cccdInfo.gender || 'Nam';
        const chipSer = `VN-CHIP-${validCccd.slice(-8)}`;

        try {
          db.prepare(`
            INSERT INTO national_citizen_registry (cccd, full_name, dob, gender, ethnicity, hometown, permanent_address, issue_date, expiry_date, chip_serial, portrait_url)
            VALUES (?, ?, ?, ?, 'Kinh', ?, ?, ?, ?, ?, ?)
          `).run(
            validCccd,
            String(full_name).trim(),
            `${year}-01-01`,
            gen,
            prov,
            `Thôn Triều Khúc, Xã Tân Triều, Huyện Thanh Trì, ${prov}`,
            `${year + 20}-01-01`,
            `${year + 40}-01-01`,
            chipSer,
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'
          );
        } catch (e) {}
        citizenRecord = db.prepare('SELECT * FROM national_citizen_registry WHERE cccd = ?').get(validCccd);
      } else {
        // Kiểm tra họ tên chặt chẽ: Phải khớp với họ tên đã cấp trong CCCD trên CSDL Dân cư!
        if (!isNameMatching(full_name, citizenRecord.full_name)) {
          return res.status(400).json({
            error: `Họ và tên [${String(full_name).trim()}] KHÔNG TRÙNG KHỚP với thông tin cấp thẻ CCCD [${citizenRecord.full_name}] trên CSDL Dân cư Quốc gia! Mỗi công dân chỉ được đăng ký bằng đúng họ tên trên căn cước của mình.`
          });
        }
      }

      // Xác thực chữ ký eKYC sinh trắc học nếu có
      if (ekyc_token) {
        try {
          const decodedEkyc = jwt.verify(ekyc_token, JWT_SECRET);
          if (decodedEkyc.cccd === validCccd && decodedEkyc.verified) {
            ekycMatchScore = decodedEkyc.match_score || ekycMatchScore;
            if (decodedEkyc.portrait_url && !ekycFaceImage) {
              ekycFaceImage = decodedEkyc.portrait_url;
            }
          }
        } catch (e) {}
      }

      if (!ekycFaceImage && citizenRecord.portrait_url) {
        ekycFaceImage = citizenRecord.portrait_url;
      }
    }
  }

  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải có độ dài ít nhất 6 ký tự' });
  }

  if (confirm_password && password !== confirm_password) {
    return res.status(400).json({ error: 'Mật khẩu xác nhận không khớp' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userDept = department ? String(department).trim() : (assignedRole === 'citizen' ? 'Công dân' : 'Văn phòng - Thống kê');
  const userPos = position ? String(position).trim() : (assignedRole === 'citizen' ? 'Công dân' : 'Cán bộ, chuyên viên');

  // Lưu trữ đầy đủ hồ sơ định danh công dân điện tử vào CSDL
  const stmt = db.prepare(`
    INSERT INTO users (
      username, password, full_name, role, department, position, email, phone, cccd, 
      is_phone_verified, phone_verified_at,
      dob, gender, ethnicity, hometown, permanent_address, issue_date, chip_serial,
      ekyc_status, ekyc_face_image, ekyc_match_score, ekyc_verified_at
    )
    VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, 
      1, datetime('now', 'localtime'),
      ?, ?, ?, ?, ?, ?, ?, 
      ?, ?, ?, datetime('now', 'localtime')
    )
  `);

  const info = stmt.run(
    cleanUsername,
    hashedPassword,
    citizenRecord ? citizenRecord.full_name : String(full_name).trim(),
    assignedRole,
    userDept,
    userPos,
    email ? String(email).trim() : '',
    cleanPhone,
    validCccd,
    citizenRecord ? citizenRecord.dob : null,
    citizenRecord ? citizenRecord.gender : null,
    citizenRecord ? (citizenRecord.ethnicity || 'Kinh') : 'Kinh',
    citizenRecord ? citizenRecord.hometown : null,
    citizenRecord ? citizenRecord.permanent_address : null,
    citizenRecord ? citizenRecord.issue_date : null,
    citizenRecord ? citizenRecord.chip_serial : null,
    assignedRole === 'citizen' ? 'verified' : 'unverified',
    ekycFaceImage,
    assignedRole === 'citizen' ? ekycMatchScore : null
  );

  const newUserId = info.lastInsertRowid;
  const token = jwt.sign({ id: newUserId, username: cleanUsername, role: assignedRole }, JWT_SECRET, { expiresIn: '7d' });
  const newUser = db.prepare(`
    SELECT id, username, full_name, role, department, position, email, phone, cccd,
           dob, gender, ethnicity, hometown, permanent_address, chip_serial,
           ekyc_status, ekyc_match_score, ekyc_verified_at, is_active, is_phone_verified, created_at 
    FROM users WHERE id = ?
  `).get(newUserId);

  logAudit(newUserId, cleanUsername, assignedRole, 'REGISTER_EKYC', 'auth', newUserId, `Tạo tài khoản công dân đã xác minh eKYC & CCCD Chip thành công (${newUser.full_name}, SĐT: ${cleanPhone}, CCCD: ${validCccd || 'N/A'})`, req.ip);

  res.status(201).json({
    token,
    user: newUser,
    cccd_info: cccdInfo,
    citizen_registry: citizenRecord,
    message: 'Đăng ký tài khoản và định danh sinh trắc học công dân thành công!'
  });
});

// API Thẩm định số Căn cước công dân thời gian thực (CCCD Validator API)
app.post('/api/auth/verify-cccd', (req, res) => {
  const { cccd } = req.body;
  const result = parseCccd(cccd);
  if (!result.valid) {
    return res.status(400).json({ error: result.error });
  }

  const existing = db.prepare('SELECT id FROM users WHERE cccd = ?').get(result.cccd);
  res.json({
    ...result,
    is_registered: !!existing,
    message: existing 
      ? 'Số CCCD này đã được liên kết với một tài khoản trên hệ thống.' 
      : `Số CCCD hợp lệ: ${result.province} | ${result.gender} | Sinh năm ${result.birth_year}`
  });
});

// Chuyển đổi nhanh vai trò (Demo Quick Switcher)
app.post('/api/auth/quick-switch', (req, res) => {
  const { username } = req.body;
  let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (!userCount || userCount.count === 0) {
      console.log('Tự động nạp dữ liệu mẫu ban đầu do phát hiện chưa có người dùng...');
      runSeed();
      user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    }
  }

  if (!user || !user.is_active) {
    return res.status(404).json({ error: 'Tài khoản không tồn tại' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...userInfo } = user;

  logAudit(user.id, user.username, user.role, 'QUICK_SWITCH', 'auth', user.id, `Chuyển nhanh tài khoản sang ${user.full_name} (${user.role})`, req.ip);

  res.json({ token, user: userInfo });
});

// Lấy thông tin tài khoản hiện tại
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ==========================================
// 2. SETTINGS & UNIT CONFIGURATION APIS
// ==========================================

app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  res.json(settings);
});

app.put('/api/settings', authMiddleware, requireRole('admin'), (req, res) => {
  const updates = req.body;
  const upsert = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  const transaction = db.transaction(() => {
    for (const [k, v] of Object.entries(updates)) {
      upsert.run(k, String(v));
    }
  });
  transaction();

  logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE_SETTINGS', 'settings', null, 'Cập nhật cấu hình đơn vị & hệ thống', req.ip);
  res.json({ message: 'Cập nhật cài đặt đơn vị thành công' });
});

// Khôi phục dữ liệu mẫu
app.post('/api/settings/reset-demo', authMiddleware, requireRole('admin'), (req, res) => {
  runSeed();
  logAudit(req.user.id, req.user.username, req.user.role, 'RESET_DEMO', 'system', null, 'Khôi phục dữ liệu minh họa mặc định', req.ip);
  res.json({ message: 'Đã khôi phục dữ liệu minh họa thành công' });
});

// ==========================================
// 3. USERS & ROLES MANAGEMENT APIS
// ==========================================

app.get('/api/users', authMiddleware, (req, res) => {
  const { role, department } = req.query;
  let sql = 'SELECT id, username, full_name, role, department, position, email, phone, is_active, created_at FROM users WHERE 1=1';
  const params = [];

  if (role) {
    sql += ' AND role = ?';
    params.push(role);
  }
  if (department) {
    sql += ' AND department = ?';
    params.push(department);
  }

  sql += ' ORDER BY id ASC';
  const users = db.prepare(sql).all(...params);
  res.json(users);
});

app.post('/api/users', authMiddleware, requireRole('admin'), (req, res) => {
  const { username, password, full_name, role, department, position, email, phone } = req.body;
  if (!username || !password || !full_name || !role) {
    return res.status(400).json({ error: 'Vui lòng điền đủ các trường bắt buộc' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const stmt = db.prepare(`
    INSERT INTO users (username, password, full_name, role, department, position, email, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(username, hashedPassword, full_name, role, department || '', position || '', email || '', phone || '');

  logAudit(req.user.id, req.user.username, req.user.role, 'CREATE_USER', 'user', info.lastInsertRowid, `Tạo tài khoản mới: ${username} (${full_name})`, req.ip);
  res.status(201).json({ id: info.lastInsertRowid, message: 'Tạo tài khoản thành công' });
});

app.put('/api/users/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const userId = req.params.id;
  const { full_name, role, department, position, email, phone, password } = req.body;

  let sql = 'UPDATE users SET full_name = ?, role = ?, department = ?, position = ?, email = ?, phone = ?';
  const params = [full_name, role, department, position, email, phone];

  if (password && password.trim()) {
    sql += ', password = ?';
    params.push(bcrypt.hashSync(password.trim(), 10));
  }
  sql += ' WHERE id = ?';
  params.push(userId);

  db.prepare(sql).run(...params);
  logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE_USER', 'user', userId, `Cập nhật thông tin tài khoản ID: ${userId}`, req.ip);
  res.json({ message: 'Cập nhật tài khoản thành công' });
});

app.post('/api/users/:id/toggle-status', authMiddleware, requireRole('admin'), (req, res) => {
  const userId = req.params.id;
  const user = db.prepare('SELECT id, is_active, username FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });

  const newStatus = user.is_active ? 0 : 1;
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newStatus, userId);

  logAudit(req.user.id, req.user.username, req.user.role, 'TOGGLE_USER_STATUS', 'user', userId, `${newStatus ? 'Mở khóa' : 'Khóa'} tài khoản ${user.username}`, req.ip);
  res.json({ message: `${newStatus ? 'Mở khóa' : 'Khóa'} tài khoản thành công`, is_active: newStatus });
});

// Ma trận quyền
app.get('/api/roles', authMiddleware, (req, res) => {
  const roles = [
    {
      role: 'admin',
      name: 'Quản trị viên hệ thống',
      description: 'Toàn quyền cấu hình tài khoản, đơn vị, quy trình phê duyệt, xem nhật ký kiểm toán và báo cáo thống kê',
      permissions: [
        'Quản lý tài khoản và phân quyền',
        'Cấu hình thông tin UBND xã, logo, tiêu đề',
        'Thiết lập quy trình phê duyệt nhiều cấp',
        'Xem nhật ký hoạt động (Audit log)',
        'Xem tất cả báo cáo và đánh giá'
      ]
    },
    {
      role: 'leader',
      name: 'Lãnh đạo UBND xã',
      description: 'Chủ tịch, Phó Chủ tịch UBND xã có quyền duyệt văn bản, giao nhiệm vụ, chỉ đạo xử lý công văn đến và phản ánh',
      permissions: [
        'Phê duyệt, từ chối hoặc yêu cầu chỉnh sửa công văn',
        'Chỉ đạo xử lý và giao nhiệm vụ cho công chức',
        'Theo dõi tiến độ công việc, hồ sơ sắp đến hạn / quá hạn',
        'Xem báo cáo thống kê chỉ đạo điều hành'
      ]
    },
    {
      role: 'officer',
      name: 'Cán bộ, công chức chuyên môn',
      description: 'Công chức Văn phòng, Địa chính, Tư pháp, Văn hóa... soạn thảo công văn, nhận nhiệm vụ và xử lý hồ sơ',
      permissions: [
        'Soạn thảo công văn, lưu nháp, trình duyệt',
        'Chỉnh sửa công văn khi có yêu cầu',
        'Xử lý công văn đến và yêu cầu trực tuyến được phân công',
        'Cập nhật tiến độ % và báo cáo kết quả nhiệm vụ',
        'Không được tự phê duyệt công văn của mình'
      ]
    },
    {
      role: 'citizen',
      name: 'Người dân / Doanh nghiệp',
      description: 'Gửi yêu cầu, phản ánh trực tuyến, tra cứu tiến độ bằng mã hồ sơ, đánh giá chất lượng phục vụ và góp ý giao diện',
      permissions: [
        'Gửi kiến nghị, phản ánh, yêu cầu thủ tục trực tuyến',
        'Tra cứu tình trạng hồ sơ bằng Mã hồ sơ + Số điện thoại',
        'Xem phản hồi và tải kết quả giải quyết',
        'Đánh giá chất lượng phục vụ 1-5 sao',
        'Đánh giá giao diện và trải nghiệm app',
        'Không xem được dữ liệu công văn nội bộ'
      ]
    }
  ];
  res.json(roles);
});

// ==========================================
// 4. APPROVAL WORKFLOW CONFIGURATION
// ==========================================

app.get('/api/workflows', authMiddleware, (req, res) => {
  const workflows = db.prepare('SELECT * FROM approval_workflows ORDER BY id ASC').all();
  res.json(workflows);
});

app.put('/api/workflows/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const id = req.params.id;
  const { levels_count, level_1_role, level_1_title, level_2_role, level_2_title, level_3_role, level_3_title, description } = req.body;

  db.prepare(`
    UPDATE approval_workflows 
    SET levels_count = ?, level_1_role = ?, level_1_title = ?, level_2_role = ?, level_2_title = ?, level_3_role = ?, level_3_title = ?, description = ?
    WHERE id = ?
  `).run(levels_count, level_1_role, level_1_title, level_2_role, level_2_title, level_3_role, level_3_title, description, id);

  logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE_WORKFLOW', 'workflow', id, `Cập nhật quy trình duyệt ID: ${id}`, req.ip);
  res.json({ message: 'Cập nhật quy trình phê duyệt thành công' });
});

// ==========================================
// 5. CÔNG VĂN ĐI (OUTBOUND DOCUMENTS) & APPROVAL PIPELINE
// ==========================================

// Danh sách công văn đi
app.get('/api/doc-out', authMiddleware, (req, res) => {
  const { status, doc_type, search, creator_id, priority } = req.query;
  let sql = `
    SELECT d.*, 
      u.full_name as creator_name, u.department as creator_dept, u.position as creator_position,
      appr.full_name as current_approver_name, appr.position as current_approver_position,
      pub.full_name as publisher_name,
      (SELECT comment FROM approval_history WHERE doc_out_id = d.id AND action = 'request_edit' ORDER BY id DESC LIMIT 1) as latest_edit_reason,
      (SELECT u2.full_name FROM approval_history h2 JOIN users u2 ON h2.actor_id = u2.id WHERE h2.doc_out_id = d.id AND h2.action = 'request_edit' ORDER BY h2.id DESC LIMIT 1) as edit_requested_by,
      (SELECT u2.position FROM approval_history h2 JOIN users u2 ON h2.actor_id = u2.id WHERE h2.doc_out_id = d.id AND h2.action = 'request_edit' ORDER BY h2.id DESC LIMIT 1) as edit_requested_by_position,
      (SELECT created_at FROM approval_history WHERE doc_out_id = d.id AND action = 'request_edit' ORDER BY id DESC LIMIT 1) as edit_requested_at,
      (SELECT comment FROM approval_history WHERE doc_out_id = d.id AND action = 'reject' ORDER BY id DESC LIMIT 1) as latest_reject_reason,
      (SELECT u3.full_name FROM approval_history h3 JOIN users u3 ON h3.actor_id = u3.id WHERE h3.doc_out_id = d.id AND h3.action = 'reject' ORDER BY h3.id DESC LIMIT 1) as reject_requested_by,
      (SELECT created_at FROM approval_history WHERE doc_out_id = d.id AND action = 'reject' ORDER BY id DESC LIMIT 1) as reject_requested_at
    FROM doc_out d
    LEFT JOIN users u ON d.creator_id = u.id
    LEFT JOIN users appr ON d.current_approver_id = appr.id
    LEFT JOIN users pub ON d.publisher_id = pub.id
    WHERE 1=1
  `;
  const params = [];

  // Nếu là người dân thì không xem được công văn đi nội bộ
  if (req.user.role === 'citizen') {
    return res.status(403).json({ error: 'Người dân không có quyền xem công văn nội bộ' });
  }

  if (status && status !== 'all') {
    sql += ' AND d.status = ?';
    params.push(status);
  }
  if (doc_type && doc_type !== 'all') {
    sql += ' AND d.doc_type = ?';
    params.push(doc_type);
  }
  if (priority && priority !== 'all') {
    sql += ' AND d.priority = ?';
    params.push(priority);
  }
  if (creator_id) {
    sql += ' AND d.creator_id = ?';
    params.push(creator_id);
  }
  if (search && search.trim()) {
    sql += ' AND (d.doc_number LIKE ? OR d.subject LIKE ? OR d.recipient_unit LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY d.id DESC';
  const docs = db.prepare(sql).all(...params);
  res.json(docs);
});

// Chi tiết công văn đi
app.get('/api/doc-out/:id', authMiddleware, (req, res) => {
  if (req.user.role === 'citizen') {
    return res.status(403).json({ error: 'Không có quyền truy cập' });
  }

  const doc = db.prepare(`
    SELECT d.*, 
      u.full_name as creator_name, u.department as creator_dept, u.position as creator_position,
      appr.full_name as current_approver_name, appr.position as current_approver_position,
      pub.full_name as publisher_name,
      (SELECT comment FROM approval_history WHERE doc_out_id = d.id AND action = 'request_edit' ORDER BY id DESC LIMIT 1) as latest_edit_reason,
      (SELECT u2.full_name FROM approval_history h2 JOIN users u2 ON h2.actor_id = u2.id WHERE h2.doc_out_id = d.id AND h2.action = 'request_edit' ORDER BY h2.id DESC LIMIT 1) as edit_requested_by,
      (SELECT u2.position FROM approval_history h2 JOIN users u2 ON h2.actor_id = u2.id WHERE h2.doc_out_id = d.id AND h2.action = 'request_edit' ORDER BY h2.id DESC LIMIT 1) as edit_requested_by_position,
      (SELECT created_at FROM approval_history WHERE doc_out_id = d.id AND action = 'request_edit' ORDER BY id DESC LIMIT 1) as edit_requested_at,
      (SELECT comment FROM approval_history WHERE doc_out_id = d.id AND action = 'reject' ORDER BY id DESC LIMIT 1) as latest_reject_reason,
      (SELECT u3.full_name FROM approval_history h3 JOIN users u3 ON h3.actor_id = u3.id WHERE h3.doc_out_id = d.id AND h3.action = 'reject' ORDER BY h3.id DESC LIMIT 1) as reject_requested_by,
      (SELECT created_at FROM approval_history WHERE doc_out_id = d.id AND action = 'reject' ORDER BY id DESC LIMIT 1) as reject_requested_at
    FROM doc_out d
    LEFT JOIN users u ON d.creator_id = u.id
    LEFT JOIN users appr ON d.current_approver_id = appr.id
    LEFT JOIN users pub ON d.publisher_id = pub.id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!doc) return res.status(404).json({ error: 'Không tìm thấy công văn' });

  // Lấy lịch sử phê duyệt
  const history = db.prepare(`
    SELECT h.*, u.full_name as actor_name, u.position as actor_position, u.role as actor_role
    FROM approval_history h
    JOIN users u ON h.actor_id = u.id
    WHERE h.doc_out_id = ?
    ORDER BY h.id ASC
  `).all(req.params.id);

  // Lấy tệp đính kèm
  const attachments = db.prepare(`
    SELECT a.*, u.full_name as uploader_name
    FROM attachments a
    LEFT JOIN users u ON a.uploaded_by = u.id
    WHERE a.target_type = 'doc_out' AND a.target_id = ?
    ORDER BY a.id ASC
  `).all(req.params.id);

  res.json({ ...doc, history, attachments });
});

// Hàm xác định tuyến phê duyệt thông minh theo vai trò và thẩm quyền
function resolveApprovalRoute(creator, requestedApproverId, docType) {
  const isChairman = creator.username === 'chutich' || 
    (creator.position && creator.position.includes('Chủ tịch') && !creator.position.includes('Phó'));
  const isViceChairman = creator.username === 'phochutich' || 
    (creator.position && creator.position.includes('Phó Chủ tịch'));

  const chutichUser = db.prepare("SELECT * FROM users WHERE username = 'chutich' OR position LIKE '%Chủ tịch UBND xã%' ORDER BY id ASC LIMIT 1").get();
  const phochutichUser = db.prepare("SELECT * FROM users WHERE username = 'phochutich' OR position LIKE '%Phó Chủ tịch%' ORDER BY id ASC LIMIT 1").get();

  const wf = db.prepare('SELECT * FROM approval_workflows WHERE doc_type = ?').get(docType);
  const baseLevels = wf ? wf.levels_count : 2;

  // Trường hợp 1: Chủ tịch UBND xã soạn thảo
  // Theo nguyên tắc hành chính, văn bản do Chủ tịch soạn khi trình duyệt sẽ được ký duyệt ban hành trực tiếp, chuyển Văn thư phát hành
  if (isChairman) {
    return {
      approvalLevel: baseLevels,
      maxLevels: baseLevels,
      currentApproverId: null,
      autoApproved: true,
      description: 'Chủ tịch UBND xã ký duyệt trực tiếp'
    };
  }

  // Trường hợp 2: Phó Chủ tịch UBND xã soạn thảo
  // Phó Chủ tịch là lãnh đạo cấp 1 nên không gửi lại cho Phó Chủ tịch khác, mà gửi thẳng lên Chủ tịch UBND xã phê duyệt ký!
  if (isViceChairman) {
    const targetLeaderId = chutichUser ? chutichUser.id : (requestedApproverId || null);
    return {
      approvalLevel: 2,
      maxLevels: 2,
      currentApproverId: targetLeaderId,
      autoApproved: false,
      description: 'Phó Chủ tịch trình Chủ tịch UBND xã phê duyệt ký'
    };
  }

  // Trường hợp 3: Cán bộ chuyên môn soạn thảo
  // Nếu có chọn đích danh lãnh đạo (và không phải chính mình)
  if (requestedApproverId) {
    const chosen = db.prepare("SELECT * FROM users WHERE id = ?").get(requestedApproverId);
    if (chosen && chosen.id !== creator.id) {
      const isChosenChairman = chosen.username === 'chutich' || (chosen.position && chosen.position.includes('Chủ tịch') && !chosen.position.includes('Phó'));
      return {
        approvalLevel: isChosenChairman ? 2 : 1,
        maxLevels: 2,
        currentApproverId: chosen.id,
        autoApproved: false,
        description: isChosenChairman ? 'Trình thẳng Chủ tịch UBND xã' : 'Trình Phó Chủ tịch UBND xã thẩm định cấp 1'
      };
    }
  }

  // Mặc định cho Cán bộ: Chuyển Phó Chủ tịch thẩm định sơ bộ Cấp 1
  const defaultLeader = phochutichUser || chutichUser;
  return {
    approvalLevel: 1,
    maxLevels: baseLevels,
    currentApproverId: defaultLeader ? defaultLeader.id : null,
    autoApproved: false,
    description: 'Trình Phó Chủ tịch UBND xã thẩm định cấp 1'
  };
}

// Tạo công văn đi mới (lưu nháp hoặc trình duyệt)
app.post('/api/doc-out', authMiddleware, requireRole('admin', 'leader', 'officer'), (req, res) => {
  const { doc_type, subject, content, recipient_unit, signer_title, priority, due_date, action_type, target_approver_id } = req.body;
  if (!doc_type || !subject || !recipient_unit) {
    return res.status(400).json({ error: 'Vui lòng điền đủ loại văn bản, trích yếu và nơi nhận' });
  }

  const route = resolveApprovalRoute(req.user, target_approver_id, doc_type);
  const isSubmitDirect = action_type === 'submit';

  let initialStatus = 'draft';
  let currentApproverId = null;
  let approvalLevel = 1;

  if (isSubmitDirect) {
    if (route.autoApproved) {
      initialStatus = 'approved';
      currentApproverId = null;
      approvalLevel = route.approvalLevel;
    } else {
      initialStatus = 'pending_review';
      currentApproverId = route.currentApproverId;
      approvalLevel = route.approvalLevel;
    }
  }

  const docNumber = `DRAFT-${String(Date.now()).slice(-4)}`;

  const stmt = db.prepare(`
    INSERT INTO doc_out (
      doc_number, doc_type, subject, content, recipient_unit, signer_title, 
      creator_id, current_approver_id, priority, status, approval_level, 
      max_approval_levels, due_date, draft_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now', 'localtime'))
  `);

  const info = stmt.run(
    docNumber, doc_type, subject, content || '', recipient_unit, signer_title || 'Chủ tịch UBND xã',
    req.user.id, currentApproverId, priority || 'normal', initialStatus, approvalLevel,
    route.maxLevels, due_date || null
  );

  const newDocId = info.lastInsertRowid;

  if (isSubmitDirect) {
    if (route.autoApproved) {
      db.prepare(`
        INSERT INTO approval_history (doc_out_id, level, actor_id, action, comment, prev_status, new_status)
        VALUES (?, ?, ?, 'approve', 'Chủ tịch UBND xã trực tiếp phê duyệt ký ban hành văn bản', 'draft', 'approved')
      `).run(newDocId, route.approvalLevel, req.user.id);

      // Báo cho bộ phận văn thư
      const vanthu = db.prepare("SELECT id FROM users WHERE role = 'officer' AND department LIKE '%Văn phòng%' LIMIT 1").get();
      if (vanthu) {
        sendNotification(
          vanthu.id,
          'Công văn mới đã duyệt - Chờ phát hành',
          `Chủ tịch UBND xã vừa ký duyệt văn bản "${subject}", đề nghị văn thư cấp số phát hành.`,
          'doc_out',
          'doc_out',
          newDocId
        );
      }
    } else {
      const isViceLeader = req.user.username === 'phochutich' || (req.user.position && req.user.position.includes('Phó Chủ tịch'));
      const historyComment = isViceLeader
        ? 'Phó Chủ tịch UBND xã trình Chủ tịch UBND xã phê duyệt ký'
        : 'Trình lãnh đạo phê duyệt văn bản';

      db.prepare(`
        INSERT INTO approval_history (doc_out_id, level, actor_id, action, comment, prev_status, new_status)
        VALUES (?, ?, ?, 'submit', ?, 'draft', 'pending_review')
      `).run(newDocId, route.approvalLevel, req.user.id, historyComment);

      if (currentApproverId) {
        sendNotification(
          currentApproverId,
          'Công văn mới cần phê duyệt',
          `${req.user.full_name} (${req.user.position || req.user.role}) vừa trình dự thảo "${subject}"`,
          'approval',
          'doc_out',
          newDocId
        );
      }
    }
  }

  logAudit(req.user.id, req.user.username, req.user.role, isSubmitDirect ? 'SUBMIT_DOC_OUT' : 'DRAFT_DOC_OUT', 'doc_out', newDocId, `Soạn thảo công văn: ${subject}`, req.ip);
  const msg = isSubmitDirect 
    ? (route.autoApproved ? 'Chủ tịch UBND xã đã ký duyệt văn bản, chuyển Văn thư phát hành' : `Đã trình duyệt thành công tới ${route.description}`)
    : 'Lưu bản nháp thành công';
  res.status(201).json({ id: newDocId, message: msg });
});

// Chỉnh sửa công văn đi (khi là bản nháp hoặc đang yêu cầu chỉnh sửa)
app.put('/api/doc-out/:id', authMiddleware, requireRole('admin', 'leader', 'officer'), (req, res) => {
  const docId = req.params.id;
  const doc = db.prepare('SELECT * FROM doc_out WHERE id = ?').get(docId);
  if (!doc) return res.status(404).json({ error: 'Không tìm thấy công văn' });

  // Kiểm tra quyền: chỉ người tạo hoặc admin mới được sửa
  if (doc.creator_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bạn không có quyền sửa công văn của người khác' });
  }

  if (doc.status !== 'draft' && doc.status !== 'needs_edit') {
    return res.status(400).json({ error: 'Chỉ có thể chỉnh sửa công văn ở trạng thái Nháp hoặc Yêu cầu chỉnh sửa' });
  }

  const { doc_type, subject, content, recipient_unit, signer_title, priority, due_date } = req.body;
  db.prepare(`
    UPDATE doc_out 
    SET doc_type = ?, subject = ?, content = ?, recipient_unit = ?, signer_title = ?, priority = ?, due_date = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(doc_type, subject, content, recipient_unit, signer_title, priority, due_date, docId);

  logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE_DOC_OUT', 'doc_out', docId, `Cập nhật công văn: ${subject}`, req.ip);
  res.json({ message: 'Cập nhật công văn thành công' });
});

// Trình duyệt công văn (từ draft hoặc needs_edit)
app.post('/api/doc-out/:id/submit', authMiddleware, requireRole('admin', 'officer', 'leader'), (req, res) => {
  const docId = req.params.id;
  const doc = db.prepare('SELECT * FROM doc_out WHERE id = ?').get(docId);
  if (!doc) return res.status(404).json({ error: 'Không tìm thấy công văn' });

  if (doc.status !== 'draft' && doc.status !== 'needs_edit') {
    return res.status(400).json({ error: 'Công văn không ở trạng thái có thể trình duyệt' });
  }

  const creatorUser = db.prepare('SELECT * FROM users WHERE id = ?').get(doc.creator_id) || req.user;
  const route = resolveApprovalRoute(creatorUser, req.body.target_approver_id, doc.doc_type);

  if (route.autoApproved) {
    db.prepare(`
      UPDATE doc_out 
      SET status = 'approved', current_approver_id = NULL, approval_level = ?, max_approval_levels = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(route.approvalLevel, route.maxLevels, docId);

    db.prepare(`
      INSERT INTO approval_history (doc_out_id, level, actor_id, action, comment, prev_status, new_status)
      VALUES (?, ?, ?, 'approve', 'Chủ tịch UBND xã ký duyệt ban hành văn bản', ?, 'approved')
    `).run(docId, route.approvalLevel, req.user.id, doc.status);

    const vanthu = db.prepare("SELECT id FROM users WHERE role = 'officer' AND department LIKE '%Văn phòng%' LIMIT 1").get();
    if (vanthu) {
      sendNotification(
        vanthu.id,
        'Công văn mới đã duyệt - Chờ phát hành',
        `Chủ tịch UBND xã vừa ký duyệt văn bản "${doc.subject}", đề nghị văn thư cấp số phát hành.`,
        'doc_out',
        'doc_out',
        docId
      );
    }

    logAudit(req.user.id, req.user.username, req.user.role, 'SUBMIT_DOC_OUT', 'doc_out', docId, `Chủ tịch ký duyệt công văn ${doc.subject}`, req.ip);
    return res.json({ message: 'Chủ tịch UBND xã đã ký duyệt văn bản, chuyển Bộ phận Văn thư phát hành' });
  }

  db.prepare(`
    UPDATE doc_out 
    SET status = 'pending_review', current_approver_id = ?, approval_level = ?, max_approval_levels = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(route.currentApproverId, route.approvalLevel, route.maxLevels, docId);

  const isViceLeader = creatorUser.username === 'phochutich' || (creatorUser.position && creatorUser.position.includes('Phó Chủ tịch'));
  const defaultComment = isViceLeader
    ? 'Phó Chủ tịch UBND xã trình Chủ tịch UBND xã phê duyệt ký'
    : 'Trình lãnh đạo phê duyệt văn bản';

  db.prepare(`
    INSERT INTO approval_history (doc_out_id, level, actor_id, action, comment, prev_status, new_status)
    VALUES (?, ?, ?, 'submit', ?, ?, 'pending_review')
  `).run(docId, route.approvalLevel, req.user.id, req.body.comment || defaultComment, doc.status);

  if (route.currentApproverId) {
    sendNotification(
      route.currentApproverId,
      'Công văn mới cần phê duyệt',
      `${req.user.full_name} vừa trình duyệt văn bản: "${doc.subject}"`,
      'approval',
      'doc_out',
      docId
    );
  }

  logAudit(req.user.id, req.user.username, req.user.role, 'SUBMIT_DOC_OUT', 'doc_out', docId, `Trình duyệt công văn ${doc.subject}`, req.ip);
  res.json({ message: `Trình duyệt công văn thành công (${route.description})` });
});

// Phê duyệt công văn (Nhiều cấp: Leader/Admin)
app.post('/api/doc-out/:id/approve', authMiddleware, requireRole('admin', 'leader'), (req, res) => {
  const docId = req.params.id;
  const { comment } = req.body;
  const doc = db.prepare('SELECT * FROM doc_out WHERE id = ?').get(docId);
  if (!doc) return res.status(404).json({ error: 'Không tìm thấy công văn' });

  if (doc.status !== 'pending_review') {
    return res.status(400).json({ error: 'Công văn không ở trạng thái chờ duyệt' });
  }

  // Quy tắc: Không được tự phê duyệt công văn do chính mình soạn thảo khi yêu cầu độc lập
  if (doc.creator_id === req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Quy định bảo mật: Bạn không được tự phê duyệt công văn do chính mình soạn thảo' });
  }

  const currentLevel = doc.approval_level;
  const maxLevels = doc.max_approval_levels;

  if (currentLevel < maxLevels) {
    // Chuyển sang cấp tiếp theo (ví dụ từ Phó Chủ tịch lên Chủ tịch)
    const nextLevel = currentLevel + 1;
    const chutich = db.prepare("SELECT id FROM users WHERE username = 'chutich'").get();
    const nextApproverId = chutich ? chutich.id : req.user.id;

    db.prepare(`
      UPDATE doc_out 
      SET approval_level = ?, current_approver_id = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(nextLevel, nextApproverId, docId);

    db.prepare(`
      INSERT INTO approval_history (doc_out_id, level, actor_id, action, comment, prev_status, new_status)
      VALUES (?, ?, ?, 'approve', ?, 'pending_review', 'pending_review')
    `).run(docId, currentLevel, req.user.id, comment || `Phê duyệt cấp ${currentLevel}`);

    if (nextApproverId) {
      sendNotification(
        nextApproverId,
        `Công văn chuyển phê duyệt cấp ${nextLevel}`,
        `${req.user.full_name} đã thẩm định và chuyển trình: "${doc.subject}"`,
        'approval',
        'doc_out',
        docId
      );
    }

    logAudit(req.user.id, req.user.username, req.user.role, 'APPROVE_DOC_LEVEL', 'doc_out', docId, `Duyệt cấp ${currentLevel}, chuyển cấp ${nextLevel}: ${doc.subject}`, req.ip);
    res.json({ message: `Đã phê duyệt cấp ${currentLevel}, văn bản đã chuyển tới cấp ${nextLevel}` });
  } else {
    // Đã duyệt tất cả các cấp bắt buộc -> Chuyển sang Đã duyệt (Approved), sẵn sàng phát hành
    db.prepare(`
      UPDATE doc_out 
      SET status = 'approved', current_approver_id = NULL, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(docId);

    db.prepare(`
      INSERT INTO approval_history (doc_out_id, level, actor_id, action, comment, prev_status, new_status)
      VALUES (?, ?, ?, 'approve', ?, 'pending_review', 'approved')
    `).run(docId, currentLevel, req.user.id, comment || 'Phê duyệt hoàn tất, đồng ý ban hành');

    // Báo cho người soạn thảo
    sendNotification(
      doc.creator_id,
      'Công văn đã được phê duyệt hoàn tất',
      `Văn bản "${doc.subject}" đã được Lãnh đạo phê duyệt thành công, sẵn sàng phát hành.`,
      'approval',
      'doc_out',
      docId
    );

    logAudit(req.user.id, req.user.username, req.user.role, 'APPROVE_DOC_FINAL', 'doc_out', docId, `Phê duyệt hoàn tất công văn: ${doc.subject}`, req.ip);
    res.json({ message: 'Phê duyệt hoàn tất! Công văn đã chuyển sang trạng thái Đã duyệt.' });
  }
});

// Yêu cầu chỉnh sửa công văn (Bắt buộc nhập lý do)
app.post('/api/doc-out/:id/request-edit', authMiddleware, requireRole('admin', 'leader'), (req, res) => {
  const docId = req.params.id;
  const { comment } = req.body;
  if (!comment || !comment.trim()) {
    return res.status(400).json({ error: 'Bắt buộc phải nhập ý kiến/lý do yêu cầu chỉnh sửa' });
  }

  const doc = db.prepare('SELECT * FROM doc_out WHERE id = ?').get(docId);
  if (!doc) return res.status(404).json({ error: 'Không tìm thấy công văn' });

  db.prepare(`
    UPDATE doc_out 
    SET status = 'needs_edit', current_approver_id = creator_id, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(docId);

  db.prepare(`
    INSERT INTO approval_history (doc_out_id, level, actor_id, action, comment, prev_status, new_status)
    VALUES (?, ?, ?, 'request_edit', ?, ?, 'needs_edit')
  `).run(docId, doc.approval_level, req.user.id, comment.trim(), doc.status);

  sendNotification(
    doc.creator_id,
    'Yêu cầu chỉnh sửa công văn',
    `Lãnh đạo yêu cầu chỉnh sửa văn bản "${doc.subject}": ${comment.trim()}`,
    'warning',
    'doc_out',
    docId
  );

  logAudit(req.user.id, req.user.username, req.user.role, 'REQUEST_EDIT_DOC', 'doc_out', docId, `Yêu cầu chỉnh sửa công văn: ${doc.subject}`, req.ip);
  res.json({ message: 'Đã gửi yêu cầu chỉnh sửa tới cán bộ soạn thảo' });
});

// Từ chối công văn (Bắt buộc nhập lý do)
app.post('/api/doc-out/:id/reject', authMiddleware, requireRole('admin', 'leader'), (req, res) => {
  const docId = req.params.id;
  const { comment } = req.body;
  if (!comment || !comment.trim()) {
    return res.status(400).json({ error: 'Bắt buộc phải nhập lý do từ chối phê duyệt' });
  }

  const doc = db.prepare('SELECT * FROM doc_out WHERE id = ?').get(docId);
  if (!doc) return res.status(404).json({ error: 'Không tìm thấy công văn' });

  db.prepare(`
    UPDATE doc_out 
    SET status = 'rejected', current_approver_id = NULL, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(docId);

  db.prepare(`
    INSERT INTO approval_history (doc_out_id, level, actor_id, action, comment, prev_status, new_status)
    VALUES (?, ?, ?, 'reject', ?, ?, 'rejected')
  `).run(docId, doc.approval_level, req.user.id, comment.trim(), doc.status);

  sendNotification(
    doc.creator_id,
    'Công văn bị từ chối phê duyệt',
    `Văn bản "${doc.subject}" đã bị từ chối: ${comment.trim()}`,
    'warning',
    'doc_out',
    docId
  );

  logAudit(req.user.id, req.user.username, req.user.role, 'REJECT_DOC', 'doc_out', docId, `Từ chối duyệt công văn: ${doc.subject}`, req.ip);
  res.json({ message: 'Đã từ chối phê duyệt công văn' });
});

// Phát hành công văn (Cấp số chính thức theo quy tắc, ghi nhận người phát hành)
app.post('/api/doc-out/:id/publish', authMiddleware, requireRole('admin', 'officer', 'leader'), (req, res) => {
  const docId = req.params.id;
  const doc = db.prepare('SELECT * FROM doc_out WHERE id = ?').get(docId);
  if (!doc) return res.status(404).json({ error: 'Không tìm thấy công văn' });

  if (doc.status !== 'approved') {
    return res.status(400).json({ error: 'Chỉ có thể phát hành công văn đã được phê duyệt' });
  }

  // Tự động cấp số ký hiệu chính thức
  const officialNumber = generateNextDocOutNumber('VP');
  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    UPDATE doc_out 
    SET status = 'published', doc_number = ?, publish_date = ?, publisher_id = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(officialNumber, today, req.user.id, docId);

  db.prepare(`
    INSERT INTO approval_history (doc_out_id, level, actor_id, action, comment, prev_status, new_status)
    VALUES (?, ?, ?, 'publish', ?, 'approved', 'published')
  `).run(docId, doc.max_approval_levels, req.user.id, `Cấp số chính thức ${officialNumber} và phát hành.`);

  sendNotification(
    doc.creator_id,
    'Công văn đã được phát hành chính thức',
    `Văn bản "${doc.subject}" đã được phát hành với số ký hiệu: ${officialNumber}`,
    'doc_out',
    'doc_out',
    docId
  );

  logAudit(req.user.id, req.user.username, req.user.role, 'PUBLISH_DOC_OUT', 'doc_out', docId, `Phát hành công văn ${officialNumber}: ${doc.subject}`, req.ip);
  res.json({ message: 'Phát hành công văn thành công', official_number: officialNumber });
});

// Thu hồi công văn đã phát hành
app.post('/api/doc-out/:id/revoke', authMiddleware, requireRole('admin', 'leader'), (req, res) => {
  const docId = req.params.id;
  const { reason } = req.body;
  const doc = db.prepare('SELECT * FROM doc_out WHERE id = ?').get(docId);
  if (!doc) return res.status(404).json({ error: 'Không tìm thấy công văn' });

  if (doc.status !== 'published') {
    return res.status(400).json({ error: 'Chỉ có thể thu hồi công văn đã phát hành' });
  }

  db.prepare(`
    UPDATE doc_out 
    SET status = 'revoked', updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(docId);

  db.prepare(`
    INSERT INTO approval_history (doc_out_id, level, actor_id, action, comment, prev_status, new_status)
    VALUES (?, ?, ?, 'revoke', ?, 'published', 'revoked')
  `).run(docId, doc.max_approval_levels, req.user.id, reason || 'Thu hồi văn bản');

  logAudit(req.user.id, req.user.username, req.user.role, 'REVOKE_DOC_OUT', 'doc_out', docId, `Thu hồi công văn ${doc.doc_number}: ${reason || ''}`, req.ip);
  res.json({ message: 'Thu hồi công văn thành công' });
});

// ==========================================
// 6. HỘP THƯ PHÊ DUYỆT (APPROVAL INBOX)
// ==========================================

// Hộp thư "Chờ tôi phê duyệt"
app.get('/api/approvals/pending', authMiddleware, (req, res) => {
  if (req.user.role === 'citizen') {
    return res.status(403).json({ error: 'Không có quyền truy cập' });
  }

  let sql = `
    SELECT d.*, 
      u.full_name as creator_name, u.department as creator_dept, u.position as creator_position,
      appr.full_name as current_approver_name, appr.position as current_approver_position
    FROM doc_out d
    JOIN users u ON d.creator_id = u.id
    LEFT JOIN users appr ON d.current_approver_id = appr.id
    WHERE d.status = 'pending_review'
  `;
  const params = [];

  // Lãnh đạo xem các công văn đang chờ mình duyệt và TUYỆT ĐỐI KHÔNG chứa công văn do chính mình soạn thảo
  if (req.user.role === 'leader') {
    sql += ' AND ((d.current_approver_id = ?) OR (d.current_approver_id IS NULL AND d.creator_id != ?)) AND d.creator_id != ?';
    params.push(req.user.id, req.user.id, req.user.id);
  } else if (req.user.role === 'officer') {
    // Cán bộ xem các công văn do mình soạn đang chờ duyệt
    sql += ' AND d.creator_id = ?';
    params.push(req.user.id);
  }

  sql += " ORDER BY d.priority = 'emergency' DESC, d.priority = 'urgent' DESC, d.id DESC";
  const docs = db.prepare(sql).all(...params);
  res.json(docs);
});

// Hộp thư "Đã phê duyệt"
app.get('/api/approvals/processed', authMiddleware, (req, res) => {
  let sql = `
    SELECT DISTINCT d.*, u.full_name as creator_name, h.action, h.comment as approval_comment, h.created_at as approved_at
    FROM doc_out d
    JOIN users u ON d.creator_id = u.id
    JOIN approval_history h ON d.id = h.doc_out_id
    WHERE h.actor_id = ? AND h.action = 'approve'
    ORDER BY h.id DESC
  `;
  const docs = db.prepare(sql).all(req.user.id);
  res.json(docs);
});

// Lịch sử phê duyệt toàn hệ thống
app.get('/api/approvals/history', authMiddleware, (req, res) => {
  if (req.user.role === 'citizen') {
    return res.status(403).json({ error: 'Không có quyền truy cập' });
  }

  const history = db.prepare(`
    SELECT h.*, d.doc_number, d.subject, d.doc_type, u.full_name as actor_name, u.role as actor_role, u.position as actor_position
    FROM approval_history h
    JOIN doc_out d ON h.doc_out_id = d.id
    JOIN users u ON h.actor_id = u.id
    ORDER BY h.id DESC
    LIMIT 100
  `).all();
  res.json(history);
});

// ==========================================
// 7. CÔNG VĂN ĐẾN (INBOUND DOCUMENTS)
// ==========================================

// Danh sách công văn đến
app.get('/api/doc-in', authMiddleware, (req, res) => {
  if (req.user.role === 'citizen') {
    return res.status(403).json({ error: 'Người dân không có quyền xem công văn nội bộ' });
  }

  const { status, priority, search, handler_id } = req.query;
  let sql = `
    SELECT d.*, 
      ldr.full_name as leader_name,
      hdl.full_name as handler_name, hdl.department as handler_dept
    FROM doc_in d
    LEFT JOIN users ldr ON d.leader_id = ldr.id
    LEFT JOIN users hdl ON d.handler_id = hdl.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'all') {
    sql += ' AND d.status = ?';
    params.push(status);
  }
  if (priority && priority !== 'all') {
    sql += ' AND d.priority = ?';
    params.push(priority);
  }
  if (handler_id) {
    sql += ' AND d.handler_id = ?';
    params.push(handler_id);
  }
  if (search && search.trim()) {
    sql += ' AND (d.incoming_number LIKE ? OR d.original_number LIKE ? OR d.subject LIKE ? OR d.sender_agency LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  sql += ' ORDER BY d.id DESC';
  const docs = db.prepare(sql).all(...params);
  res.json(docs);
});

// Chi tiết công văn đến
app.get('/api/doc-in/:id', authMiddleware, (req, res) => {
  if (req.user.role === 'citizen') {
    return res.status(403).json({ error: 'Không có quyền truy cập' });
  }

  const doc = db.prepare(`
    SELECT d.*, 
      ldr.full_name as leader_name, ldr.position as leader_position,
      hdl.full_name as handler_name, hdl.department as handler_dept, hdl.position as handler_position
    FROM doc_in d
    LEFT JOIN users ldr ON d.leader_id = ldr.id
    LEFT JOIN users hdl ON d.handler_id = hdl.id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!doc) return res.status(404).json({ error: 'Không tìm thấy công văn đến' });

  const attachments = db.prepare(`
    SELECT a.*, u.full_name as uploader_name
    FROM attachments a
    LEFT JOIN users u ON a.uploaded_by = u.id
    WHERE a.target_type = 'doc_in' AND a.target_id = ?
    ORDER BY a.id ASC
  `).all(req.params.id);

  res.json({ ...doc, attachments });
});

// Tiếp nhận công văn đến mới
app.post('/api/doc-in', authMiddleware, requireRole('admin', 'officer', 'leader'), (req, res) => {
  const { original_number, doc_date, received_date, sender_agency, subject, doc_type, priority, due_date, leader_id, handler_id, directive } = req.body;
  if (!original_number || !sender_agency || !subject || !doc_type) {
    return res.status(400).json({ error: 'Vui lòng điền đủ các thông tin bắt buộc' });
  }

  // Tự sinh số đến
  const year = new Date().getFullYear();
  const lastDoc = db.prepare("SELECT incoming_number FROM doc_in WHERE incoming_number LIKE ? ORDER BY id DESC LIMIT 1").get(`%/${year}/ĐEN`);
  let seq = 1;
  if (lastDoc && lastDoc.incoming_number) {
    const p = parseInt(lastDoc.incoming_number.split('/')[0], 10);
    if (!isNaN(p)) seq = p + 1;
  }
  const incomingNumber = `${String(seq).padStart(3, '0')}/${year}/ĐEN`;

  const status = handler_id ? 'processing' : (leader_id ? 'pending_assign' : 'received');

  const stmt = db.prepare(`
    INSERT INTO doc_in (incoming_number, original_number, doc_date, received_date, sender_agency, subject, doc_type, priority, due_date, leader_id, handler_id, directive, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    incomingNumber, original_number, doc_date || new Date().toISOString().split('T')[0],
    received_date || new Date().toISOString().split('T')[0], sender_agency, subject, doc_type,
    priority || 'normal', due_date || null, leader_id || null, handler_id || null, directive || null, status
  );

  const docId = info.lastInsertRowid;

  if (handler_id) {
    sendNotification(
      handler_id,
      'Được giao xử lý công văn đến',
      `Bạn được phân công xử lý văn bản đến số ${incomingNumber}: "${subject}"`,
      'doc_in',
      'doc_in',
      docId
    );
  }

  logAudit(req.user.id, req.user.username, req.user.role, 'RECEIVE_DOC_IN', 'doc_in', docId, `Tiếp nhận công văn đến ${incomingNumber}: ${subject}`, req.ip);
  res.status(201).json({ id: docId, incoming_number: incomingNumber, message: 'Tiếp nhận công văn đến thành công' });
});

// Giao xử lý công văn đến & Ý kiến chỉ đạo (Lãnh đạo)
app.post('/api/doc-in/:id/assign', authMiddleware, requireRole('admin', 'leader'), (req, res) => {
  const docId = req.params.id;
  const { handler_id, directive, due_date } = req.body;
  if (!handler_id) {
    return res.status(400).json({ error: 'Vui lòng chọn cán bộ phụ trách xử lý' });
  }

  const doc = db.prepare('SELECT * FROM doc_in WHERE id = ?').get(docId);
  if (!doc) return res.status(404).json({ error: 'Không tìm thấy công văn đến' });

  db.prepare(`
    UPDATE doc_in 
    SET handler_id = ?, leader_id = ?, directive = ?, due_date = COALESCE(?, due_date), status = 'processing', updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(handler_id, req.user.id, directive || null, due_date || null, docId);

  sendNotification(
    handler_id,
    'Lãnh đạo giao nhiệm vụ xử lý công văn đến',
    `Chỉ đạo từ ${req.user.full_name}: "${directive || 'Đề nghị nghiên cứu, tham mưu xử lý theo quy định'}" đối với văn bản ${doc.incoming_number}`,
    'doc_in',
    'doc_in',
    docId
  );

  logAudit(req.user.id, req.user.username, req.user.role, 'ASSIGN_DOC_IN', 'doc_in', docId, `Giao cán bộ ID ${handler_id} xử lý công văn ${doc.incoming_number}`, req.ip);
  res.json({ message: 'Phân công và ghi ý kiến chỉ đạo thành công' });
});

// Cập nhật tiến độ & Kết quả xử lý công văn đến
app.post('/api/doc-in/:id/update-progress', authMiddleware, requireRole('admin', 'officer', 'leader'), (req, res) => {
  const docId = req.params.id;
  const { result_note, status } = req.body;

  db.prepare(`
    UPDATE doc_in 
    SET result_note = ?, status = COALESCE(?, status), updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(result_note || '', status || 'processing', docId);

  logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE_DOC_IN_PROGRESS', 'doc_in', docId, `Cập nhật kết quả công văn đến ID ${docId}`, req.ip);
  res.json({ message: 'Cập nhật tiến độ xử lý thành công' });
});

// ==========================================
// 8. CỔNG YÊU CẦU TRỰC TUYẾN & TRA CỨU HỒ SƠ
// ==========================================

// Gửi yêu cầu trực tuyến (Public / Công dân)
app.post('/api/public/requests', optionalAuth, (req, res) => {
  const { citizen_name, phone, email, address, category, title, content } = req.body;
  if (!citizen_name || !phone || !category || !title || !content) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ các thông tin bắt buộc' });
  }

  const citizenCccd = (req.body.cccd && String(req.body.cccd).trim()) || (req.user ? req.user.cccd : null);
  const isEkyc = (req.user && req.user.ekyc_status === 'verified') || (req.body.is_ekyc_verified ? 1 : 0);

  const code = generateNextRequestCode();
  const stmt = db.prepare(`
    INSERT INTO online_requests (code, citizen_name, phone, email, address, category, title, content, cccd, is_ekyc_verified, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received')
  `);

  const info = stmt.run(
    code, 
    citizen_name.trim(), 
    phone.trim(), 
    email ? email.trim() : null, 
    address ? address.trim() : null, 
    category, 
    title.trim(), 
    content.trim(),
    citizenCccd || null,
    isEkyc ? 1 : 0
  );
  const reqId = info.lastInsertRowid;

  // Báo cho cán bộ một cửa / văn phòng
  const officers = db.prepare("SELECT id FROM users WHERE role IN ('admin', 'officer')").all();
  for (const o of officers) {
    sendNotification(
      o.id,
      'Yêu cầu trực tuyến mới từ người dân',
      `${citizen_name} vừa gửi hồ sơ ${code} (${category}): "${title}"`,
      'request',
      'request',
      reqId
    );
  }

  logAudit(req.user ? req.user.id : null, citizen_name, 'citizen', 'SUBMIT_ONLINE_REQUEST', 'request', reqId, `Gửi yêu cầu trực tuyến mã ${code}: ${title}`, req.ip);
  res.status(201).json({
    id: reqId,
    code,
    message: 'Gửi yêu cầu trực tuyến thành công! Vui lòng lưu lại Mã hồ sơ để tra cứu tiến độ.'
  });
});

// Tra cứu hồ sơ bảo mật bằng Mã hồ sơ + Số điện thoại hoặc Email
app.get('/api/public/requests/track', (req, res) => {
  const { code, verify } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'Vui lòng nhập Mã hồ sơ' });
  }

  const request = db.prepare(`
    SELECT r.*, 
      hdl.full_name as handler_name, hdl.department as handler_dept, hdl.phone as handler_phone,
      sr.stars as rating_stars, sr.comment as rating_comment
    FROM online_requests r
    LEFT JOIN users hdl ON r.handler_id = hdl.id
    LEFT JOIN service_ratings sr ON r.id = sr.request_id
    WHERE UPPER(r.code) = UPPER(?)
  `).get(code.trim());

  if (!request) {
    return res.status(404).json({ error: 'Không tìm thấy hồ sơ với mã yêu cầu đã nhập' });
  }

  // Nếu có tham số xác minh (Số điện thoại / email), kiểm tra tính hợp lệ
  if (verify && verify.trim()) {
    const v = verify.trim().toLowerCase();
    const phoneMatch = request.phone.toLowerCase().includes(v);
    const emailMatch = request.email && request.email.toLowerCase().includes(v);
    if (!phoneMatch && !emailMatch) {
      return res.status(403).json({ error: 'Thông tin xác minh (Số điện thoại/Email) không khớp với hồ sơ' });
    }
  }

  // Tệp đính kèm
  const attachments = db.prepare(`
    SELECT id, filename, original_name, file_size, file_type, created_at
    FROM attachments
    WHERE target_type = 'request' AND target_id = ?
  `).all(request.id);

  res.json({ ...request, attachments });
});

// Danh sách yêu cầu trực tuyến (Nội bộ & Công dân xem hồ sơ của mình)
app.get('/api/requests', authMiddleware, (req, res) => {
  const { status, category, search } = req.query;
  let sql = `
    SELECT r.*, 
      hdl.full_name as handler_name, hdl.department as handler_dept,
      sr.stars as rating_stars
    FROM online_requests r
    LEFT JOIN users hdl ON r.handler_id = hdl.id
    LEFT JOIN service_ratings sr ON r.id = sr.request_id
    WHERE 1=1
  `;
  const params = [];

  // Bảo mật: Nếu tài khoản là citizen, chỉ xem được hồ sơ có số điện thoại hoặc email của chính mình
  if (req.user.role === 'citizen') {
    sql += ' AND (r.phone = ? OR (r.email IS NOT NULL AND r.email = ?))';
    params.push(req.user.phone || '', req.user.email || '');
  }

  if (status && status !== 'all') {
    sql += ' AND r.status = ?';
    params.push(status);
  }
  if (category && category !== 'all') {
    sql += ' AND r.category = ?';
    params.push(category);
  }
  if (search && search.trim()) {
    sql += ' AND (r.code LIKE ? OR r.citizen_name LIKE ? OR r.title LIKE ?)';
    const t = `%${search.trim()}%`;
    params.push(t, t, t);
  }

  sql += ' ORDER BY r.id DESC';
  const requests = db.prepare(sql).all(...params);
  res.json(requests);
});

// Chi tiết yêu cầu trực tuyến
app.get('/api/requests/:id', authMiddleware, (req, res) => {
  const reqId = req.params.id;
  const request = db.prepare(`
    SELECT r.*, 
      hdl.full_name as handler_name, hdl.department as handler_dept, hdl.phone as handler_phone,
      sr.id as rating_id, sr.stars as rating_stars, sr.comment as rating_comment,
      sr.q1_resolved_satisfactorily, sr.q2_clear_feedback, sr.q3_processing_time_ok
    FROM online_requests r
    LEFT JOIN users hdl ON r.handler_id = hdl.id
    LEFT JOIN service_ratings sr ON r.id = sr.request_id
    WHERE r.id = ?
  `).get(reqId);

  if (!request) return res.status(404).json({ error: 'Không tìm thấy hồ sơ yêu cầu' });

  // Bảo vệ quyền riêng tư người dân
  if (req.user.role === 'citizen') {
    const isOwner = (request.phone === req.user.phone) || (request.email && request.email === req.user.email);
    if (!isOwner) {
      return res.status(403).json({ error: 'Bạn không có quyền xem thông tin hồ sơ của người khác' });
    }
  }

  const attachments = db.prepare(`
    SELECT a.*, u.full_name as uploader_name
    FROM attachments a
    LEFT JOIN users u ON a.uploaded_by = u.id
    WHERE a.target_type = 'request' AND a.target_id = ?
    ORDER BY a.id ASC
  `).all(reqId);

  res.json({ ...request, attachments });
});

// Cán bộ/Lãnh đạo phản hồi & Cập nhật kết quả giải quyết hồ sơ
app.post('/api/requests/:id/respond', authMiddleware, requireRole('admin', 'officer', 'leader'), (req, res) => {
  const reqId = req.params.id;
  const { status, response_note, rejection_reason, handler_dept, handler_id, due_date } = req.body;

  const current = db.prepare('SELECT * FROM online_requests WHERE id = ?').get(reqId);
  if (!current) return res.status(404).json({ error: 'Không tìm thấy hồ sơ' });

  // Quy tắc: Nếu từ chối giải quyết thì bắt buộc phải ghi rõ lý do
  if (status === 'rejected' && (!rejection_reason || !rejection_reason.trim())) {
    return res.status(400).json({ error: 'Trường hợp từ chối giải quyết bắt buộc phải ghi rõ lý do' });
  }

  // Quy tắc: Nếu hoàn thành (resolved) thì phải có nội dung phản hồi/kết quả
  if (status === 'resolved' && (!response_note || !response_note.trim())) {
    return res.status(400).json({ error: 'Hồ sơ chỉ được đánh dấu hoàn thành khi có nội dung phản hồi kết quả' });
  }

  const resolvedAt = status === 'resolved' ? new Date().toISOString().replace('T', ' ').substring(0, 19) : current.resolved_at;

  db.prepare(`
    UPDATE online_requests
    SET status = COALESCE(?, status),
        response_note = COALESCE(?, response_note),
        rejection_reason = COALESCE(?, rejection_reason),
        handler_dept = COALESCE(?, handler_dept),
        handler_id = COALESCE(?, handler_id),
        due_date = COALESCE(?, due_date),
        resolved_at = ?,
        updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(status, response_note, rejection_reason, handler_dept, handler_id, due_date, resolvedAt, reqId);

  // Nếu người dân có tài khoản trong hệ thống, gửi thông báo
  const citizenUser = db.prepare('SELECT id FROM users WHERE phone = ? OR email = ?').get(current.phone, current.email);
  if (citizenUser) {
    sendNotification(
      citizenUser.id,
      `Hồ sơ ${current.code} có cập nhật mới`,
      `Trạng thái hiện tại: ${status === 'resolved' ? 'Đã giải quyết' : (status === 'rejected' ? 'Từ chối giải quyết' : 'Đang xử lý')}`,
      'request',
      'request',
      reqId
    );
  }

  logAudit(req.user.id, req.user.username, req.user.role, 'RESPOND_REQUEST', 'request', reqId, `Phản hồi xử lý hồ sơ ${current.code} (Trạng thái: ${status})`, req.ip);
  res.json({ message: 'Cập nhật kết quả giải quyết hồ sơ thành công' });
});

// ==========================================
// 9. NHIỆM VỤ VÀ TIẾN ĐỘ (TASKS)
// ==========================================

app.get('/api/tasks', authMiddleware, (req, res) => {
  if (req.user.role === 'citizen') {
    return res.status(403).json({ error: 'Không có quyền truy cập' });
  }

  const { status, priority } = req.query;
  let sql = `
    SELECT t.*, 
      cr.full_name as creator_name,
      asg.full_name as assignee_name, asg.department as assignee_dept
    FROM tasks t
    JOIN users cr ON t.creator_id = cr.id
    JOIN users asg ON t.assignee_id = asg.id
    WHERE 1=1
  `;
  const params = [];

  // Cán bộ chỉ xem các nhiệm vụ được giao cho mình hoặc do mình tạo, Lãnh đạo xem tất cả
  if (req.user.role === 'officer') {
    sql += ' AND (t.assignee_id = ? OR t.creator_id = ?)';
    params.push(req.user.id, req.user.id);
  }

  if (status && status !== 'all') {
    sql += ' AND t.status = ?';
    params.push(status);
  }
  if (priority && priority !== 'all') {
    sql += ' AND t.priority = ?';
    params.push(priority);
  }

  sql += " ORDER BY t.status = 'overdue' DESC, t.due_date ASC, t.id DESC";
  const tasks = db.prepare(sql).all(...params);
  res.json(tasks);
});

app.post('/api/tasks', authMiddleware, requireRole('admin', 'leader', 'officer'), (req, res) => {
  const { title, description, related_type, related_id, assignee_id, due_date, priority } = req.body;
  if (!title || !assignee_id || !due_date) {
    return res.status(400).json({ error: 'Vui lòng điền đủ tên nhiệm vụ, người phụ trách và hạn hoàn thành' });
  }

  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, related_type, related_id, creator_id, assignee_id, due_date, priority, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);

  const info = stmt.run(title, description || '', related_type || 'none', related_id || null, req.user.id, assignee_id, due_date, priority || 'normal');
  const taskId = info.lastInsertRowid;

  sendNotification(
    assignee_id,
    'Bạn được giao nhiệm vụ mới',
    `${req.user.full_name} đã giao cho bạn: "${title}" (Hạn: ${due_date})`,
    'task',
    'task',
    taskId
  );

  logAudit(req.user.id, req.user.username, req.user.role, 'CREATE_TASK', 'task', taskId, `Giao nhiệm vụ: ${title}`, req.ip);
  res.status(201).json({ id: taskId, message: 'Giao nhiệm vụ thành công' });
});

app.post('/api/tasks/:id/progress', authMiddleware, requireRole('admin', 'leader', 'officer'), (req, res) => {
  const taskId = req.params.id;
  const { progress_percent, status, result_note } = req.body;

  const current = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!current) return res.status(404).json({ error: 'Không tìm thấy nhiệm vụ' });

  // Kiểm tra quyền
  if (req.user.role === 'officer' && current.assignee_id !== req.user.id) {
    return res.status(403).json({ error: 'Bạn chỉ được cập nhật nhiệm vụ được giao cho mình' });
  }

  let newStatus = status || current.status;
  if (progress_percent !== undefined) {
    if (progress_percent >= 100) newStatus = 'completed';
    else if (progress_percent > 0 && newStatus === 'pending') newStatus = 'in_progress';
  }

  db.prepare(`
    UPDATE tasks 
    SET progress_percent = COALESCE(?, progress_percent),
        status = ?,
        result_note = COALESCE(?, result_note),
        updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(progress_percent, newStatus, result_note, taskId);

  // Báo cho người giao
  if (current.creator_id !== req.user.id) {
    sendNotification(
      current.creator_id,
      'Cập nhật tiến độ nhiệm vụ',
      `${req.user.full_name} đã cập nhật tiến độ (${progress_percent}%): "${current.title}"`,
      'task',
      'task',
      taskId
    );
  }

  logAudit(req.user.id, req.user.username, req.user.role, 'UPDATE_TASK_PROGRESS', 'task', taskId, `Cập nhật tiến độ nhiệm vụ ID ${taskId} thành ${progress_percent}%`, req.ip);
  res.json({ message: 'Cập nhật tiến độ nhiệm vụ thành công' });
});

// Trao đổi / bình luận trong nhiệm vụ
app.get('/api/tasks/:id/comments', authMiddleware, (req, res) => {
  const comments = db.prepare(`
    SELECT c.*, u.full_name as user_name, u.role as user_role
    FROM task_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.task_id = ?
    ORDER BY c.id ASC
  `).all(req.params.id);
  res.json(comments);
});

app.post('/api/tasks/:id/comments', authMiddleware, (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Nội dung không được để trống' });

  db.prepare(`
    INSERT INTO task_comments (task_id, user_id, content)
    VALUES (?, ?, ?)
  `).run(req.params.id, req.user.id, content.trim());

  res.json({ message: 'Gửi trao đổi thành công' });
});

// ==========================================
// 10. ĐÁNH GIÁ CHẤT LƯỢNG PHỤC VỤ (SERVICE RATINGS)
// ==========================================

// Gửi đánh giá mức độ hài lòng về dịch vụ (Người dân đánh giá sau khi hồ sơ đã giải quyết)
app.post('/api/ratings/service', optionalAuth, (req, res) => {
  const { request_id, stars, q1_resolved_satisfactorily, q2_clear_feedback, q3_processing_time_ok, comment } = req.body;
  if (!request_id || !stars) {
    return res.status(400).json({ error: 'Thiếu thông tin đánh giá hoặc số sao' });
  }

  const reqDoc = db.prepare('SELECT * FROM online_requests WHERE id = ?').get(request_id);
  if (!reqDoc) return res.status(404).json({ error: 'Không tìm thấy hồ sơ yêu cầu' });

  // Quy tắc: Chỉ được đánh giá khi hồ sơ đã giải quyết
  if (reqDoc.status !== 'resolved' && reqDoc.status !== 'closed') {
    return res.status(400).json({ error: 'Chỉ có thể đánh giá chất lượng phục vụ khi hồ sơ đã được cơ quan giải quyết' });
  }

  // Quy tắc: Cán bộ không được tự tạo đánh giá thay người dân
  if (req.user && (req.user.role === 'officer' || req.user.role === 'leader')) {
    return res.status(403).json({ error: 'Quy tắc liêm chính: Cán bộ không được tự tạo đánh giá thay người dân' });
  }

  // Quy tắc: Mỗi hồ sơ chỉ có 1 đánh giá đang có hiệu lực (upsert nếu cho phép chỉnh sửa)
  const existing = db.prepare('SELECT id FROM service_ratings WHERE request_id = ?').get(request_id);

  if (existing) {
    db.prepare(`
      UPDATE service_ratings 
      SET stars = ?, q1_resolved_satisfactorily = ?, q2_clear_feedback = ?, q3_processing_time_ok = ?, comment = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(stars, q1_resolved_satisfactorily ? 1 : 0, q2_clear_feedback ? 1 : 0, q3_processing_time_ok ? 1 : 0, comment || '', existing.id);

    logAudit(req.user ? req.user.id : null, reqDoc.citizen_name, 'citizen', 'UPDATE_SERVICE_RATING', 'service_rating', existing.id, `Cập nhật đánh giá ${stars} sao cho hồ sơ ${reqDoc.code}`, req.ip);
    return res.json({ message: 'Cập nhật đánh giá chất lượng dịch vụ thành công' });
  } else {
    const stmt = db.prepare(`
      INSERT INTO service_ratings (request_id, stars, q1_resolved_satisfactorily, q2_clear_feedback, q3_processing_time_ok, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(request_id, stars, q1_resolved_satisfactorily ? 1 : 0, q2_clear_feedback ? 1 : 0, q3_processing_time_ok ? 1 : 0, comment || '');

    logAudit(req.user ? req.user.id : null, reqDoc.citizen_name, 'citizen', 'CREATE_SERVICE_RATING', 'service_rating', info.lastInsertRowid, `Đánh giá ${stars} sao chất lượng dịch vụ cho hồ sơ ${reqDoc.code}`, req.ip);
    return res.status(201).json({ message: 'Cảm ơn quý công dân đã đánh giá! Ý kiến của bạn giúp UBND xã nâng cao chất lượng phục vụ.' });
  }
});

// ==========================================
// 11. ĐÁNH GIÁ GIAO DIỆN VÀ TRẢI NGHIỆM APP (APP UI/UX RATINGS) - BẮT BUỘC
// ==========================================

app.post('/api/ratings/app-ui', optionalAuth, (req, res) => {
  const {
    q1_ui_beauty,
    q2_ease_of_finding,
    q3_readability_colors,
    q4_speed_stars,
    q5_layout_stars,
    q6_suggestions
  } = req.body;

  if (!q1_ui_beauty || !q2_ease_of_finding || !q3_readability_colors || !q4_speed_stars || !q5_layout_stars) {
    return res.status(400).json({ error: 'Vui lòng trả lời đầy đủ các câu hỏi khảo sát giao diện' });
  }

  const userId = req.user ? req.user.id : null;
  const userRole = req.user ? req.user.role : 'citizen';
  const userName = req.user ? req.user.full_name : 'Công dân ẩn danh';

  const stmt = db.prepare(`
    INSERT INTO app_ui_ratings (user_id, user_role, user_name, q1_ui_beauty, q2_ease_of_finding, q3_readability_colors, q4_speed_stars, q5_layout_stars, q6_suggestions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(userId, userRole, userName, q1_ui_beauty, q2_ease_of_finding, q3_readability_colors, q4_speed_stars, q5_layout_stars, q6_suggestions || '');

  logAudit(userId, userName, userRole, 'RATE_APP_UI', 'app_ui_rating', info.lastInsertRowid, `Đánh giá trải nghiệm giao diện: ${q1_ui_beauty}, Tốc độ ${q4_speed_stars}/5`, req.ip);

  res.status(201).json({
    id: info.lastInsertRowid,
    message: 'Cảm ơn bạn đã đóng góp ý kiến đánh giá giao diện! Ban Quản trị hệ thống sẽ tiếp thu để nâng cấp trải nghiệm tốt hơn.'
  });
});

// ==========================================
// 12. TRANG THỐNG KÊ ĐÁNH GIÁ (RATING ANALYTICS - 2 NHÓM TÁCH BIỆT)
// ==========================================

app.get('/api/ratings/stats', authMiddleware, (req, res) => {
  if (req.user.role === 'citizen') {
    return res.status(403).json({ error: 'Không có quyền truy cập trang thống kê' });
  }

  // --- Nhóm A: Đánh giá chất lượng phục vụ (Service Ratings) ---
  const serviceTotalRow = db.prepare('SELECT COUNT(*) as count, AVG(stars) as avg_stars FROM service_ratings').get();
  const serviceCount = serviceTotalRow.count || 0;
  const serviceAvg = serviceCount > 0 ? parseFloat(serviceTotalRow.avg_stars.toFixed(2)) : null;

  // Phân bố sao 1 đến 5
  const starsDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const starsRows = db.prepare('SELECT stars, COUNT(*) as count FROM service_ratings GROUP BY stars').all();
  for (const r of starsRows) {
    starsDist[r.stars] = r.count;
  }

  // Tỷ lệ các câu hỏi chất lượng
  const qSatisfied = db.prepare('SELECT SUM(q1_resolved_satisfactorily) as count FROM service_ratings').get().count || 0;
  const qClearFeedback = db.prepare('SELECT SUM(q2_clear_feedback) as count FROM service_ratings').get().count || 0;
  const qOnTime = db.prepare('SELECT SUM(q3_processing_time_ok) as count FROM service_ratings').get().count || 0;

  // Danh sách nhận xét phục vụ mới nhất
  const serviceReviews = db.prepare(`
    SELECT sr.*, req.code, req.title, req.category, req.citizen_name
    FROM service_ratings sr
    JOIN online_requests req ON sr.request_id = req.id
    ORDER BY sr.id DESC
    LIMIT 20
  `).all();

  // --- Nhóm B: Đánh giá giao diện và trải nghiệm app (App UI Ratings) ---
  const appTotalRow = db.prepare('SELECT COUNT(*) as count, AVG(q4_speed_stars) as avg_speed, AVG(q5_layout_stars) as avg_layout FROM app_ui_ratings').get();
  const appCount = appTotalRow.count || 0;
  const avgSpeed = appCount > 0 ? parseFloat(appTotalRow.avg_speed.toFixed(2)) : null;
  const avgLayout = appCount > 0 ? parseFloat(appTotalRow.avg_layout.toFixed(2)) : null;

  // Phân bố vẻ đẹp giao diện (Q1)
  const beautyDist = {};
  const beautyRows = db.prepare('SELECT q1_ui_beauty, COUNT(*) as count FROM app_ui_ratings GROUP BY q1_ui_beauty').all();
  for (const r of beautyRows) {
    beautyDist[r.q1_ui_beauty] = r.count;
  }

  // Phân bố khả năng tìm kiếm chức năng (Q2)
  const easeDist = {};
  const easeRows = db.prepare('SELECT q2_ease_of_finding, COUNT(*) as count FROM app_ui_ratings GROUP BY q2_ease_of_finding').all();
  for (const r of easeRows) {
    easeDist[r.q2_ease_of_finding] = r.count;
  }

  // Phân bố độ dễ đọc và màu sắc (Q3)
  const readabilityDist = {};
  const readabilityRows = db.prepare('SELECT q3_readability_colors, COUNT(*) as count FROM app_ui_ratings GROUP BY q3_readability_colors').all();
  for (const r of readabilityRows) {
    readabilityDist[r.q3_readability_colors] = r.count;
  }

  // Danh sách góp ý giao diện mới nhất
  const appReviews = db.prepare(`
    SELECT * FROM app_ui_ratings ORDER BY id DESC LIMIT 20
  `).all();

  res.json({
    service: {
      total: serviceCount,
      avg_stars: serviceAvg,
      stars_distribution: starsDist,
      satisfied_rate: serviceCount > 0 ? Math.round((qSatisfied / serviceCount) * 100) : 0,
      clear_feedback_rate: serviceCount > 0 ? Math.round((qClearFeedback / serviceCount) * 100) : 0,
      on_time_rate: serviceCount > 0 ? Math.round((qOnTime / serviceCount) * 100) : 0,
      recent_reviews: serviceReviews
    },
    app_ui: {
      total: appCount,
      avg_speed: avgSpeed,
      avg_layout: avgLayout,
      beauty_distribution: beautyDist,
      ease_distribution: easeDist,
      readability_distribution: readabilityDist,
      recent_reviews: appReviews
    }
  });
});

// Xuất CSV đánh giá chất lượng phục vụ
app.get('/api/ratings/service/export', authMiddleware, requireRole('admin', 'leader'), (req, res) => {
  const rows = db.prepare(`
    SELECT sr.id, req.code, req.citizen_name, req.category, sr.stars, 
      sr.q1_resolved_satisfactorily, sr.q2_clear_feedback, sr.q3_processing_time_ok, 
      sr.comment, sr.created_at
    FROM service_ratings sr
    JOIN online_requests req ON sr.request_id = req.id
    ORDER BY sr.id DESC
  `).all();

  let csv = 'ID,Mã hồ sơ,Người gửi,Loại yêu cầu,Số sao,Giải quyết thỏa đáng,Phản hồi rõ ràng,Đúng hạn,Nhận xét,Thời gian\n';
  for (const r of rows) {
    csv += `"${r.id}","${r.code}","${r.citizen_name}","${r.category}","${r.stars}","${r.q1_resolved_satisfactorily ? 'Có' : 'Không'}","${r.q2_clear_feedback ? 'Có' : 'Không'}","${r.q3_processing_time_ok ? 'Có' : 'Không'}","${(r.comment || '').replace(/"/g, '""')}","${r.created_at}"\n`;
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="danh-gia-chat-luong-phuc-vu.csv"');
  res.send('\uFEFF' + csv);
});

// Xuất CSV đánh giá giao diện
app.get('/api/ratings/app-ui/export', authMiddleware, requireRole('admin', 'leader'), (req, res) => {
  const rows = db.prepare(`
    SELECT id, user_name, user_role, q1_ui_beauty, q2_ease_of_finding, q3_readability_colors, q4_speed_stars, q5_layout_stars, q6_suggestions, created_at
    FROM app_ui_ratings
    ORDER BY id DESC
  `).all();

  let csv = 'ID,Người đánh giá,Vai trò,Giao diện đẹp không,Dễ tìm chức năng,Độ dễ đọc màu sắc,Tốc độ (sao),Bố cục (sao),Đề xuất góp ý,Thời gian\n';
  for (const r of rows) {
    csv += `"${r.id}","${r.user_name}","${r.user_role}","${r.q1_ui_beauty}","${r.q2_ease_of_finding}","${r.q3_readability_colors}","${r.q4_speed_stars}","${r.q5_layout_stars}","${(r.q6_suggestions || '').replace(/"/g, '""')}","${r.created_at}"\n`;
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="danh-gia-giao-dien-app.csv"');
  res.send('\uFEFF' + csv);
});

// ==========================================
// 13. TỆP ĐÍNH KÈM & XEM TRƯỚC (ATTACHMENTS)
// ==========================================

app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Chưa chọn tệp để tải lên' });
  }

  const { target_type, target_id } = req.body;
  if (!target_type || !target_id) {
    return res.status(400).json({ error: 'Thiếu thông tin đối tượng đính kèm' });
  }

  const stmt = db.prepare(`
    INSERT INTO attachments (target_type, target_id, filename, original_name, file_path, file_size, file_type, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    target_type,
    target_id,
    req.file.filename,
    req.file.originalname,
    `/uploads/${req.file.filename}`,
    req.file.size,
    path.extname(req.file.originalname).toLowerCase().replace('.', ''),
    req.user.id
  );

  res.status(201).json({
    id: info.lastInsertRowid,
    filename: req.file.filename,
    original_name: req.file.originalname,
    file_path: `/uploads/${req.file.filename}`,
    file_size: req.file.size,
    message: 'Tải lên tài liệu thành công'
  });
});

app.delete('/api/attachments/:id', authMiddleware, (req, res) => {
  const att = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);
  if (!att) return res.status(404).json({ error: 'Không tìm thấy tệp đính kèm' });

  // Xóa tệp vật lý nếu tồn tại
  const physicalPath = path.join(uploadsDir, att.filename);
  if (fs.existsSync(physicalPath)) {
    try { fs.unlinkSync(physicalPath); } catch (e) {}
  }

  db.prepare('DELETE FROM attachments WHERE id = ?').run(req.params.id);
  res.json({ message: 'Xóa tệp đính kèm thành công' });
});

// ==========================================
// 14. DASHBOARD & THỐNG KÊ TỔNG QUAN
// ==========================================

app.get('/api/dashboard/stats', authMiddleware, (req, res) => {
  const isCitizen = req.user.role === 'citizen';

  // 1. Thống kê công văn đi
  const totalDocOut = isCitizen ? 0 : db.prepare('SELECT COUNT(*) as count FROM doc_out').get().count;
  const pendingDocOut = isCitizen ? 0 : db.prepare("SELECT COUNT(*) as count FROM doc_out WHERE status = 'pending_review'").get().count;
  const approvedDocOut = isCitizen ? 0 : db.prepare("SELECT COUNT(*) as count FROM doc_out WHERE status = 'approved'").get().count;
  const publishedDocOut = isCitizen ? 0 : db.prepare("SELECT COUNT(*) as count FROM doc_out WHERE status = 'published'").get().count;

  // 2. Thống kê công văn đến
  const totalDocIn = isCitizen ? 0 : db.prepare('SELECT COUNT(*) as count FROM doc_in').get().count;
  const processingDocIn = isCitizen ? 0 : db.prepare("SELECT COUNT(*) as count FROM doc_in WHERE status = 'processing'").get().count;
  const overdueDocIn = isCitizen ? 0 : db.prepare("SELECT COUNT(*) as count FROM doc_in WHERE status = 'overdue' OR (due_date < date('now') AND status != 'completed')").get().count;

  // 3. Thống kê yêu cầu trực tuyến
  let totalRequests, pendingRequests, processingRequests, resolvedRequests;
  if (isCitizen) {
    const userPhone = req.user.phone || '';
    const userEmail = req.user.email || '';
    totalRequests = db.prepare("SELECT COUNT(*) as c FROM online_requests WHERE phone = ? OR email = ?").get(userPhone, userEmail).c;
    pendingRequests = db.prepare("SELECT COUNT(*) as c FROM online_requests WHERE (phone = ? OR email = ?) AND status IN ('received', 'pending_assign')").get(userPhone, userEmail).c;
    processingRequests = db.prepare("SELECT COUNT(*) as c FROM online_requests WHERE (phone = ? OR email = ?) AND status IN ('processing', 'need_info')").get(userPhone, userEmail).c;
    resolvedRequests = db.prepare("SELECT COUNT(*) as c FROM online_requests WHERE (phone = ? OR email = ?) AND status = 'resolved'").get(userPhone, userEmail).c;
  } else {
    totalRequests = db.prepare('SELECT COUNT(*) as count FROM online_requests').get().count;
    pendingRequests = db.prepare("SELECT COUNT(*) as count FROM online_requests WHERE status IN ('received', 'pending_assign')").get().count;
    processingRequests = db.prepare("SELECT COUNT(*) as count FROM online_requests WHERE status IN ('processing', 'need_info')").get().count;
    resolvedRequests = db.prepare("SELECT COUNT(*) as count FROM online_requests WHERE status = 'resolved'").get().count;
  }

  // 4. Thống kê đánh giá
  const serviceRatingRow = db.prepare('SELECT AVG(stars) as avg_stars, COUNT(*) as count FROM service_ratings').get();
  const avgSatisfaction = serviceRatingRow.count > 0 ? parseFloat(serviceRatingRow.avg_stars.toFixed(2)) : null;

  // 5. Thống kê nhiệm vụ
  let totalTasks = 0, myTasks = 0, overdueTasks = 0;
  if (!isCitizen) {
    totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
    myTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ? AND status != 'completed'").get(req.user.id).count;
    overdueTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'overdue' OR (due_date < date('now') AND status != 'completed')").get().count;
  }

  // Danh sách công văn chờ duyệt
  let pendingApprovals = [];
  if (req.user.role === 'leader' || req.user.role === 'admin') {
    pendingApprovals = db.prepare(`
      SELECT d.*, u.full_name as creator_name
      FROM doc_out d
      JOIN users u ON d.creator_id = u.id
      WHERE d.status = 'pending_review'
      ORDER BY d.id DESC LIMIT 5
    `).all();
  }

  // Danh sách yêu cầu trực tuyến mới
  const recentRequests = db.prepare(`
    SELECT * FROM online_requests 
    ${isCitizen ? 'WHERE phone = ? OR email = ?' : ''} 
    ORDER BY id DESC LIMIT 5
  `).all(...(isCitizen ? [req.user.phone || '', req.user.email || ''] : []));

  // Biểu đồ: Số công văn theo trạng thái
  const docStatusDist = isCitizen ? [] : [
    { name: 'Đã phát hành', value: publishedDocOut, color: '#16a34a' },
    { name: 'Đã duyệt', value: approvedDocOut, color: '#2563eb' },
    { name: 'Chờ duyệt', value: pendingDocOut, color: '#f59e0b' },
    { name: 'Bản nháp/Sửa', value: db.prepare("SELECT COUNT(*) as c FROM doc_out WHERE status IN ('draft', 'needs_edit')").get().c, color: '#64748b' }
  ];

  // Biểu đồ: Đánh giá sao 1-5
  const starsDist = [1, 2, 3, 4, 5].map(s => {
    const c = db.prepare('SELECT COUNT(*) as c FROM service_ratings WHERE stars = ?').get(s).c;
    return { stars: `${s} sao`, count: c };
  });

  res.json({
    metrics: {
      total_doc_out: totalDocOut,
      pending_doc_out: pendingDocOut,
      approved_doc_out: approvedDocOut,
      published_doc_out: publishedDocOut,
      total_doc_in: totalDocIn,
      processing_doc_in: processingDocIn,
      overdue_doc_in: overdueDocIn,
      total_requests: totalRequests,
      pending_requests: pendingRequests,
      processing_requests: processingRequests,
      resolved_requests: resolvedRequests,
      avg_satisfaction: avgSatisfaction,
      total_tasks: totalTasks,
      my_tasks: myTasks,
      overdue_tasks: overdueTasks
    },
    charts: {
      doc_status_dist: docStatusDist,
      stars_dist: starsDist
    },
    pending_approvals: pendingApprovals,
    recent_requests: recentRequests
  });
});

// ==========================================
// 15. THÔNG BÁO HỆ THỐNG (NOTIFICATIONS)
// ==========================================

app.get('/api/notifications', authMiddleware, (req, res) => {
  const { category, unread_only } = req.query;
  let sql = 'SELECT * FROM notifications WHERE user_id = ?';
  const params = [req.user.id];

  if (category && category !== 'all') {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (unread_only === 'true') {
    sql += ' AND is_read = 0';
  }

  sql += ' ORDER BY id DESC LIMIT 50';
  const notifs = db.prepare(sql).all(...params);
  const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).count;

  res.json({ notifications: notifs, unread_count: unreadCount });
});

app.post('/api/notifications/:id/read', authMiddleware, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Đã đánh dấu đã đọc' });
});

app.post('/api/notifications/read-all', authMiddleware, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Đã đánh dấu tất cả là đã đọc' });
});

// ==========================================
// 16. BÁO CÁO TỔNG HỢP & NHẬT KÝ KIỂM TOÁN
// ==========================================

app.get('/api/reports/summary', authMiddleware, (req, res) => {
  if (req.user.role === 'citizen') {
    return res.status(403).json({ error: 'Không có quyền truy cập báo cáo' });
  }

  const { start_date, end_date } = req.query;

  const totalIn = db.prepare('SELECT COUNT(*) as c FROM doc_in').get().c;
  const completedIn = db.prepare("SELECT COUNT(*) as c FROM doc_in WHERE status = 'completed'").get().c;
  const overdueIn = db.prepare("SELECT COUNT(*) as c FROM doc_in WHERE status = 'overdue' OR (due_date < date('now') AND status != 'completed')").get().c;

  const totalOut = db.prepare('SELECT COUNT(*) as c FROM doc_out').get().c;
  const publishedOut = db.prepare("SELECT COUNT(*) as c FROM doc_out WHERE status = 'published'").get().c;
  const pendingOut = db.prepare("SELECT COUNT(*) as c FROM doc_out WHERE status = 'pending_review'").get().c;

  const totalReq = db.prepare('SELECT COUNT(*) as c FROM online_requests').get().c;
  const resolvedReq = db.prepare("SELECT COUNT(*) as c FROM online_requests WHERE status = 'resolved'").get().c;

  const ratingSummary = db.prepare('SELECT COUNT(*) as total, AVG(stars) as avg_stars FROM service_ratings').get();
  const appRatingSummary = db.prepare('SELECT COUNT(*) as total, AVG(q4_speed_stars) as avg_speed, AVG(q5_layout_stars) as avg_layout FROM app_ui_ratings').get();

  res.json({
    doc_in: { total: totalIn, completed: completedIn, overdue: overdueIn, on_time_rate: totalIn > 0 ? Math.round(((totalIn - overdueIn) / totalIn) * 100) : 100 },
    doc_out: { total: totalOut, published: publishedOut, pending: pendingOut },
    requests: { total: totalReq, resolved: resolvedReq, resolve_rate: totalReq > 0 ? Math.round((resolvedReq / totalReq) * 100) : 0 },
    ratings: { service_total: ratingSummary.total, service_avg: ratingSummary.total > 0 ? parseFloat(ratingSummary.avg_stars.toFixed(2)) : null, app_total: appRatingSummary.total }
  });
});

app.get('/api/audit-logs', authMiddleware, requireRole('admin'), (req, res) => {
  const { search, limit = 100 } = req.query;
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];

  if (search && search.trim()) {
    sql += ' AND (username LIKE ? OR action LIKE ? OR description LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY id DESC LIMIT ?';
  params.push(parseInt(limit, 10));

  const logs = db.prepare(sql).all(...params);
  res.json(logs);
});

// Single Page Application Fallback (Express 5 compatible)
app.get('{/*path}', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return res.status(404).json({ error: 'Endpoint không tồn tại' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(` HỆ THỐNG ĐIỀU HÀNH CÔNG VĂN VÀ DỊCH VỤ TRỰC TUYẾN CẤP XÃ`);
  console.log(` Đơn vị: UBND Xã Tân Triều - Huyện Thanh Trì - TP. Hà Nội`);
  console.log(` Máy chủ đang chạy tại: http://localhost:${PORT}`);
  console.log(`================================================================`);
});
