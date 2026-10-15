const { db } = require('./db');
const bcrypt = require('bcryptjs');

function runSeed() {
  console.log('--- Bắt đầu nạp dữ liệu mẫu hành chính cho UBND Xã Tân Triều ---');

  // Xóa sạch dữ liệu cũ để nạp lại chuẩn
  const tables = [
    'commune_news', 'national_citizen_registry',
    'kpi_pipeline_sessions', 'task_comments', 'tasks', 'kpi_action_programs', 'kpi_folders', 'kpi_projects', 'kpi_task_types',
    'attachments', 'approval_history', 'service_ratings', 'app_ui_ratings', 'notifications', 'audit_logs',
    'doc_out', 'doc_in', 'online_requests', 'approval_workflows', 'users', 'settings'
  ];
  for (const table of tables) {
    try {
      db.prepare(`DELETE FROM ${table}`).run();
    } catch (e) {
      // bỏ qua nếu bảng chưa tồn tại
    }
  }

  // 1. Cài đặt hệ thống
  const settingsData = [
    ['unit_name', 'ỦY BAN NHÂN DÂN XÃ TÂN TRIỀU'],
    ['district', 'Huyện Thanh Trì'],
    ['province', 'Thành phố Hà Nội'],
    ['unit_code', 'TT'],
    ['hotline', '024 3861 1234'],
    ['email', 'ubnd.tantrieu@hanoi.gov.vn'],
    ['address', 'Số 54 Triều Khúc, Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội'],
    ['system_title', 'HỆ THỐNG ĐIỀU HÀNH CÔNG VĂN VÀ DỊCH VỤ TRỰC TUYẾN CẤP XÃ'],
    ['digital_sign_notice', 'Lưu ý pháp lý: Thao tác "Phê duyệt" trong hệ thống là bước kiểm duyệt điện tử nội bộ theo quy trình tác nghiệp. Khi phát hành văn bản chính thức gửi ra ngoài, đơn vị thực hiện ký số bằng Chứng thư số chuyên dùng công vụ theo Nghị định 30/2020/NĐ-CP của Chính phủ.'],
    ['doc_out_format', '{seq}/{year}/UBND-{dept}'],
    ['doc_in_format', '{seq}/{year}/ĐEN'],
    ['req_format', 'HS-{year}-{seq}'],
    ['is_demo_mode', '1']
  ];

  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of settingsData) {
    insertSetting.run(k, v);
  }

  // 2. Tài khoản người dùng (Mật khẩu băm an toàn)
  const defaultPass = bcrypt.hashSync('123456', 10);
  const adminPass = bcrypt.hashSync('admin123', 10);

  const usersData = [
    {
      id: 1,
      username: 'admin',
      password: adminPass,
      full_name: 'Nguyễn Văn Quản Trị',
      role: 'admin',
      department: 'Văn phòng - Thống kê',
      position: 'Quản trị viên CNTT',
      email: 'quantri.tantrieu@hanoi.gov.vn',
      phone: '0981112233',
      cccd: '001088000001',
      is_phone_verified: 1
    },
    {
      id: 2,
      username: 'chutich',
      password: defaultPass,
      full_name: 'Trần Đình Thắng',
      role: 'leader',
      department: 'Lãnh đạo UBND',
      position: 'Chủ tịch UBND xã',
      email: 'thang.td@hanoi.gov.vn',
      phone: '0912001122',
      cccd: '001075000002',
      is_phone_verified: 1
    },
    {
      id: 3,
      username: 'phochutich',
      password: defaultPass,
      full_name: 'Lê Thị Mai',
      role: 'leader',
      department: 'Lãnh đạo UBND',
      position: 'Phó Chủ tịch UBND xã (Phụ trách KT-ĐT)',
      email: 'mai.lt@hanoi.gov.vn',
      phone: '0913998877',
      cccd: '001182000003',
      is_phone_verified: 1
    },
    {
      id: 4,
      username: 'canbo_vp',
      password: defaultPass,
      full_name: 'Phạm Hùng Cường',
      role: 'officer',
      department: 'Văn phòng - Thống kê',
      position: 'Chuyên viên Văn thư - Lưu trữ & Tổng hợp',
      email: 'cuong.ph@hanoi.gov.vn',
      phone: '0977889900',
      cccd: '001090000004',
      is_phone_verified: 1
    },
    {
      id: 5,
      username: 'canbo_dc',
      password: defaultPass,
      full_name: 'Hoàng Minh Tuấn',
      role: 'officer',
      department: 'Địa chính - Xây dựng - Môi trường',
      position: 'Công chức Địa chính - Xây dựng - Đô thị & Môi trường',
      email: 'tuan.hm@hanoi.gov.vn',
      phone: '0988665544',
      cccd: '001089000005',
      is_phone_verified: 1
    },
    {
      id: 6,
      username: 'canbo_tp',
      password: defaultPass,
      full_name: 'Trần Thị Thu Hà',
      role: 'officer',
      department: 'Tư pháp - Hộ tịch',
      position: 'Công chức Tư pháp - Hộ tịch',
      email: 'ha.ttt@hanoi.gov.vn',
      phone: '0904123987',
      cccd: '001192000006',
      is_phone_verified: 1
    },
    {
      id: 7,
      username: 'nguoidan',
      password: defaultPass,
      full_name: 'Vũ Thị Lan',
      role: 'citizen',
      department: 'Người dân',
      position: 'Công dân',
      email: 'vuthilan.tt@gmail.com',
      phone: '0912345678',
      cccd: '001195000007',
      is_phone_verified: 1
    },
    {
      id: 8,
      username: 'nguyenvana',
      password: defaultPass,
      full_name: 'Nguyễn Văn An',
      role: 'citizen',
      department: 'Người dân',
      position: 'Công dân',
      email: 'an.nguyen@gmail.com',
      phone: '0988776655',
      cccd: '001098000008',
      is_phone_verified: 1
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password, full_name, role, department, position, email, phone, cccd, is_phone_verified)
    VALUES (@id, @username, @password, @full_name, @role, @department, @position, @email, @phone, @cccd, @is_phone_verified)
  `);
  for (const u of usersData) {
    insertUser.run(u);
  }

  // 3. Quy trình phê duyệt theo loại văn bản
  const workflowsData = [
    {
      doc_type: 'Quyết định',
      levels_count: 3,
      level_1_role: 'leader',
      level_1_title: 'Phó Chủ tịch thẩm định',
      level_2_role: 'leader',
      level_2_title: 'Chủ tịch ký phê duyệt',
      level_3_role: 'officer',
      level_3_title: 'Văn thư phát hành & đóng dấu',
      description: 'Quy trình chuẩn áp dụng cho Quyết định quy phạm và cá biệt của UBND xã'
    },
    {
      doc_type: 'Kế hoạch',
      levels_count: 2,
      level_1_role: 'leader',
      level_1_title: 'Lãnh đạo UBND phụ trách duyệt',
      level_2_role: 'officer',
      level_2_title: 'Văn thư vào sổ phát hành',
      description: 'Kế hoạch triển khai công tác, nhiệm vụ chuyên môn của xã'
    },
    {
      doc_type: 'Tờ trình',
      levels_count: 2,
      level_1_role: 'leader',
      level_1_title: 'Chủ tịch UBND duyệt ký',
      level_2_role: 'officer',
      level_2_title: 'Văn thư gửi cấp trên',
      description: 'Tờ trình gửi UBND Huyện hoặc HĐND xã'
    },
    {
      doc_type: 'Thông báo',
      levels_count: 2,
      level_1_role: 'leader',
      level_1_title: 'Lãnh đạo UBND duyệt',
      level_2_role: 'officer',
      level_2_title: 'Văn thư ban hành công khai',
      description: 'Thông báo lịch làm việc, tiếp dân, triển khai chính sách'
    },
    {
      doc_type: 'Báo cáo',
      levels_count: 2,
      level_1_role: 'leader',
      level_1_title: 'Lãnh đạo phụ trách duyệt',
      level_2_role: 'officer',
      level_2_title: 'Văn thư phát hành',
      description: 'Báo cáo định kỳ tháng, quý, năm hoặc báo cáo chuyên đề'
    },
    {
      doc_type: 'Công văn',
      levels_count: 2,
      level_1_role: 'leader',
      level_1_title: 'Lãnh đạo duyệt ký',
      level_2_role: 'officer',
      level_2_title: 'Văn thư phát hành',
      description: 'Công văn trao đổi nghiệp vụ, chỉ đạo đôn đốc'
    },
    {
      doc_type: 'Giấy mời',
      levels_count: 1,
      level_1_role: 'leader',
      level_1_title: 'Lãnh đạo duyệt',
      level_2_role: 'officer',
      level_2_title: 'Văn thư phát hành',
      description: 'Giấy mời họp, hội nghị của UBND'
    }
  ];

  const insertWorkflow = db.prepare(`
    INSERT INTO approval_workflows (doc_type, levels_count, level_1_role, level_1_title, level_2_role, level_2_title, level_3_role, level_3_title, description)
    VALUES (@doc_type, @levels_count, @level_1_role, @level_1_title, @level_2_role, @level_2_title, @level_3_role, @level_3_title, @description)
  `);
  for (const wf of workflowsData) {
    insertWorkflow.run({
      level_3_role: null,
      level_3_title: null,
      ...wf
    });
  }

  // 4. Công văn đi mẫu
  const docOutData = [
    {
      id: 1,
      doc_number: '15/2026/QĐ-UBND',
      doc_type: 'Quyết định',
      subject: 'Về việc kiện toàn Ban Chỉ đạo Chuyển đổi số và Tổ công nghệ số cộng đồng xã Tân Triều năm 2026',
      content: `Căn cứ Luật Tổ chức chính quyền địa phương ngày 19/6/2015;\nCăn cứ Quyết định số 749/QĐ-TTg ngày 03/6/2020 của Thủ tướng Chính phủ phê duyệt Chương trình Chuyển đổi số quốc gia;\nXét đề nghị của Công chức Văn phòng - Thống kê xã,\n\nQUYẾT ĐỊNH:\nĐiều 1. Kiện toàn Ban Chỉ đạo Chuyển đổi số xã Tân Triều gồm các ông (bà) có tên trong danh sách kèm theo.\nĐiều 2. Ban Chỉ đạo có nhiệm vụ tham mưu cho UBND xã xây dựng kế hoạch, tổ chức thực hiện các chỉ tiêu về Chính quyền điện tử, dịch vụ công trực tuyến và kinh tế số trên địa bàn.\nĐiều 3. Quyết định này có hiệu lực thi hành kể từ ngày ký.`,
      recipient_unit: 'Các ban ngành, đoàn thể, thôn xóm trên địa bàn xã Tân Triều',
      signer_title: 'Chủ tịch UBND xã',
      creator_id: 4, // Cường
      current_approver_id: null,
      priority: 'normal',
      status: 'published',
      approval_level: 3,
      max_approval_levels: 3,
      draft_date: '2026-10-01',
      publish_date: '2026-10-04',
      due_date: '2026-10-15',
      publisher_id: 4
    },
    {
      id: 2,
      doc_number: '28/2026/KH-UBND',
      doc_type: 'Kế hoạch',
      subject: 'Kế hoạch tổ chức Ngày hội Đại đoàn kết toàn dân tộc và Tuần lễ Văn hóa truyền thống Triều Khúc năm 2026',
      content: `Thực hiện chương trình công tác trọng tâm Quý IV/2026;\nUBND xã Tân Triều ban hành Kế hoạch tổ chức các hoạt động văn hóa, thể thao và lễ hội truyền thống nhằm gìn giữ, phát huy giá trị di sản văn hóa phi vật thể quốc gia Lễ hội làng Triều Khúc.\n1. Thời gian tổ chức: Từ ngày 15/11 đến 18/11/2026.\n2. Địa điểm: Quảng trường Đại đình Triều Khúc và các di tích lịch sử trên địa bàn.\n3. Phân công nhiệm vụ cụ thể cho các tổ chức, đoàn thể...`,
      recipient_unit: 'Thường trực Đảng ủy, HĐND, Ban Công tác Mặt trận các thôn',
      signer_title: 'Phó Chủ tịch UBND xã',
      creator_id: 4,
      current_approver_id: null,
      priority: 'normal',
      status: 'approved',
      approval_level: 2,
      max_approval_levels: 2,
      draft_date: '2026-10-05',
      publish_date: null,
      due_date: '2026-10-25',
      publisher_id: null
    },
    {
      id: 3,
      doc_number: 'DRAFT-003',
      doc_type: 'Tờ trình',
      subject: 'Tờ trình V/v xin chủ trương đầu tư nâng cấp, mở rộng tuyến mương thoát nước và đường liên thôn Yên Xá - Triều Khúc',
      content: `Kính gửi: UBND huyện Thanh Trì, Phòng Tài chính - Kế hoạch huyện.\nHiện nay tuyến mương thoát nước liên thôn đã xuống cấp nghiêm trọng, vào mùa mưa thường xuyên gây ngập úng cục bộ và tiềm ẩn nguy cơ mất vệ sinh môi trường.\nĐể đảm bảo tiêu thoát nước và mỹ quan đô thị, UBND xã kính trình UBND huyện xem xét, phê duyệt chủ trương và bố trí nguồn vốn đầu tư công trung hạn giai đoạn 2026-2028.`,
      recipient_unit: 'UBND Huyện Thanh Trì',
      signer_title: 'Chủ tịch UBND xã',
      creator_id: 5, // Tuấn địa chính
      current_approver_id: 2, // Đang chờ Chủ tịch duyệt (Level 2)
      priority: 'urgent',
      status: 'pending_review',
      approval_level: 2,
      max_approval_levels: 2,
      draft_date: '2026-10-10',
      publish_date: null,
      due_date: '2026-10-18',
      publisher_id: null
    },
    {
      id: 4,
      doc_number: 'DRAFT-004',
      doc_type: 'Công văn',
      subject: 'V/v Tăng cường kiểm tra phòng cháy chữa cháy và trật tự xây dựng tại các khu nhà trọ, chung cư mini',
      content: `Thực hiện Công điện của UBND Thành phố và Công an Thành phố Hà Nội;\nUBND xã Tân Triều yêu cầu Công chức Địa chính - Xây dựng chủ trì, phối hợp Công an xã và Trưởng các thôn kiểm tra 100% cơ sở kinh doanh nhà trọ, nhà ở nhiều căn hộ trên địa bàn; kiên quyết xử lý các trường hợp cơi nới, vi phạm lối thoát nạn.`,
      recipient_unit: 'Công an xã, Tổ trật tự đô thị, Trưởng thôn Triều Khúc và Yên Xá',
      signer_title: 'Chủ tịch UBND xã',
      creator_id: 4,
      current_approver_id: 3, // Chờ Phó Chủ tịch duyệt (Level 1)
      priority: 'urgent',
      status: 'pending_review',
      approval_level: 1,
      max_approval_levels: 2,
      draft_date: '2026-10-12',
      publish_date: null,
      due_date: '2026-10-16',
      publisher_id: null
    },
    {
      id: 5,
      doc_number: '18/2026/TB-UBND',
      doc_type: 'Thông báo',
      subject: 'Thông báo lịch tiếp công dân định kỳ tháng 10 năm 2026 của Chủ tịch Ủy ban nhân dân xã Tân Triều',
      content: `UBND xã Tân Triều thông báo lịch tiếp công dân định kỳ tháng 10/2026 của Chủ tịch UBND xã như sau:\n- Thời gian: Vào thứ Ba và thứ Năm hàng tuần (Sáng: 8h00 - 11h30; Chiều: 13h30 - 16h30).\n- Địa điểm: Phòng Tiếp công dân UBND xã Tân Triều (Tầng 1 Trụ sở UBND xã).\nCông dân khi đến khiếu nại, tố cáo, kiến nghị mang theo căn cước công dân và các tài liệu liên quan.`,
      recipient_unit: 'Toàn thể nhân dân trên địa bàn xã Tân Triều',
      signer_title: 'Chủ tịch UBND xã',
      creator_id: 4,
      current_approver_id: null,
      priority: 'normal',
      status: 'published',
      approval_level: 2,
      max_approval_levels: 2,
      draft_date: '2026-09-30',
      publish_date: '2026-10-01',
      due_date: '2026-10-31',
      publisher_id: 4
    },
    {
      id: 6,
      doc_number: 'DRAFT-006',
      doc_type: 'Báo cáo',
      subject: 'Báo cáo công tác giải phóng mặt bằng Dự án đường giao thông kết nối khu đô thị mới Tân Triều',
      content: `Báo cáo chi tiết tiến độ kiểm đếm, xác minh nguồn gốc đất và phương án bồi thường, hỗ trợ tái định cư cho 34 hộ gia đình nằm trong chỉ giới thu hồi đất...`,
      recipient_unit: 'Ban Quản lý dự án ĐTXD huyện Thanh Trì',
      signer_title: 'Phó Chủ tịch UBND xã',
      creator_id: 5,
      current_approver_id: 5,
      priority: 'normal',
      status: 'needs_edit',
      approval_level: 1,
      max_approval_levels: 2,
      draft_date: '2026-10-08',
      publish_date: null,
      due_date: '2026-10-15',
      publisher_id: null
    },
    {
      id: 7,
      doc_number: 'DRAFT-007',
      doc_type: 'Công văn',
      subject: 'V/v Đôn đốc hoàn thành thủ tục đăng ký đất đai, cấp Giấy chứng nhận quyền sử dụng đất đợt 2/2026',
      content: `Dự thảo công văn gửi các hộ dân đủ điều kiện nhưng chưa nộp hồ sơ xin cấp sổ đỏ theo thông báo lần 1...`,
      recipient_unit: 'Các hộ dân thuộc khu dân cư số 3 và số 5',
      signer_title: 'Chủ tịch UBND xã',
      creator_id: 5,
      current_approver_id: null,
      priority: 'normal',
      status: 'draft',
      approval_level: 1,
      max_approval_levels: 2,
      draft_date: '2026-10-13',
      publish_date: null,
      due_date: '2026-10-20',
      publisher_id: null
    },
    {
      id: 8,
      doc_number: 'DRAFT-008',
      doc_type: 'Tờ trình',
      subject: 'Tờ trình V/v Phê duyệt phương án cưỡng chế giải tỏa công trình vi phạm trật tự xây dựng lấn chiếm hành lang thoát lũ',
      content: `Kính gửi: Đồng chí Chủ tịch Ủy ban nhân dân xã Tân Triều.\nCăn cứ Biên bản vi phạm hành chính số 12/BB-VPHC ngày 05/10/2026 của Tổ kiểm tra trật tự xây dựng;\nCăn cứ Quyết định xử phạt vi phạm hành chính số 48/QĐ-XPHC nhưng đương sự cố tình không chấp hành tự giác tháo dỡ;\nPhó Chủ tịch UBND xã kính trình Chủ tịch UBND xã phê duyệt Kế hoạch và Phương án tổ chức lực lượng cưỡng chế thu hồi mặt bằng nguyên trạng theo đúng quy định pháp luật.`,
      recipient_unit: 'Chủ tịch UBND xã Tân Triều; Công an xã, Tổ trật tự xây dựng',
      signer_title: 'Chủ tịch UBND xã',
      creator_id: 3, // Lê Thị Mai - Phó Chủ tịch UBND xã
      current_approver_id: 2, // Trần Đình Thắng - Chủ tịch UBND xã (Trình thẳng Chủ tịch, không quay lại Phó Chủ tịch)
      priority: 'emergency',
      status: 'pending_review',
      approval_level: 2,
      max_approval_levels: 2,
      draft_date: '2026-10-14',
      publish_date: null,
      due_date: '2026-10-18',
      publisher_id: null
    }
  ];

  const insertDocOut = db.prepare(`
    INSERT INTO doc_out (id, doc_number, doc_type, subject, content, recipient_unit, signer_title, creator_id, current_approver_id, priority, status, approval_level, max_approval_levels, draft_date, publish_date, due_date, publisher_id)
    VALUES (@id, @doc_number, @doc_type, @subject, @content, @recipient_unit, @signer_title, @creator_id, @current_approver_id, @priority, @status, @approval_level, @max_approval_levels, @draft_date, @publish_date, @due_date, @publisher_id)
  `);
  for (const d of docOutData) {
    insertDocOut.run(d);
  }

  // 5. Lịch sử phê duyệt mẫu cho công văn đi
  const approvalHistoryData = [
    // Doc 1 (Đã duyệt qua 3 cấp và phát hành)
    { doc_out_id: 1, level: 1, actor_id: 4, action: 'submit', comment: 'Kính trình đồng chí Phó Chủ tịch thẩm định dự thảo Quyết định', prev_status: 'draft', new_status: 'pending_review' },
    { doc_out_id: 1, level: 1, actor_id: 3, action: 'approve', comment: 'Đã rà soát danh sách thành viên Ban chỉ đạo, thống nhất chuyển Chủ tịch ký duyệt', prev_status: 'pending_review', new_status: 'pending_review' },
    { doc_out_id: 1, level: 2, actor_id: 2, action: 'approve', comment: 'Đồng ý phê duyệt ban hành. Giao văn phòng hoàn thiện số và phát hành theo quy định.', prev_status: 'pending_review', new_status: 'approved' },
    { doc_out_id: 1, level: 3, actor_id: 4, action: 'publish', comment: 'Đã cấp số 15/2026/QĐ-UBND, đóng dấu và phát hành trên hệ thống liên thông.', prev_status: 'approved', new_status: 'published' },
    
    // Doc 2 (Đã duyệt xong cấp 2, chờ phát hành)
    { doc_out_id: 2, level: 1, actor_id: 4, action: 'submit', comment: 'Kính trình Lãnh đạo UBND phê duyệt Kế hoạch Ngày hội Đại đoàn kết', prev_status: 'draft', new_status: 'pending_review' },
    { doc_out_id: 2, level: 2, actor_id: 3, action: 'approve', comment: 'Kế hoạch chi tiết, chu đáo. Phê duyệt triển khai.', prev_status: 'pending_review', new_status: 'approved' },

    // Doc 3 (Đã qua cấp 1, đang chờ Chủ tịch duyệt cấp 2)
    { doc_out_id: 3, level: 1, actor_id: 5, action: 'submit', comment: 'Kính trình Lãnh đạo thẩm định Tờ trình dự án mương thoát nước', prev_status: 'draft', new_status: 'pending_review' },
    { doc_out_id: 3, level: 1, actor_id: 3, action: 'approve', comment: 'Nội dung cấp thiết, đã kiểm tra thực địa, kính chuyển đồng chí Chủ tịch ký', prev_status: 'pending_review', new_status: 'pending_review' },

    // Doc 4 (Vừa nộp, chờ Phó Chủ tịch thẩm định)
    { doc_out_id: 4, level: 1, actor_id: 4, action: 'submit', comment: 'Trình đồng chí Phó Chủ tịch xem xét công văn hỏa tốc về PCCC', prev_status: 'draft', new_status: 'pending_review' },

    // Doc 6 (Yêu cầu chỉnh sửa)
    { doc_out_id: 6, level: 1, actor_id: 5, action: 'submit', comment: 'Trình dự thảo báo cáo GPMB', prev_status: 'draft', new_status: 'pending_review' },
    { doc_out_id: 6, level: 1, actor_id: 3, action: 'request_edit', comment: 'Đề nghị cập nhật lại phụ lục 02: Bổ sung diện tích đất nông nghiệp công ích của thôn Yên Xá trước khi trình lại.', prev_status: 'pending_review', new_status: 'needs_edit' },

    // Doc 8 (Do Phó Chủ tịch Lê Thị Mai soạn thảo, trình thẳng Chủ tịch Trần Đình Thắng phê duyệt ký)
    { doc_out_id: 8, level: 2, actor_id: 3, action: 'submit', comment: 'Phó Chủ tịch UBND xã trình Chủ tịch UBND xã xem xét, phê duyệt phương án cưỡng chế', prev_status: 'draft', new_status: 'pending_review' }
  ];

  const insertApprovalHistory = db.prepare(`
    INSERT INTO approval_history (doc_out_id, level, actor_id, action, comment, prev_status, new_status)
    VALUES (@doc_out_id, @level, @actor_id, @action, @comment, @prev_status, @new_status)
  `);
  for (const ah of approvalHistoryData) {
    insertApprovalHistory.run(ah);
  }

  // 6. Công văn đến mẫu
  const docInData = [
    {
      id: 1,
      incoming_number: '124/2026/ĐEN',
      original_number: '845/UBND-NV',
      doc_date: '2026-10-10',
      received_date: '2026-10-11',
      sender_agency: 'Ủy ban nhân dân Huyện Thanh Trì',
      subject: 'V/v Rà soát quy hoạch đất đai và nhu cầu tái định cư phục vụ dự án mở rộng đường kết nối Vành đai 3 đi qua địa bàn xã',
      doc_type: 'Công văn',
      priority: 'urgent',
      due_date: '2026-10-20',
      leader_id: 3, // Đ/c Mai chỉ đạo
      handler_id: 5, // Giao Tuấn địa chính
      directive: 'Chuyển Đ/c Tuấn Địa chính chủ trì, phối hợp Ban Quản lý thôn Yên Xá kiểm tra thực địa, tổng hợp số liệu báo cáo UBND huyện trước ngày 18/10/2026.',
      status: 'processing',
      result_note: 'Đã hoàn thành rà soát hiện trạng 15/22 thửa đất; đang làm việc với 7 hộ còn lại.'
    },
    {
      id: 2,
      incoming_number: '125/2026/ĐEN',
      original_number: '112/KH-STTTT',
      doc_date: '2026-10-08',
      received_date: '2026-10-09',
      sender_agency: 'Sở Thông tin và Truyền thông Hà Nội',
      subject: 'Kế hoạch triển khai Hệ thống thông tin giải quyết thủ tục hành chính liên thông 3 cấp tỉnh - huyện - xã giai đoạn 2026-2027',
      doc_type: 'Kế hoạch',
      priority: 'normal',
      due_date: '2026-10-25',
      leader_id: 2,
      handler_id: 4,
      directive: 'Đ/c Cường Văn phòng nghiên cứu các yêu cầu kỹ thuật, đề xuất cấu hình đường truyền và tập huấn cán bộ Một cửa.',
      status: 'completed',
      result_note: 'Đã hoàn tất báo cáo khảo sát hạ tầng máy trạm và đường truyền cáp quang của xã, gửi Sở TTTT theo đúng biểu mẫu.'
    },
    {
      id: 3,
      incoming_number: '126/2026/ĐEN',
      original_number: '05/CT-UBND',
      doc_date: '2026-10-05',
      received_date: '2026-10-06',
      sender_agency: 'Ủy ban nhân dân Thành phố Hà Nội',
      subject: 'Chỉ thị về việc chủ động phòng chống rét đậm, rét hại và bảo vệ hoa màu vụ Đông - Xuân 2026',
      doc_type: 'Chỉ thị',
      priority: 'emergency',
      due_date: '2026-10-12',
      leader_id: 2,
      handler_id: 5,
      directive: 'Đăng tải thông báo rộng rãi trên hệ thống loa truyền thanh và cổng thông tin điện tử của xã; hướng dẫn bà con nông dân che chắn mạ.',
      status: 'completed',
      result_note: 'Đài truyền thanh xã đã phát liên tục trong 3 ngày; hoàn thành công tác hướng dẫn các hộ nông nghiệp.'
    },
    {
      id: 4,
      incoming_number: '127/2026/ĐEN',
      original_number: '312/CAH-QLHC',
      doc_date: '2026-10-12',
      received_date: '2026-10-13',
      sender_agency: 'Công an Huyện Thanh Trì',
      subject: 'V/v Đẩy mạnh làm sạch dữ liệu hộ tịch, dân cư và cấp tài khoản định danh điện tử mức độ 2 cho công dân',
      doc_type: 'Công văn',
      priority: 'urgent',
      due_date: '2026-10-22',
      leader_id: 3,
      handler_id: 6, // Hà tư pháp
      directive: 'Giao Tư pháp phối hợp Công an xã lập danh sách đối chiếu dữ liệu hộ tịch và căn cước công dân.',
      status: 'processing',
      result_note: 'Đang tiến hành đối chiếu 120 trường hợp có sai lệch thông tin ngày tháng năm sinh.'
    },
    {
      id: 5,
      incoming_number: '128/2026/ĐEN',
      original_number: '42/GM-HĐND',
      doc_date: '2026-10-13',
      received_date: '2026-10-14',
      sender_agency: 'Thường trực HĐND Huyện Thanh Trì',
      subject: 'Giấy mời tham dự Hội nghị giám sát chuyên đề công tác quản lý trật tự xây dựng và đất đai năm 2026',
      doc_type: 'Giấy mời',
      priority: 'normal',
      due_date: '2026-10-17',
      leader_id: 2,
      handler_id: null,
      directive: null,
      status: 'pending_assign',
      result_note: null
    },
    {
      id: 6,
      incoming_number: '120/2026/ĐEN',
      original_number: '62/TB-STNMT',
      doc_date: '2026-09-20',
      received_date: '2026-09-22',
      sender_agency: 'Sở Tài nguyên và Môi trường TP. Hà Nội',
      subject: 'Thông báo kết quả thanh tra việc chấp hành quy định pháp luật trong quản lý đất bãi ven sông',
      doc_type: 'Thông báo',
      priority: 'normal',
      due_date: '2026-10-05',
      leader_id: 3,
      handler_id: 5,
      directive: 'Yêu cầu kiểm tra xử lý dứt điểm các trường hợp san lấp trái phép theo kết luận thanh tra.',
      status: 'overdue',
      result_note: 'Đã ra quyết định xử phạt vi phạm hành chính 1 trường hợp, còn 1 trường hợp đang xác minh quyền sử dụng.'
    }
  ];

  const insertDocIn = db.prepare(`
    INSERT INTO doc_in (id, incoming_number, original_number, doc_date, received_date, sender_agency, subject, doc_type, priority, due_date, leader_id, handler_id, directive, status, result_note)
    VALUES (@id, @incoming_number, @original_number, @doc_date, @received_date, @sender_agency, @subject, @doc_type, @priority, @due_date, @leader_id, @handler_id, @directive, @status, @result_note)
  `);
  for (const din of docInData) {
    insertDocIn.run(din);
  }

  // 7. Yêu cầu trực tuyến của người dân (Online Requests)
  const requestsData = [
    {
      id: 1,
      code: 'HS-2026-00001',
      citizen_name: 'Vũ Thị Lan',
      phone: '0912345678',
      email: 'vuthilan.tt@gmail.com',
      address: 'Số 12 ngõ 111 Triều Khúc, Xã Tân Triều',
      category: 'Phản ánh về môi trường',
      title: 'Phản ánh bãi tập kết rác thải tự phát gây ô nhiễm và mùi hôi đầu ngõ 111 Triều Khúc',
      content: 'Kính gửi UBND xã Tân Triều, hiện nay tại khu đất trống đầu ngõ 111 đường Triều Khúc có một số người dân đổ trộm rác sinh hoạt và phế thải xây dựng, gây ô nhiễm môi trường và cản trở lối đi của học sinh trường tiểu học gần đó. Kính mong UBND xã chỉ đạo lực lượng thu gom và đặt biển cấm đổ rác.',
      status: 'resolved',
      handler_id: 5,
      handler_dept: 'Địa chính - Xây dựng - Môi trường',
      response_note: 'UBND xã đã chỉ đạo Công ty Vệ sinh môi trường tiến hành thu dọn toàn bộ bãi rác tự phát trong ngày 12/10/2026; đồng thời lắp đặt biển cấm đổ rác và giao Tổ tự quản thôn Triều Khúc thường xuyên kiểm tra, xử lý nghiêm các trường hợp vi phạm.',
      rejection_reason: null,
      due_date: '2026-10-14',
      resolved_at: '2026-10-12 16:30:00'
    },
    {
      id: 2,
      code: 'HS-2026-00002',
      citizen_name: 'Nguyễn Văn An',
      phone: '0988776655',
      email: 'an.nguyen@gmail.com',
      address: 'Thôn Yên Xá, Xã Tân Triều',
      category: 'Yêu cầu hỗ trợ hành chính',
      title: 'Đề nghị hỗ trợ cấp bản sao trích lục giấy khai sinh điện tử trực tuyến',
      content: 'Tôi cần trích lục khai sinh cho con trai Nguyễn Minh Khôi sinh năm 2018 tại xã Tân Triều để hoàn thiện hồ sơ chuyển trường, do đang công tác xa không thể về xã nộp trực tiếp. Kính đề nghị Bộ phận Tư pháp hướng dẫn và gửi bản sao điện tử có chứng thực.',
      status: 'resolved',
      handler_id: 6,
      handler_dept: 'Tư pháp - Hộ tịch',
      response_note: 'Bộ phận Tư pháp - Hộ tịch đã tra cứu sổ bộ năm 2018 và phát hành Bản sao Trích lục khai sinh điện tử có ký số của UBND xã. Công dân vui lòng tải về từ liên kết đính kèm hồ sơ.',
      rejection_reason: null,
      due_date: '2026-10-12',
      resolved_at: '2026-10-11 10:15:00'
    },
    {
      id: 3,
      code: 'HS-2026-00003',
      citizen_name: 'Trần Văn Bình',
      phone: '0934567890',
      email: 'binh.tran@yahoo.com',
      address: 'Xóm Cầu, Thôn Triều Khúc',
      category: 'Phản ánh về hạ tầng',
      title: 'Đèn đường chiếu sáng ngõ 66 Yên Xá bị cháy hỏng 3 ngày nay',
      content: 'Đoạn đường từ cổng làng Yên Xá vào ngõ 66 có 2 bóng đèn cao áp bị hỏng, buổi tối rất tối gây nguy hiểm cho người tham gia giao thông và tiềm ẩn mất an ninh trật tự.',
      status: 'processing',
      handler_id: 5,
      handler_dept: 'Địa chính - Xây dựng - Môi trường',
      response_note: 'UBND xã đã tiếp nhận và chuyển cho đơn vị quản lý vận hành điện chiếu sáng Huyện để kiểm tra thay bóng mới trong ngày 15/10/2026.',
      rejection_reason: null,
      due_date: '2026-10-16',
      resolved_at: null
    },
    {
      id: 4,
      code: 'HS-2026-00004',
      citizen_name: 'Lê Thị Hoa',
      phone: '0971239988',
      email: 'hoale.tn@gmail.com',
      address: 'Khu giãn dân Yên Xá',
      category: 'Đề nghị cung cấp thông tin',
      title: 'Xin tra cứu thông tin quy hoạch sử dụng đất thửa đất số 45 tờ bản đồ số 12',
      content: 'Tôi muốn tìm hiểu thông tin quy hoạch mở rộng đường đối với thửa đất gia đình tôi đang sinh sống để chuẩn bị xây dựng nhà ở kiên cố.',
      status: 'need_info',
      handler_id: 5,
      handler_dept: 'Địa chính - Xây dựng - Môi trường',
      response_note: 'Đề nghị công dân bổ sung bản chụp Giấy chứng nhận quyền sử dụng đất hoặc cung cấp số Căn cước công dân của chủ sử dụng đất để đối chiếu đúng thẩm quyền.',
      rejection_reason: null,
      due_date: '2026-10-18',
      resolved_at: null
    },
    {
      id: 5,
      code: 'HS-2026-00005',
      citizen_name: 'Phạm Văn Dũng',
      phone: '0966442200',
      email: 'dung.pham@gmail.com',
      address: 'Số 88 Tân Triều',
      category: 'Góp ý chất lượng phục vụ',
      title: 'Góp ý về việc bổ sung ghế ngồi chờ và bảng hướng dẫn tại Bộ phận Tiếp nhận và Trả kết quả (Một cửa)',
      content: 'Bộ phận một cửa xã làm việc rất nhiệt tình, tuy nhiên lượng người đến làm thủ tục buổi sáng rất đông, mong xã bố trí thêm ghế ngồi và bổ sung máy nước uống phục vụ người cao tuổi.',
      status: 'received',
      handler_id: 4,
      handler_dept: 'Văn phòng - Thống kê',
      response_note: null,
      rejection_reason: null,
      due_date: '2026-10-21',
      resolved_at: null
    },
    {
      id: 6,
      code: 'HS-2026-00006',
      citizen_name: 'Hoàng Thị Thu',
      phone: '0903332211',
      email: 'thu.hoang@gmail.com',
      address: 'Thôn Triều Khúc',
      category: 'Kiến nghị, phản ánh',
      title: 'Kiến nghị xử lý tình trạng lấn chiếm vỉa hè họp chợ tạm vào giờ cao điểm buổi chiều',
      content: 'Tại khu vực gần cổng chợ Triều Khúc, nhiều người bán hàng rong tràn ra lòng đường gây ách tắc giao thông từ 17h đến 19h hàng ngày.',
      status: 'pending_assign',
      handler_id: null,
      handler_dept: null,
      response_note: null,
      rejection_reason: null,
      due_date: '2026-10-22',
      resolved_at: null
    }
  ];

  const insertRequest = db.prepare(`
    INSERT INTO online_requests (id, code, citizen_name, phone, email, address, category, title, content, status, handler_id, handler_dept, response_note, rejection_reason, due_date, resolved_at)
    VALUES (@id, @code, @citizen_name, @phone, @email, @address, @category, @title, @content, @status, @handler_id, @handler_dept, @response_note, @rejection_reason, @due_date, @resolved_at)
  `);
  for (const r of requestsData) {
    insertRequest.run(r);
  }

  // 8. Đánh giá chất lượng phục vụ (Service Ratings) - Sau khi giải quyết hồ sơ
  const serviceRatingsData = [
    {
      request_id: 1,
      stars: 5,
      q1_resolved_satisfactorily: 1,
      q2_clear_feedback: 1,
      q3_processing_time_ok: 1,
      comment: 'Cán bộ xã xử lý rất nhanh và trách nhiệm, chỉ sau 1 ngày bãi rác tự phát đã được dọn sạch sẽ và cắm biển cấm. Rất hài lòng!'
    },
    {
      request_id: 2,
      stars: 4,
      q1_resolved_satisfactorily: 1,
      q2_clear_feedback: 1,
      q3_processing_time_ok: 1,
      comment: 'Thủ tục cấp trích lục trực tuyến rất tiện lợi, cán bộ tư pháp gửi bản sao ký số rõ ràng, không phải tốn thời gian đi lại.'
    }
  ];

  const insertServiceRating = db.prepare(`
    INSERT INTO service_ratings (request_id, stars, q1_resolved_satisfactorily, q2_clear_feedback, q3_processing_time_ok, comment)
    VALUES (@request_id, @stars, @q1_resolved_satisfactorily, @q2_clear_feedback, @q3_processing_time_ok, @comment)
  `);
  for (const sr of serviceRatingsData) {
    insertServiceRating.run(sr);
  }

  // 9. Đánh giá giao diện và trải nghiệm app (App UI/UX Ratings) - Yêu cầu cốt lõi
  const appRatingsData = [
    {
      user_id: 7, // Vũ Thị Lan
      user_role: 'citizen',
      user_name: 'Vũ Thị Lan',
      q1_ui_beauty: 'Rất đẹp',
      q2_ease_of_finding: 'Rất dễ',
      q3_readability_colors: 'Rất tốt',
      q4_speed_stars: 5,
      q5_layout_stars: 5,
      q6_suggestions: 'Giao diện màu xanh navy rất trang trọng, hiện đại, các bước tra cứu mã hồ sơ rất đơn giản kể cả với người không rành máy tính.'
    },
    {
      user_id: 8, // Nguyễn Văn An
      user_role: 'citizen',
      user_name: 'Nguyễn Văn An',
      q1_ui_beauty: 'Đẹp',
      q2_ease_of_finding: 'Khá dễ',
      q3_readability_colors: 'Rất tốt',
      q4_speed_stars: 5,
      q5_layout_stars: 4,
      q6_suggestions: 'App chạy rất nhanh và mượt mà, chữ to rõ ràng. Nếu có thêm tính năng thông báo qua Zalo khi hồ sơ có kết quả thì tuyệt vời.'
    },
    {
      user_id: 4, // Cường Văn phòng
      user_role: 'officer',
      user_name: 'Phạm Hùng Cường (Cán bộ Văn phòng)',
      q1_ui_beauty: 'Rất đẹp',
      q2_ease_of_finding: 'Rất dễ',
      q3_readability_colors: 'Rất tốt',
      q4_speed_stars: 5,
      q5_layout_stars: 5,
      q6_suggestions: 'Giao diện soạn thảo công văn và trình duyệt rất khoa học, thanh tiến trình nhiều cấp thể hiện trực quan rõ ràng ai đang giữ văn bản.'
    },
    {
      user_id: 2, // Trần Đình Thắng Chủ tịch
      user_role: 'leader',
      user_name: 'Trần Đình Thắng (Lãnh đạo)',
      q1_ui_beauty: 'Rất đẹp',
      q2_ease_of_finding: 'Rất dễ',
      q3_readability_colors: 'Rất tốt',
      q4_speed_stars: 5,
      q5_layout_stars: 5,
      q6_suggestions: 'Dashboard tổng quan số liệu rất chuẩn xác, nhìn vào là nắm được ngay các văn bản khẩn, công văn sắp hết hạn và phản ánh của bà con.'
    },
    {
      user_id: 5, // Tuấn địa chính
      user_role: 'officer',
      user_name: 'Hoàng Minh Tuấn (Cán bộ Địa chính)',
      q1_ui_beauty: 'Đẹp',
      q2_ease_of_finding: 'Khá dễ',
      q3_readability_colors: 'Tốt',
      q4_speed_stars: 4,
      q5_layout_stars: 4,
      q6_suggestions: 'Rất ưng ý với tính năng xem trước văn bản và tải tài liệu đính kèm nhanh chóng. Màu sắc hài hòa không bị mỏi mắt khi xử lý hồ sơ lâu.'
    },
    {
      user_id: 1, // Admin
      user_role: 'admin',
      user_name: 'Nguyễn Văn Quản Trị (Quản trị viên)',
      q1_ui_beauty: 'Rất đẹp',
      q2_ease_of_finding: 'Rất dễ',
      q3_readability_colors: 'Rất tốt',
      q4_speed_stars: 5,
      q5_layout_stars: 5,
      q6_suggestions: 'Hệ thống phân quyền chuẩn chỉ, có thống kê đánh giá tách biệt 2 mục dịch vụ và giao diện rất đầy đủ dữ liệu.'
    }
  ];

  const insertAppRating = db.prepare(`
    INSERT INTO app_ui_ratings (user_id, user_role, user_name, q1_ui_beauty, q2_ease_of_finding, q3_readability_colors, q4_speed_stars, q5_layout_stars, q6_suggestions)
    VALUES (@user_id, @user_role, @user_name, @q1_ui_beauty, @q2_ease_of_finding, @q3_readability_colors, @q4_speed_stars, @q5_layout_stars, @q6_suggestions)
  `);
  for (const ar of appRatingsData) {
    insertAppRating.run(ar);
  }

  // 10. Bảng nhiệm vụ (Tasks & Assignments)
  const tasksData = [
    {
      id: 1,
      title: 'Kiểm tra hiện trường và chỉ đạo dọn bãi rác tự phát ngõ 111 Triều Khúc',
      description: 'Phối hợp Công ty Vệ sinh môi trường xử lý triệt để phản ánh HS-2026-00001 của người dân và cắm biển cấm.',
      related_type: 'request',
      related_id: 1,
      creator_id: 3, // Đ/c Mai giao
      assignee_id: 5, // Tuấn nhận
      assigned_date: '2026-10-11',
      due_date: '2026-10-13',
      priority: 'urgent',
      progress_percent: 100,
      status: 'completed',
      result_note: 'Đã hoàn thành dọn sạch 3 tấn rác và phế thải, cắm 2 biển cấm đổ rác.'
    },
    {
      id: 2,
      title: 'Hoàn thiện hồ sơ rà soát quy hoạch đất đai tuyến kết nối Vành đai 3',
      description: 'Thực hiện theo chỉ đạo tại Công văn đến số 124/2026/ĐEN của UBND Huyện Thanh Trì.',
      related_type: 'doc_in',
      related_id: 1,
      creator_id: 2, // Chủ tịch giao
      assignee_id: 5, // Tuấn nhận
      assigned_date: '2026-10-11',
      due_date: '2026-10-18',
      priority: 'urgent',
      progress_percent: 70,
      status: 'in_progress',
      result_note: 'Đang lập biên bản xác minh ranh giới với 7 hộ còn lại.'
    },
    {
      id: 3,
      title: 'Chuẩn bị văn kiện và khánh tiết Ngày hội Đại đoàn kết toàn dân tộc',
      description: 'Triển khai chi tiết Kế hoạch 28/2026/KH-UBND; liên hệ đoàn nghệ thuật và chuẩn bị giấy mời đại biểu.',
      related_type: 'doc_out',
      related_id: 2,
      creator_id: 3,
      assignee_id: 4, // Cường nhận
      assigned_date: '2026-10-06',
      due_date: '2026-10-25',
      priority: 'normal',
      progress_percent: 50,
      status: 'in_progress',
      result_note: 'Đã hoàn thành dự thảo giấy mời và chương trình chi tiết.'
    },
    {
      id: 4,
      title: 'Đối chiếu và làm sạch 120 dữ liệu hộ tịch sai lệch',
      description: 'Phối hợp Công an xã đối chiếu dữ liệu hộ tịch phục vụ Đề án 06.',
      related_type: 'doc_in',
      related_id: 4,
      creator_id: 3,
      assignee_id: 6, // Hà tư pháp
      assigned_date: '2026-10-13',
      due_date: '2026-10-22',
      priority: 'urgent',
      progress_percent: 30,
      status: 'in_progress',
      result_note: 'Đã đối chiếu được 40 trường hợp đầu tiên.'
    }
  ];

  const insertTask = db.prepare(`
    INSERT INTO tasks (id, title, description, related_type, related_id, creator_id, assignee_id, assigned_date, due_date, priority, progress_percent, status, result_note)
    VALUES (@id, @title, @description, @related_type, @related_id, @creator_id, @assignee_id, @assigned_date, @due_date, @priority, @progress_percent, @status, @result_note)
  `);
  for (const t of tasksData) {
    insertTask.run(t);
  }

  // 11. Thông báo hệ thống (Notifications)
  const notificationsData = [
    {
      user_id: 2, // Chủ tịch
      title: 'Có công văn chờ phê duyệt',
      message: 'Công chức Địa chính vừa trình Tờ trình số DRAFT-003 V/v Nâng cấp tuyến mương thoát nước.',
      category: 'approval',
      link_type: 'doc_out',
      link_id: 3,
      is_read: 0
    },
    {
      user_id: 3, // Phó Chủ tịch
      title: 'Công văn hỏa tốc cần thẩm định',
      message: 'Văn phòng vừa trình dự thảo Công văn hỏa tốc về kiểm tra an toàn PCCC nhà trọ.',
      category: 'approval',
      link_type: 'doc_out',
      link_id: 4,
      is_read: 0
    },
    {
      user_id: 5, // Tuấn địa chính
      title: 'Yêu cầu chỉnh sửa công văn',
      message: 'Lãnh đạo UBND yêu cầu cập nhật lại Phụ lục 02 báo cáo GPMB số DRAFT-006.',
      category: 'warning',
      link_type: 'doc_out',
      link_id: 6,
      is_read: 0
    },
    {
      user_id: 4, // Cường VP
      title: 'Có yêu cầu trực tuyến mới',
      message: 'Người dân gửi phản ánh mới HS-2026-00006 về lấn chiếm vỉa hè thôn Triều Khúc.',
      category: 'request',
      link_type: 'request',
      link_id: 6,
      is_read: 0
    },
    {
      user_id: 7, // Người dân Lan
      title: 'Hồ sơ đã được giải quyết',
      message: 'Phản ánh HS-2026-00001 về môi trường ngõ 111 Triều Khúc đã được UBND xã giải quyết thành công.',
      category: 'request',
      link_type: 'request',
      link_id: 1,
      is_read: 1
    }
  ];

  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, title, message, category, link_type, link_id, is_read)
    VALUES (@user_id, @title, @message, @category, @link_type, @link_id, @is_read)
  `);
  for (const n of notificationsData) {
    insertNotif.run(n);
  }

  // 12. Nhật ký hoạt động (Audit Logs)
  const auditLogsData = [
    { user_id: 4, username: 'canbo_vp', role: 'officer', action: 'CREATE_DOC_OUT', target_type: 'doc_out', target_id: '1', description: 'Soạn thảo Quyết định kiện toàn BCĐ Chuyển đổi số', ip_address: '192.168.1.15' },
    { user_id: 4, username: 'canbo_vp', role: 'officer', action: 'SUBMIT_DOC_OUT', target_type: 'doc_out', target_id: '1', description: 'Trình duyệt cấp 1 Quyết định kiện toàn BCĐ', ip_address: '192.168.1.15' },
    { user_id: 3, username: 'phochutich', role: 'leader', action: 'APPROVE_DOC_OUT', target_type: 'doc_out', target_id: '1', description: 'Phê duyệt thẩm định cấp 1 Quyết định kiện toàn BCĐ', ip_address: '192.168.1.10' },
    { user_id: 2, username: 'chutich', role: 'leader', action: 'APPROVE_DOC_OUT', target_type: 'doc_out', target_id: '1', description: 'Chủ tịch ký duyệt cấp 2 Quyết định kiện toàn BCĐ', ip_address: '192.168.1.2' },
    { user_id: 4, username: 'canbo_vp', role: 'officer', action: 'PUBLISH_DOC_OUT', target_type: 'doc_out', target_id: '1', description: 'Cấp số 15/2026/QĐ-UBND và phát hành chính thức', ip_address: '192.168.1.15' },
    { user_id: 7, username: 'nguoidan', role: 'citizen', action: 'CREATE_REQUEST', target_type: 'request', target_id: '1', description: 'Gửi yêu cầu trực tuyến mã HS-2026-00001 (Môi trường)', ip_address: '113.190.22.41' },
    { user_id: 5, username: 'canbo_dc', role: 'officer', action: 'RESOLVE_REQUEST', target_type: 'request', target_id: '1', description: 'Giải quyết và phản hồi kết quả hồ sơ HS-2026-00001', ip_address: '192.168.1.18' },
    { user_id: 7, username: 'nguoidan', role: 'citizen', action: 'RATE_SERVICE', target_type: 'service_rating', target_id: '1', description: 'Đánh giá 5 sao mức độ hài lòng phục vụ hồ sơ HS-2026-00001', ip_address: '113.190.22.41' },
    { user_id: 7, username: 'nguoidan', role: 'citizen', action: 'RATE_APP_UI', target_type: 'app_rating', target_id: '1', description: 'Đánh giá giao diện ứng dụng: Rất đẹp, 5 sao tốc độ', ip_address: '113.190.22.41' }
  ];

  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (user_id, username, role, action, target_type, target_id, description, ip_address)
    VALUES (@user_id, @username, @role, @action, @target_type, @target_id, @description, @ip_address)
  `);
  for (const al of auditLogsData) {
    insertAudit.run(al);
  }

  // 13. Cơ sở dữ liệu Quốc gia về Dân cư & Căn cước công dân gắn chip NFC
  const citizensData = [
    {
      cccd: '001195000007',
      full_name: 'Vũ Thị Lan',
      dob: '1995-10-15',
      gender: 'Nữ',
      ethnicity: 'Kinh',
      hometown: 'Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội',
      permanent_address: 'Số 42 Triều Khúc, Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội',
      issue_date: '2021-05-10',
      expiry_date: '2035-10-15',
      chip_serial: 'VN-CHIP-95000007',
      portrait_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80'
    },
    {
      cccd: '001098000008',
      full_name: 'Nguyễn Văn An',
      dob: '1998-03-20',
      gender: 'Nam',
      ethnicity: 'Kinh',
      hometown: 'Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội',
      permanent_address: 'Đội 3 Thôn Yên Xá, Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội',
      issue_date: '2022-01-15',
      expiry_date: '2038-03-20',
      chip_serial: 'VN-CHIP-98000008',
      portrait_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
    },
    {
      cccd: '001088000001',
      full_name: 'Nguyễn Văn Quản Trị',
      dob: '1988-06-12',
      gender: 'Nam',
      ethnicity: 'Kinh',
      hometown: 'Huyện Thanh Trì, TP. Hà Nội',
      permanent_address: 'Số 12 Ngõ 66 Triều Khúc, Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội',
      issue_date: '2021-08-20',
      expiry_date: '2048-06-12',
      chip_serial: 'VN-CHIP-88000001',
      portrait_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
    },
    {
      cccd: '001075000002',
      full_name: 'Trần Đình Thắng',
      dob: '1975-09-02',
      gender: 'Nam',
      ethnicity: 'Kinh',
      hometown: 'Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội',
      permanent_address: 'Thôn Triều Khúc, Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội',
      issue_date: '2021-04-18',
      expiry_date: '2035-09-02',
      chip_serial: 'VN-CHIP-75000002',
      portrait_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80'
    },
    {
      cccd: '001095018273',
      full_name: 'Hoàng Gia Bảo',
      dob: '1995-11-28',
      gender: 'Nam',
      ethnicity: 'Kinh',
      hometown: 'Huyện Thanh Trì, TP. Hà Nội',
      permanent_address: 'Số 88 Đường Chiến Thắng, Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội',
      issue_date: '2022-04-12',
      expiry_date: '2035-11-28',
      chip_serial: 'VN-CHIP-95018273',
      portrait_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80'
    },
    {
      cccd: '001199014528',
      full_name: 'Lê Thu Trang',
      dob: '1999-07-14',
      gender: 'Nữ',
      ethnicity: 'Kinh',
      hometown: 'Huyện Thanh Trì, TP. Hà Nội',
      permanent_address: 'Phòng 608 Chung cư Eco Green, Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội',
      issue_date: '2023-08-05',
      expiry_date: '2039-07-14',
      chip_serial: 'VN-CHIP-99014528',
      portrait_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
    },
    {
      cccd: '001092005431',
      full_name: 'Đỗ Thành Nam',
      dob: '1992-12-05',
      gender: 'Nam',
      ethnicity: 'Kinh',
      hometown: 'Huyện Thường Tín, TP. Hà Nội',
      permanent_address: 'Số 19 Ngõ 111 Triều Khúc, Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội',
      issue_date: '2021-11-19',
      expiry_date: '2032-12-05',
      chip_serial: 'VN-CHIP-92005431',
      portrait_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80'
    },
    {
      cccd: '079198024519',
      full_name: 'Trần Thị Thu Thảo',
      dob: '1998-04-22',
      gender: 'Nữ',
      ethnicity: 'Kinh',
      hometown: 'Quận 1, TP. Hồ Chí Minh',
      permanent_address: 'Số 15 Cù Lao, Phường 2, Quận Phú Nhuận, TP. Hồ Chí Minh',
      issue_date: '2022-09-10',
      expiry_date: '2038-04-22',
      chip_serial: 'VN-CHIP-98024519',
      portrait_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80'
    },
    {
      cccd: '031093011248',
      full_name: 'Lê Hoàng Long',
      dob: '1993-08-16',
      gender: 'Nam',
      ethnicity: 'Kinh',
      hometown: 'Quận Hồng Bàng, TP. Hải Phòng',
      permanent_address: 'Số 24 Đinh Tiên Hoàng, Phường Hoàng Văn Thụ, Quận Hồng Bàng, TP. Hải Phòng',
      issue_date: '2021-06-30',
      expiry_date: '2033-08-16',
      chip_serial: 'VN-CHIP-93011248',
      portrait_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80'
    }
  ];

  const insertCitizen = db.prepare(`
    INSERT INTO national_citizen_registry (cccd, full_name, dob, gender, ethnicity, hometown, permanent_address, issue_date, expiry_date, chip_serial, portrait_url)
    VALUES (@cccd, @full_name, @dob, @gender, @ethnicity, @hometown, @permanent_address, @issue_date, @expiry_date, @chip_serial, @portrait_url)
  `);
  for (const c of citizensData) {
    insertCitizen.run(c);
  }

  // 14. Bản tin & Thông báo UBND Xã Tân Triều
  const communeNewsData = [
    {
      title: 'Thông báo về việc triển khai kích hoạt Định danh điện tử VNeID Mức 2 và hướng dẫn dịch vụ công trực tuyến',
      summary: 'UBND Xã phối hợp với Công an Xã Tân Triều tổ chức điểm hướng dẫn cài đặt VNeID Mức độ 2 lưu động tại Nhà văn hóa thôn Triều Khúc và Nhà văn hóa thôn Yên Xá.',
      content: `Thực hiện Đề án 06 của Chính phủ về phát triển ứng dụng dữ liệu về dân cư, định danh và xác thực điện tử phục vụ chuyển đổi số quốc gia giai đoạn 2022 - 2025, tầm nhìn đến năm 2030;

