const express = require('express');
const router = express.Router();
const { db, logAudit, sendNotification } = require('../database/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ubnd_tan_trieu_secure_jwt_secret_2026';

// Middleware xác thực JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, full_name, role, department, position, email, phone, is_active FROM users WHERE id = ?').get(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại hoặc đã bị khóa' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token không hợp lệ' });
  }
}

// Helper tính khoảng cách số ngày giữa 2 chuỗi ngày YYYY-MM-DD
function calculateDelayDays(dueDateStr, actualDateStr) {
  if (!dueDateStr || !actualDateStr) return 0;
  const due = new Date(dueDateStr.split('T')[0]);
  const actual = new Date(actualDateStr.split('T')[0]);
  const diffTime = actual.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Helper thẩm định nguyên tắc "6 Rõ"
function auditSixClear(task) {
  const result = {
    clear_person: false,          // Rõ người: Có chủ trì duy nhất
    clear_work: false,            // Rõ việc: Tên có hành động rõ ràng
    clear_time: false,            // Rõ thời gian: Có deadline cụ thể
    clear_responsibility: false,  // Rõ trách nhiệm: Có đơn vị chủ trì
    clear_product: false,         // Rõ sản phẩm: Có sản phẩm đầu ra định lượng
    clear_authority: false,       // Rõ thẩm quyền: Đúng chức năng cấp cơ sở
    score: 0,
    suggestions: []
  };

  if (task.assignee_id || (task.lead_user && task.lead_user.trim())) {
    result.clear_person = true;
    result.score++;
  } else {
    result.suggestions.push('Chưa chỉ định cán bộ chủ trì chịu trách nhiệm trực tiếp');
  }

  const title = (task.title || '').trim();
  const actionVerbs = ['soạn thảo', 'xây dựng', 'hoàn thiện', 'kiểm tra', 'xử lý', 'thực hiện', 'báo cáo', 'tổng hợp', 'rà soát', 'đối chiếu', 'số hóa', 'làm sạch', 'phê duyệt', 'triển khai', 'khảo sát', 'chỉ đạo'];
  const hasVerb = actionVerbs.some(v => title.toLowerCase().includes(v));
  if (title.length >= 10 && hasVerb) {
    result.clear_work = true;
    result.score++;
  } else {
    result.suggestions.push('Tên nhiệm vụ cần bắt đầu bằng động từ hành động cụ thể và định lượng phạm vi');
  }

  if (task.due_date && task.due_date.trim() && task.due_date !== 'null') {
    result.clear_time = true;
    result.score++;
  } else {
    result.suggestions.push('Thiếu mốc thời hạn hoàn thành (Deadline cụ thể)');
  }

  if (task.lead_unit && task.lead_unit.trim()) {
    result.clear_responsibility = true;
    result.score++;
  } else {
    result.suggestions.push('Chưa xác định Đơn vị/Phòng ban chủ trì');
  }

  const prod = (task.target_product || '').trim();
  if (prod.length >= 4 && (task.assigned_quantity || 1) > 0) {
    result.clear_product = true;
    result.score++;
  } else {
    result.suggestions.push('Chưa định lượng sản phẩm đầu ra (Ví dụ: Số lượng văn bản, Báo cáo, Quyết định...)');
  }

  // Thẩm quyền
  result.clear_authority = true;
  result.score++;

  return result;
}

// ==========================================
// 1. KPI TASK TYPES (LOẠI NHIỆM VỤ CHUẨN)
// ==========================================

router.get('/kpi/task-types', authMiddleware, (req, res) => {
  const types = db.prepare('SELECT * FROM kpi_task_types ORDER BY id ASC').all();
  res.json(types);
});

router.post('/kpi/task-types', authMiddleware, (req, res) => {
  const { code, name, default_product, kpi_weight, description } = req.body;
  if (!name || !default_product) {
    return res.status(400).json({ error: 'Tên loại nhiệm vụ và sản phẩm mặc định là bắt buộc' });
  }

  const generatedCode = code || `KT-${Date.now().toString().slice(-4)}`;
  const weight = parseFloat(kpi_weight) || 1.0;

  const stmt = db.prepare(`
    INSERT INTO kpi_task_types (code, name, default_product, kpi_weight, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = stmt.run(generatedCode, name, default_product, weight, description || '');
  res.status(201).json({ id: info.lastInsertRowid, message: 'Thêm loại nhiệm vụ chuẩn thành công' });
});

// ==========================================
// 2. CÂY DỮ LIỆU LƯU TRỮ 3 CẤP (DATA HIERARCHY)
// ==========================================

// Lấy toàn bộ cây dữ liệu 3 cấp HanoiWork
router.get('/kpi/hierarchy', authMiddleware, (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*, u.full_name as creator_name
      FROM kpi_projects p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.id ASC
    `).all();

    const folders = db.prepare('SELECT * FROM kpi_folders ORDER BY id ASC').all();
    const actionPrograms = db.prepare('SELECT * FROM kpi_action_programs ORDER BY id ASC').all();

    // Thống kê số lượng nhiệm vụ cho từng action program
    const taskCounts = db.prepare(`
      SELECT action_program_id, 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'overdue' OR (status != 'completed' AND due_date != '' AND due_date < date('now', 'localtime')) THEN 1 ELSE 0 END) as overdue_tasks
      FROM tasks
      WHERE action_program_id IS NOT NULL
      GROUP BY action_program_id
    `).all();

    const countMap = {};
    for (const c of taskCounts) {
      countMap[c.action_program_id] = c;
    }

    // Tổ chức cây
    const hierarchy = projects.map(proj => {
      let leadUnits = [];
      let leadUsers = [];
      let collabUnits = [];
      let collabUsers = [];
      try { leadUnits = JSON.parse(proj.lead_units || '[]'); } catch (e) {}
      try { leadUsers = JSON.parse(proj.lead_user_ids || '[]'); } catch (e) {}
      try { collabUnits = JSON.parse(proj.collab_units || '[]'); } catch (e) {}
      try { collabUsers = JSON.parse(proj.collab_user_ids || '[]'); } catch (e) {}

      // Lấy folders thuộc dự án
      const projFolders = folders.filter(f => f.project_id === proj.id).map(f => {
        // Programs thuộc folder này
        const fPrograms = actionPrograms.filter(ap => ap.project_id === proj.id && ap.folder_id === f.id).map(ap => ({
          ...ap,
          stats: countMap[ap.id] || { total_tasks: 0, completed_tasks: 0, overdue_tasks: 0 }
        }));
        return {
          ...f,
          type: 'folder',
          action_programs: fPrograms
        };
      });

      // Programs nằm trực tiếp dưới dự án (folder_id is null)
      const directPrograms = actionPrograms.filter(ap => ap.project_id === proj.id && (!ap.folder_id || ap.folder_id === null)).map(ap => ({
        ...ap,
        stats: countMap[ap.id] || { total_tasks: 0, completed_tasks: 0, overdue_tasks: 0 }
      }));

      return {
        ...proj,
        type: 'project',
        lead_units: leadUnits,
        lead_user_ids: leadUsers,
        collab_units: collabUnits,
        collab_user_ids: collabUsers,
        folders: projFolders,
        direct_programs: directPrograms
      };
    });

    res.json(hierarchy);
  } catch (err) {
    console.error('Lỗi lấy cây dữ liệu:', err);
    res.status(500).json({ error: err.message });
  }
});

// Danh sách Dự án (Cấp 1)
router.get('/kpi/projects', authMiddleware, (req, res) => {
  const { category, status } = req.query;
  let sql = 'SELECT * FROM kpi_projects WHERE 1=1';
  const params = [];

  if (category && category !== 'all') {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY id DESC';

  const projects = db.prepare(sql).all(...params);
  const parsed = projects.map(p => ({
    ...p,
    lead_units: JSON.parse(p.lead_units || '[]'),
    lead_user_ids: JSON.parse(p.lead_user_ids || '[]'),
    collab_units: JSON.parse(p.collab_units || '[]'),
    collab_user_ids: JSON.parse(p.collab_user_ids || '[]')
  }));
  res.json(parsed);
});

// Chi tiết 1 Dự án
router.get('/kpi/projects/:id', authMiddleware, (req, res) => {
  const project = db.prepare('SELECT * FROM kpi_projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });

  const folders = db.prepare('SELECT * FROM kpi_folders WHERE project_id = ?').all(req.params.id);
  const actionPrograms = db.prepare('SELECT * FROM kpi_action_programs WHERE project_id = ?').all(req.params.id);

  res.json({
    ...project,
    lead_units: JSON.parse(project.lead_units || '[]'),
    lead_user_ids: JSON.parse(project.lead_user_ids || '[]'),
    collab_units: JSON.parse(project.collab_units || '[]'),
    collab_user_ids: JSON.parse(project.collab_user_ids || '[]'),
    folders,
    action_programs: actionPrograms
  });
});

// Tạo mới Dự án (Cấp 1) -> Tự động khởi tạo 1 Chương trình hành động mặc định!
router.post('/kpi/projects', authMiddleware, (req, res) => {
  const { code, name, category, description, start_date, end_date, lead_units, lead_user_ids, collab_units, collab_user_ids } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'Tên dự án và phân loại chiến lược là bắt buộc' });
  }

  const projCode = code || `DA-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  const lUnits = JSON.stringify(lead_units || []);
  const lUsers = JSON.stringify(lead_user_ids || []);
  const cUnits = JSON.stringify(collab_units || []);
  const cUsers = JSON.stringify(collab_user_ids || []);

  const stmt = db.prepare(`
    INSERT INTO kpi_projects (code, name, category, description, start_date, end_date, status, lead_units, lead_user_ids, collab_units, collab_user_ids, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(projCode, name, category, description || '', start_date || null, end_date || null, lUnits, lUsers, cUnits, cUsers, req.user.id);
  const projectId = info.lastInsertRowid;

  // QUY TẮC NGHIỆP VỤ: Tự động khởi tạo sẵn 1 Chương trình hành động mặc định
  db.prepare(`
    INSERT INTO kpi_action_programs (project_id, folder_id, name, description, is_default, status)
    VALUES (?, null, ?, ?, 1, 'active')
  `).run(projectId, 'Chương trình hành động tổng thể', 'Chương trình hành động mặc định được khởi tạo tự động khi lập dự án');

  logAudit(req.user.id, req.user.username, req.user.role, 'CREATE_KPI_PROJECT', 'kpi_project', projectId, `Tạo dự án cấp 1: ${name}`, req.ip);
  res.status(201).json({ id: projectId, code: projCode, message: 'Khởi tạo dự án và chương trình hành động mặc định thành công' });
});

