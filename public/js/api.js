// API Client for UBND Administrative System
const API = {
  baseUrl: '',

  getToken() {
    return localStorage.getItem('ubnd_token') || '';
  },

  setToken(token) {
    if (token) localStorage.setItem('ubnd_token', token);
    else localStorage.removeItem('ubnd_token');
  },

  getUser() {
    const u = localStorage.getItem('ubnd_user');
    try {
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    if (user) localStorage.setItem('ubnd_user', JSON.stringify(user));
    else localStorage.removeItem('ubnd_user');
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = options.headers || {};

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/public/')) {
          this.setToken(null);
          this.setUser(null);
          window.location.hash = '#login';
          window.dispatchEvent(new CustomEvent('auth-changed'));
        }
        throw new Error(data.error || `Lỗi máy chủ (${response.status})`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  // Auth
  async login(username, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setToken(data.token);
    this.setUser(data.user);
    window.dispatchEvent(new CustomEvent('auth-changed'));
    return data;
  },

  async register(userData) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    this.setToken(data.token);
    this.setUser(data.user);
    window.dispatchEvent(new CustomEvent('auth-changed'));
    return data;
  },

  async quickSwitch(username) {
    const data = await this.request('/api/auth/quick-switch', {
      method: 'POST',
      body: JSON.stringify({ username })
    });
    this.setToken(data.token);
    this.setUser(data.user);
    window.dispatchEvent(new CustomEvent('auth-changed'));
    return data;
  },

  logout() {
    this.setToken(null);
    this.setUser(null);
    window.dispatchEvent(new CustomEvent('auth-changed'));
    window.location.hash = '#login';
  },

  async getMe() {
    return this.request('/api/auth/me');
  },

  // Settings
  async getSettings() {
    return this.request('/api/settings');
  },
  async updateSettings(settings) {
    return this.request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },
  async resetDemo() {
    return this.request('/api/settings/reset-demo', { method: 'POST' });
  },

  // Users & Roles
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/users?${query}`);
  },
  async createUser(userData) {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  async updateUser(id, userData) {
    return this.request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },
  async toggleUserStatus(id) {
    return this.request(`/api/users/${id}/toggle-status`, { method: 'POST' });
  },
  async getRoles() {
    return this.request('/api/roles');
  },

  // Workflows
  async getWorkflows() {
    return this.request('/api/workflows');
  },
  async updateWorkflow(id, data) {
    return this.request(`/api/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Outbound Docs (Công văn đi)
  async getDocOutList(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/doc-out?${query}`);
  },
  async getDocOutDetail(id) {
    return this.request(`/api/doc-out/${id}`);
  },
  async createDocOut(data) {
    return this.request('/api/doc-out', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateDocOut(id, data) {
    return this.request(`/api/doc-out/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async submitDocOut(id, comment, target_approver_id = null) {
    return this.request(`/api/doc-out/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ comment, target_approver_id })
    });
  },
  async approveDocOut(id, comment) {
    return this.request(`/api/doc-out/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment })
    });
  },
  async requestEditDocOut(id, comment) {
    return this.request(`/api/doc-out/${id}/request-edit`, {
      method: 'POST',
      body: JSON.stringify({ comment })
    });
  },
  async rejectDocOut(id, comment) {
    return this.request(`/api/doc-out/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comment })
    });
  },
  async publishDocOut(id) {
    return this.request(`/api/doc-out/${id}/publish`, { method: 'POST' });
  },
  async revokeDocOut(id, reason) {
    return this.request(`/api/doc-out/${id}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  // Approvals Inbox
  async getPendingApprovals() {
    return this.request('/api/approvals/pending');
  },
  async getProcessedApprovals() {
    return this.request('/api/approvals/processed');
  },
  async getApprovalHistory() {
    return this.request('/api/approvals/history');
  },

  // Inbound Docs (Công văn đến)
  async getDocInList(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/doc-in?${query}`);
  },
  async getDocInDetail(id) {
    return this.request(`/api/doc-in/${id}`);
  },
  async createDocIn(data) {
    return this.request('/api/doc-in', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async assignDocIn(id, data) {
    return this.request(`/api/doc-in/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateDocInProgress(id, data) {
    return this.request(`/api/doc-in/${id}/update-progress`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Online Requests
  async submitPublicRequest(data) {
    return this.request('/api/public/requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async trackPublicRequest(code, verify = '') {
    const q = new URLSearchParams({ code, verify }).toString();
    return this.request(`/api/public/requests/track?${q}`);
  },
  async getRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/requests?${query}`);
  },
  async getRequestDetail(id) {
    return this.request(`/api/requests/${id}`);
  },
  async respondRequest(id, data) {
    return this.request(`/api/requests/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Tasks
  async getTasks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/tasks?${query}`);
  },
  async createTask(data) {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateTaskProgress(id, data) {
    return this.request(`/api/tasks/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async getTaskComments(id) {
    return this.request(`/api/tasks/${id}/comments`);
  },
  async addTaskComment(id, content) {
    return this.request(`/api/tasks/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },

  // Ratings
  async submitServiceRating(data) {
    return this.request('/api/ratings/service', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async submitAppUiRating(data) {
    return this.request('/api/ratings/app-ui', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async getRatingStats() {
    return this.request('/api/ratings/stats');
  },

  // Attachments
  async uploadFile(formData) {
    return this.request('/api/upload', {
      method: 'POST',
      body: formData
    });
  },
  async deleteAttachment(id) {
    return this.request(`/api/attachments/${id}`, { method: 'DELETE' });
  },

  // Dashboard & Stats
  async getDashboardStats() {
    return this.request('/api/dashboard/stats');
  },

  // Notifications
  async getNotifications(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/notifications?${query}`);
  },
  async markNotificationRead(id) {
    return this.request(`/api/notifications/${id}/read`, { method: 'POST' });
  },
  async markAllNotificationsRead() {
    return this.request('/api/notifications/read-all', { method: 'POST' });
  },

  // Reports & Audits
  async getReportSummary(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/reports/summary?${query}`);
  },
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/audit-logs?${query}`);
  },

  // ==========================================
  // HANOIWORK OKR/KPI & AI ASSISTANT APIS
  // ==========================================
  async getKpiHierarchy() {
    return this.request('/api/kpi/hierarchy');
  },
  async getKpiProjects(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/kpi/projects?${query}`);
  },
  async getKpiProjectDetail(id) {
    return this.request(`/api/kpi/projects/${id}`);
  },
  async createKpiProject(data) {
    return this.request('/api/kpi/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateKpiProject(id, data) {
    return this.request(`/api/kpi/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deleteKpiProject(id) {
    return this.request(`/api/kpi/projects/${id}`, {
      method: 'DELETE'
    });
  },
  async createKpiFolder(data) {
    return this.request('/api/kpi/folders', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateKpiFolder(id, data) {
    return this.request(`/api/kpi/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async deleteKpiFolder(id) {
    return this.request(`/api/kpi/folders/${id}`, {
      method: 'DELETE'
    });
  },
  async createKpiActionProgram(data) {
    return this.request('/api/kpi/action-programs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateKpiActionProgram(id, data) {
    return this.request(`/api/kpi/action-programs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async duplicateKpiActionProgram(id) {
    return this.request(`/api/kpi/action-programs/${id}/duplicate`, {
      method: 'POST'
    });
  },
  async deleteKpiActionProgram(id) {
    return this.request(`/api/kpi/action-programs/${id}`, {
      method: 'DELETE'
    });
  },
  async getKpiTaskTypes() {
    return this.request('/api/kpi/task-types');
  },
  async getKpiTasks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/kpi/tasks?${query}`);
  },
  async getKpiTaskDetail(id) {
    return this.request(`/api/kpi/tasks/${id}`);
  },
  async createKpiTask(data) {
    return this.request('/api/kpi/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateKpiTask(id, data) {
    return this.request(`/api/kpi/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async completeKpiTask(id, data) {
    return this.request(`/api/kpi/tasks/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async decomposeKpiTask(id, data) {
    return this.request(`/api/kpi/tasks/${id}/decompose`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async deleteKpiTask(id) {
    return this.request(`/api/kpi/tasks/${id}`, {
      method: 'DELETE'
    });
  },
  async aiDescribeKpiTask(data) {
    return this.request('/api/kpi/tasks/ai-describe', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  // AI KPI Assistant 5-step Pipeline
  async getKpiAssistantSamples() {
    return this.request('/api/kpi-assistant/sample-documents');
  },
  async extractKpiAssistant(data) {
    return this.request('/api/kpi-assistant/extract', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async standardizeKpiAssistant(data) {
    return this.request('/api/kpi-assistant/standardize', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async auditSixClearKpiAssistant(data) {
    return this.request('/api/kpi-assistant/audit-6-clear', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async simulateKpiAssistant(data) {
    return this.request('/api/kpi-assistant/simulate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async approveAndImportKpiAssistant(data) {
    return this.request('/api/kpi-assistant/approve-and-import', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async getKpiAssistantSessions() {
    return this.request('/api/kpi-assistant/sessions');
  },
  // Dashboard & AI Analytics
  async getKpiDashboardStats(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/kpi/dashboard/stats?${query}`);
  },
  async kpiAiAnalyze(data = {}) {
    return this.request('/api/kpi/ai-analyze', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async kpiAiChat(question) {
    return this.request('/api/kpi/ai-chat', {
      method: 'POST',
      body: JSON.stringify({ question })
    });
  }
};

window.API = API;