UBND Xã Tân Triều phối hợp với Công an Xã Tân Triều thông báo kế hoạch tổ chức đợt cao điểm hướng dẫn kích hoạt Định danh điện tử VNeID Mức độ 2 và tích hợp các giấy tờ cá nhân (GPLX, BHYT, Đăng ký xe) cho toàn thể nhân dân trên địa bàn:

1. Thời gian: Từ 08h00 đến 21h30 các ngày từ thứ Hai đến Chủ nhật hàng tuần.
2. Địa điểm:
   - Điểm 1: Nhà văn hóa Thôn Triều Khúc (Số 54 Triều Khúc).
   - Điểm 2: Nhà văn hóa Thôn Yên Xá (Cụm 2 Yên Xá).
   - Điểm 3: Bộ phận Một cửa - Trụ sở UBND Xã Tân Triều.

3. Giấy tờ công dân mang theo:
   - Thẻ Căn cước công dân gắn chip điện tử còn thời hạn sử dụng.
   - Số điện thoại di động chính chủ đã đăng ký với nhà mạng viễn thông.
   - Thẻ BHYT, Giấy phép lái xe, Đăng ký xe (nếu có nhu cầu tích hợp).

UBND Xã đề nghị các tổ trưởng tổ dân phố, trưởng thôn tích cực tuyên truyền, vận động nhân dân tham gia thực hiện nhằm đảm bảo quyền lợi thiết thực của công dân khi thực hiện các thủ tục hành chính trực tuyến.`,
      category: 'chuyen_doi_so',
      author_id: 2,
      author_name: 'Trần Đình Thắng - Chủ tịch UBND Xã',
      cover_image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
      is_published: 1,
      is_featured: 1,
      views_count: 542
    },
    {
      title: 'UBND Xã Tân Triều phát động phong trào "Ngày Chủ nhật xanh" tổng vệ sinh môi trường kênh mương và ngõ xóm',
      summary: 'Kêu gọi toàn thể cán bộ, đảng viên, đoàn viên thanh niên và nhân dân đồng loạt ra quân dọn dẹp vệ sinh môi trường, nạo vét cống rãnh thoát nước.',
      content: `Nhằm xây dựng cảnh quan môi trường sáng - xanh - sạch - đẹp, phòng chống dịch bệnh sốt xuất huyết và chuẩn bị đón các ngày lễ kỷ niệm lớn của Thủ đô;

