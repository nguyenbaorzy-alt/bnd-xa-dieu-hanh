// Authentication & Login Page with Username/Password Login & Account Registration
const LoginPage = {
  currentTab: 'login',

  async render() {
    return `
      <div class="min-h-[88vh] flex items-center justify-center p-3 sm:p-6">
        
        <div class="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
          
          <!-- Left Column: Brand & Info (5 Cols) -->
          <div class="lg:col-span-5 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden">
            <!-- Decorative Background glow -->
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
                  Hệ thống quản lý công văn, phê duyệt nhiều cấp, quản trị OKR/KPI và dịch vụ trực tuyến phục vụ nhân dân
                </p>
              </div>

              <div class="pt-4 space-y-2.5 text-xs text-blue-100">
                <div class="flex items-center gap-2">
                  <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                  <span>Đăng nhập an toàn bằng tài khoản & mật khẩu</span>
                </div>
                <div class="flex items-center gap-2">
                  <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                  <span>Đăng ký tài khoản công dân / cán bộ trực tuyến</span>
                </div>
                <div class="flex items-center gap-2">
                  <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                  <span>Quy trình phê duyệt văn bản 3 cấp & phân hệ HanoiWork</span>
                </div>
                <div class="flex items-center gap-2">
                  <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                  <span>Tiếp nhận & tra cứu hồ sơ phản ánh trực tuyến</span>
                </div>
              </div>
            </div>

            <!-- Public Portal Link -->
            <div class="pt-8 border-t border-white/10 relative z-10 text-xs">
              <span class="text-blue-200 block mb-2 font-medium">Bạn là người dân cần nộp hồ sơ không cần tài khoản?</span>
              <a href="#citizen-portal" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold transition backdrop-blur-md border border-white/20">
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
                <span>Tạo tài khoản mới</span>
              </button>
            </div>

            <!-- ============================================== -->
            <!-- TAB 1: FORM ĐĂNG NHẬP BẰNG TÀI KHOẢN & MẬT KHẨU -->
            <!-- ============================================== -->
            <div id="panel-login" class="space-y-4">
              <div>
                <h2 class="text-base font-bold text-slate-900">Đăng nhập tài khoản</h2>
                <p class="text-slate-500 mt-0.5">Nhập tên đăng nhập và mật khẩu để truy cập hệ thống</p>
              </div>

              <form id="login-form" class="space-y-3.5">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Tên đăng nhập</label>
                  <div class="relative">
                    <input type="text" id="login-username" required placeholder="Nhập tên đăng nhập (VD: admin, chutich...)" class="w-full p-2.5 pl-9 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs">
                    <i data-lucide="user" class="w-4 h-4 text-slate-400 absolute left-3 top-3"></i>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block font-bold text-slate-700">Mật khẩu</label>
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

                <div class="flex items-center justify-between text-[11px] text-slate-600">
                  <label class="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" id="login-remember" checked class="w-3.5 h-3.5 rounded text-blue-600 border-slate-300">
                    <span>Ghi nhớ phiên đăng nhập</span>
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

              <!-- Gợi ý thông tin tài khoản mẫu -->
              <div class="p-3 bg-blue-50/80 rounded-2xl border border-blue-200 text-[11px] text-blue-950 space-y-2">
                <div class="font-bold flex items-center justify-between">
                  <span class="flex items-center gap-1.5 text-blue-900">
                    <i data-lucide="key-round" class="w-3.5 h-3.5 text-blue-700"></i>
                    <span>Tài khoản mẫu có sẵn (Click để tự điền):</span>
                  </span>
                  <span class="text-[10px] text-blue-600 font-mono">Pass: 123456 / admin123</span>
                </div>
                
                <div class="grid grid-cols-2 gap-1.5 text-[10px]">
                  <button type="button" onclick="LoginPage.fillForm('admin', 'admin123')" class="p-1.5 rounded-lg bg-white border border-blue-200/80 hover:border-blue-400 hover:bg-blue-100/50 text-left transition flex items-center justify-between">
                    <span class="font-bold text-purple-900">🛡️ Admin</span>
                    <code class="text-slate-500 font-mono">admin</code>
                  </button>
                  <button type="button" onclick="LoginPage.fillForm('chutich', '123456')" class="p-1.5 rounded-lg bg-white border border-blue-200/80 hover:border-blue-400 hover:bg-blue-100/50 text-left transition flex items-center justify-between">
                    <span class="font-bold text-blue-900">🏛️ Chủ tịch</span>
                    <code class="text-slate-500 font-mono">chutich</code>
                  </button>
                  <button type="button" onclick="LoginPage.fillForm('phochutich', '123456')" class="p-1.5 rounded-lg bg-white border border-blue-200/80 hover:border-blue-400 hover:bg-blue-100/50 text-left transition flex items-center justify-between">
                    <span class="font-bold text-blue-900">✍️ Phó Chủ tịch</span>
                    <code class="text-slate-500 font-mono">phochutich</code>
                  </button>
                  <button type="button" onclick="LoginPage.fillForm('canbo_vp', '123456')" class="p-1.5 rounded-lg bg-white border border-blue-200/80 hover:border-blue-400 hover:bg-blue-100/50 text-left transition flex items-center justify-between">
                    <span class="font-bold text-blue-900">📋 Cán bộ VP</span>
                    <code class="text-slate-500 font-mono">canbo_vp</code>
                  </button>
                  <button type="button" onclick="LoginPage.fillForm('canbo_dc', '123456')" class="p-1.5 rounded-lg bg-white border border-blue-200/80 hover:border-blue-400 hover:bg-blue-100/50 text-left transition flex items-center justify-between">
                    <span class="font-bold text-blue-900">📐 Cán bộ ĐC</span>
                    <code class="text-slate-500 font-mono">canbo_dc</code>
                  </button>
                  <button type="button" onclick="LoginPage.fillForm('nguoidan', '123456')" class="p-1.5 rounded-lg bg-white border border-blue-200/80 hover:border-blue-400 hover:bg-blue-100/50 text-left transition flex items-center justify-between">
                    <span class="font-bold text-emerald-900">👤 Người dân</span>
                    <code class="text-slate-500 font-mono">nguoidan</code>
                  </button>
                </div>
              </div>

              <!-- 1-Click Fast Role Switcher Box (Dành cho thử nghiệm nhanh) -->
              <div class="pt-3 border-t border-slate-100 space-y-2">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <span>★</span> Hoặc đăng nhập ngay bằng 1 chạm:
                  </span>
                  <span class="text-slate-400">1-click demo</span>
                </div>

                <div class="grid grid-cols-3 gap-1.5 text-left text-[11px]">
                  <button type="button" onclick="LoginPage.quickLogin('chutich')" class="p-2 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition text-left group">
                    <div class="font-bold text-slate-900 group-hover:text-blue-700 truncate">🏛️ Chủ tịch</div>
                    <div class="text-[9px] text-slate-400 truncate">T.Đ.Thắng</div>
                  </button>
                  <button type="button" onclick="LoginPage.quickLogin('phochutich')" class="p-2 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition text-left group">
                    <div class="font-bold text-slate-900 group-hover:text-blue-700 truncate">✍️ PCT</div>
                    <div class="text-[9px] text-slate-400 truncate">Lê Thị Mai</div>
                  </button>
                  <button type="button" onclick="LoginPage.quickLogin('canbo_vp')" class="p-2 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition text-left group">
                    <div class="font-bold text-slate-900 group-hover:text-blue-700 truncate">📋 Cán bộ VP</div>
                    <div class="text-[9px] text-slate-400 truncate">P.H.Cường</div>
                  </button>
                  <button type="button" onclick="LoginPage.quickLogin('canbo_dc')" class="p-2 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition text-left group">
                    <div class="font-bold text-slate-900 group-hover:text-blue-700 truncate">📐 Cán bộ ĐC</div>
                    <div class="text-[9px] text-slate-400 truncate">H.M.Tuấn</div>
                  </button>
                  <button type="button" onclick="LoginPage.quickLogin('nguoidan')" class="p-2 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition text-left group">
                    <div class="font-bold text-slate-900 group-hover:text-blue-700 truncate">👤 Người dân</div>
                    <div class="text-[9px] text-slate-400 truncate">Vũ Thị Lan</div>
                  </button>
                  <button type="button" onclick="LoginPage.quickLogin('admin')" class="p-2 rounded-xl border border-purple-200 bg-purple-50/40 hover:bg-purple-100/60 transition text-left group">
                    <div class="font-bold text-purple-900 truncate">🛡️ Admin</div>
                    <div class="text-[9px] text-purple-600 truncate">Toàn quyền</div>
                  </button>
                </div>
              </div>

            </div>

            <!-- ============================================== -->
            <!-- TAB 2: FORM TẠO TÀI KHOẢN & MẬT KHẨU MỚI -->
            <!-- ============================================== -->
            <div id="panel-register" class="space-y-4 hidden">
              <div>
                <h2 class="text-base font-bold text-slate-900">Tạo tài khoản mới</h2>
                <p class="text-slate-500 mt-0.5">Khởi tạo tài khoản Công dân hoặc Cán bộ công chức để truy cập hệ thống</p>
              </div>

              <form id="register-form" class="space-y-3">
                
                <!-- Loại đối tượng tài khoản -->
                <div>
                  <label class="block font-bold text-slate-700 mb-1.5">Loại tài khoản đăng ký *</label>
                  <div class="grid grid-cols-2 gap-2">
                    <label class="p-2.5 rounded-xl border-2 border-blue-600 bg-blue-50/40 cursor-pointer flex items-center gap-2 transition" id="reg-role-label-citizen">
                      <input type="radio" name="reg-role" value="citizen" checked onchange="LoginPage.onRoleChange('citizen')" class="w-4 h-4 text-blue-600">
                      <div>
                        <div class="font-bold text-slate-900 text-xs">👤 Người dân</div>
                        <div class="text-[10px] text-slate-500">Nộp hồ sơ & tra cứu</div>
                      </div>
                    </label>

                    <label class="p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer flex items-center gap-2 transition hover:bg-slate-50" id="reg-role-label-officer">
                      <input type="radio" name="reg-role" value="officer" onchange="LoginPage.onRoleChange('officer')" class="w-4 h-4 text-blue-600">
                      <div>
                        <div class="font-bold text-slate-900 text-xs">🏢 Cán bộ xã</div>
                        <div class="text-[10px] text-slate-500">Điều hành & xử lý việc</div>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- Tên đăng nhập & Họ tên -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Tên đăng nhập * <span class="text-[10px] text-slate-400 font-normal">(viết liền, 3-30 ký tự)</span></label>
                    <div class="relative">
                      <input type="text" id="reg-username" required placeholder="VD: tran_van_an" pattern="[a-zA-Z0-9_.]+" minlength="3" maxlength="30" class="w-full p-2.5 pl-8 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs">
                      <i data-lucide="at-sign" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3"></i>
                    </div>
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Họ và tên đầy đủ *</label>
                    <div class="relative">
                      <input type="text" id="reg-fullname" required placeholder="VD: Trần Văn An" class="w-full p-2.5 pl-8 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs">
                      <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3"></i>
                    </div>
                  </div>
                </div>

                <!-- Mật khẩu & Nhập lại mật khẩu -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Mật khẩu * <span class="text-[10px] text-slate-400 font-normal">(≥ 6 ký tự)</span></label>
                    <div class="relative">
                      <input type="password" id="reg-password" required minlength="6" placeholder="Nhập mật khẩu..." class="w-full p-2.5 pl-8 pr-8 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs">
                      <i data-lucide="lock" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3"></i>
                      <button type="button" onclick="LoginPage.togglePassword('reg-password', 'reg-eye-1')" class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5">
                        <i id="reg-eye-1" data-lucide="eye" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Xác nhận mật khẩu *</label>
                    <div class="relative">
                      <input type="password" id="reg-confirm-password" required minlength="6" placeholder="Nhập lại mật khẩu..." class="w-full p-2.5 pl-8 pr-8 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs">
                      <i data-lucide="shield-check" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3"></i>
                      <button type="button" onclick="LoginPage.togglePassword('reg-confirm-password', 'reg-eye-2')" class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5">
                        <i id="reg-eye-2" data-lucide="eye" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Số điện thoại & Xác thực SMS OTP -->
                <div class="p-3 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 rounded-2xl border border-blue-200/90 space-y-2.5">
                  <div class="flex items-center justify-between">
                    <label class="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <i data-lucide="shield-check" class="w-4 h-4 text-blue-600"></i>
                      <span>Số điện thoại chính chủ (Bắt buộc xác thực SMS OTP) *</span>
                    </label>
                    <span id="reg-phone-badge" class="hidden text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <i data-lucide="check-circle" class="w-3 h-3 text-emerald-600"></i>
                      <span>Đã xác minh SMS</span>
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

                  <!-- Khung nhập mã xác thực OTP (Mở rộng khi bấm Gửi mã OTP) -->
                  <div id="reg-otp-container" class="hidden pt-2 border-t border-blue-200/60 space-y-2">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-slate-700 font-semibold flex items-center gap-1">
                        <i data-lucide="message-square-code" class="w-3.5 h-3.5 text-blue-600"></i>
                        <span>Nhập mã xác minh 6 số đã gửi qua tin nhắn SMS:</span>
                      </span>
                      <span id="otp-timer" class="text-blue-700 font-mono font-bold text-[11px]">Hết hạn sau 120s</span>
                    </div>

                    <div class="flex gap-2 items-center">
                      <div class="relative flex-1">
                        <input type="text" id="reg-otp-code" placeholder="Nhập 6 số OTP (VD: 582914)" maxlength="6" class="w-full p-2.5 pl-8 rounded-xl border border-blue-300 bg-white font-mono text-center tracking-widest font-black text-sm text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden shadow-inner">
                        <i data-lucide="key" class="w-3.5 h-3.5 text-blue-500 absolute left-2.5 top-3.5"></i>
                      </div>
                      <button type="button" id="btn-verify-otp" onclick="LoginPage.handleVerifySmsOtp()" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 shrink-0">
                        <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
                        <span>Xác nhận OTP</span>
                      </button>
                    </div>

                    <div class="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Tổng đài phát hành: <b class="text-slate-700">[UBND-TANTRIEU]</b></span>
                      <button type="button" onclick="LoginPage.handleSendSmsOtp(true)" id="btn-resend-otp" class="text-blue-700 hover:underline font-semibold disabled:text-slate-400 disabled:no-underline" disabled>
                        Gửi lại mã mới
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Địa chỉ Email -->
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Địa chỉ Email (Không bắt buộc)</label>
                  <div class="relative">
                    <input type="email" id="reg-email" placeholder="VD: an.tran@example.com" class="w-full p-2.5 pl-8 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs">
                    <i data-lucide="mail" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3"></i>
                  </div>
                </div>

                <!-- Khu vực dành cho Cán bộ (Phòng ban & Chức vụ) -->
                <div id="reg-officer-fields" class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 hidden">
                  <div class="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                    <i data-lucide="briefcase" class="w-3.5 h-3.5 text-blue-700"></i>
                    <span>Thông tin công tác cán bộ:</span>
                  </div>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label class="block font-semibold text-slate-600 mb-1 text-[11px]">Phòng ban / Bộ phận *</label>
                      <select id="reg-department" class="w-full p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 text-xs">
                        <option value="Văn phòng - Thống kê">Văn phòng - Thống kê</option>
                        <option value="Địa chính - Nông nghiệp - Xây dựng & Môi trường">Địa chính - Xây dựng & Môi trường</option>
                        <option value="Tư pháp - Hộ tịch">Tư pháp - Hộ tịch</option>
                        <option value="Văn hóa - Xã hội">Văn hóa - Xã hội</option>
                        <option value="Tài chính - Kế toán">Tài chính - Kế toán</option>
                        <option value="Ban Chỉ huy Quân sự xã">Ban Chỉ huy Quân sự</option>
                        <option value="Công an xã Tân Triều">Công an xã</option>
                      </select>
                    </div>

                    <div>
                      <label class="block font-semibold text-slate-600 mb-1 text-[11px]">Chức danh / Vị trí việc làm</label>
                      <input type="text" id="reg-position" value="Chuyên viên" placeholder="VD: Công chức văn phòng, Cán bộ địa chính..." class="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs">
                    </div>
                  </div>
                </div>

                <div class="pt-1">
                  <button type="submit" id="register-submit-btn" class="w-full p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-md flex items-center justify-center gap-2 text-xs">
                    <i data-lucide="user-check" class="w-4 h-4"></i>
                    <span>Hoàn tất đăng ký & Đăng nhập ngay</span>
                  </button>
                </div>

                <div class="text-center pt-1 text-[11px] text-slate-500">
                  Đã có tài khoản? 
                  <button type="button" onclick="LoginPage.switchTab('login')" class="text-blue-700 font-bold hover:underline">
                    Đăng nhập tại đây
                  </button>
                </div>

              </form>
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
      panelLogin.classList.remove('hidden');
      panelRegister.classList.add('hidden');

      btnLogin.className = 'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-white text-blue-900 shadow-xs';
      btnRegister.className = 'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900';
    } else {
      panelLogin.classList.add('hidden');
      panelRegister.classList.remove('hidden');

      btnRegister.className = 'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-white text-emerald-900 shadow-xs';
      btnLogin.className = 'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900';
    }

    lucide.createIcons();
  },

  onRoleChange(role) {
    const officerFields = document.getElementById('reg-officer-fields');
    const labelCitizen = document.getElementById('reg-role-label-citizen');
    const labelOfficer = document.getElementById('reg-role-label-officer');

    if (!officerFields || !labelCitizen || !labelOfficer) return;

    if (role === 'officer') {
      officerFields.classList.remove('hidden');
      labelOfficer.className = 'p-2.5 rounded-xl border-2 border-blue-600 bg-blue-50/40 cursor-pointer flex items-center gap-2 transition';
      labelCitizen.className = 'p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer flex items-center gap-2 transition hover:bg-slate-50';
    } else {
      officerFields.classList.add('hidden');
      labelCitizen.className = 'p-2.5 rounded-xl border-2 border-blue-600 bg-blue-50/40 cursor-pointer flex items-center gap-2 transition';
      labelOfficer.className = 'p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer flex items-center gap-2 transition hover:bg-slate-50';
    }

    lucide.createIcons();
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
      Modals.showToast(`Đã điền thông tin tài khoản mẫu: ${username}`, 'info');
    }
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

  isPhoneVerified: false,
  verifiedPhone: '',
  verificationToken: '',
  verifiedOtpCode: '',
  otpTimerInterval: null,
  otpRemainingSeconds: 0,

  async handleSendSmsOtp(isResend = false) {
    const phoneInput = document.getElementById('reg-phone');
    const sendBtn = document.getElementById('btn-send-sms-otp');
    const sendBtnText = document.getElementById('btn-send-sms-text');
    const resendBtn = document.getElementById('btn-resend-otp');
    const otpContainer = document.getElementById('reg-otp-container');

    const phone = phoneInput?.value?.trim();
    if (!phone) {
      Modals.showToast('Vui lòng nhập số điện thoại trước khi yêu cầu mã OTP', 'error');
      phoneInput?.focus();
      return;
    }

    const phoneRegex = /^0(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      Modals.showToast('Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số di động (VD: 0987654321)', 'error');
      phoneInput?.focus();
      return;
    }

    try {
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtnText.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> Đang gửi SMS...`;
      }
      if (resendBtn) resendBtn.disabled = true;

      const res = await API.sendSmsOtp(phone);
      Modals.showToast(res.message || 'Mã xác thực SMS OTP đã được phát hành!', 'success');

      // Mở khung nhập OTP
      if (otpContainer) {
        otpContainer.classList.remove('hidden');
        lucide.createIcons({ root: otpContainer });
      }

      // Đếm ngược 120s
      this.startOtpCountdown(120);

      // Hiển thị khung tin nhắn SMS mô phỏng thông minh
      if (res.simulated_sms) {
        this.showSimulatedSmsBanner(res.simulated_sms);
      }

      const otpCodeInput = document.getElementById('reg-otp-code');
      if (otpCodeInput) {
        otpCodeInput.value = '';
        otpCodeInput.focus();
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
    const resendBtn = document.getElementById('btn-resend-otp');
    const sendBtn = document.getElementById('btn-send-sms-otp');
    const sendBtnText = document.getElementById('btn-send-sms-text');

    if (resendBtn) resendBtn.disabled = true;

    this.otpTimerInterval = setInterval(() => {
      this.otpRemainingSeconds--;
      if (timerEl) {
        timerEl.innerText = `Hết hạn sau ${this.otpRemainingSeconds}s`;
      }
      if (sendBtnText) {
        sendBtnText.innerText = `Gửi lại sau (${this.otpRemainingSeconds}s)`;
      }

      if (this.otpRemainingSeconds <= 0) {
        clearInterval(this.otpTimerInterval);
        if (timerEl) timerEl.innerText = 'Mã OTP đã hết hạn';
        if (resendBtn) resendBtn.disabled = false;
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
    const otpContainer = document.getElementById('reg-otp-container');
    const sendBtn = document.getElementById('btn-send-sms-otp');

    const phone = phoneInput?.value?.trim();
    const code = otpInput?.value?.trim();

    if (!phone) {
      Modals.showToast('Thiếu thông tin số điện thoại', 'error');
      return;
    }
    if (!code || code.length !== 6) {
      Modals.showToast('Vui lòng nhập đủ 6 chữ số mã OTP', 'error');
      otpInput?.focus();
      return;
    }

    try {
      if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> Đang xác thực...`;
      }

      const res = await API.verifySmsOtp(phone, code);
      Modals.showToast(res.message || 'Xác thực số điện thoại thành công!', 'success');

      this.isPhoneVerified = true;
      this.verifiedPhone = phone;
      this.verificationToken = res.verification_token;
      this.verifiedOtpCode = code;

      if (this.otpTimerInterval) clearInterval(this.otpTimerInterval);

      // Hiển thị huy hiệu đã xác minh
      if (badge) {
        badge.classList.remove('hidden');
        lucide.createIcons({ root: badge });
      }

      // Khóa ô số điện thoại để không bị sửa sau khi xác minh
      if (phoneInput) {
        phoneInput.readOnly = true;
        phoneInput.classList.add('bg-slate-100', 'text-slate-600');
      }

      // Ẩn nút gửi mã, hiển thị trạng thái đã xác minh
      if (sendBtn) {
        sendBtn.classList.add('hidden');
      }
      if (otpContainer) {
        otpContainer.innerHTML = `
          <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
              <span>Số điện thoại <b>${phone}</b> đã được xác minh SMS OTP thành công.</span>
            </span>
            <button type="button" onclick="LoginPage.resetOtpState()" class="text-xs text-blue-700 underline font-normal">Đổi số</button>
          </div>
        `;
        lucide.createIcons({ root: otpContainer });
      }

      document.getElementById('simulated-sms-banner')?.remove();

    } catch (err) {
      Modals.showToast(err.message, 'error');
    } finally {
      if (verifyBtn) {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = `<i data-lucide="check-check" class="w-3.5 h-3.5"></i> <span>Xác nhận OTP</span>`;
        lucide.createIcons({ root: verifyBtn });
      }
    }
  },

  resetOtpState() {
    this.isPhoneVerified = false;
    this.verifiedPhone = '';
    this.verificationToken = '';
    this.verifiedOtpCode = '';
    if (this.otpTimerInterval) clearInterval(this.otpTimerInterval);

    const phoneInput = document.getElementById('reg-phone');
    const badge = document.getElementById('reg-phone-badge');
    const sendBtn = document.getElementById('btn-send-sms-otp');
    const sendBtnText = document.getElementById('btn-send-sms-text');

    if (phoneInput) {
      phoneInput.readOnly = false;
      phoneInput.classList.remove('bg-slate-100', 'text-slate-600');
      phoneInput.value = '';
      phoneInput.focus();
    }
    if (badge) badge.classList.add('hidden');
    if (sendBtn) {
      sendBtn.classList.remove('hidden');
      sendBtn.disabled = false;
    }
    if (sendBtnText) sendBtnText.innerText = 'Gửi mã OTP (SMS)';

    const otpContainer = document.getElementById('reg-otp-container');
    if (otpContainer) {
      otpContainer.classList.add('hidden');
      otpContainer.innerHTML = `
        <div class="flex items-center justify-between text-[11px]">
          <span class="text-slate-700 font-semibold flex items-center gap-1">
            <i data-lucide="message-square-code" class="w-3.5 h-3.5 text-blue-600"></i>
            <span>Nhập mã xác minh 6 số đã gửi qua tin nhắn SMS:</span>
          </span>
          <span id="otp-timer" class="text-blue-700 font-mono font-bold text-[11px]">Hết hạn sau 120s</span>
        </div>

        <div class="flex gap-2 items-center">
          <div class="relative flex-1">
            <input type="text" id="reg-otp-code" placeholder="Nhập 6 số OTP (VD: 582914)" maxlength="6" class="w-full p-2.5 pl-8 rounded-xl border border-blue-300 bg-white font-mono text-center tracking-widest font-black text-sm text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden shadow-inner">
            <i data-lucide="key" class="w-3.5 h-3.5 text-blue-500 absolute left-2.5 top-3.5"></i>
          </div>
          <button type="button" id="btn-verify-otp" onclick="LoginPage.handleVerifySmsOtp()" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 shrink-0">
            <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
            <span>Xác nhận OTP</span>
          </button>
        </div>

        <div class="flex items-center justify-between text-[10px] text-slate-500">
          <span>Tổng đài phát hành: <b class="text-slate-700">[UBND-TANTRIEU]</b></span>
          <button type="button" onclick="LoginPage.handleSendSmsOtp(true)" id="btn-resend-otp" class="text-blue-700 hover:underline font-semibold disabled:text-slate-400 disabled:no-underline" disabled>
            Gửi lại mã mới
          </button>
        </div>
      `;
      lucide.createIcons({ root: otpContainer });
    }
  },

  async afterRender() {
    // 1. Gắn sự kiện Form Đăng nhập
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username')?.value.trim();
        const password = document.getElementById('login-password')?.value;
        const btn = document.getElementById('login-submit-btn');

        if (!username || !password) {
          Modals.showToast('Vui lòng nhập tên đăng nhập và mật khẩu', 'error');
          return;
        }

        try {
          if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> Đang xác thực...`;
          }

          const res = await API.login(username, password);
          Modals.showToast(`Đăng nhập thành công! Xin chào ${res.user.full_name}`, 'success');
          
          if (res.user.role === 'citizen') {
            window.location.hash = '#dashboard';
          } else {
            window.location.hash = '#dashboard';
          }
        } catch (err) {
          Modals.showToast(err.message, 'error');
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i data-lucide="log-in" class="w-4 h-4"></i> <span>Đăng nhập hệ thống</span>`;
            lucide.createIcons({ root: btn });
          }
        }
      };
    }

    // 2. Gắn sự kiện Form Đăng ký / Tạo tài khoản mới
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username')?.value.trim();
        const fullName = document.getElementById('reg-fullname')?.value.trim();
        const password = document.getElementById('reg-password')?.value;
        const confirmPassword = document.getElementById('reg-confirm-password')?.value;
        const phone = document.getElementById('reg-phone')?.value.trim();
        const email = document.getElementById('reg-email')?.value.trim();
        const role = document.querySelector('input[name="reg-role"]:checked')?.value || 'citizen';
        const department = document.getElementById('reg-department')?.value || '';
        const position = document.getElementById('reg-position')?.value || '';
        const btn = document.getElementById('register-submit-btn');

        if (!username || !fullName || !password) {
          Modals.showToast('Vui lòng điền đầy đủ các thông tin bắt buộc (*)', 'error');
          return;
        }

        if (password.length < 6) {
          Modals.showToast('Mật khẩu phải có độ dài tối thiểu 6 ký tự', 'error');
          return;
        }

        if (password !== confirmPassword) {
          Modals.showToast('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!', 'error');
          return;
        }

        if (!LoginPage.isPhoneVerified) {
          Modals.showToast('Vui lòng bấm "Gửi mã OTP (SMS)" và nhập mã xác minh để hoàn tất xác thực số điện thoại', 'error');
          const phoneInput = document.getElementById('reg-phone');
          phoneInput?.focus();
          return;
        }

        if (phone !== LoginPage.verifiedPhone) {
          Modals.showToast('Số điện thoại đã thay đổi so với số đã xác minh. Vui lòng xác thực lại mã OTP.', 'error');
          LoginPage.resetOtpState();
          return;
        }

        try {
          if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> Đang tạo tài khoản...`;
          }

          const res = await API.register({
            username,
            password,
            confirm_password: confirmPassword,
            full_name: fullName,
            phone: LoginPage.verifiedPhone || phone,
            email,
            role,
            department: role === 'officer' ? department : 'Công dân',
            position: role === 'officer' ? position : 'Công dân',
            verification_token: LoginPage.verificationToken,
            otp_code: LoginPage.verifiedOtpCode
          });

          Modals.showToast(res.message || 'Tạo tài khoản thành công!', 'success');
          
          // Chuyển hướng theo vai trò
          setTimeout(() => {
            if (res.user.role === 'citizen') {
              window.location.hash = '#dashboard';
            } else {
              window.location.hash = '#dashboard';
            }
          }, 600);

        } catch (err) {
          Modals.showToast(err.message, 'error');
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i data-lucide="user-check" class="w-4 h-4"></i> <span>Hoàn tất đăng ký & Đăng nhập ngay</span>`;
            lucide.createIcons({ root: btn });
          }
        }
      };
    }
  }
};

window.LoginPage = LoginPage;
