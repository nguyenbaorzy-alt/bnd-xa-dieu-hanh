// Role & Permission Matrix Page (Vai trò & Phân quyền)
const RoleManagementPage = {
  async render() {
    const roles = await API.getRoles().catch(() => []);

    return `
      <div class="space-y-6">
        
        <div>
          <h1 class="text-lg font-bold text-slate-900 flex items-center gap-2">
            <i data-lucide="shield-check" class="w-5 h-5 text-blue-700"></i>
            <span>Vai trò & Ma trận phân quyền hệ thống</span>
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">Phân quyền chặt chẽ theo 4 cấp đối tượng: Quản trị, Lãnh đạo, Cán bộ và Công dân</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          ${roles.map(r => `
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div class="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${r.role === 'admin' ? 'bg-purple-100 text-purple-800' : (r.role === 'leader' ? 'bg-amber-100 text-amber-800' : (r.role === 'officer' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'))}">
                    ${r.role}
                  </span>
                  <h3 class="font-bold text-slate-900 text-sm mt-1">${r.name}</h3>
                </div>
                <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <i data-lucide="${r.role === 'admin' ? 'shield' : (r.role === 'leader' ? 'award' : (r.role === 'officer' ? 'briefcase' : 'user'))}" class="w-4 h-4"></i>
                </div>
              </div>

              <p class="text-slate-600 leading-relaxed text-[11px]">
                ${r.description}
              </p>

              <div>
                <span class="font-bold text-slate-700 block mb-2 text-[11px] uppercase tracking-wider">Danh mục quyền được cấp:</span>
                <ul class="space-y-1.5">
                  ${r.permissions.map(p => `
                    <li class="flex items-center gap-2 text-slate-800">
                      <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i>
                      <span>${p}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            </div>
          `).join('')}
        </div>

      </div>
    `;
  },

  async afterRender() {
    lucide.createIcons();
  }
};

window.RoleManagementPage = RoleManagementPage;