UBND Xã Tân Triều phối hợp với Ủy ban MTTQ và Đoàn Thanh niên xã phát động phong trào "Ngày Chủ nhật xanh":
- Thời gian ra quân: 07h00 sáng Chủ nhật hàng tuần.
- Lực lượng nòng cốt: Cán bộ công chức, đoàn viên thanh niên, hội viên phụ nữ và bà con nhân dân từng ngõ phố.
- Nhiệm vụ trọng tâm: Thu gom rác thải tồn đọng, bóc xóa biển quảng cáo rao vặt sai quy định, khơi thông dòng chảy tuyến mương tiêu thoát nước Yên Xá.

UBND Xã đề nghị các cơ quan, đơn vị, trường học và hộ kinh doanh trên địa bàn chủ động tổng vệ sinh khuôn viên đơn vị và mặt tiền kinh doanh của gia đình.`,
      category: 'hoat_dong',
      author_id: 3,
      author_name: 'Lê Thị Mai - Phó Chủ tịch UBND Xã',
      cover_image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
      is_published: 1,
      is_featured: 0,
      views_count: 318
    },
    {
      title: 'Công an Xã Tân Triều cảnh báo thủ đoạn tội phạm công nghệ cao giả danh cơ quan nhà nước lừa đảo',
      summary: 'Khuyến cáo công dân không làm theo hướng dẫn cài đặt file APK lạ hoặc truy cập đường link không rõ nguồn gốc mạo danh Cổng Dịch vụ công Quốc gia.',
      content: `Thời gian gần đây, xuất hiện tình trạng đối tượng xấu gọi điện cho người dân tự xưng là cán bộ Công an hoặc cán bộ Tư pháp - Hộ tịch xã Tân Triều thông báo "hồ sơ CCCD bị lỗi", "chưa cập nhật dữ liệu định danh" và yêu cầu người dân tải ứng dụng lạ qua đường link Zalo hoặc mã QR.

