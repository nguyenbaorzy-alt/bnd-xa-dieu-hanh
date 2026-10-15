const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data.sqlite');
const db = new Database(dbPath);

// Enable WAL mode and foreign keys for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  const schema = `
    -- Bảng cài đặt hệ thống & đơn vị
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Bảng người dùng
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'leader', 'officer', 'citizen')),
      department TEXT,
      position TEXT,
      email TEXT,
      phone TEXT,
      avatar TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bảng cấu hình quy trình phê duyệt theo loại văn bản
    CREATE TABLE IF NOT EXISTS approval_workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_type TEXT UNIQUE NOT NULL,
      levels_count INTEGER DEFAULT 2,
      level_1_role TEXT DEFAULT 'leader',
      level_1_title TEXT DEFAULT 'Lãnh đạo phụ trách thẩm định',
      level_2_role TEXT DEFAULT 'leader',
      level_2_title TEXT DEFAULT 'Chủ tịch UBND phê duyệt ký',
      level_3_role TEXT DEFAULT 'officer',
      level_3_title TEXT DEFAULT 'Văn thư phát hành',
      description TEXT,
      is_active INTEGER DEFAULT 1
    );

    -- Bảng công văn đi
    CREATE TABLE IF NOT EXISTS doc_out (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_number TEXT,
      doc_type TEXT NOT NULL,
      subject TEXT NOT NULL,
      content TEXT,
      recipient_unit TEXT NOT NULL,
      signer_title TEXT,
      creator_id INTEGER NOT NULL REFERENCES users(id),
      current_approver_id INTEGER REFERENCES users(id),
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('normal', 'urgent', 'emergency')),
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'pending_review', 'needs_edit', 'approved', 'published', 'rejected', 'revoked')),
      approval_level INTEGER DEFAULT 1,
      max_approval_levels INTEGER DEFAULT 2,
      draft_date TEXT DEFAULT (date('now', 'localtime')),
      publish_date TEXT,
      due_date TEXT,
      publisher_id INTEGER REFERENCES users(id),
      is_demo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bảng công văn đến
    CREATE TABLE IF NOT EXISTS doc_in (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incoming_number TEXT NOT NULL,
      original_number TEXT NOT NULL,
      doc_date TEXT NOT NULL,
      received_date TEXT NOT NULL,
      sender_agency TEXT NOT NULL,
      subject TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('normal', 'urgent', 'emergency')),
      due_date TEXT,
      leader_id INTEGER REFERENCES users(id),
      handler_id INTEGER REFERENCES users(id),
      directive TEXT,
      status TEXT DEFAULT 'received' CHECK(status IN ('received', 'pending_assign', 'processing', 'pending_feedback', 'completed', 'overdue')),
      result_note TEXT,
      is_demo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bảng lịch sử phê duyệt công văn nhiều cấp
    CREATE TABLE IF NOT EXISTS approval_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_out_id INTEGER NOT NULL REFERENCES doc_out(id) ON DELETE CASCADE,
      level INTEGER NOT NULL,
      actor_id INTEGER NOT NULL REFERENCES users(id),
      action TEXT NOT NULL CHECK(action IN ('submit', 'approve', 'request_edit', 'reject', 'publish', 'revoke')),
      comment TEXT,
      prev_status TEXT,
      new_status TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bảng yêu cầu trực tuyến của người dân
    CREATE TABLE IF NOT EXISTS online_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      citizen_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'received' CHECK(status IN ('received', 'pending_assign', 'processing', 'need_info', 'resolved', 'rejected', 'closed')),
      handler_id INTEGER REFERENCES users(id),
      handler_dept TEXT,
      response_note TEXT,
      rejection_reason TEXT,
      due_date TEXT,
      resolved_at TEXT,
      is_demo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bảng nhiệm vụ & tiến độ
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      related_type TEXT DEFAULT 'none' CHECK(related_type IN ('none', 'doc_in', 'doc_out', 'request')),
      related_id INTEGER,
      creator_id INTEGER NOT NULL REFERENCES users(id),
      assignee_id INTEGER NOT NULL REFERENCES users(id),
      assigned_date TEXT DEFAULT (date('now', 'localtime')),
      due_date TEXT NOT NULL,
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('normal', 'urgent', 'emergency')),
      progress_percent INTEGER DEFAULT 0 CHECK(progress_percent >= 0 AND progress_percent <= 100),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'waiting_review', 'completed', 'overdue')),
      result_note TEXT,
      is_demo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bảng trao đổi / bình luận trong nhiệm vụ
    CREATE TABLE IF NOT EXISTS task_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bảng tệp đính kèm
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_type TEXT NOT NULL CHECK(target_type IN ('doc_out', 'doc_in', 'request', 'task')),
      target_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      uploaded_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bảng ĐÁNH GIÁ CHẤT LƯỢNG PHỤC VỤ (người dân đánh giá sau khi yêu cầu trực tuyến giải quyết)
    CREATE TABLE IF NOT EXISTS service_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER UNIQUE NOT NULL REFERENCES online_requests(id) ON DELETE CASCADE,
      stars INTEGER NOT NULL CHECK(stars >= 1 AND stars <= 5),
      q1_resolved_satisfactorily INTEGER NOT NULL DEFAULT 1,
      q2_clear_feedback INTEGER NOT NULL DEFAULT 1,
      q3_processing_time_ok INTEGER NOT NULL DEFAULT 1,
      comment TEXT,
      is_demo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bảng ĐÁNH GIÁ GIAO DIỆN VÀ TRẢI NGHIỆM ỨNG DỤNG (UI/UX App Review)
    CREATE TABLE IF NOT EXISTS app_ui_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      user_role TEXT NOT NULL DEFAULT 'citizen',
      user_name TEXT NOT NULL DEFAULT 'Người dân',
      q1_ui_beauty TEXT NOT NULL CHECK(q1_ui_beauty IN ('Rất đẹp', 'Đẹp', 'Bình thường', 'Chưa đẹp', 'Khó sử dụng')),
      q2_ease_of_finding TEXT NOT NULL CHECK(q2_ease_of_finding IN ('Rất dễ', 'Khá dễ', 'Bình thường', 'Khó tìm')),
      q3_readability_colors TEXT NOT NULL CHECK(q3_readability_colors IN ('Rất tốt', 'Tốt', 'Bình thường', 'Cần cải thiện')),
      q4_speed_stars INTEGER NOT NULL CHECK(q4_speed_stars >= 1 AND q4_speed_stars <= 5),
      q5_layout_stars INTEGER NOT NULL CHECK(q5_layout_stars >= 1 AND q5_layout_stars <= 5),
      q6_suggestions TEXT,
      is_demo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bảng thông báo hệ thống
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('doc_out', 'doc_in', 'approval', 'request', 'task', 'warning', 'rating')),
      link_type TEXT,
      link_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bảng nhật ký hoạt động hệ thống (Audit Logs)
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      username TEXT,
      role TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      description TEXT NOT NULL,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bảng danh mục loại nhiệm vụ chuẩn & hệ số KPI
    CREATE TABLE IF NOT EXISTS kpi_task_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      default_product TEXT NOT NULL,
      kpi_weight REAL NOT NULL DEFAULT 1.0,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Cấp 1: Bảng dự án / Mũi nhọn chiến lược (HanoiWork Data Hierarchy)
    CREATE TABLE IF NOT EXISTS kpi_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('strategic', 'doc_mgmt', 'regular', 'ad_hoc')),
      description TEXT,
      start_date TEXT,
      end_date TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'suspended')),
      lead_units TEXT DEFAULT '[]',
      lead_user_ids TEXT DEFAULT '[]',
      collab_units TEXT DEFAULT '[]',
      collab_user_ids TEXT DEFAULT '[]',
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Cấp 2: Bảng thư mục / nhóm lĩnh vực (tùy chọn)
    CREATE TABLE IF NOT EXISTS kpi_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES kpi_projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Cấp 3: Bảng chương trình hành động (chứa các nhiệm vụ)
    CREATE TABLE IF NOT EXISTS kpi_action_programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES kpi_projects(id) ON DELETE CASCADE,
      folder_id INTEGER REFERENCES kpi_folders(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_default INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'suspended')),
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bảng phiên làm việc của Trợ lý AI KPI Assistant (Pipeline 5 bước)
    CREATE TABLE IF NOT EXISTS kpi_pipeline_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_name TEXT NOT NULL,
      job_title TEXT,
      input_content TEXT,
      current_step INTEGER DEFAULT 1,
      tasks_data TEXT,
      audit_logs TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'approved', 'exported')),
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bảng lưu trữ và xác minh mã SMS OTP
    CREATE TABLE IF NOT EXISTS sms_otp_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      attempts INTEGER DEFAULT 0,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bảng nhật ký truy cập IP và giám sát an ninh mạng
    CREATE TABLE IF NOT EXISTS ip_access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT NOT NULL,
      user_agent TEXT,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      status_code INTEGER,
      username TEXT,
      is_blocked INTEGER DEFAULT 0,
      threat_level TEXT DEFAULT 'normal' CHECK(threat_level IN ('normal', 'suspicious', 'danger')),
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bảng quy tắc tường lửa IP (Blacklist / Whitelist)
    CREATE TABLE IF NOT EXISTS ip_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT NOT NULL,
      rule_type TEXT NOT NULL CHECK(rule_type IN ('blacklist', 'whitelist')),
      reason TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id),
      is_active INTEGER DEFAULT 1,
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bảng thử thách CAPTCHA chống Bot tự động
    CREATE TABLE IF NOT EXISTS captcha_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      answer TEXT NOT NULL,
      puzzle_type TEXT DEFAULT 'math',
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Cơ sở dữ liệu Dân cư Quốc gia & Căn cước công dân gắn chip NFC
    CREATE TABLE IF NOT EXISTS national_citizen_registry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cccd TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      dob TEXT NOT NULL,
      gender TEXT NOT NULL,
      ethnicity TEXT DEFAULT 'Kinh',
      hometown TEXT NOT NULL,
      permanent_address TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      chip_serial TEXT NOT NULL,
      portrait_url TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Bản tin & Thông báo UBND Xã/Phường
    CREATE TABLE IF NOT EXISTS commune_news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'thong_bao',
      author_id INTEGER REFERENCES users(id),
      author_name TEXT DEFAULT 'UBND Xã Tân Triều',
      cover_image TEXT,
      is_published INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Indexes để truy vấn nhanh
    CREATE INDEX IF NOT EXISTS idx_doc_out_status ON doc_out(status);
    CREATE INDEX IF NOT EXISTS idx_doc_out_creator ON doc_out(creator_id);
    CREATE INDEX IF NOT EXISTS idx_doc_in_status ON doc_in(status);
    CREATE INDEX IF NOT EXISTS idx_doc_in_handler ON doc_in(handler_id);
    CREATE INDEX IF NOT EXISTS idx_requests_code ON online_requests(code);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON online_requests(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_kpi_proj_cat ON kpi_projects(category);
    CREATE INDEX IF NOT EXISTS idx_kpi_act_proj ON kpi_action_programs(project_id);
    CREATE INDEX IF NOT EXISTS idx_sms_otp_phone ON sms_otp_verifications(phone);
    CREATE INDEX IF NOT EXISTS idx_ip_logs_ip ON ip_access_logs(ip_address);
    CREATE INDEX IF NOT EXISTS idx_ip_rules_ip ON ip_rules(ip_address, is_active);
    CREATE INDEX IF NOT EXISTS idx_captcha_token ON captcha_challenges(token);
    CREATE INDEX IF NOT EXISTS idx_citizen_registry_cccd ON national_citizen_registry(cccd);
    CREATE INDEX IF NOT EXISTS idx_commune_news_cat ON commune_news(category, is_published);
  `;

  db.exec(schema);

  // Migration: Tự động bổ sung các cột cho bảng users nếu chưa tồn tại
  const userCols = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
  const userAddCol = (colName, colType) => {
    if (!userCols.includes(colName)) {
      try {
        db.exec(`ALTER TABLE users ADD COLUMN ${colName} ${colType};`);
        userCols.push(colName);
      } catch (err) {}
    }
  };

  userAddCol('is_phone_verified', 'INTEGER DEFAULT 0');
  userAddCol('phone_verified_at', 'TEXT');
  userAddCol('cccd', 'TEXT');
  userAddCol('dob', 'TEXT');
  userAddCol('gender', 'TEXT');
  userAddCol('ethnicity', "TEXT DEFAULT 'Kinh'");
  userAddCol('hometown', 'TEXT');
  userAddCol('permanent_address', 'TEXT');
  userAddCol('issue_date', 'TEXT');
  userAddCol('chip_serial', 'TEXT');
  userAddCol('ekyc_status', "TEXT DEFAULT 'unverified'");
  userAddCol('ekyc_face_image', 'TEXT');
  userAddCol('ekyc_match_score', 'REAL');
  userAddCol('ekyc_verified_at', 'TEXT');

  try {
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_cccd ON users(cccd) WHERE cccd IS NOT NULL;');
    db.exec('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);');
  } catch (e) {}

  // Migration: Bổ sung CCCD và eKYC cho online_requests
  const reqCols = db.prepare('PRAGMA table_info(online_requests)').all().map(c => c.name);
  if (!reqCols.includes('cccd')) {
    try { db.exec('ALTER TABLE online_requests ADD COLUMN cccd TEXT;'); } catch (e) {}
  }
  if (!reqCols.includes('is_ekyc_verified')) {
    try { db.exec('ALTER TABLE online_requests ADD COLUMN is_ekyc_verified INTEGER DEFAULT 0;'); } catch (e) {}
  }

  // Đảm bảo tài khoản demo có CCCD & thông tin eKYC verified
  try {
    db.prepare(`
      UPDATE users 
      SET cccd = '001195000007', 
          is_phone_verified = 1,
          dob = '1995-10-15',
          gender = 'Nữ',
          ethnicity = 'Kinh',
          hometown = 'Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội',
          permanent_address = 'Số 42 Triều Khúc, Xã Tân Triều, Thanh Trì, Hà Nội',
          chip_serial = 'VN-CHIP-95000007',
          ekyc_status = 'verified',
          ekyc_match_score = 99.2,
          ekyc_verified_at = datetime('now', 'localtime')
      WHERE username = 'nguoidan' AND (cccd IS NULL OR cccd = '' OR ekyc_status != 'verified')
    `).run();
    db.prepare("UPDATE users SET cccd = '001088000001', is_phone_verified = 1 WHERE username = 'admin' AND (cccd IS NULL OR cccd = '')").run();
    db.prepare("UPDATE users SET cccd = '001075000002', is_phone_verified = 1 WHERE username = 'chutich' AND (cccd IS NULL OR cccd = '')").run();
  } catch (e) {}

  // Migration: Tự động bổ sung các cột cho bảng tasks nếu chưa tồn tại
  const taskCols = db.prepare('PRAGMA table_info(tasks)').all().map(c => c.name);
  const addCol = (colName, colType) => {
    if (!taskCols.includes(colName)) {
      try {
        db.exec(`ALTER TABLE tasks ADD COLUMN ${colName} ${colType};`);
        taskCols.push(colName);
      } catch (err) {
        // ignore if exists
      }
    }
  };

  addCol('project_id', 'INTEGER REFERENCES kpi_projects(id)');
  addCol('action_program_id', 'INTEGER REFERENCES kpi_action_programs(id)');
  addCol('parent_task_id', 'INTEGER REFERENCES tasks(id) ON DELETE CASCADE');
  addCol('task_type_id', 'INTEGER REFERENCES kpi_task_types(id)');
  addCol('task_type_name', 'TEXT');
  addCol('target_product', 'TEXT');
  addCol('kpi_weight', 'REAL DEFAULT 1.0');
  addCol('assigned_quantity', 'REAL DEFAULT 1.0');
  addCol('assigned_kpi_score', 'REAL DEFAULT 1.0');
  addCol('completed_quantity', 'REAL DEFAULT 0');
  addCol('actual_completion_date', 'TEXT');
  addCol('delay_days', 'INTEGER DEFAULT 0');
  addCol('raw_completed_kpi', 'REAL DEFAULT 0');
  addCol('final_kpi_score', 'REAL DEFAULT 0');
  addCol('calc_by_subtasks', 'INTEGER DEFAULT 0');
  addCol('lead_unit', 'TEXT');
  addCol('collab_units', 'TEXT');
  addCol('followers', 'TEXT');
  addCol('completion_proof_file', 'TEXT');
  addCol('six_clear_status', 'TEXT');

  console.log('Database schema, CCCD fields and KPI extensions initialized successfully.');
}

// Hàm ghi log hoạt động
function logAudit(userId, username, role, action, targetType, targetId, description, ipAddress = '127.0.0.1') {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, username, role, action, target_type, target_id, description, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(userId, username, role, action, targetType, String(targetId || ''), description, ipAddress);
  } catch (err) {
    console.error('Lỗi ghi audit log:', err.message);
  }
}

// Hàm gửi thông báo
function sendNotification(userId, title, message, category, linkType = null, linkId = null) {
  try {
    const stmt = db.prepare(`
      INSERT INTO notifications (user_id, title, message, category, link_type, link_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(userId, title, message, category, linkType, linkId);
  } catch (err) {
    console.error('Lỗi gửi thông báo:', err.message);
  }
}

