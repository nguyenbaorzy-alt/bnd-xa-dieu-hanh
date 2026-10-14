const { db } = require('./db');

function seedKpiData() {
  console.log('--- Kiểm tra và khởi tạo dữ liệu mẫu HanoiWork & OKR/KPI ---');

  // 1. Danh mục Loại nhiệm vụ chuẩn & Hệ số quy đổi (KPI Task Types)
  const taskTypesCount = db.prepare('SELECT COUNT(*) as count FROM kpi_task_types').get().count;
  if (taskTypesCount === 0) {
    const insertType = db.prepare(`
      INSERT OR REPLACE INTO kpi_task_types (id, code, name, default_product, kpi_weight, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const standardTypes = [
      [1, 'KT-01', 'Soạn thảo văn bản quy phạm / Kế hoạch / Đề án chiến lược', 'Đề án / Kế hoạch được phê duyệt', 2.5, 'Xây dựng các văn bản có tính chiến lược, quy phạm hoặc kế hoạch công tác năm'],
      [2, 'KT-02', 'Soạn thảo văn bản hành chính / Tờ trình', 'Văn bản hành chính / Tờ trình đã duyệt', 1.0, 'Công văn đi, thông báo, tờ trình xin ý kiến, giấy mời'],
      [3, 'KT-03', 'Kiểm tra hiện trường & Lập biên bản xử lý vi phạm', 'Biên bản kiểm tra / Quyết định xử lý', 1.5, 'Kiểm tra trật tự xây dựng, đất đai, vệ sinh môi trường và xử lý vi phạm'],
      [4, 'KT-04', 'Giải quyết hồ sơ Thủ tục hành chính công', 'Kết quả TTHC đúng hạn', 1.2, 'Hồ sơ tư pháp, hộ tịch, chứng thực, xác nhận đất đai, chính sách xã hội'],
      [5, 'KT-05', 'Tuyên truyền, phổ biến pháp luật & Tiếp công dân', 'Hội nghị tổ chức / Tin bài tuyên truyền', 1.0, 'Phổ biến chủ trương chính sách, sinh hoạt chuyên đề, tiếp dân định kỳ'],
      [6, 'KT-06', 'Tổng hợp báo cáo định kỳ / Đột xuất', 'Báo cáo số liệu hoàn chỉnh', 1.0, 'Báo cáo tuần, tháng, quý, năm gửi UBND Huyện và Đảng ủy'],
      [7, 'KT-07', 'Làm sạch & Số hóa dữ liệu nghiệp vụ (Đề án 06)', 'Bản ghi số hóa chuẩn xác', 1.5, 'Làm sạch dữ liệu dân cư, hộ tịch, đất đai, số hóa hồ sơ lưu trữ'],
      [8, 'KT-08', 'Chỉ đạo điều hành & Thẩm định chuyên môn', 'Ý kiến chỉ đạo / Kết luận thẩm định', 2.0, 'Dành cho Lãnh đạo UBND và Lãnh đạo phụ trách bộ phận']
    ];

    for (const t of standardTypes) {
      insertType.run(...t);
    }
    console.log('✓ Đã nạp 8 loại nhiệm vụ chuẩn & hệ số quy đổi KPI.');
  }

  // 2. Dự án 3 Cấp HanoiWork (Projects, Folders, Action Programs)
  const projCount = db.prepare('SELECT COUNT(*) as count FROM kpi_projects').get().count;
  if (projCount === 0) {
    const insertProject = db.prepare(`
      INSERT INTO kpi_projects (id, code, name, category, description, start_date, end_date, status, lead_units, lead_user_ids, collab_units, collab_user_ids, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const projectsData = [
      [
        1,
        'DA-2026-01',
        'Chuyển đổi số toàn diện & Triển khai Đề án 06 Chính phủ năm 2026',
        'strategic',
        'Mũi nhọn chiến lược số hóa toàn bộ dữ liệu hộ tịch, liên thông TTHC trực tuyến và tích hợp cơ sở dữ liệu quốc gia về dân cư trên địa bàn xã.',
        '2026-01-01',
        '2026-12-31',
        'active',
        JSON.stringify(['Lãnh đạo UBND', 'Văn phòng - Thống kê']),
        JSON.stringify([2, 3, 4]),
        JSON.stringify(['Tư pháp - Hộ tịch', 'Địa chính - Xây dựng - Môi trường']),
        JSON.stringify([5, 6]),
        2
      ],
      [
        2,
        'DA-2026-02',
        'Quản lý, xử lý và nâng cao kỷ cương văn bản hành chính Quý 4/2026',
        'doc_mgmt',
        'Xử lý 100% công văn đến, công văn đi đúng hạn theo Nghị định 30/2020/NĐ-CP và chấm dứt văn bản quá hạn.',
        '2026-10-01',
        '2026-12-31',
        'active',
        JSON.stringify(['Văn phòng - Thống kê', 'Lãnh đạo UBND']),
        JSON.stringify([2, 4]),
        JSON.stringify(['Địa chính - Xây dựng - Môi trường', 'Tư pháp - Hộ tịch']),
        JSON.stringify([3, 5, 6]),
        2
      ],
      [
        3,
        'DA-2026-03',
        'Tăng cường quản lý trật tự xây dựng, đất đai và bảo vệ môi trường nông thôn',
        'regular',
        'Nhiệm vụ chuyên môn thường xuyên về rà soát quy hoạch, chống lấn chiếm đất công và duy trì vệ sinh môi trường.',
        '2026-01-01',
        '2026-12-31',
        'active',
        JSON.stringify(['Địa chính - Xây dựng - Môi trường', 'Lãnh đạo UBND']),
        JSON.stringify([3, 5]),
        JSON.stringify(['Văn phòng - Thống kê']),
        JSON.stringify([4]),
        3
      ],
      [
        4,
        'DA-2026-04',
        'Phương án cơ động phòng chống lụt bão và cứu nạn cứu hộ đột xuất năm 2026',
        'ad_hoc',
        'Phương án phản ứng nhanh xử lý sự cố đê điều, úng ngập mùa mưa bão và diễn tập phòng thủ dân sự cấp xã.',
        '2026-06-01',
        '2026-11-30',
        'active',
        JSON.stringify(['Lãnh đạo UBND']),
        JSON.stringify([2, 3]),
        JSON.stringify(['Địa chính - Xây dựng - Môi trường', 'Văn phòng - Thống kê']),
        JSON.stringify([4, 5]),
        2
      ]
    ];

    for (const p of projectsData) {
      insertProject.run(...p);
    }

    // Cấp 2: Thư mục / Nhóm lĩnh vực
    const insertFolder = db.prepare(`
      INSERT INTO kpi_folders (id, project_id, name, description)
      VALUES (?, ?, ?, ?)
    `);

    const foldersData = [
      [1, 1, 'Lĩnh vực Số hóa Dữ liệu & Đề án 06', 'Dữ liệu hộ tịch, dân cư, căn cước và bảo hiểm'],
      [2, 1, 'Lĩnh vực Dịch vụ công & TTHC liên thông', 'Số hóa kết quả TTHC và thanh toán không dùng tiền mặt'],
      [3, 3, 'Lĩnh vực Trật tự Xây dựng & Đô thị', 'Quản lý giấy phép xây dựng và trật tự đô thị'],
      [4, 3, 'Lĩnh vực Môi trường & Quản lý Đất công ích', 'Bảo vệ nguồn nước, vệ sinh môi trường và đất công ích']
    ];

    for (const f of foldersData) {
      insertFolder.run(...f);
    }

    // Cấp 3: Chương trình hành động
    const insertProgram = db.prepare(`
      INSERT INTO kpi_action_programs (id, project_id, folder_id, name, description, is_default, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const programsData = [
      [1, 1, 1, 'Chiến dịch làm sạch 1.500 hồ sơ hộ tịch và cư trú toàn xã', 'Đối chiếu dữ liệu hộ tịch sai lệch theo hướng dẫn của Bộ Công an và Bộ Tư pháp', 1, 'active'],
      [2, 1, 2, 'Mô hình ứng dụng thanh toán không dùng tiền mặt và số hóa kết quả TTHC', 'Triển khai mã QR động và chứng thực bản sao điện tử', 0, 'active'],
      [3, 2, null, 'Xử lý dứt điểm công văn đến tồn đọng và chuẩn hóa sổ văn thư điện tử', 'Chương trình hành động mặc định của dự án quản lý văn bản', 1, 'active'],
      [4, 3, 3, 'Kiểm tra 100% công trình xây dựng khởi công mới trên địa bàn', 'Thường xuyên thanh tra trật tự xây dựng các thôn, tổ dân phố', 1, 'active'],
      [5, 3, 4, 'Xóa các điểm tập kết rác thải tự phát và phát động Ngày Chủ nhật xanh', 'Phối hợp các đoàn thể ra quân dọn dẹp các tuyến ngõ', 0, 'active'],
      [6, 4, null, 'Kiểm tra an toàn đê điều và chuẩn bị vật tư PCTT&TKCN', 'Chương trình hành động mặc định trực thuộc dự án phòng chống bão lụt', 1, 'active']
    ];

    for (const prog of programsData) {
      insertProgram.run(...prog);
    }

    console.log('✓ Đã nạp cây dữ liệu 3 cấp HanoiWork (Dự án -> Thư mục -> Chương trình hành động).');
  }

  // 3. Nạp / Đồng bộ Tasks với dữ liệu KPI chuẩn
  // Gán project_id và action_program_id cho các tasks hiện có hoặc tạo thêm tasks mẫu có subtasks & KPI calculation
  const taskSampleCount = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE action_program_id IS NOT NULL').get().count;
  if (taskSampleCount === 0) {
    const updateExistingTask = db.prepare(`
      UPDATE tasks 
      SET project_id = ?, action_program_id = ?, task_type_id = ?, task_type_name = ?, target_product = ?,
          kpi_weight = ?, assigned_quantity = ?, assigned_kpi_score = ?, completed_quantity = ?,
          actual_completion_date = ?, delay_days = ?, raw_completed_kpi = ?, final_kpi_score = ?,
          lead_unit = ?, collab_units = ?, followers = ?, six_clear_status = ?
      WHERE id = ?
    `);

    // Task 1: Dọn bãi rác ngõ 111 (Completed, on-time)
    updateExistingTask.run(
      3, 5, 3, 'Kiểm tra hiện trường & Lập biên bản xử lý vi phạm', 'Biên bản kiểm tra / Quyết định xử lý',
      1.5, 1, 1.5, 1,
      '2026-10-13', 0, 1.5, 1.5,
      'Địa chính - Xây dựng - Môi trường', 'Văn phòng - Thống kê', JSON.stringify(['Lê Thị Mai']),
      JSON.stringify({ clear_person: true, clear_work: true, clear_time: true, clear_responsibility: true, clear_product: true, clear_authority: true, score: 6 }),
      1
    );

    // Task 2: Quy hoạch đất đai Vành đai 3 (In progress, urgent, due 2026-10-18)
    updateExistingTask.run(
      3, 4, 1, 'Soạn thảo văn bản quy phạm / Kế hoạch / Đề án chiến lược', 'Đề án / Kế hoạch được phê duyệt',
      2.5, 1, 2.5, 0,
      null, 0, 0, 0,
      'Địa chính - Xây dựng - Môi trường', 'Lãnh đạo UBND', JSON.stringify(['Trần Đình Thắng', 'Lê Thị Mai']),
      JSON.stringify({ clear_person: true, clear_work: true, clear_time: true, clear_responsibility: true, clear_product: true, clear_authority: true, score: 6 }),
      2
    );

    // Task 3: Ngày hội Đại đoàn kết (In progress, due 2026-10-25)
    updateExistingTask.run(
      1, 2, 5, 'Tuyên truyền, phổ biến pháp luật & Tiếp công dân', 'Hội nghị tổ chức / Tin bài tuyên truyền',
      1.0, 1, 1.0, 0,
      null, 0, 0, 0,
      'Văn phòng - Thống kê', 'Đoàn thể', JSON.stringify(['Lê Thị Mai']),
      JSON.stringify({ clear_person: true, clear_work: true, clear_time: true, clear_responsibility: true, clear_product: true, clear_authority: true, score: 6 }),
      3
    );

    // Task 4: Làm sạch dữ liệu hộ tịch (In progress, overdue!)
    updateExistingTask.run(
      1, 1, 7, 'Làm sạch & Số hóa dữ liệu nghiệp vụ (Đề án 06)', 'Bản ghi số hóa chuẩn xác',
      1.5, 120, 180.0, 40,
      null, 0, 0, 0,
      'Văn phòng - Thống kê', 'Tư pháp - Hộ tịch', JSON.stringify(['Lê Thị Mai']),
      JSON.stringify({ clear_person: true, clear_work: true, clear_time: true, clear_responsibility: true, clear_product: true, clear_authority: true, score: 6 }),
      4
    );

    // Thêm các nhiệm vụ minh họa đầy đủ các phân nhóm thống kê và công thức tính điểm KPI:
    const insertNewTask = db.prepare(`
      INSERT INTO tasks (
        title, description, project_id, action_program_id, parent_task_id,
        creator_id, assignee_id, assigned_date, due_date, actual_completion_date,
        priority, progress_percent, status, result_note,
        task_type_id, task_type_name, target_product, kpi_weight,
        assigned_quantity, assigned_kpi_score, completed_quantity,
        delay_days, raw_completed_kpi, final_kpi_score, calc_by_subtasks,
        lead_unit, collab_units, followers, six_clear_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Task 5: Nhiệm vụ MẸ (Lãnh đạo chủ trì, Phân rã thành nhiệm vụ con, Tính KPI theo nhiệm vụ con)
    const resMother = insertNewTask.run(
      'Kế hoạch triển khai cao điểm đối chiếu làm sạch dữ liệu hộ tịch xã Tân Triều',
      'Đ/c Phó Chủ tịch Lê Thị Mai chủ trì chung, phân rã công việc cho chuyên viên Văn phòng Phạm Hùng Cường thực hiện từng đợt.',
      1, 1, null,
      2, 3, '2026-10-01', '2026-10-15', null,
      'urgent', 65, 'in_progress', 'Đã phân rã thành 2 nhiệm vụ con cho chuyên viên.',
      1, 'Soạn thảo văn bản quy phạm / Kế hoạch / Đề án chiến lược', 'Kế hoạch triển khai hoàn chỉnh', 2.5,
      1, 2.5, 0,
      0, 0, 0, 1,
      'Lãnh đạo UBND', 'Văn phòng - Thống kê', JSON.stringify(['Trần Đình Thắng']),
      JSON.stringify({ clear_person: true, clear_work: true, clear_time: true, clear_responsibility: true, clear_product: true, clear_authority: true, score: 6 })
    );
    const motherId = resMother.lastInsertRowid;

    // Subtask 5.1: Nhiệm vụ con 1 (Đã hoàn thành ĐÚNG HẠN -> Nhận đủ 100% KPI)
    insertNewTask.run(
      'Đợt 1: Bóc tách và rà soát 200 bản ghi dữ liệu hộ tịch giai đoạn 2018-2021',
      'Nhiệm vụ con phân rã từ Kế hoạch làm sạch dữ liệu hộ tịch. Thực hiện đối chiếu thủ công với tàng thư lưu trữ.',
      1, 1, motherId,
      3, 4, '2026-10-01', '2026-10-08', '2026-10-08',
      'normal', 100, 'completed', 'Đã hoàn thành đối chiếu chính xác 200 bản ghi, xuất file CSV đồng bộ lên hệ thống.',
      7, 'Làm sạch & Số hóa dữ liệu nghiệp vụ (Đề án 06)', 'Bản ghi số hóa chuẩn xác', 1.5,
      200, 300.0, 200,
      0, 300.0, 300.0, 0,
      'Văn phòng - Thống kê', '', JSON.stringify(['Lê Thị Mai']),
      JSON.stringify({ clear_person: true, clear_work: true, clear_time: true, clear_responsibility: true, clear_product: true, clear_authority: true, score: 6 })
    );

    // Subtask 5.2: Nhiệm vụ con 2 (Đã hoàn thành nhưng MUỘN 1 NGÀY -> Bị phạt 25% KPI)
    // Hệ số 1.5 * 100 = 150 điểm quy đổi. Chậm 1 ngày: Phạt 25% * 150 = 37.5 điểm -> Điểm thực nhận = 112.5 điểm
    insertNewTask.run(
      'Đợt 2: Xác minh 100 hồ sơ hộ tịch có yếu tố nước ngoài hoặc sai lệch thông tin mẹ',
      'Thực hiện theo chỉ đạo của Lãnh đạo UBND xã. Hoàn thành muộn 1 ngày so với hạn do cần đợi xác minh từ Công an xã.',
      1, 1, motherId,
      3, 4, '2026-10-05', '2026-10-10', '2026-10-11',
      'urgent', 100, 'completed', 'Đã hoàn thành xác minh đầy đủ 100 hồ sơ có chữ ký xác nhận của cán bộ công an phụ trách.',
      7, 'Làm sạch & Số hóa dữ liệu nghiệp vụ (Đề án 06)', 'Bản ghi số hóa chuẩn xác', 1.5,
      100, 150.0, 100,
      1, 150.0, 112.5, 0,
      'Văn phòng - Thống kê', 'Tư pháp - Hộ tịch', JSON.stringify(['Lê Thị Mai']),
      JSON.stringify({ clear_person: true, clear_work: true, clear_time: true, clear_responsibility: true, clear_product: true, clear_authority: true, score: 6 })
    );

    // Task 6: Nhiệm vụ Chưa hoàn thành - CHƯA TỚI HẠN (Due: 2026-10-28)
    insertNewTask.run(
      'Triển khai dán mã QR phục vụ thanh toán trực tuyến tại Bộ phận một cửa',
      'Phối hợp ngân hàng và VNPT lắp đặt bảng hướng dẫn và QR động tại các quầy tiếp nhận hồ sơ.',
      1, 2, null,
      2, 4, '2026-10-12', '2026-10-28', null,
      'normal', 40, 'in_progress', 'Đã nhận bàn giao biển bảng mica, đang test thử nghiệm giao dịch.',
      4, 'Giải quyết hồ sơ Thủ tục hành chính công', 'Kết quả TTHC đúng hạn', 1.2,
      5, 6.0, 0,
      0, 0, 0, 0,
      'Văn phòng - Thống kê', 'Kế toán xã', JSON.stringify(['Trần Đình Thắng']),
      JSON.stringify({ clear_person: true, clear_work: true, clear_time: true, clear_responsibility: true, clear_product: true, clear_authority: true, score: 6 })
    );

    // Task 7: Nhiệm vụ Chưa hoàn thành - QUÁ HẠN (Due: 2026-10-12, hôm nay 14/10)
    insertNewTask.run(
      'Báo cáo kiểm tra xử lý vi phạm xây dựng trên đất nông nghiệp xứ đồng Cầu',
      'Lập hồ sơ xử phạt vi phạm hành chính đối với trường hợp xây tường rào lấn mương tưới tiêu.',
      3, 4, null,
      3, 5, '2026-10-02', '2026-10-12', null,
      'urgent', 60, 'overdue', 'Đang chờ biên bản đo đạc hiện trạng từ Văn phòng Đăng ký đất đai.',
      3, 'Kiểm tra hiện trường & Lập biên bản xử lý vi phạm', 'Biên bản kiểm tra / Quyết định xử lý', 1.5,
      1, 1.5, 0,
      2, 0, 0, 0,
      'Địa chính - Xây dựng - Môi trường', 'Lãnh đạo UBND', JSON.stringify(['Lê Thị Mai']),
      JSON.stringify({ clear_person: true, clear_work: true, clear_time: true, clear_responsibility: true, clear_product: true, clear_authority: true, score: 6 })
    );

    // Task 8: Nhiệm vụ Chưa hoàn thành - CHƯA CÓ HẠN (No deadline)
    insertNewTask.run(
      'Khảo sát nhu cầu đào tạo kỹ năng số cho cán bộ công chức UBND xã',
      'Lập phiếu khảo sát lấy ý kiến toàn bộ cán bộ công chức phục vụ kế hoạch đào tạo năm 2027.',
      1, 2, null,
      2, 4, '2026-10-10', '', null,
      'normal', 15, 'pending', 'Đang xây dựng mẫu phiếu khảo sát Google Form.',
      6, 'Tổng hợp báo cáo định kỳ / Đột xuất', 'Báo cáo số liệu hoàn chỉnh', 1.0,
      1, 1.0, 0,
      0, 0, 0, 0,
      'Văn phòng - Thống kê', 'Toàn thể CBCC', JSON.stringify(['Trần Đình Thắng']),
      JSON.stringify({ clear_person: true, clear_work: true, clear_time: false, clear_responsibility: true, clear_product: true, clear_authority: true, score: 5 })
    );

    console.log('✓ Đã cập nhật và nạp nhiệm vụ mẫu chuẩn thuật toán KPI HanoiWork.');
  }

  // Đảm bảo có ít nhất 1 nhiệm vụ không có hạn hoàn thành (No deadline) để phục vụ biểu đồ thống kê
  const noDeadlineTask = db.prepare("SELECT id FROM tasks WHERE due_date = '' OR due_date IS NULL").get();
  if (!noDeadlineTask) {
    db.prepare(`
      INSERT INTO tasks (
        title, description, project_id, action_program_id, parent_task_id,
        creator_id, assignee_id, assigned_date, due_date, actual_completion_date,
        priority, progress_percent, status, result_note,
        task_type_id, task_type_name, target_product, kpi_weight,
        assigned_quantity, assigned_kpi_score, completed_quantity,
        delay_days, raw_completed_kpi, final_kpi_score, calc_by_subtasks,
        lead_unit, collab_units, followers, six_clear_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Khảo sát nhu cầu đào tạo kỹ năng số cho cán bộ công chức UBND xã',
      'Lập phiếu khảo sát lấy ý kiến toàn bộ cán bộ công chức phục vụ kế hoạch đào tạo năm 2027.',
      1, 2, null,
      2, 4, '2026-10-10', '', null,
      'normal', 15, 'pending', 'Đang xây dựng mẫu phiếu khảo sát Google Form.',
      6, 'Tổng hợp báo cáo định kỳ / Đột xuất', 'Báo cáo số liệu hoàn chỉnh', 1.0,
      1, 1.0, 0,
      0, 0, 0, 0,
      'Văn phòng - Thống kê', 'Toàn thể CBCC', JSON.stringify(['Trần Đình Thắng']),
      JSON.stringify({ clear_person: true, clear_work: true, clear_time: false, clear_responsibility: true, clear_product: true, clear_authority: true, score: 5 })
    );
    console.log('✓ Đã bổ sung nhiệm vụ mẫu Chưa có hạn (No deadline).');
  }

  console.log('Hoàn tất kiểm tra dữ liệu mẫu HanoiWork.');
}

module.exports = { seedKpiData };

if (require.main === module) {
  seedKpiData();
}