CÔNG AN XÃ TÂN TRIỀU XIN THÔNG BÁO VÀ KHUYẾN CÁO ĐẾN BÀ CON NHÂN DÂN:
1. Lực lượng Công an và cán bộ UBND xã TUYỆT ĐỐI KHÔNG hướng dẫn người dân cài đặt ứng dụng dịch vụ công qua các đường link đuôi .apk, không yêu cầu cung cấp mã OTP ngân hàng hay chuyển tiền vào tài khoản để "xác minh".
2. Ứng dụng VNeID chỉ được tải chính thức từ CH Play (Android) hoặc App Store (iOS).
3. Cổng thông tin chính thức của UBND Xã và Cổng Dịch vụ công quốc gia có tên miền đuôi .gov.vn.
4. Khi nhận được các cuộc gọi có dấu hiệu nghi vấn, người dân cần liên hệ ngay số Hotline Công an Xã Tân Triều: 024 3861 1234 để được xác minh kịp thời.`,
      category: 'an_ninh',
      author_id: 1,
      author_name: 'Công an Xã Tân Triều',
      cover_image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
      is_published: 1,
      is_featured: 1,
      views_count: 689
    },
    {
      title: 'Kế hoạch tiêm phòng mở rộng và khám sức khỏe định kỳ cho người cao tuổi tại Trạm Y tế xã Tân Triều',
      summary: 'Trạm Y tế xã tổ chức chương trình khám sàng lọc các bệnh mạn tính không lây nhiễm (huyết áp, tiểu đường) và tiêm chủng mở rộng cho trẻ em trong độ tuổi.',
      content: `Trạm Y tế Xã Tân Triều trân trọng thông báo lịch khám sức khỏe và tiêm chủng tháng này:
