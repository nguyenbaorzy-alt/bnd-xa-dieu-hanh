// Service Satisfaction Rating Page (Đánh giá mức độ hài lòng về dịch vụ)
const ServiceRatingPage = {
  async render() {
    return `
      <div class="max-w-2xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-slate-950 shadow-lg">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/10 font-bold text-xs mb-2">
            <span>★</span> Khảo sát chỉ số hài lòng của người dân (SIPAS)
          </div>
          <h1 class="text-xl sm:text-2xl font-black">
            Đánh giá chất lượng phục vụ của UBND Xã
          </h1>
          <p class="text-xs text-slate-900 mt-2 leading-relaxed">
            Ý kiến đánh giá khách quan của quý công dân sau khi hồ sơ được giải quyết là thước đo để UBND xã nâng cao tinh thần trách nhiệm, cải cách thủ tục hành chính.
          </p>
        </div>

        <!-- Form Card -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 text-xs">
          
          <form id="standalone-service-rating-form" class="space-y-5">
            
            <!-- Mã hồ sơ cần đánh giá -->
            <div>
              <label class="block font-bold text-slate-800 mb-1">Mã hồ sơ của bạn (Đã giải quyết) *</label>
              <input type="text" id="svc-request-code" required placeholder="Ví dụ: HS-2026-00001" class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold uppercase text-blue-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
              <span class="text-[11px] text-slate-400 mt-1 block">Hệ thống chỉ tiếp nhận đánh giá đối với hồ sơ đã được cơ quan giải quyết xong</span>
            </div>

            <!-- Thang điểm sao 1 - 5 -->
            <div class="text-center py-4 bg-amber-50/60 rounded-2xl border border-amber-200/80">
              <label class="block font-bold text-slate-800 mb-2">Mức độ hài lòng chung *</label>
              <div class="flex items-center justify-center gap-3" id="svc-star-box">
                ${[1, 2, 3, 4, 5].map(s => `
                  <button type="button" onclick="ServiceRatingPage.setStar(${s})" class="svc-star-btn p-1.5 text-amber-400 focus:outline-hidden" data-val="${s}">
                    <i data-lucide="star" class="w-9 h-9 fill-current"></i>
                  </button>
                `).join('')}
              </div>
              <input type="hidden" id="svc-stars-val" value="5">
              <div id="svc-star-text" class="font-bold text-amber-900 mt-2 text-xs">5 sao - Rất hài lòng</div>
            </div>

            <!-- 3 Câu hỏi khảo sát chuẩn -->
            <div class="space-y-3 pt-2">
              <label class="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                <input type="checkbox" id="svc-q1" checked class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500">
                <span class="font-medium text-slate-800 text-xs">1. Yêu cầu của bạn đã được giải quyết thỏa đáng, đúng nguyện vọng</span>
              </label>

              <label class="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                <input type="checkbox" id="svc-q2" checked class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500">
                <span class="font-medium text-slate-800 text-xs">2. Cán bộ phản hồi, giải thích và hướng dẫn rõ ràng, lịch sự</span>
              </label>

              <label class="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                <input type="checkbox" id="svc-q3" checked class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500">
                <span class="font-medium text-slate-800 text-xs">3. Thời gian giải quyết hồ sơ nhanh chóng, không bị chậm trễ</span>
              </label>
            </div>

            <!-- Nhận xét chi tiết -->
            <div>
              <label class="block font-bold text-slate-800 mb-1">Ý kiến đóng góp hoặc nhận xét cụ thể:</label>
              <textarea id="svc-comment" rows="4" placeholder="Nhập cảm nhận của quý công dân về thái độ phục vụ và kết quả giải quyết..." class="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 leading-relaxed text-xs"></textarea>
            </div>

            <!-- Nút gửi -->
            <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span class="text-slate-400 text-[11px]">Đánh giá được lưu trữ thực tế vào cơ sở dữ liệu</span>
              <button type="submit" class="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition shadow-md flex items-center gap-2">
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>Gửi đánh giá phục vụ</span>
              </button>
            </div>

          </form>

        </div>

      </div>
    `;
  },

  setStar(val) {
    document.getElementById('svc-stars-val').value = val;
    const labels = {
      1: '1 sao - Rất không hài lòng',
      2: '2 sao - Không hài lòng',
      3: '3 sao - Bình thường',
      4: '4 sao - Hài lòng',
      5: '5 sao - Rất hài lòng'
    };
    document.getElementById('svc-star-text').innerText = labels[val] || `${val} sao`;

    const btns = document.querySelectorAll('.svc-star-btn');
    btns.forEach((b, idx) => {
      const icon = b.querySelector('svg');
      if (idx < val) {
        b.className = 'svc-star-btn p-1.5 text-amber-400 focus:outline-hidden';
        if (icon) icon.setAttribute('fill', 'currentColor');
      } else {
        b.className = 'svc-star-btn p-1.5 text-slate-300 focus:outline-hidden';
        if (icon) icon.setAttribute('fill', 'none');
      }
    });
  },

  async afterRender() {
    const form = document.getElementById('standalone-service-rating-form');
    if (!form) return;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const code = document.getElementById('svc-request-code').value.trim();
      const stars = parseInt(document.getElementById('svc-stars-val').value, 10);
      const q1 = document.getElementById('svc-q1').checked ? 1 : 0;
      const q2 = document.getElementById('svc-q2').checked ? 1 : 0;
      const q3 = document.getElementById('svc-q3').checked ? 1 : 0;
      const comment = document.getElementById('svc-comment').value.trim();

      try {
        // Tra cứu ID của hồ sơ trước
        const reqDoc = await API.trackPublicRequest(code).catch(() => null);
        if (!reqDoc) {
          Modals.showToast('Không tìm thấy mã hồ sơ: ' + code, 'error');
          return;
        }

        const res = await API.submitServiceRating({
          request_id: reqDoc.id,
          stars,
          q1_resolved_satisfactorily: q1,
          q2_clear_feedback: q2,
          q3_processing_time_ok: q3,
          comment
        });

        Modals.showToast(res.message, 'success');
        window.location.hash = `#request-tracking?code=${code}`;
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  }
};

window.ServiceRatingPage = ServiceRatingPage;