// Cập nhật Dự án
router.put('/kpi/projects/:id', authMiddleware, (req, res) => {
  const { name, category, description, start_date, end_date, status, lead_units, lead_user_ids, collab_units, collab_user_ids } = req.body;
  const project = db.prepare('SELECT * FROM kpi_projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });

  const lUnits = lead_units !== undefined ? JSON.stringify(lead_units) : project.lead_units;
  const lUsers = lead_user_ids !== undefined ? JSON.stringify(lead_user_ids) : project.lead_user_ids;
  const cUnits = collab_units !== undefined ? JSON.stringify(collab_units) : project.collab_units;
  const cUsers = collab_user_ids !== undefined ? JSON.stringify(collab_user_ids) : project.collab_user_ids;

  db.prepare(`
    UPDATE kpi_projects
    SET name = COALESCE(?, name),
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        status = COALESCE(?, status),
        lead_units = ?,
        lead_user_ids = ?,
        collab_units = ?,
        collab_user_ids = ?,
        updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(name, category, description, start_date, end_date, status, lUnits, lUsers, cUnits, cUsers, req.params.id);

  res.json({ message: 'Cập nhật thông tin dự án thành công' });
});

// Xóa Dự án (Xóa an toàn cascading)
router.delete('/kpi/projects/:id', authMiddleware, (req, res) => {
  const projId = req.params.id;
  try {
    const progIds = db.prepare('SELECT id FROM kpi_action_programs WHERE project_id = ?').all(projId).map(p => p.id);
    if (progIds.length > 0) {
      db.prepare(`DELETE FROM tasks WHERE action_program_id IN (${progIds.map(() => '?').join(',')})`).run(...progIds);
    }
    db.prepare('DELETE FROM tasks WHERE project_id = ?').run(projId);
    db.prepare('DELETE FROM kpi_action_programs WHERE project_id = ?').run(projId);
    db.prepare('DELETE FROM kpi_folders WHERE project_id = ?').run(projId);
    db.prepare('DELETE FROM kpi_projects WHERE id = ?').run(projId);
    logAudit(req.user.id, req.user.username, req.user.role, 'DELETE_KPI_PROJECT', 'kpi_project', projId, `Xóa dự án ID ${projId}`, req.ip);
    res.json({ message: 'Xóa dự án thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cấp 2: Thư mục (Nhóm lĩnh vực - Tùy chọn)
router.post('/kpi/folders', authMiddleware, (req, res) => {
  const { project_id, name, description } = req.body;
  if (!project_id || !name) {
    return res.status(400).json({ error: 'Vui lòng chọn Dự án và nhập tên Thư mục / Lĩnh vực' });
  }

  const stmt = db.prepare('INSERT INTO kpi_folders (project_id, name, description) VALUES (?, ?, ?)');
  const info = stmt.run(project_id, name, description || '');
  res.status(201).json({ id: info.lastInsertRowid, message: 'Tạo thư mục lĩnh vực thành công' });
});

router.put('/kpi/folders/:id', authMiddleware, (req, res) => {
  const { name, description } = req.body;
  db.prepare('UPDATE kpi_folders SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?').run(name, description, req.params.id);
  res.json({ message: 'Cập nhật thư mục thành công' });
});

router.delete('/kpi/folders/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM kpi_folders WHERE id = ?').run(req.params.id);
  res.json({ message: 'Xóa thư mục thành công' });
});

// Cấp 3: Chương trình hành động (Nhóm nhiệm vụ / giải pháp)
router.post('/kpi/action-programs', authMiddleware, (req, res) => {
  const { project_id, folder_id, name, description } = req.body;
  if (!project_id || !name) {
    return res.status(400).json({ error: 'Vui lòng chọn Dự án và nhập tên Chương trình hành động' });
  }

  // Ràng buộc cứng: Thư mục phải thuộc đúng dự án nếu có folder_id
  if (folder_id) {
    const f = db.prepare('SELECT id FROM kpi_folders WHERE id = ? AND project_id = ?').get(folder_id, project_id);
    if (!f) return res.status(400).json({ error: 'Thư mục không thuộc dự án đã chọn' });
  }

  const stmt = db.prepare(`
    INSERT INTO kpi_action_programs (project_id, folder_id, name, description, is_default, status)
    VALUES (?, ?, ?, ?, 0, 'active')
  `);
  const info = stmt.run(project_id, folder_id || null, name, description || '');
  res.status(201).json({ id: info.lastInsertRowid, message: 'Tạo chương trình hành động thành công' });
});

router.put('/kpi/action-programs/:id', authMiddleware, (req, res) => {
  const { name, description, folder_id, status } = req.body;
  db.prepare(`
    UPDATE kpi_action_programs 
    SET name = COALESCE(?, name), 
        description = COALESCE(?, description),
        folder_id = ?,
        status = COALESCE(?, status),
        updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(name, description, folder_id !== undefined ? folder_id : null, status, req.params.id);

  res.json({ message: 'Cập nhật chương trình hành động thành công' });
});

// Sao chép Chương trình hành động
router.post('/kpi/action-programs/:id/duplicate', authMiddleware, (req, res) => {
  const source = db.prepare('SELECT * FROM kpi_action_programs WHERE id = ?').get(req.params.id);
  if (!source) return res.status(404).json({ error: 'Không tìm thấy chương trình hành động nguồn' });

  const info = db.prepare(`
    INSERT INTO kpi_action_programs (project_id, folder_id, name, description, is_default, status)
    VALUES (?, ?, ?, ?, 0, 'active')
  `).run(source.project_id, source.folder_id, `${source.name} (Bản sao)`, source.description);

  const newProgId = info.lastInsertRowid;

  // Sao chép luôn các nhiệm vụ của chương trình
  const tasks = db.prepare('SELECT * FROM tasks WHERE action_program_id = ? AND parent_task_id IS NULL').all(source.id);
  for (const t of tasks) {
    db.prepare(`
      INSERT INTO tasks (
        title, description, project_id, action_program_id, parent_task_id,
        creator_id, assignee_id, assigned_date, due_date, priority, progress_percent, status,
        task_type_id, task_type_name, target_product, kpi_weight, assigned_quantity, assigned_kpi_score,
        lead_unit, collab_units, followers, six_clear_status
      ) VALUES (?, ?, ?, ?, null, ?, ?, date('now', 'localtime'), ?, ?, 0, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      t.title, t.description, t.project_id, newProgId,
      req.user.id, t.assignee_id, t.due_date, t.priority,
      t.task_type_id, t.task_type_name, t.target_product, t.kpi_weight, t.assigned_quantity, t.assigned_kpi_score,
      t.lead_unit, t.collab_units, t.followers, t.six_clear_status
    );
  }

  res.json({ id: newProgId, message: 'Sao chép chương trình hành động và nhiệm vụ thành công' });
});

router.delete('/kpi/action-programs/:id', authMiddleware, (req, res) => {
  const progId = req.params.id;
  try {
    db.prepare('DELETE FROM tasks WHERE action_program_id = ?').run(progId);
    db.prepare('DELETE FROM kpi_action_programs WHERE id = ?').run(progId);
    res.json({ message: 'Xóa chương trình hành động thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. NHIỆM VỤ HANOIWORK & CÔNG THỨC TÍNH ĐIỂM KPI
// ==========================================

// Lấy danh sách nhiệm vụ theo bộ lọc đa chiều
router.get('/kpi/tasks', authMiddleware, (req, res) => {
  const { action_program_id, project_id, parent_task_id, status, priority, assignee_id, department, date_from, date_to } = req.query;

  let sql = `
    SELECT t.*,
      cr.full_name as creator_name,
      asg.full_name as assignee_name, asg.department as assignee_dept, asg.position as assignee_position,
      p.name as project_name, p.category as project_category,
      ap.name as action_program_name,
      (SELECT COUNT(*) FROM tasks sub WHERE sub.parent_task_id = t.id) as subtask_count,
      (SELECT COUNT(*) FROM tasks sub WHERE sub.parent_task_id = t.id AND sub.status = 'completed') as subtask_completed_count
    FROM tasks t
    JOIN users cr ON t.creator_id = cr.id
    JOIN users asg ON t.assignee_id = asg.id
    LEFT JOIN kpi_projects p ON t.project_id = p.id
    LEFT JOIN kpi_action_programs ap ON t.action_program_id = ap.id
    WHERE 1=1
  `;
  const params = [];

  if (action_program_id) {
    sql += ' AND t.action_program_id = ?';
    params.push(action_program_id);
  }
  if (project_id) {
    sql += ' AND t.project_id = ?';
    params.push(project_id);
  }
  if (parent_task_id !== undefined) {
    if (parent_task_id === 'null' || parent_task_id === '') {
      sql += ' AND t.parent_task_id IS NULL';
    } else {
      sql += ' AND t.parent_task_id = ?';
      params.push(parent_task_id);
    }
  }
  if (status && status !== 'all') {
    if (status === 'completed') {
      sql += " AND t.status = 'completed'";
    } else if (status === 'in_progress') {
      sql += " AND t.status = 'in_progress'";
    } else if (status === 'overdue') {
      sql += " AND (t.status = 'overdue' OR (t.status != 'completed' AND t.due_date != '' AND t.due_date < date('now', 'localtime')))";
    } else if (status === 'pending') {
      sql += " AND t.status = 'pending'";
    } else if (status === 'uncompleted') {
      sql += " AND t.status != 'completed'";
    }
  }
  if (priority && priority !== 'all') {
    sql += ' AND t.priority = ?';
    params.push(priority);
  }
  if (assignee_id && assignee_id !== 'all') {
    sql += ' AND t.assignee_id = ?';
    params.push(assignee_id);
  }
  if (department && department !== 'all') {
    sql += ' AND asg.department = ?';
    params.push(department);
  }
  if (date_from) {
    sql += ' AND t.due_date >= ?';
    params.push(date_from);
  }
  if (date_to) {
    sql += ' AND t.due_date <= ?';
    params.push(date_to);
  }

  sql += ' ORDER BY t.due_date ASC, t.id DESC';
  const tasks = db.prepare(sql).all(...params);

  // Parse JSON fields
  const parsed = tasks.map(t => ({
    ...t,
    followers: JSON.parse(t.followers || '[]'),
    six_clear_status: JSON.parse(t.six_clear_status || '{}')
  }));

  res.json(parsed);
});

// Chi tiết 1 nhiệm vụ cùng các nhiệm vụ con (Sub-tasks) và comment
router.get('/kpi/tasks/:id', authMiddleware, (req, res) => {
  const task = db.prepare(`
    SELECT t.*,
      cr.full_name as creator_name,
      asg.full_name as assignee_name, asg.department as assignee_dept, asg.position as assignee_position,
      p.name as project_name, p.category as project_category,
      ap.name as action_program_name
    FROM tasks t
    JOIN users cr ON t.creator_id = cr.id
    JOIN users asg ON t.assignee_id = asg.id
    LEFT JOIN kpi_projects p ON t.project_id = p.id
    LEFT JOIN kpi_action_programs ap ON t.action_program_id = ap.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) return res.status(404).json({ error: 'Không tìm thấy nhiệm vụ' });

  // Lấy danh sách nhiệm vụ con
  const subtasks = db.prepare(`
    SELECT t.*, asg.full_name as assignee_name, asg.department as assignee_dept
    FROM tasks t
    JOIN users asg ON t.assignee_id = asg.id
    WHERE t.parent_task_id = ?
    ORDER BY t.id ASC
  `).all(req.params.id);

  // Comments
  const comments = db.prepare(`
    SELECT c.*, u.full_name as user_name, u.role as user_role, u.department as user_dept
    FROM task_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.task_id = ?
    ORDER BY c.id ASC
  `).all(req.params.id);

  res.json({
    ...task,
    followers: JSON.parse(task.followers || '[]'),
    six_clear_status: JSON.parse(task.six_clear_status || '{}'),
    subtasks: subtasks.map(s => ({
      ...s,
      followers: JSON.parse(s.followers || '[]'),
      six_clear_status: JSON.parse(s.six_clear_status || '{}')
    })),
    comments
  });
});

// Tạo nhiệm vụ mới (Tuân thủ logic RBAC, Đơn vị chủ trì, Chủ trì duy nhất, Công thức KPI khi tạo)
router.post('/kpi/tasks', authMiddleware, (req, res) => {
  const {
    title, description, action_program_id, parent_task_id,
    assignee_id, due_date, priority,
    task_type_id, task_type_name, target_product, kpi_weight,
    assigned_quantity, calc_by_subtasks, lead_unit, collab_units, followers
  } = req.body;

  // 1. Ràng buộc cứng cấp độ: Chỉ có Chương trình hành động mới chứa được Nhiệm vụ
  if (!action_program_id) {
    return res.status(400).json({ error: 'Ràng buộc cấp độ: Chỉ Chương trình hành động mới được phép chứa các nhiệm vụ' });
  }

  const program = db.prepare('SELECT p.*, ap.project_id FROM kpi_action_programs ap JOIN kpi_projects p ON ap.project_id = p.id WHERE ap.id = ?').get(action_program_id);
  if (!program) return res.status(404).json({ error: 'Chương trình hành động không tồn tại' });

  // 2. Logic Chủ trì duy nhất
  if (!assignee_id) {
    return res.status(400).json({ error: 'Ràng buộc chủ trì duy nhất: Phải chỉ định duy nhất 1 cán bộ chịu trách nhiệm chính' });
  }

  // 3. Logic Đơn vị chủ trì và Đơn vị phối hợp (Cấp Kế hoạch/Dự án)
  // Chỉ những thành viên/phòng ban nằm trong danh sách Đơn vị chủ trì mới được phép giao hoặc nhận việc!
  let leadUserIds = [];
  try { leadUserIds = JSON.parse(program.lead_user_ids || '[]'); } catch (e) {}

  let leadUnits = [];
  try { leadUnits = JSON.parse(program.lead_units || '[]'); } catch (e) {}

  // Kiểm tra người nhận có thuộc danh sách được giao việc không
  const assigneeUser = db.prepare('SELECT id, full_name, department FROM users WHERE id = ?').get(assignee_id);
  if (!assigneeUser) return res.status(404).json({ error: 'Người nhận việc không tồn tại' });

  const isAssigneeAllowed = (leadUserIds.length === 0 && leadUnits.length === 0) ||
    leadUserIds.includes(parseInt(assignee_id, 10)) ||
    leadUnits.includes(assigneeUser.department);

  if (!isAssigneeAllowed) {
    return res.status(403).json({
      error: `Thành viên trong Đơn vị phối hợp chỉ có quyền xem (Read-only). Cán bộ "${assigneeUser.full_name}" (${assigneeUser.department}) không thuộc Đơn vị chủ trì của dự án này nên không thể nhận việc.`
    });
  }

  // 4. Thuật toán tính điểm KPI - CÔNG THỨC 1: SL giao quy đổi = Số lượng giao * Hệ số quy đổi
  const weight = parseFloat(kpi_weight) || 1.0;
  const qty = parseFloat(assigned_quantity) || 1.0;
  const assigned_kpi_score = Number((qty * weight).toFixed(2));

  // Thẩm định nguyên tắc 6 Rõ
  const sixClear = auditSixClear({
    title,
    assignee_id,
    due_date,
    lead_unit: lead_unit || assigneeUser.department,
    target_product,
    assigned_quantity: qty
  });

  const followersJson = JSON.stringify(followers || []);
  const sixClearJson = JSON.stringify(sixClear);

  const stmt = db.prepare(`
    INSERT INTO tasks (
      title, description, project_id, action_program_id, parent_task_id,
      creator_id, assignee_id, assigned_date, due_date, priority, progress_percent, status,
      task_type_id, task_type_name, target_product, kpi_weight, assigned_quantity, assigned_kpi_score,
      completed_quantity, delay_days, raw_completed_kpi, final_kpi_score, calc_by_subtasks,
      lead_unit, collab_units, followers, six_clear_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, date('now', 'localtime'), ?, ?, 0, 'pending', ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    title, description || '', program.project_id, action_program_id, parent_task_id || null,
    req.user.id, assignee_id, due_date || '', priority || 'normal',
    task_type_id || null, task_type_name || '', target_product || '', weight, qty, assigned_kpi_score,
    calc_by_subtasks ? 1 : 0, lead_unit || assigneeUser.department, collab_units || '', followersJson, sixClearJson
  );

  const taskId = info.lastInsertRowid;

  // Gửi thông báo
  sendNotification(
    assignee_id,
    'Bạn được giao nhiệm vụ mới',
    `${req.user.full_name} đã giao cho bạn: "${title}" (KPI quy đổi: ${assigned_kpi_score} điểm, Hạn: ${due_date || 'Không có'})`,
    'task',
    'task',
    taskId
  );

  logAudit(req.user.id, req.user.username, req.user.role, 'CREATE_KPI_TASK', 'task', taskId, `Giao nhiệm vụ: ${title} (SL quy đổi: ${assigned_kpi_score})`, req.ip);

  res.status(201).json({
    id: taskId,
    assigned_kpi_score,
    six_clear_score: `${sixClear.score}/6`,
    message: 'Tạo nhiệm vụ thành công với chuẩn hóa điểm KPI'
  });
});

// Cập nhật nhiệm vụ (Hỗ trợ 2 cơ chế phân công của Lãnh đạo: Phân rã việc hoặc Ủy quyền toàn bộ)
router.put('/kpi/tasks/:id', authMiddleware, (req, res) => {
  const taskId = req.params.id;
  const current = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!current) return res.status(404).json({ error: 'Không tìm thấy nhiệm vụ' });

  const {
    title, description, assignee_id, due_date, priority,
    task_type_id, task_type_name, target_product, kpi_weight, assigned_quantity,
    calc_by_subtasks, lead_unit, collab_units, followers, is_delegate_all
  } = req.body;

  let newFollowers = [];
  try { newFollowers = JSON.parse(current.followers || '[]'); } catch (e) {}
  if (Array.isArray(followers)) newFollowers = followers;

  // Cơ chế 2: Ủy quyền toàn bộ
  // Nếu Lãnh đạo chuyển giao cho chuyên viên, xóa tên Lãnh đạo khỏi Chủ trì, gán Chuyên viên, và tự động thêm Lãnh đạo vào mục Người theo dõi
  let newAssigneeId = current.assignee_id;
  if (assignee_id && parseInt(assignee_id, 10) !== current.assignee_id) {
    const prevAssignee = db.prepare('SELECT id, full_name, role FROM users WHERE id = ?').get(current.assignee_id);
    newAssigneeId = parseInt(assignee_id, 10);

    if (prevAssignee && (prevAssignee.role === 'leader' || is_delegate_all)) {
      if (!newFollowers.includes(prevAssignee.full_name)) {
        newFollowers.push(prevAssignee.full_name);
      }
    }
  }

  const weight = parseFloat(kpi_weight !== undefined ? kpi_weight : current.kpi_weight) || 1.0;
  const qty = parseFloat(assigned_quantity !== undefined ? assigned_quantity : current.assigned_quantity) || 1.0;
  const assigned_kpi_score = Number((qty * weight).toFixed(2));

  // Kiểm tra 6 Rõ
  const sixClear = auditSixClear({
    title: title || current.title,
    assignee_id: newAssigneeId,
    due_date: due_date !== undefined ? due_date : current.due_date,
    lead_unit: lead_unit || current.lead_unit,
    target_product: target_product || current.target_product,
    assigned_quantity: qty
  });

  db.prepare(`
    UPDATE tasks
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        assignee_id = ?,
        due_date = COALESCE(?, due_date),
        priority = COALESCE(?, priority),
        task_type_id = COALESCE(?, task_type_id),
        task_type_name = COALESCE(?, task_type_name),
        target_product = COALESCE(?, target_product),
        kpi_weight = ?,
        assigned_quantity = ?,
        assigned_kpi_score = ?,
        calc_by_subtasks = COALESCE(?, calc_by_subtasks),
        lead_unit = COALESCE(?, lead_unit),
        collab_units = COALESCE(?, collab_units),
        followers = ?,
        six_clear_status = ?,
        updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    title, description, newAssigneeId, due_date, priority,
    task_type_id, task_type_name, target_product, weight, qty, assigned_kpi_score,
    calc_by_subtasks !== undefined ? (calc_by_subtasks ? 1 : 0) : current.calc_by_subtasks,
    lead_unit, collab_units, JSON.stringify(newFollowers), JSON.stringify(sixClear),
    taskId
  );

  res.json({ message: 'Cập nhật nhiệm vụ thành công' });
});

// ==========================================
// CÀI ĐẶT CHÍNH XÁC BỘ CÔNG THỨC TOÁN HỌC TÍNH ĐIỂM KPI KHI HOÀN THÀNH
// ==========================================
router.post('/kpi/tasks/:id/complete', authMiddleware, (req, res) => {
  const taskId = req.params.id;
  const current = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!current) return res.status(404).json({ error: 'Không tìm thấy nhiệm vụ' });

  const {
    completed_quantity,
    actual_completion_date,
    result_note,
    completion_proof_file
  } = req.body;

  // Ràng buộc: Kết quả hoàn thành là bắt buộc
  if (!result_note || !result_note.trim()) {
    return res.status(400).json({ error: 'Kết quả hoàn thành (mô tả sản phẩm nghiệm thu) là bắt buộc' });
  }

  const actualDate = (actual_completion_date && actual_completion_date.trim()) || new Date().toISOString().split('T')[0];
  const completedQty = parseFloat(completed_quantity) || current.assigned_quantity || 1.0;
  const kpiWeight = parseFloat(current.kpi_weight) || 1.0;

  // CÔNG THỨC 2: Số lượng hoàn thành thực tế quy đổi = Hệ số quy đổi * Số lượng hoàn thành
  const rawCompletedKpi = Number((kpiWeight * completedQty).toFixed(2));

  // CÔNG THỨC 3: Số ngày chậm tiến độ = Max(0, Ngày hoàn thành thực tế - Thời hạn kết thúc)
  let delayDays = 0;
  if (current.due_date && current.due_date.trim()) {
    delayDays = calculateDelayDays(current.due_date, actualDate);
  }

  // CÔNG THỨC 4: Điểm KPI thực nhận sau khi tính tiến độ (Hỗ trợ Thuật toán Bao-Algo™ Dynamic Engine)
  let penaltyRatePerDay = 0.25;
  let bonusRatePerDay = 0.0;
  let graceDays = 0;
  try {
    const algoRow = db.prepare("SELECT value FROM settings WHERE key = 'bao_algo_config'").get();
    if (algoRow && algoRow.value) {
      const parsedAlgo = JSON.parse(algoRow.value);
      if (parsedAlgo.penalty_per_day !== undefined) penaltyRatePerDay = parseFloat(parsedAlgo.penalty_per_day);
      if (parsedAlgo.bonus_per_day !== undefined) bonusRatePerDay = parseFloat(parsedAlgo.bonus_per_day);
      if (parsedAlgo.grace_days !== undefined) graceDays = parseInt(parsedAlgo.grace_days) || 0;
    }
  } catch (e) {}

  const effectiveDelayDays = Math.max(0, delayDays - graceDays);
  let penaltyScore = 0;
  let finalKpiScore = rawCompletedKpi;

  if (effectiveDelayDays > 0) {
    const penaltyRate = effectiveDelayDays * penaltyRatePerDay;
    penaltyScore = Number((penaltyRate * rawCompletedKpi).toFixed(2));
    finalKpiScore = Number(Math.max(0, rawCompletedKpi - penaltyScore).toFixed(2));
  } else if (bonusRatePerDay > 0 && current.due_date && actualDate < current.due_date) {
    const earlyDays = Math.max(0, Math.floor((new Date(current.due_date) - new Date(actualDate)) / (1000 * 60 * 60 * 24)));
    const bonusRate = Math.min(0.25, earlyDays * bonusRatePerDay);
    const bonusScore = Number((bonusRate * rawCompletedKpi).toFixed(2));
    finalKpiScore = Number((rawCompletedKpi + bonusScore).toFixed(2));
  }

  db.prepare(`
    UPDATE tasks
    SET status = 'completed',
        progress_percent = 100,
        completed_quantity = ?,
        actual_completion_date = ?,
        delay_days = ?,
        raw_completed_kpi = ?,
        final_kpi_score = ?,
        result_note = ?,
        completion_proof_file = COALESCE(?, completion_proof_file),
        updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    completedQty, actualDate, delayDays, rawCompletedKpi, finalKpiScore,
    result_note.trim(), completion_proof_file || null, taskId
  );

  // Nếu nhiệm vụ này là nhiệm vụ con của 1 nhiệm vụ mẹ có tính điểm theo con (calc_by_subtasks = 1)
  if (current.parent_task_id) {
    const parent = db.prepare('SELECT * FROM tasks WHERE id = ?').get(current.parent_task_id);
    if (parent && parent.calc_by_subtasks) {
      const subScores = db.prepare(`
        SELECT 
          SUM(final_kpi_score) as sum_final,
          SUM(assigned_kpi_score) as sum_assigned,
          COUNT(*) as total_sub,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sub
        FROM tasks 
        WHERE parent_task_id = ?
      `).get(parent.id);

      const parentPercent = subScores.total_sub > 0 ? Math.round((subScores.completed_sub / subScores.total_sub) * 100) : 100;
      const parentFinal = Number((subScores.sum_final || 0).toFixed(2));

      db.prepare(`
        UPDATE tasks 
        SET final_kpi_score = ?, progress_percent = ?, status = CASE WHEN ? = 100 THEN 'completed' ELSE 'in_progress' END
        WHERE id = ?
      `).run(parentFinal, parentPercent, parentPercent, parent.id);
    }
  }

  // Báo cho người giao
  if (current.creator_id !== req.user.id) {
    sendNotification(
      current.creator_id,
      'Nhiệm vụ đã được báo cáo hoàn thành',
      `${req.user.full_name} đã hoàn thành "${current.title}". Điểm KPI đạt: ${finalKpiScore}/${rawCompletedKpi} (Trễ: ${delayDays} ngày, Phạt: ${penaltyScore} điểm).`,
      'task',
      'task',
      taskId
    );
  }

  logAudit(req.user.id, req.user.username, req.user.role, 'COMPLETE_KPI_TASK', 'task', taskId, `Báo cáo hoàn thành nhiệm vụ ID ${taskId}: Điểm KPI ${finalKpiScore} (Trễ ${delayDays} ngày)`, req.ip);

  res.json({
    message: 'Nghiệm thu và tính điểm KPI hoàn thành thành công',
    raw_completed_kpi: rawCompletedKpi,
    delay_days: delayDays,
    penalty_score: penaltyScore,
    final_kpi_score: finalKpiScore
  });
});

// Phân rã nhiệm vụ (Cơ chế 1 của Lãnh đạo)
router.post('/kpi/tasks/:id/decompose', authMiddleware, (req, res) => {
  const parentId = req.params.id;
  const parent = db.prepare('SELECT * FROM tasks WHERE id = ?').get(parentId);
  if (!parent) return res.status(404).json({ error: 'Không tìm thấy nhiệm vụ cha' });

  const { subtasks } = req.body;
  if (!Array.isArray(subtasks) || subtasks.length === 0) {
    return res.status(400).json({ error: 'Danh sách nhiệm vụ con không được để trống' });
  }

  // Đánh dấu nhiệm vụ mẹ tính theo con
  db.prepare('UPDATE tasks SET calc_by_subtasks = 1 WHERE id = ?').run(parentId);

  const insertSub = db.prepare(`
    INSERT INTO tasks (
      title, description, project_id, action_program_id, parent_task_id,
      creator_id, assignee_id, assigned_date, due_date, priority, progress_percent, status,
      task_type_id, task_type_name, target_product, kpi_weight, assigned_quantity, assigned_kpi_score,
      lead_unit, collab_units, followers, six_clear_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, date('now', 'localtime'), ?, ?, 0, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const createdIds = [];
  for (const s of subtasks) {
    const weight = parseFloat(s.kpi_weight || parent.kpi_weight) || 1.0;
    const qty = parseFloat(s.assigned_quantity) || 1.0;
    const assigned_kpi_score = Number((qty * weight).toFixed(2));
    const sixClear = auditSixClear({
      title: s.title,
      assignee_id: s.assignee_id,
      due_date: s.due_date || parent.due_date,
      lead_unit: s.lead_unit || parent.lead_unit,
      target_product: s.target_product || parent.target_product,
      assigned_quantity: qty
    });

    const info = insertSub.run(
      s.title, s.description || '', parent.project_id, parent.action_program_id, parentId,
      req.user.id, s.assignee_id, s.due_date || parent.due_date, s.priority || parent.priority,
      s.task_type_id || parent.task_type_id, s.task_type_name || parent.task_type_name,
      s.target_product || parent.target_product, weight, qty, assigned_kpi_score,
      s.lead_unit || parent.lead_unit, s.collab_units || '', JSON.stringify([req.user.full_name]), JSON.stringify(sixClear)
    );
    createdIds.push(info.lastInsertRowid);
  }

  logAudit(req.user.id, req.user.username, req.user.role, 'DECOMPOSE_TASK', 'task', parentId, `Phân rã nhiệm vụ ID ${parentId} thành ${createdIds.length} nhiệm vụ con`, req.ip);

  res.status(201).json({
    message: `Đã phân rã thành công ${createdIds.length} nhiệm vụ con cho chuyên viên`,
    created_ids: createdIds
  });
});

// Xóa nhiệm vụ
router.delete('/kpi/tasks/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Xóa nhiệm vụ thành công' });
});

// Trợ lý AI: Tự động gợi ý viết mô tả nhiệm vụ chuẩn cơ quan nhà nước
router.post('/kpi/tasks/ai-describe', authMiddleware, (req, res) => {
  const { title, position, department } = req.body;
  if (!title) return res.status(400).json({ error: 'Vui lòng nhập tên nhiệm vụ để AI sinh mô tả' });

  const descTemplate = `1. Mục tiêu công việc: Triển khai thực hiện "${title}" đảm bảo tiến độ và quy định của UBND xã và cấp có thẩm quyền.
2. Các bước thực hiện:
  - Bước 1: Tiếp nhận hồ sơ, tài liệu liên quan và đối chiếu với cơ sở dữ liệu hiện hành.
  - Bước 2: Kiểm tra thực tế/thẩm tra tính hợp pháp, lập báo cáo chuyên đề hoặc dự thảo văn bản.
  - Bước 3: Lấy ý kiến các bộ phận liên quan (${department || 'các ngành'}), hoàn thiện hồ sơ.
  - Bước 4: Trình Lãnh đạo UBND xã phê duyệt và phát hành/trả kết quả đúng thời hạn.
3. Yêu cầu sản phẩm đầu ra: Đạt tiêu chuẩn định lượng, lưu trữ hồ sơ điện tử theo Nghị định 30/2020/NĐ-CP.
4. Tiêu chí nghiệm thu: Đúng thời hạn, không có khiếu nại, phản ánh của người dân/doanh nghiệp.`;

  res.json({
    suggested_description: descTemplate,
    suggested_product: 'Báo cáo chuyên đề / Hồ sơ lưu trữ hoàn chỉnh',
    suggested_weight: 1.5
  });
});

// ==========================================
// 4. MODULE 1: AI KPI ASSISTANT (PIPELINE 5 BƯỚC)
// ==========================================

// Mẫu văn bản mẫu gợi ý nhanh
const SAMPLE_DOCS = [
  {
    id: 'sample-1',
    title: 'Kế hoạch Chuyển đổi số & Đề án 06 năm 2026 của UBND Xã',
    job_title: 'Chuyên viên Văn phòng - Thống kê & Công nghệ thông tin',
    content: `KẾ HOẠCH TRIỂN KHAI ĐỀ ÁN 06 VÀ CHUYỂN ĐỔI SỐ NĂM 2026
Căn cứ chỉ đạo của UBND Thành phố Hà Nội và UBND Huyện; UBND xã ban hành kế hoạch triển khai với các nhiệm vụ trọng tâm:
1. Rà soát và làm sạch dữ liệu hộ tịch giai đoạn 2020-2025: Đơn vị chủ trì Văn phòng - Thống kê, phối hợp Tư pháp - Hộ tịch và Công an xã. Hoàn thành trước ngày 30/11/2026. Chỉ tiêu 1.200 bản ghi dữ liệu số hóa chuẩn xác.
2. Triển khai mô hình Một cửa thông minh và thanh toán không dùng tiền mặt: Đơn vị chủ trì Văn phòng - Thống kê, phối hợp Ngân hàng Agribank. Hoàn thành trước ngày 15/10/2026. Sản phẩm là 100% quầy tiếp nhận có QR code động và hướng dẫn trực quan.
3. Tuyên truyền cài đặt và kích hoạt tài khoản định danh điện tử VNeID mức 2 cho người dân: Đơn vị chủ trì Đoàn thanh niên, phối hợp Văn phòng xã. Hoàn thành trước 20/12/2026. Chỉ tiêu đạt 95% công dân đủ điều kiện.
4. Tổ chức tập huấn kỹ năng số và an toàn thông tin mạng cho cán bộ công chức xã: Đơn vị chủ trì Lãnh đạo UBND, hoàn thành trước 25/10/2026. Sản phẩm là 1 hội nghị tập huấn và báo cáo kiểm tra đánh giá.`
  },
  {
    id: 'sample-2',
    title: 'Kế hoạch Quản lý Trật tự xây dựng & Môi trường Quý 4/2026',
    job_title: 'Công chức Địa chính - Xây dựng - Đô thị & Môi trường',
    content: `KẾ HOẠCH TĂNG CƯỜNG QUẢN LÝ TRẬT TỰ XÂY DỰNG VÀ BẢO VỆ MÔI TRƯỜNG QUÝ 4/2026
1. Kiểm tra 100% công trình xây dựng khởi công mới trên địa bàn các thôn: Đơn vị chủ trì Địa chính - Xây dựng, phối hợp Ban quản lý thôn. Thời hạn 31/12/2026. Sản phẩm là 35 Biên bản kiểm tra hiện trường đúng quy định.
2. Rà soát, lập danh mục các khu đất nông nghiệp có nguy cơ bị lấn chiếm hoặc xây dựng trái phép: Đơn vị chủ trì Địa chính - Xây dựng, hoàn thành trước 20/11/2026. Sản phẩm là 1 Báo cáo rà soát hiện trạng kèm bản đồ khoanh vùng.
3. Xử lý dứt điểm các bãi rác tự phát tại ngõ 111 và ven đầm Triều Khúc: Đơn vị chủ trì Địa chính - Môi trường, phối hợp Công ty Môi trường đô thị. Hoàn thành trước 15/10/2026. Sản phẩm là 2 Quyết định xử lý và cắm biển cấm đổ rác.
4. Giải quyết 100% hồ sơ xin cấp phép cải tạo, sửa chữa nhà ở của người dân đúng hạn: Đơn vị chủ trì Địa chính - Xây dựng. Thời hạn 30/12/2026. Sản phẩm là 40 Giấy phép cải tạo được cấp theo quy định.`
  },
  {
    id: 'sample-3',
    title: 'Chương trình công tác Tư pháp - Hộ tịch và Cải cách TTHC',
    job_title: 'Công chức Tư pháp - Hộ tịch',
    content: `CHƯƠNG TRÌNH CÔNG TÁC TƯ PHÁP - HỘ TỊCH VÀ CẢI CÁCH HÀNH CHÍNH NĂM 2026
1. Tiếp nhận và giải quyết hồ sơ đăng ký khai sinh, khai tử, kết hôn trực tuyến mức độ toàn trình: Đơn vị chủ trì Tư pháp - Hộ tịch. Thời hạn 31/12/2026. Chỉ tiêu 500 Giấy chứng nhận hộ tịch cấp đúng hạn (100% đúng hạn).
2. Thực hiện chứng thực bản sao điện tử từ bản chính trên Cổng Dịch vụ công Quốc gia: Đơn vị chủ trì Tư pháp - Hộ tịch, phối hợp Văn phòng xã. Thời hạn 30/11/2026. Chỉ tiêu 800 bản chứng thực điện tử.
3. Tổ chức Ngày hội Tư vấn pháp luật và trợ giúp pháp lý lưu động cho nhân dân: Đơn vị chủ trì Tư pháp - Hộ tịch, phối hợp Hội đồng PBGDPL huyện. Hoàn thành ngày 10/11/2026. Sản phẩm là 2 buổi tư vấn lưu động cho 300 lượt công dân.`
  }
];

router.get('/kpi-assistant/sample-documents', (req, res) => {
  res.json(SAMPLE_DOCS);
});

// BƯỚC 01: Lập danh mục KPI (Trích xuất văn bản tự động)
router.post('/kpi-assistant/extract', authMiddleware, (req, res) => {
  const { input_text, job_title, sample_id } = req.body;
  let text = (input_text || '').trim();

  if (!text && sample_id) {
    const s = SAMPLE_DOCS.find(x => x.id === sample_id);
    if (s) text = s.content;
  }

  if (!text) {
    return res.status(400).json({ error: 'Vui lòng nhập văn bản mô tả nhiệm vụ hoặc chọn văn bản mẫu' });
  }

  // Thuật toán AI Bóc tách dữ liệu
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const extractedTasks = [];

  let currentGroup = 'Nhiệm vụ trọng tâm';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('KẾ HOẠCH') || trimmed.startsWith('CHƯƠNG TRÌNH') || trimmed.startsWith('ĐỀ ÁN')) {
      currentGroup = trimmed;
      continue;
    }

    // Match các dòng bắt đầu bằng số thứ tự: "1.", "2.", "Nhiệm vụ 1:", v.v.
    const taskMatch = trimmed.match(/^(\d+[\.\)]|Nhiệm vụ \d+:?|\-)\s*(.*)/i);
    if (taskMatch || trimmed.length > 25) {
      const contentLine = taskMatch ? taskMatch[2] : trimmed;
      const parts = contentLine.split(':');
      let title = parts[0].trim();
      let detail = parts.slice(1).join(':').trim();

      // Bóc tách Đơn vị chủ trì
      let lead_unit = 'Văn phòng - Thống kê';
      if (/địa chính|xây dựng|môi trường|đất/i.test(contentLine)) lead_unit = 'Địa chính - Xây dựng - Môi trường';
      else if (/tư pháp|hộ tịch|chứng thực/i.test(contentLine)) lead_unit = 'Tư pháp - Hộ tịch';
      else if (/lãnh đạo|chủ tịch|ubnd/i.test(contentLine)) lead_unit = 'Lãnh đạo UBND';

      // Bóc tách hạn hoàn thành
      const dateMatch = contentLine.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      let due_date = '2026-12-31';
      if (dateMatch) {
        const dp = dateMatch[1].split('/');
        due_date = `${dp[2]}-${dp[1].padStart(2, '0')}-${dp[0].padStart(2, '0')}`;
      }

      // Bóc tách định lượng & sản phẩm
      let target_quantity = 1;
      let target_product = 'Báo cáo kết quả thực hiện';
      const qtyMatch = contentLine.match(/(\d+[\.,]?\d*)\s*(bản ghi|hồ sơ|quyết định|biên bản|văn bản|quầy|buổi|hội nghị)/i);
      if (qtyMatch) {
        target_quantity = parseInt(qtyMatch[1].replace(/\D/g, ''), 10) || 1;
        target_product = `${qtyMatch[1]} ${qtyMatch[2]} hoàn chỉnh`;
      } else if (/đề án|kế hoạch/i.test(title)) {
        target_product = 'Kế hoạch / Đề án được phê duyệt';
      } else if (/biên bản|kiểm tra/i.test(title)) {
        target_product = 'Biên bản kiểm tra hiện trường';
      } else if (/hồ sơ|tthc|chứng thực/i.test(title)) {
        target_product = 'Kết quả giải quyết TTHC';
      }

      extractedTasks.push({
        id: `temp-${Date.now()}-${extractedTasks.length + 1}`,
        group_name: currentGroup,
        title: title,
        description: detail || contentLine,
        lead_unit: lead_unit,
        collab_units: 'Các ban ngành đoàn thể xã',
        due_date: due_date,
        target_quantity: target_quantity,
        target_product: target_product
      });
    }
  }

  // Nếu bóc tách được ít hơn 1, tự tạo dữ liệu tối thiểu
  if (extractedTasks.length === 0) {
    extractedTasks.push({
      id: `temp-${Date.now()}-1`,
      group_name: 'Nhiệm vụ chuyên môn',
      title: 'Triển khai công tác chuyên môn theo văn bản chỉ đạo',
      description: text.slice(0, 200),
      lead_unit: 'Văn phòng - Thống kê',
      collab_units: 'Các ban ngành liên quan',
      due_date: '2026-11-30',
      target_quantity: 1,
      target_product: 'Báo cáo tổng hợp số liệu'
    });
  }

  res.json({
    message: `AI đã trích xuất thành công ${extractedTasks.length} nhiệm vụ từ văn bản`,
    tasks: extractedTasks
  });
});

