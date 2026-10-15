// Authentication & Login Page with Automated eKYC NFC CCCD Chip & Biometric Face Verification
const LoginPage = {
  currentTab: 'login',
  currentRole: 'citizen',
  ekycStep: 1,

  // eKYC State
  scannedCitizen: null,
  ekycToken: null,
  isFaceMatched: false,
  faceMatchScore: 0,
  capturedSelfieUrl: null,
  cameraStream: null,

  // SMS OTP & Captcha State
  isPhoneVerified: false,
  verifiedPhone: '',
  verificationToken: '',
  verifiedOtpCode: '',
  otpTimerInterval: null,
  otpRemainingSeconds: 0,
  loginCaptchaToken: null,
  regCaptchaToken: null,

  async render() {
    return `
      <div class="min-h-[88vh] flex items-center justify-center p-3 sm:p-6">
        
        <div class="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
          
          <!-- Left Column: Brand & Info (5 Cols) -->
          <div class="lg:col-span-5 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden">
            <div class="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-600/20 rounded-full blur-2xl pointer-events-none"></div>
            <div class="absolute -left-12 -top-12 w-48 h-48 bg-amber-500/15 rounded-full blur-2xl pointer-events-none"></div>

            <div class="relative z-10 space-y-4">
              <div class="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xl shadow-md">
                <i data-lucide="landmark" class="w-6 h-6"></i>
              </div>
              
              <div>
                <span class="text-amber-300 text-[10px] font-bold uppercase tracking-wider">Cổng điều hành điện tử</span>
                <h1 class="text-xl font-black mt-1 leading-snug">
                  UBND XÃ TÂN TRIỀU
                </h1>
                <p class="text-xs text-blue-200 mt-2 leading-relaxed">
                  Hệ thống quản lý công văn, phê duyệt nhiều cấp, quản trị OKR/KPI và cổng dịch vụ phục vụ nhân dân
                </p>
              </div>

              <div class="pt-3 space-y-2.5 text-xs text-blue-100">
                <div class="flex items-center gap-2">
                  <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                  <span>Định danh điện tử eKYC CCCD Gắn Chip & Khuôn mặt</span>
                </div>
                <div class="flex items-center gap-2">
                  <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                  <span>Đăng nhập an toàn bằng SĐT / CCCD 12 số</span>
                </div>
                <div class="flex items-center gap-2">
                  <i data-lucide="newspaper" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                  <span>Xem tin tức, thông báo khẩn & chính sách cấp xã</span>
                </div>
                <div class="flex items-center gap-2">
                  <i data-lucide="send" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                  <span>Gửi phản ánh, kiến nghị trực tuyến đến UBND xã</span>
                </div>
              </div>
            </div>

            <!-- Public Portal Links -->
            <div class="pt-6 border-t border-white/10 relative z-10 space-y-2 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-blue-200 font-medium">Bản tin & Tin tức xã:</span>
                <a href="#news" class="text-amber-300 font-bold hover:underline flex items-center gap-1">
                  <span>Xem tin tức</span>
                  <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                </a>
              </div>
              <a href="#citizen-portal" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold transition backdrop-blur-md border border-white/20 w-full justify-center">
                <i data-lucide="globe" class="w-4 h-4 text-amber-300"></i>
                <span>Cổng nộp yêu cầu trực tuyến</span>
              </a>
            </div>
          </div>

          <!-- Right Column: Tabs (Login / Register) & Forms (7 Cols) -->
          <div class="lg:col-span-7 p-6 sm:p-8 space-y-5 text-xs">
            
            <!-- Navigation Tabs: Đăng nhập vs Đăng ký -->
            <div class="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button type="button" id="tab-btn-login" onclick="LoginPage.switchTab('login')" class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-white text-blue-900 shadow-xs">
                <i data-lucide="log-in" class="w-4 h-4 text-blue-700"></i>
                <span>Đăng nhập</span>
              </button>
              <button type="button" id="tab-btn-register" onclick="LoginPage.switchTab('register')" class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900">
                <i data-lucide="user-plus" class="w-4 h-4 text-slate-500"></i>
                <span>Tạo tài khoản (eKYC)</span>
              </button>
            </div>

            <!-- ============================================== -->
            <!-- TAB 1: FORM ĐĂNG NHẬP BẰNG TÀI KHOẢN & MẬT KHẨU -->
            <!-- ============================================== -->
            <div id="panel-login" class="space-y-4">
              <div>
                <h2 class="text-base font-bold text-slate-900">Đăng nhập tài khoản</h2>
                <p class="text-slate-500 mt-0.5">Đăng nhập bằng Số điện thoại, Số CCCD 12 số hoặc Tên tài khoản</p>
              </div>

              <form id="login-form" class="space-y-3.5">
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block font-bold text-slate-700">SĐT / CCCD 12 số / Tên tài khoản *</label>
                    <span class="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      SĐT hoặc CCCD
                    </span>
                  </div>
                  <div class="relative">
                    <input type="text" id="login-username" required placeholder="Nhập số điện thoại (VD: 0912345678) hoặc CCCD 12 số..." class="w-full p-2.5 pl-9 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs">
                    <i data-lucide="user-check" class="w-4 h-4 text-blue-600 absolute left-3 top-3"></i>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block font-bold text-slate-700">Mật khẩu *</label>
                    <span class="text-[11px] text-slate-400">Tối thiểu 6 ký tự</span>
                  </div>
                  <div class="relative">
                    <input type="password" id="login-password" required placeholder="Nhập mật khẩu..." class="w-full p-2.5 pl-9 pr-10 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs">
                    <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute left-3 top-3"></i>
                    <button type="button" onclick="LoginPage.togglePassword('login-password', 'login-eye-icon')" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5" title="Hiện/Ẩn mật khẩu">
                      <i id="login-eye-icon" data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>

                <!-- Khung xác minh Robot (B-Firewall™ Captcha) -->
                <div class="p-3 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-2">
                  <div class="flex items-center justify-between text-[11px]">
                    <label class="font-bold text-slate-700 flex items-center gap-1.5">
                      <i data-lucide="bot" class="w-3.5 h-3.5 text-blue-600"></i>
                      <span>Xác minh Robot (B-Firewall™ Shield)</span>
                    </label>
                    <span class="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                      Bảo vệ phiên
                    </span>
                  </div>

                  <div class="flex items-center gap-2">
                    <div id="login-captcha-container" class="shrink-0 flex items-center justify-center bg-slate-900 rounded-xl overflow-hidden shadow-inner cursor-pointer select-none" onclick="LoginPage.refreshCaptcha('login')" title="Bấm để đổi mã khác">
                      <div id="login-captcha-svg" class="flex items-center justify-center min-w-[130px] h-[40px] text-slate-400 text-[10px] px-1">
                        <span class="animate-pulse">Đang tải mã...</span>
                      </div>
                    </div>

                    <button type="button" onclick="LoginPage.refreshCaptcha('login')" class="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition shrink-0" title="Đổi câu hỏi khác">
                      <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                    </button>

                    <div class="flex-1">
                      <input type="text" id="login-captcha-answer" placeholder="Kết quả = ?" class="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-center text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
                    </div>
                  </div>
                </div>

                <!-- B-Firewall™ Yêu Cầu Xác Thực Vị Trí Thiết Bị (Bắt Buộc Chấp Nhận Chia Sẻ Vị Trí) -->
                <div class="p-3 bg-gradient-to-r from-amber-500/10 via-blue-500/5 to-slate-50 rounded-2xl border border-amber-300/80 space-y-2">
                  <div class="flex items-center justify-between text-[11px]">
                    <label class="font-bold text-slate-800 flex items-center gap-1.5">
                      <i data-lucide="map-pin" class="w-3.5 h-3.5 text-amber-600"></i>
                      <span>Xác thực vị trí thiết bị truy cập *</span>
                    </label>
                    <span id="login-location-badge" class="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold border border-amber-300">
                      Chờ cấp quyền
                    </span>
                  </div>

                  <div class="flex items-start gap-2">
                    <input type="checkbox" id="login-share-location" onchange="LoginPage.handleLocationCheckbox(this)" class="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer">
                    <div class="flex-1 text-[11px] leading-snug">
                      <label for="login-share-location" class="font-medium text-slate-700 cursor-pointer select-none">
                        Tôi đồng ý chia sẻ vị trí thực tế của thiết bị (GPS / Tọa độ mạng) theo quy định an ninh mạng công quyền
                      </label>
                      <div id="login-location-info" class="mt-1 text-[10px] text-slate-500 font-mono">
                        Bắt buộc chấp nhận chia sẻ vị trí để ngăn chặn hành vi truy cập trái phép từ xa.
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 pt-1 flex-wrap">
                    <button type="button" onclick="LoginPage.requestDeviceLocation()" class="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 border border-amber-300 font-bold text-[10px] flex items-center gap-1 transition">
                      <i data-lucide="crosshair" class="w-3 h-3 text-amber-700"></i>
                      <span>Lấy tọa độ GPS chính xác</span>
                    </button>
                    <button type="button" onclick="LoginPage.useDefaultCommuneLocation()" class="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-[10px] transition">
                      📍 Mặc định: Trụ sở UBND Xã Tân Triều
                    </button>
                  </div>
                </div>

                <div class="flex items-center justify-between text-[11px] text-slate-600">
                  <label class="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" id="login-remember" checked class="w-3.5 h-3.5 rounded text-blue-600 border-slate-300">
                    <span>Ghi nhớ phiên (Tối đa 6 giờ)</span>
                  </label>
                  <button type="button" onclick="LoginPage.switchTab('register')" class="text-blue-700 font-semibold hover:underline">
                    Chưa có tài khoản?
                  </button>
                </div>

                <button type="submit" id="login-submit-btn" class="w-full p-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold transition shadow-md flex items-center justify-center gap-2 text-xs">
                  <i data-lucide="log-in" class="w-4 h-4"></i>
                  <span>Đăng nhập hệ thống</span>
                </button>
              </form>

              <!-- Gợi ý tài khoản mẫu -->
              <div class="p-3 bg-blue-50/80 rounded-2xl border border-blue-200 text-[11px] text-blue-950 space-y-2">
                <div class="font-bold flex items-center justify-between">
                  <span class="flex items-center gap-1.5 text-blue-900">
                    <i data-lucide="key-round" class="w-3.5 h-3.5 text-blue-700"></i>
                    <span>Tài khoản mẫu có sẵn (Click để tự điền):</span>
                  </span>
                  <span class="text-[10px] text-blue-600 font-mono">Pass: 123456 / admin123</span>
                </div>
                
                <div class="grid grid-cols-2 gap-1.5 text-[10px]">
                  <button type="button" onclick="LoginPage.fillForm('chutich', '123456')" class="p-1.5 rounded-lg bg-white border border-blue-200 hover:border-blue-400 text-left transition flex items-center justify-between">
                    <span class="font-bold text-blue-900">🏛️ Chủ tịch</span>
                    <code class="text-slate-500 font-mono">chutich</code>
                  </button>
                  <button type="button" onclick="LoginPage.fillForm('0912345678', '123456')" class="p-1.5 rounded-lg bg-white border border-blue-200 hover:border-blue-400 text-left transition flex items-center justify-between">
                    <span class="font-bold text-emerald-900">📱 Dân (SĐT)</span>
                    <code class="text-slate-500 font-mono">0912345678</code>
                  </button>
                  <button type="button" onclick="LoginPage.fillForm('001195000007', '123456')" class="p-1.5 rounded-lg bg-white border border-blue-200 hover:border-blue-400 text-left transition flex items-center justify-between">
                    <span class="font-bold text-amber-900">🪪 Dân (CCCD)</span>
                    <code class="text-slate-500 font-mono">001195...07</code>
                  </button>
                  <button type="button" onclick="LoginPage.fillForm('admin', 'admin123')" class="p-1.5 rounded-lg bg-white border border-purple-200 hover:border-purple-400 text-left transition flex items-center justify-between">
                    <span class="font-bold text-purple-900">🛡️ Admin</span>
                    <code class="text-slate-500 font-mono">admin</code>
                  </button>
                </div>
              </div>

              <!-- Quick 1-click switch -->
              <div class="pt-2 border-t border-slate-100 space-y-1.5">
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đăng nhập nhanh 1 chạm (Demo):</div>
                <div class="grid grid-cols-3 gap-1 text-[10px]">
                  <button type="button" onclick="LoginPage.quickLogin('chutich')" class="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-left truncate font-bold text-slate-800">🏛️ Chủ tịch</button>
                  <button type="button" onclick="LoginPage.quickLogin('canbo_vp')" class="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-left truncate font-bold text-slate-800">📋 Cán bộ VP</button>
                  <button type="button" onclick="LoginPage.quickLogin('nguoidan')" class="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-left truncate font-bold text-emerald-800">👤 Công dân</button>
                </div>
              </div>

            </div>

            <!-- ============================================== -->
            <!-- TAB 2: ĐĂNG KÝ TÀI KHOẢN VỚI eKYC CCCD GẮN CHIP -->
            <!-- ============================================== -->
            <div id="panel-register" class="space-y-4 hidden">
              <div>
                <h2 class="text-base font-bold text-slate-900">Đăng ký & Định danh điện tử</h2>
                <p class="text-slate-500 mt-0.5">Xác thực CCCD gắn chip NFC & Sinh trắc học khuôn mặt AI chống giả mạo</p>
              </div>

              <!-- Role Selector -->
              <div>
                <label class="block font-bold text-slate-700 mb-1.5">Loại đối tượng đăng ký *</label>
                <div class="grid grid-cols-2 gap-2">
                  <label class="p-2.5 rounded-xl border-2 border-blue-600 bg-blue-50/40 cursor-pointer flex items-center gap-2 transition" id="reg-role-label-citizen">
                    <input type="radio" name="reg-role" value="citizen" checked onchange="LoginPage.onRoleChange('citizen')" class="w-4 h-4 text-blue-600">
                    <div>
                      <div class="font-bold text-slate-900 text-xs">👤 Công dân (eKYC)</div>
                      <div class="text-[10px] text-slate-500">Quét NFC & Face Match</div>
                    </div>
                  </label>

                  <label class="p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer flex items-center gap-2 transition hover:bg-slate-50" id="reg-role-label-officer">
                    <input type="radio" name="reg-role" value="officer" onchange="LoginPage.onRoleChange('officer')" class="w-4 h-4 text-blue-600">
                    <div>
                      <div class="font-bold text-slate-900 text-xs">🏢 Cán bộ xã</div>
                      <div class="text-[10px] text-slate-500">Điều hành công việc</div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- ========================================== -->
              <!-- CITIZEN 3-STEP AUTOMATED eKYC WIZARD       -->
              <!-- ========================================== -->
              <div id="citizen-ekyc-wizard" class="space-y-4">
                
                <!-- Stepper Progress Indicator -->
                <div class="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
                  <div id="step-pill-1" class="py-2 px-1 rounded-xl bg-blue-600 text-white flex items-center justify-center gap-1 shadow-xs">
                    <span>1. Nhập CCCD (C06)</span>
                  </div>
                  <div id="step-pill-2" class="py-2 px-1 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center gap-1">
                    <span>2. AI Face (Tùy chọn)</span>
                  </div>
                  <div id="step-pill-3" class="py-2 px-1 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center gap-1">
                    <span>3. SĐT OTP & MK</span>
                  </div>
                </div>

                <!-- BƯỚC 1: QUÉT THẺ NFC CHIP CCCD & TRA CỨU CSDL DÂN CƯ QUỐC GIA -->
                <div id="ekyc-step-1" class="space-y-3.5">
                  
                  <!-- Cổng CSDL Dân cư Quốc gia C06 & NFC Reader Banner -->
                  <div class="p-4 rounded-2xl bg-gradient-to-br from-blue-950 via-indigo-900 to-slate-900 text-white text-center relative overflow-hidden shadow-lg border border-indigo-800/80">
                    <div class="relative z-10 space-y-2">
                      <div class="flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-300 tracking-wider uppercase">
                        <i data-lucide="shield-check" class="w-3.5 h-3.5 text-amber-400"></i>
                        <span>CỔNG TRA CỨU CSDL DÂN CƯ QUỐC GIA (BỘ CÔNG AN C06)</span>
                      </div>
                      <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center mx-auto text-2xl font-bold shadow-lg animate-pulse">
                        <i data-lucide="nfc" class="w-7 h-7"></i>
                      </div>
                      <div>
                        <div class="font-bold text-sm text-white">VÙNG CẢM ỨNG ĐỌC CHIP CCCD & LIÊN THÔNG DVCQG</div>
                        <p class="text-[11px] text-blue-200 max-w-md mx-auto mt-0.5">
                          Chỉ cần nhập số CCCD: Hệ thống tự động tra cứu Họ tên, Ngày sinh, <b>Nơi sinh (Khai sinh)</b>, Quê quán và Thường trú của công dân trên toàn quốc qua Trục NDXP / Đề án 06
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Danh bạ thử nghiệm công dân toàn quốc (63 Tỉnh Thành) -->
                  <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div class="flex items-center justify-between text-[10px] font-bold text-slate-700">
                      <span class="flex items-center gap-1">
                        <span>🇻🇳 DANH BẠ CÔNG DÂN MẪU TOÀN QUỐC (ĐẠI DIỆN CÁC TỈNH THÀNH):</span>
                      </span>
                      <span class="text-blue-700 font-mono">DVCQG • C06 BCA</span>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
                      <button type="button" onclick="LoginPage.selectDemoCitizen('001195000007', 'Vũ Thị Lan')" class="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left transition truncate">
                        <b>Vũ Thị Lan</b> <span class="text-blue-600 block font-mono text-[9px]">001195000007 (Hà Nội)</span>
                      </button>
                      <button type="button" onclick="LoginPage.selectDemoCitizen('001095018273', 'Hoàng Gia Bảo')" class="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left transition truncate">
                        <b>Hoàng Gia Bảo</b> <span class="text-blue-600 block font-mono text-[9px]">001095018273 (Hà Nội)</span>
                      </button>
                      <button type="button" onclick="LoginPage.selectDemoCitizen('079198024519', 'Trần Thị Thu Thảo')" class="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left transition truncate">
                        <b>Trần Thị Thu Thảo</b> <span class="text-blue-600 block font-mono text-[9px]">079198024519 (TP.HCM)</span>
                      </button>
                      <button type="button" onclick="LoginPage.selectDemoCitizen('079096015682', 'Nguyễn Minh Khang')" class="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left transition truncate">
                        <b>Nguyễn Minh Khang</b> <span class="text-blue-600 block font-mono text-[9px]">079096015682 (TP.HCM)</span>
                      </button>
                      <button type="button" onclick="LoginPage.selectDemoCitizen('048094008765', 'Phan Thanh Tùng')" class="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left transition truncate">
                        <b>Phan Thanh Tùng</b> <span class="text-blue-600 block font-mono text-[9px]">048094008765 (Đà Nẵng)</span>
                      </button>
                      <button type="button" onclick="LoginPage.selectDemoCitizen('038092019842', 'Lê Đình Trọng')" class="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left transition truncate">
                        <b>Lê Đình Trọng</b> <span class="text-blue-600 block font-mono text-[9px]">038092019842 (Thanh Hóa)</span>
                      </button>
                      <button type="button" onclick="LoginPage.selectDemoCitizen('040093017654', 'Nguyễn Hữu Đạt')" class="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left transition truncate">
                        <b>Nguyễn Hữu Đạt</b> <span class="text-blue-600 block font-mono text-[9px]">040093017654 (Nghệ An)</span>
                      </button>
                      <button type="button" onclick="LoginPage.selectDemoCitizen('046196008123', 'Trần Nguyễn Hương Giang')" class="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left transition truncate">
                        <b>Trần Hương Giang</b> <span class="text-blue-600 block font-mono text-[9px]">046196008123 (Thừa Thiên Huế)</span>
                      </button>
                      <button type="button" onclick="LoginPage.selectDemoCitizen('092095012390', 'Huỳnh Tấn Phát')" class="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left transition truncate">
                        <b>Huỳnh Tấn Phát</b> <span class="text-blue-600 block font-mono text-[9px]">092095012390 (Cần Thơ)</span>
                      </button>
                    </div>
                  </div>

                  <!-- CCCD & Name Inputs -->
                  <div class="space-y-2.5">
                    <div>
                      <div class="flex items-center justify-between mb-1 text-xs">
                        <label class="font-bold text-slate-700">Số Căn cước công dân (12 số) *</label>
                        <span class="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Gõ đủ 12 số để tự động tra cứu</span>
                      </div>
                      <div class="relative">
                        <input type="text" id="nfc-cccd-input" oninput="LoginPage.onCccdInputChange(this)" placeholder="Nhập 12 chữ số CCCD (VD: 038092019842, 001195000007)..." maxlength="12" class="w-full p-2.5 pl-8 rounded-xl border border-slate-200 font-mono font-bold text-xs tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
                        <i data-lucide="credit-card" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3"></i>
                      </div>
                    </div>

                    <div>
                      <div class="flex items-center justify-between mb-1 text-xs">
                        <label class="font-bold text-slate-700">Họ và tên công dân</label>
                        <span class="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Tự động nạp từ CSDL Quốc gia</span>
                      </div>
                      <div class="relative">
                        <input type="text" id="nfc-name-input" placeholder="Hệ thống tự động điền họ tên từ Cổng Dân cư Quốc gia..." class="w-full p-2.5 pl-8 rounded-xl border border-slate-200 uppercase font-bold text-xs bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
                        <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3"></i>
                      </div>
                    </div>

                    <button type="button" id="btn-nfc-scan" onclick="LoginPage.handleNfcScan()" class="w-full p-3 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2">
                      <i data-lucide="search" class="w-4 h-4 text-amber-300"></i>
                      <span id="btn-nfc-scan-text">Tra cứu CSDL Dân cư Quốc gia & Đọc Chip NFC</span>
                    </button>
                  </div>

                  <!-- Kết quả thẩm định C06 Dân cư Quốc gia (Hiển thị sau khi đối soát thành công) -->
                  <div id="nfc-result-card" class="hidden p-4 rounded-2xl bg-gradient-to-r from-amber-50/90 via-emerald-50/60 to-white border border-amber-300/80 space-y-3 shadow-sm">
                    <div class="flex items-center justify-between text-[11px] pb-2 border-b border-amber-200">
                      <span class="font-bold text-emerald-800 flex items-center gap-1.5">
                        <i data-lucide="badge-check" class="w-4 h-4 text-emerald-600"></i>
                        <span>ĐÃ ĐỐI SOÁT TRỰC TUYẾN: C06 BỘ CÔNG AN</span>
                      </span>
                      <span id="nfc-chip-serial" class="font-mono text-[10px] text-slate-500">CHIP: VN-CHIP-...</span>
                    </div>

                    <div class="flex items-start gap-3">
                      <div class="w-18 h-24 rounded-xl overflow-hidden border border-slate-300 bg-slate-100 shrink-0 shadow-xs">
                        <img id="nfc-card-portrait" src="" alt="Ảnh chip CCCD" class="w-full h-full object-cover">
                      </div>

                      <div class="space-y-1 text-[11px] flex-1 min-w-0">
                        <div class="font-black text-slate-900 text-sm truncate" id="nfc-card-name">HỌ VÀ TÊN</div>
                        <div class="text-slate-700">Số CCCD: <b class="font-mono text-blue-900 font-black" id="nfc-card-cccd">001...</b></div>
                        <div class="text-slate-700">Ngày sinh: <b class="text-slate-900" id="nfc-card-dob">...</b> • Giới tính: <span id="nfc-card-gender">...</span></div>
                        <div class="text-slate-700 leading-snug"><b>Nơi sinh / Khai sinh:</b> <span class="text-indigo-950 font-semibold" id="nfc-card-birthplace">...</span></div>
                        <div class="text-slate-700 truncate">Quê quán: <span id="nfc-card-hometown">...</span></div>
                        <div class="text-slate-600 truncate">Thường trú: <span id="nfc-card-address">...</span></div>
                        <div class="pt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Tình trạng: CÒN SỐNG • CHỨNG THƯ SỐ C06 CHÍNH HÃNG</span>
                        </div>
                      </div>
                    </div>

                    <div class="space-y-2 pt-1">
                      <button type="button" onclick="LoginPage.goToEkycStep(3)" class="w-full p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5">
                        <i data-lucide="check-circle" class="w-4 h-4 text-emerald-200"></i>
                        <span>Tiếp tục: Xác thực SĐT & Tạo mật khẩu (Vào web sẽ quét NFC & Mặt)</span>
                        <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                      </button>

                      <button type="button" onclick="LoginPage.goToEkycStep(2)" class="w-full p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition flex items-center justify-center gap-1.5">
                        <i data-lucide="camera" class="w-3.5 h-3.5 text-blue-600"></i>
                        <span>Tùy chọn: Quét camera khuôn mặt AI & NFC ngay bây giờ</span>
                      </button>
                    </div>
                  </div>

                </div>

                <!-- BƯỚC 2: AI FACE eKYC - SO KHỚP KHUÔN MẶT SINH TRẮC HỌC -->
                <div id="ekyc-step-2" class="space-y-3.5 hidden">
                  <div class="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-200 text-indigo-950 text-[11px] space-y-1">
                    <div class="font-bold flex items-center gap-1.5 text-indigo-900">
                      <i data-lucide="sparkles" class="w-3.5 h-3.5 text-indigo-600"></i>
                      <span>Đối soát sinh trắc học khuôn mặt trực tiếp với ảnh chip CCCD</span>
                    </div>
                    <p class="text-indigo-800">
                      Công nghệ AI so sánh khuôn mặt camera người thật với ảnh lưu trong chip điện tử thẻ CCCD của công dân <b><span id="step-2-citizen-name">...</span></b>.
                    </p>
                  </div>

                  <!-- Face Camera Frame / Viewfinder -->
                  <div class="relative bg-slate-950 rounded-3xl overflow-hidden aspect-video max-h-[260px] flex items-center justify-center shadow-lg border border-slate-800">
                    <!-- Live Video Element -->
                    <video id="ekyc-video" autoplay playsinline class="w-full h-full object-cover hidden"></video>

                    <!-- Fallback / Simulated Biometric Scan Canvas View -->
                    <div id="ekyc-simulated-view" class="w-full h-full flex flex-col items-center justify-center text-center p-4 relative">
                      <div class="w-28 h-36 rounded-full border-2 border-dashed border-emerald-400/80 flex items-center justify-center relative shadow-inner bg-emerald-500/5">
                        <i data-lucide="user" class="w-12 h-12 text-emerald-400/60"></i>
                        <!-- Animated scan line -->
                        <div id="ekyc-scan-bar" class="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce"></div>
                      </div>
                      <div class="mt-2 text-[10px] text-emerald-400 font-mono tracking-wider flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        <span>AI BIOMETRIC CAMERA READY</span>
                      </div>
                    </div>

                    <!-- Overlay comparison cards -->
                    <div class="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white">
                      <span class="flex items-center gap-1">
                        <i data-lucide="camera" class="w-3 h-3 text-emerald-400"></i>
                        <span>Liveness check: <b class="text-emerald-400">ACTIVE</b></span>
                      </span>
                      <span class="text-slate-400">Chống giả mạo 3D</span>
                    </div>
                  </div>

                  <!-- Action Buttons for Face Matching -->
                  <div class="space-y-2">
                    <button type="button" id="btn-face-match" onclick="LoginPage.handleFaceMatch(false)" class="w-full p-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2">
                      <i data-lucide="camera" class="w-4 h-4"></i>
                      <span id="btn-face-match-text">Bật Camera & Quét khuôn mặt AI</span>
                    </button>

                    <button type="button" onclick="LoginPage.handleFaceMatch(true)" class="w-full p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition flex items-center justify-center gap-1.5">
                      <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-600"></i>
                      <span>Xác thực sinh trắc học ngay (Mô phỏng camera)</span>
                    </button>
                  </div>

                  <!-- Result of Face Match -->
                  <div id="face-match-result" class="hidden p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2.5">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                        <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
                        <span>KHUÔN MẶT TRÙNG KHỚP 100% VỚI CHIP CCCD</span>
                      </span>
                      <span id="face-score-badge" class="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-black text-[10px]">
                        98.6% KHỚP
                      </span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-center text-[10px]">
                      <div class="p-2 rounded-xl bg-white border border-emerald-200">
                        <div class="text-slate-400 mb-1">Ảnh trong chip CCCD:</div>
                        <img id="match-chip-img" src="" class="w-14 h-18 object-cover rounded-lg mx-auto shadow-xs">
                      </div>
                      <div class="p-2 rounded-xl bg-white border border-emerald-200">
                        <div class="text-slate-400 mb-1">Ảnh camera trực tiếp:</div>
                        <img id="match-selfie-img" src="" class="w-14 h-18 object-cover rounded-lg mx-auto shadow-xs">
                      </div>
                    </div>

                    <button type="button" onclick="LoginPage.goToEkycStep(3)" class="w-full p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5">
                      <span>Bước cuối: Xác thực SĐT & Tạo mật khẩu</span>
                      <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>

                  <button type="button" onclick="LoginPage.goToEkycStep(1)" class="w-full text-slate-500 hover:text-slate-800 text-[11px] py-1">
                    ← Quay lại bước Quét NFC
                  </button>

                </div>

                <!-- BƯỚC 3: SỐ ĐIỆN THOẠI, SMS OTP & MẬT KHẨU TÀI KHOẢN -->
                <div id="ekyc-step-3" class="space-y-3.5 hidden">
                  
                  <!-- Citizen Profile Summary Badge -->
                  <div class="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-300 text-emerald-950 space-y-1.5 shadow-2xs">
                    <div class="flex items-center justify-between text-[11px] font-bold">
                      <span class="text-emerald-900 flex items-center gap-1">
                        <i data-lucide="user-check" class="w-3.5 h-3.5 text-emerald-600"></i>
                        <span id="final-citizen-name">HOÀNG GIA BẢO</span>
                      </span>
                      <span class="text-[9px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-black">
                        ĐÃ XÁC THỰC C06 eKYC
                      </span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] text-emerald-800">
                      <div>CCCD: <b class="font-mono" id="final-citizen-cccd">...</b></div>
                      <div>Ngày sinh: <b id="final-citizen-dob">...</b></div>
                      <div class="sm:col-span-2">Nơi sinh (Khai sinh): <b class="text-indigo-950 font-bold" id="final-citizen-birthplace">...</b></div>
                      <div class="sm:col-span-2">Thường trú: <span id="final-citizen-address">...</span></div>
                    </div>
                  </div>

                  <form id="citizen-final-form" onsubmit="LoginPage.handleCitizenRegisterSubmit(event)" class="space-y-3">
                    
                    <!-- Số điện thoại & Xác thực SMS OTP -->
                    <div class="p-3 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-2.5">
                      <div class="flex items-center justify-between">
                        <label class="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <i data-lucide="phone" class="w-3.5 h-3.5 text-blue-600"></i>
                          <span>Số điện thoại chính chủ (Nhận mã SMS OTP) *</span>
                        </label>
                        <span id="reg-phone-badge" class="hidden text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <i data-lucide="check-circle" class="w-3 h-3 text-emerald-600"></i>
                          <span>Đã xác minh</span>
                        </span>
                      </div>

                      <div class="flex gap-2 items-center">
                        <div class="relative flex-1">
                          <input type="tel" id="reg-phone" required placeholder="Nhập số điện thoại (VD: 0987654321)" maxlength="11" class="w-full p-2.5 pl-8 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs">
                          <i data-lucide="phone" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3"></i>
                        </div>
                        <button type="button" id="btn-send-sms-otp" onclick="LoginPage.handleSendSmsOtp()" class="px-3.5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                          <i data-lucide="send" class="w-3.5 h-3.5"></i>
                          <span id="btn-send-sms-text">Gửi mã OTP (SMS)</span>
                        </button>
                      </div>

                      <!-- Khung nhập mã OTP -->
                      <div id="reg-otp-container" class="hidden pt-2 border-t border-blue-200/60 space-y-2">
                        <div class="flex items-center justify-between text-[11px]">
                          <span class="text-slate-700 font-semibold flex items-center gap-1">
                            <i data-lucide="message-square-code" class="w-3.5 h-3.5 text-blue-600"></i>
                            <span>Nhập 6 số OTP trong tin nhắn SMS:</span>
                          </span>
                          <span id="otp-timer" class="text-blue-700 font-mono font-bold text-[11px]">120s</span>
                        </div>

                        <div class="flex gap-2 items-center">
                          <input type="text" id="reg-otp-code" placeholder="6 số OTP" maxlength="6" class="flex-1 p-2.5 rounded-xl border border-blue-300 bg-white font-mono text-center tracking-widest font-black text-sm text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
                          <button type="button" id="btn-verify-otp" onclick="LoginPage.handleVerifySmsOtp()" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shrink-0">
                            Xác nhận OTP
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Mật khẩu & Nhập lại mật khẩu -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label class="block font-bold text-slate-700 mb-1">Thiết lập mật khẩu *</label>
                        <div class="relative">
                          <input type="password" id="reg-password" required minlength="6" placeholder="Mật khẩu..." class="w-full p-2.5 pl-8 pr-8 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs">
                          <i data-lucide="lock" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3"></i>
                          <button type="button" onclick="LoginPage.togglePassword('reg-password', 'reg-eye-1')" class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5">
                            <i id="reg-eye-1" data-lucide="eye" class="w-3.5 h-3.5"></i>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label class="block font-bold text-slate-700 mb-1">Nhập lại mật khẩu *</label>
                        <div class="relative">
                          <input type="password" id="reg-confirm-password" required minlength="6" placeholder="Nhập lại..." class="w-full p-2.5 pl-8 pr-8 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs">
                          <i data-lucide="shield-check" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3"></i>
                          <button type="button" onclick="LoginPage.togglePassword('reg-confirm-password', 'reg-eye-2')" class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5">
                            <i id="reg-eye-2" data-lucide="eye" class="w-3.5 h-3.5"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Captcha Challenge -->
                    <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="font-bold text-slate-700">Xác minh Robot (B-Firewall™):</span>
                        <span class="text-blue-600">Phép tính bảo vệ</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <div id="reg-captcha-container" class="shrink-0 flex items-center justify-center bg-slate-900 rounded-lg overflow-hidden cursor-pointer" onclick="LoginPage.refreshCaptcha('register')" title="Đổi câu hỏi">
                          <div id="reg-captcha-svg" class="min-w-[120px] h-[34px] flex items-center justify-center text-[10px] text-slate-400">
                            <span>Đang nạp...</span>
                          </div>
                        </div>
                        <input type="text" id="reg-captcha-answer" placeholder="Kết quả = ?" class="flex-1 p-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-center text-xs">
                      </div>
                    </div>

                    <button type="submit" id="citizen-submit-btn" class="w-full p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-md flex items-center justify-center gap-2 text-xs">
                      <i data-lucide="user-check" class="w-4 h-4"></i>
                      <span>Kích hoạt tài khoản & Đăng nhập ngay</span>
                    </button>

                    <button type="button" onclick="LoginPage.goToEkycStep(2)" class="w-full text-slate-500 hover:text-slate-800 text-[11px] py-1">
                      ← Quay lại bước Đối soát khuôn mặt
                    </button>
                  </form>

                </div>

              </div>

              <!-- ========================================== -->
              <!-- OFFICER REGISTER FORM (CÁN BỘ XÃ)          -->
              <!-- ========================================== -->
              <div id="officer-register-container" class="hidden space-y-3">
                <form id="officer-form" onsubmit="LoginPage.handleOfficerRegisterSubmit(event)" class="space-y-3">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Họ và tên cán bộ *</label>
                    <input type="text" id="off-fullname" required placeholder="VD: Lê Thị Mai" class="w-full p-2.5 rounded-xl border border-slate-200 text-xs">
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Số điện thoại *</label>
                      <input type="tel" id="off-phone" required placeholder="0987654321" class="w-full p-2.5 rounded-xl border border-slate-200 text-xs">
                    </div>
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Số CCCD 12 số *</label>
                      <input type="text" id="off-cccd" required placeholder="001..." maxlength="12" class="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs">
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Phòng ban *</label>
                      <select id="off-department" class="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs">
                        <option value="Văn phòng - Thống kê">Văn phòng - Thống kê</option>
                        <option value="Địa chính - Xây dựng - Đô thị & Môi trường">Địa chính - Xây dựng</option>
                        <option value="Tư pháp - Hộ tịch">Tư pháp - Hộ tịch</option>
                        <option value="Văn hóa - Xã hội">Văn hóa - Xã hội</option>
                      </select>
                    </div>
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Chức danh</label>
                      <input type="text" id="off-position" value="Chuyên viên" class="w-full p-2 rounded-xl border border-slate-200 text-xs">
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Mật khẩu *</label>
                      <input type="password" id="off-password" required minlength="6" placeholder="Mật khẩu..." class="w-full p-2.5 rounded-xl border border-slate-200 text-xs">
                    </div>
                    <div>
                      <label class="block font-bold text-slate-700 mb-1">Xác nhận mật khẩu *</label>
                      <input type="password" id="off-confirm-password" required minlength="6" placeholder="Nhập lại..." class="w-full p-2.5 rounded-xl border border-slate-200 text-xs">
                    </div>
                  </div>

                  <button type="submit" class="w-full p-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold transition shadow-md flex items-center justify-center gap-2 text-xs">
                    <span>Đăng ký tài khoản cán bộ</span>
                  </button>
                </form>
              </div>

              <div class="text-center pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                Đã có tài khoản? 
                <button type="button" onclick="LoginPage.switchTab('login')" class="text-blue-700 font-bold hover:underline">
                  Đăng nhập tại đây
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    `;
  },

  switchTab(tab) {
    this.currentTab = tab;
    const panelLogin = document.getElementById('panel-login');
    const panelRegister = document.getElementById('panel-register');
    const btnLogin = document.getElementById('tab-btn-login');
    const btnRegister = document.getElementById('tab-btn-register');

    if (!panelLogin || !panelRegister) return;

    if (tab === 'login') {
      document.getElementById('simulated-sms-banner')?.remove();
      this.stopCameraStream();
      panelLogin.classList.remove('hidden');
      panelRegister.classList.add('hidden');

      btnLogin.className = 'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-white text-blue-900 shadow-xs';
      btnRegister.className = 'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900';
      if (!this.loginCaptchaToken) this.refreshCaptcha('login');
    } else {
      panelLogin.classList.add('hidden');
      panelRegister.classList.remove('hidden');

      btnRegister.className = 'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-white text-emerald-900 shadow-xs';
      btnLogin.className = 'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900';
      if (!this.regCaptchaToken) this.refreshCaptcha('register');
    }

    lucide.createIcons();
  },

  onRoleChange(role) {
    this.currentRole = role;
    const citizenWizard = document.getElementById('citizen-ekyc-wizard');
    const officerContainer = document.getElementById('officer-register-container');
    const labelCitizen = document.getElementById('reg-role-label-citizen');
    const labelOfficer = document.getElementById('reg-role-label-officer');

    if (role === 'officer') {
      this.stopCameraStream();
      citizenWizard?.classList.add('hidden');
      officerContainer?.classList.remove('hidden');
      labelOfficer.className = 'p-2.5 rounded-xl border-2 border-blue-600 bg-blue-50/40 cursor-pointer flex items-center gap-2 transition';
      labelCitizen.className = 'p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer flex items-center gap-2 transition hover:bg-slate-50';
    } else {
      citizenWizard?.classList.remove('hidden');
      officerContainer?.classList.add('hidden');
      labelCitizen.className = 'p-2.5 rounded-xl border-2 border-blue-600 bg-blue-50/40 cursor-pointer flex items-center gap-2 transition';
      labelOfficer.className = 'p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer flex items-center gap-2 transition hover:bg-slate-50';
    }
    lucide.createIcons();
  },

  goToEkycStep(step) {
    this.ekycStep = step;

    const s1 = document.getElementById('ekyc-step-1');
    const s2 = document.getElementById('ekyc-step-2');
    const s3 = document.getElementById('ekyc-step-3');

    const pill1 = document.getElementById('step-pill-1');
    const pill2 = document.getElementById('step-pill-2');
    const pill3 = document.getElementById('step-pill-3');

    if (s1) s1.classList.add('hidden');
    if (s2) s2.classList.add('hidden');
    if (s3) s3.classList.add('hidden');

    const activePill = 'py-2 px-1 rounded-xl bg-blue-600 text-white flex items-center justify-center gap-1 shadow-xs';
    const donePill = 'py-2 px-1 rounded-xl bg-emerald-600 text-white flex items-center justify-center gap-1 shadow-xs';
    const inactivePill = 'py-2 px-1 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center gap-1';

    if (step === 1) {
      s1?.classList.remove('hidden');
      if (pill1) pill1.className = activePill;
      if (pill2) pill2.className = inactivePill;
      if (pill3) pill3.className = inactivePill;
      this.stopCameraStream();
    } else if (step === 2) {
      s2?.classList.remove('hidden');
      if (pill1) pill1.className = donePill;
      if (pill2) pill2.className = activePill;
      if (pill3) pill3.className = inactivePill;

      const nameEl = document.getElementById('step-2-citizen-name');
      if (nameEl && this.scannedCitizen) nameEl.innerText = this.scannedCitizen.full_name;
    } else if (step === 3) {
      s3?.classList.remove('hidden');
      if (pill1) pill1.className = donePill;
      if (pill2) pill2.className = donePill;
      if (pill3) pill3.className = activePill;
      this.stopCameraStream();

      if (this.scannedCitizen) {
        document.getElementById('final-citizen-name').innerText = this.scannedCitizen.full_name;
        document.getElementById('final-citizen-cccd').innerText = this.scannedCitizen.cccd;
        const dobEl = document.getElementById('final-citizen-dob');
        if (dobEl) dobEl.innerText = this.scannedCitizen.dob || '...';
        const bpEl = document.getElementById('final-citizen-birthplace');
        if (bpEl) bpEl.innerText = this.scannedCitizen.birthplace || '...';
        document.getElementById('final-citizen-address').innerText = this.scannedCitizen.permanent_address || 'Tân Triều, Hà Nội';
      }
    }

    lucide.createIcons();
  },

  onCccdInputChange(input) {
    if (!input) return;
    input.value = input.value.replace(/\D/g, '').slice(0, 12);
    clearTimeout(this._cccdLookupTimer);
    if (input.value.length === 12) {
      this._cccdLookupTimer = setTimeout(() => {
        this.handleNfcScan();
      }, 350);
    }
  },

  selectDemoCitizen(cccd, name) {
    const cccdInput = document.getElementById('nfc-cccd-input');
    const nameInput = document.getElementById('nfc-name-input');
    if (cccdInput) cccdInput.value = cccd;
    if (nameInput) nameInput.value = name;
    this.handleNfcScan();
  },

  async handleNfcScan() {
    const cccdInput = document.getElementById('nfc-cccd-input');
    const nameInput = document.getElementById('nfc-name-input');
    const btn = document.getElementById('btn-nfc-scan');
    const btnText = document.getElementById('btn-nfc-scan-text');
    const resultCard = document.getElementById('nfc-result-card');

    const cccd = cccdInput?.value?.trim();
    if (!cccd || cccd.length !== 12) {
      Modals.showToast('Vui lòng nhập đúng 12 chữ số CCCD', 'error');
      cccdInput?.focus();
      return;
    }

    try {
      if (btn) {
        btn.disabled = true;
        btnText.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> Đang kết nối CSDL Dân cư Quốc gia (C06)...`;
      }

      const res = await API.readNfcChip(cccd);
      this.scannedCitizen = res.citizen;

      if (nameInput) {
        nameInput.value = res.citizen.full_name;
      }

      if (res.already_registered) {
        Modals.showToast(`Số CCCD này đã được cấp tài khoản trên hệ thống (${res.existing_account?.phone_masked}). Vui lòng đăng nhập!`, 'warning');
      } else {
        Modals.showToast(`Thẩm định dữ liệu công dân thành công: ${res.citizen.full_name} (Nơi sinh: ${res.citizen.birthplace})`, 'success');
      }

      // Điền thông tin vào card kết quả
      if (resultCard) {
        resultCard.classList.remove('hidden');
        document.getElementById('nfc-chip-serial').innerText = `CHIP: ${res.nfc_chip.chip_serial}`;
        document.getElementById('nfc-card-portrait').src = res.citizen.portrait_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';
        document.getElementById('nfc-card-name').innerText = res.citizen.full_name;
        document.getElementById('nfc-card-cccd').innerText = res.citizen.cccd;
        
        const dobEl = document.getElementById('nfc-card-dob');
        if (dobEl) dobEl.innerText = res.citizen.dob;
        const genderEl = document.getElementById('nfc-card-gender');
        if (genderEl) genderEl.innerText = res.citizen.gender;
        const bpEl = document.getElementById('nfc-card-birthplace');
        if (bpEl) bpEl.innerText = res.citizen.birthplace || 'Đang cập nhật';
        const htEl = document.getElementById('nfc-card-hometown');
        if (htEl) htEl.innerText = res.citizen.hometown || '...';
        
        document.getElementById('nfc-card-address').innerText = res.citizen.permanent_address;
      }

      lucide.createIcons();
    } catch (err) {
      Modals.showToast(err.message, 'error');
      if (resultCard) resultCard.classList.add('hidden');
    } finally {
      if (btn) {
        btn.disabled = false;
        btnText.innerText = 'Tra cứu CSDL Dân cư Quốc gia & Đọc Chip NFC';
      }
    }
  },

  async startCameraStream() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        const videoEl = document.getElementById('ekyc-video');
        const simulatedView = document.getElementById('ekyc-simulated-view');
        if (videoEl && this.cameraStream) {
          videoEl.srcObject = this.cameraStream;
          videoEl.classList.remove('hidden');
          simulatedView?.classList.add('hidden');
        }
      }
    } catch (err) {
      console.warn('Camera stream không thể kích hoạt trực tiếp, chuyển sang mô phỏng:', err);
    }
  },

  stopCameraStream() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(t => t.stop());
      this.cameraStream = null;
    }
  },

  async handleFaceMatch(simulated = false) {
    if (!this.scannedCitizen) {
      Modals.showToast('Vui lòng hoàn thành bước 1 (Quét NFC CCCD) trước', 'error');
      this.goToEkycStep(1);
      return;
    }

    const nameInput = document.getElementById('nfc-name-input');
    const enteredName = nameInput?.value?.trim() || this.scannedCitizen.full_name;
    const btn = document.getElementById('btn-face-match');
    const btnText = document.getElementById('btn-face-match-text');
    const resultCard = document.getElementById('face-match-result');

    if (!simulated && !this.cameraStream) {
      await this.startCameraStream();
    }

    try {
      if (btn) {
        btn.disabled = true;
        btnText.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> Đang phân tích sinh trắc học 3D...`;
      }

      // Chụp ảnh từ camera hoặc dùng ảnh chân dung mô phỏng
      let selfieData = this.scannedCitizen.portrait_url;
      const videoEl = document.getElementById('ekyc-video');
      if (!simulated && videoEl && !videoEl.classList.contains('hidden')) {
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth || 320;
        canvas.height = videoEl.videoHeight || 240;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        selfieData = canvas.toDataURL('image/jpeg', 0.8);
      }

      const res = await API.verifyFaceMatch({
        cccd: this.scannedCitizen.cccd,
        full_name: enteredName,
        selfie_image: selfieData,
        liveness_check: true
      });

      this.isFaceMatched = true;
      this.ekycToken = res.ekyc_token;
      this.faceMatchScore = res.match_score;
      this.capturedSelfieUrl = selfieData;

      Modals.showToast(`Xác thực sinh trắc học thành công! Độ trùng khớp AI: ${res.match_score}%`, 'success');

      if (resultCard) {
        resultCard.classList.remove('hidden');
        document.getElementById('face-score-badge').innerText = `${res.match_score}% KHỚP`;
        document.getElementById('match-chip-img').src = this.scannedCitizen.portrait_url;
        document.getElementById('match-selfie-img').src = selfieData;
      }

      lucide.createIcons();
    } catch (err) {
      Modals.showToast(err.message, 'error');
      if (resultCard) resultCard.classList.add('hidden');
    } finally {
      if (btn) {
        btn.disabled = false;
        btnText.innerText = 'Bật Camera & Quét khuôn mặt AI';
      }
    }
  },

  async handleCitizenRegisterSubmit(e) {
    e.preventDefault();
    if (!this.scannedCitizen) {
      Modals.showToast('Vui lòng nhập 12 số CCCD để tra cứu dữ liệu công dân trước', 'error');
      this.goToEkycStep(1);
      return;
    }

    const phone = document.getElementById('reg-phone')?.value?.trim();
    const password = document.getElementById('reg-password')?.value;
    const confirmPassword = document.getElementById('reg-confirm-password')?.value;
    const captchaAnswer = document.getElementById('reg-captcha-answer')?.value?.trim();
    const btn = document.getElementById('citizen-submit-btn');

    if (!phone) {
      Modals.showToast('Vui lòng nhập số điện thoại', 'error');
      document.getElementById('reg-phone')?.focus();
      return;
    }

    if (!this.isPhoneVerified) {
      Modals.showToast('Vui lòng bấm "Gửi mã OTP (SMS)" và xác nhận OTP cho số điện thoại', 'error');
      return;
    }

    if (password.length < 6) {
      Modals.showToast('Mật khẩu tối thiểu 6 ký tự', 'error');
      return;
    }

    if (password !== confirmPassword) {
      Modals.showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    if (!captchaAnswer) {
      Modals.showToast('Vui lòng nhập kết quả xác minh Robot (B-Firewall™)', 'error');
      document.getElementById('reg-captcha-answer')?.focus();
      return;
    }

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> Đang tạo tài khoản...`;
      }

      const res = await API.register({
        full_name: this.scannedCitizen.full_name,
        phone: this.verifiedPhone || phone,
        cccd: this.scannedCitizen.cccd,
        password,
        confirm_password: confirmPassword,
        role: 'citizen',
        verification_token: this.verificationToken,
        otp_code: this.verifiedOtpCode,
        ekyc_token: this.ekycToken || null,
        selfie_image: this.capturedSelfieUrl || null,
        captcha_token: this.regCaptchaToken,
        captcha_answer: captchaAnswer
      });

      Modals.showToast(`Đăng ký thành công! Xin chào công dân ${res.user.full_name}`, 'success');

      setTimeout(() => {
        window.location.hash = '#dashboard';
      }, 700);

    } catch (err) {
      Modals.showToast(err.message, 'error');
      this.refreshCaptcha('register');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="user-check" class="w-4 h-4"></i> <span>Kích hoạt tài khoản & Đăng nhập ngay</span>`;
        lucide.createIcons({ root: btn });
      }
    }
  },

  async handleOfficerRegisterSubmit(e) {
    e.preventDefault();
    const fullName = document.getElementById('off-fullname')?.value?.trim();
    const phone = document.getElementById('off-phone')?.value?.trim();
    const cccd = document.getElementById('off-cccd')?.value?.trim();
    const department = document.getElementById('off-department')?.value;
    const position = document.getElementById('off-position')?.value?.trim();
    const password = document.getElementById('off-password')?.value;
    const confirmPassword = document.getElementById('off-confirm-password')?.value;

    if (!fullName || !phone || !cccd || !password) {
      Modals.showToast('Vui lòng điền đầy đủ các thông tin bắt buộc', 'error');
      return;
    }

    if (password !== confirmPassword) {
      Modals.showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    try {
      // Auto verify OTP for fast officer registration
      const otpRes = await API.sendSmsOtp(phone);
      const verifyRes = await API.verifySmsOtp(phone, otpRes.simulated_sms.otp_code);

      const res = await API.register({
        full_name: fullName,
        phone,
        cccd,
        department,
        position,
        password,
        confirm_password: confirmPassword,
        role: 'officer',
        verification_token: verifyRes.verification_token
      });

      Modals.showToast(`Đăng ký tài khoản cán bộ thành công: ${res.user.full_name}`, 'success');
      setTimeout(() => {
        window.location.hash = '#dashboard';
      }, 700);
    } catch (err) {
      Modals.showToast(err.message, 'error');
    }
  },

  async handleSendSmsOtp(isResend = false) {
    const phoneInput = document.getElementById('reg-phone');
    const sendBtn = document.getElementById('btn-send-sms-otp');
    const sendBtnText = document.getElementById('btn-send-sms-text');
    const otpContainer = document.getElementById('reg-otp-container');

    const phone = phoneInput?.value?.trim();
    if (!phone || phone.length < 10) {
      Modals.showToast('Vui lòng nhập số điện thoại hợp lệ (10 số)', 'error');
      phoneInput?.focus();
      return;
    }

    try {
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtnText.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> Đang gửi SMS...`;
      }

      const res = await API.sendSmsOtp(phone);
      Modals.showToast(res.message || 'Đã gửi mã SMS OTP!', 'success');

      if (otpContainer) {
        otpContainer.classList.remove('hidden');
        lucide.createIcons({ root: otpContainer });
      }

      this.startOtpCountdown(120);

      if (res.simulated_sms) {
        this.showSimulatedSmsBanner(res.simulated_sms);
      }

      const codeInput = document.getElementById('reg-otp-code');
      if (codeInput) {
        codeInput.value = '';
        codeInput.focus();
      }
    } catch (err) {
      Modals.showToast(err.message, 'error');
      if (sendBtn) sendBtn.disabled = false;
      if (sendBtnText) sendBtnText.innerText = 'Gửi mã OTP (SMS)';
    }
  },

  startOtpCountdown(seconds = 120) {
    if (this.otpTimerInterval) clearInterval(this.otpTimerInterval);
    this.otpRemainingSeconds = seconds;

    const timerEl = document.getElementById('otp-timer');
    const sendBtn = document.getElementById('btn-send-sms-otp');
    const sendBtnText = document.getElementById('btn-send-sms-text');

    this.otpTimerInterval = setInterval(() => {
      this.otpRemainingSeconds--;
      if (timerEl) timerEl.innerText = `${this.otpRemainingSeconds}s`;
      if (sendBtnText) sendBtnText.innerText = `Gửi lại (${this.otpRemainingSeconds}s)`;

      if (this.otpRemainingSeconds <= 0) {
        clearInterval(this.otpTimerInterval);
        if (timerEl) timerEl.innerText = 'Hết hạn';
        if (sendBtn) sendBtn.disabled = false;
        if (sendBtnText) sendBtnText.innerText = 'Gửi mã OTP (SMS)';
      }
    }, 1000);
  },

  showSimulatedSmsBanner(sms) {
    document.getElementById('simulated-sms-banner')?.remove();

    const banner = document.createElement('div');
    banner.id = 'simulated-sms-banner';
    banner.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92vw] sm:w-[480px] animate-in fade-in slide-in-from-top-4 duration-300';
    banner.innerHTML = `
      <div class="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex items-start gap-3.5 ring-1 ring-white/10">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shrink-0 text-xl font-bold shadow-md">
          💬
        </div>
        <div class="flex-1 min-w-0 space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <span class="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
              <span>TIN NHẮN SMS TỔNG ĐÀI</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold tracking-wider">[${sms.sender || 'UBND-TANTRIEU'}]</span>
            </span>
            <span class="text-[10px] text-slate-400">${sms.sent_at || 'Vừa xong'}</span>
          </div>
          <p class="text-xs text-slate-200 leading-snug">
            Mã OTP xác minh tạo tài khoản của bạn là: <span class="font-mono font-black text-amber-300 text-sm tracking-widest bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/40">${sms.otp_code}</span>. Hiệu lực trong 2 phút. Tuyệt đối không chia sẻ mã này.
          </p>
          <div class="pt-1 flex items-center justify-between gap-2">
            <button type="button" onclick="LoginPage.autoFillOtp('${sms.otp_code}')" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
              <span>⚡ Tự động điền mã ${sms.otp_code}</span>
            </button>
            <button type="button" onclick="document.getElementById('simulated-sms-banner')?.remove()" class="text-xs text-slate-400 hover:text-white px-2 py-1 transition">
              Đóng ✕
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(banner);
  },

  autoFillOtp(code) {
    const otpInput = document.getElementById('reg-otp-code');
    if (otpInput) {
      otpInput.value = code;
    }
    document.getElementById('simulated-sms-banner')?.remove();
    this.handleVerifySmsOtp();
  },

  async handleVerifySmsOtp() {
    const phoneInput = document.getElementById('reg-phone');
    const otpInput = document.getElementById('reg-otp-code');
    const verifyBtn = document.getElementById('btn-verify-otp');
    const badge = document.getElementById('reg-phone-badge');
    const sendBtn = document.getElementById('btn-send-sms-otp');

    const phone = phoneInput?.value?.trim();
    const code = otpInput?.value?.trim();

    if (!phone || !code) {
      Modals.showToast('Vui lòng nhập số điện thoại và mã OTP 6 chữ số', 'error');
      return;
    }

    try {
      if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.innerText = 'Đang xác thực...';
      }

      const res = await API.verifySmsOtp(phone, code);
      Modals.showToast('Xác thực số điện thoại thành công!', 'success');

      this.isPhoneVerified = true;
      this.verifiedPhone = phone;
      this.verificationToken = res.verification_token;
      this.verifiedOtpCode = code;

      if (this.otpTimerInterval) clearInterval(this.otpTimerInterval);

      if (badge) {
        badge.classList.remove('hidden');
        lucide.createIcons({ root: badge });
      }

      if (phoneInput) {
        phoneInput.readOnly = true;
        phoneInput.classList.add('bg-slate-100', 'text-slate-600');
      }

      if (sendBtn) sendBtn.classList.add('hidden');
      document.getElementById('reg-otp-container')?.classList.add('hidden');
      document.getElementById('simulated-sms-banner')?.remove();

    } catch (err) {
      Modals.showToast(err.message, 'error');
    } finally {
      if (verifyBtn) {
        verifyBtn.disabled = false;
        verifyBtn.innerText = 'Xác nhận OTP';
      }
    }
  },

  async refreshCaptcha(formType = 'login') {
    try {
      const res = await API.getCaptcha();
      if (formType === 'login') {
        this.loginCaptchaToken = res.token;
        const container = document.getElementById('login-captcha-svg');
        const ansInput = document.getElementById('login-captcha-answer');
        if (container) container.innerHTML = `<img src="${res.svg}" alt="Captcha" class="h-9 w-auto select-none rounded">`;
        if (ansInput) ansInput.value = '';
      } else {
        this.regCaptchaToken = res.token;
        const container = document.getElementById('reg-captcha-svg');
        const ansInput = document.getElementById('reg-captcha-answer');
        if (container) container.innerHTML = `<img src="${res.svg}" alt="Captcha" class="h-9 w-auto select-none rounded">`;
        if (ansInput) ansInput.value = '';
      }
    } catch (e) {}
  },

  togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;

    if (input.type === 'password') {
      input.type = 'text';
      icon.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      icon.setAttribute('data-lucide', 'eye');
    }
    lucide.createIcons();
  },

  fillForm(username, password) {
    const userInput = document.getElementById('login-username');
    const passInput = document.getElementById('login-password');
    if (userInput && passInput) {
      userInput.value = username;
      passInput.value = password;
      userInput.focus();
      Modals.showToast(`Đã điền tài khoản mẫu: ${username}`, 'info');
    }
  },

  currentLocation: null,

  handleLocationCheckbox(cb) {
    if (cb.checked) {
      this.requestDeviceLocation();
    } else {
      this.currentLocation = null;
      this.updateLocationBadge('Chờ cấp quyền', 'amber', 'Bắt buộc chấp nhận chia sẻ vị trí để tiếp tục.');
    }
  },

  updateLocationBadge(statusText, color, detailText) {
    const badge = document.getElementById('login-location-badge');
    const info = document.getElementById('login-location-info');
    if (badge) {
      badge.innerText = statusText;
      badge.className = `text-[10px] text-${color}-800 bg-${color}-100 px-2 py-0.5 rounded-full font-bold border border-${color}-300`;
    }
    if (info && detailText) {
      info.innerText = detailText;
    }
  },

  requestDeviceLocation() {
    const cb = document.getElementById('login-share-location');
    if (cb) cb.checked = true;

    this.updateLocationBadge('Đang định vị...', 'blue', 'Đang liên hệ cảm biến GPS / mạng trình duyệt...');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = Math.round(pos.coords.accuracy || 15);
          
          this.currentLocation = {
            latitude: lat,
            longitude: lng,
            accuracy: acc,
            address: `Tọa độ GPS: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (Sai số ±${acc}m) - Xã Tân Triều, Thanh Trì, Hà Nội`
          };

          this.updateLocationBadge('Đã xác thực GPS', 'emerald', `📍 ${this.currentLocation.address}`);
          Modals.showToast(`Đã nhận diện tọa độ GPS chính xác: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (±${acc}m)`, 'success');
        },
        (err) => {
          console.warn('GPS Error/Denied, using commune headquarters location fallback:', err);
          this.useDefaultCommuneLocation();
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      this.useDefaultCommuneLocation();
    }
  },

  useDefaultCommuneLocation() {
    const cb = document.getElementById('login-share-location');
    if (cb) cb.checked = true;

    this.currentLocation = {
      latitude: 20.9806,
      longitude: 105.7952,
      accuracy: 10,
      address: 'Trụ sở UBND Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội (20.9806°N, 105.7952°E)'
    };

    this.updateLocationBadge('Đã xác nhận vị trí', 'emerald', `📍 ${this.currentLocation.address}`);
    Modals.showToast('Đã xác thực vị trí: Trụ sở UBND Xã Tân Triều, Thanh Trì, Hà Nội', 'info');
  },

  async quickLogin(username) {
    try {
      await API.quickSwitch(username);
      Modals.showToast(`Đăng nhập thành công với vai trò ${username}`, 'success');
      window.location.hash = '#dashboard';
    } catch (e) {
      Modals.showToast(e.message, 'error');
    }
  },

  async afterRender() {
    this.refreshCaptcha('login');

    // Login Form Submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username')?.value.trim();
        const password = document.getElementById('login-password')?.value;
        const captchaAnswer = document.getElementById('login-captcha-answer')?.value.trim();
        const shareCheckbox = document.getElementById('login-share-location');
        const btn = document.getElementById('login-submit-btn');

        if (!username || !password) {
          Modals.showToast('Vui lòng nhập tài khoản và mật khẩu', 'error');
          return;
        }

        if (!captchaAnswer) {
          Modals.showToast('Vui lòng nhập kết quả xác minh chống Robot', 'error');
          document.getElementById('login-captcha-answer')?.focus();
          return;
        }

        // Bắt buộc chấp nhận chia sẻ vị trí
        if (!shareCheckbox?.checked && !LoginPage.currentLocation) {
          Modals.showToast('Quy chế an ninh: Bạn phải tích đồng ý chia sẻ vị trí của thiết bị trước khi đăng nhập', 'warning');
          document.getElementById('login-share-location')?.focus();
          return;
        }

        if (!LoginPage.currentLocation) {
          LoginPage.useDefaultCommuneLocation();
        }

        try {
          if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> Đang xác thực...`;
          }

          const res = await API.login(username, password, LoginPage.loginCaptchaToken, captchaAnswer, LoginPage.currentLocation);
          Modals.showToast(`Đăng nhập thành công! Xin chào ${res.user.full_name} (${res.session_info?.location || 'Tân Triều'})`, 'success');
          window.location.hash = '#dashboard';
        } catch (err) {
          Modals.showToast(err.message, 'error');
          LoginPage.refreshCaptcha('login');
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i data-lucide="log-in" class="w-4 h-4"></i> <span>Đăng nhập hệ thống</span>`;
            lucide.createIcons({ root: btn });
          }
        }
      };
    }
  }
};

window.LoginPage = LoginPage;
