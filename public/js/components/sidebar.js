// Collapsible Left Navigation Sidebar Component
const Sidebar = {
  render(currentRoute) {
    const user = API.getUser() || { role: 'citizen', full_name: 'Khách' };
    const r = currentRoute || 'dashboard';

    const isActive = (route) => r === route ? 'bg-blue-800 text-amber-300 font-semibold shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white';

    return `
      <aside id="sidebar" class="w-64 bg-slate-900 text-white flex flex-col shrink-0 fixed inset-y-0 left-0 z-40 lg:static lg:translate-x-0 -translate-x-full transition-transform duration-300 ease-in-out border-r border-slate-800 select-none">
        
        <!-- Sidebar Brand Banner -->
        <div class="p-4 border-b border-slate-800 flex items-center justify-between">
          <a href="#dashboard" class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
              UB
            </div>
            <div>
              <div class="font-bold text-sm tracking-wide text-white">UBND XÃ TÂN TRIỀU</div>
              <div class="text-[10px] text-amber-300 font-medium">Hành chính điện tử</div>
            </div>
          </a>
          <button id="sidebar-close" class="p-1.5 rounded-lg text-slate-400 hover:text-white lg:hidden">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Navigation Links Container -->
        <div class="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs font-medium">
          
          <!-- Nhóm 1: Tổng quan -->
          <div>
            <div class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">TỔNG QUAN</div>
            <div class="space-y-1">
              <a href="#dashboard" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('dashboard')}">
                <i data-lucide="layout-dashboard" class="w-4 h-4 shrink-0"></i>
                <span>Trang tổng quan</span>
              </a>
            </div>
          </div>

          <!-- Nhóm 2: Công văn nội bộ (Ẩn với Người dân thường) -->
          ${user.role !== 'citizen' ? `
            <div>
              <div class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>CÔNG VĂN NỘI BỘ</span>
                <span class="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Văn thư</span>
              </div>
              <div class="space-y-1">
                <a href="#doc-in" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('doc-in')}">
                  <i data-lucide="inbox" class="w-4 h-4 shrink-0"></i>
                  <span>Công văn đến</span>
                </a>
                <a href="#doc-out" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('doc-out')}">
                  <i data-lucide="send" class="w-4 h-4 shrink-0"></i>
                  <span>Công văn đi</span>
                </a>
                <a href="#approval-inbox" class="flex items-center justify-between px-3 py-2.5 rounded-xl transition ${isActive('approval-inbox')}">
                  <div class="flex items-center gap-3">
                    <i data-lucide="stamp" class="w-4 h-4 shrink-0 text-amber-400"></i>
                    <span>Hộp thư phê duyệt</span>
                  </div>
                  <span id="sidebar-pending-badge" class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">2</span>
                </a>
                <a href="#approval-history" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('approval-history')}">
                  <i data-lucide="git-branch" class="w-4 h-4 shrink-0"></i>
                  <span>Lịch sử phê duyệt</span>
                </a>
                <a href="#doc-create" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('doc-create')} text-amber-300 hover:text-white">
                  <i data-lucide="file-plus" class="w-4 h-4 shrink-0"></i>
                  <span>Soạn công văn mới</span>
                </a>
              </div>
            </div>
          ` : ''}

          <!-- Nhóm 3: Dịch vụ công & Yêu cầu trực tuyến -->
          <div>
            <div class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">DỊCH VỤ TRỰC TUYẾN</div>
            <div class="space-y-1">
              <a href="#citizen-portal" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('citizen-portal')} text-blue-300 hover:text-white">
                <i data-lucide="globe" class="w-4 h-4 shrink-0"></i>
                <span>Gửi yêu cầu trực tuyến</span>
              </a>
              <a href="#request-tracking" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('request-tracking')}">
                <i data-lucide="search" class="w-4 h-4 shrink-0"></i>
                <span>Tra cứu mã hồ sơ</span>
              </a>
              ${user.role !== 'citizen' ? `
                <a href="#requests-manage" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('requests-manage')}">
                  <i data-lucide="clipboard-list" class="w-4 h-4 shrink-0"></i>
                  <span>Quản lý hồ sơ công dân</span>
                </a>
              ` : `
                <a href="#requests-manage" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('requests-manage')}">
                  <i data-lucide="folder" class="w-4 h-4 shrink-0"></i>
                  <span>Hồ sơ đã gửi của tôi</span>
                </a>
              `}
            </div>
          </div>

          <!-- Phân hệ độc quyền: BAO-WORK™ & AI KPI ENGINE -->
          ${user.role !== 'citizen' ? `
            <div>
              <div class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center justify-between">
                <span class="flex items-center gap-1.5 font-black text-amber-300 tracking-wide">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  BAO-WORK & OKR/KPI
                </span>
                <span class="text-[9px] bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 text-slate-950 font-black px-1.5 py-0.5 rounded shadow-xs uppercase tracking-tight">AI ALGO 2026</span>
              </div>
              <div class="space-y-1">
                <a href="#kpi-workspace" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('kpi-workspace') || isActive('tasks')}">
                  <i data-lucide="folder-tree" class="w-4 h-4 shrink-0 text-blue-400"></i>
                  <span>Không gian làm việc (3 Cấp)</span>
                </a>
                <a href="#kpi-assistant" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('kpi-assistant')} text-amber-200 hover:text-white">
                  <i data-lucide="sparkles" class="w-4 h-4 shrink-0 text-amber-300"></i>
                  <span>Trợ lý AI B-Assistant™</span>
                </a>
                <a href="#kpi-algo" class="flex items-center justify-between px-3 py-2.5 rounded-xl transition ${isActive('kpi-algo')} bg-gradient-to-r from-purple-500/15 via-blue-500/10 to-transparent border border-purple-500/30 text-purple-200 hover:text-white group">
                  <div class="flex items-center gap-3">
                    <i data-lucide="brain-circuit" class="w-4 h-4 shrink-0 text-purple-400 group-hover:rotate-12 transition"></i>
                    <span class="font-semibold text-purple-100">B-Algo: AI Sinh Thuật Toán</span>
                  </div>
                  <span class="text-[9px] px-1.5 py-0.5 rounded font-black bg-purple-500/30 text-purple-300 border border-purple-400/40 tracking-wider">ĐỘC QUYỀN</span>
                </a>
                <a href="#kpi-dashboard" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('kpi-dashboard')}">
                  <i data-lucide="bar-chart-3" class="w-4 h-4 shrink-0 text-emerald-400"></i>
                  <span>Dashboard KPI & AI Phân tích</span>
                </a>
              </div>
            </div>
          ` : ''}

          <!-- Nhóm 4: Đánh giá & Khảo sát (Yêu cầu trọng tâm) -->
          <div>
            <div class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-400/90">ĐÁNH GIÁ & KHẢO SÁT</div>
            <div class="space-y-1">
              <a href="#service-rating" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('service-rating')}">
                <i data-lucide="award" class="w-4 h-4 shrink-0 text-amber-400"></i>
                <span>Đánh giá chất lượng phục vụ</span>
              </a>
              <a href="#app-rating" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('app-rating')} bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 text-amber-200">
                <i data-lucide="sparkles" class="w-4 h-4 shrink-0 text-amber-300"></i>
                <span>Đánh giá giao diện app</span>
              </a>
              ${user.role !== 'citizen' ? `
                <a href="#rating-stats" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('rating-stats')}">
                  <i data-lucide="bar-chart-3" class="w-4 h-4 shrink-0 text-emerald-400"></i>
                  <span>Thống kê đánh giá</span>
                </a>
              ` : ''}
            </div>
          </div>

          <!-- Nhóm 5: Hệ thống & Báo cáo -->
          <div>
            <div class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">HỆ THỐNG & BÁO CÁO</div>
            <div class="space-y-1">
              ${user.role !== 'citizen' ? `
                <a href="#reports" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('reports')}">
                  <i data-lucide="file-spreadsheet" class="w-4 h-4 shrink-0"></i>
                  <span>Báo cáo & Xuất Excel</span>
                </a>
              ` : ''}
              <a href="#notifications" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('notifications')}">
                <i data-lucide="bell" class="w-4 h-4 shrink-0"></i>
                <span>Trung tâm thông báo</span>
              </a>
              ${user.role === 'admin' ? `
                <a href="#users" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('users')}">
                  <i data-lucide="users" class="w-4 h-4 shrink-0"></i>
                  <span>Quản lý người dùng</span>
                </a>
                <a href="#roles" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('roles')}">
                  <i data-lucide="shield-check" class="w-4 h-4 shrink-0"></i>
                  <span>Vai trò & Phân quyền</span>
                </a>
                <a href="#unit-settings" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('unit-settings')}">
                  <i data-lucide="settings" class="w-4 h-4 shrink-0"></i>
                  <span>Cài đặt đơn vị & Logo</span>
                </a>
                <a href="#workflows" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('workflows')}">
                  <i data-lucide="git-pull-request" class="w-4 h-4 shrink-0"></i>
                  <span>Quy trình phê duyệt</span>
                </a>
                <a href="#audit-logs" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('audit-logs')}">
                  <i data-lucide="history" class="w-4 h-4 shrink-0"></i>
                  <span>Nhật ký hoạt động</span>
                </a>
                <a href="#ip-security" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive('ip-security')}">
                  <i data-lucide="shield-alert" class="w-4 h-4 shrink-0 text-rose-400"></i>
                  <span>Quản lý IP & Tường lửa</span>
                </a>
              ` : ''}
            </div>
          </div>

        </div>

        <!-- Sidebar Footer: User Brief & Reset Demo Button -->
        <div class="p-3 border-t border-slate-800 bg-slate-950/60">
          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              Trực tuyến
            </span>
            ${user.role === 'admin' ? `
              <button onclick="Sidebar.resetDemoData()" class="text-amber-400 hover:text-amber-300 font-medium transition" title="Khôi phục lại dữ liệu mẫu">
                Reset Demo
              </button>
            ` : ''}
          </div>
        </div>

      </aside>
    `;
  },

  async resetDemoData() {
    if (!confirm('Bạn có chắc chắn muốn khôi phục lại toàn bộ dữ liệu minh họa mặc định?')) return;
    try {
      await API.resetDemo();
      Modals.showToast('Khôi phục dữ liệu mẫu thành công!', 'success');
      App.refreshView();
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  },

  attachEvents() {
    const closeBtn = document.getElementById('sidebar-close');
    const sidebar = document.getElementById('sidebar');
    if (closeBtn && sidebar) {
      closeBtn.onclick = () => {
        sidebar.classList.add('-translate-x-full');
      };
    }
  }
};

window.Sidebar = Sidebar;