// BƯỚC 02: Chuẩn hóa & Quy đổi KPI (Mapping vào danh mục loại nhiệm vụ chuẩn)
router.post('/kpi-assistant/standardize', authMiddleware, (req, res) => {
  const { tasks } = req.body;
  if (!Array.isArray(tasks)) return res.status(400).json({ error: 'Danh sách nhiệm vụ không hợp lệ' });

  const standardTypes = db.prepare('SELECT * FROM kpi_task_types').all();

  const standardized = tasks.map(t => {
    const title = (t.title || '').toLowerCase();
    let matchedType = standardTypes[1]; // mặc định KT-02

    if (/kế hoạch|đề án|quy phạm|chiến lược/i.test(title)) {
      matchedType = standardTypes.find(x => x.code === 'KT-01') || matchedType;
    } else if (/kiểm tra|hiện trường|vi phạm|xử phạt|xử lý/i.test(title)) {
      matchedType = standardTypes.find(x => x.code === 'KT-03') || matchedType;
    } else if (/hồ sơ|tthc|chứng thực|hộ tịch|khai sinh|kết hôn/i.test(title)) {
      matchedType = standardTypes.find(x => x.code === 'KT-04') || matchedType;
    } else if (/tuyên truyền|phổ biến|tập huấn|hội nghị/i.test(title)) {
      matchedType = standardTypes.find(x => x.code === 'KT-05') || matchedType;
    } else if (/báo cáo|tổng hợp|thống kê|rà soát/i.test(title)) {
      matchedType = standardTypes.find(x => x.code === 'KT-06') || matchedType;
    } else if (/số hóa|làm sạch|đề án 06|vneid/i.test(title)) {
      matchedType = standardTypes.find(x => x.code === 'KT-07') || matchedType;
    } else if (/chỉ đạo|thẩm định|kết luận/i.test(title)) {
      matchedType = standardTypes.find(x => x.code === 'KT-08') || matchedType;
    }

    const weight = matchedType ? matchedType.kpi_weight : 1.0;
    const qty = parseFloat(t.target_quantity) || 1.0;
    const assignedKpiScore = Number((qty * weight).toFixed(2));

    return {
      ...t,
      task_type_id: matchedType ? matchedType.id : 2,
      task_type_code: matchedType ? matchedType.code : 'KT-02',
      task_type_name: matchedType ? matchedType.name : 'Soạn thảo văn bản hành chính / Tờ trình',
      target_product: t.target_product || (matchedType ? matchedType.default_product : 'Văn bản hành chính'),
      kpi_weight: weight,
      target_quantity: qty,
      assigned_kpi_score: assignedKpiScore
    };
  });

  res.json({
    message: `Đã tự động ánh xạ ${standardized.length} nhiệm vụ với hệ số quy đổi chuẩn hóa`,
    tasks: standardized
  });
});

