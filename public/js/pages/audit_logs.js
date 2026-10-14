// System Audit Logs Page (Nhật ký hoạt động hệ thống - Admin)
const AuditLogsPage = {
  async render() {
    const user = API.getUser();
    if (!user || user.role !== 'admin') {
      return `<div class="p-8 bg-white rounded-2xl border text-center text-rose-500">Chỉ có Quản trị viên mới được xem nhật ký kiểm toán</div>`;
    }

    return `
      <div class="space-y-6">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="history" class="w-5 h-5 text-blue-700"></i>
              <span>Nhật ký hoạt động hệ thống (Audit Trail)</span>
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">Truy vết mọi thao tác đăng nhập, soạn thảo, phê duyệt, phân công và đánh giá</p>
          </div>

          <div class="w-full sm:w-64">
            <input type="text" id="audit-search" oninput="AuditLogsPage.loadLogs()" placeholder="Tìm theo tài khoản, hành động..." class="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white">
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div class="overflow-x-auto text-xs">
            <table class="w-full text-left">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <tr>
                  <th class="p-3.5">Thời điểm</th>
                  <th class="p-3.5">Tài khoản</th>
                  <th class="p-3.5">Vai trò</th>
                  <th class="p-3.5">Hành động</th>
                  <th class="p-3.5">Nội dung chi tiết thao tác</th>
                  <th class="p-3.5">Địa chỉ IP</th>
                </tr>
              </thead>
              <tbody id="audit-logs-tbody" class="divide-y divide-slate-100 font-mono text-[11px]">
                <tr><td colspan="6" class="p-8 text-center text-slate-400">Đang tải nhật ký kiểm toán...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  async loadLogs() {
    const search = document.getElementById('audit-search')?.value || '';
    try {
      const logs = await API.getAuditLogs({ search });
      const tbody = document.getElementById('audit-logs-tbody');
      if (!tbody) return;

      if (!logs || logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400 font-sans">Không tìm thấy bản ghi nhật ký nào</td></tr>`;
        return;
      }

      tbody.innerHTML = logs.map(l => `
        <tr class="hover:bg-slate-50 transition">
          <td class="p-3.5 text-slate-500 whitespace-nowrap">${l.created_at}</td>
          <td class="p-3.5 font-bold text-slate-800 whitespace-nowrap">@${l.username || 'guest'}</td>
          <td class="p-3.5 whitespace-nowrap">
            <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-700">${l.role || 'public'}</span>
          </td>
          <td class="p-3.5 font-bold text-blue-700 whitespace-nowrap">${l.action}</td>
          <td class="p-3.5 font-sans text-slate-800 max-w-md">${l.description}</td>
          <td class="p-3.5 text-slate-400 whitespace-nowrap">${l.ip_address || '127.0.0.1'}</td>
        </tr>
      `).join('');

      lucide.createIcons({ root: tbody });
    } catch (e) {
      console.error(e);
    }
  },

  async afterRender() {
    this.loadLogs();
  }
};

window.AuditLogsPage = AuditLogsPage;
