// Full Multi-Level Approval Audit Trail Page
const ApprovalHistoryPage = {
  async render() {
    return `
      <div class="space-y-6">
        
        <div>
          <h1 class="text-lg font-bold text-slate-900 flex items-center gap-2">
            <i data-lucide="git-branch" class="w-5 h-5 text-blue-700"></i>
            <span>Lịch sử phê duyệt văn bản nhiều cấp</span>
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">Theo dõi chi tiết mọi bước kiểm duyệt, người ký duyệt và ý kiến chỉ đạo</p>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div class="overflow-x-auto text-xs">
            <table class="w-full text-left">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <tr>
                  <th class="p-3.5">Thời điểm</th>
                  <th class="p-3.5">Công văn</th>
                  <th class="p-3.5">Người thực hiện</th>
                  <th class="p-3.5">Hành động</th>
                  <th class="p-3.5">Cấp độ</th>
                  <th class="p-3.5">Ý kiến chỉ đạo / Nhận xét</th>
                  <th class="p-3.5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody id="approval-history-tbody" class="divide-y divide-slate-100">
                <tr><td colspan="7" class="p-8 text-center text-slate-400">Đang tải lịch sử...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  async afterRender() {
    try {
      const history = await API.getApprovalHistory();
      const tbody = document.getElementById('approval-history-tbody');
      if (!tbody) return;

      if (!history || history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">Chưa có lịch sử phê duyệt</td></tr>`;
        return;
      }

      const actionLabels = {
        submit: '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Trình duyệt</span>',
        approve: '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Phê duyệt</span>',
        request_edit: '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">Yêu cầu sửa</span>',
        reject: '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Từ chối</span>',
        publish: '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">Phát hành</span>',
        revoke: '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">Thu hồi</span>'
      };

      tbody.innerHTML = history.map(h => `
        <tr class="hover:bg-slate-50 transition">
          <td class="p-3.5 font-mono text-slate-500 whitespace-nowrap">
            ${h.created_at}
          </td>
          <td class="p-3.5 max-w-xs">
            <span class="font-mono font-bold text-slate-700 text-[10px]">${h.doc_number || 'Dự thảo'}</span>
            <div class="font-semibold text-slate-900 truncate">${h.subject}</div>
          </td>
          <td class="p-3.5 whitespace-nowrap">
            <div class="font-bold text-slate-800">${h.actor_name}</div>
            <div class="text-[10px] text-slate-400">${h.actor_position || h.actor_role}</div>
          </td>
          <td class="p-3.5 whitespace-nowrap">
            ${actionLabels[h.action] || h.action}
          </td>
          <td class="p-3.5 whitespace-nowrap font-bold text-slate-700">
            Cấp ${h.level}
          </td>
          <td class="p-3.5 max-w-xs text-slate-600 italic">
            ${h.comment ? `"${h.comment}"` : '<span class="text-slate-300">Không có ghi chú</span>'}
          </td>
          <td class="p-3.5 text-right whitespace-nowrap">
            <a href="#doc-detail?id=${h.doc_out_id}" class="px-2.5 py-1 rounded-lg bg-slate-100 text-blue-700 font-semibold hover:bg-slate-200">
              Xem văn bản
            </a>
          </td>
        </tr>
      `).join('');

      lucide.createIcons({ root: tbody });
    } catch (e) {
      console.error(e);
    }
  }
};

window.ApprovalHistoryPage = ApprovalHistoryPage;