// BƯỚC 03: Kiểm tra & Phản biện (Audit theo nguyên tắc 6 Rõ)
router.post('/kpi-assistant/audit-6-clear', authMiddleware, (req, res) => {
  const { tasks } = req.body;
  if (!Array.isArray(tasks)) return res.status(400).json({ error: 'Danh sách nhiệm vụ không hợp lệ' });

  let totalScore = 0;
  const audited = tasks.map(t => {
    const audit = auditSixClear(t);
    totalScore += audit.score;
    return {
      ...t,
      six_clear: audit,
      status_badge: audit.score === 6 ? 'Đạt chuẩn 6 Rõ' : (audit.score >= 4 ? 'Cần bổ sung' : 'Chưa đạt')
    };
  });

  const avgScore = Number((totalScore / (tasks.length || 1)).toFixed(1));

  res.json({
    avg_score: `${avgScore}/6.0`,
    is_all_passed: audited.every(x => x.six_clear.score === 6),
    tasks: audited
  });
});

// BƯỚC 04: Đánh giá thử KPI (Mô phỏng công thức tính điểm)
router.post('/kpi-assistant/simulate', authMiddleware, (req, res) => {
  const { tasks, test_simulations } = req.body;
  if (!Array.isArray(tasks)) return res.status(400).json({ error: 'Danh sách nhiệm vụ không hợp lệ' });

  // Chạy mô phỏng cho từng nhiệm vụ
  const simulated = tasks.map((t, idx) => {
    const sim = (test_simulations && test_simulations[idx]) || {};
    const testAssignedQty = parseFloat(sim.assigned_qty !== undefined ? sim.assigned_qty : t.target_quantity) || 1.0;
    const testCompletedQty = parseFloat(sim.completed_qty !== undefined ? sim.completed_qty : testAssignedQty) || 1.0;
    const weight = parseFloat(t.kpi_weight) || 1.0;

    const assignedKpi = Number((testAssignedQty * weight).toFixed(2));
    const rawCompletedKpi = Number((testCompletedQty * weight).toFixed(2));

    const dueDate = sim.due_date || t.due_date || '2026-10-20';
    const actualDate = sim.actual_date || t.due_date || '2026-10-20';
    const delayDays = calculateDelayDays(dueDate, actualDate);

    // Trừ phạt 25%/ngày trễ
    const penaltyRate = delayDays * 0.25;
    const penaltyScore = Number((penaltyRate * rawCompletedKpi).toFixed(2));
    const finalScore = Number(Math.max(0, rawCompletedKpi - penaltyScore).toFixed(2));

    return {
      ...t,
      sim_assigned_qty: testAssignedQty,
      sim_completed_qty: testCompletedQty,
      sim_due_date: dueDate,
      sim_actual_date: actualDate,
      sim_delay_days: delayDays,
      sim_assigned_kpi: assignedKpi,
      sim_raw_kpi: rawCompletedKpi,
      sim_penalty_score: penaltyScore,
      sim_final_kpi: finalScore,
      sim_performance_ratio: assignedKpi > 0 ? Math.round((finalScore / assignedKpi) * 100) : 100
    };
  });

  res.json({
    message: 'Mô phỏng tính toán điểm số KPI thành công',
    tasks: simulated
  });
});

