// Approval Inbox Component with Tabs: Chờ duyệt, Đã duyệt, Yêu cầu sửa
const ApprovalInboxPage = {
  currentTab: 'pending',

  async render() {
    const user = API.getUser();
    if (!user || user.role === 'citizen') {
      return `<div class="p-8 bg-white rounded-2xl border text-center text-slate-500">Bạn không có quyền truy cập hộp thư phê duyệt</div>`;
    }

    return `
      <div class="space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="stamp" class="w-5 h-5 text-amber-500"></i>
              <span>Hộp thư phê duyệt công văn</span>
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">Xử lý, kiểm duyệt và theo dõi các công văn nhiều cấp được trình lên</p>
          </div>

          <div class="flex items-center gap-2 text-xs">
            <span class="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 font-semibold border border-blue-200">
              Quyền: ${user.position || user.role}
            </span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2 text-xs font-bold">
          <button onclick="ApprovalInboxPage.switchTab('pending')" id="tab-btn-pending" class="px-4 py-2 rounded-xl transition flex items-center gap-2 ${this.currentTab === 'pending' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="clock" class="w-4 h-4"></i>
            <span>Chờ tôi phê duyệt</span>
            <span id="tab-count-pending" class="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">...</span>
          </button>

          <button onclick="ApprovalInboxPage.switchTab('processed')" id="tab-btn-processed" class="px-4 py-2 rounded-xl transition flex items-center gap-2 ${this.currentTab === 'processed' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="check-circle" class="w-4 h-4"></i>
            <span>Đã phê duyệt</span>
          </button>

          <button onclick="ApprovalInboxPage.switchTab('needs_edit')" id="tab-btn-needs_edit" class="px-4 py-2 rounded-xl transition flex items-center gap-2 ${this.currentTab === 'needs_edit' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="alert-triangle" class="w-4 h-4"></i>
            <span>Yêu cầu chỉnh sửa</span>
          </button>
        </div>

        <!-- Tab Content -->
        <div id="approval-tab-content" class="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div class="p-8 text-center text-slate-400 text-xs">Đang tải dữ liệu...</div>
        </div>

      </div>
    `;
  },

  async switchTab(tab) {
    this.currentTab = tab;
    ['pending', 'processed', 'needs_edit'].forEach(t => {
      const btn = document.getElementById(`tab-btn-${t}`);
      if (btn) {
        if (t === tab) {
          btn.className = 'px-4 py-2 rounded-xl transition flex items-center gap-2 bg-blue-700 text-white shadow-xs';
        } else {
          btn.className = 'px-4 py-2 rounded-xl transition flex items-center gap-2 text-slate-600 hover:bg-slate-100';
        }
      }
    });

    await this.loadTabContent();
  },

  async loadTabContent() {
    const container = document.getElementById('approval-tab-content');
    if (!container) return;

    try {
      if (this.currentTab === 'pending') {
        const docs = await API.getPendingApprovals();
        const badge = document.getElementById('tab-count-pending');
        if (badge) badge.innerText = docs.length;

        if (!docs || docs.length === 0) {
          container.innerHTML = `<div class="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <i data-lucide="inbox" class="w-10 h-10 text-slate-300"></i>
            <span>Hiện không có công văn nào đang chờ bạn phê duyệt</span>
          </div>`;
          lucide.createIcons({ root: container });
          return;
        }

        container.innerHTML = `
          <div class="overflow-x-auto text-xs">
            <table class="w-full text-left">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <tr>
                  <th class="p-3.5">Trích yếu văn bản</th>
                  <th class="p-3.5">Loại văn bản</th>
                  <th class="p-3.5">Người trình</th>
                  <th class="p-3.5">Cấp duyệt</th>
                  <th class="p-3.5">Thời hạn</th>
                  <th class="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${docs.map(d => `
                  <tr class="hover:bg-slate-50/80 transition">
                    <td class="p-3.5 max-w-sm">
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-[10px] text-slate-400">${d.doc_number || 'Dự thảo'}</span>
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${d.priority === 'urgent' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}">
                          ${d.priority}
                        </span>
                      </div>
                      <a href="#doc-detail?id=${d.id}" class="font-bold text-slate-900 hover:text-blue-600 mt-1 block">
                        ${d.subject}
                      </a>
                    </td>
                    <td class="p-3.5 whitespace-nowrap font-medium text-slate-700">
                      ${d.doc_type}
                    </td>
                    <td class="p-3.5 whitespace-nowrap">
                      <div class="font-bold text-slate-800">${d.creator_name}</div>
                      <div class="text-[10px] text-blue-700 font-semibold">${d.creator_position || d.creator_dept || ''}</div>
                    </td>
                    <td class="p-3.5 whitespace-nowrap">
                      ${(d.creator_position && d.creator_position.includes('Phó Chủ tịch')) || d.creator_id === 3 ? `
                        <span class="px-2 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                          Phó CT trình Chủ tịch
                        </span>
                      ` : `
                        <span class="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                          Cấp ${d.approval_level} / ${d.max_approval_levels}
                        </span>
                      `}
                    </td>
                    <td class="p-3.5 whitespace-nowrap text-slate-500">
                      ${d.due_date || 'Không có'}
                    </td>
                    <td class="p-3.5 text-right whitespace-nowrap">
                      <div class="flex items-center justify-end gap-1.5">
                        <button onclick="Modals.openDocumentPreviewModal(${d.id})" class="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100" title="Xem trước văn bản">
                          <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button onclick="Modals.openApprovalModal(${d.id}, 'request_edit', '${d.subject.replace(/'/g, "\\'")}')" class="px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-900 font-semibold text-[11px] hover:bg-amber-200">
                          Yêu cầu sửa
                        </button>
                        <button onclick="Modals.openApprovalModal(${d.id}, 'reject', '${d.subject.replace(/'/g, "\\'")}')" class="px-2.5 py-1.5 rounded-lg bg-rose-100 text-rose-800 font-semibold text-[11px] hover:bg-rose-200">
                          Từ chối
                        </button>
                        <button onclick="Modals.openApprovalModal(${d.id}, 'approve', '${d.subject.replace(/'/g, "\\'")}')" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 shadow-2xs">
                          Phê duyệt
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else if (this.currentTab === 'processed') {
        const docs = await API.getProcessedApprovals();
        if (!docs || docs.length === 0) {
          container.innerHTML = `<div class="p-12 text-center text-slate-400 text-xs">Bạn chưa có lịch sử phê duyệt văn bản nào</div>`;
          return;
        }

        container.innerHTML = `
          <div class="divide-y divide-slate-100 text-xs">
            ${docs.map(d => `
              <div class="p-4 hover:bg-slate-50 flex items-center justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-[10px] text-slate-400">${d.doc_number || 'Dự thảo'}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Đã phê duyệt</span>
                  </div>
                  <a href="#doc-detail?id=${d.id}" class="font-bold text-slate-900 hover:text-blue-600 mt-1 block">
                    ${d.subject}
                  </a>
                  <div class="text-[11px] text-slate-500 mt-1">
                    Người trình: <strong>${d.creator_name}</strong> • Thời điểm duyệt: ${d.approved_at || ''}
                  </div>
                  ${d.approval_comment ? `<div class="mt-1 text-slate-600 italic">Ý kiến: "${d.approval_comment}"</div>` : ''}
                </div>
                <button onclick="Modals.openDocumentPreviewModal(${d.id})" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">
                  Xem lại
                </button>
              </div>
            `).join('')}
          </div>
        `;
      } else if (this.currentTab === 'needs_edit') {
        const docs = await API.getDocOutList({ status: 'needs_edit' });
        if (!docs || docs.length === 0) {
          container.innerHTML = `<div class="p-12 text-center text-slate-400 text-xs">Không có văn bản nào đang trong trạng thái yêu cầu chỉnh sửa</div>`;
          return;
        }

        container.innerHTML = `
          <div class="divide-y divide-slate-100 text-xs">
            ${docs.map(d => `
              <div class="p-4 sm:p-5 hover:bg-slate-50 transition space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                        <i data-lucide="alert-triangle" class="w-3 h-3 text-amber-600"></i>
                        <span>Yêu cầu chỉnh sửa</span>
                      </span>
                      <span class="font-mono text-[10px] text-slate-400">${d.doc_number || 'Dự thảo'}</span>
                      <span class="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">${d.doc_type}</span>
                    </div>

                    <a href="#doc-detail?id=${d.id}" class="font-bold text-slate-900 hover:text-blue-600 text-sm mt-1.5 block">
                      ${d.subject}
                    </a>

                    <div class="text-[11px] text-slate-500 mt-1">
                      Người soạn thảo: <strong>${d.creator_name}</strong> (${d.creator_dept || d.creator_position || ''}) • Ngày soạn: ${d.draft_date || d.created_at?.split(' ')[0]}
                    </div>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <a href="#doc-detail?id=${d.id}" class="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition flex items-center gap-1">
                      <i data-lucide="eye" class="w-3.5 h-3.5"></i> Chi tiết
                    </a>
                    <a href="#doc-create?edit=${d.id}" class="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 transition shadow-xs flex items-center gap-1.5">
                      <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Sửa văn bản
                    </a>
                  </div>
                </div>

                ${d.latest_edit_reason ? `
                  <div class="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs">
                    <div class="flex items-center gap-1.5 font-bold text-amber-900 text-[11px] mb-1">
                      <i data-lucide="message-square" class="w-3.5 h-3.5 text-amber-700"></i>
                      <span>Ý kiến chỉ đạo của Lãnh đạo (${d.edit_requested_by || 'Lãnh đạo'}${d.edit_requested_by_position ? ' - ' + d.edit_requested_by_position : ''}${d.edit_requested_at ? ' • ' + d.edit_requested_at : ''}):</span>
                    </div>
                    <div class="pl-4 italic font-serif text-slate-900 text-xs font-semibold leading-relaxed border-l-2 border-amber-400">
                      "${d.latest_edit_reason}"
                    </div>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }

      lucide.createIcons({ root: container });
    } catch (e) {
      container.innerHTML = `<div class="p-8 text-center text-rose-500 text-xs">Lỗi tải dữ liệu: ${e.message}</div>`;
    }
  },

  async afterRender() {
    this.switchTab('pending');
  }
};

window.ApprovalInboxPage = ApprovalInboxPage;
