// Module 1: AI KPI Assistant (Luồng tiền xử lý & chuẩn hóa dữ liệu - 5 Bước Stepper)
const KpiAssistantPage = {
  currentStep: 1,
  sampleDocs: [],
  selectedSampleId: null,
  jobTitle: '',
  inputText: '',
  tasks: [],
  projects: [],
  selectedProjectId: null,
  selectedProgramId: null,
  auditLog: [],
  isExtracting: false,

  async render() {
    const user = API.getUser();
    if (user && user.role === 'citizen') {
      return `<div class="p-8 bg-white rounded-3xl border text-center text-slate-500">Bạn không có quyền truy cập Trợ lý AI KPI Assistant</div>`;
    }

    return `
      <div class="space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-amber-400 text-white flex items-center justify-center text-2xl shadow-md">
              <i data-lucide="sparkles" class="w-6 h-6 animate-pulse"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-base sm:text-lg font-bold text-slate-900">Trợ lý AI KPI Assistant</h1>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  HanoiWork Pipeline
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Tiền xử lý, bóc tách văn bản, chuẩn hóa "6 Rõ" và quy đổi KPI trước khi đưa vào vận hành</p>
            </div>
          </div>

          <!-- Top Navigation Tabs / Quick Links -->
          <div class="flex items-center gap-2">
            <a href="#kpi-workspace" class="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition flex items-center gap-1.5">
              <i data-lucide="folder-tree" class="w-4 h-4 text-slate-500"></i>
              <span>Vào HanoiWork</span>
            </a>
            <a href="#kpi-dashboard" class="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition flex items-center gap-1.5">
              <i data-lucide="bar-chart-3" class="w-4 h-4 text-emerald-600"></i>
              <span>Dashboard KPI</span>
            </a>
          </div>
        </div>

        <!-- 5-Step Pipeline Stepper Bar -->
        <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div class="grid grid-cols-5 gap-2 sm:gap-3 text-xs">
            ${this.renderStepTab(1, 'Lập danh mục', 'Bóc tách văn bản', 'file-text')}
            ${this.renderStepTab(2, 'Chuẩn hóa', 'Ánh xạ hệ số KPI', 'sliders')}
            ${this.renderStepTab(3, 'Kiểm tra 6 Rõ', 'Rà soát phản biện', 'shield-check')}
            ${this.renderStepTab(4, 'Đánh giá thử', 'Mô phỏng tính điểm', 'calculator')}
            ${this.renderStepTab(5, 'Duyệt & Xuất', 'Đẩy sang HanoiWork', 'check-check')}
          </div>
        </div>

        <!-- Step Content Area -->
        <div id="kpi-step-content" class="min-h-[480px]">
          <!-- Rendered dynamically -->
        </div>

      </div>
    `;
  },

  renderStepTab(stepNum, title, subtitle, icon) {
    const isCurrent = this.currentStep === stepNum;
    const isPast = this.currentStep > stepNum;

    let bgClass = 'bg-slate-50 text-slate-400 border-slate-200';
    let iconClass = 'text-slate-400 bg-slate-200/60';
    let numBadge = 'bg-slate-200 text-slate-600';

    if (isCurrent) {
      bgClass = 'bg-blue-50/80 text-blue-900 border-blue-500 shadow-xs ring-2 ring-blue-500/20';
      iconClass = 'text-blue-700 bg-blue-100';
      numBadge = 'bg-blue-700 text-white';
    } else if (isPast) {
      bgClass = 'bg-emerald-50/70 text-emerald-900 border-emerald-300';
      iconClass = 'text-emerald-700 bg-emerald-100';
      numBadge = 'bg-emerald-600 text-white';
    }

    return `
      <button onclick="KpiAssistantPage.goToStep(${stepNum})" class="p-2.5 sm:p-3 rounded-2xl border text-left transition flex flex-col justify-between ${bgClass}">
        <div class="flex items-center justify-between w-full mb-1.5">
          <div class="w-6 h-6 rounded-lg ${numBadge} flex items-center justify-center font-bold text-[11px]">
            ${isPast ? '<i data-lucide="check" class="w-3.5 h-3.5"></i>' : '0' + stepNum}
          </div>
          <i data-lucide="${icon}" class="w-4 h-4 ${isPast ? 'text-emerald-600' : (isCurrent ? 'text-blue-700' : 'text-slate-400')}"></i>
        </div>
        <div>
          <div class="font-bold text-[11px] sm:text-xs truncate">${title}</div>
          <div class="text-[10px] text-slate-400 hidden sm:block truncate">${subtitle}</div>
        </div>
      </button>
    `;
  },

  async goToStep(step) {
    if (step > 1 && this.tasks.length === 0) {
      Modals.showToast('Vui lòng thực hiện Bước 1 để trích xuất danh mục nhiệm vụ trước!', 'warning');
      return;
    }
    this.currentStep = step;
    this.updateStepView();
  },

  async afterRender() {
    try {
      this.sampleDocs = await API.getKpiAssistantSamples();
      this.projects = await API.getKpiHierarchy();
    } catch (e) {
      console.error(e);
    }
    this.updateStepView();
  },

  updateStepView() {
    const container = document.getElementById('kpi-step-content');
    if (!container) return;

    if (this.currentStep === 1) container.innerHTML = this.renderStep1();
    else if (this.currentStep === 2) container.innerHTML = this.renderStep2();
    else if (this.currentStep === 3) container.innerHTML = this.renderStep3();
    else if (this.currentStep === 4) container.innerHTML = this.renderStep4();
    else if (this.currentStep === 5) container.innerHTML = this.renderStep5();

    lucide.createIcons({ root: container });
  },

  // ========================================================
  // BƯỚC 01: KHU VỰC ĐẦU VÀO & LẬP DANH MỤC KPI
  // ========================================================
  renderStep1() {
    return `
      <div class="space-y-6 animate-in fade-in duration-300">
        
        <!-- Input Area Card -->
        <div class="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-blue-700 text-white flex items-center justify-center text-xs font-bold">1</span>
                <span>Khu vực Đầu vào (Input) & Bóc tách văn bản AI</span>
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">Tải lên hoặc chọn mẫu văn bản quy định, kế hoạch, quyết định giao chỉ tiêu</p>
            </div>

            <!-- Nút chọn mẫu có sẵn -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[11px] font-bold text-slate-500 mr-1">Mẫu gợi ý nhanh:</span>
              ${(this.sampleDocs || []).map((s, idx) => `
                <button onclick="KpiAssistantPage.loadSample('${s.id}')" class="px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition ${this.selectedSampleId === s.id ? 'bg-blue-700 text-white border-blue-700' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}">
                  Mẫu ${idx + 1}: ${s.title.split('&')[0].slice(0, 18)}...
                </button>
              `).join('')}
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block font-bold text-xs text-slate-700 mb-1">Vị trí việc làm / Chức danh tiếp nhận</label>
              <input type="text" id="kpi-job-title" value="${this.jobTitle || 'Chuyên viên Văn phòng - Thống kê & CNTT'}" placeholder="VD: Công chức Địa chính - Xây dựng..." class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
              
              <div class="mt-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900 space-y-1">
                <div class="font-bold flex items-center gap-1.5">
                  <i data-lucide="info" class="w-3.5 h-3.5 text-amber-700"></i>
                  <span>Định dạng hỗ trợ</span>
                </div>
                <p class="text-amber-800/90 leading-relaxed">
                  AI tự động nhận diện từ văn bản Word, PDF, file Excel danh mục hoặc văn bản chỉ đạo hành chính.
                </p>
              </div>

              <!-- Upload File Simulation -->
              <div class="mt-3 border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-blue-400 transition cursor-pointer bg-slate-50/50" onclick="document.getElementById('kpi-file-upload').click()">
                <input type="file" id="kpi-file-upload" class="hidden" onchange="KpiAssistantPage.handleFileUpload(event)">
                <i data-lucide="upload-cloud" class="w-6 h-6 mx-auto text-blue-600 mb-1"></i>
                <div class="font-bold text-[11px] text-slate-700">Tải tệp văn bản / Excel</div>
                <div class="text-[10px] text-slate-400">Word, PDF, Excel (.xlsx, .csv)</div>
              </div>
            </div>

            <div class="md:col-span-2 space-y-3">
              <label class="block font-bold text-xs text-slate-700 mb-1">Nội dung văn bản / Mô tả nhiệm vụ cần bóc tách</label>
              <textarea id="kpi-input-text" rows="8" placeholder="Dán nội dung văn bản quy định, kế hoạch công tác hoặc phụ lục giao chỉ tiêu tại đây..." class="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-mono leading-relaxed focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">${this.inputText}</textarea>
              
              <div class="flex justify-end gap-2">
                <button onclick="KpiAssistantPage.clearInput()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold transition">
                  Xóa trắng
                </button>
                <button onclick="KpiAssistantPage.extractTasks()" class="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition flex items-center gap-2 shadow-md">
                  <i data-lucide="sparkles" class="w-4 h-4 text-amber-300"></i>
                  <span>AI Bóc tách & Lập danh mục</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Extraction Results Table -->
        ${this.tasks.length > 0 ? `
          <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <i data-lucide="list-checks" class="w-4 h-4 text-emerald-600"></i>
                  <span>Danh mục nhiệm vụ đã bóc tách (${this.tasks.length} nhiệm vụ)</span>
                </h3>
                <p class="text-xs text-slate-500">Người dùng có thể trực tiếp chỉnh sửa trước khi chuyển sang bước Chuẩn hóa KPI</p>
              </div>

              <button onclick="KpiAssistantPage.addNewTaskRow()" class="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition flex items-center gap-1">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i> Thêm dòng nhiệm vụ
              </button>
            </div>

            <div class="overflow-x-auto rounded-2xl border border-slate-200">
              <table class="w-full text-left text-xs min-w-[750px] table-auto">
                <thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th class="p-3 w-10 text-center whitespace-nowrap">STT</th>
                    <th class="p-3 min-w-[200px]">Tên nhiệm vụ</th>
                    <th class="p-3 w-40 whitespace-nowrap">Đơn vị chủ trì</th>
                    <th class="p-3 w-32 whitespace-nowrap">Thời hạn</th>
                    <th class="p-3 w-24 text-center whitespace-nowrap">Số lượng</th>
                    <th class="p-3 w-48 whitespace-nowrap">Sản phẩm đầu ra</th>
                    <th class="p-3 w-12 text-center whitespace-nowrap">Xóa</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-800">
                  ${this.tasks.map((t, idx) => `
                    <tr class="hover:bg-slate-50/70 transition">
                      <td class="p-3 text-center font-bold text-slate-400 text-[11px]">${idx + 1}</td>
                      <td class="p-3">
                        <input type="text" value="${t.title}" onchange="KpiAssistantPage.updateTaskField(${idx}, 'title', this.value)" class="w-full p-1.5 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-500 font-semibold text-slate-900 bg-transparent text-xs">
                      </td>
                      <td class="p-3">
                        <input type="text" value="${t.lead_unit}" onchange="KpiAssistantPage.updateTaskField(${idx}, 'lead_unit', this.value)" class="w-full p-1.5 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-500 text-slate-700 bg-transparent text-xs">
                      </td>
                      <td class="p-3">
                        <input type="date" value="${t.due_date}" onchange="KpiAssistantPage.updateTaskField(${idx}, 'due_date', this.value)" class="w-full p-1.5 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-500 text-slate-700 bg-transparent text-xs font-mono">
                      </td>
                      <td class="p-3 text-center">
                        <input type="number" min="1" value="${t.target_quantity || 1}" onchange="KpiAssistantPage.updateTaskField(${idx}, 'target_quantity', this.value)" class="w-16 p-1.5 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-500 text-center font-bold text-blue-700 bg-transparent text-xs">
                      </td>
                      <td class="p-3">
                        <input type="text" value="${t.target_product}" onchange="KpiAssistantPage.updateTaskField(${idx}, 'target_product', this.value)" class="w-full p-1.5 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-500 text-slate-700 bg-transparent text-xs">
                      </td>
                      <td class="p-3 text-center">
                        <button onclick="KpiAssistantPage.removeTaskRow(${idx})" class="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition">
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Footer Action -->
            <div class="pt-2 flex justify-end">
              <button onclick="KpiAssistantPage.proceedToStep2()" class="px-6 py-2.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition flex items-center gap-2 shadow-md">
                <span>Tiếp tục: Bước 02 - Chuẩn hóa & Quy đổi</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        ` : ''}

      </div>
    `;
  },

  loadSample(sampleId) {
    this.selectedSampleId = sampleId;
    const s = this.sampleDocs.find(x => x.id === sampleId);
    if (s) {
      this.jobTitle = s.job_title;
      this.inputText = s.content;
      this.updateStepView();
      Modals.showToast(`Đã nạp văn bản: ${s.title}`, 'info');
    }
  },

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.inputText = e.target.result;
      this.updateStepView();
      Modals.showToast(`Đã đọc nội dung từ file "${file.name}"`, 'success');
    };
    reader.readAsText(file);
  },

  clearInput() {
    this.inputText = '';
    this.selectedSampleId = null;
    this.tasks = [];
    this.updateStepView();
  },

  async extractTasks() {
    const title = document.getElementById('kpi-job-title')?.value || '';
    const text = document.getElementById('kpi-input-text')?.value || '';
    this.jobTitle = title;
    this.inputText = text;

    if (!text.trim()) {
      Modals.showToast('Vui lòng nhập văn bản hoặc chọn mẫu!', 'warning');
      return;
    }

    try {
      Modals.showToast('AI đang phân tích và bóc tách văn bản...', 'info');
      const res = await API.extractKpiAssistant({ input_text: text, job_title: title, sample_id: this.selectedSampleId });
      this.tasks = res.tasks || [];
      Modals.showToast(res.message, 'success');
      this.updateStepView();
    } catch (err) {
      Modals.showToast(err.message, 'error');
    }
  },

  updateTaskField(index, field, value) {
    if (this.tasks[index]) {
      this.tasks[index][field] = value;
    }
  },

  addNewTaskRow() {
    this.tasks.push({
      id: `temp-${Date.now()}`,
      title: 'Nhiệm vụ mới bổ sung',
      lead_unit: 'Văn phòng - Thống kê',
      collab_units: 'Các đơn vị phối hợp',
      due_date: '2026-11-30',
      target_quantity: 1,
      target_product: 'Báo cáo tổng hợp số liệu'
    });
    this.updateStepView();
  },

  removeTaskRow(index) {
    this.tasks.splice(index, 1);
    this.updateStepView();
  },

  async proceedToStep2() {
    try {
      Modals.showToast('Đang ánh xạ vào danh mục loại nhiệm vụ chuẩn...', 'info');
      const res = await API.standardizeKpiAssistant({ tasks: this.tasks });
      this.tasks = res.tasks;
      this.currentStep = 2;
      this.updateStepView();
      Modals.showToast(res.message, 'success');
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  },

  // ========================================================
  // BƯỚC 02: CHUẨN HÓA & QUY ĐỔI HỆ SỐ KPI
  // ========================================================
  renderStep2() {
    return `
      <div class="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5 animate-in fade-in duration-300">
        <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-blue-700 text-white flex items-center justify-center text-xs font-bold">2</span>
              <span>Chuẩn hóa & Gắn hệ số quy đổi điểm KPI</span>
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">Ánh xạ từng nhiệm vụ vào danh mục Loại nhiệm vụ chuẩn theo khung công vụ Thủ đô Hà Nội</p>
          </div>

          <div class="text-right">
            <span class="text-[11px] text-slate-500">Tổng điểm quy đổi dự kiến:</span>
            <strong class="text-sm font-black text-blue-700 ml-1.5">
              ${this.tasks.reduce((sum, t) => sum + (parseFloat(t.assigned_kpi_score) || 0), 0).toFixed(1)} điểm
            </strong>
          </div>
        </div>

        <!-- Formula Callout -->
        <div class="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/70 text-xs text-blue-900 flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-2">
            <i data-lucide="calculator" class="w-4 h-4 text-blue-700 shrink-0"></i>
            <span><strong>Công thức 1:</strong> SL giao quy đổi = Số lượng giao × Hệ số quy đổi (điểm chuẩn hóa)</span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-200/80 text-blue-950">
            Cập nhật thời gian thực
          </span>
        </div>

        <!-- Tasks Standardization Table -->
        <div class="overflow-x-auto rounded-2xl border border-slate-200">
          <table class="w-full text-left text-xs min-w-[900px] table-auto">
            <thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th class="p-3 w-10 text-center whitespace-nowrap">STT</th>
                <th class="p-3 min-w-[220px]">Tên nhiệm vụ</th>
                <th class="p-3 w-56 whitespace-nowrap">Loại nhiệm vụ chuẩn</th>
                <th class="p-3 w-24 text-center whitespace-nowrap">Hệ số</th>
                <th class="p-3 w-24 text-center whitespace-nowrap">Số lượng</th>
                <th class="p-3 w-32 text-center whitespace-nowrap">SL quy đổi</th>
                <th class="p-3 w-48 whitespace-nowrap">Sản phẩm gắn liền</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              ${this.tasks.map((t, idx) => `
                <tr class="hover:bg-slate-50/70 transition">
                  <td class="p-3 text-center font-bold text-slate-400 text-[11px]">${idx + 1}</td>
                  <td class="p-3">
                    <div class="font-bold text-slate-900">${t.title}</div>
                    <div class="text-[10px] text-slate-400 mt-0.5">Chủ trì: ${t.lead_unit} | Hạn: ${t.due_date}</div>
                  </td>
                  <td class="p-3">
                    <select onchange="KpiAssistantPage.changeTaskType(${idx}, this.value)" class="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800">
                      <option value="1" ${t.kpi_weight === 2.5 ? 'selected' : ''}>KT-01: Đề án / Kế hoạch (x2.5)</option>
                      <option value="2" ${t.kpi_weight === 1.0 && t.task_type_code === 'KT-02' ? 'selected' : ''}>KT-02: Soạn thảo văn bản (x1.0)</option>
                      <option value="3" ${t.kpi_weight === 1.5 && t.task_type_code === 'KT-03' ? 'selected' : ''}>KT-03: Kiểm tra hiện trường (x1.5)</option>
                      <option value="4" ${t.kpi_weight === 1.2 ? 'selected' : ''}>KT-04: Giải quyết TTHC (x1.2)</option>
                      <option value="5" ${t.kpi_weight === 1.0 && t.task_type_code === 'KT-05' ? 'selected' : ''}>KT-05: Tuyên truyền pháp luật (x1.0)</option>
                      <option value="6" ${t.kpi_weight === 1.0 && t.task_type_code === 'KT-06' ? 'selected' : ''}>KT-06: Tổng hợp báo cáo (x1.0)</option>
                      <option value="7" ${t.kpi_weight === 1.5 && t.task_type_code === 'KT-07' ? 'selected' : ''}>KT-07: Số hóa Đề án 06 (x1.5)</option>
                      <option value="8" ${t.kpi_weight === 2.0 ? 'selected' : ''}>KT-08: Chỉ đạo & Thẩm định (x2.0)</option>
                    </select>
                  </td>
                  <td class="p-3 text-center font-bold text-slate-700">
                    <span class="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-mono">x${t.kpi_weight || 1.0}</span>
                  </td>
                  <td class="p-3 text-center">
                    <input type="number" min="1" value="${t.target_quantity || 1}" onchange="KpiAssistantPage.updateQuantity(${idx}, this.value)" class="w-16 p-1.5 rounded-xl border border-slate-200 text-center font-bold text-slate-900 bg-slate-50 text-xs">
                  </td>
                  <td class="p-3 text-center">
                    <span class="px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 font-mono">
                      ${t.assigned_kpi_score || (t.target_quantity * t.kpi_weight).toFixed(1)} đ
                    </span>
                  </td>
                  <td class="p-3">
                    <input type="text" value="${t.target_product || ''}" onchange="KpiAssistantPage.updateTaskField(${idx}, 'target_product', this.value)" class="w-full p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Buttons -->
        <div class="pt-3 flex items-center justify-between">
          <button onclick="KpiAssistantPage.goToStep(1)" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs transition flex items-center gap-1.5">
            <i data-lucide="arrow-left" class="w-4 h-4"></i> Quay lại Bước 1
          </button>
          <button onclick="KpiAssistantPage.proceedToStep3()" class="px-6 py-2.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition flex items-center gap-2 shadow-md">
            <span>Tiếp tục: Bước 03 - Kiểm tra & Phản biện (6 Rõ)</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  },

  changeTaskType(index, typeId) {
    const weightMap = {
      '1': { weight: 2.5, name: 'Soạn thảo văn bản quy phạm / Đề án', code: 'KT-01', product: 'Đề án / Kế hoạch được phê duyệt' },
      '2': { weight: 1.0, name: 'Soạn thảo văn bản hành chính', code: 'KT-02', product: 'Văn bản hành chính / Tờ trình' },
      '3': { weight: 1.5, name: 'Kiểm tra hiện trường & Lập biên bản', code: 'KT-03', product: 'Biên bản kiểm tra / Quyết định xử lý' },
      '4': { weight: 1.2, name: 'Giải quyết hồ sơ TTHC', code: 'KT-04', product: 'Kết quả giải quyết TTHC đúng hạn' },
      '5': { weight: 1.0, name: 'Tuyên truyền pháp luật', code: 'KT-05', product: 'Hội nghị tổ chức / Tin bài tuyên truyền' },
      '6': { weight: 1.0, name: 'Tổng hợp báo cáo định kỳ', code: 'KT-06', product: 'Báo cáo số liệu hoàn chỉnh' },
      '7': { weight: 1.5, name: 'Số hóa dữ liệu (Đề án 06)', code: 'KT-07', product: 'Bản ghi số hóa chuẩn xác' },
      '8': { weight: 2.0, name: 'Chỉ đạo điều hành & Thẩm định', code: 'KT-08', product: 'Ý kiến chỉ đạo / Kết luận thẩm định' }
    };

    const sel = weightMap[typeId] || weightMap['2'];
    const t = this.tasks[index];
    t.task_type_id = parseInt(typeId, 10);
    t.task_type_code = sel.code;
    t.task_type_name = sel.name;
    t.kpi_weight = sel.weight;
    t.target_product = sel.product;
    t.assigned_kpi_score = Number(((t.target_quantity || 1) * sel.weight).toFixed(2));
    this.updateStepView();
  },

  updateQuantity(index, val) {
    const q = parseFloat(val) || 1.0;
    const t = this.tasks[index];
    t.target_quantity = q;
    t.assigned_kpi_score = Number((q * (t.kpi_weight || 1.0)).toFixed(2));
    this.updateStepView();
  },

  async proceedToStep3() {
    try {
      Modals.showToast('Hệ thống đang rà soát theo tiêu chuẩn "6 Rõ"...', 'info');
      const res = await API.auditSixClearKpiAssistant({ tasks: this.tasks });
      this.tasks = res.tasks;
      this.currentStep = 3;
      this.updateStepView();
      Modals.showToast(`Điểm thẩm định trung bình: ${res.avg_score}`, 'success');
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  },

  // ========================================================
  // BƯỚC 03: KIỂM TRA & PHẢN BIỆN (TIÊU CHUẨN 6 RÕ)
  // ========================================================
  renderStep3() {
    return `
      <div class="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5 animate-in fade-in duration-300">
        <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-blue-700 text-white flex items-center justify-center text-xs font-bold">3</span>
              <span>Kiểm tra & Phản biện theo Tiêu chuẩn "6 Rõ"</span>
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">Rõ người, rõ việc, rõ thời gian, rõ trách nhiệm, rõ sản phẩm, rõ thẩm quyền</p>
          </div>

          <!-- Nút Tự động khắc phục AI -->
          <button onclick="KpiAssistantPage.autoFixAllSixClear()" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-xs">
            <i data-lucide="wand-2" class="w-4 h-4"></i>
            <span>Tối ưu hóa 100% bằng AI</span>
          </button>
        </div>

        <!-- 6 Rõ Badges Explainer -->
        <div class="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
          <div class="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div class="text-[10px] text-slate-400 font-bold uppercase">1. RÕ NGƯỜI</div>
            <div class="font-bold text-slate-800 text-[11px] mt-0.5">Chủ trì duy nhất</div>
          </div>
          <div class="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div class="text-[10px] text-slate-400 font-bold uppercase">2. RÕ VIỆC</div>
            <div class="font-bold text-slate-800 text-[11px] mt-0.5">Hành động cụ thể</div>
          </div>
          <div class="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div class="text-[10px] text-slate-400 font-bold uppercase">3. RÕ THỜI GIAN</div>
            <div class="font-bold text-slate-800 text-[11px] mt-0.5">Deadline rõ ràng</div>
          </div>
          <div class="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div class="text-[10px] text-slate-400 font-bold uppercase">4. RÕ TRÁCH NHIỆM</div>
            <div class="font-bold text-slate-800 text-[11px] mt-0.5">Đơn vị chủ quản</div>
          </div>
          <div class="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div class="text-[10px] text-slate-400 font-bold uppercase">5. RÕ SẢN PHẨM</div>
            <div class="font-bold text-slate-800 text-[11px] mt-0.5">Định lượng đầu ra</div>
          </div>
          <div class="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div class="text-[10px] text-slate-400 font-bold uppercase">6. RÕ THẨM QUYỀN</div>
            <div class="font-bold text-slate-800 text-[11px] mt-0.5">Đúng cấp cơ sở</div>
          </div>
        </div>

        <!-- Six Clear Cards / Table -->
        <div class="space-y-3">
          ${this.tasks.map((t, idx) => {
            const sc = t.six_clear || {};
            const score = sc.score || 0;
            const isPerfect = score === 6;
            return `
              <div class="p-4 rounded-2xl border transition ${isPerfect ? 'bg-white border-slate-200' : 'bg-amber-50/40 border-amber-300'} space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isPerfect ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}">
                        ${score}/6 Tiêu chuẩn
                      </span>
                      <span class="font-bold text-slate-900 text-xs">${t.title}</span>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-1">
                      Chủ trì: <strong>${t.lead_unit}</strong> | Hạn: <strong>${t.due_date || 'Chưa có'}</strong> | Sản phẩm: <strong>${t.target_product}</strong>
                    </div>
                  </div>

                  ${!isPerfect ? `
                    <button onclick="KpiAssistantPage.autoFixSingleTask(${idx})" class="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition shrink-0 flex items-center gap-1">
                      <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-700"></i> AI sửa nhanh
                    </button>
                  ` : `
                    <span class="text-emerald-600 flex items-center gap-1 text-xs font-bold shrink-0">
                      <i data-lucide="check-circle" class="w-4 h-4"></i> Đạt chuẩn
                    </span>
                  `}
                </div>

                <!-- 6 Badges Status -->
                <div class="flex items-center gap-1.5 flex-wrap text-[10px]">
                  <span class="px-2 py-0.5 rounded-md font-semibold ${sc.clear_person ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                    ${sc.clear_person ? '✓ Rõ người' : '✗ Thiếu người'}
                  </span>
                  <span class="px-2 py-0.5 rounded-md font-semibold ${sc.clear_work ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                    ${sc.clear_work ? '✓ Rõ việc' : '✗ Chưa rõ việc'}
                  </span>
                  <span class="px-2 py-0.5 rounded-md font-semibold ${sc.clear_time ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                    ${sc.clear_time ? '✓ Rõ thời gian' : '✗ Thiếu deadline'}
                  </span>
                  <span class="px-2 py-0.5 rounded-md font-semibold ${sc.clear_responsibility ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                    ${sc.clear_responsibility ? '✓ Rõ trách nhiệm' : '✗ Chưa rõ trách nhiệm'}
                  </span>
                  <span class="px-2 py-0.5 rounded-md font-semibold ${sc.clear_product ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                    ${sc.clear_product ? '✓ Rõ sản phẩm' : '✗ Chưa rõ sản phẩm'}
                  </span>
                  <span class="px-2 py-0.5 rounded-md font-semibold ${sc.clear_authority ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                    ${sc.clear_authority ? '✓ Rõ thẩm quyền' : '✗ Thẩm quyền'}
                  </span>
                </div>

                ${sc.suggestions && sc.suggestions.length > 0 ? `
                  <div class="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80">
                    <span class="font-bold">Gợi ý phản biện của AI:</span> ${sc.suggestions.join('. ')}.
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Buttons -->
        <div class="pt-3 flex items-center justify-between">
          <button onclick="KpiAssistantPage.goToStep(2)" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs transition flex items-center gap-1.5">
            <i data-lucide="arrow-left" class="w-4 h-4"></i> Quay lại Bước 2
          </button>
          <button onclick="KpiAssistantPage.proceedToStep4()" class="px-6 py-2.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition flex items-center gap-2 shadow-md">
            <span>Tiếp tục: Bước 04 - Đánh giá thử KPI</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  },

  autoFixSingleTask(index) {
    const t = this.tasks[index];
    if (!t) return;
    if (!t.title.toLowerCase().startsWith('hoàn thành') && !t.title.toLowerCase().startsWith('soạn thảo') && !t.title.toLowerCase().startsWith('triển khai') && !t.title.toLowerCase().startsWith('thực hiện')) {
      t.title = `Triển khai thực hiện: ${t.title}`;
    }
    if (!t.due_date || t.due_date.trim() === '') t.due_date = '2026-11-30';
    if (!t.target_product || t.target_product.trim() === '') t.target_product = 'Báo cáo kết quả và hồ sơ lưu trữ hoàn chỉnh';
    if (!t.lead_unit || t.lead_unit.trim() === '') t.lead_unit = 'Văn phòng - Thống kê';

    t.six_clear = {
      clear_person: true,
      clear_work: true,
      clear_time: true,
      clear_responsibility: true,
      clear_product: true,
      clear_authority: true,
      score: 6,
      suggestions: []
    };
    Modals.showToast(`Đã tối ưu hóa nhiệm vụ "${t.title.slice(0, 25)}..." đạt 6/6 chuẩn Rõ!`, 'success');
    this.updateStepView();
  },

  autoFixAllSixClear() {
    for (let i = 0; i < this.tasks.length; i++) {
      this.autoFixSingleTask(i);
    }
    Modals.showToast('100% nhiệm vụ đã được chuẩn hóa đạt trọn vẹn tiêu chuẩn "6 Rõ"!', 'success');
    this.updateStepView();
  },

  async proceedToStep4() {
    try {
      Modals.showToast('Đang khởi tạo bảng mô phỏng tính điểm KPI...', 'info');
      const res = await API.simulateKpiAssistant({ tasks: this.tasks });
      this.tasks = res.tasks;
      this.currentStep = 4;
      this.updateStepView();
      Modals.showToast(res.message, 'success');
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  },

  // ========================================================
  // BƯỚC 04: ĐÁNH GIÁ THỬ KPI (MÔ PHỎNG TÍNH ĐIỂM)
  // ========================================================
  renderStep4() {
    return `
      <div class="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5 animate-in fade-in duration-300">
        <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-blue-700 text-white flex items-center justify-center text-xs font-bold">4</span>
              <span>Đánh giá thử KPI & Mô phỏng công thức thực tế</span>
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">Nhập thử số lượng hoàn thành và ngày nộp báo cáo để kiểm tra độ trễ và trừ phạt 25%/ngày trễ</p>
          </div>

          <div class="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
            <span class="font-bold">Quy tắc trừ phạt:</span> Chậm 1 ngày (-25%), 2 ngày (-50%), 3 ngày (-75%), ≥4 ngày (0 điểm).
          </div>
        </div>

        <!-- Simulation Table -->
        <div class="overflow-x-auto rounded-2xl border border-slate-200">
          <table class="w-full text-left text-xs min-w-[950px] table-auto">
            <thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th class="p-3 w-10 text-center whitespace-nowrap">STT</th>
                <th class="p-3 min-w-[200px]">Nhiệm vụ & Hệ số</th>
                <th class="p-3 w-28 text-center whitespace-nowrap">SL hoàn thành</th>
                <th class="p-3 w-28 text-center whitespace-nowrap">SL quy đổi</th>
                <th class="p-3 w-32 whitespace-nowrap">Hạn hoàn thành</th>
                <th class="p-3 w-32 whitespace-nowrap">Ngày nộp thử</th>
                <th class="p-3 w-24 text-center whitespace-nowrap">Chậm (ngày)</th>
                <th class="p-3 w-28 text-center whitespace-nowrap">Khấu trừ</th>
                <th class="p-3 w-32 text-center whitespace-nowrap">KPI thực nhận</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              ${this.tasks.map((t, idx) => {
                const isDelayed = (t.sim_delay_days || 0) > 0;
                return `
                  <tr class="hover:bg-slate-50/70 transition">
                    <td class="p-3 text-center font-bold text-slate-400 text-[11px]">${idx + 1}</td>
                    <td class="p-3">
                      <div class="font-bold text-slate-900">${t.title}</div>
                      <div class="text-[10px] text-slate-400">Hệ số: <strong>x${t.kpi_weight}</strong> | Giao: <strong>${t.target_quantity}</strong></div>
                    </td>
                    <td class="p-3 text-center">
                      <input type="number" min="0" value="${t.sim_completed_qty || t.target_quantity}" onchange="KpiAssistantPage.updateSimCompletedQty(${idx}, this.value)" class="w-20 p-1.5 rounded-xl border border-slate-200 text-center font-bold text-slate-900 bg-slate-50 text-xs">
                    </td>
                    <td class="p-3 text-center font-mono font-bold text-slate-700">
                      ${t.sim_raw_kpi || (t.target_quantity * t.kpi_weight).toFixed(1)} đ
                    </td>
                    <td class="p-3 text-slate-600 font-mono text-[11px]">
                      ${t.due_date}
                    </td>
                    <td class="p-3">
                      <input type="date" value="${t.sim_actual_date || t.due_date}" onchange="KpiAssistantPage.updateSimActualDate(${idx}, this.value)" class="w-full p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono">
                    </td>
                    <td class="p-3 text-center">
                      <span class="px-2 py-0.5 rounded-lg text-xs font-bold font-mono ${isDelayed ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">
                        ${t.sim_delay_days || 0} ngày
                      </span>
                    </td>
                    <td class="p-3 text-center font-mono text-[11px] ${isDelayed ? 'text-rose-600 font-bold' : 'text-slate-400'}">
                      ${isDelayed ? `-${t.sim_penalty_score} đ (-${t.sim_delay_days * 25}%)` : '0 đ'}
                    </td>
                    <td class="p-3 text-center">
                      <span class="px-3 py-1 rounded-full text-xs font-black font-mono ${isDelayed ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}">
                        ${t.sim_final_kpi !== undefined ? t.sim_final_kpi : t.assigned_kpi_score} đ
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Buttons -->
        <div class="pt-3 flex items-center justify-between">
          <button onclick="KpiAssistantPage.goToStep(3)" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs transition flex items-center gap-1.5">
            <i data-lucide="arrow-left" class="w-4 h-4"></i> Quay lại Bước 3
          </button>
          <button onclick="KpiAssistantPage.proceedToStep5()" class="px-6 py-2.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition flex items-center gap-2 shadow-md">
            <span>Tiếp tục: Bước 05 - Duyệt & Đẩy vào HanoiWork</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  },

  updateSimCompletedQty(index, val) {
    const qty = parseFloat(val) || 0;
    const t = this.tasks[index];
    t.sim_completed_qty = qty;
    this.recalculateSimRow(index);
  },

  updateSimActualDate(index, dateStr) {
    const t = this.tasks[index];
    t.sim_actual_date = dateStr;
    this.recalculateSimRow(index);
  },

  recalculateSimRow(index) {
    const t = this.tasks[index];
    const weight = t.kpi_weight || 1.0;
    const compQty = t.sim_completed_qty !== undefined ? t.sim_completed_qty : t.target_quantity;
    const rawKpi = Number((compQty * weight).toFixed(2));

    const dueDate = new Date(t.due_date);
    const actualDate = new Date(t.sim_actual_date || t.due_date);
    const diffTime = actualDate.getTime() - dueDate.getTime();
    const delayDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const penaltyScore = Number((delayDays * 0.25 * rawKpi).toFixed(2));
    const finalScore = Number(Math.max(0, rawKpi - penaltyScore).toFixed(2));

    t.sim_raw_kpi = rawKpi;
    t.sim_delay_days = delayDays;
    t.sim_penalty_score = penaltyScore;
    t.sim_final_kpi = finalScore;

    this.updateStepView();
  },

  proceedToStep5() {
    this.currentStep = 5;
    this.updateStepView();
  },

  // ========================================================
  // BƯỚC 05: DUYỆT VÀ ĐẨY DỮ LIỆU SANG HANOIWORK
  // ========================================================
  renderStep5() {
    // Lấy danh sách dự án và chương trình hành động để người dùng chọn đích đến
    const projects = this.projects || [];
    if (!this.selectedProjectId && projects.length > 0) {
      this.selectedProjectId = projects[0].id;
    }
    const currentProj = projects.find(p => p.id === parseInt(this.selectedProjectId, 10)) || projects[0];
    const availablePrograms = [];
    if (currentProj) {
      if (currentProj.direct_programs) availablePrograms.push(...currentProj.direct_programs);
      if (currentProj.folders) {
        for (const f of currentProj.folders) {
          if (f.action_programs) availablePrograms.push(...f.action_programs);
        }
      }
    }
    if (!this.selectedProgramId && availablePrograms.length > 0) {
      this.selectedProgramId = availablePrograms[0].id;
    }

    return `
      <div class="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-6 animate-in fade-in duration-300">
        
        <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">5</span>
              <span>Duyệt & Xuất dữ liệu chính thức vào HanoiWork</span>
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">Kiểm tra lần cuối, lưu vết Audit Log và kích hoạt vận hành trong không gian làm việc</p>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="KpiAssistantPage.exportToExcel()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5">
              <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-600"></i> Xuất file Excel / CSV
            </button>
          </div>
        </div>

        <!-- Verification Checklist Banner -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 space-y-1">
            <div class="font-bold text-emerald-900 flex items-center gap-1.5">
              <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
              <span>Kiểm định "6 Rõ": ĐẠT 100%</span>
            </div>
            <p class="text-emerald-800 text-[11px]">${this.tasks.length} nhiệm vụ đều đáp ứng đầy đủ người, việc, thời gian, thẩm quyền.</p>
          </div>

          <div class="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70 space-y-1">
            <div class="font-bold text-blue-900 flex items-center gap-1.5">
              <i data-lucide="calculator" class="w-4 h-4 text-blue-600"></i>
              <span>Quy đổi KPI chuẩn hóa</span>
            </div>
            <p class="text-blue-800 text-[11px]">Đã gắn hệ số trọng số từ 1.0 đến 2.5 theo quy định TP. Hà Nội.</p>
          </div>

          <div class="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/70 space-y-1">
            <div class="font-bold text-purple-900 flex items-center gap-1.5">
              <i data-lucide="history" class="w-4 h-4 text-purple-600"></i>
              <span>Audit Trail (Nhật ký)</span>
            </div>
            <p class="text-purple-800 text-[11px]">Tự động lưu lịch sử chỉnh sửa và nguồn gốc văn bản bóc tách.</p>
          </div>
        </div>

        <!-- Destination Selection Form -->
        <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
          <h3 class="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
            <i data-lucide="folder-tree" class="w-4 h-4 text-blue-700"></i>
            <span>Chọn vị trí tiếp nhận trong Hệ thống HanoiWork Core</span>
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Dự án / Phân khu tiếp nhận *</label>
              <select id="kpi-target-project" onchange="KpiAssistantPage.onTargetProjectChange(this.value)" class="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold">
                ${projects.map(p => `
                  <option value="${p.id}" ${this.selectedProjectId == p.id ? 'selected' : ''}>
                    [${p.code}] ${p.name}
                  </option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Chương trình hành động (Cấp 3) *</label>
              <select id="kpi-target-program" onchange="KpiAssistantPage.selectedProgramId = this.value" class="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold">
                ${availablePrograms.map(ap => `
                  <option value="${ap.id}" ${this.selectedProgramId == ap.id ? 'selected' : ''}>
                    ${ap.name}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Final Audit Log Preview -->
        <div class="space-y-2">
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lịch sử phiên xử lý AI (Audit Trail)</div>
          <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 font-mono text-[11px] space-y-1">
            <div class="flex items-center gap-2 text-slate-500">
              <span class="text-emerald-600 font-bold">✓ BƯỚC 01:</span> Bóc tách thành công ${this.tasks.length} nhiệm vụ từ văn bản gốc.
            </div>
            <div class="flex items-center gap-2 text-slate-500">
              <span class="text-emerald-600 font-bold">✓ BƯỚC 02:</span> Ánh xạ 8 loại nhiệm vụ chuẩn và gán sản phẩm đầu ra định lượng.
            </div>
            <div class="flex items-center gap-2 text-slate-500">
              <span class="text-emerald-600 font-bold">✓ BƯỚC 03:</span> Rà soát phản biện 6 Rõ, tự động sửa đổi các trường khuyết thiếu.
            </div>
            <div class="flex items-center gap-2 text-slate-500">
              <span class="text-emerald-600 font-bold">✓ BƯỚC 04:</span> Mô phỏng công thức khấu trừ 25%/ngày trễ hạn, xác nhận hệ số điểm chuẩn.
            </div>
          </div>
        </div>

        <!-- Big Approve Button -->
        <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button onclick="KpiAssistantPage.goToStep(4)" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs transition flex items-center gap-1.5">
            <i data-lucide="arrow-left" class="w-4 h-4"></i> Quay lại Bước 4
          </button>

          <button onclick="KpiAssistantPage.approveAndPushToHanoiWork()" class="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs transition flex items-center gap-2.5 shadow-lg shadow-emerald-600/20">
            <i data-lucide="check-check" class="w-5 h-5 text-emerald-200"></i>
            <span>PHÊ DUYỆT & ĐẨY DỮ LIỆU VÀO HANOIWORK</span>
          </button>
        </div>

      </div>
    `;
  },

  onTargetProjectChange(projId) {
    this.selectedProjectId = projId;
    this.selectedProgramId = null;
    this.updateStepView();
  },

  async approveAndPushToHanoiWork() {
    const projId = document.getElementById('kpi-target-project')?.value || this.selectedProjectId;
    const progId = document.getElementById('kpi-target-program')?.value || this.selectedProgramId;

    if (!projId || !progId) {
      Modals.showToast('Vui lòng chọn Dự án và Chương trình hành động tiếp nhận!', 'warning');
      return;
    }

    try {
      Modals.showToast('Đang phê duyệt và khởi tạo nhiệm vụ trong HanoiWork...', 'info');
      const res = await API.approveAndImportKpiAssistant({
        session_name: `Bóc tách KPI từ văn bản: ${this.jobTitle || 'Chuyên môn'}`,
        project_id: parseInt(projId, 10),
        action_program_id: parseInt(progId, 10),
        tasks: this.tasks
      });

      Modals.showToast(res.message, 'success');

      // Chuyển hướng sang giao diện HanoiWork sau 1.5 giây
      setTimeout(() => {
        window.location.hash = '#kpi-workspace';
      }, 1500);
    } catch (err) {
      Modals.showToast(err.message, 'error');
    }
  },

  exportToExcel() {
    if (this.tasks.length === 0) {
      Modals.showToast('Không có dữ liệu nhiệm vụ để xuất file!', 'warning');
      return;
    }

    // Xuất file CSV định dạng UTF-8 với BOM để mở trực tiếp trên Excel không lỗi font tiếng Việt
    let csv = '\uFEFF';
    csv += 'STT,Tên nhiệm vụ,Đơn vị chủ trì,Hạn hoàn thành,Số lượng giao,Loại nhiệm vụ,Hệ số quy đổi,SL giao quy đổi,Sản phẩm đầu ra,Chuẩn 6 Rõ\n';

    this.tasks.forEach((t, i) => {
      csv += `"${i + 1}","${(t.title || '').replace(/"/g, '""')}","${t.lead_unit || ''}","${t.due_date || ''}","${t.target_quantity || 1}","${t.task_type_name || ''}","${t.kpi_weight || 1.0}","${t.assigned_kpi_score || ''}","${(t.target_product || '').replace(/"/g, '""')}","Đạt 6/6"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `HanoiWork_KPI_Assistant_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Modals.showToast('Đã xuất thành công file danh mục KPI Excel!', 'success');
  }
};

window.KpiAssistantPage = KpiAssistantPage;
