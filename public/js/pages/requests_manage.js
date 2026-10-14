// Internal Citizen Requests Management Page (Quản lý hồ sơ yêu cầu công dân)
const RequestsManagePage = {
  async render() {
    const user = API.getUser();

    return `
      <div class="space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="clipboard-list" class="w-5 h-5 text-blue-700"></i>
              <span>${user.role === 'citizen' ? 'Hồ sơ đã gửi của tôi' : 'Quản lý yêu cầu trực tuyến của người dân'}</span>
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">Tiếp nhận, phân công, thụ lý và phản hồi kết quả giải quyết kiến nghị của công dân</p>
          </div>

          <a href="#citizen-portal" class="px-4 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition flex items-center gap-1.5 shadow-xs">
            <i data-lucide="plus" class="w-4 h-4"></i> Tạo yêu cầu mới
          </a>
        </div>

        <!-- Filter & Search -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Trạng thái hồ sơ</label>
              <select id="req-filter-status" onchange="RequestsManagePage.loadData()" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <option value="all">Tất cả trạng thái</option>
                <option value="received">Đã tiếp nhận</option>
                <option value="pending_assign">Chờ phân công</option>
                <option value="processing">Đang xử lý</option>
                <option value="need_info">Chờ bổ sung thông tin</option>
                <option value="resolved">Đã giải quyết</option>
                <option value="rejected">Từ chối giải quyết</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-600 mb-1">Loại yêu cầu</label>
              <select id="req-filter-cat" onchange="RequestsManagePage.loadData()" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <option value="all">Tất cả các nhóm</option>
                <option value="Phản ánh về môi trường">Môi trường, rác thải</option>
                <option value="Phản ánh về hạ tầng">Hạ tầng giao thông, điện nước</option>
                <option value="Kiến nghị, phản ánh">Trật tự đô thị, kiến nghị</option>
                <option value="Yêu cầu hỗ trợ hành chính">Hỗ trợ hành chính, hộ tịch</option>
                <option value="Đề nghị cung cấp thông tin">Cung cấp thông tin</option>
                <option value="Góp ý chất lượng phục vụ">Góp ý phục vụ</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-600 mb-1">Tìm kiếm</label>
              <input type="text" id="req-filter-search" oninput="RequestsManagePage.loadData()" placeholder="Mã hồ sơ, tên người gửi, tiêu đề..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
            </div>
          </div>
        </div>

        <!-- Data Table Container -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div class="overflow-x-auto text-xs">
            <table class="w-full text-left">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <tr>
                  <th class="p-3.5">Mã hồ sơ</th>
                  <th class="p-3.5">Người gửi</th>
                  <th class="p-3.5">Loại yêu cầu & Tiêu đề</th>
                  <th class="p-3.5">Bộ phận / Cán bộ thụ lý</th>
                  <th class="p-3.5">Thời gian gửi</th>
                  <th class="p-3.5">Trạng thái</th>
                  <th class="p-3.5">Đánh giá</th>
                  <th class="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody id="requests-tbody" class="divide-y divide-slate-100">
                <tr><td colspan="8" class="p-8 text-center text-slate-400">Đang tải hồ sơ...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  async loadData() {
    const status = document.getElementById('req-filter-status')?.value || 'all';
    const category = document.getElementById('req-filter-cat')?.value || 'all';
    const search = document.getElementById('req-filter-search')?.value || '';

    try {
      const requests = await API.getRequests({ status, category, search });
      const tbody = document.getElementById('requests-tbody');
      if (!tbody) return;

      if (!requests || requests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400">Không tìm thấy hồ sơ nào phù hợp</td></tr>`;
        return;
      }

      const statusBadges = {
        received: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Đã tiếp nhận</span>',
        pending_assign: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Chờ phân công</span>',
        processing: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Đang xử lý</span>',
        need_info: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">Chờ bổ sung</span>',
        resolved: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Đã giải quyết</span>',
        rejected: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Từ chối</span>',
        closed: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200 text-zinc-800">Đã đóng</span>'
      };

      const user = API.getUser();

      tbody.innerHTML = requests.map(r => `
        <tr class="hover:bg-slate-50 transition">
          <td class="p-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
            <a href="#request-tracking?code=${r.code}&verify=${encodeURIComponent(r.phone)}" class="hover:underline">
              ${r.code}
            </a>
          </td>
          <td class="p-3.5 whitespace-nowrap">
            <div class="font-bold text-slate-900">${r.citizen_name}</div>
            <div class="text-[10px] text-slate-400">${r.phone}</div>
          </td>
          <td class="p-3.5 max-w-sm">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 mb-0.5 inline-block">
              ${r.category}
            </span>
            <div class="font-semibold text-slate-900 line-clamp-1">${r.title}</div>
          </td>
          <td class="p-3.5 whitespace-nowrap">
            ${r.handler_name ? `
              <div class="font-semibold text-slate-800">${r.handler_name}</div>
              <div class="text-[10px] text-slate-400">${r.handler_dept || ''}</div>
            ` : '<span class="text-amber-600 italic">Chưa phân công</span>'}
          </td>
          <td class="p-3.5 font-mono text-slate-500 whitespace-nowrap">
            ${r.created_at?.split(' ')[0]}
          </td>
          <td class="p-3.5 whitespace-nowrap">
            ${statusBadges[r.status] || r.status}
          </td>
          <td class="p-3.5 whitespace-nowrap">
            ${r.rating_stars ? `
              <span class="font-bold text-amber-500 flex items-center gap-0.5">
                ${r.rating_stars} <i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i>
              </span>
            ` : '<span class="text-slate-300">-</span>'}
          </td>
          <td class="p-3.5 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1.5">
              <a href="#request-tracking?code=${r.code}&verify=${encodeURIComponent(r.phone)}" class="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100" title="Xem chi tiết tiến độ">
                <i data-lucide="eye" class="w-4 h-4"></i>
              </a>

              ${user.role !== 'citizen' ? `
                <button onclick="RequestsManagePage.openRespondModal(${r.id}, '${r.code}', '${r.title.replace(/'/g, "\\'")}')" class="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px]">
                  Xử lý / Phản hồi
                </button>
              ` : ''}

              ${user.role === 'citizen' && r.status === 'resolved' && !r.rating_stars ? `
                <button onclick="RequestTrackingPage.openRatingModal(${r.id}, '${r.code}')" class="px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-600 font-bold text-[11px]">
                  ★ Đánh giá
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `).join('');

      lucide.createIcons({ root: tbody });
    } catch (e) {
      console.error(e);
    }
  },

  // Modal Xử lý & Phản hồi kết quả của Cán bộ / Lãnh đạo
  async openRespondModal(requestId, requestCode, requestTitle) {
    const users = await API.getUsers({ role: 'officer' });
    const modal = document.createElement('div');
    modal.id = 'respond-request-modal';
    modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Thụ lý & Phản hồi hồ sơ</h3>
            <p class="text-slate-500 font-mono text-[11px]">${requestCode}: ${requestTitle}</p>
          </div>
          <button onclick="document.getElementById('respond-request-modal').remove()" class="text-slate-400 hover:text-slate-700">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="respond-request-form" class="py-4 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Trạng thái mới *</label>
              <select name="status" id="respond-status-select" onchange="RequestsManagePage.toggleRejectionField(this.value)" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold">
                <option value="processing">Đang xử lý / Thẩm tra</option>
                <option value="need_info">Yêu cầu bổ sung thông tin</option>
                <option value="resolved" selected>Đã giải quyết (Có kết quả)</option>
                <option value="rejected">Từ chối giải quyết</option>
                <option value="closed">Đóng hồ sơ</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Cán bộ phụ trách</label>
              <select name="handler_id" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <option value="">-- Chọn cán bộ --</option>
                ${users.map(u => `<option value="${u.id}">${u.full_name} (${u.department})</option>`).join('')}
              </select>
            </div>
          </div>

          <div id="rejection-reason-box" class="hidden">
            <label class="block font-bold text-rose-700 mb-1">Lý do từ chối giải quyết * (Bắt buộc theo quy định)</label>
            <textarea name="rejection_reason" id="rejection_reason_input" rows="2" placeholder="Ghi rõ cơ sở pháp lý hoặc lý do không thuộc thẩm quyền..." class="w-full p-2.5 rounded-xl border border-rose-300 bg-rose-50/50"></textarea>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Nội dung phản hồi / Kết quả giải quyết *</label>
            <textarea name="response_note" id="response_note_input" required rows="4" placeholder="Nhập kết quả xử lý, biện pháp đã khắc phục, thông tin phúc đáp người dân..." class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 leading-relaxed"></textarea>
          </div>

          <div class="pt-3 border-t flex justify-end gap-2">
            <button type="button" onclick="document.getElementById('respond-request-modal').remove()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">
              Hủy
            </button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md">
              Cập nhật & Phản hồi
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons({ root: modal });

    document.getElementById('respond-request-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const status = formData.get('status');
      const response_note = formData.get('response_note');
      const rejection_reason = formData.get('rejection_reason');

      if (status === 'rejected' && (!rejection_reason || !rejection_reason.trim())) {
        Modals.showToast('Bắt buộc phải ghi rõ lý do khi từ chối giải quyết', 'warning');
        return;
      }

      if (status === 'resolved' && (!response_note || !response_note.trim())) {
        Modals.showToast('Hồ sơ giải quyết bắt buộc phải có nội dung phản hồi', 'warning');
        return;
      }

      try {
        await API.respondRequest(requestId, {
          status,
          response_note,
          rejection_reason,
          handler_id: formData.get('handler_id') || null
        });
        modal.remove();
        Modals.showToast('Cập nhật kết quả giải quyết hồ sơ thành công', 'success');
        RequestsManagePage.loadData();
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  },

  toggleRejectionField(status) {
    const box = document.getElementById('rejection-reason-box');
    const note = document.getElementById('response_note_input');
    if (box) {
      if (status === 'rejected') {
        box.classList.remove('hidden');
        if (note) note.removeAttribute('required');
      } else {
        box.classList.add('hidden');
        if (note) note.setAttribute('required', 'required');
      }
    }
  },

  async afterRender() {
    this.loadData();
  }
};

window.RequestsManagePage = RequestsManagePage;
