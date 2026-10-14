// Module 2 & 3: Không gian làm việc HanoiWork Core (Cây 3 cấp, Phân quyền RBAC, Giao việc & Tính điểm KPI)
const KpiWorkspacePage = {
  hierarchy: [],
  selectedProjectId: null,
  selectedFolderId: null,
  selectedProgramId: null,
  tasks: [],
  taskTypes: [],
  users: [],
  filterStatus: 'all',
  filterPriority: 'all',
  showInlineForm: false,

  async render() {
    const user = API.getUser();
    if (user && user.role === 'citizen') {
      return `<div class="p-8 bg-white rounded-3xl border text-center text-slate-500">Bạn không có quyền truy cập Không gian làm việc HanoiWork</div>`;
    }

    return `
      <div class="space-y-6">
        
        <!-- Header & Action Ribbon -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-blue-800 text-amber-300 flex items-center justify-center text-2xl font-bold shadow-md">
              🏛️
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-base sm:text-lg font-bold text-slate-900">Không gian làm việc BAO-WORK & HANOIWORK</h1>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                  Cây lưu trữ 3 Cấp
                </span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300">
                  Bao-Algo™ Powered
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Quản trị Dự án → Thư mục → Chương trình hành động → Nhiệm vụ & Nhiệm vụ con (Chuẩn 6 Rõ)</p>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <a href="#kpi-algo" class="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-700 font-bold text-xs transition flex items-center gap-1.5 border border-purple-200/80 shadow-2xs">
              <i data-lucide="brain-circuit" class="w-4 h-4 text-purple-600"></i>
              <span>B-Algo™ AI Thuật Toán</span>
            </a>
            <a href="#kpi-assistant" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-sm">
              <i data-lucide="sparkles" class="w-4 h-4"></i>
              <span>Trợ lý AI B-Assistant™</span>
            </a>
            <a href="#kpi-dashboard" class="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition flex items-center gap-1.5 border border-blue-200">
              <i data-lucide="bar-chart-3" class="w-4 h-4"></i>
              <span>Dashboard & AI Phân tích</span>
            </a>
            <button onclick="KpiWorkspacePage.openCreateProjectModal()" class="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md">
              <i data-lucide="folder-plus" class="w-4 h-4"></i>
              <span>+ Dự án mới</span>
            </button>
          </div>
        </div>

        <!-- Main HanoiWork Split Layout: Left Hierarchy Tree (1/4 on xl) & Right Tasks Panel (3/4 on xl) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- LEFT: 3-Level Data Hierarchy Tree (3 cols on xl) -->
          <div class="lg:col-span-4 xl:col-span-3 bg-white rounded-3xl border border-slate-200/80 p-4 shadow-2xs space-y-4 select-none">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <i data-lucide="layers" class="w-4 h-4 text-blue-700"></i>
                <h3 class="font-bold text-xs text-slate-900 uppercase tracking-wider">CÂY THƯ MỤC 3 CẤP</h3>
              </div>
              <span class="text-[10px] text-slate-400 font-mono">Dự án → CT Hành động</span>
            </div>

            <!-- Strategic Categories Filter Badges -->
            <div class="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-semibold text-slate-600">
              <button onclick="KpiWorkspacePage.filterCategory('all')" id="cat-all" class="px-2.5 py-1 rounded-lg bg-blue-700 text-white shrink-0">Tất cả</button>
              <button onclick="KpiWorkspacePage.filterCategory('strategic')" id="cat-strategic" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 shrink-0">Chiến lược</button>
              <button onclick="KpiWorkspacePage.filterCategory('doc_mgmt')" id="cat-doc_mgmt" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 shrink-0">Văn bản</button>
              <button onclick="KpiWorkspacePage.filterCategory('regular')" id="cat-regular" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 shrink-0">Thường xuyên</button>
              <button onclick="KpiWorkspacePage.filterCategory('ad_hoc')" id="cat-ad_hoc" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 shrink-0">Phát sinh</button>
            </div>

            <!-- Hierarchy Tree Nodes Container -->
            <div id="hierarchy-tree-container" class="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              <div class="p-8 text-center text-slate-400 text-xs">Đang tải cây dữ liệu 3 cấp...</div>
            </div>
          </div>

          <!-- RIGHT: Tasks List & Detail Area (9 cols on xl) -->
          <div class="lg:col-span-8 xl:col-span-9 space-y-4">
            
            <!-- Program Header Banner & RBAC Members Box -->
            <div id="program-header-banner" class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
              <div class="p-8 text-center text-slate-400 text-xs">Vui lòng chọn Chương trình hành động từ cây thư mục bên trái</div>
            </div>

            <!-- Filter & Action Bar for Tasks -->
            <div class="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2 flex-wrap flex-1">
                <select id="task-filter-status" onchange="KpiWorkspacePage.onFilterChange()" class="p-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700">
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chưa bắt đầu</option>
                  <option value="in_progress">Đang thực hiện</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="overdue">Quá hạn</option>
                </select>

                <select id="task-filter-priority" onchange="KpiWorkspacePage.onFilterChange()" class="p-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700">
                  <option value="all">Mức độ ưu tiên</option>
                  <option value="normal">Thường</option>
                  <option value="urgent">Khẩn</option>
                  <option value="emergency">Hỏa tốc</option>
                </select>
              </div>

              <!-- Buttons: Inline Creation & Detailed Modal -->
              <div class="flex items-center gap-2">
                <button onclick="KpiWorkspacePage.toggleInlineForm()" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center gap-1.5">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5 text-blue-700"></i>
                  <span>Thêm nhanh (Dòng)</span>
                </button>
                <button onclick="KpiWorkspacePage.openCreateTaskModal()" class="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md">
                  <i data-lucide="plus-circle" class="w-4 h-4"></i>
                  <span>Phiếu giao việc (Chuẩn 6 Rõ)</span>
                </button>
              </div>
            </div>

            <!-- Tasks Table / Container -->
            <div id="tasks-table-container" class="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div class="p-12 text-center text-slate-400 text-xs">Đang tải danh sách nhiệm vụ...</div>
            </div>

          </div>

        </div>

      </div>
    `;
  },

  async afterRender() {
    try {
      this.taskTypes = await API.getKpiTaskTypes();
      this.users = await API.getUsers();
      await this.loadHierarchy();
    } catch (e) {
      console.error('Lỗi sau render Workspace:', e);
    }
  },

  async loadHierarchy() {
    try {
      this.hierarchy = await API.getKpiHierarchy();
      this.renderHierarchyTree();

      // Nếu chưa chọn chương trình hành động nào, chọn chương trình đầu tiên của dự án đầu tiên
      if (!this.selectedProgramId && this.hierarchy.length > 0) {
        const firstProj = this.hierarchy[0];
        this.selectedProjectId = firstProj.id;
        if (firstProj.direct_programs && firstProj.direct_programs.length > 0) {
          this.selectProgram(firstProj.direct_programs[0].id);
        } else if (firstProj.folders && firstProj.folders.length > 0 && firstProj.folders[0].action_programs.length > 0) {
          this.selectProgram(firstProj.folders[0].action_programs[0].id);
        }
      }
    } catch (e) {
      console.error('Lỗi load hierarchy:', e);
    }
  },

  filterCategory(cat) {
    ['all', 'strategic', 'doc_mgmt', 'regular', 'ad_hoc'].forEach(c => {
      const btn = document.getElementById(`cat-${c}`);
      if (btn) {
        if (c === cat) btn.className = 'px-2.5 py-1 rounded-lg bg-blue-700 text-white shrink-0';
        else btn.className = 'px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 shrink-0';
      }
    });

    this.renderHierarchyTree(cat);
  },

  renderHierarchyTree(filterCat = 'all') {
    const container = document.getElementById('hierarchy-tree-container');
    if (!container) return;

    const filtered = filterCat === 'all' ? this.hierarchy : this.hierarchy.filter(p => p.category === filterCat);

    if (filtered.length === 0) {
      container.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">Chưa có dự án nào trong phân khu này</div>`;
      return;
    }

    const catBadge = {
      strategic: { label: 'Chiến lược', color: 'bg-purple-100 text-purple-800' },
      doc_mgmt: { label: 'Văn bản', color: 'bg-blue-100 text-blue-800' },
      regular: { label: 'Thường xuyên', color: 'bg-emerald-100 text-emerald-800' },
      ad_hoc: { label: 'Phát sinh', color: 'bg-amber-100 text-amber-800' }
    };

    container.innerHTML = filtered.map(proj => {
      const isProjActive = this.selectedProjectId === proj.id;
      const badge = catBadge[proj.category] || { label: proj.category, color: 'bg-slate-100 text-slate-700' };

      return `
        <!-- CẤP 1: DỰ ÁN -->
        <div class="rounded-2xl border transition ${isProjActive ? 'border-blue-300 bg-blue-50/20' : 'border-slate-200 bg-white'} overflow-hidden">
          
          <!-- Project Header Item -->
          <div class="p-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 overflow-hidden">
              <i data-lucide="folder" class="w-4 h-4 text-blue-700 shrink-0"></i>
              <div class="truncate">
                <span class="font-bold text-xs text-slate-900 block truncate" title="${proj.name}">${proj.name}</span>
                <span class="text-[9px] px-1.5 py-0.2 rounded font-bold ${badge.color}">${badge.label}</span>
              </div>
            </div>

            <!-- Project Actions Dropdown / Button -->
            <div class="flex items-center gap-1 shrink-0">
              <button onclick="KpiWorkspacePage.openCreateFolderModal(${proj.id})" class="p-1 rounded text-slate-400 hover:text-blue-700" title="Thêm Thư mục (Cấp 2)">
                <i data-lucide="folder-plus" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="KpiWorkspacePage.openCreateProgramModal(${proj.id}, null)" class="p-1 rounded text-slate-400 hover:text-emerald-700" title="Thêm Chương trình hành động (Cấp 3)">
                <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

          <!-- Project Children: Folders (Cấp 2) & Direct Programs (Cấp 3) -->
          <div class="p-2 space-y-1.5">
            
            <!-- CẤP 2: THƯ MỤC (NẾU CÓ) -->
            ${(proj.folders || []).map(f => `
              <div class="rounded-xl border border-slate-200/80 bg-slate-50/40 p-2 space-y-1 ml-2">
                <div class="flex items-center justify-between text-xs text-slate-700 font-semibold">
                  <div class="flex items-center gap-1.5 truncate">
                    <i data-lucide="folder-open" class="w-3.5 h-3.5 text-amber-500 shrink-0"></i>
                    <span class="truncate text-[11px] font-bold" title="${f.name}">${f.name}</span>
                  </div>
                  <button onclick="KpiWorkspacePage.openCreateProgramModal(${proj.id}, ${f.id})" class="p-1 text-slate-400 hover:text-blue-700" title="Thêm Chương trình hành động vào thư mục này">
                    <i data-lucide="plus" class="w-3 h-3"></i>
                  </button>
                </div>

                <!-- CẤP 3 NẰM TRONG THƯ MỤC -->
                <div class="space-y-1 pl-2 border-l border-slate-200">
                  ${(f.action_programs || []).map(ap => this.renderProgramItem(ap, proj.id)).join('')}
                </div>
              </div>
            `).join('')}

            <!-- CẤP 3: CHƯƠNG TRÌNH HÀNH ĐỘNG NẰM TRỰC TIẾP DƯỚI DỰ ÁN -->
            ${(proj.direct_programs || []).map(ap => this.renderProgramItem(ap, proj.id)).join('')}

          </div>

        </div>
      `;
    }).join('');

    lucide.createIcons({ root: container });
  },

  renderProgramItem(ap, projectId) {
    const isSelected = this.selectedProgramId === ap.id;
    const stats = ap.stats || { total_tasks: 0, completed_tasks: 0, overdue_tasks: 0 };

    return `
      <div class="flex items-center justify-between p-2 rounded-xl transition text-xs ${isSelected ? 'bg-blue-700 text-white font-bold shadow-xs' : 'hover:bg-slate-100 text-slate-700 font-medium'}">
        <button onclick="KpiWorkspacePage.selectProgram(${ap.id}, ${projectId})" class="flex items-center gap-2 flex-1 text-left overflow-hidden">
          <i data-lucide="check-square" class="w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-300' : 'text-blue-600'}"></i>
          <span class="truncate text-[11px]">${ap.name}</span>
        </button>

        <div class="flex items-center gap-1.5 shrink-0 text-[10px]">
          <span class="px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}">
            ${stats.completed_tasks}/${stats.total_tasks}
          </span>
          <button onclick="KpiWorkspacePage.openProgramOptionsModal(event, ${ap.id})" class="p-1 rounded hover:bg-black/10" title="Tùy chọn: Đổi tên, sao chép, xóa">
            <i data-lucide="more-vertical" class="w-3 h-3"></i>
          </button>
        </div>
      </div>
    `;
  },

  async selectProgram(programId, projectId = null) {
    this.selectedProgramId = programId;
    if (projectId) this.selectedProjectId = projectId;
    this.renderHierarchyTree();
    await this.loadProgramDetails();
    await this.loadTasks();
  },

  // Load chi tiết Chương trình hành động & Render Banner RBAC
  async loadProgramDetails() {
    const container = document.getElementById('program-header-banner');
    if (!container) return;

    // Tìm program và project cha
    let foundProgram = null;
    let foundProj = null;

    for (const p of this.hierarchy) {
      if (p.direct_programs) {
        const found = p.direct_programs.find(x => x.id === this.selectedProgramId);
        if (found) { foundProgram = found; foundProj = p; break; }
      }
      if (p.folders) {
        for (const f of p.folders) {
          const found = (f.action_programs || []).find(x => x.id === this.selectedProgramId);
          if (found) { foundProgram = found; foundProj = p; break; }
        }
      }
    }

    if (!foundProgram || !foundProj) {
      container.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">Chưa chọn chương trình hành động</div>`;
      return;
    }

    this.selectedProjectId = foundProj.id;
    const leadUnits = foundProj.lead_units || [];
    const collabUnits = foundProj.collab_units || [];

    container.innerHTML = `
      <div class="space-y-3">
        
        <div class="flex items-start justify-between flex-wrap gap-2">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                [${foundProj.code}] ${foundProj.name}
              </span>
              <span class="text-xs text-slate-400">/ Cấp 3:</span>
            </div>
            <h2 class="text-sm sm:text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
              <i data-lucide="target" class="w-5 h-5 text-blue-700"></i>
              <span>${foundProgram.name}</span>
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">${foundProgram.description || 'Chương trình hành động của dự án'}</p>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="KpiWorkspacePage.duplicateProgram(${foundProgram.id})" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1" title="Tạo bản sao chương trình hành động">
              <i data-lucide="copy" class="w-3.5 h-3.5 text-blue-700"></i>
              <span>Sao chép</span>
            </button>
          </div>
        </div>

        <!-- RBAC Banner: Phân quyền Đơn vị chủ trì và Đơn vị phối hợp -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
          
          <!-- Đơn vị chủ trì (Có quyền giao và nhận việc) -->
          <div class="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5">
            <div class="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
              ✓
            </div>
            <div class="overflow-hidden">
              <div class="font-bold text-emerald-950 flex items-center gap-1.5">
                <span>Đơn vị chủ trì:</span>
                <span class="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded font-mono font-bold">GIAO & NHẬN VIỆC</span>
              </div>
              <div class="text-slate-600 text-[11px] mt-0.5 truncate">
                ${leadUnits.length > 0 ? leadUnits.join(', ') : 'Lãnh đạo UBND, Văn phòng - Thống kê'}
              </div>
            </div>
          </div>

          <!-- Đơn vị phối hợp (Chỉ có quyền xem - Read-only) -->
          <div class="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5">
            <div class="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 text-xs font-bold">
              👁️
            </div>
            <div class="overflow-hidden">
              <div class="font-bold text-amber-950 flex items-center gap-1.5">
                <span>Đơn vị phối hợp:</span>
                <span class="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-mono font-bold">CHỈ XEM (READ-ONLY)</span>
              </div>
              <div class="text-slate-600 text-[11px] mt-0.5 truncate">
                ${collabUnits.length > 0 ? collabUnits.join(', ') : 'Các đơn vị phối hợp'}
              </div>
            </div>
          </div>

        </div>

      </div>
    `;

    lucide.createIcons({ root: container });
  },

  // Load danh sách nhiệm vụ của Chương trình hành động được chọn
  async loadTasks() {
    const container = document.getElementById('tasks-table-container');
    if (!container) return;

    if (!this.selectedProgramId) {
      container.innerHTML = `<div class="p-12 text-center text-slate-400 text-xs">Vui lòng chọn Chương trình hành động để xem danh sách nhiệm vụ</div>`;
      return;
    }

    const status = document.getElementById('task-filter-status')?.value || this.filterStatus;
    const priority = document.getElementById('task-filter-priority')?.value || this.filterPriority;

    try {
      this.tasks = await API.getKpiTasks({
        action_program_id: this.selectedProgramId,
        status: status,
        priority: priority
      });

      this.renderTasksTable();
    } catch (e) {
      console.error(e);
      container.innerHTML = `<div class="p-8 text-center text-rose-500 text-xs">${e.message}</div>`;
    }
  },

  onFilterChange() {
    this.loadTasks();
  },

  toggleInlineForm() {
    this.showInlineForm = !this.showInlineForm;
    this.renderTasksTable();
  },

  renderTasksTable() {
    const container = document.getElementById('tasks-table-container');
    if (!container) return;

    // Phân tách nhiệm vụ cha và nhiệm vụ con
    const parentTasks = this.tasks.filter(t => !t.parent_task_id);
    const subtaskMap = {};
    for (const t of this.tasks) {
      if (t.parent_task_id) {
        if (!subtaskMap[t.parent_task_id]) subtaskMap[t.parent_task_id] = [];
        subtaskMap[t.parent_task_id].push(t);
      }
    }

    const currentProj = this.hierarchy.find(p => p.id === this.selectedProjectId);
    const leadUserIds = currentProj ? (currentProj.lead_user_ids || []) : [];
    // Lọc danh sách cán bộ được phép nhận việc
    const eligibleAssignees = this.users.filter(u => u.role !== 'citizen' && (leadUserIds.length === 0 || leadUserIds.includes(u.id) || (currentProj && currentProj.lead_units && currentProj.lead_units.includes(u.department))));

    container.innerHTML = `
      <div class="overflow-x-auto rounded-3xl border border-slate-200/80">
        <table class="w-full text-left text-xs min-w-[1150px] table-auto">
          <thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
            <tr>
              <th class="p-3.5 w-12 text-center whitespace-nowrap">STT</th>
              <th class="p-3.5 min-w-[280px]">Nhiệm vụ & Sản phẩm đầu ra</th>
              <th class="p-3.5 min-w-[150px] whitespace-nowrap">Chủ trì duy nhất</th>
              <th class="p-3.5 min-w-[110px] text-center whitespace-nowrap">Loại & Hệ số</th>
              <th class="p-3.5 min-w-[100px] text-center whitespace-nowrap">SL quy đổi</th>
              <th class="p-3.5 min-w-[110px] whitespace-nowrap">Hạn hoàn thành</th>
              <th class="p-3.5 min-w-[110px] text-center whitespace-nowrap">Tiến độ</th>
              <th class="p-3.5 min-w-[110px] text-center whitespace-nowrap">Trạng thái</th>
              <th class="p-3.5 min-w-[100px] text-center whitespace-nowrap">KPI thực</th>
              <th class="p-3.5 min-w-[140px] text-center whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-800">
            
            <!-- INLINE CREATION ROW (Thêm nhanh nhiệm vụ trên dòng) -->
            ${this.showInlineForm ? `
              <tr class="bg-blue-50/70 border-b-2 border-blue-400">
                <td class="p-2.5 text-center font-bold text-blue-700 whitespace-nowrap">+</td>
                <td class="p-2.5 min-w-[280px]">
                  <input type="text" id="inline-title" placeholder="Nhập tên nhiệm vụ mới..." class="w-full p-2 rounded-xl border border-blue-300 bg-white font-semibold text-xs focus:ring-2 focus:ring-blue-500">
                </td>
                <td class="p-2.5 min-w-[150px] whitespace-nowrap">
                  <select id="inline-assignee" class="w-full p-2 rounded-xl border border-blue-300 bg-white text-xs font-semibold">
                    <option value="">-- Chọn Chủ trì --</option>
                    ${eligibleAssignees.map(u => `<option value="${u.id}">${u.full_name} (${u.department})</option>`).join('')}
                  </select>
                </td>
                <td class="p-2.5 text-center min-w-[110px] whitespace-nowrap">
                  <select id="inline-type" onchange="KpiWorkspacePage.onInlineTypeChange()" class="w-full p-1.5 rounded-xl border border-blue-300 bg-white text-[11px] font-semibold">
                    ${this.taskTypes.map(tt => `<option value="${tt.id}" data-weight="${tt.kpi_weight}" data-product="${tt.default_product}">${tt.code} (x${tt.kpi_weight})</option>`).join('')}
                  </select>
                </td>
                <td class="p-2.5 text-center min-w-[100px] whitespace-nowrap">
                  <input type="number" id="inline-qty" min="1" value="1" oninput="KpiWorkspacePage.onInlineTypeChange()" class="w-16 p-1.5 rounded-xl border border-blue-300 bg-white text-center font-bold text-blue-800 text-xs">
                  <div id="inline-kpi-preview" class="text-[10px] text-blue-700 font-bold mt-0.5 whitespace-nowrap">1.0 đ</div>
                </td>
                <td class="p-2.5 min-w-[110px] whitespace-nowrap">
                  <input type="date" id="inline-due" class="w-full p-1.5 rounded-xl border border-blue-300 bg-white text-xs font-mono">
                </td>
                <td colspan="3" class="p-2.5 text-center text-slate-400 text-[10px] whitespace-nowrap">
                  Tạo nhanh
                </td>
                <td class="p-2.5 text-center min-w-[140px] whitespace-nowrap">
                  <div class="flex items-center justify-center gap-1.5 whitespace-nowrap">
                    <button onclick="KpiWorkspacePage.saveInlineTask()" class="px-2.5 py-1.5 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition whitespace-nowrap">
                      Lưu
                    </button>
                    <button onclick="KpiWorkspacePage.toggleInlineForm()" class="px-2 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs whitespace-nowrap">
                      Hủy
                    </button>
                  </div>
                </td>
              </tr>
            ` : ''}

            <!-- TASKS LIST -->
            ${parentTasks.length === 0 && !this.showInlineForm ? `
              <tr>
                <td colspan="10" class="p-12 text-center text-slate-400 text-xs">
                  Chương trình hành động này chưa có nhiệm vụ nào. Nhấn "+ Phiếu giao việc" hoặc "Thêm nhanh" để khởi tạo.
                </td>
              </tr>
            ` : ''}

            ${parentTasks.map((t, idx) => {
              const subs = subtaskMap[t.id] || [];
              return `
                ${this.renderTaskRow(t, idx + 1, false)}
                ${subs.map((s, sIdx) => this.renderTaskRow(s, `${idx + 1}.${sIdx + 1}`, true)).join('')}
              `;
            }).join('')}

          </tbody>
        </table>
      </div>
    `;

    lucide.createIcons({ root: container });
  },

  renderTaskRow(t, indexLabel, isSubtask = false) {
    const isCompleted = t.status === 'completed';
    const isOverdue = t.status === 'overdue' || (!isCompleted && t.due_date && t.due_date < new Date().toISOString().split('T')[0]);

    let statusBadge = '<span class="whitespace-nowrap inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Chờ làm</span>';
    if (isCompleted) {
      if (t.delay_days > 0) {
        statusBadge = `<span class="whitespace-nowrap inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800" title="Hoàn thành muộn ${t.delay_days} ngày">Đạt (Muộn)</span>`;
      } else {
        statusBadge = '<span class="whitespace-nowrap inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Đúng hạn</span>';
      }
    } else if (isOverdue) {
      statusBadge = '<span class="whitespace-nowrap inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">Quá hạn</span>';
    } else if (t.status === 'in_progress') {
      statusBadge = '<span class="whitespace-nowrap inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Đang làm</span>';
    }

    return `
      <tr class="hover:bg-slate-50/70 transition ${isSubtask ? 'bg-slate-50/40 text-[11px]' : ''}">
        <td class="p-3.5 text-center font-bold text-slate-400 text-[11px] whitespace-nowrap">${indexLabel}</td>
        
        <td class="p-3.5 ${isSubtask ? 'pl-8' : ''} min-w-[280px]">
          <div class="flex items-start gap-2">
            ${isSubtask ? '<i data-lucide="corner-down-right" class="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5"></i>' : ''}
            <div class="space-y-1">
              <div class="font-bold text-slate-900 leading-snug break-words ${isSubtask ? 'text-xs' : 'text-xs sm:text-sm'}">
                ${t.title}
              </div>
              <div class="text-[10px] text-slate-500 flex items-center gap-2 flex-wrap">
                <span class="whitespace-nowrap">🎯 SP: <strong class="text-slate-700">${t.target_product || 'Văn bản hành chính'}</strong></span>
                ${t.calc_by_subtasks ? '<span class="whitespace-nowrap px-1.5 py-0.5 rounded font-bold bg-purple-100 text-purple-800 text-[9px]">Tính theo việc con</span>' : ''}
              </div>
            </div>
          </div>
        </td>

        <td class="p-3.5 min-w-[150px] whitespace-nowrap">
          <div class="font-bold text-slate-900 whitespace-nowrap">${t.assignee_name}</div>
          <div class="text-[10px] text-slate-400 truncate max-w-[160px] whitespace-nowrap" title="${t.assignee_dept}">${t.assignee_dept}</div>
        </td>

        <td class="p-3.5 text-center min-w-[110px] whitespace-nowrap">
          <span class="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold text-[11px] whitespace-nowrap">
            x${t.kpi_weight || 1.0}
          </span>
        </td>

        <td class="p-3.5 text-center font-mono font-bold text-slate-700 min-w-[100px] whitespace-nowrap">
          <div class="whitespace-nowrap">${t.assigned_kpi_score || (t.assigned_quantity * t.kpi_weight).toFixed(1)} đ</div>
          <div class="text-[9px] text-slate-400 font-normal whitespace-nowrap">SL: ${t.assigned_quantity || 1}</div>
        </td>

        <td class="p-3.5 font-mono text-[11px] min-w-[110px] whitespace-nowrap ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}">
          ${t.due_date || '<span class="text-slate-400">Không có</span>'}
        </td>

        <td class="p-3.5 text-center min-w-[110px] whitespace-nowrap">
          <div class="flex items-center justify-center gap-1.5 font-bold font-mono whitespace-nowrap">
            <div class="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
              <div class="h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-blue-600'}" style="width: ${t.progress_percent || 0}%"></div>
            </div>
            <span class="text-[10px] whitespace-nowrap">${t.progress_percent || 0}%</span>
          </div>
        </td>

        <td class="p-3.5 text-center min-w-[110px] whitespace-nowrap">
          ${statusBadge}
        </td>

        <td class="p-3.5 text-center min-w-[100px] whitespace-nowrap">
          ${isCompleted ? `
            <span class="whitespace-nowrap inline-flex items-center px-2 py-0.5 rounded-full font-black font-mono text-xs ${t.delay_days > 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}">
              ${t.final_kpi_score} đ
            </span>
            ${t.delay_days > 0 ? `<div class="text-[9px] text-rose-600 font-mono whitespace-nowrap">Trễ ${t.delay_days}d (-${t.delay_days * 25}%)</div>` : ''}
          ` : `
            <span class="text-slate-300 font-mono">-</span>
          `}
        </td>

        <td class="p-3.5 text-center min-w-[140px] whitespace-nowrap">
          <div class="flex items-center justify-center gap-1.5 whitespace-nowrap">
            ${!isCompleted ? `
              <button onclick="KpiWorkspacePage.openCompleteModal(${t.id})" class="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs flex items-center gap-1 whitespace-nowrap">
                <i data-lucide="check" class="w-3 h-3"></i> Hoàn thành
              </button>
            ` : `
              <span class="text-emerald-700 text-[11px] font-bold flex items-center gap-0.5 whitespace-nowrap">
                <i data-lucide="check-check" class="w-3.5 h-3.5"></i> Đã xong
              </span>
            `}

            <!-- Options menu: Phân rã, Ủy quyền, Chi tiết -->
            <button onclick="KpiWorkspacePage.openTaskDetailModal(${t.id})" class="p-1 rounded-lg text-slate-400 hover:text-blue-700" title="Xem chi tiết & Bình luận">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="KpiWorkspacePage.openDecomposeModal(${t.id})" class="p-1 rounded-lg text-slate-400 hover:text-purple-700" title="Phân rã thành nhiệm vụ con">
              <i data-lucide="git-fork" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  },

  onInlineTypeChange() {
    const sel = document.getElementById('inline-type');
    const qtyInput = document.getElementById('inline-qty');
    const preview = document.getElementById('inline-kpi-preview');
    if (!sel || !qtyInput || !preview) return;

    const opt = sel.options[sel.selectedIndex];
    const weight = parseFloat(opt.dataset.weight) || 1.0;
    const qty = parseFloat(qtyInput.value) || 1.0;
    preview.innerText = `${(qty * weight).toFixed(1)} đ`;
  },

  async saveInlineTask() {
    const title = document.getElementById('inline-title')?.value || '';
    const assignee_id = document.getElementById('inline-assignee')?.value || '';
    const due_date = document.getElementById('inline-due')?.value || '';
    const typeSelect = document.getElementById('inline-type');
    const qty = parseFloat(document.getElementById('inline-qty')?.value) || 1.0;

    if (!title.trim() || !assignee_id) {
      Modals.showToast('Vui lòng nhập tên nhiệm vụ và chọn cán bộ chủ trì!', 'warning');
      return;
    }

    const opt = typeSelect.options[typeSelect.selectedIndex];
    const task_type_id = parseInt(typeSelect.value, 10);
    const kpi_weight = parseFloat(opt.dataset.weight) || 1.0;
    const target_product = opt.dataset.product || 'Văn bản hành chính';

    try {
      await API.createKpiTask({
        title,
        action_program_id: this.selectedProgramId,
        assignee_id: parseInt(assignee_id, 10),
        due_date,
        task_type_id,
        kpi_weight,
        assigned_quantity: qty,
        target_product
      });

      Modals.showToast('Tạo nhanh nhiệm vụ thành công!', 'success');
      this.showInlineForm = false;
      this.loadTasks();
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  },

  // ========================================================
  // MODAL PHIẾU GIAO NHIỆM VỤ CHI TIẾT (CHUẨN 6 RÕ)
  // ========================================================
  openCreateTaskModal() {
    if (!this.selectedProgramId) {
      Modals.showToast('Vui lòng chọn Chương trình hành động trước!', 'warning');
      return;
    }

    const currentProj = this.hierarchy.find(p => p.id === this.selectedProjectId);
    const leadUserIds = currentProj ? (currentProj.lead_user_ids || []) : [];
    const eligibleAssignees = this.users.filter(u => u.role !== 'citizen' && (leadUserIds.length === 0 || leadUserIds.includes(u.id) || (currentProj && currentProj.lead_units && currentProj.lead_units.includes(u.department))));

    const modal = document.createElement('div');
    modal.id = 'create-kpi-task-modal';
    modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 border border-slate-200 animate-in fade-in zoom-in-95 text-xs max-h-[90vh] overflow-y-auto space-y-4">
        
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="file-signature" class="w-4 h-4 text-blue-700"></i>
              <span>Phiếu giao nhiệm vụ chi tiết (Chuẩn 6 Rõ)</span>
            </h3>
            <p class="text-[11px] text-slate-500 mt-0.5">Rõ người, rõ việc, rõ thời gian, rõ trách nhiệm, rõ sản phẩm, rõ thẩm quyền</p>
          </div>
          <button onclick="document.getElementById('create-kpi-task-modal').remove()" class="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="create-kpi-task-form" class="space-y-4">
          
          <!-- 1. RÕ VIỆC: Tên nhiệm vụ & Nút AI -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block font-bold text-slate-700">1. Tên nhiệm vụ / Công việc * (Rõ việc)</label>
              <button type="button" onclick="KpiWorkspacePage.triggerAiDescribe()" class="px-2.5 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] transition flex items-center gap-1">
                <i data-lucide="sparkles" class="w-3 h-3 text-amber-700"></i> Viết mô tả bằng AI
              </button>
            </div>
            <input type="text" id="modal-task-title" name="title" required placeholder="Bắt đầu bằng động từ hành động: Soạn thảo, Xây dựng, Rà soát, Kiểm tra..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold">
          </div>

          <!-- Mô tả chi tiết -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Mô tả chi tiết nội dung & yêu cầu</label>
            <textarea id="modal-task-desc" name="description" rows="3" placeholder="Chi tiết các bước thực hiện, căn cứ pháp lý, tài liệu phối hợp..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs leading-relaxed"></textarea>
          </div>

          <!-- 2. RÕ NGƯỜI & 3. RÕ TRÁCH NHIỆM -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">2. Cán bộ Chủ trì DUY NHẤT * (Rõ người)</label>
              <select name="assignee_id" required class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800">
                <option value="">-- Chọn cán bộ phụ trách chính --</option>
                ${eligibleAssignees.map(u => `<option value="${u.id}">${u.full_name} - ${u.position || u.department}</option>`).join('')}
              </select>
              <div class="text-[10px] text-emerald-700 mt-1">Chỉ hiển thị cán bộ thuộc Đơn vị chủ trì của Dự án</div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">3. Mức độ ưu tiên & Hạn hoàn thành * (Rõ thời gian)</label>
              <div class="grid grid-cols-2 gap-2">
                <select name="priority" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold">
                  <option value="normal">Thường</option>
                  <option value="urgent">Khẩn</option>
                  <option value="emergency">Hỏa tốc</option>
                </select>
                <input type="date" name="due_date" required class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono">
              </div>
            </div>
          </div>

          <!-- 4. RÕ SẢN PHẨM & CÔNG THỨC KPI -->
          <div class="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-bold text-blue-900 text-xs">4. Chuẩn hóa Loại nhiệm vụ & Trọng số KPI (Rõ sản phẩm)</span>
              <span class="text-[10px] text-blue-700 font-mono">SL quy đổi = SL × Hệ số</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="block font-bold text-slate-700 mb-1">Loại nhiệm vụ chuẩn</label>
                <select id="modal-task-type" onchange="KpiWorkspacePage.onModalTypeChange()" class="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold">
                  ${this.taskTypes.map(tt => `<option value="${tt.id}" data-weight="${tt.kpi_weight}" data-product="${tt.default_product}">${tt.name} (x${tt.kpi_weight})</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Số lượng giao</label>
                <input type="number" id="modal-task-qty" name="assigned_quantity" min="1" value="1" oninput="KpiWorkspacePage.onModalTypeChange()" class="w-full p-2 rounded-xl border border-slate-200 bg-white text-center font-bold text-xs">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Sản phẩm đầu ra định lượng</label>
                <input type="text" id="modal-task-product" name="target_product" value="${this.taskTypes[0]?.default_product || ''}" class="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs">
              </div>

              <div class="flex items-center justify-between bg-white p-2.5 rounded-xl border border-blue-200">
                <div>
                  <div class="text-[10px] text-slate-500">Điểm KPI quy đổi:</div>
                  <strong id="modal-kpi-score" class="text-sm font-black text-blue-700">2.5 đ</strong>
                </div>
                <label class="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-purple-900">
                  <input type="checkbox" name="calc_by_subtasks" class="rounded text-purple-600">
                  <span>Tính theo việc con</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 5. NGƯỜI THEO DÕI (Hỗ trợ ủy quyền & trao đổi) -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Người theo dõi (Followers) & Đơn vị phối hợp</label>
            <input type="text" name="followers" placeholder="Lãnh đạo UBND, Cán bộ phụ trách giám sát..." class="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs">
          </div>

          <div class="pt-3 border-t flex justify-end gap-2">
            <button type="button" onclick="document.getElementById('create-kpi-task-modal').remove()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs">
              Hủy
            </button>
            <button type="submit" class="px-6 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition shadow-md">
              Giao nhiệm vụ
            </button>
          </div>

        </form>

      </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons({ root: modal });
    this.onModalTypeChange();

    document.getElementById('create-kpi-task-form').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd.entries());

      const typeSel = document.getElementById('modal-task-type');
      const opt = typeSel.options[typeSel.selectedIndex];
      data.action_program_id = this.selectedProgramId;
      data.task_type_id = parseInt(typeSel.value, 10);
      data.task_type_name = opt.text.split('(')[0].trim();
      data.kpi_weight = parseFloat(opt.dataset.weight) || 1.0;
      data.target_product = document.getElementById('modal-task-product').value;
      data.calc_by_subtasks = !!data.calc_by_subtasks;

      try {
        await API.createKpiTask(data);
        modal.remove();
        Modals.showToast('Giao nhiệm vụ chuẩn 6 Rõ thành công!', 'success');
        this.loadTasks();
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  },

  onModalTypeChange() {
    const sel = document.getElementById('modal-task-type');
    const qtyInput = document.getElementById('modal-task-qty');
    const prodInput = document.getElementById('modal-task-product');
    const scoreLabel = document.getElementById('modal-kpi-score');
    if (!sel || !qtyInput || !prodInput || !scoreLabel) return;

    const opt = sel.options[sel.selectedIndex];
    const weight = parseFloat(opt.dataset.weight) || 1.0;
    const qty = parseFloat(qtyInput.value) || 1.0;
    prodInput.value = opt.dataset.product || '';
    scoreLabel.innerText = `${(qty * weight).toFixed(1)} đ`;
  },

  async triggerAiDescribe() {
    const titleInput = document.getElementById('modal-task-title');
    const descArea = document.getElementById('modal-task-desc');
    const prodInput = document.getElementById('modal-task-product');

    if (!titleInput || !titleInput.value.trim()) {
      Modals.showToast('Vui lòng gõ tên nhiệm vụ trước để AI viết mô tả!', 'warning');
      return;
    }

    try {
      Modals.showToast('AI đang soạn thảo mô tả công việc...', 'info');
      const res = await API.aiDescribeKpiTask({ title: titleInput.value });
      if (descArea) descArea.value = res.suggested_description;
      if (prodInput && !prodInput.value) prodInput.value = res.suggested_product;
      Modals.showToast('AI đã hoàn thiện bản mô tả công việc chuẩn cơ quan hành chính!', 'success');
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  },

  // ========================================================
  // MODAL NGHIỆM THU HOÀN THÀNH (CÀI ĐẶT BỘ CÔNG THỨC TOÁN HỌC TÍNH ĐIỂM KPI)
  // ========================================================
  async openCompleteModal(taskId) {
    const task = await API.getKpiTaskDetail(taskId);
    if (!task) return;

    const modal = document.createElement('div');
    modal.id = 'complete-kpi-task-modal';
    modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto';

    const todayStr = new Date().toISOString().split('T')[0];
    const weight = task.kpi_weight || 1.0;
    const assignedQty = task.assigned_quantity || 1.0;

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-7 border border-slate-200 animate-in fade-in zoom-in-95 text-xs space-y-4">
        
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="award" class="w-4 h-4 text-emerald-600"></i>
              <span>Nghiệm thu & Báo cáo kết quả công việc</span>
            </h3>
            <p class="text-[11px] text-slate-500 mt-0.5">Cài đặt công thức tính điểm KPI thực nhận và trừ phạt 25%/ngày trễ hạn</p>
          </div>
          <button onclick="document.getElementById('complete-kpi-task-modal').remove()" class="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <div class="font-bold text-slate-900 text-xs">${task.title}</div>
          <div class="text-[11px] text-slate-500">
            Loại: <strong>${task.task_type_name || 'Hành chính'}</strong> | Trọng số: <strong>x${weight}</strong> | Hạn: <strong class="font-mono text-slate-700">${task.due_date || 'Không có'}</strong>
          </div>
        </div>

        <form id="complete-kpi-form" class="space-y-4">
          
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Số lượng hoàn thành thực tế *</label>
              <input type="number" id="comp-qty" name="completed_quantity" min="0" value="${assignedQty}" oninput="KpiWorkspacePage.recalculateCompletionModal(${weight}, '${task.due_date}')" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900">
              <div class="text-[10px] text-slate-400 mt-0.5">Số lượng được giao: ${assignedQty}</div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Ngày hoàn thành thực tế *</label>
              <input type="date" id="comp-actual-date" name="actual_completion_date" value="${todayStr}" oninput="KpiWorkspacePage.recalculateCompletionModal(${weight}, '${task.due_date}')" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono">
            </div>
          </div>

          <!-- BẢNG TÍNH THỜI GIAN THỰC (LIVE KPI PREVIEW BOX) -->
          <div class="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/60 border border-blue-200 space-y-2.5 text-xs text-slate-800">
            <div class="font-bold text-blue-900 flex items-center justify-between border-b border-blue-200 pb-1.5">
              <span>BẢNG TÍNH TOÁN ĐIỂM SỐ KPI TỰ ĐỘNG</span>
              <span class="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">REALTIME</span>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="p-2 rounded-xl bg-white/80 border border-blue-100">
                <div class="text-[10px] text-slate-500">1. SL quy đổi</div>
                <div id="live-raw-kpi" class="font-black text-slate-900 font-mono text-sm mt-0.5">${(assignedQty * weight).toFixed(1)} đ</div>
              </div>
              <div class="p-2 rounded-xl bg-white/80 border border-blue-100">
                <div class="text-[10px] text-slate-500">2. Độ trễ (ngày)</div>
                <div id="live-delay-days" class="font-black text-slate-900 font-mono text-sm mt-0.5">0 ngày</div>
              </div>
              <div class="p-2 rounded-xl bg-white/80 border border-blue-100">
                <div class="text-[10px] text-slate-500">3. Điểm thực nhận</div>
                <div id="live-final-kpi" class="font-black text-emerald-700 font-mono text-sm mt-0.5">${(assignedQty * weight).toFixed(1)} đ</div>
              </div>
            </div>

            <div id="live-formula-explain" class="text-[11px] text-slate-600 bg-white/60 p-2 rounded-xl font-mono leading-relaxed">
              SL quy đổi = ${weight} × ${assignedQty} = ${(assignedQty * weight).toFixed(1)}. Đúng hạn: Điểm đạt 100%.
            </div>
          </div>

          <!-- Bắt buộc nhập kết quả hoàn thành -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Kết quả hoàn thành (Mô tả sản phẩm đầu ra) *</label>
            <textarea name="result_note" required rows="3" placeholder="Ghi rõ kết quả, số hiệu văn bản đã ban hành, số lượng hồ sơ đã xử lý..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs leading-relaxed"></textarea>
          </div>

          <!-- Đính kèm file sản phẩm -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Đính kèm file sản phẩm minh chứng (Tùy chọn)</label>
            <input type="text" name="completion_proof_file" placeholder="Tên tệp báo cáo, liên kết lưu trữ..." class="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs">
          </div>

          <div class="pt-3 border-t flex justify-end gap-2">
            <button type="button" onclick="document.getElementById('complete-kpi-task-modal').remove()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs">
              Hủy
            </button>
            <button type="submit" class="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md flex items-center gap-1.5">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Xác nhận hoàn thành & Ghi nhận KPI</span>
            </button>
          </div>

        </form>

      </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons({ root: modal });
    this.recalculateCompletionModal(weight, task.due_date);

    document.getElementById('complete-kpi-form').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = Object.fromEntries(fd.entries());

      try {
        const res = await API.completeKpiTask(taskId, payload);
        modal.remove();
        Modals.showToast(`Nghiệm thu thành công! Điểm KPI thực nhận: ${res.final_kpi_score} điểm`, 'success');
        this.loadTasks();
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  },

  recalculateCompletionModal(weight, dueDateStr) {
    const compQtyInput = document.getElementById('comp-qty');
    const actualDateInput = document.getElementById('comp-actual-date');
    const rawLabel = document.getElementById('live-raw-kpi');
    const delayLabel = document.getElementById('live-delay-days');
    const finalLabel = document.getElementById('live-final-kpi');
    const explain = document.getElementById('live-formula-explain');

    if (!compQtyInput || !actualDateInput || !rawLabel || !delayLabel || !finalLabel) return;

    const compQty = parseFloat(compQtyInput.value) || 0;
    const actualDateStr = actualDateInput.value;

    const rawKpi = Number((weight * compQty).toFixed(2));
    let delayDays = 0;
    if (dueDateStr && dueDateStr.trim()) {
      const due = new Date(dueDateStr);
      const actual = new Date(actualDateStr);
      const diffTime = actual.getTime() - due.getTime();
      delayDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const penaltyRate = delayDays * 0.25;
    const penaltyScore = Number((penaltyRate * rawKpi).toFixed(2));
    const finalScore = Number(Math.max(0, rawKpi - penaltyScore).toFixed(2));

    rawLabel.innerText = `${rawKpi} đ`;
    delayLabel.innerText = `${delayDays} ngày`;
    delayLabel.className = `font-black font-mono text-sm mt-0.5 ${delayDays > 0 ? 'text-rose-600' : 'text-slate-900'}`;

    finalLabel.innerText = `${finalScore} đ`;
    finalLabel.className = `font-black font-mono text-sm mt-0.5 ${delayDays > 0 ? 'text-amber-800' : 'text-emerald-700'}`;

    if (delayDays > 0) {
      explain.innerHTML = `⚠️ <strong>Chậm ${delayDays} ngày:</strong> Bị trừ phạt ${delayDays} × 25% = ${delayDays * 25}% điểm (${penaltyScore} đ).<br>Điểm KPI thực nhận = ${rawKpi} - ${penaltyScore} = <strong>${finalScore} điểm</strong>.`;
      explain.className = 'text-[11px] text-amber-900 bg-amber-50 p-2 rounded-xl font-mono leading-relaxed border border-amber-200';
    } else {
      explain.innerHTML = `✓ <strong>Đúng tiến độ:</strong> Không bị trừ phạt.<br>Điểm KPI thực nhận = ${rawKpi} điểm (Đạt 100%).`;
      explain.className = 'text-[11px] text-emerald-900 bg-emerald-50 p-2 rounded-xl font-mono leading-relaxed border border-emerald-200';
    }
  },

  // Modal Phân rã việc (Cơ chế 1 của Lãnh đạo)
  async openDecomposeModal(taskId) {
    const task = await API.getKpiTaskDetail(taskId);
    if (!task) return;

    const currentProj = this.hierarchy.find(p => p.id === this.selectedProjectId);
    const leadUserIds = currentProj ? (currentProj.lead_user_ids || []) : [];
    const officers = this.users.filter(u => u.role === 'officer' && (leadUserIds.length === 0 || leadUserIds.includes(u.id)));

    const modal = document.createElement('div');
    modal.id = 'decompose-modal';
    modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-7 border border-slate-200 animate-in fade-in zoom-in-95 text-xs space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="git-fork" class="w-4 h-4 text-purple-700"></i>
              <span>Cơ chế 1: Phân rã việc cho chuyên viên</span>
            </h3>
            <p class="text-[11px] text-slate-500 mt-0.5">Giữ tên Lãnh đạo ở nhiệm vụ mẹ và tách các nhiệm vụ con cho chuyên viên</p>
          </div>
          <button onclick="document.getElementById('decompose-modal').remove()" class="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 text-purple-900 font-semibold text-xs">
          Nhiệm vụ mẹ: "${task.title}" (Chủ trì: ${task.assignee_name})
        </div>

        <div class="space-y-3">
          <div class="font-bold text-slate-700">Tạo nhiệm vụ con:</div>
          <div class="space-y-2" id="subtask-inputs">
            <div class="p-3 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 subtask-item">
              <input type="text" placeholder="Tên nhiệm vụ con 1..." class="sub-title w-full p-2 rounded-xl border border-slate-200 bg-white font-semibold">
              <div class="grid grid-cols-2 gap-2">
                <select class="sub-assignee w-full p-2 rounded-xl border border-slate-200 bg-white font-semibold">
                  <option value="">-- Giao chuyên viên --</option>
                  ${officers.map(u => `<option value="${u.id}">${u.full_name} (${u.department})</option>`).join('')}
                </select>
                <input type="date" value="${task.due_date || ''}" class="sub-due w-full p-2 rounded-xl border border-slate-200 bg-white font-mono">
              </div>
            </div>
          </div>

          <button onclick="KpiWorkspacePage.addSubtaskRow()" class="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-800 font-bold text-xs hover:bg-purple-200 transition flex items-center gap-1">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> Thêm nhiệm vụ con
          </button>
        </div>

        <div class="pt-3 border-t flex justify-end gap-2">
          <button type="button" onclick="document.getElementById('decompose-modal').remove()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs">
            Hủy
          </button>
          <button onclick="KpiWorkspacePage.submitDecompose(${taskId})" class="px-6 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition shadow-md">
            Xác nhận phân rã
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons({ root: modal });
  },

  addSubtaskRow() {
    const container = document.getElementById('subtask-inputs');
    if (!container) return;

    const currentProj = this.hierarchy.find(p => p.id === this.selectedProjectId);
    const leadUserIds = currentProj ? (currentProj.lead_user_ids || []) : [];
    const officers = this.users.filter(u => u.role === 'officer' && (leadUserIds.length === 0 || leadUserIds.includes(u.id)));

    const div = document.createElement('div');
    div.className = 'p-3 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 subtask-item';
    div.innerHTML = `
      <div class="flex items-center justify-between">
        <input type="text" placeholder="Tên nhiệm vụ con tiếp theo..." class="sub-title w-full p-2 rounded-xl border border-slate-200 bg-white font-semibold">
        <button onclick="this.closest('.subtask-item').remove()" class="p-1 text-slate-400 hover:text-rose-600 ml-2">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <select class="sub-assignee w-full p-2 rounded-xl border border-slate-200 bg-white font-semibold">
          <option value="">-- Giao chuyên viên --</option>
          ${officers.map(u => `<option value="${u.id}">${u.full_name} (${u.department})</option>`).join('')}
        </select>
        <input type="date" class="sub-due w-full p-2 rounded-xl border border-slate-200 bg-white font-mono">
      </div>
    `;
    container.appendChild(div);
    lucide.createIcons({ root: div });
  },

  async submitDecompose(parentId) {
    const items = document.querySelectorAll('.subtask-item');
    const subtasks = [];

    items.forEach(item => {
      const title = item.querySelector('.sub-title')?.value || '';
      const assignee_id = item.querySelector('.sub-assignee')?.value || '';
      const due_date = item.querySelector('.sub-due')?.value || '';
      if (title.trim() && assignee_id) {
        subtasks.push({
          title,
          assignee_id: parseInt(assignee_id, 10),
          due_date,
          assigned_quantity: 1
        });
      }
    });

    if (subtasks.length === 0) {
      Modals.showToast('Vui lòng nhập ít nhất 1 nhiệm vụ con có đầy đủ tên và chuyên viên nhận việc!', 'warning');
      return;
    }

    try {
      const res = await API.decomposeKpiTask(parentId, { subtasks });
      document.getElementById('decompose-modal')?.remove();
      Modals.showToast(res.message, 'success');
      this.loadTasks();
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  },

  // Modal Chi tiết nhiệm vụ & Bình luận có @mention
  async openTaskDetailModal(taskId) {
    const task = await API.getKpiTaskDetail(taskId);
    if (!task) return;

    const modal = document.createElement('div');
    modal.id = 'task-detail-modal';
    modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 border border-slate-200 animate-in fade-in zoom-in-95 text-xs space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span class="text-[10px] font-bold text-blue-700 uppercase">CHI TIẾT NHIỆM VỤ</span>
            <h3 class="text-sm font-bold text-slate-900">${task.title}</h3>
          </div>
          <button onclick="document.getElementById('task-detail-modal').remove()" class="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div class="text-[10px] text-slate-400 font-bold">Chủ trì</div>
            <div class="font-bold text-slate-800 truncate">${task.assignee_name}</div>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div class="text-[10px] text-slate-400 font-bold">Hạn hoàn thành</div>
            <div class="font-bold text-slate-800 font-mono">${task.due_date || 'Không có'}</div>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div class="text-[10px] text-slate-400 font-bold">Hệ số KPI</div>
            <div class="font-bold text-blue-700 font-mono">x${task.kpi_weight}</div>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div class="text-[10px] text-slate-400 font-bold">Trạng thái</div>
            <div class="font-bold text-slate-800">${task.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện'}</div>
          </div>
        </div>

        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <div class="font-bold text-slate-700">Mô tả nhiệm vụ:</div>
          <p class="text-slate-600 leading-relaxed whitespace-pre-line">${task.description || 'Không có mô tả chi tiết'}</p>
        </div>

        <!-- Comments & @Mentions Area -->
        <div class="space-y-3 pt-2 border-t border-slate-100">
          <div class="font-bold text-slate-800 flex items-center justify-between">
            <span>Trao đổi & Bình luận (Gõ @tên_người):</span>
            <span class="text-[10px] text-slate-400 font-mono">${(task.comments || []).length} bình luận</span>
          </div>

          <div class="space-y-2 max-h-48 overflow-y-auto pr-1" id="modal-comments-list">
            ${(task.comments || []).length === 0 ? `
              <div class="text-center text-slate-400 text-xs py-4">Chưa có ý kiến trao đổi nào</div>
            ` : (task.comments || []).map(c => `
              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                <div class="flex items-center justify-between font-bold text-[11px] text-slate-800">
                  <span>${c.user_name} (${c.user_role})</span>
                  <span class="text-[10px] text-slate-400 font-mono font-normal">${c.created_at}</span>
                </div>
                <div class="text-slate-600 text-xs leading-relaxed">${c.content}</div>
              </div>
            `).join('')}
          </div>

          <div class="flex items-center gap-2">
            <input type="text" id="task-comment-input" placeholder="Gõ trao đổi hoặc @tên_người để gắn thẻ cán bộ..." class="flex-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
            <button onclick="KpiWorkspacePage.sendTaskComment(${task.id})" class="px-4 py-2.5 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition">
              Gửi
            </button>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons({ root: modal });
  },

  async sendTaskComment(taskId) {
    const input = document.getElementById('task-comment-input');
    if (!input || !input.value.trim()) return;

    try {
      await API.addTaskComment(taskId, input.value.trim());
      input.value = '';
      this.openTaskDetailModal(taskId);
      Modals.showToast('Đã gửi ý kiến trao đổi!', 'success');
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  },

  // Modal Tạo Dự án mới (Cấp 1)
  openCreateProjectModal() {
    const modal = document.createElement('div');
    modal.id = 'create-project-modal';
    modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 animate-in fade-in zoom-in-95 text-xs space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Khởi tạo Dự án mới (Cấp 1)</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">Tự động khởi tạo 1 Chương trình hành động mặc định</p>
          </div>
          <button onclick="document.getElementById('create-project-modal').remove()" class="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="create-project-form" class="space-y-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Mã dự án (Tự động hoặc tùy chỉnh)</label>
            <input type="text" name="code" value="DA-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono">
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Tên Dự án / Kế hoạch chiến lược *</label>
            <input type="text" name="name" required placeholder="VD: Chiến dịch số hóa dữ liệu đất đai và hộ tịch..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold">
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Phân loại phân khu chiến lược *</label>
            <select name="category" required class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold">
              <option value="strategic">1. Nhiệm vụ chiến lược / Mũi nhọn chiến lược</option>
              <option value="doc_mgmt">2. Quản lý văn bản hành chính</option>
              <option value="regular">3. Nhiệm vụ thường xuyên của Phòng/Bộ phận</option>
              <option value="ad_hoc">4. Nhiệm vụ phát sinh đột xuất</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Mô tả dự án</label>
            <textarea name="description" rows="2" placeholder="Ghi rõ mục tiêu và căn cứ ban hành..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Ngày bắt đầu</label>
              <input type="date" name="start_date" value="2026-01-01" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Ngày kết thúc</label>
              <input type="date" name="end_date" value="2026-12-31" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono">
            </div>
          </div>

          <div class="pt-3 border-t flex justify-end gap-2">
            <button type="button" onclick="document.getElementById('create-project-modal').remove()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">Hủy</button>
            <button type="submit" class="px-6 py-2 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 shadow-md">Tạo Dự án</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons({ root: modal });

    document.getElementById('create-project-form').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd.entries());
      data.lead_units = ['Lãnh đạo UBND', 'Văn phòng - Thống kê'];
      data.collab_units = ['Địa chính - Xây dựng', 'Tư pháp - Hộ tịch'];

      try {
        await API.createKpiProject(data);
        modal.remove();
        Modals.showToast('Khởi tạo Dự án và Chương trình hành động thành công!', 'success');
        this.loadHierarchy();
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  },

  openCreateFolderModal(projectId) {
    const name = prompt('Nhập tên Thư mục / Nhóm lĩnh vực mới (Cấp 2):');
    if (!name || !name.trim()) return;

    API.createKpiFolder({ project_id: projectId, name: name.trim() }).then(() => {
      Modals.showToast('Thêm Thư mục thành công!', 'success');
      this.loadHierarchy();
    }).catch(e => Modals.showToast(e.message, 'error'));
  },

  openCreateProgramModal(projectId, folderId = null) {
    const name = prompt('Nhập tên Chương trình hành động mới (Cấp 3):');
    if (!name || !name.trim()) return;

    API.createKpiActionProgram({ project_id: projectId, folder_id: folderId, name: name.trim() }).then(() => {
      Modals.showToast('Thêm Chương trình hành động thành công!', 'success');
      this.loadHierarchy();
    }).catch(e => Modals.showToast(e.message, 'error'));
  },

  async duplicateProgram(programId) {
    try {
      const res = await API.duplicateKpiActionProgram(programId);
      Modals.showToast(res.message, 'success');
      this.loadHierarchy();
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  },

  openProgramOptionsModal(event, programId) {
    event.stopPropagation();
    const action = prompt('Chọn thao tác: \n1 - Đổi tên\n2 - Sao chép chương trình\n3 - Xóa chương trình\nNhập số:');
    if (action === '1') {
      const newName = prompt('Nhập tên mới:');
      if (newName) {
        API.updateKpiActionProgram(programId, { name: newName }).then(() => {
          Modals.showToast('Đổi tên thành công!', 'success');
          this.loadHierarchy();
        });
      }
    } else if (action === '2') {
      this.duplicateProgram(programId);
    } else if (action === '3') {
      if (confirm('Bạn có chắc chắn muốn xóa chương trình hành động này và toàn bộ nhiệm vụ bên trong?')) {
        API.deleteKpiActionProgram(programId).then(() => {
          Modals.showToast('Đã xóa chương trình hành động!', 'success');
          this.selectedProgramId = null;
          this.loadHierarchy();
        });
      }
    }
  }
};

window.KpiWorkspacePage = KpiWorkspacePage;
