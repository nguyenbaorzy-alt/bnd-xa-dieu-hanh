// Workflow Settings Page (Cấu hình quy trình phê duyệt nhiều cấp - Admin)
const WorkflowSettingsPage = {
  async render() {
    const user = API.getUser();
    if (!user || user.role !== 'admin') {
      return `<div class="p-8 bg-white rounded-2xl border text-center text-rose-500">Chỉ có Quản trị viên mới được cấu hình quy trình duyệt</div>`;
    }

    const workflows = await API.getWorkflows().catch(() => []);

    return `
      <div class="space-y-6">
        
        <div>
          <h1 class="text-lg font-bold text-slate-900 flex items-center gap-2">
            <i data-lucide="git-pull-request" class="w-5 h-5 text-blue-700"></i>
            <span>Cấu hình quy trình phê duyệt công văn nhiều cấp</span>
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">Thiết lập số cấp duyệt bắt buộc và chức vụ thẩm quyền cho từng loại văn bản hành chính</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          ${workflows.map(wf => `
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h3 class="font-bold text-slate-900 text-sm">${wf.doc_type}</h3>
                </div>
                <span class="px-2.5 py-1 rounded-full font-bold text-[10px] bg-blue-50 text-blue-800 border border-blue-200">
                  Quy trình ${wf.levels_count} cấp duyệt
                </span>
              </div>

              <div class="space-y-2.5">
                <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <span class="w-6 h-6 rounded-lg bg-blue-700 text-white font-bold flex items-center justify-center text-[10px]">1</span>
                  <div>
                    <div class="font-bold text-slate-800">${wf.level_1_title || 'Thẩm định'}</div>
                    <div class="text-[10px] text-slate-400">Vai trò: ${wf.level_1_role}</div>
                  </div>
                </div>

                ${wf.levels_count >= 2 ? `
                  <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                    <span class="w-6 h-6 rounded-lg bg-blue-700 text-white font-bold flex items-center justify-center text-[10px]">2</span>
                    <div>
                      <div class="font-bold text-slate-800">${wf.level_2_title || 'Phê duyệt'}</div>
                      <div class="text-[10px] text-slate-400">Vai trò: ${wf.level_2_role}</div>
                    </div>
                  </div>
                ` : ''}

                ${wf.levels_count >= 3 ? `
                  <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                    <span class="w-6 h-6 rounded-lg bg-blue-700 text-white font-bold flex items-center justify-center text-[10px]">3</span>
                    <div>
                      <div class="font-bold text-slate-800">${wf.level_3_title || 'Phát hành'}</div>
                      <div class="text-[10px] text-slate-400">Vai trò: ${wf.level_3_role}</div>
                    </div>
                  </div>
                ` : ''}
              </div>

              <p class="text-slate-500 text-[11px] italic bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                ${wf.description || 'Không có mô tả'}
              </p>

              <div class="pt-2 border-t border-slate-100 flex justify-end">
                <button onclick="Modals.showToast('Quy trình ${wf.doc_type} đã được áp dụng tự động', 'info')" class="text-blue-700 font-semibold hover:underline">
                  Chỉnh sửa quy trình
                </button>
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

window.WorkflowSettingsPage = WorkflowSettingsPage;