// Hàm sinh số ký hiệu công văn đi tiếp theo
function generateNextDocOutNumber(deptCode = 'VP') {
  const currentYear = new Date().getFullYear();
  const pattern = `%/${currentYear}/UBND-${deptCode}`;
  
  const lastDoc = db.prepare(`
    SELECT doc_number FROM doc_out 
    WHERE doc_number LIKE ? 
    ORDER BY id DESC LIMIT 1
  `).get(pattern);

  let nextSeq = 1;
  if (lastDoc && lastDoc.doc_number) {
    const parts = lastDoc.doc_number.split('/');
    const currentSeq = parseInt(parts[0], 10);
    if (!isNaN(currentSeq)) {
      nextSeq = currentSeq + 1;
    }
  }

  return `${String(nextSeq).padStart(2, '0')}/${currentYear}/UBND-${deptCode}`;
}

// Hàm sinh mã hồ sơ trực tuyến tiếp theo
function generateNextRequestCode() {
  const currentYear = new Date().getFullYear();
  const pattern = `HS-${currentYear}-%`;
  
  const lastReq = db.prepare(`
    SELECT code FROM online_requests 
    WHERE code LIKE ? 
    ORDER BY id DESC LIMIT 1
  `).get(pattern);

  let nextSeq = 1;
  if (lastReq && lastReq.code) {
    const parts = lastReq.code.split('-');
    const currentSeq = parseInt(parts[2], 10);
    if (!isNaN(currentSeq)) {
      nextSeq = currentSeq + 1;
    }
  }

  return `HS-${currentYear}-${String(nextSeq).padStart(5, '0')}`;
}

initSchema();

module.exports = {
  db,
  initSchema,
  logAudit,
  sendNotification,
  generateNextDocOutNumber,
  generateNextRequestCode
};
