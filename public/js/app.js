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
    'ip-security': IpSecurityPage
  },

  currentRoute: 'dashboard',

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('auth-changed', () => this.handleRoute());

    // Nếu chưa đăng nhập và không phải đang ở trang public, tự động login demo hoặc mở dashboard
    const user = API.getUser();
    if (!user && !window.location.hash.includes('citizen-portal') && !window.location.hash.includes('request-tracking')) {
      // Tự động đăng nhập tài khoản Chủ tịch để tiện review ngay lập tức
      API.quickSwitch('chutich').then(() => {
        this.handleRoute();
      }).catch(() => {
        this.handleRoute();
      });
      return;
    }

    this.handleRoute();
  },

  async handleRoute() {
    let hash = window.location.hash.replace('#', '') || 'dashboard';
    const routeName = hash.split('?')[0];

    // Kiểm tra đăng nhập
    const user = API.getUser();
    const publicRoutes = ['login', 'citizen-portal', 'request-tracking', 'app-rating', 'service-rating'];

    if (!user && !publicRoutes.includes(routeName)) {
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
