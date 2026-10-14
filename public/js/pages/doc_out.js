// Outbound Documents (Công văn đi) List View
const DocOutPage = {
  async render() {
    const user = API.getUser();
    if (user && user.role === 'citizen') {
      return `<div class="p-8 bg-white rounded-2xl border text-center text-slate-500">Bạn không có quyền xem công văn nội bộ</div>`;
    }

    return `
      <div class="space-y-5">
        
        <!-- Header & Action Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="send" class="w-5 h-5 text-blue-700"></i>
              <span>Quản lý Công văn đi</span>
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">Soạn thảo, quản lý dự thảo, theo dõi trình duyệt và phát hành văn bản</p>
          </div>

          <div class="flex items-center gap-2">
            <a href="#doc-create" class="px-4 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition flex items-center gap-1.5 shadow-xs">
              <i data-lucide="plus" class="w-4 h-4"></i> Soạn công văn mới
            </a>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            
            <!-- Trạng thái -->
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Trạng thái văn bản</label>
              <select id="filter-status" onchange="DocOutPage.loadData()" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500">
                <option value="all">Tất cả trạng thái</option>
                <option value="draft">Bản nháp</option>
                <option value="pending_review">Chờ phê duyệt</option>
                <option value="needs_edit">Yêu cầu chỉnh sửa</option>
                <option value="approved">Đã phê duyệt (Chờ phát hành)</option>
                <option value="published">Đã phát hành</option>
                <option value="rejected">Đã từ chối</option>
              </select>
            </div>

            <!-- Loại văn bản -->
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Loại văn bản</label>
              <select id="filter-type" onchange="DocOutPage.loadData()" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500">
                <option value="all">Tất cả loại văn bản</option>
                <option value="Quyết định">Quyết định</option>
                <option value="Kế hoạch">Kế hoạch</option>
                <option value="Tờ trình">Tờ trình</option>
                <option value="Thông báo">Thông báo</option>
                <option value="Báo cáo">Báo cáo</option>
                <option value="Công văn">Công văn</option>
                <option value="Giấy mời">Giấy mời</option>
              </select>
            </div>

            <!-- Mức độ ưu tiên -->
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Độ ưu tiên</label>
              <select id="filter-priority" onchange="DocOutPage.loadData()" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500">
                <option value="all">Tất cả</option>
                <option value="normal">Thường</option>
                <option value="urgent">Khẩn</option>
                <option value="emergency">Hỏa tốc</option>
              </select>
            </div>

            <!-- Tìm kiếm -->
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Tìm kiếm từ khóa</label>
              <div class="relative">
                <input type="text" id="filter-search" oninput="DocOutPage.loadData()" placeholder="Số ký hiệu, trích yếu, nơi nhận..." class="w-full p-2.5 pl-8 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500">
                <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3"></i>
              </div>
            </div>

          </div>
        </div>

        <!-- Data Table Container -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-600">
              <thead class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th class="p-3.5">Số / Ký hiệu</th>
                  <th class="p-3.5">Trích yếu nội dung</th>
                  <th class="p-3.5">Loại văn bản</th>
                  <th class="p-3.5">Người soạn</th>
                  <th class="p-3.5">Đơn vị nhận</th>
                  <th class="p-3.5">Trạng thái</th>
                  <th class="p-3.5">Cấp duyệt</th>
                  <th class="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody id="doc-out-table-body" class="divide-y divide-slate-100">
                <tr>
                  <td colspan="8" class="p-8 text-center text-slate-400">Đang tải danh sách công văn đi...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  async loadData() {
    const status = document.getElementById('filter-status')?.value || 'all';
    const doc_type = document.getElementById('filter-type')?.value || 'all';
    const priority = document.getElementById('filter-priority')?.value || 'all';
    const search = document.getElementById('filter-search')?.value || '';

    try {
      const docs = await API.getDocOutList({ status, doc_type, priority, search });
      const tbody = document.getElementById('doc-out-table-body');
      if (!tbody) return;

      if (!docs || docs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400">Không tìm thấy công văn nào phù hợp</td></tr>`;
        return;
      }

      const statusBadges = {
        draft: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Bản nháp</span>',
        pending_review: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Chờ duyệt</span>',
        needs_edit: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Yêu cầu sửa</span>',
        approved: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Đã duyệt</span>',
        published: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Đã phát hành</span>',
        rejected: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">Đã từ chối</span>',
        revoked: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200 text-zinc-800">Đã thu hồi</span>'
      };

      const user = API.getUser();

      tbody.innerHTML = docs.map(d => `
        <tr class="hover:bg-slate-50/80 transition">
          <td class="p-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
            ${d.doc_number || '<span class="text-slate-400">Chưa cấp số</span>'}
          </td>
          <td class="p-3.5 max-w-sm">
            <a href="#doc-detail?id=${d.id}" class="font-semibold text-slate-900 hover:text-blue-600 block line-clamp-2">
              ${d.subject}
            </a>
            <div class="text-[10px] text-slate-400 mt-0.5">Ngày soạn: ${d.draft_date || d.created_at?.split(' ')[0]}</div>
            ${d.status === 'needs_edit' && d.latest_edit_reason ? `
              <div class="mt-1.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950 font-medium">
                <span class="font-bold text-amber-900">Lý do yêu cầu sửa:</span> "${d.latest_edit_reason}"
              </div>
            ` : ''}
            ${d.status === 'rejected' && d.latest_reject_reason ? `
              <div class="mt-1.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-950 font-medium">
                <span class="font-bold text-rose-900">Lý do từ chối:</span> "${d.latest_reject_reason}"
              </div>
            ` : ''}
          </td>
          <td class="p-3.5 whitespace-nowrap">
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${d.priority === 'urgent' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-800'}">
              ${d.doc_type}
            </span>
          </td>
          <td class="p-3.5 whitespace-nowrap">
            <div class="font-medium text-slate-800">${d.creator_name || 'Cán bộ'}</div>
            <div class="text-[10px] text-slate-400">${d.creator_dept || ''}</div>
          </td>
          <td class="p-3.5 max-w-[150px] truncate text-slate-600" title="${d.recipient_unit}">
            ${d.recipient_unit}
          </td>
          <td class="p-3.5 whitespace-nowrap">
            ${statusBadges[d.status] || d.status}
          </td>
          <td class="p-3.5 whitespace-nowrap">
            <div class="flex items-center gap-1">
              <span class="font-bold text-slate-800">${d.approval_level}</span>
              <span class="text-slate-400">/ ${d.max_approval_levels}</span>
            </div>
          </td>
          <td class="p-3.5 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="Modals.openDocumentPreviewModal(${d.id})" class="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100" title="Xem trước mẫu chuẩn NĐ30">
                <i data-lucide="eye" class="w-4 h-4"></i>
              </button>
              
              <a href="#doc-detail?id=${d.id}" class="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50" title="Chi tiết tiến trình">
                <i data-lucide="file-text" class="w-4 h-4"></i>
              </a>

              ${(d.status === 'draft' || d.status === 'needs_edit') && (user.id === d.creator_id || user.role === 'admin') ? `
                <a href="#doc-create?edit=${d.id}" class="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50" title="Chỉnh sửa nội dung">
                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                </a>
              ` : ''}

              ${d.status === 'approved' && (user.role === 'officer' || user.role === 'admin') ? `
                <button onclick="Modals.openApprovalModal(${d.id}, 'publish', '${d.subject.replace(/'/g, "\\'")}')" class="px-2 py-1 rounded bg-blue-700 text-white font-semibold text-[10px] hover:bg-blue-800">
                  Phát hành
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

  async afterRender() {
    this.loadData();
  }
};

window.DocOutPage = DocOutPage;
