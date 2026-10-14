// Create & Edit Outbound Document Form Page
const DocFormPage = {
  editDocId: null,

  async render() {
    const user = API.getUser();
    if (!user || user.role === 'citizen') {
      return `<div class="p-8 bg-white rounded-2xl border text-center text-slate-500">Bạn không có quyền soạn thảo công văn nội bộ</div>`;
    }

    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    this.editDocId = urlParams.get('edit');

    const isChairman = user.username === 'chutich' || (user.position && user.position.includes('Chủ tịch') && !user.position.includes('Phó'));
    const isViceChairman = user.username === 'phochutich' || (user.position && user.position.includes('Phó Chủ tịch'));

    let approverSectionHtml = '';
    if (isChairman) {
      approverSectionHtml = `
        <div class="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
          <div class="flex items-center gap-2 font-bold text-emerald-900 mb-1">
            <i data-lucide="check-circle" class="w-4 h-4 text-emerald-700"></i>
            <span>Thẩm quyền phê duyệt & ký ban hành: Chủ tịch UBND xã</span>
          </div>
          <p class="text-xs text-emerald-800/90 leading-relaxed">
            Văn bản do <strong>Chủ tịch UBND xã</strong> trực tiếp soạn thảo. Khi nhấn <strong>"Trình duyệt ngay"</strong>, văn bản sẽ được ký duyệt chính thức và tự động chuyển đến Bộ phận Văn thư để cấp số, đóng dấu và phát hành.
          </p>
        </div>
      `;
    } else if (isViceChairman) {
      approverSectionHtml = `
        <div class="p-4 rounded-2xl bg-blue-50/80 border border-blue-200">
          <div class="flex items-center gap-2 font-bold text-blue-900 mb-1">
            <i data-lucide="send" class="w-4 h-4 text-blue-700"></i>
            <span>Tuyến phê duyệt: Trình trực tiếp Chủ tịch UBND xã</span>
          </div>
          <p class="text-xs text-blue-800/90 leading-relaxed">
            Do đồng chí là <strong>Phó Chủ tịch UBND xã</strong> soạn thảo, theo quy chế làm việc, văn bản sẽ được bỏ qua bước thẩm định sơ bộ cấp 1 và chuyển trực tiếp tới <strong>Chủ tịch UBND xã (Trần Đình Thắng)</strong> để phê duyệt và ký ban hành.
          </p>
          <input type="hidden" name="target_approver_id" id="target_approver_input" value="2">
        </div>
      `;
    } else {
      approverSectionHtml = `
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <label class="block font-bold text-slate-800">Cấp lãnh đạo thẩm định / phê duyệt *</label>
          <select name="target_approver_id" id="target_approver_input" class="w-full p-3 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
            <option value="3" selected>Lê Thị Mai - Phó Chủ tịch UBND xã (Thẩm định Cấp 1 theo lĩnh vực phụ trách)</option>
            <option value="2">Trần Đình Thắng - Chủ tịch UBND xã (Trình trực tiếp Chủ tịch - Văn bản quan trọng/hỏa tốc)</option>
          </select>
          <p class="text-[11px] text-slate-500">
            Quy định: Cán bộ chuyên môn trình Phó Chủ tịch thẩm định trước khi chuyển Chủ tịch ký. Với văn bản hỏa tốc hoặc theo chỉ đạo trực tiếp của Chủ tịch, chọn trình thẳng Chủ tịch UBND xã.
          </p>
        </div>
      `;
    }

    return `
      <div class="max-w-4xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <a href="#doc-out" class="p-1 rounded-lg hover:bg-slate-200 text-slate-500">
                <i data-lucide="arrow-left" class="w-5 h-5"></i>
              </a>
              <h1 class="text-lg font-bold text-slate-900">
                ${this.editDocId ? 'Chỉnh sửa dự thảo công văn' : 'Soạn thảo công văn đi mới'}
              </h1>
            </div>
            <p class="text-xs text-slate-500 mt-1 pl-7">
              Nhập thông tin văn bản hành chính theo quy định Nghị định 30/2020/NĐ-CP
            </p>
          </div>

          <!-- Template Quick Select -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500 hidden sm:inline">Mẫu có sẵn:</span>
            <select id="template-select" onchange="DocFormPage.applyTemplate(this.value)" class="text-xs p-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
              <option value="">-- Chọn mẫu văn bản --</option>
              <option value="quyet_dinh">Quyết định hành chính</option>
              <option value="ke_hoach">Kế hoạch triển khai công tác</option>
              <option value="to_trinh">Tờ trình xin chủ trương</option>
              <option value="thong_bao">Thông báo lịch công tác/tiếp dân</option>
              <option value="cong_van">Công văn đôn đốc chỉ đạo</option>
            </select>
          </div>
        </div>

        <!-- Form Card -->
        <form id="doc-create-form" class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 text-xs">
          
          <!-- Lý do yêu cầu chỉnh sửa từ Lãnh đạo (Hiển thị khi văn bản cần sửa) -->
          <div id="edit-reason-banner" class="hidden p-5 rounded-2xl bg-amber-50/90 border-2 border-amber-300 shadow-xs space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-amber-200 pb-2.5">
              <div class="flex items-center gap-2 font-bold text-amber-950 text-sm">
                <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-600"></i>
                <span>Ý KIẾN CHỈ ĐẠO & LÝ DO YÊU CẦU CHỈNH SỬA</span>
              </div>
              <span id="edit-reason-time" class="text-[11px] text-amber-800 font-mono"></span>
            </div>

            <div class="text-xs text-amber-900">
              Lãnh đạo yêu cầu: <strong id="edit-reason-actor" class="text-amber-950 font-bold"></strong>
            </div>

            <div class="p-3.5 rounded-xl bg-white border border-amber-200 text-slate-800 shadow-2xs">
              <div class="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">Nội dung chi tiết cần bổ sung, chỉnh sửa:</div>
              <div id="edit-reason-text" class="text-xs font-serif italic text-slate-900 font-semibold leading-relaxed pl-3 border-l-2 border-amber-500"></div>
            </div>

            <div class="text-[11px] text-amber-800 flex items-center gap-1.5">
              <i data-lucide="info" class="w-4 h-4 text-amber-600 shrink-0"></i>
              <span>Vui lòng kiểm tra và sửa đổi các thông tin theo đúng ý kiến ở trên, sau đó nhấn <strong>"Trình duyệt ngay"</strong> để nộp lại cho Lãnh đạo.</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <!-- Loại văn bản -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Loại văn bản *</label>
              <select name="doc_type" id="doc_type_input" required class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
                <option value="Quyết định">Quyết định (Quy trình 3 cấp)</option>
                <option value="Kế hoạch">Kế hoạch (Quy trình 2 cấp)</option>
                <option value="Tờ trình">Tờ trình (Quy trình 2 cấp)</option>
                <option value="Thông báo">Thông báo (Quy trình 2 cấp)</option>
                <option value="Báo cáo">Báo cáo (Quy trình 2 cấp)</option>
                <option value="Công văn" selected>Công văn (Quy trình 2 cấp)</option>
                <option value="Giấy mời">Giấy mời (Quy trình 1 cấp)</option>
              </select>
            </div>

            <!-- Mức độ ưu tiên -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Mức độ ưu tiên *</label>
              <select name="priority" id="priority_input" class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
                <option value="normal" selected>Thường</option>
                <option value="urgent">Khẩn</option>
                <option value="emergency">Hỏa tốc</option>
              </select>
            </div>

          </div>

          <!-- Trích yếu nội dung -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Trích yếu nội dung văn bản *</label>
            <input type="text" name="subject" id="subject_input" required placeholder="Ví dụ: V/v Tăng cường công tác đảm bảo trật tự đô thị và an toàn giao thông..." class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <!-- Đơn vị / Cơ quan nhận -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Đơn vị / Nơi nhận văn bản *</label>
              <input type="text" name="recipient_unit" id="recipient_input" required placeholder="Ví dụ: Các thôn xóm, tổ dân phố, các ban ngành đoàn thể..." class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
            </div>

            <!-- Người ký -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Thẩm quyền ký ban hành</label>
              <select name="signer_title" id="signer_title_input" class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
                <option value="Chủ tịch UBND xã" selected>Chủ tịch UBND xã</option>
                <option value="Phó Chủ tịch UBND xã">Phó Chủ tịch UBND xã (Ký thay - KT. CHỦ TỊCH)</option>
                <option value="Ủy ban nhân dân xã">Ủy ban nhân dân xã</option>
              </select>
            </div>

          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Hạn xử lý nếu có -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Thời hạn xử lý (nếu có)</label>
              <input type="date" name="due_date" id="due_date_input" class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
            </div>

            <!-- Người soạn thảo (readonly) -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Cán bộ soạn thảo</label>
              <input type="text" disabled value="${user.full_name} (${user.department || user.position})" class="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-medium cursor-not-allowed">
            </div>
          </div>

          <!-- Tuyến phê duyệt thông minh theo vai trò -->
          ${approverSectionHtml}

          <!-- Nội dung chi tiết văn bản -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="font-bold text-slate-700">Nội dung chi tiết văn bản *</label>
              <span class="text-[11px] text-slate-400">Hỗ trợ định dạng văn bản hành chính</span>
            </div>
            <textarea name="content" id="content_input" rows="12" required placeholder="Nhập căn cứ pháp lý, nội dung điều khoản hoặc thông điệp văn bản..." class="w-full p-4 rounded-xl border border-slate-200 font-serif leading-relaxed text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"></textarea>
          </div>

          <!-- Tệp đính kèm -->
          <div class="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60">
            <div class="flex items-center justify-between mb-2">
              <div class="font-bold text-slate-800 flex items-center gap-1.5">
                <i data-lucide="paperclip" class="w-4 h-4 text-blue-600"></i>
                <span>Tài liệu đính kèm (DOCX, PDF, XLSX, Hình ảnh)</span>
              </div>
              <span class="text-[11px] text-slate-400">Tối đa 25MB</span>
            </div>
            <input type="file" id="doc_attachment_file" class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
          </div>

          <!-- Notice on Approval and Digital Signature -->
          <div class="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
            <i data-lucide="shield-alert" class="w-4 h-4 text-amber-700 shrink-0 mt-0.5"></i>
            <div>
              <strong>Lưu ý về quy trình phê duyệt & chữ ký số:</strong> Thao tác "Trình duyệt" sẽ chuyển công văn tới hộp thư của Lãnh đạo UBND có thẩm quyền theo quy trình cấu hình. Thao tác phê duyệt trên phần mềm phục vụ kiểm soát nội bộ. Khi ban hành chính thức, thực hiện ký số bằng USB Token/Chứng thư số Ban Cơ yếu Chính phủ theo Nghị định 30/2020/NĐ-CP.
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
            <a href="#doc-out" class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition">
              Hủy bỏ
            </a>

            <button type="button" onclick="DocFormPage.submitForm('draft')" class="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold transition shadow-xs flex items-center gap-1.5">
              <i data-lucide="save" class="w-4 h-4"></i> Lưu bản nháp
            </button>

            <button type="button" onclick="DocFormPage.submitForm('submit')" class="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold transition shadow-md flex items-center gap-1.5">
              <i data-lucide="send" class="w-4 h-4"></i> Trình duyệt ngay
            </button>
          </div>

        </form>

      </div>
    `;
  },

  applyTemplate(type) {
    const templates = {
      quyet_dinh: {
        doc_type: 'Quyết định',
        subject: 'V/v Thành lập Tổ kiểm tra trật tự xây dựng và quản lý đô thị xã Tân Triều năm 2026',
        recipient: 'Các thành viên có tên tại Điều 1; Các ban ngành liên quan',
        content: `Căn cứ Luật Tổ chức chính quyền địa phương ngày 19 tháng 6 năm 2015;\nCăn cứ Luật Xây dựng số 50/2014/QH13;\nXét đề nghị của Công chức Địa chính - Xây dựng - Đô thị và Môi trường,\n\nQUYẾT ĐỊNH:\nĐiều 1. Thành lập Tổ kiểm tra công tác trật tự xây dựng và quản lý đất đai trên địa bàn xã Tân Triều gồm các ông (bà) sau đây:\n1. Ông/Bà: ....................................... - Phó Chủ tịch UBND xã - Tổ trưởng;\n2. Ông/Bà: ....................................... - Công chức Địa chính - Xây dựng - Tổ phó;\n3. Ông/Bà: ....................................... - Trưởng Công an xã - Thành viên.\n\nĐiều 2. Tổ kiểm tra có trách nhiệm xây dựng lịch kiểm tra đột xuất và định kỳ, kiên quyết lập biên bản đình chỉ các công trình xây dựng không phép, sai phép, lấn chiếm hành lang an toàn giao thông.\n\nĐiều 3. Quyết định này có hiệu lực kể từ ngày ký.`
      },
      ke_hoach: {
        doc_type: 'Kế hoạch',
        subject: 'Kế hoạch tổng vệ sinh môi trường, thu gom rác thải chào mừng các ngày lễ lớn cuối năm',
        recipient: 'Toàn thể cán bộ, đảng viên, đoàn viên và nhân dân xã Tân Triều',
        content: `Thực hiện sự chỉ đạo của UBND huyện Thanh Trì về phong trào "Sáng - Xanh - Sạch - Đẹp";\nUBND xã Tân Triều xây dựng kế hoạch ra quân tổng vệ sinh môi trường như sau:\n1. Mục đích: Nâng cao ý thức tự giác giữ gìn vệ sinh môi trường trong cộng đồng dân cư, xóa bỏ các điểm chân rác tự phát.\n2. Thời gian: Bắt đầu từ 7h00 ngày Chủ nhật hàng tuần trong tháng 11/2026.\n3. Nội dung thực hiện: Khơi thông cống rãnh, quét dọn ngõ xóm, bóc dỡ biển quảng cáo rao vặt trái phép trên cột điện, tường rào.\n4. Phân công: Đoàn Thanh niên làm nòng cốt phối hợp Hội Phụ nữ và Tổ dân phố các thôn...`
      },
      to_trinh: {
        doc_type: 'Tờ trình',
        subject: 'Tờ trình V/v Xin phê duyệt kế hoạch tu bổ, tôn tạo Di tích lịch sử Đền Triều Khúc',
        recipient: 'Ủy ban nhân dân Huyện Thanh Trì, Phòng Văn hóa và Thông tin huyện',
        content: `Kính gửi: UBND huyện Thanh Trì, Phòng Văn hóa và Thông tin huyện.\n\nDi tích lịch sử Đền Triều Khúc là công trình văn hóa tâm linh có giá trị lịch sử lâu đời đã được xếp hạng. Hiện nay, một số hạng mục vì kèo gỗ lim và mái ngói cổ đã có hiện tượng thấm dột, xuống cấp do thời gian.\nĐể bảo tồn và phát huy giá trị di tích phục vụ nhân dân và du khách thập phương, UBND xã Tân Triều kính trình UBND huyện xem xét, phê duyệt chủ trương và hỗ trợ kinh phí tu bổ cấp thiết năm 2026-2027.`
      },
      thong_bao: {
        doc_type: 'Thông báo',
        subject: 'Thông báo về việc tiêm chủng mở rộng định kỳ cho trẻ em dưới 5 tuổi tháng 11/2026',
        recipient: 'Các gia đình có trẻ trong độ tuổi tiêm chủng trên địa bàn xã Tân Triều',
        content: `Trạm Y tế xã Tân Triều thông báo lịch tiêm chủng mở rộng tháng 11/2026 như sau:\n1. Thời gian: Từ ngày 05/11 đến ngày 07/11/2026 (Buổi sáng từ 7h30 đến 11h00).\n2. Địa điểm: Trạm Y tế xã Tân Triều (Số 12 đường Yên Xá).\n3. Các loại vắc xin tiêm đợt này: 5 trong 1, Bại liệt, Sởi - Rubella, Viêm não Nhật Bản.\nKính đề nghị các bậc phụ huynh mang theo sổ tiêm chủng của trẻ để theo dõi đầy đủ.`
      },
      cong_van: {
        doc_type: 'Công văn',
        subject: 'V/v Đôn đốc đẩy nhanh tiến độ thu các khoản phí, lệ phí và quỹ vận động năm 2026',
        recipient: 'Trưởng thôn Triều Khúc, Trưởng thôn Yên Xá và các tổ dân phố',
        content: `Thực hiện dự toán thu ngân sách nhà nước năm 2026;\nUBND xã Tân Triều yêu cầu Ban Chỉ đạo thu ngân sách xã, Trưởng các thôn xóm tập trung triển khai:\n1. Tăng cường tuyên truyền, vận động các hộ kinh doanh và hộ gia đình hoàn thành nộp thuế phi nông nghiệp đợt 2 trước ngày 30/11/2026.\n2. Bộ phận Tài chính - Kế toán phối hợp kho bạc rà soát, đối chiếu số liệu nộp ngân sách định kỳ thứ 6 hàng tuần.`
      }
    };

    const tpl = templates[type];
    if (tpl) {
      document.getElementById('doc_type_input').value = tpl.doc_type;
      document.getElementById('subject_input').value = tpl.subject;
      document.getElementById('recipient_input').value = tpl.recipient;
      document.getElementById('content_input').value = tpl.content;
      Modals.showToast(`Đã áp dụng mẫu ${tpl.doc_type}`, 'info');
    }
  },

  async submitForm(actionType) {
    const form = document.getElementById('doc-create-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const targetApproverEl = document.getElementById('target_approver_input');
    const targetApproverId = targetApproverEl && targetApproverEl.value ? parseInt(targetApproverEl.value) : null;

    const payload = {
      doc_type: document.getElementById('doc_type_input').value,
      priority: document.getElementById('priority_input').value,
      subject: document.getElementById('subject_input').value.trim(),
      recipient_unit: document.getElementById('recipient_input').value.trim(),
      signer_title: document.getElementById('signer_title_input').value,
      due_date: document.getElementById('due_date_input').value || null,
      content: document.getElementById('content_input').value.trim(),
      action_type: actionType,
      target_approver_id: targetApproverId
    };

    try {
      let docId = this.editDocId;
      if (this.editDocId) {
        await API.updateDocOut(this.editDocId, payload);
        if (actionType === 'submit') {
          await API.submitDocOut(this.editDocId, 'Trình duyệt lại văn bản sau khi cập nhật', targetApproverId);
        }
        Modals.showToast('Cập nhật văn bản thành công', 'success');
      } else {
        const res = await API.createDocOut(payload);
        docId = res.id;
        Modals.showToast(res.message, 'success');
      }

      // Upload file nếu có
      const fileInput = document.getElementById('doc_attachment_file');
      if (fileInput && fileInput.files && fileInput.files.length > 0 && docId) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('target_type', 'doc_out');
        formData.append('target_id', docId);
        await API.uploadFile(formData).catch(err => console.error('Upload error:', err));
      }

      window.location.hash = '#doc-out';
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  },

  async afterRender() {
    if (this.editDocId) {
      try {
        const doc = await API.getDocOutDetail(this.editDocId);
        if (doc) {
          document.getElementById('doc_type_input').value = doc.doc_type;
          document.getElementById('priority_input').value = doc.priority;
          document.getElementById('subject_input').value = doc.subject;
          document.getElementById('recipient_input').value = doc.recipient_unit;
          document.getElementById('signer_title_input').value = doc.signer_title || 'Chủ tịch UBND xã';
          if (doc.due_date) document.getElementById('due_date_input').value = doc.due_date;
          document.getElementById('content_input').value = doc.content || '';

          // Hiển thị lý do yêu cầu chỉnh sửa nếu văn bản có yêu cầu sửa
          if (doc.status === 'needs_edit' || doc.latest_edit_reason) {
            const editRequest = (doc.history && doc.history.slice().reverse().find(h => h.action === 'request_edit')) || {
              actor_name: doc.edit_requested_by || 'Lãnh đạo',
              actor_position: doc.edit_requested_by_position || '',
              comment: doc.latest_edit_reason,
              created_at: doc.edit_requested_at || ''
            };

            if (editRequest && editRequest.comment) {
              const banner = document.getElementById('edit-reason-banner');
              if (banner) {
                banner.classList.remove('hidden');
                document.getElementById('edit-reason-actor').innerText = `${editRequest.actor_name}${editRequest.actor_position ? ' (' + editRequest.actor_position + ')' : ''}`;
                document.getElementById('edit-reason-time').innerText = editRequest.created_at || '';
                document.getElementById('edit-reason-text').innerText = `"${editRequest.comment}"`;
                lucide.createIcons({ root: banner });
              }
            }
          }
        }
      } catch (e) {
        Modals.showToast('Lỗi tải văn bản để sửa: ' + e.message, 'error');
      }
    }
  }
};

window.DocFormPage = DocFormPage;
