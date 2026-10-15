const express = require('express');
const jwt = require('jsonwebtoken');
const { db, logAudit } = require('../database/db');

const newsRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ubnd_tan_trieu_secure_jwt_secret_2026';

// Middleware xác thực người dùng đăng nhập cho các thao tác quản trị tin tức
function staffAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Cần đăng nhập tài khoản cán bộ để thực hiện thao tác này' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, full_name, role, department FROM users WHERE id = ?').get(decoded.id);
    if (!user || user.role === 'citizen') {
      return res.status(403).json({ error: 'Chỉ cán bộ và lãnh đạo UBND xã mới có quyền đăng hoặc sửa bản tin' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Phiên làm việc không hợp lệ hoặc đã hết hạn' });
  }
}

/**
 * 1. Danh sách bản tin & thông báo xã
 * GET /api/news?category=...&search=...&limit=...
 */
newsRouter.get('/', (req, res) => {
  const { category, search, limit = 20, offset = 0 } = req.query;

  let query = 'SELECT * FROM commune_news WHERE is_published = 1';
  const params = [];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search && search.trim()) {
    query += ' AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY is_featured DESC, id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const news = db.prepare(query).all(...params);

  // Thống kê số lượng theo từng danh mục
  const catStats = db.prepare(`
    SELECT category, COUNT(*) as count 
    FROM commune_news 
    WHERE is_published = 1 
    GROUP BY category
  `).all();

  const total = db.prepare('SELECT COUNT(*) as count FROM commune_news WHERE is_published = 1').get().count;

  res.json({
    success: true,
    total,
    news,
    categories: [
      { key: 'all', label: 'Tất cả tin tức', count: total },
      { key: 'thong_bao', label: 'Thông báo UBND', count: (catStats.find(c => c.category === 'thong_bao') || {}).count || 0 },
      { key: 'chinh_sach', label: 'Chính sách mới', count: (catStats.find(c => c.category === 'chinh_sach') || {}).count || 0 },
      { key: 'an_ninh', label: 'An ninh trật tự', count: (catStats.find(c => c.category === 'an_ninh') || {}).count || 0 },
      { key: 'chuyen_doi_so', label: 'Đề án 06 & CĐS', count: (catStats.find(c => c.category === 'chuyen_doi_so') || {}).count || 0 },
      { key: 'hoat_dong', label: 'Hoạt động cộng đồng', count: (catStats.find(c => c.category === 'hoat_dong') || {}).count || 0 }
    ]
  });
});

/**
 * 2. Chi tiết bản tin & tự động tăng lượt xem
 * GET /api/news/:id
 */
newsRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const article = db.prepare('SELECT * FROM commune_news WHERE id = ?').get(id);

  if (!article) {
    return res.status(404).json({ error: 'Không tìm thấy bản tin này hoặc bài viết đã bị gỡ' });
  }

  // Tăng lượt xem
  try {
    db.prepare('UPDATE commune_news SET views_count = views_count + 1 WHERE id = ?').run(id);
    article.views_count += 1;
  } catch (e) {}

  // Lấy các bài viết liên quan
  const related = db.prepare(`
    SELECT id, title, summary, category, cover_image, created_at, views_count 
    FROM commune_news 
    WHERE id != ? AND is_published = 1 
    ORDER BY id DESC LIMIT 4
  `).all(id);

  res.json({
    success: true,
    article,
    related
  });
});

/**
 * 3. Đăng bản tin mới (Cán bộ / Lãnh đạo)
 * POST /api/news
 */
newsRouter.post('/', staffAuth, (req, res) => {
  const { title, summary, content, category, cover_image, is_featured } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập tiêu đề bản tin' });
  }
  if (!content || !String(content).trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập nội dung chi tiết bản tin' });
  }

  const validCat = ['thong_bao', 'chinh_sach', 'an_ninh', 'chuyen_doi_so', 'hoat_dong'].includes(category) 
    ? category 
    : 'thong_bao';

  const defaultCover = cover_image || 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80';
  const shortSummary = summary && summary.trim() ? summary.trim() : content.trim().substring(0, 160) + '...';

  const stmt = db.prepare(`
    INSERT INTO commune_news (title, summary, content, category, author_id, author_name, cover_image, is_published, is_featured, views_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 0)
  `);

  const info = stmt.run(
    title.trim(),
    shortSummary,
    content.trim(),
    validCat,
    req.user.id,
    `${req.user.full_name} (${req.user.department || 'UBND Xã'})`,
    defaultCover,
    is_featured ? 1 : 0
  );

  const newArticle = db.prepare('SELECT * FROM commune_news WHERE id = ?').get(info.lastInsertRowid);
  logAudit(req.user.id, req.user.username, req.user.role, 'CREATE_NEWS', 'commune_news', newArticle.id, `Đăng bài viết mới: ${newArticle.title}`, req.ip);

  res.status(201).json({
    success: true,
    message: 'Đăng tải bản tin lên cổng thông tin xã thành công!',
    article: newArticle
  });
});

/**
 * 4. Xóa bản tin (Chỉ Chủ tịch/Lãnh đạo hoặc Quản trị viên)
 * DELETE /api/news/:id
 */
newsRouter.delete('/:id', staffAuth, (req, res) => {
  const { id } = req.params;
  const article = db.prepare('SELECT * FROM commune_news WHERE id = ?').get(id);

  if (!article) {
    return res.status(404).json({ error: 'Bản tin không tồn tại' });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'leader') {
    return res.status(403).json({ error: 'Chỉ Lãnh đạo UBND hoặc Quản trị viên mới có quyền xóa bài đăng' });
  }

  db.prepare('DELETE FROM commune_news WHERE id = ?').run(id);
  logAudit(req.user.id, req.user.username, req.user.role, 'DELETE_NEWS', 'commune_news', id, `Xóa bài viết: ${article.title}`, req.ip);

  res.json({
    success: true,
    message: 'Đã xóa bản tin thành công!'
  });
});

module.exports = { newsRouter };
