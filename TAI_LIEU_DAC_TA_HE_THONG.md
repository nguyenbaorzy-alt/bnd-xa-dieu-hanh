# ỦY BAN NHÂN DÂN XÃ / PHƯỜNG
## HỆ THỐNG QUẢN LÝ VĂN BẢN, ĐIỀU HÀNH CÔNG VIỆC & DỊCH VỤ CÔNG TRỰC TUYẾN
### TÀI LIỆU ĐẶC TẢ KIẾN TRÚC, MASTER SYSTEM PROMPT & THIẾT KẾ GIAO DIỆN HOÀN CHỈNH

---

## PHẦN 1: TỔNG QUAN HỆ THỐNG & PHÂN QUYỀN NGƯỜI DÙNG (RBAC)

Hệ thống Quản lý & Điều hành Điện tử UBND Xã/Phường là giải pháp phần mềm chuyển đổi số toàn diện cho chính quyền cơ sở, tích hợp đồng bộ giữa công tác quản lý điều hành nội bộ và cung cấp dịch vụ công trực tuyến cho công dân.

Hệ thống phân quyền nghiêm ngặt theo mô hình RBAC với 5 vai trò nghiệp vụ:
1. **Lãnh đạo UBND (`lanh_dao`)**: Chủ tịch, Phó Chủ tịch xã/phường có thẩm quyền phê duyệt công văn đi, giao việc chỉ đạo, đánh giá KPI bộ phận và duyệt tin tức phát ngôn chính thống.
2. **Văn thư - Lưu trữ (`van_thu`)**: Tiếp nhận công văn đến, vào sổ văn bản, cấp số và đóng dấu phát hành công văn đi, theo dõi luồng xử lý văn bản toàn cơ quan.
3. **Chuyên viên chuyên môn (`chuyen_vien`)**: Cán bộ các ban ngành (Tư pháp, Địa chính - Xây dựng, Văn hóa - Xã hội...) soạn thảo văn bản, tiếp nhận xử lý hồ sơ công dân, thực hiện các chỉ tiêu OKR/KPI được giao.
4. **Công dân địa phương (`cong_dan`)**: Đăng ký tài khoản nhanh chóng chỉ bằng Số điện thoại cá nhân (không bắt buộc CCCD phức tạp), gửi phản ánh hiện trường, nộp hồ sơ dịch vụ công và theo dõi tiến độ giải quyết một cửa trực tuyến.
5. **Quản trị viên An ninh (`admin`)**: Giám sát hệ thống B-Firewall™, theo dõi IP logs thời gian thực, quản lý danh sách IP Whitelist/Blacklist, phân tích và ngăn chặn các mối đe dọa an ninh mạng.

---

## PHẦN 2: KIẾN TRÚC KỸ THUẬT & CÔNG NGHỆ ÁP DỤNG

- **Backend**: Node.js kết hợp Express framework, thiết kế RESTful API tiêu chuẩn cao, xử lý bất đồng bộ đa luồng.
- **Cơ sở dữ liệu**: SQLite cục bộ thông qua `better-sqlite3` cho tốc độ truy xuất cực nhanh (trên 10,000 queries/giây), hỗ trợ chế độ WAL (Write-Ahead Logging) an toàn dữ liệu.
- **Frontend**: Kiến trúc Single Page Application (SPA) viết bằng JavaScript thuần (Vanilla JS), giao diện responsive bằng Tailwind CSS, hệ thống biểu tượng Lucide Icons và biểu đồ trực quan hóa dữ liệu Chart.js.
- **Bảo mật & Quản lý Phiên**: Sử dụng `express-session` với cookie bảo mật HttpOnly, thuật toán băm mật khẩu `bcryptjs`. Thời hạn phiên đăng nhập được cố định an toàn 6 tiếng chuẩn theo múi giờ Hà Nội (GMT+7 - `Asia/Ho_Chi_Minh`).
- **Tường lửa B-Firewall™**: Cơ chế theo dõi rủi ro IP tự động ở mỗi yêu cầu, phát hiện quét cổng, rate limiting, hỗ trợ Captcha toán học khi phát hiện hành vi bất thường, quản lý IP Whitelist và Blacklist trực tiếp từ giao diện quản trị.

---

## PHẦN 3: NGUYÊN TẮC NGHIỆP VỤ CỐT LÕI (CORE BUSINESS RULES)

### 3.1. Đăng ký & Xác thực Tài khoản Công dân
Nhằm nâng cao tỷ lệ tiếp cận dịch vụ công trực tuyến của người dân địa phương, hệ thống áp dụng cơ chế đăng ký trực tiếp và tối giản: Công dân chỉ cần nhập Họ tên, Số điện thoại (chính là tên đăng nhập) và Mật khẩu. Bỏ qua các bước quét thẻ CCCD hoặc OTP phức tạp ở bước đăng ký ban đầu, giúp người cao tuổi và mọi tầng lớp nhân dân đều dễ dàng tạo tài khoản và nộp hồ sơ.

### 3.2. Quy trình Xử lý Văn bản 4 Bước
- **Luồng Công văn Đi**: Soạn thảo (Chuyên viên) -> Trình duyệt (Lãnh đạo ký số) -> Cấp số & Ban hành (Văn thư đóng dấu số, sinh mã QR tra cứu) -> Lưu trữ hồ sơ điện tử.
- **Luồng Công văn Đến**: Tiếp nhận & Vào sổ (Văn thư) -> Báo cáo & Xin ý kiến (Lãnh đạo phân công phụ trách) -> Tiếp nhận xử lý (Chuyên viên thực hiện) -> Báo cáo kết quả hoàn thành.

