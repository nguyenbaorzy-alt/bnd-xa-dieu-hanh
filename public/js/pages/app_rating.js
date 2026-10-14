// Dedicated App UI/UX Experience Rating Page (Yêu cầu bắt buộc)
const AppRatingPage = {
  async render() {
    const user = API.getUser() || { full_name: 'Khách', role: 'citizen' };

    return `
      <div class="max-w-3xl mx-auto space-y-6">
        
        <!-- Header Banner -->
        <div class="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-800 to-blue-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-md mb-2">
            <span>✨</span> Khảo sát trải nghiệm người dùng
          </div>
          <h1 class="text-xl sm:text-2xl font-black">
            Đánh giá giao diện và trải nghiệm ứng dụng
          </h1>
          <p class="text-xs text-blue-100 mt-2 leading-relaxed">
            Ý kiến đánh giá của bạn là cơ sở quan trọng để đội ngũ phát triển tinh chỉnh màu sắc, tối ưu bố cục và nâng cao tốc độ phản hồi của ứng dụng hành chính điện tử cấp xã.
          </p>
        </div>

        <!-- Rating Form Card -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 text-xs">
          
          <form id="app-full-rating-form" class="space-y-6">
            
            <!-- Câu 1: Giao diện có đẹp không -->
            <div class="space-y-2">
              <label class="block font-bold text-slate-900 text-sm">
                1. Bạn có thấy giao diện ứng dụng đẹp không? <span class="text-rose-500">*</span>
              </label>
              <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                ${[
                  { val: 'Rất đẹp', emoji: '😍', desc: 'Rất hiện đại, trang trọng' },
                  { val: 'Đẹp', emoji: '😊', desc: 'Hài hòa, dễ nhìn' },
                  { val: 'Bình thường', emoji: '😐', desc: 'Chấp nhận được' },
                  { val: 'Chưa đẹp', emoji: '🙁', desc: 'Cần đổi mới' },
                  { val: 'Khó sử dụng', emoji: '😫', desc: 'Rối mắt, bất tiện' }
                ].map((item, idx) => `
                  <label class="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition text-center select-none has-checked:border-blue-700 has-checked:bg-blue-50/80 has-checked:text-blue-900 has-checked:ring-2 has-checked:ring-blue-500/20">
                    <input type="radio" name="q1_ui_beauty" value="${item.val}" ${idx === 0 ? 'checked' : ''} class="sr-only">
                    <span class="text-2xl">${item.emoji}</span>
                    <span class="text-xs font-bold mt-1.5">${item.val}</span>
                    <span class="text-[10px] text-slate-400 mt-0.5">${item.desc}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Câu 2: Tìm thấy chức năng -->
            <div class="space-y-2 pt-2 border-t border-slate-100">
              <label class="block font-bold text-slate-900 text-sm">
                2. Bạn có dễ tìm thấy các chức năng cần thiết không? <span class="text-rose-500">*</span>
              </label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                ${['Rất dễ', 'Khá dễ', 'Bình thường', 'Khó tìm'].map((val, idx) => `
                  <label class="flex items-center justify-center p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition select-none has-checked:border-blue-700 has-checked:bg-blue-50 has-checked:text-blue-900 has-checked:font-bold">
                    <input type="radio" name="q2_ease_of_finding" value="${val}" ${idx === 0 ? 'checked' : ''} class="sr-only">
                    <span class="text-xs">${val}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Câu 3: Chữ dễ đọc và màu sắc -->
            <div class="space-y-2 pt-2 border-t border-slate-100">
              <label class="block font-bold text-slate-900 text-sm">
                3. Bạn có thấy chữ dễ đọc và màu sắc dễ nhìn không? <span class="text-rose-500">*</span>
              </label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                ${['Rất tốt', 'Tốt', 'Bình thường', 'Cần cải thiện'].map((val, idx) => `
                  <label class="flex items-center justify-center p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition select-none has-checked:border-blue-700 has-checked:bg-blue-50 has-checked:text-blue-900 has-checked:font-bold">
                    <input type="radio" name="q3_readability_colors" value="${val}" ${idx === 0 ? 'checked' : ''} class="sr-only">
                    <span class="text-xs">${val}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Câu 4: Đánh giá tốc độ sử dụng ứng dụng -->
            <div class="space-y-2 pt-2 border-t border-slate-100">
              <label class="block font-bold text-slate-900 text-sm">
                4. Bạn đánh giá tốc độ sử dụng ứng dụng như thế nào? (1 đến 5 sao) <span class="text-rose-500">*</span>
              </label>
              <div class="flex items-center gap-2 p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80" id="full-speed-star-box">
                ${[1, 2, 3, 4, 5].map(s => `
                  <button type="button" onclick="AppRatingPage.setSpeedStar(${s})" class="speed-star-btn p-1 text-amber-400 focus:outline-hidden" data-val="${s}">
                    <i data-lucide="star" class="w-8 h-8 fill-current"></i>
                  </button>
                `).join('')}
                <input type="hidden" name="q4_speed_stars" id="full-speed-star-input" value="5">
                <span id="full-speed-star-label" class="font-bold text-amber-900 ml-3 text-xs">5 sao - Tải trang tức thì, rất mượt mà</span>
              </div>
            </div>

            <!-- Câu 5: Bố trí các mục công văn, yêu cầu và thông báo -->
            <div class="space-y-2 pt-2 border-t border-slate-100">
              <label class="block font-bold text-slate-900 text-sm">
                5. Bạn có hài lòng với cách bố trí các mục công văn, yêu cầu và thông báo không? (1 đến 5 sao) <span class="text-rose-500">*</span>
              </label>
              <div class="flex items-center gap-2 p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80" id="full-layout-star-box">
                ${[1, 2, 3, 4, 5].map(s => `
                  <button type="button" onclick="AppRatingPage.setLayoutStar(${s})" class="layout-star-btn p-1 text-amber-400 focus:outline-hidden" data-val="${s}">
                    <i data-lucide="star" class="w-8 h-8 fill-current"></i>
                  </button>
                `).join('')}
                <input type="hidden" name="q5_layout_stars" id="full-layout-star-input" value="5">
                <span id="full-layout-star-label" class="font-bold text-amber-900 ml-3 text-xs">5 sao - Bố cục rất khoa học, dễ thao tác</span>
              </div>
            </div>

            <!-- Câu 6: Đề xuất góp ý -->
            <div class="space-y-2 pt-2 border-t border-slate-100">
              <label class="block font-bold text-slate-900 text-sm">
                6. Bạn có đề xuất thay đổi giao diện hoặc bổ sung tính năng nào không?
              </label>
              <textarea name="q6_suggestions" rows="4" placeholder="Nhập ý kiến góp ý của bạn về giao diện, màu sắc, font chữ, hoặc bất kỳ tính năng nào bạn mong muốn được bổ sung..." class="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 leading-relaxed text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"></textarea>
            </div>

            <!-- Submit Button -->
            <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span class="text-slate-400 text-[11px]">Người đánh giá: <strong>${user.full_name}</strong></span>
              <button type="submit" class="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white font-bold text-xs hover:shadow-xl transition flex items-center gap-2">
                <i data-lucide="send" class="w-4 h-4"></i>
                <span>Gửi đánh giá giao diện</span>
              </button>
            </div>

          </form>

        </div>

      </div>
    `;
  },

  setSpeedStar(rating) {
    document.getElementById('full-speed-star-input').value = rating;
    const labels = {
      1: '1 sao - Rất chậm',
      2: '2 sao - Chưa mượt',
      3: '3 sao - Bình thường',
      4: '4 sao - Tốt, tải nhanh',
      5: '5 sao - Tải trang tức thì, rất mượt mà'
    };
    document.getElementById('full-speed-star-label').innerText = labels[rating] || `${rating} sao`;

    const btns = document.querySelectorAll('.speed-star-btn');
    btns.forEach((b, idx) => {
      const icon = b.querySelector('svg');
      if (idx < rating) {
        b.className = 'speed-star-btn p-1 text-amber-400 focus:outline-hidden';
        if (icon) icon.setAttribute('fill', 'currentColor');
      } else {
        b.className = 'speed-star-btn p-1 text-slate-300 focus:outline-hidden';
        if (icon) icon.setAttribute('fill', 'none');
      }
    });
  },

  setLayoutStar(rating) {
    document.getElementById('full-layout-star-input').value = rating;
    const labels = {
      1: '1 sao - Bố cục rối mắt',
      2: '2 sao - Hơi khó nhìn',
      3: '3 sao - Bình thường',
      4: '4 sao - Khá rõ ràng',
      5: '5 sao - Bố cục rất khoa học, dễ thao tác'
    };
    document.getElementById('full-layout-star-label').innerText = labels[rating] || `${rating} sao`;

    const btns = document.querySelectorAll('.layout-star-btn');
    btns.forEach((b, idx) => {
      const icon = b.querySelector('svg');
      if (idx < rating) {
        b.className = 'layout-star-btn p-1 text-amber-400 focus:outline-hidden';
        if (icon) icon.setAttribute('fill', 'currentColor');
      } else {
        b.className = 'layout-star-btn p-1 text-slate-300 focus:outline-hidden';
        if (icon) icon.setAttribute('fill', 'none');
      }
    });
  },

  async afterRender() {
    const form = document.getElementById('app-full-rating-form');
    if (!form) return;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const payload = {
        q1_ui_beauty: formData.get('q1_ui_beauty'),
        q2_ease_of_finding: formData.get('q2_ease_of_finding'),
        q3_readability_colors: formData.get('q3_readability_colors'),
        q4_speed_stars: parseInt(formData.get('q4_speed_stars'), 10),
        q5_layout_stars: parseInt(formData.get('q5_layout_stars'), 10),
        q6_suggestions: formData.get('q6_suggestions')
      };

      try {
        const res = await API.submitAppUiRating(payload);
        Modals.showToast(res.message, 'success');
        form.reset();
        AppRatingPage.setSpeedStar(5);
        AppRatingPage.setLayoutStar(5);
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  }
};

window.AppRatingPage = AppRatingPage;
