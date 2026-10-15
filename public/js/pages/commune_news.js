// Commune News & Public Announcements Page (#news)
const CommuneNewsPage = {
  currentCategory: 'all',
  searchQuery: '',
  newsList: [],
  categories: [],
  selectedArticle: null,

  async render() {
    const user = API.getUser();
    const canPublish = user && (user.role === 'admin' || user.role === 'leader' || user.role === 'officer');

    return `
      <div class="space-y-6">
        
        <!-- Header Hero Banner -->
        <div class="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-blue-800/40">
          <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -left-10 -top-10 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="space-y-2 max-w-2xl">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <i data-lucide="newspaper" class="w-3.5 h-3.5"></i>
                  <span>Bản tin chính thống</span>
                </span>
                <span class="text-xs text-blue-200">UBND Xã Tân Triều • Huyện Thanh Trì • TP. Hà Nội</span>
              </div>
              <h1 class="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                BẢN TIN & THÔNG BÁO CHÍNH THỨC CẤP XÃ
              </h1>
              <p class="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
                Cập nhật nhanh chóng, chính xác các chủ trương chính sách của Đảng, pháp luật của Nhà nước, thông báo khẩn, an ninh trật tự và hoạt động cộng đồng của UBND Xã Tân Triều.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2.5 shrink-0">
              <a href="#citizen-portal" class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition backdrop-blur-md border border-white/20 flex items-center gap-2">
                <i data-lucide="message-square-plus" class="w-4 h-4 text-amber-300"></i>
                <span>Gửi phản ánh nhân dân</span>
              </a>
              ${canPublish ? `
                <button type="button" onclick="CommuneNewsPage.openCreateModal()" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition shadow-md flex items-center gap-2">
                  <i data-lucide="plus-circle" class="w-4 h-4"></i>
                  <span>Đăng bản tin mới</span>
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Filter Controls & Category Tabs -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            <!-- Category Pills -->
            <div id="news-category-tabs" class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
              <span class="text-slate-400 text-xs animate-pulse">Đang nạp danh mục...</span>
            </div>

            <!-- Search Input -->
            <div class="relative w-full sm:w-72 shrink-0">
              <input type="text" id="news-search-input" placeholder="Tìm kiếm bản tin, thông báo..." oninput="CommuneNewsPage.handleSearch(this.value)" class="w-full p-2 pl-8 pr-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
              <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"></i>
            </div>
          </div>
        </div>

        <!-- Featured News Banner (Tiêu điểm) -->
        <div id="news-featured-container" class="hidden"></div>

        <!-- Main News Grid -->
        <div id="news-grid-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div class="col-span-full py-12 text-center text-slate-400">
            <span class="inline-block animate-spin mr-2">⌛</span> Đang tải các bản tin mới nhất...
          </div>
        </div>

      </div>

      <!-- Modal: Đọc chi tiết bản tin -->
      <div id="news-read-modal" class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 hidden animate-in fade-in duration-200">
        <div class="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
          <!-- Header -->
          <div class="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
            <div>
              <span id="read-modal-cat" class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                Thông báo
              </span>
              <h2 id="read-modal-title" class="text-base sm:text-lg font-bold text-slate-900 mt-2 leading-snug">
                Tiêu đề bài viết
              </h2>
              <div class="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                <span id="read-modal-author" class="flex items-center gap-1 text-slate-600 font-semibold">
                  <i data-lucide="user-check" class="w-3.5 h-3.5 text-blue-600"></i>
                  <span>UBND Xã Tân Triều</span>
                </span>
                <span>•</span>
                <span id="read-modal-date">Ngày đăng</span>
                <span>•</span>
                <span id="read-modal-views" class="flex items-center gap-1">
                  <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                  <span>0 lượt xem</span>
                </span>
              </div>
            </div>
            <button type="button" onclick="CommuneNewsPage.closeReadModal()" class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            <div id="read-modal-cover-wrapper" class="rounded-2xl overflow-hidden shadow-inner max-h-[280px]">
              <img id="read-modal-cover" src="" alt="Ảnh bìa" class="w-full h-full object-cover">
            </div>
            <div id="read-modal-summary" class="p-3.5 rounded-xl bg-blue-50/80 border-l-4 border-blue-600 text-blue-950 font-medium italic text-xs leading-relaxed"></div>
            <div id="read-modal-content" class="whitespace-pre-line space-y-3 font-normal"></div>
          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <button type="button" onclick="window.print()" class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-white text-slate-600 transition flex items-center gap-1">
                <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                <span>In bản tin</span>
              </button>
            </div>
            <button type="button" onclick="CommuneNewsPage.closeReadModal()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition">
              Đóng lại
            </button>
          </div>
        </div>
      </div>

      <!-- Modal: Đăng bản tin mới (Dành cho cán bộ/Lãnh đạo) -->
      <div id="news-create-modal" class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 hidden animate-in fade-in duration-200">
        <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 text-xs">
          <!-- Header -->
          <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <i data-lucide="file-plus" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Đăng bản tin / Thông báo xã</h3>
                <p class="text-[11px] text-slate-500">Phát hành bài viết lên Cổng thông tin phục vụ nhân dân</p>
              </div>
            </div>
            <button type="button" onclick="CommuneNewsPage.closeCreateModal()" class="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Form -->
          <form id="create-news-form" onsubmit="CommuneNewsPage.handleSubmitNews(event)" class="p-5 overflow-y-auto space-y-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Tiêu đề bài viết / Thông báo *</label>
              <input type="text" id="new-news-title" required placeholder="Nhập tiêu đề ngắn gọn, rõ ràng..." class="w-full p-2.5 rounded-xl border border-slate-200 font-semibold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Chuyên mục đăng tải *</label>
                <select id="new-news-cat" class="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium text-xs">
                  <option value="thong_bao">Thông báo UBND</option>
                  <option value="chinh_sach">Chính sách mới & Pháp luật</option>
                  <option value="an_ninh">An ninh trật tự & Cảnh báo</option>
                  <option value="chuyen_doi_so">Đề án 06 & Chuyển đổi số</option>
                  <option value="hoat_dong">Hoạt động cộng đồng & Môi trường</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Ảnh bìa minh họa (URL)</label>
                <input type="url" id="new-news-cover" placeholder="https://..." value="https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80" class="w-full p-2 rounded-xl border border-slate-200 text-xs">
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Tóm tắt ngắn (Lead / Sa-pô)</label>
              <textarea id="new-news-summary" rows="2" placeholder="Tóm tắt 1-2 câu nêu bật nội dung chính..." class="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"></textarea>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Nội dung chi tiết toàn văn *</label>
              <textarea id="new-news-content" required rows="6" placeholder="Nhập đầy đủ nội dung thông báo, văn bản, hướng dẫn chi tiết..." class="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"></textarea>
            </div>

            <div class="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200/80">
              <input type="checkbox" id="new-news-featured" class="w-4 h-4 rounded text-amber-600 border-amber-300">
              <label for="new-news-featured" class="font-bold text-amber-950 cursor-pointer select-none">
                Đặt làm tin nổi bật / Tiêu điểm trang chủ
              </label>
            </div>

            <div class="pt-2 flex items-center justify-end gap-2">
              <button type="button" onclick="CommuneNewsPage.closeCreateModal()" class="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold transition">
                Hủy bỏ
              </button>
              <button type="submit" id="btn-submit-news" class="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold transition shadow-sm flex items-center gap-1.5">
                <i data-lucide="send" class="w-4 h-4"></i>
                <span>Xuất bản ngay</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  async afterRender() {
    await this.fetchNews();
  },

  async fetchNews() {
    try {
      const params = {};
      if (this.currentCategory && this.currentCategory !== 'all') {
        params.category = this.currentCategory;
      }
      if (this.searchQuery) {
        params.search = this.searchQuery;
      }

      const res = await API.getNews(params);
      this.newsList = res.news || [];
      this.categories = res.categories || [];

      this.renderCategoryTabs();
      this.renderFeaturedNews();
      this.renderNewsGrid();
      lucide.createIcons();
    } catch (err) {
      console.error('Lỗi tải bản tin:', err);
      const grid = document.getElementById('news-grid-container');
      if (grid) {
        grid.innerHTML = `
          <div class="col-span-full p-8 text-center bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 text-xs">
            <p class="font-bold">Không thể tải dữ liệu bản tin xã: ${err.message}</p>
          </div>
        `;
      }
    }
  },

  renderCategoryTabs() {
    const tabsContainer = document.getElementById('news-category-tabs');
    if (!tabsContainer || !this.categories.length) return;

    tabsContainer.innerHTML = this.categories.map(c => {
      const active = this.currentCategory === c.key;
      const activeClass = active 
        ? 'bg-blue-800 text-white font-bold shadow-xs' 
        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium';

      return `
        <button type="button" onclick="CommuneNewsPage.selectCategory('${c.key}')" class="px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${activeClass}">
          <span>${c.label}</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}">${c.count}</span>
        </button>
      `;
    }).join('');
  },

  selectCategory(catKey) {
    this.currentCategory = catKey;
    this.fetchNews();
  },

  handleSearch(val) {
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.searchQuery = val.trim();
      this.fetchNews();
    }, 300);
  },

  renderFeaturedNews() {
    const container = document.getElementById('news-featured-container');
    if (!container) return;

    const featured = this.newsList.find(n => n.is_featured === 1);
    if (!featured || this.searchQuery || this.currentCategory !== 'all') {
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    container.innerHTML = `
      <div class="bg-gradient-to-br from-amber-500/10 via-white to-blue-500/5 rounded-3xl p-5 sm:p-6 border border-amber-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        <div class="md:col-span-5 rounded-2xl overflow-hidden aspect-video max-h-[220px] shadow-sm relative group">
          <img src="${featured.cover_image || 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800'}" alt="${featured.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
          <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-md flex items-center gap-1">
            <span>★</span> TIÊU ĐIỂM XÃ
          </span>
        </div>

        <div class="md:col-span-7 space-y-2.5 text-xs">
          <div class="flex items-center gap-2 text-[11px] text-slate-500">
            <span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold uppercase text-[9px]">
              ${this.getCategoryLabel(featured.category)}
            </span>
            <span>•</span>
            <span>${this.formatDate(featured.created_at)}</span>
            <span>•</span>
            <span class="flex items-center gap-1 text-slate-600">
              <i data-lucide="eye" class="w-3 h-3 text-slate-400"></i>
              <span>${featured.views_count} lượt xem</span>
            </span>
          </div>

          <h2 class="text-base sm:text-lg font-black text-slate-900 hover:text-blue-700 transition cursor-pointer leading-snug" onclick="CommuneNewsPage.openReadModal(${featured.id})">
            ${featured.title}
          </h2>

          <p class="text-slate-600 line-clamp-3 leading-relaxed">
            ${featured.summary}
          </p>

          <div class="pt-2 flex items-center justify-between">
            <div class="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-blue-600"></i>
              <span>${featured.author_name}</span>
            </div>

            <button type="button" onclick="CommuneNewsPage.openReadModal(${featured.id})" class="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold transition flex items-center gap-1.5 shadow-2xs">
              <span>Đọc toàn văn</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderNewsGrid() {
    const grid = document.getElementById('news-grid-container');
    if (!grid) return;

    if (!this.newsList.length) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            📰
          </div>
          <h4 class="font-bold text-slate-700 text-sm">Chưa có bài viết nào trong mục này</h4>
          <p class="text-xs text-slate-400 max-w-sm mx-auto">
            Các bản tin chính sách và thông báo mới từ UBND Xã Tân Triều sẽ được cập nhật liên tục tại đây.
          </p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.newsList.map(n => `
      <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group">
        <div>
          <!-- Thumbnail -->
          <div class="aspect-video relative overflow-hidden bg-slate-100 cursor-pointer" onclick="CommuneNewsPage.openReadModal(${n.id})">
            <img src="${n.cover_image || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800'}" alt="${n.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-900/80 backdrop-blur-xs text-white">
              ${this.getCategoryLabel(n.category)}
            </span>
            ${n.is_featured ? `
              <span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
                ★ Tiêu điểm
              </span>
            ` : ''}
          </div>

          <!-- Body -->
          <div class="p-4 sm:p-5 space-y-2 text-xs">
            <div class="flex items-center justify-between text-[10px] text-slate-400">
              <span>${this.formatDate(n.created_at)}</span>
              <span class="flex items-center gap-1">
                <i data-lucide="eye" class="w-3 h-3"></i>
                <span>${n.views_count}</span>
              </span>
            </div>

            <h3 class="font-bold text-slate-900 group-hover:text-blue-700 transition cursor-pointer line-clamp-2 leading-snug" onclick="CommuneNewsPage.openReadModal(${n.id})">
              ${n.title}
            </h3>

            <p class="text-slate-500 line-clamp-2 leading-relaxed text-[11px]">
              ${n.summary}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 sm:p-5 pt-0 border-t border-slate-50 flex items-center justify-between text-[11px]">
          <span class="text-slate-400 truncate max-w-[150px]">${n.author_name}</span>
          <button type="button" onclick="CommuneNewsPage.openReadModal(${n.id})" class="text-blue-700 font-bold hover:underline flex items-center gap-1">
            <span>Chi tiết</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `).join('');
  },

  async openReadModal(id) {
    try {
      const res = await API.getNewsDetail(id);
      const article = res.article;
      if (!article) return;

      document.getElementById('read-modal-cat').innerText = this.getCategoryLabel(article.category);
      document.getElementById('read-modal-title').innerText = article.title;
      document.getElementById('read-modal-author').innerHTML = `<i data-lucide="user-check" class="w-3.5 h-3.5 text-blue-600"></i> <span>${article.author_name}</span>`;
      document.getElementById('read-modal-date').innerText = this.formatDate(article.created_at);
      document.getElementById('read-modal-views').innerHTML = `<i data-lucide="eye" class="w-3.5 h-3.5"></i> <span>${article.views_count} lượt xem</span>`;

      const coverEl = document.getElementById('read-modal-cover');
      if (coverEl) coverEl.src = article.cover_image || '';

      const summaryEl = document.getElementById('read-modal-summary');
      if (summaryEl) summaryEl.innerText = article.summary || '';

      const contentEl = document.getElementById('read-modal-content');
      if (contentEl) contentEl.innerText = article.content || '';

      document.getElementById('news-read-modal')?.classList.remove('hidden');
      lucide.createIcons();
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  },

  closeReadModal() {
    document.getElementById('news-read-modal')?.classList.add('hidden');
  },

  openCreateModal() {
    document.getElementById('news-create-modal')?.classList.remove('hidden');
    lucide.createIcons();
  },

  closeCreateModal() {
    document.getElementById('news-create-modal')?.classList.add('hidden');
  },

  async handleSubmitNews(e) {
    e.preventDefault();
    const title = document.getElementById('new-news-title')?.value.trim();
    const category = document.getElementById('new-news-cat')?.value;
    const cover_image = document.getElementById('new-news-cover')?.value.trim();
    const summary = document.getElementById('new-news-summary')?.value.trim();
    const content = document.getElementById('new-news-content')?.value.trim();
    const is_featured = document.getElementById('new-news-featured')?.checked;
    const btn = document.getElementById('btn-submit-news');

    if (!title || !content) {
      Modals.showToast('Vui lòng điền tiêu đề và nội dung bài viết', 'error');
      return;
    }

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> Đang đăng tải...`;
      }

      const res = await API.createNews({
        title,
        category,
        cover_image,
        summary,
        content,
        is_featured
      });

      Modals.showToast(res.message || 'Xuất bản bản tin thành công!', 'success');
      this.closeCreateModal();
      await this.fetchNews();
    } catch (err) {
      Modals.showToast(err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="send" class="w-4 h-4"></i> <span>Xuất bản ngay</span>`;
        lucide.createIcons({ root: btn });
      }
    }
  },

  getCategoryLabel(catKey) {
    const map = {
      'thong_bao': 'Thông báo UBND',
      'chinh_sach': 'Chính sách mới',
      'an_ninh': 'An ninh trật tự',
      'chuyen_doi_so': 'Đề án 06 & CĐS',
      'hoat_dong': 'Hoạt động xã'
    };
    return map[catKey] || 'Bản tin';
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }
};

window.CommuneNewsPage = CommuneNewsPage;
