// Module 4: Dashboard Thống kê & Trợ lý AI Phân tích Báo cáo
const KpiDashboardPage = {
  stats: null,
  donutCompletedChart: null,
  donutUncompletedChart: null,
  stackedDeptChart: null,
  stackedProjChart: null,
  isDrawerOpen: false,
  aiAnalysisData: null,
  chatMessages: [
    { sender: 'ai', text: 'Xin chào đồng chí! Tôi là Trợ lý AI Phân tích Báo cáo HanoiWork. Đồng chí có thể gõ câu hỏi hoặc gõ @tên_cán_bộ để phân tích chuyên sâu hiệu suất công việc.' }
  ],

  async render() {
    const user = API.getUser();
    if (user && user.role === 'citizen') {
      return `<div class="p-8 bg-white rounded-3xl border text-center text-slate-500">Bạn không có quyền truy cập Dashboard Thống kê OKR/KPI</div>`;
    }

    return `
      <div class="space-y-6">
        
        <!-- Header & Action Toolbar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-emerald-500 text-white flex items-center justify-center text-2xl shadow-md">
              <i data-lucide="bar-chart-3" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-base sm:text-lg font-bold text-slate-900">Dashboard Thống kê OKR/KPI</h1>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Thời gian thực
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Biểu đồ tiến độ, đánh giá chất lượng hoàn thành theo tiến độ quy đổi và Trợ lý AI phân tích</p>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <a href="#kpi-workspace" class="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition flex items-center gap-1.5">
              <i data-lucide="folder-tree" class="w-4 h-4 text-blue-700"></i>
              <span>Vào HanoiWork</span>
            </a>
            <button onclick="KpiDashboardPage.exportReportExcel()" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 border border-slate-200">
              <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-600"></i>
              <span>Xuất dữ liệu Excel</span>
            </button>
            <button onclick="KpiDashboardPage.openAiDrawer()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs transition flex items-center gap-2 shadow-md">
              <i data-lucide="sparkles" class="w-4 h-4 text-amber-300 animate-pulse"></i>
              <span>Phân tích báo cáo (AI)</span>
            </button>
          </div>
        </div>

        <!-- Multi-dimensional Filter Bar -->
        <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Phòng ban / Đơn vị</label>
              <select id="dash-filter-dept" onchange="KpiDashboardPage.loadData()" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800">
                <option value="all">Tất cả phòng ban</option>
                <option value="Lãnh đạo UBND">Lãnh đạo UBND</option>
                <option value="Văn phòng - Thống kê">Văn phòng - Thống kê</option>
                <option value="Địa chính - Xây dựng - Môi trường">Địa chính - Xây dựng - Môi trường</option>
                <option value="Tư pháp - Hộ tịch">Tư pháp - Hộ tịch</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Từ ngày</label>
              <input type="date" id="dash-filter-from" onchange="KpiDashboardPage.loadData()" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-800">
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Đến ngày</label>
              <input type="date" id="dash-filter-to" onchange="KpiDashboardPage.loadData()" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-800">
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Trạng thái công việc</label>
              <select id="dash-filter-status" onchange="KpiDashboardPage.loadData()" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800">
                <option value="all">Tất cả trạng thái</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="uncompleted">Chưa hoàn thành</option>
                <option value="overdue">Quá hạn</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 4 KPI Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-container">
          <div class="p-6 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">Đang tải thẻ chỉ số...</div>
        </div>

        <!-- Charts Grid 1: 2 Donut Charts (Đã hoàn thành vs Chưa hoàn thành) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Donut 1: Nhóm Đã hoàn thành (Đúng hạn vs Muộn) -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 class="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span>Nhiệm vụ đã hoàn thành</span>
                </h3>
                <p class="text-[11px] text-slate-500 mt-0.5">Phân bổ tỷ lệ Đúng hạn (Xanh lá) vs Hoàn thành muộn (Cam)</p>
              </div>
              <span id="donut-completed-total" class="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 font-mono">
                0 việc
              </span>
            </div>

            <div class="relative h-64 flex items-center justify-center">
              <canvas id="chart-donut-completed"></canvas>
            </div>

            <div class="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-slate-100">
              <div class="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
                <div class="text-[10px] text-emerald-800 font-bold uppercase">ĐÚNG HẠN (100% KPI)</div>
                <div id="stat-on-time-count" class="font-black text-emerald-700 text-base mt-0.5">0</div>
              </div>
              <div class="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/60">
                <div class="text-[10px] text-amber-800 font-bold uppercase">MUỘN (-25%/NGÀY)</div>
                <div id="stat-late-count" class="font-black text-amber-700 text-base mt-0.5">0</div>
              </div>
            </div>
          </div>

          <!-- Donut 2: Nhóm Chưa hoàn thành (Chưa tới hạn vs Quá hạn vs Chưa có hạn) -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 class="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span>Nhiệm vụ chưa hoàn thành</span>
                </h3>
                <p class="text-[11px] text-slate-500 mt-0.5">Chưa tới hạn (Xanh dương) vs Quá hạn (Đỏ) vs Không deadline (Xám)</p>
              </div>
              <span id="donut-uncompleted-total" class="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 font-mono">
                0 việc
              </span>
            </div>

            <div class="relative h-64 flex items-center justify-center">
              <canvas id="chart-donut-uncompleted"></canvas>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-100">
              <div class="p-2 rounded-2xl bg-blue-50/70 border border-blue-200/60">
                <div class="text-[10px] text-blue-800 font-bold uppercase">CHƯA TỚI HẠN</div>
                <div id="stat-not-due-count" class="font-black text-blue-700 text-base mt-0.5">0</div>
              </div>
              <div class="p-2 rounded-2xl bg-rose-50/70 border border-rose-200/60">
                <div class="text-[10px] text-rose-800 font-bold uppercase">QUÁ HẠN</div>
                <div id="stat-overdue-count" class="font-black text-rose-700 text-base mt-0.5">0</div>
              </div>
              <div class="p-2 rounded-2xl bg-slate-100 border border-slate-200">
                <div class="text-[10px] text-slate-600 font-bold uppercase">CHƯA CÓ HẠN</div>
                <div id="stat-no-deadline-count" class="font-black text-slate-700 text-base mt-0.5">0</div>
              </div>
            </div>
          </div>

        </div>

        <!-- Charts Grid 2: 2 Stacked Horizontal Bar Charts -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Stacked Bar 1: Theo Phòng ban -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 class="font-bold text-slate-900 text-xs sm:text-sm">Tiến độ theo Đơn vị / Phòng ban</h3>
                <p class="text-[11px] text-slate-500 mt-0.5">Biểu đồ thanh ngang phân bổ trạng thái theo từng bộ phận</p>
              </div>
              <span class="text-[10px] font-bold text-slate-400 font-mono">Stacked Bar</span>
            </div>
            <div class="relative h-72">
              <canvas id="chart-bar-dept"></canvas>
            </div>
          </div>

          <!-- Stacked Bar 2: Theo Dự án -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 class="font-bold text-slate-900 text-xs sm:text-sm">Tỷ lệ theo Dự án chiến lược</h3>
                <p class="text-[11px] text-slate-500 mt-0.5">So sánh khối lượng hoàn thành và tồn đọng của từng dự án</p>
              </div>
              <span class="text-[10px] font-bold text-slate-400 font-mono">Stacked Bar</span>
            </div>
            <div class="relative h-72">
              <canvas id="chart-bar-project"></canvas>
            </div>
          </div>

        </div>

        <!-- DRAWER / PANEL "PHÂN TÍCH BÁO CÁO" BẰNG AI (SLIDE-OVER RIGHT DRAWER) -->
        <div id="ai-drawer" class="fixed inset-y-0 right-0 z-50 w-full sm:w-[540px] bg-white shadow-2xl border-l border-slate-200 transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col">
          
          <!-- Drawer Header -->
          <div class="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center font-bold text-lg shadow-md">
                <i data-lucide="sparkles" class="w-5 h-5 text-blue-950 animate-spin"></i>
              </div>
              <div>
                <div class="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>Trợ lý AI Phân tích Báo cáo</span>
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400 text-slate-950">AI Copilot</span>
                </div>
                <div class="text-[11px] text-slate-300">Tổng hợp chỉ số, rà soát rủi ro & giải pháp điều hành</div>
              </div>
            </div>

            <button onclick="KpiDashboardPage.closeAiDrawer()" class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Drawer Body (Scrollable) -->
          <div class="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700" id="ai-drawer-body">
            <div class="p-8 text-center text-slate-400">Đang khởi tạo Trợ lý AI...</div>
          </div>

          <!-- Drawer Footer: Interactive AI Chatbox with @mentions -->
          <div class="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
            <div class="flex items-center justify-between text-[11px] text-slate-500">
              <span>Hỏi AI nhiệm vụ, gõ @ để chọn người:</span>
              <div class="flex items-center gap-1">
                <button onclick="KpiDashboardPage.sendQuickPrompt('Cá nhân có KPI cao nhất')" class="text-[10px] px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700">Top KPI</button>
                <button onclick="KpiDashboardPage.sendQuickPrompt('Nhiệm vụ đang quá hạn')" class="text-[10px] px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700">Quá hạn</button>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <input type="text" id="ai-chat-input" onkeydown="if(event.key==='Enter') KpiDashboardPage.sendAiChat()" placeholder="Nhập câu hỏi hoặc @Hoàng Minh Tuấn, @Phạm Hùng Cường..." class="flex-1 p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500">
              <button onclick="KpiDashboardPage.sendAiChat()" class="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition shadow-md shrink-0 flex items-center gap-1">
                <i data-lucide="send" class="w-3.5 h-3.5"></i> Gửi
              </button>
            </div>
          </div>

        </div>

        <!-- Backdrop overlay when Drawer is open -->
        <div id="ai-drawer-backdrop" onclick="KpiDashboardPage.closeAiDrawer()" class="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-2xs hidden transition-opacity"></div>

      </div>
    `;
  },

  async afterRender() {
    await this.loadData();
  },

  async loadData() {
    const dept = document.getElementById('dash-filter-dept')?.value || 'all';
    const from = document.getElementById('dash-filter-from')?.value || '';
    const to = document.getElementById('dash-filter-to')?.value || '';
    const status = document.getElementById('dash-filter-status')?.value || 'all';

    try {
      this.stats = await API.getKpiDashboardStats({
        department: dept,
        date_from: from,
        date_to: to,
        status: status
      });

      this.renderKpiCards();
      this.renderDonutCharts();
      this.renderStackedBarCharts();
    } catch (e) {
      console.error('Lỗi load dashboard:', e);
    }
  },

  // 1. Render 4 Thẻ KPI Cards Tổng hợp
  renderKpiCards() {
    const container = document.getElementById('kpi-cards-container');
    if (!container || !this.stats) return;

    const cards = this.stats.cards;
    const donuts = this.stats.donuts;

    // Cập nhật nhãn phụ
    const elComp = document.getElementById('donut-completed-total');
    if (elComp) elComp.innerText = `${donuts.completed.total} việc`;
    const elUncomp = document.getElementById('donut-uncompleted-total');
    if (elUncomp) elUncomp.innerText = `${donuts.uncompleted.total} việc`;

    const elOnTime = document.getElementById('stat-on-time-count');
    if (elOnTime) elOnTime.innerText = donuts.completed.on_time;
    const elLate = document.getElementById('stat-late-count');
    if (elLate) elLate.innerText = donuts.completed.late;

    const elNotDue = document.getElementById('stat-not-due-count');
    if (elNotDue) elNotDue.innerText = donuts.uncompleted.not_due;
    const elOverdue = document.getElementById('stat-overdue-count');
    if (elOverdue) elOverdue.innerText = donuts.uncompleted.overdue;
    const elNoDead = document.getElementById('stat-no-deadline-count');
    if (elNoDead) elNoDead.innerText = donuts.uncompleted.no_deadline;

    container.innerHTML = `
      <!-- Thẻ 1: Tổng số dự án / mũi nhọn chiến lược -->
      <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-slate-500 uppercase">DỰ ÁN CHIẾN LƯỢC</span>
          <div class="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
            <i data-lucide="layers" class="w-4 h-4"></i>
          </div>
        </div>
        <div>
          <div class="text-2xl sm:text-3xl font-black text-slate-900 font-mono">${cards.projects.total}</div>
          <div class="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
            <span class="px-1.5 py-0.2 rounded font-bold bg-purple-100 text-purple-800 text-[10px]">${cards.projects.strategic} Chiến lược</span>
            <span class="px-1.5 py-0.2 rounded font-bold bg-blue-100 text-blue-800 text-[10px]">${cards.projects.doc_mgmt} Văn bản</span>
            <span class="px-1.5 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800 text-[10px]">${cards.projects.regular} Thường xuyên</span>
          </div>
        </div>
      </div>

      <!-- Thẻ 2: Tổng số nhiệm vụ -->
      <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-slate-500 uppercase">TỔNG SỐ NHIỆM VỤ</span>
          <div class="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
            <i data-lucide="check-square" class="w-4 h-4"></i>
          </div>
        </div>
        <div>
          <div class="text-2xl sm:text-3xl font-black text-slate-900 font-mono">${cards.total_tasks}</div>
          <div class="text-[11px] text-slate-500 mt-1">
            Bao gồm cả nhiệm vụ mẹ và các nhiệm vụ con phân rã
          </div>
        </div>
      </div>

      <!-- Thẻ 3: Số nhiệm vụ đã hoàn thành -->
      <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-slate-500 uppercase">ĐÃ HOÀN THÀNH</span>
          <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
            <i data-lucide="check-circle-2" class="w-4 h-4"></i>
          </div>
        </div>
        <div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">${cards.completed.count}</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              ${cards.completed.rate}%
            </span>
          </div>
          <div class="text-[11px] text-slate-500 mt-1 font-mono">
            Tổng điểm KPI thực nhận: <strong class="text-emerald-700 font-bold">${cards.completed.total_kpi} đ</strong>
          </div>
        </div>
      </div>

      <!-- Thẻ 4: Số nhiệm vụ chưa hoàn thành -->
      <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-slate-500 uppercase">CHƯA HOÀN THÀNH</span>
          <div class="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm">
            <i data-lucide="clock" class="w-4 h-4"></i>
          </div>
        </div>
        <div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl sm:text-3xl font-black text-rose-600 font-mono">${cards.uncompleted.count}</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
              ${cards.uncompleted.rate}%
            </span>
          </div>
          <div class="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
            <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>
            <span>Có <strong>${cards.uncompleted.overdue_count}</strong> nhiệm vụ đang bị quá hạn</span>
          </div>
        </div>
      </div>
    `;

    lucide.createIcons({ root: container });
  },

  // 2. Render 2 Biểu đồ Donut (Chart.js)
  renderDonutCharts() {
    if (!this.stats) return;

    // Biểu đồ Donut 1: Đã hoàn thành (Đúng hạn vs Muộn)
    const ctxComp = document.getElementById('chart-donut-completed')?.getContext('2d');
    if (ctxComp) {
      if (this.donutCompletedChart) this.donutCompletedChart.destroy();
      const compData = this.stats.donuts.completed;

      this.donutCompletedChart = new Chart(ctxComp, {
        type: 'doughnut',
        data: {
          labels: ['Đúng hạn (100% KPI)', 'Muộn (Phạt -25%/ngày)'],
          datasets: [{
            data: [compData.on_time || 0, compData.late || 0],
            backgroundColor: ['#10b981', '#f59e0b'],
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, font: { size: 11, family: 'Inter' } }
            }
          }
        }
      });
    }

    // Biểu đồ Donut 2: Chưa hoàn thành (Chưa tới hạn vs Quá hạn vs Chưa có hạn)
    const ctxUncomp = document.getElementById('chart-donut-uncompleted')?.getContext('2d');
    if (ctxUncomp) {
      if (this.donutUncompletedChart) this.donutUncompletedChart.destroy();
      const uncompData = this.stats.donuts.uncompleted;

      this.donutUncompletedChart = new Chart(ctxUncomp, {
        type: 'doughnut',
        data: {
          labels: ['Chưa tới hạn', 'Quá hạn', 'Chưa có hạn (No deadline)'],
          datasets: [{
            data: [uncompData.not_due || 0, uncompData.overdue || 0, uncompData.no_deadline || 0],
            backgroundColor: ['#3b82f6', '#ef4444', '#94a3b8'],
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, font: { size: 11, family: 'Inter' } }
            }
          }
        }
      });
    }
  },

  // 3. Render 2 Biểu đồ Thanh ngang Stacked (Chart.js)
  renderStackedBarCharts() {
    if (!this.stats) return;

    // Stacked Bar 1: Theo Phòng ban
    const ctxDept = document.getElementById('chart-bar-dept')?.getContext('2d');
    if (ctxDept) {
      if (this.stackedDeptChart) this.stackedDeptChart.destroy();
      const deptData = this.stats.stacked_bars.by_department || [];

      this.stackedDeptChart = new Chart(ctxDept, {
        type: 'bar',
        data: {
          labels: deptData.map(d => d.dept.length > 20 ? d.dept.slice(0, 18) + '...' : d.dept),
          datasets: [
            { label: 'Đúng hạn', data: deptData.map(d => d.completed_on_time), backgroundColor: '#10b981' },
            { label: 'Muộn', data: deptData.map(d => d.completed_late), backgroundColor: '#f59e0b' },
            { label: 'Chưa tới hạn', data: deptData.map(d => d.not_due), backgroundColor: '#3b82f6' },
            { label: 'Quá hạn', data: deptData.map(d => d.overdue), backgroundColor: '#ef4444' },
            { label: 'Chưa có hạn', data: deptData.map(d => d.no_deadline), backgroundColor: '#94a3b8' }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true, grid: { color: '#f1f5f9' } },
            y: { stacked: true, grid: { display: false } }
          },
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
          }
        }
      });
    }

    // Stacked Bar 2: Theo Dự án
    const ctxProj = document.getElementById('chart-bar-project')?.getContext('2d');
    if (ctxProj) {
      if (this.stackedProjChart) this.stackedProjChart.destroy();
      const projData = this.stats.stacked_bars.by_project || [];

      this.stackedProjChart = new Chart(ctxProj, {
        type: 'bar',
        data: {
          labels: projData.map(p => p.project.length > 25 ? p.project.slice(0, 22) + '...' : p.project),
          datasets: [
            { label: 'Đã hoàn thành', data: projData.map(p => p.completed), backgroundColor: '#10b981' },
            { label: 'Chưa hoàn thành', data: projData.map(p => p.uncompleted), backgroundColor: '#f43f5e' }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true, grid: { color: '#f1f5f9' } },
            y: { stacked: true, grid: { display: false } }
          },
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
          }
        }
      });
    }
  },

  // 4. DRAWER "PHÂN TÍCH BÁO CÁO" BẰNG AI
  async openAiDrawer() {
    this.isDrawerOpen = true;
    const drawer = document.getElementById('ai-drawer');
    const backdrop = document.getElementById('ai-drawer-backdrop');

    if (drawer) drawer.classList.remove('translate-x-full');
    if (backdrop) backdrop.classList.remove('hidden');

    try {
      const res = await API.kpiAiAnalyze();
      this.aiAnalysisData = res;
      this.renderDrawerContent();
    } catch (e) {
      console.error(e);
    }
  },

  closeAiDrawer() {
    this.isDrawerOpen = false;
    const drawer = document.getElementById('ai-drawer');
    const backdrop = document.getElementById('ai-drawer-backdrop');

    if (drawer) drawer.classList.add('translate-x-full');
    if (backdrop) backdrop.classList.add('hidden');
  },

  renderDrawerContent() {
    const body = document.getElementById('ai-drawer-body');
    if (!body || !this.aiAnalysisData) return;

    const data = this.aiAnalysisData;
    const summary = data.system_summary;

    body.innerHTML = `
      <!-- 1. System Metrics Summary Box -->
      <div class="space-y-3">
        <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <i data-lucide="gauge" class="w-4 h-4 text-blue-700"></i>
          <span>BẢNG CHỈ SỐ TOÀN HỆ THỐNG</span>
        </h4>

        <div class="grid grid-cols-2 gap-2 text-center text-xs">
          <div class="p-3 rounded-2xl bg-blue-50/80 border border-blue-200">
            <div class="text-[10px] text-blue-700 font-bold">HIỆU SUẤT TỔNG THỂ</div>
            <div class="text-xl font-black text-blue-900 font-mono mt-0.5">${summary.health_score}</div>
          </div>
          <div class="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200">
            <div class="text-[10px] text-emerald-700 font-bold">TỶ LỆ ĐÚNG HẠN</div>
            <div class="text-xl font-black text-emerald-900 font-mono mt-0.5">${summary.on_time_rate}</div>
          </div>
          <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div class="text-[10px] text-slate-500 font-bold">HOÀN THÀNH</div>
            <div class="text-base font-black text-slate-800 font-mono mt-0.5">${summary.completed_tasks}/${summary.total_tasks}</div>
          </div>
          <div class="p-3 rounded-2xl bg-rose-50 border border-rose-200">
            <div class="text-[10px] text-rose-700 font-bold">QUÁ HẠN / CẢNH BÁO</div>
            <div class="text-base font-black text-rose-800 font-mono mt-0.5">${summary.overdue_tasks} việc</div>
          </div>
        </div>
      </div>

      <!-- 2. Risk Evaluation Table (Đánh giá rủi ro tự động) -->
      <div class="space-y-3 pt-3 border-t border-slate-100">
        <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <i data-lucide="shield-alert" class="w-4 h-4 text-amber-600"></i>
          <span>PHÂN BỔ TRẠNG THÁI & ĐÁNH GIÁ RỦI RO TỰ ĐỘNG</span>
        </h4>

        <div class="overflow-x-auto rounded-2xl border border-slate-200">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-700 font-bold text-[10px] border-b border-slate-200 uppercase">
              <tr>
                <th class="p-2.5">Dự án</th>
                <th class="p-2.5 text-center">Tiến độ</th>
                <th class="p-2.5 text-center">Rủi ro</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${data.risk_table.map(r => `
                <tr class="hover:bg-slate-50/70 transition">
                  <td class="p-2.5">
                    <div class="font-bold text-slate-900 truncate max-w-[200px]" title="${r.project}">${r.project}</div>
                    <div class="text-[10px] text-slate-500 mt-0.5 leading-relaxed">${r.reason}</div>
                  </td>
                  <td class="p-2.5 text-center font-mono font-bold text-slate-700">
                    ${r.completion_rate}
                  </td>
                  <td class="p-2.5 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${r.risk_color}">
                      ${r.risk_level}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 3. AI Recommendations -->
      <div class="space-y-2 pt-3 border-t border-slate-100">
        <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <i data-lucide="lightbulb" class="w-4 h-4 text-amber-500"></i>
          <span>ĐỀ XUẤT HÀNH ĐỘNG TỪ TRỢ LÝ AI</span>
        </h4>

        <div class="space-y-1.5">
          ${data.recommendations.map(rec => `
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 flex items-start gap-2">
              <span class="text-blue-600 font-bold text-xs mt-0.5">•</span>
              <span class="leading-relaxed text-[11px]">${rec}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 4. Chat Messages History -->
      <div class="space-y-2 pt-3 border-t border-slate-100">
        <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <i data-lucide="message-square" class="w-4 h-4 text-blue-700"></i>
          <span>LỊCH SỬ TRAO ĐỔI VỚI AI</span>
        </h4>

        <div class="space-y-2" id="ai-chat-thread">
          ${this.chatMessages.map(m => `
            <div class="p-3 rounded-2xl ${m.sender === 'user' ? 'bg-blue-700 text-white ml-6' : 'bg-slate-50 border border-slate-200 mr-6 text-slate-800'} space-y-1">
              <div class="text-[10px] font-bold ${m.sender === 'user' ? 'text-blue-200' : 'text-slate-500'}">
                ${m.sender === 'user' ? 'Bạn' : '🤖 Trợ lý AI HanoiWork'}
              </div>
              <div class="text-xs leading-relaxed whitespace-pre-line">${m.text}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    lucide.createIcons({ root: body });
  },

  async sendAiChat() {
    const input = document.getElementById('ai-chat-input');
    if (!input || !input.value.trim()) return;

    const question = input.value.trim();
    input.value = '';

    this.chatMessages.push({ sender: 'user', text: question });
    this.renderDrawerContent();

    try {
      const res = await API.kpiAiChat(question);
      this.chatMessages.push({ sender: 'ai', text: res.reply });
      this.renderDrawerContent();

      // Scroll to bottom
      const body = document.getElementById('ai-drawer-body');
      if (body) body.scrollTop = body.scrollHeight;
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  },

  sendQuickPrompt(promptText) {
    const input = document.getElementById('ai-chat-input');
    if (input) {
      input.value = promptText;
      this.sendAiChat();
    }
  },

  exportReportExcel() {
    if (!this.stats) return;

    let csv = '\uFEFF';
    csv += 'HANOIWORK - BÁO CÁO THỐNG KÊ TIẾN ĐỘ OKR/KPI UBND XÃ TÂN TRIỀU\n';
    csv += `Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}\n\n`;
    csv += 'CHỈ SỐ TỔNG THỂ\n';
    csv += `Tổng số dự án,${this.stats.cards.projects.total}\n`;
    csv += `Tổng số nhiệm vụ,${this.stats.cards.total_tasks}\n`;
    csv += `Nhiệm vụ đã hoàn thành,${this.stats.cards.completed.count} (${this.stats.cards.completed.rate}%)\n`;
    csv += `Điểm KPI thực nhận,${this.stats.cards.completed.total_kpi} điểm\n`;
    csv += `Nhiệm vụ chưa hoàn thành,${this.stats.cards.uncompleted.count} (${this.stats.cards.uncompleted.rate}%)\n`;
    csv += `Số nhiệm vụ quá hạn,${this.stats.cards.uncompleted.overdue_count}\n\n`;

    csv += 'THỐNG KÊ THEO PHÒNG BAN\n';
    csv += 'Phòng ban,Đúng hạn,Muộn,Chưa tới hạn,Quá hạn,Chưa có hạn,Tổng cộng\n';

    (this.stats.stacked_bars.by_department || []).forEach(d => {
      csv += `"${d.dept}",${d.completed_on_time},${d.completed_late},${d.not_due},${d.overdue},${d.no_deadline},${d.total}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `HanoiWork_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Modals.showToast('Đã xuất báo cáo thống kê KPI ra file Excel/CSV!', 'success');
  }
};

window.KpiDashboardPage = KpiDashboardPage;
