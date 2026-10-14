// User Accounts Management Page (Quản lý người dùng - Admin)
const UserManagementPage = {
  async render() {
    const user = API.getUser();
    if (!user || user.role !== 'admin') {
      return `<div class="p-8 bg-white rounded-2xl border text-center text-rose-500">Chỉ có Quản trị viên mới được truy cập trang này</div>`;
    }

    return `
      <div class="space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="users" class="w-5 h-5 text-blue-700"></i>
              <span>Quản lý tài khoản người dùng</span>
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">Tạo mới, phân bổ chức vụ, phòng ban và quản lý trạng thái tài khoản</p>
          </div>

          <button onclick="UserManagementPage.openCreateModal()" class="px-4 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition flex items-center gap-1.5 shadow-xs">
            <i data-lucide="user-plus" class="w-4 h-4"></i> Tạo tài khoản mới
          </button>
        </div>

        <!-- Filter -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Lọc theo vai trò</label>
              <select id="user-filter-role" onchange="UserManagementPage.loadUsers()" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium">
                <option value="">Tất cả vai trò</option>
                <option value="admin">Quản trị viên</option>
                <option value="leader">Lãnh đạo UBND</option>
                <option value="officer">Cán bộ, công chức</option>
                <option value="citizen">Người dân</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Tìm kiếm</label>
              <input type="text" id="user-filter-search" oninput="UserManagementPage.loadUsers()" placeholder="Tên đăng nhập, họ tên, email, chức vụ..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
            </div>
          </div>
        </div>

        <!-- Users Table -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div class="overflow-x-auto text-xs">
            <table class="w-full text-left">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <tr>
                  <th class="p-3.5">Họ và tên</th>
                  <th class="p-3.5">Tên đăng nhập</th>
                  <th class="p-3.5">Vai trò</th>
                  <th class="p-3.5">Phòng ban / Chức vụ</th>
                  <th class="p-3.5">Liên hệ</th>
                  <th class="p-3.5">Trạng thái</th>
                  <th class="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody id="users-tbody" class="divide-y divide-slate-100">
                <tr><td colspan="7" class="p-8 text-center text-slate-400">Đang tải danh sách người dùng...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  async loadUsers() {
    const role = document.getElementById('user-filter-role')?.value || '';
    const search = document.getElementById('user-filter-search')?.value || '';

    try {
      let users = await API.getUsers({ role });
      const tbody = document.getElementById('users-tbody');
      if (!tbody) return;

      if (search && search.trim()) {
        const s = search.trim().toLowerCase();
        users = users.filter(u => 
          u.username.toLowerCase().includes(s) || 
          u.full_name.toLowerCase().includes(s) || 
          (u.email && u.email.toLowerCase().includes(s)) ||
          (u.position && u.position.toLowerCase().includes(s))
        );
      }

      if (!users || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">Không tìm thấy tài khoản nào</td></tr>`;
        return;
      }

      const roleBadges = {
        admin: '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">Quản trị viên</span>',
        leader: '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">Lãnh đạo UBND</span>',
        officer: '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">Cán bộ, công chức</span>',
        citizen: '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">Người dân</span>'
      };

      tbody.innerHTML = users.map(u => `
        <tr class="hover:bg-slate-50 transition">
          <td class="p-3.5 whitespace-nowrap">
            <div class="font-bold text-slate-900 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px]">
                ${u.full_name.charAt(0)}
              </span>
              <span>${u.full_name}</span>
            </div>
          </td>
          <td class="p-3.5 whitespace-nowrap font-mono font-semibold text-slate-700">
            @${u.username}
          </td>
          <td class="p-3.5 whitespace-nowrap">
            ${roleBadges[u.role] || u.role}
          </td>
          <td class="p-3.5 whitespace-nowrap">
            <div class="font-medium text-slate-800">${u.position || '-'}</div>
            <div class="text-[10px] text-slate-400">${u.department || ''}</div>
          </td>
          <td class="p-3.5 whitespace-nowrap text-slate-600">
            <div>${u.phone || '-'}</div>
            <div class="text-[10px] text-slate-400">${u.email || ''}</div>
          </td>
          <td class="p-3.5 whitespace-nowrap">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
              ${u.is_active ? 'Đang hoạt động' : 'Đã khóa'}
            </span>
          </td>
          <td class="p-3.5 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="UserManagementPage.openEditModal(${u.id})" class="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100" title="Chỉnh sửa thông tin">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="UserManagementPage.toggleStatus(${u.id})" class="p-1.5 rounded-lg ${u.is_active ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}" title="${u.is_active ? 'Khóa tài khoản' : 'Mở khóa'}">
                <i data-lucide="${u.is_active ? 'lock' : 'unlock'}" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      lucide.createIcons({ root: tbody });
    } catch (e) {
      console.error(e);
    }
  },

  // Modal Tạo tài khoản
  openCreateModal() {
    const modal = document.createElement('div');
    modal.id = 'create-user-modal';
    modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
        <h3 class="text-sm font-bold text-slate-900 pb-3 border-b flex items-center gap-2">
          <i data-lucide="user-plus" class="w-4 h-4 text-blue-700"></i>
          <span>Thêm người dùng / cán bộ mới</span>
        </h3>

        <form id="create-user-form" class="py-4 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Tên đăng nhập *</label>
              <input type="text" name="username" required placeholder="canbo_abc" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Mật khẩu ban đầu *</label>
              <input type="password" name="password" required value="123456" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono">
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Họ và tên đầy đủ *</label>
            <input type="text" name="full_name" required placeholder="Nguyễn Văn A" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Vai trò hệ thống *</label>
              <select name="role" required class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold">
                <option value="officer" selected>Cán bộ, công chức</option>
                <option value="leader">Lãnh đạo UBND</option>
                <option value="admin">Quản trị viên</option>
                <option value="citizen">Người dân</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Phòng ban / Đơn vị</label>
              <input type="text" name="department" placeholder="Văn phòng - Thống kê..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Chức vụ cụ thể</label>
              <input type="text" name="position" placeholder="Công chức Địa chính..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Số điện thoại</label>
              <input type="tel" name="phone" placeholder="0912..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Địa chỉ Email công vụ</label>
            <input type="email" name="email" placeholder="canbo@hanoi.gov.vn" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
          </div>

          <div class="pt-3 border-t flex justify-end gap-2">
            <button type="button" onclick="document.getElementById('create-user-modal').remove()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">
              Hủy
            </button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800 shadow-md">
              Tạo tài khoản
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons({ root: modal });

    document.getElementById('create-user-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const payload = Object.fromEntries(formData.entries());

      try {
        await API.createUser(payload);
        modal.remove();
        Modals.showToast('Tạo tài khoản thành công', 'success');
        UserManagementPage.loadUsers();
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  },

  // Modal Sửa thông tin
  async openEditModal(userId) {
    const users = await API.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return;

    const modal = document.createElement('div');
    modal.id = 'edit-user-modal';
    modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 text-xs">
        <h3 class="text-sm font-bold text-slate-900 pb-3 border-b">
          Chỉnh sửa tài khoản: @${target.username}
        </h3>

        <form id="edit-user-form" class="py-4 space-y-4">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Họ và tên *</label>
            <input type="text" name="full_name" required value="${target.full_name}" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Vai trò *</label>
              <select name="role" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold">
                <option value="officer" ${target.role === 'officer' ? 'selected' : ''}>Cán bộ, công chức</option>
                <option value="leader" ${target.role === 'leader' ? 'selected' : ''}>Lãnh đạo UBND</option>
                <option value="admin" ${target.role === 'admin' ? 'selected' : ''}>Quản trị viên</option>
                <option value="citizen" ${target.role === 'citizen' ? 'selected' : ''}>Người dân</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Phòng ban</label>
              <input type="text" name="department" value="${target.department || ''}" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Chức vụ</label>
              <input type="text" name="position" value="${target.position || ''}" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Số điện thoại</label>
              <input type="tel" name="phone" value="${target.phone || ''}" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Email</label>
            <input type="email" name="email" value="${target.email || ''}" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Đổi mật khẩu mới (Bỏ trống nếu giữ nguyên)</label>
            <input type="password" name="password" placeholder="Nhập mật khẩu mới..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
          </div>

          <div class="pt-3 border-t flex justify-end gap-2">
            <button type="button" onclick="document.getElementById('edit-user-modal').remove()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">
              Hủy
            </button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800">
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('edit-user-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const payload = Object.fromEntries(formData.entries());

      try {
        await API.updateUser(userId, payload);
        modal.remove();
        Modals.showToast('Cập nhật tài khoản thành công', 'success');
        UserManagementPage.loadUsers();
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  },

  async toggleStatus(userId) {
    try {
      const res = await API.toggleUserStatus(userId);
      Modals.showToast(res.message, 'success');
      this.loadUsers();
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  },

  async afterRender() {
    this.loadUsers();
  }
};

window.UserManagementPage = UserManagementPage;