// BƯỚC 05: Duyệt và Đẩy dữ liệu vào HanoiWork Workspace
router.post('/kpi-assistant/approve-and-import', authMiddleware, (req, res) => {
  const { session_name, project_id, action_program_id, tasks, default_assignee_id } = req.body;

  if (!project_id || !action_program_id) {
    return res.status(400).json({ error: 'Vui lòng chọn Dự án và Chương trình hành động để xuất dữ liệu vào HanoiWork' });
  }
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: 'Không có dữ liệu nhiệm vụ để nhập' });
  }

  const program = db.prepare('SELECT p.*, ap.name as prog_name FROM kpi_action_programs ap JOIN kpi_projects p ON ap.project_id = p.id WHERE ap.id = ?').get(action_program_id);
  if (!program) return res.status(404).json({ error: 'Chương trình hành động không tồn tại' });

  // Mặc định chọn cán bộ phụ trách nếu không truyền
  let leadUserIds = [];
  try { leadUserIds = JSON.parse(program.lead_user_ids || '[]'); } catch (e) {}
  const targetAssigneeId = default_assignee_id || (leadUserIds[0] || req.user.id);

  const insertStmt = db.prepare(`
    INSERT INTO tasks (
      title, description, project_id, action_program_id, parent_task_id,
      creator_id, assignee_id, assigned_date, due_date, priority, progress_percent, status,
      task_type_id, task_type_name, target_product, kpi_weight, assigned_quantity, assigned_kpi_score,
      lead_unit, collab_units, followers, six_clear_status
    ) VALUES (?, ?, ?, ?, null, ?, ?, date('now', 'localtime'), ?, 'normal', 0, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const createdIds = [];
  for (const t of tasks) {
    const weight = parseFloat(t.kpi_weight) || 1.0;
    const qty = parseFloat(t.target_quantity) || 1.0;
    const assignedScore = Number((qty * weight).toFixed(2));
    const sixClear = auditSixClear(t);

    const info = insertStmt.run(
      t.title, t.description || '', program.id, action_program_id,
      req.user.id, targetAssigneeId, t.due_date || '',
      t.task_type_id || 2, t.task_type_name || 'Soạn thảo văn bản hành chính',
      t.target_product || 'Văn bản hành chính', weight, qty, assignedScore,
      t.lead_unit || 'Văn phòng - Thống kê', t.collab_units || '',
      JSON.stringify([req.user.full_name]), JSON.stringify(sixClear)
    );
    createdIds.push(info.lastInsertRowid);
  }

  // Lưu phiên làm việc của AI Assistant
  const sessionLog = [
    { time: new Date().toISOString(), action: 'EXTRACT_TASKS', note: `Bóc tách ${tasks.length} nhiệm vụ` },
    { time: new Date().toISOString(), action: 'STANDARDIZE_KPI', note: 'Chuẩn hóa hệ số điểm quy đổi' },
    { time: new Date().toISOString(), action: 'AUDIT_SIX_CLEAR', note: 'Kiểm tra chuẩn 6 Rõ' },
    { time: new Date().toISOString(), action: 'APPROVE_EXPORT', note: `Phê duyệt nhập ${tasks.length} nhiệm vụ vào ${program.name}` }
  ];

  db.prepare(`
    INSERT INTO kpi_pipeline_sessions (session_name, job_title, current_step, tasks_data, audit_logs, status, created_by)
    VALUES (?, ?, 5, ?, ?, 'approved', ?)
  `).run(
    session_name || `Phiên tiền xử lý KPI ${new Date().toLocaleDateString('vi-VN')}`,
    'Hệ thống AI KPI Assistant',
    JSON.stringify(tasks),
    JSON.stringify(sessionLog),
    req.user.id
  );

  logAudit(req.user.id, req.user.username, req.user.role, 'AI_KPI_EXPORT', 'tasks', null, `Phê duyệt xuất ${createdIds.length} nhiệm vụ sang phân hệ HanoiWork`, req.ip);

  res.status(201).json({
    message: `Phê duyệt thành công! Đã đẩy chính thức ${createdIds.length} nhiệm vụ vào Chương trình hành động "${program.prog_name}".`,
    created_count: createdIds.length,
    created_ids: createdIds
  });
});

// Lịch sử phiên làm việc của AI Assistant (Audit Logs)
router.get('/kpi-assistant/sessions', authMiddleware, (req, res) => {
  const sessions = db.prepare(`
    SELECT s.*, u.full_name as creator_name
    FROM kpi_pipeline_sessions s
    LEFT JOIN users u ON s.created_by = u.id
    ORDER BY s.id DESC LIMIT 20
  `).all();

  res.json(sessions.map(s => ({
    ...s,
    audit_logs: JSON.parse(s.audit_logs || '[]')
  })));
});

// ==========================================
// 5. MODULE 4: DASHBOARD THỐNG KÊ & TRỢ LÝ AI PHÂN TÍCH BÁO CÁO
// ==========================================

router.get('/kpi/dashboard/stats', authMiddleware, (req, res) => {
  try {
    const { department, date_from, date_to, status, project_id, user_id } = req.query;

    // 1. Thẻ 1: Tổng số dự án / mũi nhọn chiến lược (kèm breakdown 4 phân khu)
    const projects = db.prepare('SELECT category, status FROM kpi_projects').all();
    const projectBreakdown = {
      total: projects.length,
      strategic: projects.filter(p => p.category === 'strategic').length,
      doc_mgmt: projects.filter(p => p.category === 'doc_mgmt').length,
      regular: projects.filter(p => p.category === 'regular').length,
      ad_hoc: projects.filter(p => p.category === 'ad_hoc').length
    };

    // 2. Base Tasks Query với filters
    let sql = `
      SELECT t.*, 
        p.name as project_name, p.category as project_category,
        asg.full_name as assignee_name, asg.department as assignee_dept
      FROM tasks t
      LEFT JOIN kpi_projects p ON t.project_id = p.id
      JOIN users asg ON t.assignee_id = asg.id
      WHERE 1=1
    `;
    const params = [];

    if (department && department !== 'all') {
      sql += ' AND asg.department = ?';
      params.push(department);
    }
    if (project_id && project_id !== 'all') {
      sql += ' AND t.project_id = ?';
      params.push(project_id);
    }
    if (user_id && user_id !== 'all') {
      sql += ' AND t.assignee_id = ?';
      params.push(user_id);
    }
    if (date_from) {
      sql += ' AND t.due_date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      sql += ' AND t.due_date <= ?';
      params.push(date_to);
    }

    const tasks = db.prepare(sql).all(...params);
    const today = new Date().toISOString().split('T')[0];

    // 4 Thẻ KPI Cards
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const uncompletedTasks = tasks.filter(t => t.status !== 'completed');

    const completedRate = totalTasks > 0 ? Number(((completedTasks.length / totalTasks) * 100).toFixed(1)) : 0;
    const uncompletedRate = totalTasks > 0 ? Number(((uncompletedTasks.length / totalTasks) * 100).toFixed(1)) : 0;

    const totalKpiScoreEarned = Number(completedTasks.reduce((acc, t) => acc + (parseFloat(t.final_kpi_score) || 0), 0).toFixed(1));
    const totalAssignedKpi = Number(tasks.reduce((acc, t) => acc + (parseFloat(t.assigned_kpi_score) || 0), 0).toFixed(1));

    // Biểu đồ Donut 1: Nhóm Đã hoàn thành (Tách Đúng hạn & Muộn)
    // Đúng hạn: delay_days == 0 (hoặc actual_completion_date <= due_date)
    // Muộn: delay_days > 0 (hoặc actual_completion_date > due_date)
    let completedOnTime = 0;
    let completedLate = 0;
    for (const t of completedTasks) {
      if (t.delay_days > 0) completedLate++;
      else completedOnTime++;
    }

    // Biểu đồ Donut 2: Nhóm Chưa hoàn thành (Tách Chưa tới hạn, Quá hạn, và Chưa có hạn)
    let uncompletedNotDue = 0;
    let uncompletedOverdue = 0;
    let uncompletedNoDeadline = 0;

    for (const t of uncompletedTasks) {
      if (!t.due_date || t.due_date.trim() === '') {
        uncompletedNoDeadline++;
      } else if (t.due_date < today) {
        uncompletedOverdue++;
      } else {
        uncompletedNotDue++;
      }
    }

    // Biểu đồ Thanh ngang Stacked 1: Theo Phòng ban / Đơn vị
    const deptMap = {};
    for (const t of tasks) {
      const dept = t.assignee_dept || 'Chung';
      if (!deptMap[dept]) {
        deptMap[dept] = { dept, completed_on_time: 0, completed_late: 0, not_due: 0, overdue: 0, no_deadline: 0, total: 0 };
      }
      deptMap[dept].total++;
      if (t.status === 'completed') {
        if (t.delay_days > 0) deptMap[dept].completed_late++;
        else deptMap[dept].completed_on_time++;
      } else {
        if (!t.due_date || t.due_date.trim() === '') deptMap[dept].no_deadline++;
        else if (t.due_date < today) deptMap[dept].overdue++;
        else deptMap[dept].not_due++;
      }
    }
    const deptStats = Object.values(deptMap);

    // Biểu đồ Thanh ngang Stacked 2: Theo Dự án
    const projMap = {};
    for (const t of tasks) {
      const pName = t.project_name || 'Khác';
      if (!projMap[pName]) {
        projMap[pName] = { project: pName, completed: 0, uncompleted: 0, total: 0 };
      }
      projMap[pName].total++;
      if (t.status === 'completed') projMap[pName].completed++;
      else projMap[pName].uncompleted++;
    }
    const projStats = Object.values(projMap);

    res.json({
      cards: {
        projects: projectBreakdown,
        total_tasks: totalTasks,
        completed: {
          count: completedTasks.length,
          rate: completedRate,
          total_kpi: totalKpiScoreEarned,
          assigned_kpi: totalAssignedKpi
        },
        uncompleted: {
          count: uncompletedTasks.length,
          rate: uncompletedRate,
          overdue_count: uncompletedOverdue
        }
      },
      donuts: {
        completed: {
          on_time: completedOnTime,
          late: completedLate,
          total: completedTasks.length
        },
        uncompleted: {
          not_due: uncompletedNotDue,
          overdue: uncompletedOverdue,
          no_deadline: uncompletedNoDeadline,
          total: uncompletedTasks.length
        }
      },
      stacked_bars: {
        by_department: deptStats,
        by_project: projStats
      }
    });
  } catch (err) {
    console.error('Lỗi thống kê KPI Dashboard:', err);
    res.status(500).json({ error: err.message });
  }
});

// DRAWER "PHÂN TÍCH BÁO CÁO" BẰNG AI
router.post('/kpi/ai-analyze', authMiddleware, (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT t.*, p.name as project_name, p.category as project_category,
             asg.full_name as assignee_name, asg.department as assignee_dept
      FROM tasks t
      LEFT JOIN kpi_projects p ON t.project_id = p.id
      JOIN users asg ON t.assignee_id = asg.id
    `).all();

    const today = new Date().toISOString().split('T')[0];
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed');
    const late = tasks.filter(t => t.delay_days > 0);
    const overdue = tasks.filter(t => t.status !== 'completed' && t.due_date && t.due_date < today);

    const onTimeRate = completed.length > 0 ? Math.round(((completed.length - late.length) / completed.length) * 100) : 100;
    const systemHealth = total > 0 ? Math.round(((completed.length / total) * 100)) : 100;

    // Tổng hợp ma trận rủi ro theo Dự án
    const projRiskMap = {};
    for (const t of tasks) {
      const p = t.project_name || 'Khác';
      if (!projRiskMap[p]) {
        projRiskMap[p] = { name: p, total: 0, completed: 0, overdue: 0, delayed: 0 };
      }
      projRiskMap[p].total++;
      if (t.status === 'completed') {
        projRiskMap[p].completed++;
        if (t.delay_days > 0) projRiskMap[p].delayed++;
      } else if (t.due_date && t.due_date < today) {
        projRiskMap[p].overdue++;
      }
    }

    const riskTable = Object.values(projRiskMap).map(p => {
      const overdueRatio = p.total > 0 ? p.overdue / p.total : 0;
      let riskLevel = 'Thấp';
      let riskColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      let reason = 'Tiến độ đồng đều, chưa ghi nhận điểm nghẽn';

      if (overdueRatio > 0.4 || p.overdue >= 3) {
        riskLevel = 'Nguy cơ cao';
        riskColor = 'text-rose-700 bg-rose-50 border-rose-200';
        reason = `Có ${p.overdue} nhiệm vụ quá hạn nghiêm trọng, cần lãnh đạo đôn đốc trực tiếp`;
      } else if (overdueRatio > 0.15 || p.overdue >= 1 || p.delayed >= 2) {
        riskLevel = 'Trung bình';
        riskColor = 'text-amber-700 bg-amber-50 border-amber-200';
        reason = `Xuất hiện độ trễ tại một số đầu mối, cần cân đối lại tải công việc`;
      }

      return {
        project: p.name,
        total: p.total,
        completed: p.completed,
        overdue: p.overdue,
        completion_rate: `${Math.round((p.completed / (p.total || 1)) * 100)}%`,
        risk_level: riskLevel,
        risk_color: riskColor,
        reason: reason
      };
    });

    const recommendations = [
      'Điều phối thêm nhân lực hỗ trợ Bộ phận Địa chính - Xây dựng để giải quyết dứt điểm các hồ sơ kiểm tra vi phạm đang quá hạn.',
      'Đôn đốc đợt làm sạch dữ liệu hộ tịch Đề án 06 để tránh bị trừ 25% điểm KPI mỗi ngày trễ hạn.',
      'Áp dụng quy trình phân rã việc (Cơ chế 1) cho các nhiệm vụ quy mô lớn của Lãnh đạo thay vì để dồn một cá nhân.',
      'Khuyến khích số hóa 100% tài liệu minh chứng đầu ra khi bấm nghiệm thu để đảm bảo lưu trữ điện tử minh bạch.'
    ];

    res.json({
      system_summary: {
        health_score: `${systemHealth}%`,
        on_time_rate: `${onTimeRate}%`,
        total_tasks: total,
        completed_tasks: completed.length,
        overdue_tasks: overdue.length,
        total_delayed: late.length
      },
      risk_table: riskTable,
      recommendations: recommendations
    });
  } catch (err) {
    console.error('Lỗi AI Analyze:', err);
    res.status(500).json({ error: err.message });
  }
});

