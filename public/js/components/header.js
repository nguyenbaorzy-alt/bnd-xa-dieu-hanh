// Header Component with System Title, Unit Info, Quick Switcher & Notifications
const Header = {
  render() {
    const user = API.getUser();
    return `
      <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div class="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          
          <!-- Left: Mobile Menu Button & Brand Title -->
          <div class="flex items-center gap-3">
            <button id="sidebar-toggle" class="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-hidden" title="Mở/Đóng thanh điều hướng">
              <i data-lucide="menu" class="w-5 h-5"></i>
            </button>

            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-900 via-blue-800 to-indigo-700 flex items-center justify-center text-amber-300 shadow-md shrink-0">
                <i data-lucide="landmark" class="w-5 h-5"></i>
              </div>
              <div class="hidden sm:block">
                <div class="flex items-center gap-2">
                  <span id="header-unit-name" class="font-bold text-slate-800 text-sm tracking-wide uppercase">UBND XÃ TÂN TRIỀU</span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Dữ liệu minh họa
                  </span>
                </div>
                <div class="text-xs text-slate-500 font-medium truncate max-w-md">
                  Hệ thống Điều hành Công văn và Dịch vụ Trực tuyến
                </div>
              </div>
            </div>
          </div>

          <!-- Center: Demo Quick Role Switcher -->
          <div class="hidden xl:flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs">
            <span class="px-2 font-semibold text-slate-500 flex items-center gap-1">
              <i data-lucide="users" class="w-3.5 h-3.5"></i> Chuyển vai trò:
            </span>
            <button onclick="Header.switchRole('chutich')" class="px-2.5 py-1 rounded-lg font-medium transition ${user && user.username === 'chutich' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-700 hover:bg-white'}">
              🏛️ Chủ tịch
            </button>
            <button onclick="Header.switchRole('phochutich')" class="px-2.5 py-1 rounded-lg font-medium transition ${user && user.username === 'phochutich' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-700 hover:bg-white'}">
              ✍️ Phó Chủ tịch
            </button>
            <button onclick="Header.switchRole('canbo_vp')" class="px-2.5 py-1 rounded-lg font-medium transition ${user && user.username === 'canbo_vp' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-700 hover:bg-white'}">
              📋 Cán bộ VP
            </button>
            <button onclick="Header.switchRole('canbo_dc')" class="px-2.5 py-1 rounded-lg font-medium transition ${user && user.username === 'canbo_dc' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-700 hover:bg-white'}">
              📐 Cán bộ ĐC
            </button>
            <button onclick="Header.switchRole('nguoidan')" class="px-2.5 py-1 rounded-lg font-medium transition ${user && user.username === 'nguoidan' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-700 hover:bg-white'}">
              👤 Người dân
            </button>
            <button onclick="Header.switchRole('admin')" class="px-2.5 py-1 rounded-lg font-medium transition ${user && user.username === 'admin' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-700 hover:bg-white'}">
              🛡️ Admin
            </button>
          </div>

          <!-- Right: Live Clock, UI Rating Button, Notifications & Profile -->
          <div class="flex items-center gap-2.5">

            <!-- Live Hanoi Clock Badge (Múi giờ Hà Nội GMT+7) -->
            <div class="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-bold shadow-2xs" title="Giờ chuẩn Việt Nam (Hà Nội - GMT+7)">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <i data-lucide="clock" class="w-3.5 h-3.5 text-blue-700"></i>
              <span id="live-header-clock">--:--:-- (Giờ Hà Nội)</span>
            </div>
            
            <!-- Nút Quét NFC & AI Face eKYC cho Công Dân -->
            ${user && user.role === 'citizen' ? `
              <button onclick="Modals.openInWebEkycModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white hover:from-blue-800 hover:to-indigo-900 transition shadow-xs" title="Quét thẻ NFC chip CCCD & Xác minh khuôn mặt AI Mức 2">
                <i data-lucide="scan-face" class="w-3.5 h-3.5 text-amber-300"></i>
                <span class="hidden sm:inline">Quét NFC & Khuôn mặt</span>
                <span class="sm:hidden">eKYC</span>
              </button>
            ` : ''}

            <!-- Quick UI Rating Button (Mục bắt buộc) -->
            <button onclick="Modals.openAppRatingModal()" class="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-800 border border-amber-300 hover:bg-amber-500 hover:text-white transition shadow-2xs" title="Đánh giá giao diện & trải nghiệm app">
              <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
              <span>Đánh giá giao diện app</span>
            </button>

            <!-- Notifications Bell -->
            <div class="relative">
              <button id="notif-bell-btn" class="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition">
                <i data-lucide="bell" class="w-5 h-5"></i>
                <span id="notif-badge" class="hidden absolute top-1 right-1 w-2.5 h-2.5 bg-rose-600 rounded-full border-2 border-white animate-pulse"></span>
              </button>

              <!-- Notifications Dropdown -->
              <div id="notif-dropdown" class="hidden absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div class="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <i data-lucide="bell" class="w-4 h-4 text-blue-600"></i>
                    <span>Thông báo hệ thống</span>
                  </div>
                  <button onclick="Header.markAllRead()" class="text-xs text-blue-600 hover:underline font-medium">
                    Đã đọc tất cả
                  </button>
                </div>
                <div id="notif-list-container" class="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                  <div class="p-6 text-center text-slate-400">Đang tải thông báo...</div>
                </div>
                <div class="p-2 bg-slate-50 border-t border-slate-200 text-center">
                  <a href="#notifications" class="text-xs font-medium text-blue-600 hover:text-blue-800">Xem tất cả thông báo</a>
                </div>
              </div>
            </div>

            <!-- User Menu -->
            ${user ? `
              <div class="relative">
                <button id="user-menu-btn" class="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition focus:outline-hidden">
                  <div class="w-8 h-8 rounded-full bg-blue-900 text-amber-300 font-bold flex items-center justify-center text-xs shadow-xs">
                    ${user.full_name ? user.full_name.charAt(0) : 'U'}
                  </div>
                  <div class="text-left hidden lg:block">
                    <div class="text-xs font-bold text-slate-800 leading-tight">${user.full_name}</div>
                    <div class="text-[10px] text-slate-500 font-medium">${user.position || user.role}</div>
                  </div>
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 hidden lg:block"></i>
                </button>

                <!-- User Dropdown -->
                <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 py-1 text-xs">
                  <div class="px-4 py-3 border-b border-slate-100">
                    <div class="font-bold text-slate-800">${user.full_name}</div>
                    <div class="text-slate-500 text-[11px] truncate">${user.department || user.role}</div>
                    <div class="text-slate-400 text-[10px] font-mono mt-0.5">@${user.username}</div>
                  </div>

                  <!-- Thẻ thông tin phiên làm việc bảo mật 6 tiếng & Vị trí GPS -->
                  <div class="p-2 bg-slate-50 rounded-xl m-2 border border-slate-100 text-[10px] space-y-1">
                    <div class="flex items-center justify-between font-bold text-slate-700">
                      <span class="flex items-center gap-1">
                        <i data-lucide="shield-check" class="w-3 h-3 text-emerald-600"></i>
                        <span>Phiên bảo mật:</span>
                      </span>
                      <span class="text-emerald-700 font-bold">Giới hạn 6h</span>
                    </div>
                    <div class="font-mono text-emerald-800 font-bold" id="header-session-time">
                      Đang tính thời gian...
                    </div>
                    ${user.last_login_location ? `
                      <div class="text-[10px] text-slate-500 truncate" title="${user.last_login_location}">
                        📍 ${user.last_login_location}
                      </div>
                    ` : ''}
                  </div>

                  <a href="#app-rating" class="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition">
                    <i data-lucide="star" class="w-4 h-4 text-amber-500"></i>
                    <span>Đánh giá giao diện & app</span>
                  </a>
                  <a href="#notifications" class="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition">
                    <i data-lucide="bell" class="w-4 h-4 text-blue-500"></i>
                    <span>Thông báo của tôi</span>
                  </a>
                  ${user.role === 'citizen' ? `
                    <button onclick="Modals.openInWebEkycModal(); document.getElementById('user-dropdown')?.classList.add('hidden');" class="w-full text-left flex items-center gap-2.5 px-4 py-2 text-indigo-700 hover:bg-indigo-50 transition font-bold">
                      <i data-lucide="scan-face" class="w-4 h-4 text-indigo-600"></i>
                      <span>Xác thực NFC & eKYC Mức 2</span>
                    </button>
                  ` : ''}
                  ${user.role === 'admin' ? `
                    <a href="#ip-security" class="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition">
                      <i data-lucide="shield-alert" class="w-4 h-4 text-indigo-600"></i>
                      <span>Giám sát an ninh mạng (B-Firewall)</span>
                    </a>
                    <a href="#unit-settings" class="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition">
                      <i data-lucide="settings" class="w-4 h-4 text-slate-500"></i>
                      <span>Cài đặt hệ thống & đơn vị</span>
                    </a>
                  ` : ''}
                  <div class="border-t border-slate-100 my-1"></div>
                  <button onclick="API.logout()" class="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-rose-600 hover:bg-rose-50 transition font-bold">
                    <i data-lucide="log-out" class="w-4 h-4"></i>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            ` : `
              <a href="#login" class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition shadow-2xs">
                Đăng nhập
              </a>
            `}
          </div>

        </div>
      </header>
    `;
  },

  async switchRole(username) {
    try {
      await API.quickSwitch(username);
      Modals.showToast(`Đã chuyển sang tài khoản ${username}`, 'success');
      App.refreshView();
    } catch (err) {
      Modals.showToast(err.message, 'error');
    }
  },

  async loadNotifications() {
    const user = API.getUser();
    if (!user) return;
    try {
      const res = await API.getNotifications();
      const badge = document.getElementById('notif-badge');
      const list = document.getElementById('notif-list-container');

      if (badge) {
        if (res.unread_count > 0) {
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }

      if (list) {
        if (!res.notifications || res.notifications.length === 0) {
          list.innerHTML = `<div class="p-6 text-center text-slate-400">Không có thông báo nào</div>`;
        } else {
          list.innerHTML = res.notifications.map(n => `
            <div class="p-3 hover:bg-slate-50 transition flex items-start gap-2.5 ${n.is_read ? 'opacity-70' : 'bg-blue-50/40'}">
              <span class="p-1.5 rounded-lg shrink-0 ${n.category === 'approval' ? 'bg-amber-100 text-amber-700' : (n.category === 'warning' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700')}">
                <i data-lucide="${n.category === 'approval' ? 'stamp' : (n.category === 'warning' ? 'alert-triangle' : 'info')}" class="w-3.5 h-3.5"></i>
              </span>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-slate-800">${n.title}</div>
                <div class="text-slate-600 mt-0.5 line-clamp-2">${n.message}</div>
                <div class="text-[10px] text-slate-400 mt-1">${n.created_at || ''}</div>
              </div>
            </div>
          `).join('');
          lucide.createIcons();
        }
      }
    } catch (e) {
      // quiet error
    }
  },

  async markAllRead() {
    try {
      await API.markAllNotificationsRead();
      this.loadNotifications();
      Modals.showToast('Đã đánh dấu đã đọc tất cả thông báo', 'success');
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  },

  attachEvents() {
    // Dropdown toggles
    const bellBtn = document.getElementById('notif-bell-btn');
    const notifDropdown = document.getElementById('notif-dropdown');
    if (bellBtn && notifDropdown) {
      bellBtn.onclick = (e) => {
        e.stopPropagation();
        notifDropdown.classList.toggle('hidden');
        if (!notifDropdown.classList.contains('hidden')) {
          Header.loadNotifications();
        }
      };
    }

    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    if (userMenuBtn && userDropdown) {
      userMenuBtn.onclick = (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
      };
    }

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      if (notifDropdown) notifDropdown.classList.add('hidden');
      if (userDropdown) userDropdown.classList.add('hidden');
    });

    // Mobile sidebar toggle
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (toggle && sidebar) {
      toggle.onclick = () => {
        sidebar.classList.toggle('-translate-x-full');
      };
    }

    // Load initial notifs
    this.loadNotifications();

    // Start Live Clock & Session Timer
    this.startClock();
  },

  startClock() {
    const update = () => {
      const clockEl = document.getElementById('live-header-clock');
      if (clockEl) {
        const now = new Date();
        const timeStr = new Intl.DateTimeFormat('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour12: false
        }).format(now);
        clockEl.innerText = `${timeStr} (Giờ Hà Nội)`;
      }

      const sessEl = document.getElementById('header-session-time');
      if (sessEl && API.getSessionRemainingMs) {
        const ms = API.getSessionRemainingMs();
        if (ms <= 0) {
          sessEl.innerText = 'Đã hết hạn phiên làm việc (quá 6h)';
          sessEl.className = 'font-mono text-rose-600 font-bold';
        } else {
          const hours = Math.floor(ms / (1000 * 60 * 60));
          const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
          sessEl.innerText = `Còn ${hours} giờ ${mins} phút (Tự hết hạn sau 6h)`;
          sessEl.className = 'font-mono text-emerald-800 font-bold';
        }
      }
    };

    update();
    if (this._clockTimer) clearInterval(this._clockTimer);
    this._clockTimer = setInterval(update, 1000);
  }
};

window.Header = Header;
