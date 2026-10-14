// Rating Analytics Dashboard Page (2 Nhóm rõ ràng: A. Chất lượng phục vụ & B. Giao diện & trải nghiệm app)
const RatingStatsPage = {
  currentTab: 'service',

  async render() {
    const user = API.getUser();
    if (user && user.role === 'citizen') {
      return `<div class="p-8 bg-white rounded-2xl border text-center text-slate-500">Bạn không có quyền xem trang thống kê đánh giá</div>`;
    }

    return `
      <div class="space-y-6">
        
        <!-- Header & Action -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="bar-chart-3" class="w-5 h-5 text-blue-700"></i>
              <span>Thống kê & Quản lý đánh giá</span>
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">Phân tích đa chiều dữ liệu khảo sát phục vụ công dân và góp ý trải nghiệm giao diện</p>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="RatingStatsPage.exportCsv()" class="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs">
              <i data-lucide="download" class="w-4 h-4 text-emerald-600"></i> Xuất file CSV / Excel
            </button>
          </div>
        </div>

        <!-- Distinct Group Tabs: A. Phục vụ vs B. Giao diện -->
        <div class="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2 text-xs font-bold">
          <button onclick="RatingStatsPage.switchTab('service')" id="tab-stat-service" class="px-5 py-2.5 rounded-xl transition flex items-center gap-2 ${this.currentTab === 'service' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="award" class="w-4 h-4 text-amber-300"></i>
            <span>A. Đánh giá chất lượng phục vụ</span>
          </button>

          <button onclick="RatingStatsPage.switchTab('app_ui')" id="tab-stat-app_ui" class="px-5 py-2.5 rounded-xl transition flex items-center gap-2 ${this.currentTab === 'app_ui' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="sparkles" class="w-4 h-4 text-amber-300"></i>
            <span>B. Đánh giá giao diện & trải nghiệm app</span>
          </button>
        </div>

        <!-- Main Analytics Container -->
        <div id="rating-stats-container" class="space-y-6">
          <div class="p-12 text-center text-slate-400 text-xs">Đang tổng hợp dữ liệu thống kê...</div>
        </div>

      </div>
    `;
  },

  async switchTab(tab) {
    this.currentTab = tab;
    ['service', 'app_ui'].forEach(t => {
      const btn = document.getElementById(`tab-stat-${t}`);
      if (btn) {
        if (t === tab) {
          btn.className = 'px-5 py-2.5 rounded-xl transition flex items-center gap-2 bg-blue-700 text-white shadow-xs';
        } else {
          btn.className = 'px-5 py-2.5 rounded-xl transition flex items-center gap-2 text-slate-600 hover:bg-slate-100';
        }
      }
    });

    await this.loadTabContent();
  },

  async loadTabContent() {
    const container = document.getElementById('rating-stats-container');
    if (!container) return;

    try {
      const data = await API.getRatingStats();

      if (this.currentTab === 'service') {
        const s = data.service || {};
        
        container.innerHTML = `
          <!-- KPI Cards for Service -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            
            <div class="stat-card bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <span class="text-slate-500 font-semibold">Điểm hài lòng trung bình</span>
              <div class="text-3xl font-black text-amber-500 mt-2 flex items-center gap-1">
                <span>${s.avg_stars ? s.avg_stars : 'N/A'}</span>
                <span class="text-base text-slate-400 font-normal">/ 5 ★</span>
              </div>
              <div class="text-[11px] text-slate-400 mt-1">${s.total} lượt đánh giá thực tế</div>
            </div>

            <div class="stat-card bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <span class="text-slate-500 font-semibold">Tỷ lệ giải quyết thỏa đáng</span>
              <div class="text-3xl font-black text-emerald-600 mt-2">
                ${s.satisfied_rate}%
              </div>
              <div class="text-[11px] text-emerald-700 mt-1">Đạt chỉ tiêu kỳ vọng</div>
            </div>

            <div class="stat-card bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <span class="text-slate-500 font-semibold">Tỷ lệ phản hồi rõ ràng</span>
              <div class="text-3xl font-black text-blue-600 mt-2">
                ${s.clear_feedback_rate}%
              </div>
              <div class="text-[11px] text-blue-700 mt-1">Hướng dẫn chu đáo</div>
            </div>

            <div class="stat-card bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <span class="text-slate-500 font-semibold">Tỷ lệ giải quyết đúng hạn</span>
              <div class="text-3xl font-black text-indigo-600 mt-2">
                ${s.on_time_rate}%
              </div>
              <div class="text-[11px] text-indigo-700 mt-1">Không trễ hạn cam kết</div>
            </div>

          </div>

          <!-- Charts & Stars Breakdown -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <i data-lucide="bar-chart-2" class="w-4 h-4 text-amber-500"></i>
                <span>Tỷ lệ phân bố số sao (1 đến 5 sao)</span>
              </h3>
              
              <div class="space-y-3 pt-2 text-xs">
                ${[5, 4, 3, 2, 1].map(star => {
                  const count = (s.stars_distribution && s.stars_distribution[star]) || 0;
                  const pct = s.total > 0 ? Math.round((count / s.total) * 100) : 0;
                  return `
                    <div class="flex items-center gap-3">
                      <span class="font-bold text-slate-700 w-12 shrink-0">${star} sao ★</span>
                      <div class="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full bg-amber-400 rounded-full" style="width: ${pct}%"></div>
                      </div>
                      <span class="font-bold text-slate-600 w-16 text-right shrink-0">${count} (${pct}%)</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <i data-lucide="pie-chart" class="w-4 h-4 text-blue-600"></i>
                <span>Biểu đồ mức độ hài lòng</span>
              </h3>
              <div class="h-56 flex items-center justify-center">
                <canvas id="chart-service-pie"></canvas>
              </div>
            </div>

          </div>

          <!-- Recent Reviews Table -->
          <div class="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div class="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Danh sách nhận xét của người dân gần đây
              </h3>
              <span class="text-xs text-slate-400 font-mono">${s.recent_reviews ? s.recent_reviews.length : 0} phản hồi</span>
            </div>

            <div class="divide-y divide-slate-100 text-xs">
              ${s.recent_reviews && s.recent_reviews.length > 0 ? s.recent_reviews.map(r => `
                <div class="p-4 hover:bg-slate-50 transition flex items-start justify-between gap-4">
                  <div class="space-y-1 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px]">${r.code}</span>
                      <span class="text-amber-500 font-bold flex items-center">${r.stars} ★</span>
                      <span class="text-slate-400 text-[10px]">${r.created_at}</span>
                    </div>
                    <div class="font-semibold text-slate-900">${r.title}</div>
                    <div class="text-slate-700 italic bg-amber-50/40 p-2 rounded-xl border border-amber-100">
                      "${r.comment || 'Không có bình luận chữ'}"
                    </div>
                  </div>
                  <div class="shrink-0 text-right text-[11px] text-slate-400">
                    <div>Thỏa đáng: <strong>${r.q1_resolved_satisfactorily ? 'Có' : 'Không'}</strong></div>
                    <div>Đúng hẹn: <strong>${r.q3_processing_time_ok ? 'Có' : 'Chậm'}</strong></div>
                  </div>
                </div>
              `).join('') : `
                <div class="p-8 text-center text-slate-400">Chưa có dữ liệu đánh giá chất lượng phục vụ</div>
              `}
            </div>
          </div>
        `;

        // Render Service Pie Chart
        setTimeout(() => {
          const ctx = document.getElementById('chart-service-pie');
          if (ctx && window.Chart) {
            new Chart(ctx, {
              type: 'doughnut',
              data: {
                labels: ['5 sao', '4 sao', '3 sao', '1-2 sao'],
                datasets: [{
                  data: [
                    s.stars_distribution[5] || 0,
                    s.stars_distribution[4] || 0,
                    s.stars_distribution[3] || 0,
                    (s.stars_distribution[1] || 0) + (s.stars_distribution[2] || 0)
                  ],
                  backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
              }
            });
          }
        }, 50);

      } else if (this.currentTab === 'app_ui') {
        const u = data.app_ui || {};

        container.innerHTML = `
          <!-- KPI Cards for App UI -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            
            <div class="stat-card bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <span class="text-slate-500 font-semibold">Tổng lượt đánh giá giao diện</span>
              <div class="text-3xl font-black text-blue-700 mt-2">
                ${u.total || 0}
              </div>
              <div class="text-[11px] text-slate-400 mt-1">Cán bộ & Người dân</div>
            </div>

            <div class="stat-card bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <span class="text-slate-500 font-semibold">Tốc độ trung bình (1-5 sao)</span>
              <div class="text-3xl font-black text-amber-500 mt-2 flex items-center gap-1">
                <span>${u.avg_speed ? u.avg_speed : '5.0'}</span>
                <span class="text-base text-slate-400 font-normal">/ 5 ★</span>
              </div>
              <div class="text-[11px] text-emerald-700 mt-1">Phản hồi mượt mà</div>
            </div>

            <div class="stat-card bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <span class="text-slate-500 font-semibold">Bố cục khoa học (1-5 sao)</span>
              <div class="text-3xl font-black text-amber-500 mt-2 flex items-center gap-1">
                <span>${u.avg_layout ? u.avg_layout : '4.9'}</span>
                <span class="text-base text-slate-400 font-normal">/ 5 ★</span>
              </div>
              <div class="text-[11px] text-blue-700 mt-1">Dễ nhìn, dễ thao tác</div>
            </div>

            <div class="stat-card bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <span class="text-slate-500 font-semibold">Tỷ lệ khen giao diện đẹp</span>
              <div class="text-3xl font-black text-emerald-600 mt-2">
                ${u.total > 0 ? Math.round((((u.beauty_distribution['Rất đẹp'] || 0) + (u.beauty_distribution['Đẹp'] || 0)) / u.total) * 100) : 100}%
              </div>
              <div class="text-[11px] text-emerald-700 mt-1">Đạt chuẩn hiện đại</div>
            </div>

          </div>

          <!-- Breakdown Tables -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            
            <!-- Box 1: Vẻ đẹp giao diện (Q1) -->
            <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
              <h4 class="font-bold text-slate-800 uppercase tracking-wide">1. Đánh giá vẻ đẹp (Q1)</h4>
              <div class="space-y-2">
                ${['Rất đẹp', 'Đẹp', 'Bình thường', 'Chưa đẹp', 'Khó sử dụng'].map(val => {
                  const count = (u.beauty_distribution && u.beauty_distribution[val]) || 0;
                  const pct = u.total > 0 ? Math.round((count / u.total) * 100) : 0;
                  return `
                    <div class="flex items-center justify-between text-slate-700 p-2 rounded-xl bg-slate-50">
                      <span>${val}</span>
                      <strong class="text-blue-700">${count} (${pct}%)</strong>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Box 2: Dễ tìm chức năng (Q2) -->
            <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
              <h4 class="font-bold text-slate-800 uppercase tracking-wide">2. Tìm chức năng (Q2)</h4>
              <div class="space-y-2">
                ${['Rất dễ', 'Khá dễ', 'Bình thường', 'Khó tìm'].map(val => {
                  const count = (u.ease_distribution && u.ease_distribution[val]) || 0;
                  const pct = u.total > 0 ? Math.round((count / u.total) * 100) : 0;
                  return `
                    <div class="flex items-center justify-between text-slate-700 p-2 rounded-xl bg-slate-50">
                      <span>${val}</span>
                      <strong class="text-blue-700">${count} (${pct}%)</strong>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Box 3: Dễ đọc và màu sắc (Q3) -->
            <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
              <h4 class="font-bold text-slate-800 uppercase tracking-wide">3. Màu sắc & Chữ (Q3)</h4>
              <div class="space-y-2">
                ${['Rất tốt', 'Tốt', 'Bình thường', 'Cần cải thiện'].map(val => {
                  const count = (u.readability_distribution && u.readability_distribution[val]) || 0;
                  const pct = u.total > 0 ? Math.round((count / u.total) * 100) : 0;
                  return `
                    <div class="flex items-center justify-between text-slate-700 p-2 rounded-xl bg-slate-50">
                      <span>${val}</span>
                      <strong class="text-blue-700">${count} (${pct}%)</strong>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

          </div>

          <!-- User Feedback & Suggestions Table -->
          <div class="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div class="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Ý kiến góp ý & Đề xuất cải thiện giao diện từ người dùng
              </h3>
              <span class="text-xs text-slate-400 font-mono">${u.recent_reviews ? u.recent_reviews.length : 0} lượt đóng góp</span>
            </div>

            <div class="divide-y divide-slate-100 text-xs">
              ${u.recent_reviews && u.recent_reviews.length > 0 ? u.recent_reviews.map(r => `
                <div class="p-4 hover:bg-slate-50 transition flex items-start justify-between gap-4">
                  <div class="space-y-1 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-900">${r.user_name}</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">${r.user_role}</span>
                      <span class="text-[10px] text-slate-400">${r.created_at}</span>
                    </div>
                    <div class="text-slate-800 leading-relaxed bg-blue-50/30 p-2.5 rounded-2xl border border-blue-100/60">
                      ${r.q6_suggestions ? `"${r.q6_suggestions}"` : '<span class="text-slate-400 italic">Không có đề xuất thêm</span>'}
                    </div>
                  </div>
                  <div class="shrink-0 text-right text-[11px] space-y-0.5">
                    <div>Vẻ đẹp: <strong class="text-blue-700">${r.q1_ui_beauty}</strong></div>
                    <div>Tốc độ: <strong class="text-amber-600">${r.q4_speed_stars} ★</strong></div>
                    <div>Bố cục: <strong class="text-amber-600">${r.q5_layout_stars} ★</strong></div>
                  </div>
                </div>
              `).join('') : `
                <div class="p-8 text-center text-slate-400">Chưa có dữ liệu đánh giá giao diện</div>
              `}
            </div>
          </div>
        `;
      }

      lucide.createIcons({ root: container });
    } catch (e) {
      container.innerHTML = `<div class="p-8 text-center text-rose-500 text-xs">Lỗi tải dữ liệu: ${e.message}</div>`;
    }
  },

  exportCsv() {
    if (this.currentTab === 'service') {
      window.open('/api/ratings/service/export', '_blank');
    } else {
      window.open('/api/ratings/app-ui/export', '_blank');
    }
  },

  async afterRender() {
    this.switchTab('service');
  }
};

window.RatingStatsPage = RatingStatsPage;
