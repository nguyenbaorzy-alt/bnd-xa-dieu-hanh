// Tasks & Assignments Management Page (Nhiệm vụ & Tiến độ)
const TasksPage = {
  async render() {
    const user = API.getUser();
    if (user && user.role === 'citizen') {
      return `<div class="p-8 bg-white rounded-2xl border text-center text-slate-500">Bạn không có quyền truy cập bảng nhiệm vụ nội bộ</div>`;
    }

    return `
      <div class="space-y-6">
        
        <!-- Header & Action -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="check-square" class="w-5 h-5 text-blue-700"></i>
              <span>Nhiệm vụ & Tiến độ công việc</span>
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">Lãnh đạo giao nhiệm vụ, cán bộ cập nhật % hoàn thành và báo cáo kết quả</p>
          </div>

          <button onclick="TasksPage.openCreateModal()" class="px-4 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition flex items-center gap-1.5 shadow-xs">
            <i data-lucide="plus" class="w-4 h-4"></i> Giao việc mới
          </button>
        </div>

        <!-- Filter -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Trạng thái công việc</label>
              <select id="task-filter-status" onchange="TasksPage.loadData()" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <option value="all">Tất cả nhiệm vụ</option>
                <option value="pending">Chưa bắt đầu</option>
                <option value="in_progress">Đang thực hiện</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="overdue">Quá hạn</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-600 mb-1">Mức độ ưu tiên</label>
              <select id="task-filter-priority" onchange="TasksPage.loadData()" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <option value="all">Tất cả</option>
                <option value="normal">Thường</option>
                <option value="urgent">Khẩn</option>
                <option value="emergency">Hỏa tốc</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Tasks Cards List -->
        <div id="tasks-list-container" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-8 text-center text-slate-400 text-xs md:col-span-2">Đang tải danh sách nhiệm vụ...</div>
        </div>

      </div>
    `;
  },

  async loadData() {
    const status = document.getElementById('task-filter-status')?.value || 'all';
    const priority = document.getElementById('task-filter-priority')?.value || 'all';

    try {
      const tasks = await API.getTasks({ status, priority });
      const container = document.getElementById('tasks-list-container');
      if (!container) return;

      if (!tasks || tasks.length === 0) {
        container.innerHTML = `<div class="p-12 text-center text-slate-400 text-xs md:col-span-2 bg-white rounded-3xl border border-slate-200">Không có nhiệm vụ nào</div>`;
        return;
      }

      const statusMap = {
        pending: { label: 'Chưa bắt đầu', color: 'bg-slate-100 text-slate-700' },
        in_progress: { label: 'Đang thực hiện', color: 'bg-blue-100 text-blue-800' },
        completed: { label: 'Hoàn thành 100%', color: 'bg-emerald-100 text-emerald-800' },
        overdue: { label: 'Quá hạn', color: 'bg-rose-100 text-rose-800' }
      };

      container.innerHTML = tasks.map(t => {
        const st = statusMap[t.status] || { label: t.status, color: 'bg-slate-100 text-slate-700' };
        return `
          <div class="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4 text-xs hover:border-blue-400 transition">
            
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold ${t.priority === 'urgent' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'}">
                    ${t.priority === 'urgent' ? 'Khẩn' : (t.priority === 'emergency' ? 'Hỏa tốc' : 'Thường')}
                  </span>
                  <span class="text-[11px] text-slate-400">Hạn: <strong class="font-mono text-slate-700">${t.due_date}</strong></span>
                </div>
                <h3 class="font-bold text-slate-900 text-sm mt-1.5">${t.title}</h3>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${st.color}">
                ${st.label}
              </span>
            </div>

            <p class="text-slate-600 line-clamp-2 leading-relaxed">
              ${t.description || 'Không có mô tả chi tiết'}
            </p>

            <!-- Progress Bar -->
            <div class="space-y-1">
              <div class="flex justify-between font-bold text-[11px]">
                <span class="text-slate-500">Tiến độ hoàn thành:</span>
                <span class="${t.progress_percent >= 100 ? 'text-emerald-700' : 'text-blue-700'}">${t.progress_percent}%</span>
              </div>
              <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-300 ${t.progress_percent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}" style="width: ${t.progress_percent}%"></div>
              </div>
            </div>

            <!-- Footer: Assignee & Button -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <div>
                <span class="text-slate-400">Phụ trách: </span>
                <strong class="text-slate-800">${t.assignee_name}</strong>
              </div>

              <button onclick="TasksPage.openUpdateProgressModal(${t.id}, ${t.progress_percent}, '${t.status}', '${t.title.replace(/'/g, "\\'")}')" class="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold transition">
                Cập nhật tiến độ
              </button>
            </div>

          </div>
        `;
      }).join('');

      lucide.createIcons({ root: container });
    } catch (e) {
      console.error(e);
    }
  },

  // Modal Giao việc mới
  async openCreateModal() {
    const users = await API.getUsers({ role: 'officer' });
    const modal = document.createElement('div');
    modal.id = 'create-task-modal';
    modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
        <h3 class="text-sm font-bold text-slate-900 pb-3 border-b flex items-center gap-2">
          <i data-lucide="check-square" class="w-4 h-4 text-blue-700"></i>
          <span>Giao nhiệm vụ mới cho cán bộ</span>
        </h3>

        <form id="create-task-form" class="py-4 space-y-4">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Tên nhiệm vụ / công việc *</label>
            <input type="text" name="title" required placeholder="Ví dụ: Rà soát đất công ích thôn Yên Xá..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Cán bộ phụ trách *</label>
              <select name="assignee_id" required class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium">
                <option value="">-- Chọn cán bộ --</option>
                ${users.map(u => `<option value="${u.id}">${u.full_name} (${u.department})</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Hạn hoàn thành *</label>
              <input type="date" name="due_date" required class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium">
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Mức độ ưu tiên</label>
            <select name="priority" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium">
              <option value="normal" selected>Thường</option>
              <option value="urgent">Khẩn</option>
              <option value="emergency">Hỏa tốc</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Mô tả chi tiết yêu cầu công việc</label>
            <textarea name="description" rows="3" placeholder="Ghi rõ nội dung, hồ sơ liên quan và mục tiêu cần đạt..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"></textarea>
          </div>

          <div class="pt-3 border-t flex justify-end gap-2">
            <button type="button" onclick="document.getElementById('create-task-modal').remove()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">
              Hủy
            </button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 shadow-md">
              Giao nhiệm vụ
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons({ root: modal });

    document.getElementById('create-task-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const payload = Object.fromEntries(formData.entries());

      try {
        await API.createTask(payload);
        modal.remove();
        Modals.showToast('Giao nhiệm vụ thành công!', 'success');
        TasksPage.loadData();
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  },

  // Modal Cập nhật tiến độ %
  openUpdateProgressModal(taskId, currentPercent, currentStatus, taskTitle) {
    const modal = document.createElement('div');
    modal.id = 'update-task-modal';
    modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-xs">
        <h3 class="text-sm font-bold text-slate-900 pb-3 border-b">
          Cập nhật tiến độ: "${taskTitle}"
        </h3>

        <form id="update-task-form" class="py-4 space-y-4">
          <div>
            <div class="flex items-center justify-between font-bold text-slate-700 mb-1">
              <span>Tiến độ hoàn thành:</span>
              <span id="slider-percent-label" class="text-blue-700 text-sm font-black">${currentPercent}%</span>
            </div>
            <input type="range" id="progress-slider" min="0" max="100" value="${currentPercent}" oninput="document.getElementById('slider-percent-label').innerText = this.value + '%'" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600">
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Trạng thái công việc</label>
            <select id="task-status-select" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium">
              <option value="in_progress" ${currentStatus === 'in_progress' ? 'selected' : ''}>Đang thực hiện</option>
              <option value="completed" ${currentPercent === 100 || currentStatus === 'completed' ? 'selected' : ''}>Hoàn thành</option>
              <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>Chưa bắt đầu</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Báo cáo kết quả / Khó khăn vướng mắc</label>
            <textarea id="task-result-note" rows="3" placeholder="Nhập diễn biến thực hiện công việc..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"></textarea>
          </div>

          <div class="pt-3 border-t flex justify-end gap-2">
            <button type="button" onclick="document.getElementById('update-task-modal').remove()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">
              Hủy
            </button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 shadow-md">
              Cập nhật
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('update-task-form').onsubmit = async (e) => {
      e.preventDefault();
      const progress_percent = parseInt(document.getElementById('progress-slider').value, 10);
      const status = document.getElementById('task-status-select').value;
      const result_note = document.getElementById('task-result-note').value;

      try {
        await API.updateTaskProgress(taskId, { progress_percent, status, result_note });
        modal.remove();
        Modals.showToast('Cập nhật tiến độ nhiệm vụ thành công', 'success');
        TasksPage.loadData();
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  },

  async afterRender() {
    this.loadData();
  }
};

window.TasksPage = TasksPage;
