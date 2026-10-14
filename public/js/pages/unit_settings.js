// Unit & System Configuration Page (Cài đặt đơn vị & Logo - Admin)
const UnitSettingsPage = {
  async render() {
    const user = API.getUser();
    if (!user || user.role !== 'admin') {
      return `<div class="p-8 bg-white rounded-2xl border text-center text-rose-500">Chỉ có Quản trị viên mới được cấu hình hệ thống</div>`;
    }

    const settings = await API.getSettings().catch(() => ({}));

    return `
      <div class="max-w-3xl mx-auto space-y-6">
        
        <div>
          <h1 class="text-lg font-bold text-slate-900 flex items-center gap-2">
            <i data-lucide="settings" class="w-5 h-5 text-blue-700"></i>
            <span>Cài đặt thông tin đơn vị & Hệ thống</span>
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">Tùy biến tên cơ quan, huyện, tỉnh, thông tin liên hệ và quy tắc cấp số công văn</p>
        </div>

        <form id="unit-settings-form" class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 text-xs">
          
          <div class="border-b border-slate-100 pb-3 font-bold text-slate-800 uppercase tracking-wider text-xs">
            1. Thông tin cơ quan hành chính
          </div>

          <div class="space-y-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Tên Ủy ban nhân dân đơn vị *</label>
              <input type="text" name="unit_name" value="${settings.unit_name || 'ỦY BAN NHÂN DÂN XÃ TÂN TRIỀU'}" required class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold uppercase text-slate-800">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Quận / Huyện *</label>
                <input type="text" name="district" value="${settings.district || 'Huyện Thanh Trì'}" required class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50">
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Tỉnh / Thành phố *</label>
                <input type="text" name="province" value="${settings.province || 'Thành phố Hà Nội'}" required class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Đường dây nóng (Hotline)</label>
                <input type="text" name="hotline" value="${settings.hotline || '024 3861 1234'}" class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50">
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Hộp thư điện tử (Email)</label>
                <input type="email" name="email" value="${settings.email || 'ubnd.tantrieu@hanoi.gov.vn'}" class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50">
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Địa chỉ trụ sở UBND xã</label>
              <input type="text" name="address" value="${settings.address || 'Số 54 Triều Khúc, Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội'}" class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50">
            </div>
          </div>

          <div class="border-t border-slate-100 pt-6">
            <div class="font-bold text-slate-800 uppercase tracking-wider text-xs mb-4">
              2. Cấu hình định dạng số công văn & Lưu ý pháp lý
            </div>

            <div class="space-y-4">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Mẫu định dạng số công văn đi</label>
                <input type="text" name="doc_out_format" value="${settings.doc_out_format || '{seq}/{year}/UBND-{dept}'}" class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-800">
                <span class="text-[11px] text-slate-400 mt-1 block">Quy tắc sinh số chính thức khi phát hành văn bản</span>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Lưu ý pháp lý về tích hợp chữ ký số</label>
                <textarea name="digital_sign_notice" rows="3" class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 leading-relaxed">${settings.digital_sign_notice || ''}</textarea>
              </div>
            </div>
          </div>

          <!-- Buttons -->
          <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button type="button" onclick="Sidebar.resetDemoData()" class="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold transition">
              Khôi phục dữ liệu mẫu
            </button>

            <button type="submit" class="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold transition shadow-md">
              Lưu cấu hình đơn vị
            </button>
          </div>

        </form>

      </div>
    `;
  },

  async afterRender() {
    const form = document.getElementById('unit-settings-form');
    if (!form) return;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      try {
        await API.updateSettings(payload);
        Modals.showToast('Cập nhật cấu hình đơn vị thành công', 'success');
        const headerUnit = document.getElementById('header-unit-name');
        if (headerUnit && payload.unit_name) {
          headerUnit.innerText = payload.unit_name;
        }
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  }
};

window.UnitSettingsPage = UnitSettingsPage;
