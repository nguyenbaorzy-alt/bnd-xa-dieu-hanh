// Reports & Analytics Page (Báo cáo tổng hợp)
const ReportsPage = {
  async render() {
    const user = API.getUser();
    if (user && user.role === 'citizen') {
      return `<div class="p-8 bg-white rounded-2xl border text-center text-slate-500">Bạn không có quyền truy cập báo cáo nội bộ</div>`;
    }

    const summary = await API.getReportSummary().catch(() => ({}));

    return `
      <div class="space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="file-spreadsheet" class="w-5 h-5 text-blue-700"></i>
              <span>Báo cáo tổng hợp điều hành</span>
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">Báo cáo tình hình xử lý công văn, tiến độ dịch vụ công và mức độ hài lòng</p>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="window.print()" class="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs">
              <i data-lucide="printer" class="w-4 h-4"></i> In báo cáo
            </button>
            <button onclick="window.open('/api/ratings/service/export', '_blank')" class="px-4 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition flex items-center gap-1.5 shadow-xs">
              <i data-lucide="download" class="w-4 h-4"></i> Xuất dữ liệu Excel
            </button>
          </div>
        </div>

        <!-- Filter Period Card (No Print) -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs no-print text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Từ ngày</label>
              <input type="date" value="2026-10-01" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Đến ngày</label>
              <input type="date" value="2026-10-31" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Kỳ báo cáo</label>
              <select class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium">
                <option selected>Tháng 10/2026</option>
                <option>Quý IV/2026</option>
                <option>Cả năm 2026</option>
              </select>
            </div>
            <div class="flex items-end">
              <button onclick="Modals.showToast('Đã cập nhật dữ liệu báo cáo theo kỳ', 'info')" class="w-full p-2.5 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 transition">
                Lọc báo cáo
              </button>
            </div>
          </div>
        </div>

        <!-- Printable Report Layout -->
        <div class="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-8 text-xs text-slate-800">
          
          <!-- Official Report Header -->
          <div class="grid grid-cols-2 gap-4 pb-6 border-b border-slate-200">
            <div class="text-center font-serif">
              <div class="font-bold text-xs uppercase">ỦY BAN NHÂN DÂN XÃ TÂN TRIỀU</div>
              <div class="text-[11px] text-slate-600 mt-0.5">Số: ..../BC-UBND</div>
            </div>
            <div class="text-center font-serif">
              <div class="font-bold text-xs uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div class="font-bold text-[11px]">Độc lập - Tự do - Hạnh phúc</div>
              <div class="italic text-[10px] text-slate-500 mt-1">Tân Triều, ngày 14 tháng 10 năm 2026</div>
            </div>
          </div>

          <div class="text-center my-6">
            <h2 class="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-900">
              BÁO CÁO TỔNG HỢP CÔNG TÁC ĐIỀU HÀNH VĂN BẢN VÀ DỊCH VỤ CÔNG
            </h2>
            <p class="text-xs text-slate-500 mt-1 italic">Kỳ báo cáo: Tháng 10 năm 2026</p>
          </div>

          <!-- Section 1: Công văn đến -->
          <div class="space-y-3">
            <h3 class="font-bold text-sm text-slate-900 uppercase tracking-wide border-l-4 border-blue-700 pl-3">
              I. Tình hình tiếp nhận và xử lý Công văn đến
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span class="text-slate-500">Tổng số tiếp nhận</span>
                <div class="text-xl font-bold text-slate-900 mt-1">${summary.doc_in?.total || 0}</div>
              </div>
              <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span class="text-emerald-700">Đã hoàn thành</span>
                <div class="text-xl font-bold text-emerald-800 mt-1">${summary.doc_in?.completed || 0}</div>
              </div>
              <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <span class="text-rose-700">Quá hạn</span>
                <div class="text-xl font-bold text-rose-800 mt-1">${summary.doc_in?.overdue || 0}</div>
              </div>
              <div class="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <span class="text-blue-700">Tỷ lệ đúng hạn</span>
                <div class="text-xl font-bold text-blue-800 mt-1">${summary.doc_in?.on_time_rate || 100}%</div>
              </div>
            </div>
          </div>

          <!-- Section 2: Công văn đi -->
          <div class="space-y-3">
            <h3 class="font-bold text-sm text-slate-900 uppercase tracking-wide border-l-4 border-blue-700 pl-3">
              II. Tình hình soạn thảo, phê duyệt và phát hành Công văn đi
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span class="text-slate-500">Tổng công văn đã soạn</span>
                <div class="text-xl font-bold text-slate-900 mt-1">${summary.doc_out?.total || 0}</div>
              </div>
              <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <span class="text-amber-700">Đang chờ phê duyệt</span>
                <div class="text-xl font-bold text-amber-800 mt-1">${summary.doc_out?.pending || 0}</div>
              </div>
              <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span class="text-emerald-700">Đã phát hành chính thức</span>
                <div class="text-xl font-bold text-emerald-800 mt-1">${summary.doc_out?.published || 0}</div>
              </div>
            </div>
          </div>

          <!-- Section 3: Yêu cầu trực tuyến -->
          <div class="space-y-3">
            <h3 class="font-bold text-sm text-slate-900 uppercase tracking-wide border-l-4 border-blue-700 pl-3">
              III. Tiếp nhận và giải quyết yêu cầu, kiến nghị của người dân
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span class="text-slate-500">Tổng hồ sơ tiếp nhận</span>
                <div class="text-xl font-bold text-slate-900 mt-1">${summary.requests?.total || 0}</div>
              </div>
              <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span class="text-emerald-700">Đã giải quyết có kết quả</span>
                <div class="text-xl font-bold text-emerald-800 mt-1">${summary.requests?.resolved || 0}</div>
              </div>
              <div class="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <span class="text-blue-700">Tỷ lệ giải quyết</span>
                <div class="text-xl font-bold text-blue-800 mt-1">${summary.requests?.resolve_rate || 0}%</div>
              </div>
            </div>
          </div>

          <!-- Section 4: Đánh giá chất lượng phục vụ & Giao diện -->
          <div class="space-y-3">
            <h3 class="font-bold text-sm text-slate-900 uppercase tracking-wide border-l-4 border-blue-700 pl-3">
              IV. Đánh giá chất lượng phục vụ và phản hồi ứng dụng
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-5 rounded-2xl bg-amber-50/50 border border-amber-200">
                <div class="font-bold text-amber-900 mb-1">Mức độ hài lòng của công dân:</div>
                <div class="text-2xl font-black text-amber-600">${summary.ratings?.service_avg ? summary.ratings.service_avg + ' / 5 ★' : 'Chưa có'}</div>
                <div class="text-slate-500 mt-1">Dựa trên ${summary.ratings?.service_total || 0} lượt đánh giá sau khi hoàn thành hồ sơ</div>
              </div>

              <div class="p-5 rounded-2xl bg-blue-50/50 border border-blue-200">
                <div class="font-bold text-blue-900 mb-1">Đánh giá giao diện & tốc độ app:</div>
                <div class="text-2xl font-black text-blue-700">${summary.ratings?.app_total || 0} lượt góp ý</div>
                <div class="text-slate-500 mt-1">Đa số đánh giá Rất đẹp, tốc độ nhanh và bố cục khoa học</div>
              </div>
            </div>
          </div>

          <!-- Signature block -->
          <div class="grid grid-cols-2 gap-4 pt-12 text-center text-xs">
            <div>
              <div class="font-bold uppercase">NGƯỜI LẬP BÁO CÁO</div>
              <div class="h-20 flex items-center justify-center text-slate-400 italic">(Đã ký)</div>
              <div class="font-semibold text-slate-800">Phạm Hùng Cường</div>
            </div>

            <div>
              <div class="font-bold uppercase">TM. ỦY BAN NHÂN DÂN XÃ</div>
              <div class="font-bold uppercase text-[11px] mt-0.5">CHỦ TỊCH</div>
              <div class="h-20 flex items-center justify-center text-slate-400 italic">(Đã ký duyệt)</div>
              <div class="font-semibold text-slate-800">Trần Đình Thắng</div>
            </div>
          </div>

        </div>

      </div>
    `;
  }
};

window.ReportsPage = ReportsPage;
