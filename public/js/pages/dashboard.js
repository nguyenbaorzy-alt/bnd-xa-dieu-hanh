// Executive Dashboard Page (Role Tailored with KPI cards & Charts)
const DashboardPage = {
  async render() {
    const user = API.getUser() || { role: 'citizen', full_name: 'Khách' };
    const stats = await API.getDashboardStats().catch(() => ({ metrics: {}, charts: {}, pending_approvals: [], recent_requests: [] }));
    const m = stats.metrics || {};
    const isCitizen = user.role === 'citizen';

    return `
      <div class="space-y-6">
        
        <!-- Welcome Banner -->
        <div class="rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
          <div class="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
            <i data-lucide="landmark" class="w-80 h-80"></i>
          </div>
          
          <div class="relative z-10 max-w-2xl">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-md mb-3 border border-white/15">
              <span>★</span> UBND Xã Tân Triều - Huyện Thanh Trì - TP. Hà Nội
            </div>
            <h1 class="text-xl sm:text-2xl font-bold tracking-tight">
              Xin chào, ${user.full_name}!
            </h1>
            <p class="mt-2 text-xs sm:text-sm text-blue-100 leading-relaxed">
              ${isCitizen ? 
                'Cổng dịch vụ công và tiếp nhận phản ánh trực tuyến của UBND xã. Quý công dân có thể gửi kiến nghị, tra cứu tiến độ hồ sơ và đánh giá chất lượng phục vụ.' : 
                'Hệ thống điều hành văn bản điện tử và quy trình phê duyệt công văn nhiều cấp. Theo dõi tiến độ nhiệm vụ và phản ánh của người dân.'}
            </p>

            <!-- Quick Action Buttons -->
            <div class="mt-5 flex flex-wrap gap-2.5">
              ${!isCitizen ? `
                <a href="#doc-create" class="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition shadow-md flex items-center gap-1.5">
                  <i data-lucide="plus-circle" class="w-4 h-4"></i> Soạn công văn
                </a>
                <a href="#approval-inbox" class="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs transition backdrop-blur-md flex items-center gap-1.5 border border-white/20">
                  <i data-lucide="stamp" class="w-4 h-4 text-amber-300"></i> Hộp thư phê duyệt (${m.pending_doc_out || 0})
                </a>
                <a href="#requests-manage" class="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs transition backdrop-blur-md flex items-center gap-1.5 border border-white/20">
                  <i data-lucide="clipboard-list" class="w-4 h-4 text-emerald-300"></i> Hồ sơ trực tuyến (${m.total_requests || 0})
                </a>
              ` : `
                <a href="#citizen-portal" class="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition shadow-md flex items-center gap-1.5">
                  <i data-lucide="send" class="w-4 h-4"></i> Gửi yêu cầu / Phản ánh mới
                </a>
                <a href="#request-tracking" class="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs transition backdrop-blur-md flex items-center gap-1.5 border border-white/20">
                  <i data-lucide="search" class="w-4 h-4 text-amber-300"></i> Tra cứu mã hồ sơ
                </a>
                <button onclick="Modals.openAppRatingModal()" class="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs transition backdrop-blur-md flex items-center gap-1.5 border border-white/20">
                  <i data-lucide="sparkles" class="w-4 h-4 text-amber-300"></i> Đánh giá giao diện app
                </button>
              `}
            </div>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          ${!isCitizen ? `
            <!-- Card 1: Công văn đi đang chờ duyệt -->
            <div class="stat-card bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-500">Công văn chờ duyệt</span>
                <span class="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <i data-lucide="clock" class="w-4 h-4"></i>
                </span>
              </div>
              <div class="text-2xl font-bold text-slate-800 mt-2">${m.pending_doc_out || 0}</div>
              <div class="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                <span>Cần xử lý phê duyệt</span>
              </div>
            </div>

            <!-- Card 2: Công văn đã phát hành -->
            <div class="stat-card bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-500">CV đã phát hành</span>
                <span class="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <i data-lucide="check-circle" class="w-4 h-4"></i>
                </span>
              </div>
              <div class="text-2xl font-bold text-slate-800 mt-2">${m.published_doc_out || 0}</div>
              <div class="text-[11px] text-emerald-700 font-medium mt-1">Đã cấp số chính thức</div>
            </div>

            <!-- Card 3: Công văn đến đang xử lý -->
            <div class="stat-card bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-500">Công văn đến xử lý</span>
                <span class="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <i data-lucide="inbox" class="w-4 h-4"></i>
                </span>
              </div>
              <div class="text-2xl font-bold text-slate-800 mt-2">${m.processing_doc_in || 0}</div>
              <div class="text-[11px] text-blue-700 font-medium mt-1">Tổng tiếp nhận: ${m.total_doc_in || 0}</div>
            </div>

            <!-- Card 4: Yêu cầu trực tuyến chưa xử lý -->
            <div class="stat-card bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-500">Yêu cầu trực tuyến mới</span>
                <span class="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <i data-lucide="message-square" class="w-4 h-4"></i>
                </span>
              </div>
              <div class="text-2xl font-bold text-slate-800 mt-2">${m.pending_requests || 0}</div>
              <div class="text-[11px] text-indigo-700 font-medium mt-1">Đã giải quyết: ${m.resolved_requests || 0}</div>
            </div>
          ` : `
            <!-- Citizen Cards -->
            <div class="stat-card bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-500">Tổng hồ sơ của tôi</span>
                <span class="p-2 rounded-xl bg-blue-50 text-blue-600"><i data-lucide="folder" class="w-4 h-4"></i></span>
              </div>
              <div class="text-2xl font-bold text-slate-800 mt-2">${m.total_requests || 0}</div>
              <div class="text-[11px] text-slate-500 mt-1">Hồ sơ đã gửi</div>
            </div>

            <div class="stat-card bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-500">Đang xử lý</span>
                <span class="p-2 rounded-xl bg-amber-50 text-amber-600"><i data-lucide="clock" class="w-4 h-4"></i></span>
              </div>
              <div class="text-2xl font-bold text-slate-800 mt-2">${m.processing_requests || 0}</div>
              <div class="text-[11px] text-amber-700 mt-1">Cơ quan đang thẩm tra</div>
            </div>

            <div class="stat-card bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-500">Đã có kết quả</span>
                <span class="p-2 rounded-xl bg-emerald-50 text-emerald-600"><i data-lucide="check-circle" class="w-4 h-4"></i></span>
              </div>
              <div class="text-2xl font-bold text-slate-800 mt-2">${m.resolved_requests || 0}</div>
              <div class="text-[11px] text-emerald-700 mt-1">Có thể xem phản hồi</div>
            </div>

            <div class="stat-card bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-500">Độ hài lòng chung</span>
                <span class="p-2 rounded-xl bg-amber-50 text-amber-500"><i data-lucide="star" class="w-4 h-4 fill-current"></i></span>
              </div>
              <div class="text-2xl font-bold text-slate-800 mt-2">${m.avg_satisfaction ? m.avg_satisfaction + ' / 5' : '5.0 / 5'}</div>
              <div class="text-[11px] text-amber-700 mt-1">Dựa trên đánh giá người dân</div>
            </div>
          `}

        </div>

        ${!isCitizen ? `
          <!-- Charts Section (Chart.js) -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- Chart 1: Trạng thái công văn -->
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <i data-lucide="pie-chart" class="w-4 h-4 text-blue-600"></i>
                  <span>Cơ cấu trạng thái công văn</span>
                </h3>
                <span class="text-[11px] text-slate-400">Dữ liệu thời gian thực</span>
              </div>
              <div class="p-4 flex items-center justify-center h-64">
                <canvas id="chart-doc-status"></canvas>
              </div>
            </div>

            <!-- Chart 2: Phân bố đánh giá người dân -->
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <i data-lucide="bar-chart-2" class="w-4 h-4 text-amber-500"></i>
                  <span>Phân bố đánh giá sao của người dân (1 - 5 Sao)</span>
                </h3>
                <span class="text-[11px] font-bold text-emerald-600">TB: ${m.avg_satisfaction ? m.avg_satisfaction + ' ★' : 'Chưa có'}</span>
              </div>
              <div class="p-4 flex items-center justify-center h-64">
                <canvas id="chart-stars-dist"></canvas>
              </div>
            </div>

          </div>
        ` : ''}

        <!-- Tables Section: Pending Approvals & Recent Requests -->
        <div class="grid grid-cols-1 ${!isCitizen ? 'lg:grid-cols-2' : ''} gap-6">
          
          ${!isCitizen ? `
            <!-- Box: Công văn đang chờ phê duyệt -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <i data-lucide="stamp" class="w-4 h-4 text-amber-500"></i>
                  <span>Công văn chờ phê duyệt (${stats.pending_approvals ? stats.pending_approvals.length : 0})</span>
                </h3>
                <a href="#approval-inbox" class="text-xs font-medium text-blue-600 hover:underline">Xem tất cả</a>
              </div>

              <div class="divide-y divide-slate-100 text-xs">
                ${stats.pending_approvals && stats.pending_approvals.length > 0 ? stats.pending_approvals.map(d => `
                  <div class="p-4 hover:bg-slate-50/80 transition flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${d.priority === 'urgent' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">
                          ${d.doc_type}
                        </span>
                        <span class="text-[10px] text-slate-400 font-mono">${d.doc_number || 'Dự thảo'}</span>
                      </div>
                      <a href="#doc-detail?id=${d.id}" class="font-bold text-slate-800 hover:text-blue-600 mt-1 block line-clamp-1">
                        ${d.subject}
                      </a>
                      <div class="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                        <span>Người soạn: <strong>${d.creator_name}</strong></span>
                        <span>•</span>
                        <span>Cấp duyệt: <strong>${d.approval_level}/${d.max_approval_levels}</strong></span>
                      </div>
                    </div>
                    <div class="shrink-0 flex items-center gap-1.5">
                      <button onclick="Modals.openDocumentPreviewModal(${d.id})" class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800" title="Xem trước văn bản">
                        <i data-lucide="eye" class="w-4 h-4"></i>
                      </button>
                      ${user.role === 'leader' || user.role === 'admin' ? `
                        <button onclick="Modals.openApprovalModal(${d.id}, 'approve', '${d.subject.replace(/'/g, "\\'")}')" class="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 transition">
                          Duyệt
                        </button>
                      ` : ''}
                    </div>
                  </div>
                `).join('') : `
                  <div class="p-8 text-center text-slate-400">Không có công văn nào đang chờ duyệt</div>
                `}
              </div>
            </div>
          ` : ''}

          <!-- Box: Yêu cầu trực tuyến mới nhất -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <i data-lucide="globe" class="w-4 h-4 text-blue-600"></i>
                <span>${isCitizen ? 'Hồ sơ yêu cầu của bạn' : 'Yêu cầu trực tuyến mới từ người dân'}</span>
              </h3>
              <a href="${isCitizen ? '#citizen-portal' : '#requests-manage'}" class="text-xs font-medium text-blue-600 hover:underline">Xem tất cả</a>
            </div>

            <div class="divide-y divide-slate-100 text-xs">
              ${stats.recent_requests && stats.recent_requests.length > 0 ? stats.recent_requests.map(r => `
                <div class="p-4 hover:bg-slate-50/80 transition flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px]">
                        ${r.code}
                      </span>
                      <span class="text-[10px] text-slate-500">${r.category}</span>
                    </div>
                    <a href="#request-detail?id=${r.id}" class="font-bold text-slate-800 hover:text-blue-600 mt-1 block line-clamp-1">
                      ${r.title}
                    </a>
                    <div class="text-[11px] text-slate-500 mt-1">
                      ${isCitizen ? `Ngày gửi: ${r.created_at || 'Mới đây'}` : `Công dân: <strong>${r.citizen_name}</strong> (${r.phone})`}
                    </div>
                  </div>
                  <div class="shrink-0 text-right">
                    <span class="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${r.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : (r.status === 'processing' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')}">
                      ${r.status === 'resolved' ? 'Đã giải quyết' : (r.status === 'processing' ? 'Đang xử lý' : 'Đã tiếp nhận')}
                    </span>
                  </div>
                </div>
              `).join('') : `
                <div class="p-8 text-center text-slate-400">Chưa có hồ sơ trực tuyến nào</div>
              `}
            </div>
          </div>

        </div>

      </div>
    `;
  },

  initCharts(stats) {
    const user = API.getUser();
    if (!user || user.role === 'citizen') return;

    // Render Pie Chart for Doc Status
    const statusCtx = document.getElementById('chart-doc-status');
    if (statusCtx && window.Chart) {
      const dist = stats.charts && stats.charts.doc_status_dist ? stats.charts.doc_status_dist : [];
      new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: dist.map(d => d.name),
          datasets: [{
            data: dist.map(d => d.value),
            backgroundColor: ['#16a34a', '#2563eb', '#f59e0b', '#94a3b8'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11, family: "'Be Vietnam Pro', sans-serif" } } }
          },
          cutout: '68%'
        }
      });
    }

    // Render Bar Chart for Stars Distribution
    const starsCtx = document.getElementById('chart-stars-dist');
    if (starsCtx && window.Chart) {
      const starsDist = stats.charts && stats.charts.stars_dist ? stats.charts.stars_dist : [];
      new Chart(starsCtx, {
        type: 'bar',
        data: {
          labels: starsDist.map(s => s.stars),
          datasets: [{
            label: 'Số lượt đánh giá',
            data: starsDist.map(s => s.count),
            backgroundColor: '#f59e0b',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0, font: { size: 10 } } },
            x: { ticks: { font: { size: 11 } } }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  },

  async afterRender() {
    const stats = await API.getDashboardStats().catch(() => ({}));
    this.initCharts(stats);
  }
};

window.DashboardPage = DashboardPage;
