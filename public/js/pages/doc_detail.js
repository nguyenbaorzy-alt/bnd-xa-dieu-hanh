// Outbound Document Detail View with Multi-Level Stepper & Audit Trail
const DocDetailPage = {
  docId: null,

  async render() {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    this.docId = urlParams.get('id');

    if (!this.docId) {
      return `<div class="p-8 text-center text-slate-400">Không tìm thấy mã công văn</div>`;
    }

    const doc = await API.getDocOutDetail(this.docId).catch(() => null);
    if (!doc) {
      return `<div class="p-8 text-center text-slate-400">Không tìm thấy công văn hoặc bạn không có quyền truy cập</div>`;
    }

    const user = API.getUser();
    const isApprover = (user.role === 'leader' || user.role === 'admin') && doc.status === 'pending_review';
    const isAuthor = user.id === doc.creator_id || user.role === 'admin';
    const canPublish = (user.role === 'officer' || user.role === 'admin') && doc.status === 'approved';

    const isCreatorChairman = (doc.creator_position && doc.creator_position.includes('Chủ tịch') && !doc.creator_position.includes('Phó')) || doc.creator_id === 2;
    const isCreatorViceChairman = (doc.creator_position && doc.creator_position.includes('Phó Chủ tịch')) || doc.creator_id === 3;

    // Xây dựng thanh tiến trình luân chuyển thông minh theo thẩm quyền người soạn
    let steps = [];
    if (isCreatorChairman) {
      // 2 bước: Chủ tịch ký duyệt -> Văn thư phát hành
      steps = [
        { 
          num: 1, 
          title: 'Soạn & Ký ban hành', 
          desc: doc.creator_name ? `${doc.creator_name} (Chủ tịch)` : 'Chủ tịch UBND xã', 
          completed: doc.status === 'approved' || doc.status === 'published',
          active: doc.status === 'draft' || doc.status === 'pending_review'
        },
        { 
          num: 2, 
          title: 'Phát hành chính thức', 
          desc: 'Văn thư cấp số & đóng dấu', 
          completed: doc.status === 'published', 
          active: doc.status === 'approved' 
        }
      ];
    } else if (isCreatorViceChairman) {
      // 3 bước: Phó Chủ tịch soạn -> Chủ tịch duyệt ký -> Văn thư phát hành
      steps = [
        { 
          num: 1, 
          title: 'Soạn thảo', 
          desc: doc.creator_name ? `${doc.creator_name} (Phó Chủ tịch)` : 'Phó Chủ tịch UBND', 
          completed: true 
        },
        { 
          num: 2, 
          title: 'Phê duyệt & Ký số', 
          desc: 'Chủ tịch UBND xã', 
          completed: doc.status === 'approved' || doc.status === 'published', 
          active: doc.status === 'pending_review' 
        },
        { 
          num: 3, 
          title: 'Phát hành chính thức', 
          desc: 'Văn thư cấp số & đóng dấu', 
          completed: doc.status === 'published', 
          active: doc.status === 'approved' 
        }
      ];
    } else {
      // 4 bước: Cán bộ soạn -> Phó Chủ tịch thẩm định -> Chủ tịch phê duyệt -> Văn thư phát hành
      steps = [
        { 
          num: 1, 
          title: 'Soạn thảo', 
          desc: doc.creator_name || 'Cán bộ', 
          completed: true 
        },
        { 
          num: 2, 
          title: 'Thẩm định cấp 1', 
          desc: 'Phó Chủ tịch UBND xã', 
          completed: doc.approval_level > 1 || doc.status === 'approved' || doc.status === 'published', 
          active: doc.status === 'pending_review' && doc.approval_level === 1 
        },
        { 
          num: 3, 
          title: 'Phê duyệt cấp 2', 
          desc: 'Chủ tịch UBND xã', 
          completed: doc.status === 'approved' || doc.status === 'published', 
          active: doc.status === 'pending_review' && doc.approval_level >= 2 
        },
        { 
          num: 4, 
          title: 'Phát hành chính thức', 
          desc: 'Văn thư cấp số & đóng dấu', 
          completed: doc.status === 'published', 
          active: doc.status === 'approved' 
        }
      ];
    }

    const gridColsClass = steps.length === 2 ? 'sm:grid-cols-2' : (steps.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4');

    const latestEditRequest = doc.history ? doc.history.slice().reverse().find(h => h.action === 'request_edit') : null;
    const latestRejection = doc.history ? doc.history.slice().reverse().find(h => h.action === 'reject') : null;

    let alertBannerHtml = '';
    if (doc.status === 'needs_edit' && (latestEditRequest || doc.latest_edit_reason)) {
      const editComment = latestEditRequest ? latestEditRequest.comment : doc.latest_edit_reason;
      const editActor = latestEditRequest ? latestEditRequest.actor_name : (doc.edit_requested_by || 'Lãnh đạo');
      const editActorPos = latestEditRequest ? (latestEditRequest.actor_position || latestEditRequest.actor_role) : (doc.edit_requested_by_position || '');
      const editTime = latestEditRequest ? latestEditRequest.created_at : (doc.edit_requested_at || '');

      alertBannerHtml = `
        <div class="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 shadow-xs space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <i data-lucide="alert-triangle" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-amber-950">VĂN BẢN ĐANG YÊU CẦU CHỈNH SỬA LẠI</h3>
                <p class="text-xs text-amber-800">
                  Ý kiến chỉ đạo từ: <strong>${editActor}</strong> ${editActorPos ? `(${editActorPos})` : ''} • Thời điểm: <span class="font-mono">${editTime}</span>
                </p>
              </div>
            </div>
            ${isAuthor ? `
              <a href="#doc-create?edit=${doc.id}" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-xs flex items-center gap-1.5 shrink-0">
                <i data-lucide="edit-3" class="w-4 h-4"></i> Mở sửa văn bản ngay
              </a>
            ` : ''}
          </div>

          <div class="p-4 rounded-2xl bg-white border border-amber-200 text-slate-800 text-xs shadow-2xs">
            <div class="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <i data-lucide="message-square" class="w-3.5 h-3.5 text-amber-600"></i>
              <span>Chi tiết lý do & Nội dung yêu cầu sửa đổi:</span>
            </div>
            <div class="text-sm font-serif italic text-slate-900 leading-relaxed pl-3 border-l-2 border-amber-500 font-semibold">
              "${editComment}"
            </div>
          </div>
        </div>
      `;
    } else if (doc.status === 'rejected' && (latestRejection || doc.latest_reject_reason)) {
      const rejectComment = latestRejection ? latestRejection.comment : doc.latest_reject_reason;
      const rejectActor = latestRejection ? latestRejection.actor_name : (doc.reject_requested_by || 'Lãnh đạo');
      const rejectActorPos = latestRejection ? (latestRejection.actor_position || latestRejection.actor_role) : '';
      const rejectTime = latestRejection ? latestRejection.created_at : (doc.reject_requested_at || '');

      alertBannerHtml = `
        <div class="p-5 rounded-3xl bg-rose-50 border-2 border-rose-300 shadow-xs space-y-3">
          <div class="flex items-center gap-2.5 border-b border-rose-200/80 pb-3">
            <div class="w-9 h-9 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
              <i data-lucide="x-circle" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-rose-950">VĂN BẢN ĐÃ BỊ TỪ CHỐI PHÊ DUYỆT</h3>
              <p class="text-xs text-rose-800">
                Người từ chối: <strong>${rejectActor}</strong> ${rejectActorPos ? `(${rejectActorPos})` : ''} • Thời điểm: <span class="font-mono">${rejectTime}</span>
              </p>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-white border border-rose-200 text-slate-800 text-xs shadow-2xs">
            <div class="text-[11px] font-bold text-rose-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <i data-lucide="message-square" class="w-3.5 h-3.5 text-rose-600"></i>
              <span>Lý do từ chối ban hành:</span>
            </div>
            <div class="text-sm font-serif italic text-slate-900 leading-relaxed pl-3 border-l-2 border-rose-500 font-semibold">
              "${rejectComment}"
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="space-y-6">
        
        <!-- Breadcrumbs & Actions -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <a href="#doc-out" class="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </a>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  ${doc.doc_number || 'Dự thảo'}
                </span>
                <span class="text-xs text-slate-500 font-semibold uppercase">${doc.doc_type}</span>
              </div>
              <h1 class="text-base font-bold text-slate-900 mt-1 line-clamp-1 max-w-xl">
                ${doc.subject}
              </h1>
            </div>
          </div>

          <!-- Top Action Buttons -->
          <div class="flex items-center gap-2">
            <button onclick="Modals.openDocumentPreviewModal(${doc.id})" class="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs">
              <i data-lucide="printer" class="w-4 h-4 text-blue-600"></i> Xem trước & In
            </button>

            ${isApprover ? `
              <button onclick="Modals.openApprovalModal(${doc.id}, 'request_edit', '${doc.subject.replace(/'/g, "\\'")}')" class="px-3 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 transition flex items-center gap-1 shadow-2xs">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Yêu cầu sửa
              </button>
              <button onclick="Modals.openApprovalModal(${doc.id}, 'reject', '${doc.subject.replace(/'/g, "\\'")}')" class="px-3 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition flex items-center gap-1 shadow-2xs">
                <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Từ chối
              </button>
              <button onclick="Modals.openApprovalModal(${doc.id}, 'approve', '${doc.subject.replace(/'/g, "\\'")}')" class="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-xs">
                <i data-lucide="check" class="w-4 h-4"></i> Phê duyệt
              </button>
            ` : ''}

            ${canPublish ? `
              <button onclick="Modals.openApprovalModal(${doc.id}, 'publish', '${doc.subject.replace(/'/g, "\\'")}')" class="px-4 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition flex items-center gap-1.5 shadow-xs">
                <i data-lucide="send" class="w-4 h-4"></i> Phát hành chính thức
              </button>
            ` : ''}

            ${(doc.status === 'draft' || doc.status === 'needs_edit') && isAuthor ? `
              <a href="#doc-create?edit=${doc.id}" class="px-3.5 py-2 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs hover:bg-amber-200 transition flex items-center gap-1.5">
                <i data-lucide="edit" class="w-4 h-4"></i> Chỉnh sửa
              </a>
              <button onclick="DocDetailPage.submitDirect(${doc.id})" class="px-4 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition flex items-center gap-1.5">
                <i data-lucide="send" class="w-4 h-4"></i> Trình duyệt
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Banner cảnh báo lý do yêu cầu sửa / từ chối nếu có -->
        ${alertBannerHtml}

        <!-- Visual Multi-Level Approval Stepper -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <i data-lucide="git-branch" class="w-4 h-4 text-blue-600"></i>
            <span>Tiến trình phê duyệt nhiều cấp</span>
          </div>

          <div class="grid grid-cols-1 ${gridColsClass} gap-4 relative">
            ${steps.map((st, idx) => `
              <div class="flex items-center gap-3 p-3 rounded-2xl border ${st.completed ? 'bg-emerald-50/60 border-emerald-200' : (st.active ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20' : 'bg-slate-50 border-slate-200')}">
                <div class="w-8 h-8 rounded-xl font-bold flex items-center justify-center shrink-0 ${st.completed ? 'bg-emerald-600 text-white' : (st.active ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500')}">
                  ${st.completed ? '✓' : st.num}
                </div>
                <div>
                  <div class="font-bold text-xs ${st.completed ? 'text-emerald-900' : (st.active ? 'text-blue-900' : 'text-slate-700')}">
                    ${st.title}
                  </div>
                  <div class="text-[11px] text-slate-500">${st.desc}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Main Content & Metadata Columns -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Column Left: Document Content (2 Cols) -->
          <div class="lg:col-span-2 space-y-6">
            
            <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-4">
              <div class="border-b border-slate-100 pb-4">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Nội dung văn bản</span>
                <h2 class="text-base font-bold text-slate-900 mt-1">${doc.subject}</h2>
              </div>

              <div class="font-serif text-sm leading-relaxed text-slate-800 whitespace-pre-line py-2">
                ${doc.content || '<span class="text-slate-400 italic">Chưa có nội dung văn bản.</span>'}
              </div>

              <!-- Attachments -->
              <div class="pt-6 border-t border-slate-100">
                <div class="font-bold text-xs text-slate-800 mb-3 flex items-center gap-1.5">
                  <i data-lucide="paperclip" class="w-4 h-4 text-blue-600"></i>
                  <span>Tài liệu đính kèm (${doc.attachments ? doc.attachments.length : 0})</span>
                </div>

                ${doc.attachments && doc.attachments.length > 0 ? `
                  <div class="space-y-2">
                    ${doc.attachments.map(att => `
                      <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs hover:bg-slate-100 transition">
                        <div class="flex items-center gap-2.5 truncate">
                          <span class="p-2 rounded-lg bg-white border border-slate-200 text-blue-600 font-bold uppercase text-[10px]">
                            ${att.file_type || 'FILE'}
                          </span>
                          <div class="truncate">
                            <div class="font-semibold text-slate-800 truncate">${att.original_name}</div>
                            <div class="text-[10px] text-slate-400">${(att.file_size / 1024).toFixed(1)} KB • Tải lên: ${att.uploader_name || 'Hệ thống'}</div>
                          </div>
                        </div>
                        <a href="${att.file_path}" target="_blank" download class="px-3 py-1.5 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-800 transition shrink-0">
                          Tải về
                        </a>
                      </div>
                    `).join('')}
                  </div>
                ` : `
                  <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-slate-400 text-xs">
                    Không có tài liệu đính kèm nào
                  </div>
                `}
              </div>
            </div>

            <!-- Approval Audit History Timeline -->
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div class="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <i data-lucide="history" class="w-4 h-4 text-slate-600"></i>
                <span>Nhật ký xử lý & Lịch sử phê duyệt</span>
              </div>

              <div class="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
                ${doc.history && doc.history.length > 0 ? doc.history.map(h => {
                  const actionMap = {
                    submit: { title: 'Trình duyệt văn bản', color: 'bg-blue-600', icon: 'send' },
                    approve: { title: 'Đã phê duyệt', color: 'bg-emerald-600', icon: 'check' },
                    request_edit: { title: 'Yêu cầu chỉnh sửa', color: 'bg-amber-500', icon: 'alert-triangle' },
                    reject: { title: 'Từ chối phê duyệt', color: 'bg-rose-600', icon: 'x' },
                    publish: { title: 'Phát hành chính thức', color: 'bg-blue-800', icon: 'stamp' },
                    revoke: { title: 'Thu hồi văn bản', color: 'bg-zinc-700', icon: 'rotate-ccw' }
                  };
                  const act = actionMap[h.action] || { title: h.action, color: 'bg-slate-600', icon: 'circle' };

                  return `
                    <div class="relative">
                      <div class="absolute -left-[27px] top-0.5 w-5 h-5 rounded-full ${act.color} text-white flex items-center justify-center shadow-xs">
                        <i data-lucide="${act.icon}" class="w-3 h-3"></i>
                      </div>
                      <div class="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                        <div class="flex items-center justify-between">
                          <span class="font-bold text-slate-800">${act.title} (Cấp ${h.level})</span>
                          <span class="text-[10px] text-slate-400 font-mono">${h.created_at}</span>
                        </div>
                        <div class="text-[11px] text-slate-600 mt-1">
                          Thực hiện bởi: <strong>${h.actor_name}</strong> (${h.actor_position || h.actor_role})
                        </div>
                        ${h.comment ? `
                          <div class="mt-2 p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 italic">
                            "${h.comment}"
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `;
                }).join('') : `
                  <div class="text-slate-400">Chưa có nhật ký phê duyệt</div>
                `}
              </div>
            </div>

          </div>

          <!-- Column Right: Metadata Sidebar (1 Col) -->
          <div class="space-y-6">
            
            <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
              <div class="font-bold text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100">
                Thông tin quản lý
              </div>

              <div class="space-y-3">
                <div>
                  <div class="text-slate-400 font-medium">Trạng thái:</div>
                  <div class="font-bold text-slate-800 mt-0.5">${doc.status}</div>
                </div>

                <div>
                  <div class="text-slate-400 font-medium">Số / Ký hiệu:</div>
                  <div class="font-mono font-bold text-slate-900 mt-0.5">${doc.doc_number || 'Chưa cấp số'}</div>
                </div>

                <div>
                  <div class="text-slate-400 font-medium">Loại văn bản:</div>
                  <div class="font-semibold text-slate-800 mt-0.5">${doc.doc_type}</div>
                </div>

                <div>
                  <div class="text-slate-400 font-medium">Mức độ ưu tiên:</div>
                  <div class="font-bold ${doc.priority === 'urgent' ? 'text-amber-700' : 'text-slate-700'} mt-0.5">${doc.priority}</div>
                </div>

                <div>
                  <div class="text-slate-400 font-medium">Đơn vị nhận:</div>
                  <div class="font-semibold text-slate-800 mt-0.5">${doc.recipient_unit}</div>
                </div>

                <div>
                  <div class="text-slate-400 font-medium">Người ký:</div>
                  <div class="font-semibold text-slate-800 mt-0.5">${doc.signer_title || 'Chủ tịch UBND xã'}</div>
                </div>

                <div>
                  <div class="text-slate-400 font-medium">Người soạn thảo:</div>
                  <div class="font-semibold text-slate-800 mt-0.5">${doc.creator_name} (${doc.creator_dept})</div>
                </div>

                <div>
                  <div class="text-slate-400 font-medium">Ngày soạn:</div>
                  <div class="text-slate-700 mt-0.5 font-mono">${doc.draft_date || doc.created_at}</div>
                </div>

                ${doc.publish_date ? `
                  <div>
                    <div class="text-slate-400 font-medium">Ngày phát hành:</div>
                    <div class="text-emerald-700 font-bold mt-0.5 font-mono">${doc.publish_date}</div>
                  </div>
                ` : ''}

                ${doc.due_date ? `
                  <div>
                    <div class="text-slate-400 font-medium">Hạn xử lý:</div>
                    <div class="text-rose-700 font-bold mt-0.5 font-mono">${doc.due_date}</div>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Digital Signature Advisory Box -->
            <div class="bg-blue-50/70 border border-blue-200 rounded-3xl p-5 text-blue-900 text-xs space-y-2">
              <div class="font-bold flex items-center gap-1.5 text-blue-800">
                <i data-lucide="shield-check" class="w-4 h-4 text-blue-600"></i>
                Chữ ký số & Giá trị pháp lý
              </div>
              <p class="text-[11px] leading-relaxed text-blue-800/90">
                Chức năng duyệt điện tử trên hệ thống phục vụ luân chuyển nội bộ. Đối với văn bản phát hành gửi cơ quan bên ngoài hoặc công dân, UBND xã tích hợp ký số Chuyên dùng Chính phủ theo quy định tại Nghị định 30/2020/NĐ-CP.
              </p>
            </div>

          </div>

        </div>

      </div>
    `;
  },

  async submitDirect(id) {
    if (!confirm('Bạn có chắc chắn muốn trình duyệt công văn này lên Lãnh đạo?')) return;
    try {
      await API.submitDocOut(id, 'Cán bộ trình duyệt văn bản');
      Modals.showToast('Trình duyệt công văn thành công', 'success');
      App.refreshView();
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  }
};

window.DocDetailPage = DocDetailPage;
