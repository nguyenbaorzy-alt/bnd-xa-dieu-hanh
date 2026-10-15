// Main Application Router & Controller
const App = {
  routes: {
    'login': LoginPage,
    'dashboard': DashboardPage,
    'doc-out': DocOutPage,
    'doc-create': DocFormPage,
    'doc-detail': DocDetailPage,
    'approval-inbox': ApprovalInboxPage,
    'approval-history': ApprovalHistoryPage,
    'doc-in': DocInPage,
    'citizen-portal': CitizenPortalPage,
    'request-tracking': RequestTrackingPage,
    'requests-manage': RequestsManagePage,
    'tasks': KpiWorkspacePage,
    'kpi-workspace': KpiWorkspacePage,
    'kpi-assistant': KpiAssistantPage,
    'kpi-algo': KpiAlgoPage,
    'kpi-dashboard': KpiDashboardPage,
    'service-rating': ServiceRatingPage,
    'app-rating': AppRatingPage,
    'rating-stats': RatingStatsPage,
    'reports': ReportsPage,
    'notifications': NotificationsPage,
    'users': UserManagementPage,
    'roles': RoleManagementPage,
    'unit-settings': UnitSettingsPage,
    'workflows': WorkflowSettingsPage,
    'audit-logs': AuditLogsPage,
    'ip-security': IpSecurityPage,
    'news': CommuneNewsPage
  },

  currentRoute: 'login',
  lastKnownIp: null,
  _ipPulseTimer: null,

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('auth-changed', () => this.handleRoute());

    // Kiểm tra thời hạn phiên đăng nhập 6 tiếng
    const sessionValid = API.isSessionValid();
    if (!sessionValid) {
      API.logout(false);
      // Mặc định khi vào web nếu chưa đăng nhập hoặc đã qua 6 tiếng thì luôn ở ngoài trang Đăng nhập
      if (!window.location.hash || window.location.hash === '#dashboard' || window.location.hash === '#') {
        window.location.hash = '#login';
      }
    } else {
      if (!window.location.hash || window.location.hash === '#') {
        window.location.hash = '#dashboard';
      }
    }

    // Khởi động Hệ thống Giám sát IP Liên tục (B-Firewall™ Continuous Heartbeat)
    this.startContinuousIpMonitoring();

    this.handleRoute();
  },

  startContinuousIpMonitoring() {
    this.checkIpPulse();

    // Chu kỳ giám sát liên tục mỗi 25 giây
    if (this._ipPulseTimer) clearInterval(this._ipPulseTimer);
    this._ipPulseTimer = setInterval(() => {
      this.checkIpPulse();
    }, 25000);
  },

  async checkIpPulse() {
    try {
      const savedLoc = localStorage.getItem('ubnd_last_location');
      const pulse = await API.sendSecurityPulse(savedLoc ? { address: savedLoc } : null);
      
      // Nếu IP bị chặn bởi tường lửa:
      if (pulse && pulse.is_blocked) {
        API.logout(false);
        window.location.hash = '#login';
        Modals.showToast(`CẢNH BÁO AN NINH: Địa chỉ IP ${pulse.ip_address} đã bị Tường lửa B-Firewall chặn truy cập!`, 'error');
        return;
      }

      // Phát hiện thay đổi địa chỉ IP
      if (pulse && this.lastKnownIp && this.lastKnownIp !== pulse.ip_address) {
        Modals.showToast(`Lưu ý an ninh: Địa chỉ IP vừa thay đổi từ ${this.lastKnownIp} sang ${pulse.ip_address} lúc ${pulse.server_time_vn}`, 'warning');
      }
      if (pulse) {
        this.lastKnownIp = pulse.ip_address;
      }
    } catch(err) {
      // Im lặng nếu không kết nối được
    }
  },

  async handleRoute() {
    let hash = window.location.hash.replace('#', '') || 'login';
    const routeName = hash.split('?')[0];

    // Kiểm tra đăng nhập và thời hạn phiên 6 tiếng
    const user = API.getUser();
    const sessionValid = API.isSessionValid();
    const publicRoutes = ['login', 'citizen-portal', 'request-tracking', 'app-rating', 'service-rating', 'news'];

    if ((!user || !sessionValid) && !publicRoutes.includes(routeName)) {
      API.logout(false);
      window.location.hash = '#login';
      return;
    }

    this.currentRoute = routeName;
    const pageHandler = this.routes[routeName] || DashboardPage;

    const appContainer = document.getElementById('app-root');
    if (!appContainer) return;

    if (routeName === 'login') {
      appContainer.innerHTML = `
        <div class="min-h-screen bg-slate-100 flex flex-col justify-center">
          ${await pageHandler.render()}
        </div>
      `;
      if (pageHandler.afterRender) await pageHandler.afterRender();
      lucide.createIcons();
      return;
    }

    // Render Shell: Header + Sidebar + Page Content
    appContainer.innerHTML = `
      <div class="min-h-screen bg-slate-100/90 flex flex-col">
        ${Header.render()}
        
        <div class="flex-1 flex overflow-hidden">
          ${Sidebar.render(routeName)}
          
          <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1680px] mx-auto w-full">
            ${await pageHandler.render()}
          </main>
        </div>
      </div>
    `;

    // Attach Header and Sidebar events
    Header.attachEvents();
    Sidebar.attachEvents();

    if (pageHandler.afterRender) {
      await pageHandler.afterRender();
    }

    lucide.createIcons();
    window.scrollTo(0, 0);
  },

  refreshView() {
    this.handleRoute();
  }
};

window.App = App;

// Bootstrap on DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