1. Đối tượng:
   - Người cao tuổi từ 60 tuổi trở lên có đăng ký thường trú hoặc tạm trú tại xã.
   - Trẻ em từ sơ sinh đến 5 tuổi trong chương trình tiêm chủng mở rộng.
2. Nội dung khám:
   - Đo huyết áp, khám tim mạch, tư vấn dinh dưỡng người cao tuổi.
   - Xét nghiệm đường huyết mao mạch miễn phí cho người trên 65 tuổi.
   - Tiêm các mũi vắc-xin theo lịch tiêm chủng mở rộng quốc gia.
3. Địa điểm: Trạm Y tế Xã Tân Triều, Đường Triều Khúc, Xã Tân Triều, Thanh Trì, Hà Nội.
Trân trọng kính mời bà con đến đúng lịch hẹn.`,
      category: 'thong_bao',
      author_id: 4,
      author_name: 'Trạm Y tế Xã Tân Triều',
      cover_image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
      is_published: 1,
      is_featured: 0,
      views_count: 245
    },
    {
      title: 'Công khai niêm yết thủ tục hành chính thuộc thẩm quyền giải quyết của UBND cấp xã năm 2026',
      summary: 'Bộ phận Tiếp nhận và Trả kết quả (Một cửa) xã Tân Triều công khai danh mục 152 thủ tục hành chính, quy trình rút ngắn thời gian và tiếp nhận hồ sơ trực tuyến.',
      content: `Thực hiện chỉ đạo của UBND Thành phố Hà Nội và UBND Huyện Thanh Trì về cải cách hành chính;