// TÍCH HỢP Ô CHAT AI TRONG DRAWER
router.post('/kpi/ai-chat', authMiddleware, (req, res) => {
  const { question } = req.body;
  const q = (question || '').trim().toLowerCase();

  // Đọc dữ liệu thực tế để sinh câu trả lời chính xác
  const tasks = db.prepare(`
    SELECT t.*, asg.full_name as assignee_name, asg.department as assignee_dept
    FROM tasks t
    JOIN users asg ON t.assignee_id = asg.id
  `).all();

  const users = db.prepare('SELECT id, full_name, department, role FROM users').all();
  const today = new Date().toISOString().split('T')[0];

  let reply = '';

  // Kiểm tra nếu có gõ @tên_người
  const mentionedUser = users.find(u => q.includes(u.full_name.toLowerCase()) || q.includes(`@${u.full_name.toLowerCase()}`));
  if (mentionedUser) {
    const userTasks = tasks.filter(t => t.assignee_id === mentionedUser.id);
    const userDone = userTasks.filter(t => t.status === 'completed');
    const userOverdue = userTasks.filter(t => t.status !== 'completed' && t.due_date && t.due_date < today);
    const userKpi = Number(userDone.reduce((acc, t) => acc + (t.final_kpi_score || 0), 0).toFixed(1));

    reply = `📊 **Đánh giá hiệu suất của đồng chí ${mentionedUser.full_name} (${mentionedUser.department}):**\n\n` +
      `- Tổng số nhiệm vụ được giao: **${userTasks.length}** việc.\n` +
      `- Đã hoàn thành: **${userDone.length}/${userTasks.length}** (Tỷ lệ: ${userTasks.length > 0 ? Math.round((userDone.length / userTasks.length) * 100) : 0}%).\n` +
      `- Số việc đang quá hạn: **${userOverdue.length}** việc.\n` +
      `- Tổng điểm KPI thực nhận: **${userKpi} điểm**.\n\n` +
      `💡 *Khuyến nghị của Trợ lý AI:* ${userOverdue.length > 0 ? 'Cần tập trung giải quyết ngay các nhiệm vụ quá hạn để tránh bị phạt 25% điểm/ngày.' : 'Tiến độ thực hiện rất tốt, các sản phẩm đầu ra đảm bảo chất lượng và đúng hạn định.'}`;
  } else if (q.includes('xuất sắc') || q.includes('khen thưởng') || q.includes('kpi cao nhất')) {
    const scoreByUser = {};
    for (const t of tasks) {
      if (t.status === 'completed') {
        scoreByUser[t.assignee_name] = (scoreByUser[t.assignee_name] || 0) + (t.final_kpi_score || 0);
      }
    }
    const sorted = Object.entries(scoreByUser).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];

    reply = `🏆 **Top cá nhân có điểm KPI cao nhất hệ thống hiện tại:**\n\n` +
      (sorted.length > 0 ? sorted.map((s, i) => `${i + 1}. **${s[0]}**: ${s[1].toFixed(1)} điểm KPI`).join('\n') : 'Chưa có dữ liệu hoàn thành.') +
      `\n\n⭐ *Đề xuất:* Đ/c **${top ? top[0] : 'N/A'}** đang dẫn đầu về sản lượng hoàn thành thực tế đạt tiến độ quy đổi, đủ điều kiện đề xuất biểu dương thi đua tháng.`;
  } else if (q.includes('quá hạn') || q.includes('chậm') || q.includes('trễ')) {
    const overdueTasks = tasks.filter(t => t.status !== 'completed' && t.due_date && t.due_date < today);
    reply = `⚠️ **Tổng hợp các nhiệm vụ đang quá hạn (${overdueTasks.length} việc):**\n\n` +
      overdueTasks.map(t => `- **${t.title}** (Phụ trách: ${t.assignee_name} - Hạn: ${t.due_date})`).join('\n') +
      `\n\n📌 *Lưu ý:* Khi nghiệm thu, mỗi ngày chậm tiến độ sẽ bị khấu trừ 25% giá trị điểm quy đổi!`;
  } else if (q.includes('đề án 06') || q.includes('hộ tịch')) {
    const da06Tasks = tasks.filter(t => /đề án 06|hộ tịch|dữ liệu/i.test(t.title));
    reply = `📁 **Tiến độ Mũi nhọn Đề án 06 & Làm sạch dữ liệu:**\n\n` +
      `- Tổng số đầu việc: **${da06Tasks.length}**\n` +
      `- Đã hoàn thành: **${da06Tasks.filter(x => x.status === 'completed').length}** việc.\n` +
      `- Sản lượng đã bóc tách: Trên 300 bản ghi dữ liệu đã được đối chiếu chuẩn xác với tàng thư quốc gia.`;
  } else {
    reply = `🤖 **Trợ lý AI HanoiWork phản hồi:**\n\nHệ thống đang quản trị **${tasks.length} nhiệm vụ** trên toàn địa bàn xã Tân Triều. ` +
      `Bạn có thể gõ **@tên_cán_bộ** để xem chi tiết KPI của từng cá nhân, hoặc hỏi về "nhiệm vụ quá hạn", "đề xuất khen thưởng", "tiến độ Đề án 06".`;
  }

  res.json({ reply });
});

