// Secure Citizen Request Tracking Page (Tra cứu hồ sơ trực tuyến)
const RequestTrackingPage = {
  async render() {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const prefillCode = urlParams.get('code') || '';
    const prefillVerify = urlParams.get('verify') || '';

    return `
      <div class="max-w-3xl mx-auto space-y-6">
        
        <!-- Search Header -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4 text-xs">
          <div>
            <h1 class="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="search" class="w-5 h-5 text-blue-700"></i>
              <span>Tra cứu tiến độ giải quyết hồ sơ trực tuyến</span>
            </h1>
            <p class="text-slate-500 mt-1">
              Nhập chính xác Mã hồ sơ và Số điện thoại hoặc Email để tra cứu kết quả xử lý của cơ quan
            </p>
          </div>

          <form id="track-form" class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Mã hồ sơ *</label>
              <input type="text" id="track-code-input" value="${prefillCode}" required placeholder="HS-2026-XXXXX" class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-blue-800 uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Số điện thoại hoặc Email *</label>
              <input type="text" id="track-verify-input" value="${prefillVerify}" required placeholder="Số ĐT hoặc Email đã đăng ký" class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
            </div>

            <div class="flex items-end">
              <button type="submit" class="w-full p-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-xs">
                <i data-lucide="search" class="w-4 h-4"></i>
                <span>Tra cứu ngay</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Tracking Result Container -->
        <div id="track-result-container" class="space-y-6"></div>

      </div>
    `;
  },

  async executeTrack(code, verify) {
    const container = document.getElementById('track-result-container');
    if (!container) return;

    container.innerHTML = `<div class="p-12 text-center text-slate-400 text-xs">Đang tra cứu dữ liệu từ hệ thống...</div>`;

    try {
      const res = await API.trackPublicRequest(code, verify);

      const statusMap = {
        received: { label: 'Đã tiếp nhận', color: 'bg-slate-100 text-slate-800', desc: 'Hồ sơ đã chuyển tới bộ phận Một cửa' },
        pending_assign: { label: 'Chờ phân công', color: 'bg-amber-100 text-amber-800', desc: 'Lãnh đạo đang phân công cán bộ chuyên môn thụ lý' },
        processing: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800', desc: 'Cán bộ đang kiểm tra hiện trường / xác minh hồ sơ' },
        need_info: { label: 'Chờ bổ sung thông tin', color: 'bg-amber-100 text-amber-900', desc: 'Đề nghị quý công dân cung cấp thêm tài liệu' },
        resolved: { label: 'Đã giải quyết thành công', color: 'bg-emerald-100 text-emerald-800', desc: 'Đã có kết quả xử lý chính thức từ cơ quan' },
        rejected: { label: 'Từ chối giải quyết', color: 'bg-rose-100 text-rose-800', desc: 'Không thuộc thẩm quyền hoặc không đủ điều kiện thụ lý' },
        closed: { label: 'Đã đóng hồ sơ', color: 'bg-zinc-200 text-zinc-800', desc: 'Quy trình xử lý hồ sơ đã kết thúc' }
      };

      const curStatus = statusMap[res.status] || { label: res.status, color: 'bg-slate-100 text-slate-700', desc: '' };

      container.innerHTML = `
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 text-xs animate-in fade-in">
          
          <!-- Top Info -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl">
                  ${res.code}
                </span>
                <span class="font-medium text-slate-500">${res.category}</span>
              </div>
              <h2 class="text-base font-bold text-slate-900 mt-2">${res.title}</h2>
              <div class="text-[11px] text-slate-400 mt-0.5">Thời gian gửi: ${res.created_at}</div>
            </div>

            <div class="shrink-0">
              <span class="inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${curStatus.color}">
                ${curStatus.label}
              </span>
            </div>
          </div>

          <!-- Processing Progress Stepper -->
          <div class="py-2">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Tiến trình xử lý</div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
              <div class="p-3 rounded-xl border ${['received', 'pending_assign', 'processing', 'resolved', 'closed'].includes(res.status) ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}">
                1. Tiếp nhận
              </div>
              <div class="p-3 rounded-xl border ${['pending_assign', 'processing', 'resolved', 'closed'].includes(res.status) ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}">
                2. Phân công
              </div>
              <div class="p-3 rounded-xl border ${['processing', 'resolved', 'closed'].includes(res.status) ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}">
                3. Đang thẩm tra
              </div>
              <div class="p-3 rounded-xl border ${res.status === 'resolved' || res.status === 'closed' ? 'bg-emerald-600 text-white font-bold shadow-xs' : (res.status === 'rejected' ? 'bg-rose-600 text-white font-bold' : 'bg-slate-50 border-slate-200 text-slate-400')}">
                4. Có kết quả
              </div>
            </div>
          </div>

          <!-- Nội dung người dân gửi -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span class="font-bold text-slate-700">Nội dung yêu cầu từ công dân:</span>
            <p class="text-slate-800 leading-relaxed whitespace-pre-line">${res.content}</p>
          </div>

          <!-- Phản hồi chính thức từ UBND Xã -->
          ${res.response_note ? `
            <div class="p-5 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-2">
              <div class="flex items-center justify-between text-blue-900 font-bold">
                <span class="flex items-center gap-1.5">
                  <i data-lucide="check-circle" class="w-4 h-4 text-blue-600"></i>
                  Kết quả giải quyết & Phản hồi chính thức từ UBND Xã:
                </span>
                <span class="text-[11px] font-mono text-blue-700">${res.resolved_at || ''}</span>
              </div>
              <p class="text-blue-950 font-medium leading-relaxed whitespace-pre-line text-xs">
                ${res.response_note}
              </p>
              ${res.handler_dept ? `
                <div class="text-[11px] text-blue-800 pt-1 border-t border-blue-200/60 flex items-center justify-between">
                  <span>Bộ phận thụ lý: <strong>${res.handler_dept}</strong></span>
                  ${res.handler_name ? `<span>Cán bộ: <strong>${res.handler_name}</strong></span>` : ''}
                </div>
              ` : ''}
            </div>
          ` : `
            <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed text-xs">
              <strong>Thông báo từ cơ quan:</strong> Hồ sơ của bạn đang được thẩm tra. Kết quả và văn bản phản hồi sẽ được hiển thị tại đây ngay khi hoàn tất.
            </div>
          `}

          <!-- Lý do từ chối nếu có -->
          ${res.rejection_reason ? `
            <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 leading-relaxed text-xs">
              <strong>Lý do từ chối thụ lý:</strong> ${res.rejection_reason}
            </div>
          ` : ''}

          <!-- Attachments -->
          ${res.attachments && res.attachments.length > 0 ? `
            <div>
              <div class="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <i data-lucide="paperclip" class="w-4 h-4 text-blue-600"></i>
                <span>Tài liệu / Kết quả đính kèm (${res.attachments.length}):</span>
              </div>
              <div class="space-y-1.5">
                ${res.attachments.map(att => `
                  <a href="${att.file_path}" target="_blank" download class="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between">
                    <span class="font-semibold text-slate-800 truncate">${att.original_name}</span>
                    <span class="text-blue-600 font-bold shrink-0 text-[11px]">Tải file</span>
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- ĐÁNH GIÁ CHẤT LƯỢNG PHỤC VỤ (Hiện nút khi đã giải quyết) -->
          ${(res.status === 'resolved' || res.status === 'closed') ? `
            <div class="p-6 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                    <i data-lucide="award" class="w-4 h-4 text-amber-600"></i>
                    Đánh giá chất lượng phục vụ của UBND Xã
                  </h3>
                  <p class="text-[11px] text-amber-800 mt-0.5">
                    ${res.rating_stars ? `Bạn đã đánh giá hồ sơ này: <strong>${res.rating_stars} sao ★</strong>` : 'Hãy cho cơ quan biết mức độ hài lòng của bạn sau khi hồ sơ được giải quyết.'}
                  </p>
                </div>

                <button onclick="RequestTrackingPage.openRatingModal(${res.id}, '${res.code}')" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition shadow-xs">
                  ${res.rating_stars ? 'Xem lại / Sửa đánh giá' : '★ Đánh giá ngay'}
                </button>
              </div>

              ${res.rating_comment ? `
                <div class="text-[11px] p-3 rounded-xl bg-white/80 border border-amber-200 text-slate-700 italic">
                  Nhận xét của bạn: "${res.rating_comment}"
                </div>
              ` : ''}
            </div>
          ` : ''}

        </div>
      `;

      lucide.createIcons({ root: container });
    } catch (e) {
      container.innerHTML = `
        <div class="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-3xl text-center space-y-2 text-xs">
          <div class="font-bold text-sm">Không thể tra cứu hồ sơ</div>
          <p>${e.message}</p>
        </div>
      `;
    }
  },

  openRatingModal(requestId, requestCode) {
    const modal = document.createElement('div');
    modal.id = 'service-rating-modal';
    modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Đánh giá chất lượng phục vụ</h3>
            <p class="text-slate-500 font-mono text-[11px]">Hồ sơ: ${requestCode}</p>
          </div>
          <button onclick="document.getElementById('service-rating-modal').remove()" class="text-slate-400 hover:text-slate-700">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="service-rating-form" class="py-4 space-y-4">
          <!-- Số sao -->
          <div class="text-center py-2 bg-amber-50/50 rounded-2xl border border-amber-100">
            <label class="block font-bold text-slate-800 mb-1">Mức độ hài lòng chung *</label>
            <div class="flex items-center justify-center gap-2 pt-1" id="service-star-box">
              ${[1, 2, 3, 4, 5].map(s => `
                <button type="button" onclick="RequestTrackingPage.setServiceStar(${s})" class="service-star-btn p-1 text-amber-400 focus:outline-hidden" data-val="${s}">
                  <i data-lucide="star" class="w-8 h-8 fill-current"></i>
                </button>
              `).join('')}
            </div>
            <input type="hidden" name="stars" id="service-star-input" value="5">
            <div id="service-star-label" class="font-bold text-amber-800 mt-2 text-xs">5 sao - Rất hài lòng</div>
          </div>

          <!-- Câu hỏi phụ -->
          <div class="space-y-3">
            <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
              <input type="checkbox" name="q1" checked class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500">
              <span class="font-medium text-slate-700">1. Yêu cầu của bạn đã được giải quyết thỏa đáng</span>
            </label>

            <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
              <input type="checkbox" name="q2" checked class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500">
              <span class="font-medium text-slate-700">2. Bạn nhận được phản hồi và hướng dẫn rõ ràng</span>
            </label>

            <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
              <input type="checkbox" name="q3" checked class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500">
              <span class="font-medium text-slate-700">3. Thời gian xử lý nhanh chóng, đúng hẹn</span>
            </label>
          </div>

          <!-- Nhận xét chi tiết -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Góp ý để cơ quan nâng cao chất lượng phục vụ:</label>
            <textarea name="comment" rows="3" placeholder="Nhập ý kiến đánh giá, khen ngợi cán bộ hoặc phản ánh tồn tại nếu có..." class="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50"></textarea>
          </div>

          <div class="pt-3 border-t flex justify-end gap-2">
            <button type="button" onclick="document.getElementById('service-rating-modal').remove()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">
              Hủy
            </button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md">
              Gửi đánh giá phục vụ
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons({ root: modal });

    document.getElementById('service-rating-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const payload = {
        request_id: requestId,
        stars: parseInt(formData.get('stars'), 10),
        q1_resolved_satisfactorily: formData.get('q1') ? 1 : 0,
        q2_clear_feedback: formData.get('q2') ? 1 : 0,
        q3_processing_time_ok: formData.get('q3') ? 1 : 0,
        comment: formData.get('comment')
      };

      try {
        const res = await API.submitServiceRating(payload);
        modal.remove();
        Modals.showToast(res.message, 'success');
        const code = document.getElementById('track-code-input').value;
        const verify = document.getElementById('track-verify-input').value;
        RequestTrackingPage.executeTrack(code, verify);
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  },

  setServiceStar(rating) {
    const input = document.getElementById('service-star-input');
    const label = document.getElementById('service-star-label');
    const box = document.getElementById('service-star-box');
    if (input) input.value = rating;

    const labels = {
      1: '1 sao - Rất không hài lòng',
      2: '2 sao - Không hài lòng',
      3: '3 sao - Bình thường',
      4: '4 sao - Hài lòng',
      5: '5 sao - Rất hài lòng'
    };
    if (label) label.innerText = labels[rating] || `${rating} sao`;

    if (box) {
      const btns = box.querySelectorAll('.service-star-btn');
      btns.forEach((b, idx) => {
        const icon = b.querySelector('svg');
        if (idx < rating) {
          b.className = 'service-star-btn p-1 text-amber-400 focus:outline-hidden';
          if (icon) icon.setAttribute('fill', 'currentColor');
        } else {
          b.className = 'service-star-btn p-1 text-slate-300 focus:outline-hidden';
          if (icon) icon.setAttribute('fill', 'none');
        }
      });
    }
  },

  async afterRender() {
    const form = document.getElementById('track-form');
    if (!form) return;

    form.onsubmit = (e) => {
      e.preventDefault();
      const code = document.getElementById('track-code-input').value.trim();
      const verify = document.getElementById('track-verify-input').value.trim();
      RequestTrackingPage.executeTrack(code, verify);
    };

    const preCode = document.getElementById('track-code-input').value.trim();
    const preVerify = document.getElementById('track-verify-input').value.trim();
    if (preCode) {
      RequestTrackingPage.executeTrack(preCode, preVerify);
    }
  }
};

window.RequestTrackingPage = RequestTrackingPage;
