// B-Algo Intelligence Studio: AI Tính toán & Thiết kế Thuật toán Tính điểm KPI Độc quyền (by Nguyen Bao)
const KpiAlgoPage = {
  currentAlgo: null,
  generatedAlgo: null,
  simDays: 0,
  simQty: 1,
  simWeight: 1.5,

  async render() {
    const user = API.getUser();
    if (user && user.role === 'citizen') {
      return `<div class="p-8 bg-white rounded-3xl border text-center text-slate-500">Bạn không có quyền truy cập Studio Thuật toán KPI</div>`;
    }

    return `
      <div class="space-y-6">
        
        <!-- Header Banner: B-Algo Studio Brand Identity -->
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
          <div class="absolute -right-16 -bottom-16 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -left-12 -top-12 w-48 h-48 bg-purple-500/15 rounded-full blur-2xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div class="space-y-2">
              <div class="flex items-center gap-2.5 flex-wrap">
                <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center font-black shadow-md">
                  <i data-lucide="brain-circuit" class="w-5 h-5 text-white"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h1 class="text-lg sm:text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-amber-200">
                      B-ALGO INTELLIGENCE STUDIO™
                    </h1>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                      B-Core v2.6.4 PRO
                    </span>
                  </div>
                  <p class="text-xs text-slate-300 mt-0.5">
                    Hệ thống AI Tự động Phân tích Bối cảnh & Thiết kế Thuật toán Tính điểm KPI Tối ưu
                  </p>
                </div>
              </div>
            </div>

            <!-- Author & Innovation Badge -->
            <div class="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-right shrink-0">
              <div class="text-[10px] text-cyan-300 font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                <i data-lucide="award" class="w-3.5 h-3.5"></i>
                <span>Bản quyền công nghệ:</span>
              </div>
              <div class="font-extrabold text-sm text-white mt-0.5">Nguyễn Bảo (Nguyen Bao Rzy)</div>
              <div class="text-[10px] text-slate-400 font-mono">Bao-Work Engine 2026</div>
            </div>
          </div>

          <!-- Quick Navigation Tabs -->
          <div class="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
            <a href="#kpi-workspace" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition flex items-center gap-1.5">
              <i data-lucide="folder-tree" class="w-3.5 h-3.5 text-blue-400"></i>
              <span>Không gian làm việc (3 Cấp)</span>
            </a>
            <a href="#kpi-assistant" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition flex items-center gap-1.5">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-300"></i>
              <span>Trợ lý AI B-Assistant™</span>
            </a>
            <a href="#kpi-dashboard" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition flex items-center gap-1.5">
              <i data-lucide="bar-chart-3" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span>Dashboard & AI Phân tích</span>
            </a>
          </div>
        </div>

        <!-- Main Studio Grid: Left Configuration & Right Math Results -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- LEFT: Prompt & Context Directives (5 Cols) -->
          <div class="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <i data-lucide="sliders" class="w-4 h-4 text-cyan-600"></i>
                <h3 class="font-bold text-xs text-slate-900 uppercase tracking-wider">THIẾT LẬP BỐI CẢNH & CHỈ ĐẠO ĐIỀU HÀNH</h3>
              </div>
              <span class="text-[10px] text-slate-400 font-mono">Input Generator</span>
            </div>

            <!-- Focus Mode Selector -->
            <div>
              <label class="block font-bold text-xs text-slate-700 mb-1.5">Định hướng Tối ưu hóa Thuật toán *</label>
              <div class="space-y-2">
                
                <label class="p-3 rounded-2xl border-2 border-cyan-500 bg-cyan-50/40 cursor-pointer flex items-start gap-2.5 transition" id="mode-label-balanced">
                  <input type="radio" name="priority-mode" value="balanced" checked onchange="KpiAlgoPage.onModeChange('balanced')" class="mt-0.5 text-cyan-600">
                  <div>
                    <div class="font-bold text-slate-900 text-xs">⚖️ Cân bằng & Đa mục tiêu (Khuyên dùng)</div>
                    <div class="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Cân bằng giữa siết tiến độ và khuyến khích cán bộ, thưởng +10%/ngày sớm, phạt 25%/ngày trễ.</div>
                  </div>
                </label>

                <label class="p-3 rounded-2xl border border-slate-200 bg-white cursor-pointer flex items-start gap-2.5 transition hover:bg-slate-50" id="mode-label-discipline">
                  <input type="radio" name="priority-mode" value="discipline" onchange="KpiAlgoPage.onModeChange('discipline')" class="mt-0.5 text-cyan-600">
                  <div>
                    <div class="font-bold text-slate-900 text-xs">🛡️ Kỷ cương thép & Chống trễ Deadline</div>
                    <div class="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Tăng mức phạt lên 35%/ngày, không có vùng đệm, tập trung xử lý hồ sơ tồn đọng và thanh tra.</div>
                  </div>
                </label>

                <label class="p-3 rounded-2xl border border-slate-200 bg-white cursor-pointer flex items-start gap-2.5 transition hover:bg-slate-50" id="mode-label-innovation">
                  <input type="radio" name="priority-mode" value="innovation" onchange="KpiAlgoPage.onModeChange('innovation')" class="mt-0.5 text-cyan-600">
                  <div>
                    <div class="font-bold text-slate-900 text-xs">🚀 Đột phá Sáng tạo & Thưởng vượt mức</div>
                    <div class="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Thưởng lớn +15%/ngày khi hoàn thành sớm, vùng đệm 1 ngày, nhân hệ số đề án lên x2.8.</div>
                  </div>
                </label>

                <label class="p-3 rounded-2xl border border-slate-200 bg-white cursor-pointer flex items-start gap-2.5 transition hover:bg-slate-50" id="mode-label-digital">
                  <input type="radio" name="priority-mode" value="digital_transform" onchange="KpiAlgoPage.onModeChange('digital_transform')" class="mt-0.5 text-cyan-600">
                  <div>
                    <div class="font-bold text-slate-900 text-xs">💻 Đột phá Chuyển đổi số & Đề án 06</div>
                    <div class="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Nâng hệ số số hóa dữ liệu lên x2.2 (+46%), ưu tiên làm sạch dữ liệu hộ tịch & địa chính.</div>
                  </div>
                </label>

              </div>
            </div>

            <!-- Target Department -->
            <div>
              <label class="block font-bold text-xs text-slate-700 mb-1">Phòng ban / Lĩnh vực trọng điểm áp dụng</label>
              <select id="algo-target-dept" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800">
                <option value="Toàn bộ UBND xã (Tất cả phòng ban)">Toàn bộ cơ quan UBND xã</option>
                <option value="Văn phòng - Thống kê">Văn phòng - Thống kê & CNTT</option>
                <option value="Địa chính - Nông nghiệp - Xây dựng & Môi trường">Địa chính - Nông nghiệp - Xây dựng</option>
                <option value="Tư pháp - Hộ tịch">Tư pháp - Hộ tịch</option>
                <option value="Văn hóa - Xã hội">Văn hóa - Xã hội</option>
              </select>
            </div>

            <!-- Custom Prompt Directives for AI -->
            <div>
              <label class="block font-bold text-xs text-slate-700 mb-1">Yêu cầu chỉ đạo đặc thù cho AI tính toán (Prompt)</label>
              <textarea id="algo-context-prompt" rows="3" placeholder="Nhập chỉ đạo hoặc bài toán cần giải quyết... (VD: Cần ưu tiên dứt điểm hồ sơ đất đai trước ngày 30/11, nhiệm vụ kiểm tra hiện trường được nhân thêm hệ số 1.3x...)" class="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-mono leading-relaxed focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"></textarea>
            </div>

            <button type="button" onclick="KpiAlgoPage.generateAlgorithm()" id="btn-generate-algo" class="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 hover:from-blue-800 hover:to-cyan-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2">
              <i data-lucide="sparkles" class="w-4 h-4 text-amber-300"></i>
              <span>AI TÍNH TOÁN & ĐƯA RA THUẬT TOÁN MỚI</span>
            </button>
          </div>

          <!-- RIGHT: AI Generated Math Results & Live Simulator (7 Cols) -->
          <div class="lg:col-span-7 space-y-5">
            
            <!-- Result Box Container -->
            <div id="algo-results-container" class="space-y-5">
              <div class="p-12 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200 shadow-2xs">
                Đang tải cấu hình thuật toán hiện hành...
              </div>
            </div>

          </div>

        </div>

      </div>
    `;
  },

  async afterRender() {
    try {
      this.currentAlgo = await API.getKpiAlgoCurrent();
      this.renderResults(this.currentAlgo, false);
    } catch (e) {
      console.error('Lỗi sau render KpiAlgoPage:', e);
    }
  },

  onModeChange(mode) {
    ['balanced', 'discipline', 'innovation', 'digital'].forEach(m => {
      const lbl = document.getElementById(`mode-label-${m}`);
      if (!lbl) return;
      if (m === mode || (m === 'digital' && mode === 'digital_transform')) {
        lbl.className = 'p-3 rounded-2xl border-2 border-cyan-500 bg-cyan-50/40 cursor-pointer flex items-start gap-2.5 transition';
      } else {
        lbl.className = 'p-3 rounded-2xl border border-slate-200 bg-white cursor-pointer flex items-start gap-2.5 transition hover:bg-slate-50';
      }
    });
  },

  async generateAlgorithm() {
    const btn = document.getElementById('btn-generate-algo');
    const mode = document.querySelector('input[name="priority-mode"]:checked')?.value || 'balanced';
    const dept = document.getElementById('algo-target-dept')?.value || '';
    const prompt = document.getElementById('algo-context-prompt')?.value || '';

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> Đang phân tích ma trận toán học & tính toán thuật toán...`;
      }

      const res = await API.generateKpiAlgo({
        priority_mode: mode,
        target_dept: dept,
        context_goal: prompt
      });

      this.generatedAlgo = res;
      this.renderResults(res, true);
      Modals.showToast('AI đã hoàn tất tính toán và đưa ra mô hình thuật toán mới!', 'success');

    } catch (e) {
      Modals.showToast(e.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="sparkles" class="w-4 h-4 text-amber-300"></i> <span>AI TÍNH TOÁN & ĐƯA RA THUẬT TOÁN MỚI</span>`;
        lucide.createIcons({ root: btn });
      }
    }
  },

  renderResults(algo, isNew = false) {
    const container = document.getElementById('algo-results-container');
    if (!container || !algo) return;

    container.innerHTML = `
      <!-- 1. Algorithm Overview Header Card -->
      <div class="bg-white rounded-3xl border ${isNew ? 'border-cyan-400 ring-2 ring-cyan-400/20' : 'border-slate-200/80'} p-6 shadow-2xs space-y-4">
        
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-extrabold text-slate-900">${algo.algo_name}</span>
              ${isNew ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 animate-pulse">Vừa sinh ra bởi AI</span>' : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Đang kích hoạt</span>'}
            </div>
            <p class="text-xs text-slate-500 mt-1">${algo.rationale}</p>
          </div>

          <button onclick="KpiAlgoPage.applyActiveAlgorithm()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs transition shadow-md shrink-0 flex items-center gap-1.5">
            <i data-lucide="check-circle-2" class="w-4 h-4"></i>
            <span>Áp dụng vào hệ thống</span>
          </button>
        </div>

        <!-- 2. Mathematical LaTeX Formula Card (Điểm sáng công nghệ) -->
        <div class="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-indigo-500/30 space-y-2">
          <div class="flex items-center justify-between text-[10px] text-cyan-300 font-bold uppercase tracking-wider">
            <span class="flex items-center gap-1">
              <i data-lucide="code-2" class="w-3.5 h-3.5"></i>
              <span>CÔNG THỨC TOÁN HỌC ĐỘC QUYỀN (BAO-ALGO MATHEMATICAL MODEL)</span>
            </span>
            <span class="font-mono bg-cyan-400/20 px-2 py-0.5 rounded text-cyan-200">LaTeX Formula</span>
          </div>

          <!-- Formula Display Box -->
          <div class="p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs sm:text-sm text-cyan-200 overflow-x-auto text-center font-bold tracking-wide">
            $$${algo.formula_latex}$$
          </div>

          <div class="text-[11px] text-slate-300 font-sans leading-relaxed pt-1">
            <strong>Diễn giải:</strong> ${algo.formula_explanation}
          </div>
        </div>

        <!-- 3. Key Optimization Parameters -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
          <div class="p-3 rounded-2xl bg-rose-50 border border-rose-200">
            <div class="text-[10px] text-rose-700 font-semibold">Tỷ lệ trừ phạt trễ</div>
            <div class="text-base font-black text-rose-900 font-mono mt-0.5">-${(algo.penalty_per_day * 100).toFixed(0)}%/ngày</div>
          </div>
          <div class="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div class="text-[10px] text-emerald-700 font-semibold">Thưởng hoàn thành sớm</div>
            <div class="text-base font-black text-emerald-900 font-mono mt-0.5">+${(algo.bonus_per_day * 100).toFixed(0)}%/ngày</div>
          </div>
          <div class="p-3 rounded-2xl bg-blue-50 border border-blue-200">
            <div class="text-[10px] text-blue-700 font-semibold">Vùng an toàn (Grace)</div>
            <div class="text-base font-black text-blue-900 font-mono mt-0.5">${algo.grace_days} ngày</div>
          </div>
          <div class="p-3 rounded-2xl bg-purple-50 border border-purple-200">
            <div class="text-[10px] text-purple-700 font-semibold">Hệ số độ khó đề án</div>
            <div class="text-base font-black text-purple-900 font-mono mt-0.5">x${algo.complexity_boost || 1.2}</div>
          </div>
        </div>

        <!-- 4. Projected Benefits Grid -->
        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div class="font-bold text-slate-800 text-[11px] mb-2 flex items-center gap-1.5">
            <i data-lucide="trending-up" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>DỰ BÁO HIỆU QUẢ TOÁN HỌC SAU KHI ÁP DỤNG:</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="p-2 rounded-xl bg-white border border-slate-200">
              <span class="text-[10px] text-slate-400 block">Tăng năng suất</span>
              <strong class="text-emerald-700 text-xs font-mono font-bold">${algo.projected_benefits?.efficiency_gain || '+24%'}</strong>
            </div>
            <div class="p-2 rounded-xl bg-white border border-slate-200">
              <span class="text-[10px] text-slate-400 block">Giảm độ trễ</span>
              <strong class="text-blue-700 text-xs font-mono font-bold">${algo.projected_benefits?.delay_reduction || '-32%'}</strong>
            </div>
            <div class="p-2 rounded-xl bg-white border border-slate-200">
              <span class="text-[10px] text-slate-400 block">Chỉ số động lực</span>
              <strong class="text-purple-700 text-xs font-mono font-bold">${algo.projected_benefits?.motivation_index || '90/100'}</strong>
            </div>
          </div>
        </div>

      </div>

      <!-- 5. Interactive Live Math Simulator (Phòng thử nghiệm mô phỏng điểm số) -->
      <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4 text-xs">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <i data-lucide="calculator" class="w-4 h-4 text-indigo-600"></i>
            <h3 class="font-bold text-xs text-slate-900 uppercase tracking-wider">PHÒNG MÔ PHỎNG THỬ NGHIỆM THUẬT TOÁN (LIVE SIMULATOR)</h3>
          </div>
          <span class="text-[10px] text-slate-400 font-mono">Interactive Testing</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Slider 1: Ngày hoàn thành (sớm hoặc trễ) -->
          <div class="space-y-1.5">
            <div class="flex justify-between font-bold text-slate-700">
              <span>Độ lệch tiến độ:</span>
              <span id="sim-days-display" class="font-mono text-blue-700 font-bold">${this.simDays === 0 ? 'Đúng hạn (0d)' : (this.simDays > 0 ? `Trễ ${this.simDays} ngày` : `Sớm ${Math.abs(this.simDays)} ngày`)}</span>
            </div>
            <input type="range" min="-3" max="5" value="${this.simDays}" oninput="KpiAlgoPage.onSimSliderChange('days', this.value)" class="w-full accent-indigo-600 cursor-pointer">
            <div class="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>Sớm 3 ngày</span>
              <span>Đúng hạn</span>
              <span>Trễ 5 ngày</span>
            </div>
          </div>

          <!-- Slider 2: Số lượng hoàn thành -->
          <div class="space-y-1.5">
            <div class="flex justify-between font-bold text-slate-700">
              <span>Số lượng hoàn thành:</span>
              <span id="sim-qty-display" class="font-mono text-blue-700 font-bold">${this.simQty} sản phẩm</span>
            </div>
            <input type="range" min="1" max="10" value="${this.simQty}" oninput="KpiAlgoPage.onSimSliderChange('qty', this.value)" class="w-full accent-indigo-600 cursor-pointer">
            <div class="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>1 SP</span>
              <span>5 SP</span>
              <span>10 SP</span>
            </div>
          </div>

          <!-- Slider 3: Trọng số nhiệm vụ -->
          <div class="space-y-1.5">
            <div class="flex justify-between font-bold text-slate-700">
              <span>Trọng số loại việc:</span>
              <span id="sim-weight-display" class="font-mono text-purple-700 font-bold">x${this.simWeight}</span>
            </div>
            <select onchange="KpiAlgoPage.onSimSliderChange('weight', this.value)" class="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold">
              <option value="1.0" ${this.simWeight === 1.0 ? 'selected' : ''}>Soạn thảo văn bản (x1.0)</option>
              <option value="1.2" ${this.simWeight === 1.2 ? 'selected' : ''}>Giải quyết TTHC (x1.2)</option>
              <option value="1.5" ${this.simWeight === 1.5 ? 'selected' : ''}>Kiểm tra hiện trường (x1.5)</option>
              <option value="2.0" ${this.simWeight === 2.0 ? 'selected' : ''}>Chỉ đạo thẩm định (x2.0)</option>
              <option value="2.5" ${this.simWeight === 2.5 ? 'selected' : ''}>Đề án kế hoạch trọng điểm (x2.5)</option>
            </select>
          </div>
        </div>

        <!-- Simulation Math Result Preview Card -->
        <div id="sim-result-card" class="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="text-[11px] text-blue-900 font-bold flex items-center gap-1.5">
              <i data-lucide="sparkle" class="w-3.5 h-3.5 text-blue-600"></i>
              <span>KẾT QUẢ ĐIỂM KPI TÍNH TOÁN THEO THUẬT TOÁN AI:</span>
            </div>
            <div class="text-[10px] text-slate-600">
              Sản lượng thô: <span class="font-mono font-bold">${(this.simQty * this.simWeight).toFixed(1)} đ</span> | 
              Hiệu ứng thời gian: <span id="sim-effect-desc" class="font-mono font-bold text-slate-800">Không phạt</span>
            </div>
          </div>

          <div class="text-right">
            <span class="text-[10px] text-slate-500 block uppercase font-bold">Điểm thực nhận</span>
            <span id="sim-final-score" class="text-xl font-black text-blue-900 font-mono">${(this.simQty * this.simWeight).toFixed(2)} đ</span>
          </div>
        </div>

      </div>
    `;

    lucide.createIcons({ root: container });
    this.updateSimCalculation();
  },

  onSimSliderChange(type, val) {
    if (type === 'days') this.simDays = parseInt(val);
    if (type === 'qty') this.simQty = parseFloat(val);
    if (type === 'weight') this.simWeight = parseFloat(val);

    const daysDisplay = document.getElementById('sim-days-display');
    const qtyDisplay = document.getElementById('sim-qty-display');
    const weightDisplay = document.getElementById('sim-weight-display');

    if (daysDisplay) {
      daysDisplay.innerText = this.simDays === 0 ? 'Đúng hạn (0d)' : (this.simDays > 0 ? `Trễ ${this.simDays} ngày` : `Sớm ${Math.abs(this.simDays)} ngày`);
    }
    if (qtyDisplay) qtyDisplay.innerText = `${this.simQty} sản phẩm`;
    if (weightDisplay) weightDisplay.innerText = `x${this.simWeight}`;

    this.updateSimCalculation();
  },

  updateSimCalculation() {
    const algo = this.generatedAlgo || this.currentAlgo;
    if (!algo) return;

    const raw = this.simQty * this.simWeight;
    const penaltyRatePerDay = algo.penalty_per_day || 0.25;
    const bonusRatePerDay = algo.bonus_per_day || 0.10;
    const graceDays = algo.grace_days || 0;

    let finalScore = raw;
    let effectText = 'Đúng hạn (100% điểm)';
    let scoreColor = 'text-blue-900';

    if (this.simDays > 0) {
      const effectiveDelay = Math.max(0, this.simDays - graceDays);
      if (effectiveDelay > 0) {
        const penalty = effectiveDelay * penaltyRatePerDay * raw;
        finalScore = Math.max(0, raw - penalty);
        effectText = `Phạt trễ ${effectiveDelay} ngày (-${(effectiveDelay * penaltyRatePerDay * 100).toFixed(0)}%)`;
        scoreColor = 'text-rose-700';
      } else {
        effectText = `Trong vùng an toàn (${graceDays}d) - Không phạt`;
        scoreColor = 'text-blue-900';
      }
    } else if (this.simDays < 0) {
      const earlyDays = Math.abs(this.simDays);
      const bonusRate = Math.min(0.3, earlyDays * bonusRatePerDay);
      const bonus = bonusRate * raw;
      finalScore = raw + bonus;
      effectText = `Thưởng sớm ${earlyDays} ngày (+${(bonusRate * 100).toFixed(0)}%)`;
      scoreColor = 'text-emerald-700';
    }

    const finalEl = document.getElementById('sim-final-score');
    const effectEl = document.getElementById('sim-effect-desc');

    if (finalEl) {
      finalEl.innerText = `${finalScore.toFixed(2)} đ`;
      finalEl.className = `text-xl font-black font-mono ${scoreColor}`;
    }
    if (effectEl) {
      effectEl.innerText = effectText;
    }
  },

  async applyActiveAlgorithm() {
    const algo = this.generatedAlgo || this.currentAlgo;
    if (!algo) return;

    try {
      const res = await API.applyKpiAlgo(algo);
      this.currentAlgo = algo;
      Modals.showToast(res.message, 'success');
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  }
};

window.KpiAlgoPage = KpiAlgoPage;