UBND Xã Tân Triều thực hiện niêm yết công khai toàn bộ 152 thủ tục hành chính thuộc thẩm quyền cấp xã tại bảng tin trụ sở UBND và trên Hệ thống điều hành điện tử:
- Lĩnh vực Tư pháp - Hộ tịch: Đăng ký khai sinh, kết hôn, khai tử, chứng thực bản sao, chứng thực chữ ký (thực hiện liên thông và giải quyết ngay trong ngày).
- Lĩnh vực Địa chính - Xây dựng: Cấp giấy phép xây dựng nhà ở riêng lẻ, trích lục hồ sơ địa chính.
- Lĩnh vực Lao động - Thương binh & Xã hội: Trợ cấp bảo trợ xã hội, mai táng phí.

Người dân có thể tra cứu mã thủ tục, biểu mẫu và nộp hồ sơ trực tuyến tại Cổng Dịch vụ công điện tử của xã để không phải đi lại nhiều lần.`,
      category: 'chinh_sach',
      author_id: 4,
      author_name: 'Văn phòng UBND Xã Tân Triều',
      cover_image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
      is_published: 1,
      is_featured: 0,
      views_count: 412
    }
  ];

  const insertNews = db.prepare(`
    INSERT INTO commune_news (title, summary, content, category, author_id, author_name, cover_image, is_published, is_featured, views_count)
    VALUES (@title, @summary, @content, @category, @author_id, @author_name, @cover_image, @is_published, @is_featured, @views_count)
  `);
  for (const n of communeNewsData) {
    insertNews.run(n);
  }

  // Nạp dữ liệu phân hệ HanoiWork OKR/KPI & AI Assistant
  try {
    const { seedKpiData } = require('./seed_kpi');
    seedKpiData();
  } catch (err) {
    console.error('Lỗi khi nạp seed KPI:', err);
  }

  console.log('--- Nạp dữ liệu mẫu thành công! Tất cả các bảng đã sẵn sàng. ---');
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