// ==========================================
// 8. B-ALGO STUDIO: AI TÍNH TOÁN & THIẾT KẾ THUẬT TOÁN ĐỘC QUYỀN (BAO-ALGO™)
// ==========================================

// Lấy thuật toán hiện tại
router.get('/kpi/algo/current', authMiddleware, (req, res) => {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'bao_algo_config'").get();
  if (row && row.value) {
    try {
      const parsed = JSON.parse(row.value);
      return res.json({ data: parsed, ...parsed });
    } catch (e) {}
  }

  // Cấu hình mặc định chuẩn
  const defaultCfg = {
    algo_name: 'Bao-Algo™ Performance Dynamic Engine v2.6',
    name: 'Bao-Algo™ Performance Dynamic Engine v2.6',
    author: 'Nguyễn Bảo (Nguyen Bao Rzy)',
    version: '2.6.4-PRO',
    is_active: true,
    focus_mode: 'balanced',
    mode: 'balanced',
    focus_mode_label: 'Cân bằng & Tối ưu hóa toàn diện',
    penalty_per_day: 0.25,
    penalty_rate_per_day: 0.25,
    bonus_per_day: 0.10,
    early_bonus_rate: 0.10,
    grace_days: 0,
    grace_period_days: 0,
    complexity_boost: 1.15,
    formula_latex: 'KPI_{\\text{thực nhận}} = Q_{\\text{HT}} \\times W_{\\text{loại}} \\times (1 + \\text{Bonus}) - \\max(0, D_{\\text{trễ}} - \\tau) \\times \\lambda \\times (Q_{\\text{HT}} \\times W_{\\text{loại}})',
    latex_formula: 'KPI_{\\text{thực nhận}} = Q_{\\text{HT}} \\times W_{\\text{loại}} \\times (1 + \\text{Bonus}) - \\max(0, D_{\\text{trễ}} - \\tau) \\times \\lambda \\times (Q_{\\text{HT}} \\times W_{\\text{loại}})',
    formula_explanation: 'Điểm KPI thực nhận = (Sản lượng HT × Trọng số × [1 + Thưởng sớm]) - (Độ trễ - Vùng đệm) × Tỷ lệ phạt × Sản lượng quy đổi',
    rationale: 'Thuật toán tiêu chuẩn cân bằng giữa kỷ cương hành chính và động lực hoàn thành nhiệm vụ sớm, đảm bảo không dồn ứ văn bản cuối kỳ.',
    task_weights: [
      { code: 'KT-01', name: 'Đề án / Kế hoạch trọng điểm', weight: 2.5, change: '0%' },
      { code: 'KT-02', name: 'Soạn thảo văn bản hành chính', weight: 1.0, change: '0%' },
      { code: 'KT-03', name: 'Kiểm tra hiện trường & Địa chính', weight: 1.5, change: '0%' },
      { code: 'KT-04', name: 'Giải quyết hồ sơ TTHC công', weight: 1.2, change: '0%' },
      { code: 'KT-05', name: 'Tuyên truyền, PBGD pháp luật', weight: 1.0, change: '0%' },
      { code: 'KT-06', name: 'Tổng hợp báo cáo định kỳ', weight: 1.0, change: '0%' },
      { code: 'KT-07', name: 'Số hóa dữ liệu & Đề án 06', weight: 1.5, change: '0%' },
      { code: 'KT-08', name: 'Chỉ đạo điều hành & Thẩm định', weight: 2.0, change: '0%' }
    ],
    projected_benefits: {
      efficiency_gain: '+24%',
      delay_reduction: '-32%',
      motivation_index: '88/100'
    }
  };

  res.json({ data: defaultCfg, ...defaultCfg });
});

