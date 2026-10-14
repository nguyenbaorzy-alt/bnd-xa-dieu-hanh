// Modals & Dialogs Component
const Modals = {
  // Toast notifications
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colorClasses = {
      success: 'bg-emerald-600 text-white shadow-lg border border-emerald-500',
      error: 'bg-rose-600 text-white shadow-lg border border-rose-500',
      warning: 'bg-amber-500 text-slate-950 shadow-lg border border-amber-400',
      info: 'bg-blue-800 text-white shadow-lg border border-blue-700'
    }[type] || 'bg-slate-800 text-white';

    const iconName = {
      success: 'check-circle-2',
      error: 'alert-circle',
      warning: 'alert-triangle',
      info: 'info'
    }[type] || 'info';

    toast.className = `toast-msg p-3.5 rounded-xl flex items-center gap-3 text-xs font-medium ${colorClasses}`;
    toast.innerHTML = `
      <i data-lucide="${iconName}" class="w-4 h-4 shrink-0"></i>
      <span class="flex-1">${message}</span>
      <button onclick="this.parentElement.remove()" class="p-1 hover:opacity-75 focus:outline-hidden">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    `;

    container.appendChild(toast);
    lucide.createIcons({ root: toast });

    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 4500);
  },

  // Open Document Preview Modal (Decree 30/2020/ND-CP Vietnamese Standard)
  async openDocumentPreviewModal(docId) {
    try {
      const doc = await API.getDocOutDetail(docId);
      const settings = await API.getSettings();

      const modal = document.createElement('div');
      modal.id = 'doc-preview-modal';
      modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto';

      modal.innerHTML = `
        <div class="bg-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
          
          <!-- Modal Header (No Print) -->
          <div class="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between no-print">
            <div class="flex items-center gap-3">
              <span class="p-2 rounded-lg bg-blue-50 text-blue-700">
                <i data-lucide="file-text" class="w-5 h-5"></i>
              </span>
              <div>
                <h3 class="text-sm font-bold text-slate-800">Xem trước văn bản chính thức</h3>
                <p class="text-xs text-slate-500 font-mono">Số ký hiệu: ${doc.doc_number || 'Dự thảo'}</p>
              </div>
            </div>
            
            <div class="flex items-center gap-2">
              <button onclick="window.print()" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition">
                <i data-lucide="printer" class="w-3.5 h-3.5"></i> In văn bản
              </button>
              <button onclick="document.getElementById('doc-preview-modal').remove()" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <!-- Document Paper (Printable Official Document Form) -->
          <div class="flex-1 overflow-y-auto p-6 sm:p-10 flex justify-center">
            <div class="official-doc-paper max-w-[210mm] w-full p-8 sm:p-12 text-slate-900 leading-relaxed text-[13pt]">
              
              <!-- Quốc hiệu tiêu ngữ & Tên cơ quan ban hành -->
              <div class="grid grid-cols-2 gap-4 pb-6 border-b border-slate-300">
                <div class="official-header-left">
                  <div class="font-bold uppercase tracking-wider text-[12pt]">${settings.unit_name || 'ỦY BAN NHÂN DÂN XÃ TÂN TRIỀU'}</div>
                  <div class="text-[11pt] text-slate-700 font-medium">Số: ${doc.doc_number || '..../UBND-VP'}</div>
                  <div class="text-[10pt] text-slate-500 italic mt-0.5">V/v: ${doc.subject.substring(0, 38)}...</div>
                </div>

                <div class="official-header-right">
                  <div class="font-bold uppercase tracking-wider text-[12pt]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div class="font-bold text-[12pt]">Độc lập - Tự do - Hạnh phúc</div>
                  <div class="w-32 h-0.5 bg-slate-900 mx-auto my-1"></div>
                  <div class="italic text-[11pt] text-slate-700 mt-1">
                    Tân Triều, ngày ${doc.publish_date ? doc.publish_date.split('-')[2] : '...'} tháng ${doc.publish_date ? doc.publish_date.split('-')[1] : '...'} năm 2026
                  </div>
                </div>
              </div>

              <!-- Tiêu đề văn bản -->
              <div class="text-center my-8">
                <h1 class="text-xl font-bold uppercase tracking-wide text-slate-900">${doc.doc_type}</h1>
                <h2 class="text-sm font-semibold text-slate-800 mt-2 max-w-lg mx-auto italic font-sans">
                  ${doc.subject}
                </h2>
              </div>

              <!-- Nội dung văn bản -->
              <div class="space-y-4 text-justify leading-relaxed whitespace-pre-line text-slate-800 font-serif">
                ${doc.content || 'Chưa có nội dung văn bản chi tiết.'}
              </div>

              <!-- Chữ ký, Nơi nhận & Dấu mô phỏng -->
              <div class="grid grid-cols-2 gap-6 mt-12 pt-6 relative">
                <!-- Nơi nhận -->
                <div class="text-[10pt] leading-snug">
                  <div class="font-bold italic">Nơi nhận:</div>
                  <div class="text-slate-700 mt-1">
                    - Như trên;<br>
                    - Thường trực Đảng ủy xã (b/c);<br>
                    - Thường trực HĐND xã (b/c);<br>
                    - Chủ tịch, các PCT UBND xã;<br>
                    - Lưu: VT, ${doc.creator_dept || 'VP'}.
                  </div>
                </div>

                <!-- Người ký -->
                <div class="text-center">
                  <div class="font-bold uppercase text-[11pt]">TM. ỦY BAN NHÂN DÂN</div>
                  <div class="font-bold uppercase text-[12pt] mt-1">${doc.signer_title || 'CHỦ TỊCH'}</div>
                  
                  <div class="h-24 flex items-center justify-center">
                    ${doc.status === 'published' || doc.status === 'approved' ? `
                      <div class="text-blue-900 font-serif italic text-sm border-b border-blue-400 pb-0.5">
                        (Đã ký số điện tử)
                      </div>
                    ` : `
                      <div class="text-slate-400 italic text-xs">(Chưa ký duyệt)</div>
                    `}
                  </div>

                  <div class="font-bold text-[12pt] mt-2">
                    ${doc.status === 'published' ? 'Trần Đình Thắng' : '(Người ký)'}
                  </div>
                </div>

                <!-- Simulated Seal Watermark if Published -->
                ${doc.status === 'published' ? `
                  <div class="official-seal-badge">
                    <span class="text-[8px] font-bold uppercase tracking-wider">UBND XÃ TÂN TRIỀU</span>
                    <span class="text-[11px] font-black my-0.5">★ ĐÃ KÝ SỐ ★</span>
                    <span class="text-[8px] font-mono">${doc.publish_date || '2026'}</span>
                  </div>
                ` : ''}
              </div>

              <!-- Attachments List inside paper -->
              ${doc.attachments && doc.attachments.length > 0 ? `
                <div class="mt-12 pt-4 border-t border-slate-200 text-xs font-sans text-slate-600 no-print">
                  <div class="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <i data-lucide="paperclip" class="w-3.5 h-3.5 text-blue-600"></i>
                    <span>Tài liệu đính kèm (${doc.attachments.length}):</span>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    ${doc.attachments.map(a => `
                      <a href="${a.file_path}" target="_blank" download class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">
                        <i data-lucide="file" class="w-3 h-3"></i>
                        <span>${a.original_name}</span>
                      </a>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

            </div>
          </div>

          <!-- Modal Footer (No Print) -->
          <div class="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 no-print">
            <div class="flex items-center gap-2">
              <span class="inline-block w-2 h-2 rounded-full ${doc.status === 'published' ? 'bg-emerald-500' : (doc.status === 'approved' ? 'bg-blue-500' : 'bg-amber-500')}"></span>
              <span>Trạng thái: <strong>${doc.status}</strong></span>
              <span>•</span>
              <span>Người soạn: <strong>${doc.creator_name || 'Cán bộ'}</strong></span>
            </div>
            <button onclick="document.getElementById('doc-preview-modal').remove()" class="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition font-medium">
              Đóng cửa sổ
            </button>
          </div>

        </div>
      `;

      document.body.appendChild(modal);
      lucide.createIcons({ root: modal });
    } catch (e) {
      Modals.showToast('Lỗi xem trước: ' + e.message, 'error');
    }
  },

  // Open Approval Action Modal (Approve, Request Edit, Reject, Publish)
  openApprovalModal(docId, actionType, docSubject) {
    const titles = {
      approve: 'Phê duyệt công văn',
      request_edit: 'Yêu cầu chỉnh sửa công văn',
      reject: 'Từ chối phê duyệt công văn',
      publish: 'Phát hành công văn chính thức'
    };

    const actionColors = {
      approve: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      request_edit: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold',
      reject: 'bg-rose-600 hover:bg-rose-700 text-white',
      publish: 'bg-blue-700 hover:bg-blue-800 text-white'
    };

    const isMandatoryComment = actionType === 'request_edit' || actionType === 'reject';

    const modal = document.createElement('div');
    modal.id = 'approval-action-modal';
    modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4';

    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl ${actionType === 'approve' ? 'bg-emerald-50 text-emerald-600' : (actionType === 'publish' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600')}">
              <i data-lucide="${actionType === 'publish' ? 'send' : 'stamp'}" class="w-5 h-5"></i>
            </span>
            <h3 class="text-sm font-bold text-slate-900">${titles[actionType]}</h3>
          </div>
          <button onclick="document.getElementById('approval-action-modal').remove()" class="text-slate-400 hover:text-slate-700">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="py-4 space-y-3">
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div class="text-slate-400 font-medium">Văn bản:</div>
            <div class="text-slate-800 font-semibold mt-0.5">${docSubject}</div>
          </div>

          ${actionType === 'publish' ? `
            <div class="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs leading-relaxed border border-blue-200">
              <div class="font-bold flex items-center gap-1.5 mb-1">
                <i data-lucide="info" class="w-4 h-4 text-blue-600"></i>
                Quy trình cấp số chính thức
              </div>
              Hệ thống sẽ tự động cấp số và ký hiệu công văn theo cấu hình của đơn vị (ví dụ: <strong>XX/2026/UBND-VP</strong>) và ghi nhận thời điểm ban hành.
            </div>
          ` : `
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Ý kiến chỉ đạo / Lý do ${isMandatoryComment ? '<span class="text-rose-500">* (Bắt buộc)</span>' : '(Tùy chọn)'}:
              </label>
              <textarea id="approval-comment" rows="3" placeholder="${actionType === 'request_edit' ? 'Nhập chi tiết các nội dung cần sửa đổi, bổ sung...' : (actionType === 'reject' ? 'Nhập rõ lý do từ chối ban hành văn bản...' : 'Nhập ý kiến chỉ đạo hoặc nhận xét...')}" class="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"></textarea>
            </div>
          `}
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
          <button onclick="document.getElementById('approval-action-modal').remove()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">
            Hủy bỏ
          </button>
          <button id="confirm-approval-btn" class="px-4 py-2 rounded-xl font-semibold transition ${actionColors[actionType]}">
            Xác nhận thực hiện
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons({ root: modal });

    document.getElementById('confirm-approval-btn').onclick = async () => {
      const commentInput = document.getElementById('approval-comment');
      const comment = commentInput ? commentInput.value.trim() : '';

      if (isMandatoryComment && !comment) {
        Modals.showToast('Vui lòng nhập lý do / ý kiến chỉ đạo bắt buộc', 'warning');
        return;
      }

      try {
        if (actionType === 'approve') {
          await API.approveDocOut(docId, comment);
          Modals.showToast('Phê duyệt công văn thành công', 'success');
        } else if (actionType === 'request_edit') {
          await API.requestEditDocOut(docId, comment);
          Modals.showToast('Đã gửi yêu cầu chỉnh sửa tới cán bộ soạn thảo', 'success');
        } else if (actionType === 'reject') {
          await API.rejectDocOut(docId, comment);
          Modals.showToast('Đã từ chối công văn', 'warning');
        } else if (actionType === 'publish') {
          const res = await API.publishDocOut(docId);
          Modals.showToast(`Đã phát hành công văn với số: ${res.official_number}`, 'success');
        }

        modal.remove();
        App.refreshView();
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  },

  // Open App UI/UX Rating Modal (Mục bắt buộc - 6 câu hỏi)
  openAppRatingModal() {
    const modal = document.createElement('div');
    modal.id = 'app-ui-rating-modal';
    modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200">
        
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-lg">
              ✨
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900">Đánh giá giao diện & trải nghiệm</h3>
              <p class="text-xs text-slate-500">Ý kiến đóng góp giúp nâng cấp giao diện ứng dụng đẹp và dễ dùng hơn</p>
            </div>
          </div>
          <button onclick="document.getElementById('app-ui-rating-modal').remove()" class="text-slate-400 hover:text-slate-700">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="app-rating-form" class="py-4 space-y-5 text-xs">
          
          <!-- Câu 1: Giao diện có đẹp không -->
          <div>
            <label class="block font-bold text-slate-800 mb-2">1. Bạn có thấy giao diện ứng dụng đẹp không? *</label>
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
              ${['Rất đẹp', 'Đẹp', 'Bình thường', 'Chưa đẹp', 'Khó sử dụng'].map((val, idx) => `
                <label class="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition text-center select-none has-checked:border-blue-600 has-checked:bg-blue-50 has-checked:text-blue-900 has-checked:font-bold">
                  <input type="radio" name="q1_ui_beauty" value="${val}" ${idx === 0 ? 'checked' : ''} class="sr-only">
                  <span class="text-lg">${['😍', '😊', '😐', '🙁', '😫'][idx]}</span>
                  <span class="text-[11px] mt-1">${val}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Câu 2: Dễ tìm thấy chức năng không -->
          <div>
            <label class="block font-bold text-slate-800 mb-2">2. Bạn có dễ tìm thấy các chức năng cần thiết không? *</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              ${['Rất dễ', 'Khá dễ', 'Bình thường', 'Khó tìm'].map((val, idx) => `
                <label class="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition select-none has-checked:border-blue-600 has-checked:bg-blue-50 has-checked:text-blue-900 has-checked:font-bold">
                  <input type="radio" name="q2_ease_of_finding" value="${val}" ${idx === 0 ? 'checked' : ''} class="sr-only">
                  <span class="text-[11px]">${val}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Câu 3: Chữ dễ đọc và màu sắc dễ nhìn -->
          <div>
            <label class="block font-bold text-slate-800 mb-2">3. Bạn có thấy chữ dễ đọc và màu sắc dễ nhìn không? *</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              ${['Rất tốt', 'Tốt', 'Bình thường', 'Cần cải thiện'].map((val, idx) => `
                <label class="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition select-none has-checked:border-blue-600 has-checked:bg-blue-50 has-checked:text-blue-900 has-checked:font-bold">
                  <input type="radio" name="q3_readability_colors" value="${val}" ${idx === 0 ? 'checked' : ''} class="sr-only">
                  <span class="text-[11px]">${val}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Câu 4: Tốc độ ứng dụng (1-5 sao) -->
          <div>
            <label class="block font-bold text-slate-800 mb-1">4. Bạn đánh giá tốc độ sử dụng ứng dụng như thế nào? (1 - 5 sao) *</label>
            <div class="flex items-center gap-2 pt-1" id="q4-star-container">
              ${[1, 2, 3, 4, 5].map(star => `
                <button type="button" onclick="Modals.setModalStar('q4', ${star})" class="star-btn p-1 text-amber-400 focus:outline-hidden" data-val="${star}">
                  <i data-lucide="star" class="w-6 h-6 fill-current"></i>
                </button>
              `).join('')}
              <input type="hidden" name="q4_speed_stars" id="q4_speed_stars_input" value="5">
              <span id="q4-star-label" class="text-xs font-semibold text-amber-700 ml-2">5 sao - Rất mượt mà</span>
            </div>
          </div>

          <!-- Câu 5: Bố trí các mục công văn, yêu cầu, thông báo (1-5 sao) -->
          <div>
            <label class="block font-bold text-slate-800 mb-1">5. Mức độ hài lòng với cách bố trí các mục? (1 - 5 sao) *</label>
            <div class="flex items-center gap-2 pt-1" id="q5-star-container">
              ${[1, 2, 3, 4, 5].map(star => `
                <button type="button" onclick="Modals.setModalStar('q5', ${star})" class="star-btn p-1 text-amber-400 focus:outline-hidden" data-val="${star}">
                  <i data-lucide="star" class="w-6 h-6 fill-current"></i>
                </button>
              `).join('')}
              <input type="hidden" name="q5_layout_stars" id="q5_layout_stars_input" value="5">
              <span id="q5-star-label" class="text-xs font-semibold text-amber-700 ml-2">5 sao - Rất khoa học</span>
            </div>
          </div>

          <!-- Câu 6: Đề xuất góp ý -->
          <div>
            <label class="block font-bold text-slate-800 mb-1">6. Bạn có đề xuất thay đổi giao diện hoặc bổ sung tính năng nào không?</label>
            <textarea name="q6_suggestions" rows="2" placeholder="Góp ý về màu sắc, kích thước chữ, hoặc tính năng mong muốn bổ sung..." class="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"></textarea>
          </div>

          <!-- Submit Buttons -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button type="button" onclick="document.getElementById('app-ui-rating-modal').remove()" class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">
              Đóng
            </button>
            <button type="submit" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-bold hover:shadow-lg transition">
              Gửi đánh giá giao diện
            </button>
          </div>

        </form>

      </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons({ root: modal });

    // Handle Form Submit
    document.getElementById('app-rating-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
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
        modal.remove();
        Modals.showToast(res.message, 'success');
      } catch (err) {
        Modals.showToast(err.message, 'error');
      }
    };
  },

  setModalStar(prefix, rating) {
    const input = document.getElementById(`${prefix === 'q4' ? 'q4_speed_stars' : 'q5_layout_stars'}_input`);
    const label = document.getElementById(`${prefix}-star-label`);
    const container = document.getElementById(`${prefix}-star-container`);

    if (input) input.value = rating;

    const labels = {
      1: '1 sao - Rất kém',
      2: '2 sao - Chưa tốt',
      3: '3 sao - Bình thường',
      4: '4 sao - Tốt / Hài lòng',
      5: '5 sao - Rất xuất sắc'
    };
    if (label) label.innerText = labels[rating] || `${rating} sao`;

    if (container) {
      const btns = container.querySelectorAll('.star-btn');
      btns.forEach((b, idx) => {
        const icon = b.querySelector('svg');
        if (idx < rating) {
          b.className = 'star-btn p-1 text-amber-400 focus:outline-hidden';
          if (icon) icon.setAttribute('fill', 'currentColor');
        } else {
          b.className = 'star-btn p-1 text-slate-300 focus:outline-hidden';
          if (icon) icon.setAttribute('fill', 'none');
        }
      });
    }
  }
};

window.Modals = Modals;
