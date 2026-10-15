// Citizen Online Request Portal (Cổng gửi yêu cầu trực tuyến)
const CitizenPortalPage = {
  submittedCode: null,

  async render() {
    const user = API.getUser() || {};

    return `
      <div class="max-w-3xl mx-auto space-y-6">
        
        <!-- Header Banner -->
        <div class="rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
          <div class="max-w-xl">
            <span class="px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-md">
              Cổng Dịch vụ trực tuyến UBND Xã Tân Triều
            </span>
            <h1 class="text-xl sm:text-2xl font-bold mt-2">
              Gửi yêu cầu, kiến nghị & phản ánh trực tuyến
            </h1>
            <p class="text-xs text-blue-100 mt-2 leading-relaxed">
              Tiếp nhận ý kiến đóng góp, phản ánh hiện trường môi trường, hạ tầng và hỗ trợ thủ tục hành chính. Hệ thống tự động cấp Mã hồ sơ duy nhất để quý công dân theo dõi tiến độ.
            </p>
            <div class="mt-3.5 flex items-center gap-2">
              ${!user.id ? `
                <a href="#login" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md transition border border-white/20 shadow-xs">
                  <i data-lucide="user-check" class="w-3.5 h-3.5 text-amber-300"></i>
                  <span>Đăng nhập / Tạo tài khoản công dân</span>
                </a>
              ` : `
                <span class="text-xs text-emerald-300 flex items-center gap-1.5 font-semibold bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-500/30">
                  <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-400"></i>
                  <span>Công dân: ${user.full_name} ${user.cccd ? `(CCCD: ${user.cccd})` : ''}</span>
                </span>
              `}
            </div>
          </div>
        </div>

        ${user.cccd ? `
          <div class="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
                🪪
              </div>
              <div>
                <div class="font-bold flex items-center gap-1.5 text-emerald-900 flex-wrap">
                  <span>Hồ sơ công dân điện tử đã định danh Đề án 06</span>
                  <span class="text-[9px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-black">
                    ${user.chip_serial ? '✓ ĐÃ ĐẠT MỨC 2 (VNeID)' : 'MỨC 1 (ĐÃ LIÊN KẾT CCCD & SĐT)'}
                  </span>
                </div>
                <div class="text-[11px] text-emerald-800 mt-0.5">
                  Họ tên: <b>${user.full_name}</b> • CCCD: <b class="font-mono">${user.cccd}</b> ${user.birthplace ? `• Nơi sinh: <b>${user.birthplace}</b>` : ''}
                </div>
              </div>
            </div>
            <button type="button" onclick="Modals.openInWebEkycModal()" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs whitespace-nowrap">
              <i data-lucide="scan-face" class="w-4 h-4 text-amber-300"></i>
              <span>Quét thẻ NFC & Khuôn mặt</span>
            </button>
          </div>
        ` : ''}

        <div id="request-result-container"></div>

        <!-- Submission Form -->
        <div id="request-form-card" class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 text-xs">
          
          <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <i data-lucide="edit-3" class="w-4 h-4 text-blue-700"></i>
              <span>Thông tin người gửi & nội dung yêu cầu</span>
            </h2>
            <span class="text-slate-400 text-[11px]">* Trường bắt buộc điền</span>
          </div>

          <form id="citizen-request-form" class="space-y-4">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Họ và tên -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Họ và tên công dân *</label>
                <input type="text" name="citizen_name" required value="${user.full_name || ''}" placeholder="Nguyễn Văn A..." class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden" ${user.full_name ? 'readonly' : ''}>
              </div>

              <!-- Số điện thoại -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
                <input type="tel" name="phone" required value="${user.phone || ''}" placeholder="0912345678..." class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Email -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Địa chỉ Email (Nhận thông báo)</label>
                <input type="email" name="email" value="${user.email || ''}" placeholder="email@gmail.com..." class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
              </div>

              <!-- Địa chỉ cư trú -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Địa chỉ nơi cư trú / xảy ra sự việc</label>
                <input type="text" name="address" value="${user.address || ''}" placeholder="Thôn Triều Khúc / Thôn Yên Xá..." class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
              </div>
            </div>

            <!-- Loại yêu cầu -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Phân nhóm loại yêu cầu *</label>
              <select name="category" required class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
                <option value="Phản ánh về môi trường" selected>Phản ánh về môi trường, rác thải, ô nhiễm</option>
                <option value="Phản ánh về hạ tầng">Phản ánh về hạ tầng giao thông, điện chiếu sáng, cấp thoát nước</option>
                <option value="Kiến nghị, phản ánh">Kiến nghị, phản ánh về trật tự đô thị, lấn chiếm vỉa hè</option>
                <option value="Yêu cầu hỗ trợ hành chính">Yêu cầu hỗ trợ thủ tục hành chính, hộ tịch, bản sao</option>
                <option value="Đề nghị cung cấp thông tin">Đề nghị cung cấp thông tin quy hoạch, đất đai</option>
                <option value="Góp ý chất lượng phục vụ">Góp ý về văn hóa công vụ và chất lượng phục vụ</option>
                <option value="Yêu cầu khác">Yêu cầu khác</option>
              </select>
            </div>

            <!-- Tiêu đề -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Tiêu đề yêu cầu / phản ánh *</label>
              <input type="text" name="title" required placeholder="Tóm tắt ngắn gọn nội dung cần kiến nghị..." class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
            </div>

            <!-- Nội dung chi tiết -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Nội dung chi tiết *</label>
              <textarea name="content" rows="6" required placeholder="Mô tả cụ thể thời gian, địa điểm, sự việc và nguyện vọng giải quyết của quý công dân..." class="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden leading-relaxed"></textarea>
            </div>

            <!-- Tệp đính kèm -->
            <div class="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50">
              <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <i data-lucide="image" class="w-4 h-4 text-blue-600"></i>
                <span>Hình ảnh hiện trường hoặc tài liệu kèm theo (Tùy chọn)</span>
              </label>
              <input type="file" id="request-file-input" class="w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
            </div>

            <!-- Submit -->
            <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span class="text-slate-400 text-[11px]">Thông tin của công dân được bảo mật theo quy định</span>
              <button type="submit" class="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-bold text-xs hover:shadow-lg transition flex items-center gap-2">
                <i data-lucide="send" class="w-4 h-4"></i>
                <span>Gửi yêu cầu trực tuyến</span>
              </button>
            </div>

          </form>

        </div>

      </div>
    `;
  },

  async afterRender() {
    const form = document.getElementById('citizen-request-form');
    if (!form) return;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const user = API.getUser() || {};
      const formData = new FormData(form);
      const payload = {
        citizen_name: formData.get('citizen_name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
        category: formData.get('category'),
        title: formData.get('title'),
        content: formData.get('content'),
        cccd: user.cccd || null,
        is_ekyc_verified: user.ekyc_status === 'verified' ? 1 : 0
      };

      try {
        const res = await API.submitPublicRequest(payload);
        const container = document.getElementById('request-result-container');
        const formCard = document.getElementById('request-form-card');

        if (container) {
          container.innerHTML = `
            <div class="bg-emerald-50 border border-emerald-300 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-sm animate-in fade-in zoom-in-95">
              <div class="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-2xl font-bold shadow-md">
                ✓
              </div>
              <h2 class="text-lg font-bold text-emerald-950">Gửi yêu cầu thành công!</h2>
              <p class="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                UBND Xã Tân Triều đã tiếp nhận thông tin và phân công cán bộ chuyên môn thụ lý hồ sơ của quý công dân.
              </p>
              
              <div class="p-4 bg-white rounded-2xl border border-emerald-200 inline-block shadow-xs">
                <div class="text-[11px] text-slate-500 font-medium">MÃ HỒ SƠ ĐỂ TRA CỨU:</div>
                <div class="text-2xl font-black font-mono text-blue-700 tracking-wider my-1">${res.code}</div>
                <div class="text-[10px] text-slate-400">Vui lòng lưu lại mã này cùng số điện thoại để tra cứu tiến độ</div>
              </div>

              <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a href="#request-tracking?code=${res.code}&verify=${encodeURIComponent(payload.phone)}" class="px-5 py-2.5 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition shadow-xs">
                  Tra cứu tiến độ hồ sơ ngay
                </a>
                <button onclick="CitizenPortalPage.resetForm()" class="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition">
                  Gửi yêu cầu khác
                </button>
              </div>
            </div>
          `;
          if (formCard) formCard.classList.add('hidden');
          lucide.createIcons({ root: container });
        }

        // Upload attachment if any
        const fileInput = document.getElementById('request-file-input');
        if (fileInput && fileInput.files && fileInput.files.length > 0 && res.id) {
          const uploadData = new FormData();
          uploadData.append('file', fileInput.files[0]);
          uploadData.append('target_type', 'request');
          uploadData.append('target_id', res.id);
          await API.uploadFile(uploadData).catch(e => console.error(e));
        }

        Modals.showToast('Gửi yêu cầu thành công!', 'success');
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  },

  resetForm() {
    const container = document.getElementById('request-result-container');
    const formCard = document.getElementById('request-form-card');
    if (container) container.innerHTML = '';
    if (formCard) formCard.classList.remove('hidden');
  }
};

window.CitizenPortalPage = CitizenPortalPage;
