// Phân hệ Quản trị An ninh mạng & Tường lửa Quản lý IP (B-Firewall Studio)
const IpSecurityPage = {
  currentTab: 'rules',
  stats: null,
  rules: [],
  logs: [],
  filterThreat: 'all',
  filterBlocked: 'all',
  searchIp: '',

  async render() {
    const user = API.getUser();
    if (!user || (user.role !== 'admin' && user.role !== 'leader')) {
      return `
        <div class="p-8 bg-white rounded-3xl border border-red-200 text-center space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">🚫</div>
          <h2 class="text-base font-bold text-slate-900">Quyền truy cập bị từ chối</h2>
          <p class="text-xs text-slate-500">Phân hệ Quản trị An ninh mạng & Tường lửa IP chỉ dành riêng cho Quản trị viên (Admin) và Lãnh đạo cơ quan.</p>
        </div>
      `;
    }

    return `
      <div class="space-y-6">
        
        <!-- Header & Brand Ribbon -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl border border-slate-800 shadow-xl">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg ring-1 ring-white/20">
              🛡️
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-lg font-black tracking-tight text-white">B-Firewall™: Tường Lửa & Quản Lý IP Người Dùng</h1>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 tracking-wider">
                  SHIELD 2026
                </span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  BẢO VỆ 24/7
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1">Giám sát truy cập mạng, chặn IP kẻ gian xâm nhập, ngăn ngừa tấn công tự động và kiểm soát xác minh Robot</p>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="IpSecurityPage.loadData()" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center gap-1.5 border border-slate-700 shadow-xs">
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
              <span>Làm mới dữ liệu</span>
            </button>
            <button onclick="IpSecurityPage.openAddRuleModal()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md">
              <i data-lucide="shield-ban" class="w-4 h-4"></i>
              <span>+ Chặn địa chỉ IP</span>
            </button>
          </div>
        </div>

        <!-- 4 Security Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="sec-summary-cards">
          <div class="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
            <div class="text-[11px] font-bold text-slate-500 flex items-center justify-between">
              <span>TỔNG LƯỢT TRUY CẬP</span>
              <span class="text-blue-600 font-bold">🌐 API</span>
            </div>
            <div class="text-2xl font-black text-slate-900" id="card-total-requests">--</div>
            <div class="text-[11px] text-slate-400">Ghi nhận toàn bộ luồng mạng</div>
          </div>

          <div class="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
            <div class="text-[11px] font-bold text-rose-600 flex items-center justify-between">
              <span>ĐÃ CHẶN THÀNH CÔNG</span>
              <span class="text-rose-600 font-bold">🚫 Blocked</span>
            </div>
            <div class="text-2xl font-black text-rose-600" id="card-blocked-attempts">--</div>
            <div class="text-[11px] text-slate-400">Tường lửa ngăn chặn tự động</div>
          </div>

          <div class="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
            <div class="text-[11px] font-bold text-amber-600 flex items-center justify-between">
              <span>IP TRONG DANH SÁCH ĐEN</span>
              <span class="text-amber-600 font-bold">⚠️ Blacklist</span>
            </div>
            <div class="text-2xl font-black text-amber-600" id="card-blacklist-count">--</div>
            <div class="text-[11px] text-slate-400">Đang bị khóa truy cập hệ thống</div>
          </div>

          <div class="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
            <div class="text-[11px] font-bold text-indigo-600 flex items-center justify-between">
              <span>TRUY CẬP ĐÁNG NGỜ</span>
              <span class="text-indigo-600 font-bold">🔍 Audited</span>
            </div>
            <div class="text-2xl font-black text-indigo-600" id="card-suspicious-count">--</div>
            <div class="text-[11px] text-slate-400">Cần theo dõi sát an ninh</div>
          </div>
        </div>

        <!-- Hộp Thông tin: Cơ chế Xác minh Robot & Giải đáp Gacha Captcha Kiếm tiền -->
        <div class="p-5 bg-gradient-to-br from-indigo-900/10 via-purple-900/5 to-white rounded-3xl border border-indigo-200/80 shadow-2xs space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="text-lg">🤖</span>
              <h2 class="text-sm font-bold text-indigo-950">Bảo mật Xác minh Robot (Captcha) & Phân tích cơ chế Gacha</h2>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
              Kiến trúc an ninh chính phủ
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-700">
            <div class="p-3.5 bg-white/80 rounded-2xl border border-indigo-100 space-y-1.5">
              <div class="font-bold text-slate-900 flex items-center gap-1.5">
                <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
                <span>Tính năng bảo vệ chống Robot đang kích hoạt:</span>
              </div>
              <p>Mỗi khi đăng nhập hoặc đăng ký tài khoản, hệ thống tự động sinh <b>thử thách toán học biến thiên động (Dynamic Math Puzzle)</b> với hình ảnh bảo mật SVG chống OCR bot. Ngăn chặn 100% các công cụ spam tài khoản ảo hoặc hacker brute-force mật khẩu.</p>
            </div>

            <div class="p-3.5 bg-white/80 rounded-2xl border border-indigo-100 space-y-1.5">
              <div class="font-bold text-slate-900 flex items-center gap-1.5">
                <i data-lucide="help-circle" class="w-4 h-4 text-amber-600"></i>
                <span>Có nên kiếm tiền bằng Captcha / Gacha trên web này không?</span>
              </div>
              <p><b>Lời khuyên chuyên môn:</b> Hệ thống này phục vụ <b>cơ quan nhà nước (UBND xã) và dịch vụ công người dân</b>. Các mạng lưới captcha kiếm tiền (như hCaptcha Publisher hay link rút gọn kiếm tiền) bắt người dùng xem quảng cáo sẽ <b>vi phạm quy chế cơ quan nhà nước</b> và làm giảm sự uy tín. Thay vào đó, việc dùng Captcha an ninh cao cấp nội bộ là giải pháp chuẩn mực và chuyên nghiệp nhất!</p>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs: Danh sách chặn (Blacklist) vs Lịch sử truy cập (Live Logs) -->
        <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div class="flex items-center gap-2">
              <button onclick="IpSecurityPage.switchTab('rules')" id="tab-btn-rules" class="px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 ${this.currentTab === 'rules' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}">
                <i data-lucide="shield-alert" class="w-4 h-4"></i>
                <span>Danh sách IP bị chặn (Blacklist)</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white" id="badge-rules-count">0</span>
              </button>
              <button onclick="IpSecurityPage.switchTab('logs')" id="tab-btn-logs" class="px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 ${this.currentTab === 'logs' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}">
                <i data-lucide="activity" class="w-4 h-4"></i>
                <span>Nhật ký truy cập IP thời gian thực</span>
              </button>
            </div>

            <!-- Thanh tìm kiếm IP nhanh -->
            <div class="relative w-full sm:w-64">
              <input type="text" id="sec-search-ip" oninput="IpSecurityPage.handleSearch(this.value)" placeholder="Tìm kiếm địa chỉ IP..." class="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono">
              <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"></i>
            </div>
          </div>

          <!-- TAB 1: DANH SÁCH QUY TẮC IP (BLACKLIST / WHITELIST) -->
          <div id="sec-panel-rules" class="${this.currentTab === 'rules' ? '' : 'hidden'} space-y-3">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-slate-100 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                    <th class="py-2.5 px-3">Địa chỉ IP</th>
                    <th class="py-2.5 px-3">Loại quy tắc</th>
                    <th class="py-2.5 px-3">Lý do chặn / cảnh báo</th>
                    <th class="py-2.5 px-3">Thời gian ghi nhận</th>
                    <th class="py-2.5 px-3">Trạng thái</th>
                    <th class="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody id="rules-table-body" class="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td colspan="6" class="py-8 text-center text-slate-400">Đang tải danh sách tường lửa...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB 2: NHẬT KÝ TRUY CẬP THỜI GIAN THỰC (LIVE LOGS) -->
          <div id="sec-panel-logs" class="${this.currentTab === 'logs' ? '' : 'hidden'} space-y-3">
            <div class="flex items-center gap-2 flex-wrap text-xs pb-1">
              <span class="text-slate-500 font-semibold">Lọc mức độ:</span>
              <button onclick="IpSecurityPage.filterLogs('all')" class="px-2.5 py-1 rounded-lg border text-[11px] font-semibold bg-slate-100 border-slate-300">Tất cả</button>
              <button onclick="IpSecurityPage.filterLogs('normal')" class="px-2.5 py-1 rounded-lg border text-[11px] font-semibold hover:bg-slate-50 border-slate-200 text-slate-600">Bình thường</button>
              <button onclick="IpSecurityPage.filterLogs('suspicious')" class="px-2.5 py-1 rounded-lg border text-[11px] font-semibold hover:bg-amber-50 border-amber-200 text-amber-700">Đáng ngờ</button>
              <button onclick="IpSecurityPage.filterLogs('danger')" class="px-2.5 py-1 rounded-lg border text-[11px] font-semibold hover:bg-rose-50 border-rose-200 text-rose-700">Nguy hiểm</button>
            </div>

            <div class="overflow-x-auto max-h-[500px]">
              <table class="w-full text-left text-xs">
                <thead class="sticky top-0 bg-white">
                  <tr class="border-b border-slate-100 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                    <th class="py-2.5 px-3">Thời gian</th>
                    <th class="py-2.5 px-3">Địa chỉ IP</th>
                    <th class="py-2.5 px-3">Phương thức</th>
                    <th class="py-2.5 px-3">Đường dẫn yêu cầu</th>
                    <th class="py-2.5 px-3">Trạng thái</th>
                    <th class="py-2.5 px-3">Mức độ an ninh</th>
                    <th class="py-2.5 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody id="logs-table-body" class="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td colspan="7" class="py-8 text-center text-slate-400">Đang tải nhật ký mạng...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    `;
  },

  async afterRender() {
    await this.loadData();
    lucide.createIcons();
  },

  async loadData() {
    try {
      const [stats, rules, logs] = await Promise.all([
        API.getSecurityStats(),
        API.getIpRules(),
        API.getIpLogs({ limit: 100 })
      ]);

      this.stats = stats;
      this.rules = rules || [];
      this.logs = logs || [];

      this.renderSummary();
      this.renderRules();
      this.renderLogs();
    } catch (err) {
      Modals.showToast('Lỗi nạp dữ liệu an ninh mạng: ' + err.message, 'error');
    }
  },

  renderSummary() {
    if (!this.stats || !this.stats.summary) return;
    const s = this.stats.summary;
    document.getElementById('card-total-requests').innerText = s.total_requests || 0;
    document.getElementById('card-blocked-attempts').innerText = s.blocked_attempts || 0;
    document.getElementById('card-blacklist-count').innerText = s.active_blacklist_count || 0;
    document.getElementById('card-suspicious-count').innerText = s.suspicious_today || 0;
    document.getElementById('badge-rules-count').innerText = s.active_blacklist_count || 0;
  },

  renderRules() {
    const tbody = document.getElementById('rules-table-body');
    if (!tbody) return;

    let filtered = this.rules;
    if (this.searchIp.trim()) {
      filtered = filtered.filter(r => r.ip_address.includes(this.searchIp.trim()));
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="py-10 text-center text-slate-400">
            <div class="text-3xl mb-2">🛡️</div>
            <div>Không có địa chỉ IP nào trong danh sách chặn. Tường lửa đang bảo vệ bình thường.</div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(r => `
      <tr class="hover:bg-slate-50/80 transition">
        <td class="py-3 px-3">
          <span class="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            ${r.ip_address}
          </span>
        </td>
        <td class="py-3 px-3">
          ${r.rule_type === 'blacklist' 
            ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">Chặn (Blacklist)</span>`
            : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Tin cậy (Whitelist)</span>`
          }
        </td>
        <td class="py-3 px-3 text-slate-700">
          ${r.reason}
        </td>
        <td class="py-3 px-3 text-slate-500 font-mono text-[11px]">
          ${r.created_at}
        </td>
        <td class="py-3 px-3">
          <span class="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Đang chặn
          </span>
        </td>
        <td class="py-3 px-3 text-right">
          <button onclick="IpSecurityPage.unbanIp(${r.id}, '${r.ip_address}')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition">
            Gỡ chặn (Unban)
          </button>
        </td>
      </tr>
    `).join('');
  },

  renderLogs() {
    const tbody = document.getElementById('logs-table-body');
    if (!tbody) return;

    let filtered = this.logs;
    if (this.searchIp.trim()) {
      filtered = filtered.filter(l => l.ip_address.includes(this.searchIp.trim()));
    }
    if (this.filterThreat !== 'all') {
      filtered = filtered.filter(l => l.threat_level === this.filterThreat);
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-10 text-center text-slate-400">Không có nhật ký nào phù hợp bộ lọc.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(l => {
      let threatBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Bình thường</span>`;
      if (l.threat_level === 'suspicious') {
        threatBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Đáng ngờ</span>`;
      } else if (l.threat_level === 'danger') {
        threatBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">Nguy hiểm</span>`;
      }

      return `
        <tr class="hover:bg-slate-50/80 transition ${l.is_blocked ? 'bg-rose-50/40' : ''}">
          <td class="py-2.5 px-3 text-slate-500 font-mono text-[10px]">${l.created_at}</td>
          <td class="py-2.5 px-3 font-mono font-bold text-slate-900">${l.ip_address}</td>
          <td class="py-2.5 px-3">
            <span class="font-mono text-[10px] font-bold ${l.method === 'POST' ? 'text-blue-600' : 'text-emerald-600'}">${l.method}</span>
          </td>
          <td class="py-2.5 px-3 font-mono text-slate-700 max-w-[200px] truncate" title="${l.endpoint}">${l.endpoint}</td>
          <td class="py-2.5 px-3">
            <span class="font-mono text-[11px] font-bold ${l.status_code === 403 ? 'text-rose-600' : (l.status_code >= 400 ? 'text-amber-600' : 'text-emerald-600')}">
              ${l.status_code || 200}
            </span>
          </td>
          <td class="py-2.5 px-3">${threatBadge}</td>
          <td class="py-2.5 px-3 text-right">
            ${l.is_blocked 
              ? `<span class="text-[10px] font-bold text-rose-600">ĐÃ CHẶN</span>`
              : `<button onclick="IpSecurityPage.quickBanIp('${l.ip_address}')" class="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] transition border border-rose-200">Chặn IP</button>`
            }
          </td>
        </tr>
      `;
    }).join('');
  },

  switchTab(tab) {
    this.currentTab = tab;
    const btnRules = document.getElementById('tab-btn-rules');
    const btnLogs = document.getElementById('tab-btn-logs');
    const pnlRules = document.getElementById('sec-panel-rules');
    const pnlLogs = document.getElementById('sec-panel-logs');

    if (tab === 'rules') {
      pnlRules.classList.remove('hidden');
      pnlLogs.classList.add('hidden');
      btnRules.className = 'px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 bg-slate-900 text-white shadow-xs';
      btnLogs.className = 'px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 text-slate-600 hover:bg-slate-100';
    } else {
      pnlRules.classList.add('hidden');
      pnlLogs.classList.remove('hidden');
      btnLogs.className = 'px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 bg-slate-900 text-white shadow-xs';
      btnRules.className = 'px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 text-slate-600 hover:bg-slate-100';
    }
    lucide.createIcons();
  },

  handleSearch(val) {
    this.searchIp = val;
    this.renderRules();
    this.renderLogs();
  },

  filterLogs(threat) {
    this.filterThreat = threat;
    this.renderLogs();
  },

  openAddRuleModal(prefillIp = '') {
    const modalContent = `
      <div class="space-y-4">
        <div>
          <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <span class="text-rose-600">🚫</span>
            <span>Chặn Địa Chỉ IP Truy Cập Hệ Thống</span>
          </h3>
          <p class="text-xs text-slate-500 mt-1">Khi bị chặn, địa chỉ IP này sẽ không thể gửi yêu cầu hay đăng nhập vào hệ thống.</p>
        </div>

        <form id="modal-ban-ip-form" onsubmit="IpSecurityPage.submitBanIp(event)" class="space-y-3">
          <div>
            <label class="block font-bold text-slate-700 text-xs mb-1">Địa chỉ IP cần chặn *</label>
            <input type="text" id="ban-ip-input" required value="${prefillIp}" placeholder="VD: 113.190.22.41 hoặc 192.168.1.100" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden">
          </div>

          <div>
            <label class="block font-bold text-slate-700 text-xs mb-1">Lý do đưa vào danh sách chặn *</label>
            <select id="ban-reason-select" class="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-xs text-slate-800">
              <option value="Dò quét mật khẩu đăng nhập trái phép (Brute-force)">Dò quét mật khẩu đăng nhập trái phép (Brute-force)</option>
              <option value="Spam yêu cầu gửi mã SMS OTP liên tục">Spam yêu cầu gửi mã SMS OTP liên tục</option>
              <option value="Quét cổng lỗ hổng bảo mật hệ thống (Port scanning)">Quét cổng lỗ hổng bảo mật hệ thống (Port scanning)</option>
              <option value="Tấn công từ chối dịch vụ tần suất cao (DDoS / Flood)">Tấn công từ chối dịch vụ tần suất cao (DDoS / Flood)</option>
              <option value="Nghi vấn thiết bị của kẻ gian chiếm quyền">Nghi vấn thiết bị của kẻ gian chiếm quyền</option>
            </select>
          </div>

          <div class="pt-2 flex justify-end gap-2">
            <button type="button" onclick="Modals.closeModal()" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
              Hủy bỏ
            </button>
            <button type="submit" class="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-md flex items-center gap-1.5">
              <i data-lucide="shield-ban" class="w-4 h-4"></i>
              <span>Xác nhận Chặn IP</span>
            </button>
          </div>
        </form>
      </div>
    `;

    Modals.openModal(modalContent);
    lucide.createIcons();
  },

  quickBanIp(ip) {
    this.openAddRuleModal(ip);
  },

  async submitBanIp(e) {
    e.preventDefault();
    const ip = document.getElementById('ban-ip-input')?.value?.trim();
    const reason = document.getElementById('ban-reason-select')?.value;

    if (!ip) {
      Modals.showToast('Vui lòng nhập địa chỉ IP cần chặn', 'error');
      return;
    }

    try {
      const res = await API.addIpRule({
        ip_address: ip,
        rule_type: 'blacklist',
        reason: reason
      });
      Modals.showToast(res.message, 'success');
      Modals.closeModal();
      await this.loadData();
    } catch (err) {
      Modals.showToast(err.message, 'error');
    }
  },

  async unbanIp(id, ip) {
    if (!confirm(`Bạn có chắc chắn muốn gỡ chặn địa chỉ IP ${ip} không?`)) return;

    try {
      const res = await API.deleteIpRule(id);
      Modals.showToast(res.message, 'success');
      await this.loadData();
    } catch (err) {
      Modals.showToast(err.message, 'error');
    }
  }
};

window.IpSecurityPage = IpSecurityPage;