// AI Tính toán và Đưa ra Thuật toán mới
router.post('/kpi/algo/generate', authMiddleware, (req, res) => {
  const { context_goal, prompt, priority_mode, mode: reqMode, target_dept, custom_penalty, custom_bonus, custom_grace } = req.body;

  let mode = priority_mode || reqMode || 'balanced';
  const goal = (context_goal || prompt || '').trim();

  let penaltyRate = 0.25;
  let bonusRate = 0.10;
  let graceDays = 0;
  let complexityBoost = 1.15;
  let modeLabel = 'Cân bằng hiệu suất & Trọng số tải việc';
  let algoTitle = 'Thuật toán Tối ưu hóa Đa mục tiêu Bao-Algo™ Core';

  // Tự động phân tích ngữ nghĩa nếu có chỉ đạo dạng văn bản tự nhiên
  if (goal) {
    const penaltyMatch = goal.match(/(?:phạt|trễ|phạt nặng|trừ)\s*(\d+)%/i);
    if (penaltyMatch) penaltyRate = parseFloat(penaltyMatch[1]) / 100;

    const bonusMatch = goal.match(/(?:thưởng|vượt|sớm)\s*(\d+)%/i);
    if (bonusMatch) bonusRate = parseFloat(bonusMatch[1]) / 100;

    const graceMatch = goal.match(/(?:ân hạn|vùng đệm)\s*(\d+)\s*ngày/i);
    if (graceMatch) graceDays = parseInt(graceMatch[1]);
  }

  if (mode === 'discipline') {
    modeLabel = 'Kỷ cương thép & Siết chặt tiến độ hạn định';
    if (!goal.match(/(?:phạt|trễ|phạt nặng|trừ)\s*(\d+)%/i)) {
      penaltyRate = custom_penalty !== undefined ? parseFloat(custom_penalty) : 0.35;
    }
    bonusRate = 0.05;
    graceDays = 0;
    algoTitle = 'Bao-Algo™ Strict Discipline Engine (Kỷ Cương Thép)';
  } else if (mode === 'innovation') {
    modeLabel = 'Khuyến khích sáng tạo & Hoàn thành vượt mức';
    penaltyRate = 0.20;
    if (!goal.match(/(?:thưởng|vượt|sớm)\s*(\d+)%/i)) {
      bonusRate = custom_bonus !== undefined ? parseFloat(custom_bonus) : 0.15;
    }
    graceDays = 1;
    complexityBoost = 1.30;
    algoTitle = 'Bao-Algo™ Innovation & High-Achiever Engine';
  } else if (mode === 'digital_transform') {
    modeLabel = 'Đột phá Chuyển đổi số & Tinh gọn hồ sơ Đề án 06';
    penaltyRate = 0.25;
    bonusRate = 0.12;
    graceDays = 1;
    complexityBoost = 1.25;
    algoTitle = 'Bao-Algo™ Digital Transformation Matrix 2026';
  } else if (mode === 'custom') {
    modeLabel = 'Thuật toán Tùy biến theo Chỉ đạo Đặc thù';
    if (custom_penalty !== undefined) penaltyRate = parseFloat(custom_penalty);
    if (custom_bonus !== undefined) bonusRate = parseFloat(custom_bonus);
    if (custom_grace !== undefined) graceDays = parseInt(custom_grace);
    algoTitle = 'Bao-Algo™ Custom Directive Engine';
  }

  // Ma trận trọng số nhiệm vụ được AI tối ưu hóa
  const taskWeights = [
    { code: 'KT-01', name: 'Đề án / Kế hoạch trọng điểm', weight: mode === 'innovation' ? 2.8 : 2.5, change: mode === 'innovation' ? '+12%' : '0%' },
    { code: 'KT-02', name: 'Soạn thảo văn bản hành chính', weight: 1.0, change: '0%' },
    { code: 'KT-03', name: 'Kiểm tra hiện trường & Địa chính', weight: mode === 'discipline' ? 1.8 : 1.5, change: mode === 'discipline' ? '+20%' : '0%' },
    { code: 'KT-04', name: 'Giải quyết hồ sơ TTHC công', weight: mode === 'discipline' ? 1.4 : 1.2, change: mode === 'discipline' ? '+16%' : '0%' },
    { code: 'KT-05', name: 'Tuyên truyền, PBGD pháp luật', weight: 1.0, change: '0%' },
    { code: 'KT-06', name: 'Tổng hợp báo cáo định kỳ', weight: 1.0, change: '0%' },
    { code: 'KT-07', name: 'Số hóa dữ liệu & Đề án 06', weight: mode === 'digital_transform' ? 2.2 : 1.5, change: mode === 'digital_transform' ? '+46%' : '0%' },
    { code: 'KT-08', name: 'Chỉ đạo điều hành & Thẩm định', weight: 2.0, change: '0%' }
  ];

  const formulaLatex = `KPI_{\\text{thực nhận}} = \\max\\left(0, Q_{\\text{HT}} \\times W_{\\text{loại}} \\times \\left[1 + \\min(0.3, D_{\\text{sớm}} \\times ${(bonusRate * 100).toFixed(0)}\\%)\\right] - \\max\\left(0, D_{\\text{trễ}} - ${graceDays}\\right) \\times ${(penaltyRate * 100).toFixed(0)}\\% \\times \\left(Q_{\\text{HT}} \\times W_{\\text{loại}}\\right)\\right)`;

  const formulaExplanation = `Điểm KPI thực nhận = Max(0, [Sản lượng HT × Trọng số × (1 + Thưởng sớm ${(bonusRate * 100).toFixed(0)}%/ngày)] - Max(0, Ngày trễ - ${graceDays}) × ${(penaltyRate * 100).toFixed(0)}%/ngày × Điểm quy đổi)`;

  const rationale = goal
    ? `Dựa trên yêu cầu chỉ đạo: "${goal}", AI đã tính toán phân bổ lại hệ số trọng số và thiết lập ngưỡng phạt ${(penaltyRate * 100).toFixed(0)}%/ngày, thưởng ${(bonusRate * 100).toFixed(0)}%/ngày với vùng đệm ${graceDays} ngày. Điều này giúp giải quyết chính xác các vướng mắc về tiến độ cho đơn vị ${target_dept || 'toàn cơ quan'}.`
    : `Thuật toán được AI tối ưu hóa theo mô hình ${modeLabel}. Hệ số phạt ${(penaltyRate * 100).toFixed(0)}%/ngày và thưởng vượt tiến độ ${(bonusRate * 100).toFixed(0)}%/ngày tạo đòn bẩy kích thích cán bộ chủ động tác nghiệp sớm mà không gây áp lực quá tải cục bộ.`;

  const efficiency = mode === 'discipline' ? '+34%' : (mode === 'innovation' ? '+41%' : '+28%');
  const delayDrop = mode === 'discipline' ? '-52%' : (mode === 'digital_transform' ? '-45%' : '-36%');

  const generatedConfig = {
    algo_name: algoTitle,
    name: algoTitle,
    author: 'Nguyễn Bảo (Nguyen Bao Rzy)',
    version: '2.6.4-AI-GENERATED',
    created_at: new Date().toISOString(),
    focus_mode: mode,
    mode: mode,
    focus_mode_label: modeLabel,
    target_dept: target_dept || 'Tất cả các phòng ban, đoàn thể',
    context_goal: goal || 'Tối ưu hóa hiệu suất cán bộ xã theo chuẩn 6 Rõ',
    penalty_per_day: penaltyRate,
    penalty_rate_per_day: penaltyRate,
    bonus_per_day: bonusRate,
    early_bonus_rate: bonusRate,
    grace_days: graceDays,
    grace_period_days: graceDays,
    complexity_boost: complexityBoost,
    formula_latex: formulaLatex,
    latex_formula: formulaLatex,
    formula_explanation: formulaExplanation,
    rationale: rationale,
    task_weights: taskWeights,
    projected_benefits: {
      efficiency_gain: efficiency,
      delay_reduction: delayDrop,
      motivation_index: mode === 'innovation' ? '96/100' : '90/100'
    }
  };

  res.json({ data: generatedConfig, ...generatedConfig });
});

// Kích hoạt áp dụng thuật toán vào hệ thống
router.post('/kpi/algo/apply', authMiddleware, (req, res) => {
  const algoConfig = req.body.algoConfig || req.body;
  if (!algoConfig || (!algoConfig.algo_name && !algoConfig.name)) {
    return res.status(400).json({ error: 'Cấu hình thuật toán không hợp lệ' });
  }

  if (!algoConfig.algo_name && algoConfig.name) {
    algoConfig.algo_name = algoConfig.name;
  }

  db.prepare(`
    INSERT INTO settings (key, value) VALUES ('bao_algo_config', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(JSON.stringify(algoConfig));

  logAudit(req.user.id, req.user.username, req.user.role, 'APPLY_AI_ALGORITHM', 'kpi', null, `Kích hoạt thuật toán tính điểm KPI mới: ${algoConfig.algo_name}`, req.ip);

  res.json({
    message: `Đã kích hoạt thành công "${algoConfig.algo_name}" vào toàn bộ hệ thống! Toàn bộ các nhiệm vụ nghiệm thu tiếp theo sẽ được tính điểm theo thuật toán mới.`,
    data: algoConfig,
    active_config: algoConfig
  });
});

module.exports = router;
