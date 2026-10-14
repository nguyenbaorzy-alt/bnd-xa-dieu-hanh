// Inbound Documents (Công văn đến) Management Page
const DocInPage = {
  async render() {
    const user = API.getUser();
    if (user && user.role === 'citizen') {
      return `<div class="p-8 bg-white rounded-2xl border text-center text-slate-500">Bạn không có quyền truy cập công văn đến</div>`;
    }

    return `
      <div class="space-y-6">
        
        <!-- Header & Action -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="inbox" class="w-5 h-5 text-blue-700"></i>
              <span>Quản lý Công văn đến</span>
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">Tiếp nhận văn bản từ cấp trên, phân công xử lý và theo dõi hạn giải quyết</p>
          </div>

          <button onclick="DocInPage.openCreateModal()" class="px-4 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition flex items-center gap-1.5 shadow-xs">
            <i data-lucide="plus" class="w-4 h-4"></i> Tiếp nhận công văn mới
          </button>
        </div>

        <!-- Filter & Search -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Trạng thái xử lý</label>
              <select id="filter-in-status" onchange="DocInPage.loadData()" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <option value="all">Tất cả trạng thái</option>
                <option value="received">Mới tiếp nhận</option>
                <option value="pending_assign">Chờ phân công</option>
                <option value="processing">Đang xử lý</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="overdue">Quá hạn</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-600 mb-1">Mức độ ưu tiên</label>
              <select id="filter-in-priority" onchange="DocInPage.loadData()" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <option value="all">Tất cả</option>
                <option value="normal">Thường</option>
                <option value="urgent">Khẩn</option>
                <option value="emergency">Hỏa tốc</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-600 mb-1">Tìm kiếm</label>
              <input type="text" id="filter-in-search" oninput="DocInPage.loadData()" placeholder="Số đến, số gốc, trích yếu, nơi gửi..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
            </div>
          </div>
        </div>

        <!-- Table Container -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div class="overflow-x-auto text-xs">
            <table class="w-full text-left">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <tr>
                  <th class="p-3.5">Số đến / Số gốc</th>
                  <th class="p-3.5">Cơ quan gửi</th>
                  <th class="p-3.5">Trích yếu nội dung</th>
                  <th class="p-3.5">Lãnh đạo / Cán bộ xử lý</th>
                  <th class="p-3.5">Hạn xử lý</th>
                  <th class="p-3.5">Trạng thái</th>
                  <th class="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody id="doc-in-tbody" class="divide-y divide-slate-100">
                <tr><td colspan="7" class="p-8 text-center text-slate-400">Đang tải công văn đến...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  async loadData() {
    const status = document.getElementById('filter-in-status')?.value || 'all';
    const priority = document.getElementById('filter-in-priority')?.value || 'all';
    const search = document.getElementById('filter-in-search')?.value || '';

    try {
      const docs = await API.getDocInList({ status, priority, search });
      const tbody = document.getElementById('doc-in-tbody');
      if (!tbody) return;

      if (!docs || docs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">Không tìm thấy công văn đến nào</td></tr>`;
        return;
      }

      const statusMap = {
        received: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Mới tiếp nhận</span>',
        pending_assign: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Chờ phân công</span>',
        processing: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Đang xử lý</span>',
        completed: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Đã xử lý xong</span>',
        overdue: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Quá hạn</span>'
      };

      const user = API.getUser();

      tbody.innerHTML = docs.map(d => `
        <tr class="hover:bg-slate-50 transition">
          <td class="p-3.5 whitespace-nowrap">
            <div class="font-mono font-bold text-blue-700">${d.incoming_number}</div>
            <div class="font-mono text-[10px] text-slate-400">Gốc: ${d.original_number}</div>
          </td>
          <td class="p-3.5 max-w-[150px] truncate text-slate-700 font-semibold" title="${d.sender_agency}">
            ${d.sender_agency}
          </td>
          <td class="p-3.5 max-w-sm">
            <span class="font-semibold text-slate-900 block line-clamp-2">${d.subject}</span>
            <div class="text-[10px] text-slate-400 mt-0.5">Tiếp nhận: ${d.received_date}</div>
            ${d.directive ? `<div class="mt-1 p-1.5 rounded-lg bg-blue-50/60 border border-blue-100 text-blue-900 text-[11px] italic">Chỉ đạo: "${d.directive}"</div>` : ''}
          </td>
          <td class="p-3.5 whitespace-nowrap">
            ${d.handler_name ? `
              <div class="font-bold text-slate-800">${d.handler_name}</div>
              <div class="text-[10px] text-slate-400">${d.handler_dept || ''}</div>
            ` : '<span class="text-amber-600 italic">Chưa giao cán bộ</span>'}
          </td>
          <td class="p-3.5 whitespace-nowrap">
            <span class="font-mono ${d.status === 'overdue' ? 'text-rose-600 font-bold' : 'text-slate-600'}">
              ${d.due_date || 'Không có'}
            </span>
          </td>
          <td class="p-3.5 whitespace-nowrap">
            ${statusMap[d.status] || d.status}
          </td>
          <td class="p-3.5 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1.5">
              ${(user.role === 'leader' || user.role === 'admin') ? `
                <button onclick="DocInPage.openAssignModal(${d.id})" class="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px]">
                  Giao việc
                </button>
              ` : ''}

              <button onclick="DocInPage.openProgressModal(${d.id})" class="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px]">
                Cập nhật kết quả
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      lucide.createIcons({ root: tbody });
    } catch (e) {
      console.error(e);
    }
  },

  // Modal tiếp nhận công văn đến mới
  openCreateModal() {
    const modal = document.createElement('div');
    modal.id = 'create-doc-in-modal';
    modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <i data-lucide="inbox" class="w-5 h-5 text-blue-700"></i>
            <span>Tiếp nhận công văn đến mới</span>
          </h3>
          <button onclick="document.getElementById('create-doc-in-modal').remove()" class="text-slate-400 hover:text-slate-700">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="doc-in-form" class="py-4 space-y-4 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Số ký hiệu văn bản gốc *</label>
              <input type="text" name="original_number" required placeholder="Ví dụ: 124/UBND-NV" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Ngày văn bản gốc *</label>
              <input type="date" name="doc_date" required value="${new Date().toISOString().split('T')[0]}" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Cơ quan gửi *</label>
              <input type="text" name="sender_agency" required placeholder="Ví dụ: UBND Huyện Thanh Trì..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Loại văn bản *</label>
              <select name="doc_type" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <option value="Công văn" selected>Công văn</option>
                <option value="Quyết định">Quyết định</option>
                <option value="Kế hoạch">Kế hoạch</option>
                <option value="Thông báo">Thông báo</option>
                <option value="Chỉ thị">Chỉ thị</option>
                <option value="Giấy mời">Giấy mời</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Trích yếu nội dung *</label>
            <textarea name="subject" rows="3" required placeholder="Nhập tóm tắt nội dung công văn đến..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Mức độ ưu tiên</label>
              <select name="priority" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <option value="normal">Thường</option>
                <option value="urgent">Khẩn</option>
                <option value="emergency">Hỏa tốc</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Hạn xử lý nếu có</label>
              <input type="date" name="due_date" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button type="button" onclick="document.getElementById('create-doc-in-modal').remove()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">
              Hủy
            </button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 shadow-md">
              Tiếp nhận & Vào sổ
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons({ root: modal });

    document.getElementById('doc-in-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const payload = Object.fromEntries(formData.entries());

      try {
        const res = await API.createDocIn(payload);
        modal.remove();
        Modals.showToast(`Đã tiếp nhận công văn đến số: ${res.incoming_number}`, 'success');
        DocInPage.loadData();
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  },

  // Modal Giao việc & Chỉ đạo của Lãnh đạo
  async openAssignModal(docInId) {
    const users = await API.getUsers({ role: 'officer' });
    const modal = document.createElement('div');
    modal.id = 'assign-modal';
    modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
        <h3 class="text-sm font-bold text-slate-900 pb-3 border-b flex items-center gap-2">
          <i data-lucide="user-check" class="w-4 h-4 text-blue-600"></i> Giao cán bộ xử lý công văn đến
        </h3>
        
        <form id="assign-form" class="py-4 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Cán bộ phụ trách xử lý *</label>
            <select name="handler_id" required class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <option value="">-- Chọn cán bộ, công chức --</option>
              ${users.map(u => `<option value="${u.id}">${u.full_name} (${u.department})</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Ý kiến chỉ đạo của Lãnh đạo</label>
            <textarea name="directive" rows="3" placeholder="Nhập ý kiến chỉ đạo, yêu cầu nội dung xử lý..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"></textarea>
          </div>

          <div class="pt-3 border-t flex justify-end gap-2">
            <button type="button" onclick="document.getElementById('assign-modal').remove()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">
              Hủy
            </button>
            <button type="submit" class="px-4 py-2 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800">
              Lưu chỉ đạo
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons({ root: modal });

    document.getElementById('assign-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      try {
        await API.assignDocIn(docInId, {
          handler_id: formData.get('handler_id'),
          directive: formData.get('directive')
        });
        modal.remove();
        Modals.showToast('Đã phân công và gửi thông báo cho cán bộ', 'success');
        DocInPage.loadData();
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  },

  // Modal Cập nhật tiến độ & Kết quả
  openProgressModal(docInId) {
    const modal = document.createElement('div');
    modal.id = 'progress-modal';
    modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
        <h3 class="text-sm font-bold text-slate-900 pb-3 border-b flex items-center gap-2">
          <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i> Cập nhật kết quả xử lý công văn đến
        </h3>
        
        <form id="progress-form" class="py-4 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Trạng thái mới</label>
            <select name="status" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <option value="processing">Đang xử lý</option>
              <option value="completed" selected>Đã hoàn thành</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Báo cáo kết quả xử lý *</label>
            <textarea name="result_note" rows="4" required placeholder="Nhập kết quả xử lý, văn bản phúc đáp hoặc biện pháp đã thực hiện..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"></textarea>
          </div>

          <div class="pt-3 border-t flex justify-end gap-2">
            <button type="button" onclick="document.getElementById('progress-modal').remove()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">
              Hủy
            </button>
            <button type="submit" class="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">
              Cập nhật
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons({ root: modal });

    document.getElementById('progress-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      try {
        await API.updateDocInProgress(docInId, {
          status: formData.get('status'),
          result_note: formData.get('result_note')
        });
        modal.remove();
        Modals.showToast('Cập nhật kết quả thành công', 'success');
        DocInPage.loadData();
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  },

  async afterRender() {
    this.loadData();
  }
};

window.DocInPage = DocInPage;
