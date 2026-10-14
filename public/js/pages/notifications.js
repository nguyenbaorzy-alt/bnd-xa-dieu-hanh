// Notifications Center Page (Trung tâm thông báo)
const NotificationsPage = {
  async render() {
    return `
      <div class="max-w-3xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h1 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="bell" class="w-5 h-5 text-blue-700"></i>
              <span>Trung tâm thông báo</span>
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">Cập nhật thời gian thực về công văn, phê duyệt, nhiệm vụ và hồ sơ</p>
          </div>

          <button onclick="NotificationsPage.markAllRead()" class="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition shadow-2xs">
            Đánh dấu tất cả đã đọc
          </button>
        </div>

        <!-- Filter Pills -->
        <div class="flex items-center gap-2 overflow-x-auto text-xs font-semibold py-1">
          <button onclick="NotificationsPage.filterType('all')" class="notif-filter-pill px-3 py-1.5 rounded-xl bg-blue-700 text-white shadow-2xs" data-type="all">Tất cả</button>
          <button onclick="NotificationsPage.filterType('approval')" class="notif-filter-pill px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" data-type="approval">Phê duyệt</button>
          <button onclick="NotificationsPage.filterType('doc_out')" class="notif-filter-pill px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" data-type="doc_out">Công văn đi</button>
          <button onclick="NotificationsPage.filterType('doc_in')" class="notif-filter-pill px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" data-type="doc_in">Công văn đến</button>
          <button onclick="NotificationsPage.filterType('request')" class="notif-filter-pill px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" data-type="request">Yêu cầu trực tuyến</button>
          <button onclick="NotificationsPage.filterType('task')" class="notif-filter-pill px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" data-type="task">Nhiệm vụ</button>
        </div>

        <!-- Notifications List -->
        <div id="notif-page-list" class="bg-white rounded-3xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden text-xs">
          <div class="p-12 text-center text-slate-400">Đang tải thông báo...</div>
        </div>

      </div>
    `;
  },

  async filterType(category) {
    document.querySelectorAll('.notif-filter-pill').forEach(b => {
      if (b.dataset.type === category) {
        b.className = 'notif-filter-pill px-3 py-1.5 rounded-xl bg-blue-700 text-white shadow-2xs';
      } else {
        b.className = 'notif-filter-pill px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50';
      }
    });

    await this.loadList(category);
  },

  async loadList(category = 'all') {
    const container = document.getElementById('notif-page-list');
    if (!container) return;

    try {
      const res = await API.getNotifications({ category });
      if (!res.notifications || res.notifications.length === 0) {
        container.innerHTML = `<div class="p-12 text-center text-slate-400">Không có thông báo nào trong mục này</div>`;
        return;
      }

      container.innerHTML = res.notifications.map(n => `
        <div class="p-4 hover:bg-slate-50/80 transition flex items-start justify-between gap-4 ${n.is_read ? 'opacity-70' : 'bg-blue-50/30'}">
          <div class="flex items-start gap-3">
            <span class="p-2 rounded-xl shrink-0 mt-0.5 ${n.category === 'approval' ? 'bg-amber-100 text-amber-700' : (n.category === 'warning' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700')}">
              <i data-lucide="${n.category === 'approval' ? 'stamp' : (n.category === 'warning' ? 'alert-triangle' : 'info')}" class="w-4 h-4"></i>
            </span>
            <div class="space-y-0.5">
              <div class="font-bold text-slate-900">${n.title}</div>
              <p class="text-slate-700 leading-relaxed">${n.message}</p>
              <div class="text-[10px] text-slate-400 font-mono mt-1">${n.created_at}</div>
            </div>
          </div>

          <div class="shrink-0 flex items-center gap-2">
            ${!n.is_read ? `
              <button onclick="NotificationsPage.markRead(${n.id})" class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-[11px] font-semibold">
                Đánh dấu đã đọc
              </button>
            ` : '<span class="text-slate-400 text-[10px]">Đã xem</span>'}

            ${n.link_type === 'doc_out' ? `
              <a href="#doc-detail?id=${n.link_id}" class="px-3 py-1 rounded-lg bg-blue-700 text-white hover:bg-blue-800 text-[11px] font-bold">
                Xem
              </a>
            ` : (n.link_type === 'request' ? `
              <a href="#requests-manage" class="px-3 py-1 rounded-lg bg-blue-700 text-white hover:bg-blue-800 text-[11px] font-bold">
                Xem
              </a>
            ` : '')}
          </div>
        </div>
      `).join('');

      lucide.createIcons({ root: container });
    } catch (e) {
      container.innerHTML = `<div class="p-8 text-center text-rose-500">${e.message}</div>`;
    }
  },

  async markRead(id) {
    try {
      await API.markNotificationRead(id);
      this.loadList();
      Header.loadNotifications();
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  },

  async markAllRead() {
    try {
      await API.markAllNotificationsRead();
      Modals.showToast('Đã đánh dấu đã đọc tất cả', 'success');
      this.loadList();
      Header.loadNotifications();
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  },

  async afterRender() {
    this.loadList('all');
  }
};

window.NotificationsPage = NotificationsPage;