### 3.3. Đánh giá OKR/KPI & Trợ lý ảo AI HanoiWork B-Algo™
Tích hợp trợ lý trí tuệ nhân tạo (AI Assistant) phân tích công việc theo quy trình 5 bước nghiêm ngặt:
1. Khảo sát nhiệm vụ được giao
2. Đánh giá tỷ lệ hoàn thành thực tế
3. Nhận diện điểm nghẽn tồn đọng
4. Tính toán chỉ số hiệu suất B-Algo dựa trên trọng số công việc
5. Đề xuất giải pháp và biểu dương khen thưởng

---

## PHẦN 4: THIẾT KẾ GIAO DIỆN FRONTEND & HỆ THỐNG BIỂU MẪU (FORMS)

| STT | Tên Biểu mẫu (Form) | Tệp Giao diện | Các Trường Dữ liệu Nhập (Inputs) |
| :---: | :--- | :--- | :--- |
| 1 | **Form Đăng nhập** | `login.js` | Tên đăng nhập / Số điện thoại, Mật khẩu, Ghi nhớ phiên làm việc (6 giờ) |
| 2 | **Form Đăng ký Công dân** | `login.js` | Họ và tên, Số điện thoại (tên tài khoản), Mật khẩu, Xác nhận mật khẩu |
| 3 | **Form Soạn Công văn Đi** | `doc-out.js` | Trích yếu, Loại văn bản, Mức độ khẩn, Lãnh đạo ký duyệt, Tệp đính kèm PDF |
| 4 | **Form Tiếp nhận Công văn Đến** | `doc-in.js` | Số hiệu văn bản đến, Cơ quan ban hành, Ngày đến, Trích yếu, Hạn xử lý, Cán bộ phụ trách |
| 5 | **Form Nộp Hồ sơ / Phản ánh** | `requests.js` | Lĩnh vực thủ tục, Tiêu đề phản ánh, Nội dung chi tiết, Hình ảnh / Tệp tài liệu minh chứng |
| 6 | **Form Xử lý Hồ sơ Một cửa** | `requests.js` | Trạng thái phê duyệt (Duyệt/Từ chối), Ý kiến xử lý của cán bộ, Tệp kết quả giải quyết |
| 7 | **Form Giao việc OKR/KPI** | `kpi.js` | Chuyên viên nhận việc, Mục tiêu chỉ tiêu, Trọng số (%), Hạn hoàn thành, Đơn vị tính |
| 8 | **Form Cấu hình Quy tắc B-Firewall** | `security.js` | Loại quy tắc (Whitelist/Blacklist), Địa chỉ IP / CIDR, Lý do áp dụng quy tắc |

---

## PHẦN 5: ĐẶC TẢ HỆ THỐNG REST API BACKEND

| Phương thức | Điểm cuối (Endpoint) | Chức năng & Mô tả Nghiệp vụ |
| :---: | :--- | :--- |
| `POST` | `/api/auth/register` | Đăng ký tài khoản công dân trực tiếp bằng Họ tên và Số điện thoại |
| `POST` | `/api/auth/login` | Đăng nhập hệ thống (áp dụng chung cho cả cán bộ và công dân) |
| `GET` | `/api/auth/me` | Lấy thông tin người dùng hiện tại và kiểm tra quyền hạn (RBAC) |
| `POST` | `/api/auth/logout` | Đăng xuất khỏi hệ thống và hủy bỏ phiên làm việc |
| `GET` | `/api/documents` | Lấy danh sách công văn (hỗ trợ phân loại, tìm kiếm và lọc trạng thái) |
| `POST` | `/api/documents` | Tạo mới hoặc ban hành văn bản hành chính điện tử |
| `PATCH` | `/api/documents/:id/status` | Cập nhật trạng thái luồng văn bản (Trình duyệt, Ký số, Ban hành) |
| `GET` | `/api/citizen-requests` | Danh sách phản ánh và hồ sơ dịch vụ công một cửa |
| `POST` | `/api/citizen-requests` | Công dân nộp hồ sơ thủ tục hoặc gửi phản ánh hiện trường mới |
| `POST` | `/api/kpis/ai-evaluate` | Khởi chạy Trợ lý ảo AI B-Algo phân tích và chấm điểm KPI |
| `GET` | `/api/security/logs` | Lấy nhật ký giám sát IP và phân tích rủi ro an ninh B-Firewall |
| `POST` | `/api/security/rules` | Thêm quy tắc IP Whitelist / Blacklist vào tường lửa |

---

## PHẦN 6: HƯỚNG DẪN TRIỂN KHAI, VẬN HÀNH & KIỂM THỬ

### 1. Khởi tạo Cơ sở dữ liệu & Nạp dữ liệu mẫu
```bash
node database/seed.js
```

### 2. Khởi động Máy chủ Ứng dụng
```bash
node server.js
```
Hệ thống sẵn sàng phục vụ tại: `http://localhost:3001`

### 3. Danh mục Tài khoản Kiểm thử Mẫu
- **Lãnh đạo UBND**: `lanhdao` / `123456`
- **Bộ phận Văn thư**: `vanthu` / `123456`
- **Chuyên viên**: `chuyenvien` / `123456`
- **Quản trị viên An ninh**: `admin` / `123456`
- **Công dân**: `0912345678` / `123456`

### 4. Kiểm thử Tự động (136/136 test cases đạt 100%)
```bash
node tests/test_phone_only_citizen_register.js
node tests/test_auto_vietnam_time_and_security.js
node tests/test_ai_kpi_pipeline.js
node tests/test_documents_flow.js
node tests/test_citizen_requests.js
```
