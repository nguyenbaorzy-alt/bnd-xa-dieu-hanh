# HỆ THỐNG ĐIỀU HÀNH CÔNG VĂN VÀ DỊCH VỤ TRỰC TUYẾN CẤP XÃ
### Đơn vị áp dụng mẫu: ỦY BAN NHÂN DÂN XÃ TÂN TRIỀU - HUYỆN THANH TRÌ - TP. HÀ NỘI

---

## 1. GIỚI THIỆU TỔNG QUAN

Ứng dụng web toàn diện được thiết kế đặc thù cho **Ủy ban nhân dân cấp xã**, phục vụ công tác chỉ đạo điều hành của Lãnh đạo, tác nghiệp chuyên môn của cán bộ công chức và cung cấp dịch vụ hành chính trực tuyến cho người dân.

### Điểm nổi bật:
- **Giao diện chuẩn hành chính điện tử hiện đại**: Phối màu xanh navy (`#0B2545`), xanh dương (`#2563EB`) và vàng đồng nhẹ (`#D4AF37`), chuẩn thể thức văn bản theo **Nghị định 30/2020/NĐ-CP** của Chính phủ.
- **Hệ thống dữ liệu bền vững (Persistent Database)**: Sử dụng SQLite (WAL mode, Foreign Keys) với dữ liệu thực tế, không bị mất khi tải lại trang hay đăng xuất.
- **Phân quyền 4 nhóm đối tượng chặt chẽ**: Quản trị viên, Lãnh đạo UBND, Cán bộ công chức chuyên môn, Người dân.
- **Bộ chuyển đổi vai trò 1-Click (Quick Demo Switcher)**: Dễ dàng chuyển đổi giữa các vai trò ngay trên thanh điều hướng để kiểm thử toàn diện quy trình mà không cần gõ lại mật khẩu.

---

## 2. TÀI KHOẢN TRUY CẬP VÀ PHÂN QUYỀN

| Vai trò | Họ và tên | Tên đăng nhập | Mật khẩu | Quyền hạn chính |
| :--- | :--- | :--- | :--- | :--- |
| **Quản trị viên** | Nguyễn Văn Quản Trị | `admin` | `admin123` | Cấu hình đơn vị, tài khoản, quy trình duyệt, xem nhật ký kiểm toán (Audit Log) |
| **Lãnh đạo UBND** | Trần Đình Thắng | `chutich` | `123456` | Chủ tịch: Phê duyệt ký văn bản cấp cao nhất, chỉ đạo công văn đến, giao việc |
| **Lãnh đạo UBND** | Lê Thị Mai | `phochutich` | `123456` | Phó Chủ tịch: Thẩm định cấp 1, giao việc cán bộ, theo dõi tiến độ |
| **Cán bộ chuyên môn** | Phạm Hùng Cường | `canbo_vp` | `123456` | Văn phòng - Thống kê: Tiếp nhận CV đến, soạn văn bản, phát hành cấp số |
| **Cán bộ chuyên môn** | Hoàng Minh Tuấn | `canbo_dc` | `123456` | Địa chính - Xây dựng: Thụ lý phản ánh môi trường, xử lý văn bản quy hoạch |
| **Cán bộ chuyên môn** | Trần Thị Thu Hà | `canbo_tp` | `123456` | Tư pháp - Hộ tịch: Giải quyết cấp trích lục, hộ tịch trực tuyến |
| **Người dân** | Vũ Thị Lan | `nguoidan` | `123456` | Gửi yêu cầu, tra cứu tiến độ bằng Mã hồ sơ, đánh giá chất lượng phục vụ |

---

## 3. BA LUỒNG NGHIỆP VỤ CỐT LÕI

### Luồng 1: Công văn nội bộ nhiều cấp
1. **Soạn thảo:** Cán bộ vào mục "Soạn công văn", chọn loại văn bản (Quyết định, Kế hoạch, Tờ trình, Công văn...). Có sẵn các mẫu văn bản chuẩn.
2. **Lưu nháp & Kiểm tra:** Có thể lưu bản nháp hoặc chọn "Xem trước" theo chuẩn Quốc hiệu tiêu ngữ NĐ 30.
3. **Trình duyệt:** Cán bộ nhấn "Trình duyệt". Văn bản tự động vào hộp thư chờ duyệt của Lãnh đạo cấp 1.
4. **Phê duyệt nhiều cấp:**
   - Lãnh đạo mở công văn, xem tệp đính kèm.
   - Có thể chọn: **Phê duyệt**, **Yêu cầu chỉnh sửa** (bắt buộc nhập lý do), hoặc **Từ chối** (bắt buộc nhập lý do).
   - Tự động chuyển lên cấp duyệt tiếp theo (từ Phó Chủ tịch lên Chủ tịch).
5. **Phát hành chính thức:** Sau khi được phê duyệt hoàn tất, văn thư thực hiện phát hành. Hệ thống tự động cấp số chính thức theo quy tắc (ví dụ: `15/2026/QĐ-UBND`) kèm dấu mô phỏng và lưu vào sổ văn bản.

### Luồng 2: Tiếp nhận và xử lý yêu cầu trực tuyến
1. **Gửi yêu cầu:** Người dân vào cổng trực tuyến, điền thông tin và nội dung thuộc 7 nhóm phản ánh (môi trường, hạ tầng, hành chính...).
2. **Cấp mã hồ sơ:** Hệ thống tự động sinh Mã hồ sơ duy nhất (ví dụ: `HS-2026-00001`).
3. **Tiếp nhận & Phân công:** Cán bộ văn phòng tiếp nhận và phân công cho bộ phận chuyên môn.
4. **Xử lý & Cập nhật:** Cán bộ tiến hành kiểm tra, xử lý và cập nhật tiến độ (Đang xử lý, Chờ bổ sung, Đã giải quyết).
5. **Phản hồi chính thức:** Ghi nhận nội dung phản hồi, kết quả xử lý và tệp đính kèm.
6. **Người dân tra cứu & Đánh giá:** Người dân dùng Mã hồ sơ + Số điện thoại để tra cứu kết quả; sau khi có kết quả sẽ thực hiện **Đánh giá mức độ hài lòng về dịch vụ (1 đến 5 sao)**.

### Luồng 3: Đánh giá giao diện và trải nghiệm app (UI/UX Rating)
1. **Khảo sát:** Người dùng (cán bộ, lãnh đạo, người dân) mở mục "Đánh giá giao diện app" trên thanh điều hướng hoặc menu cá nhân.
2. **6 câu hỏi chuẩn:**
   - Q1: Độ đẹp của giao diện (Rất đẹp, Đẹp, Bình thường, Chưa đẹp, Khó sử dụng).
   - Q2: Khả năng tìm thấy chức năng (Rất dễ, Khá dễ, Bình thường, Khó tìm).
   - Q3: Độ dễ đọc của chữ và màu sắc (Rất tốt, Tốt, Bình thường, Cần cải thiện).
   - Q4: Tốc độ sử dụng (1 đến 5 sao).
   - Q5: Bố trí các mục công văn, yêu cầu, thông báo (1 đến 5 sao).
   - Q6: Đề xuất góp ý cải thiện giao diện.
3. **Phân tích thống kê:** Quản trị viên xem báo cáo tại trang "Thống kê đánh giá", tách riêng 2 nhóm (Chất lượng phục vụ & Giao diện app), có biểu đồ phân bố và xuất file CSV/Excel.

### Luồng 4: Phân hệ Quản trị Nhiệm vụ OKR/KPI & Trợ lý AI (HanoiWork)
1. **Cây dữ liệu 3 cấp:** Dự án (Chiến lược, Văn bản, Thường xuyên, Phát sinh) → Thư mục → Chương trình hành động → Nhiệm vụ & Nhiệm vụ con.
2. **Ràng buộc phân quyền RBAC:** Đơn vị chủ trì có quyền giao/nhận việc; Đơn vị phối hợp chỉ có quyền xem (Read-only); Mỗi nhiệm vụ chỉ có 1 người chủ trì duy nhất.
3. **Thuật toán tính điểm KPI trừ phạt theo tiến độ:**
   - $\text{SL giao quy đổi} = \text{SL giao} \times \text{Hệ số}$
   - $\text{SL hoàn thành thực tế quy đổi} = \text{Hệ số} \times \text{SL hoàn thành}$
   - $\text{Điểm KPI thực nhận} = \text{SL hoàn thành quy đổi} - (\text{Số ngày chậm}) \times 25\% \times (\text{SL hoàn thành quy đổi})$
4. **Trợ lý AI KPI Assistant (5 bước):** Đầu vào văn bản/Excel → Bóc tách danh mục → Chuẩn hóa hệ số → Rà soát tiêu chuẩn "6 Rõ" → Đánh giá thử & Trừ phạt → Phê duyệt xuất dữ liệu.
5. **Dashboard & AI Analytics:** 4 KPI Cards, 2 biểu đồ Donut, 2 biểu đồ Stacked Bar, Drawer Trợ lý AI phân tích rủi ro và Chatbot tương tác thời gian thực.

---

## 4. DANH SÁCH CÁC TRANG & PHÂN HỆ

1. **Trang đăng nhập & đăng ký (`#login`)**: Đăng nhập mật khẩu + Tạo tài khoản mới + Xem mật khẩu + Bộ chọn nhanh 1-click.
2. **Không gian làm việc HanoiWork (`#kpi-workspace`)**: Cây thư mục 3 cấp, quản lý nhiệm vụ, phân rã việc con, ủy quyền, nghiệm thu tính điểm KPI.
3. **Trợ lý AI KPI Assistant (`#kpi-assistant`)**: Quy trình Stepper 5 bước bóc tách kế hoạch và chuẩn hóa 6 Rõ.
4. **Dashboard OKR/KPI & AI Phân tích (`#kpi-dashboard`)**: Thống kê đa chiều, tiến độ, ma trận rủi ro và AI Chatbot.
5. **Trang tổng quan Dashboard (`#dashboard`)**: Thẻ KPI, biểu đồ Chart.js, việc cần làm theo vai trò.
6. **Trang công văn đến (`#doc-in`)**: Quản lý văn bản tiếp nhận, phân loại, tìm kiếm.
7. **Trang công văn đi (`#doc-out`)**: Bảng văn bản gửi đi, bộ lọc đa tiêu chí, huy hiệu trạng thái.
8. **Trang tạo & sửa công văn (`#doc-create`)**: Biểu mẫu soạn thảo kèm mẫu văn bản mẫu NĐ 30.
9. **Hộp thư phê duyệt (`#approval-inbox`)**: Các tab "Chờ tôi duyệt", "Đã duyệt", "Yêu cầu sửa" (hiển thị lý do sửa).
10. **Lịch sử phê duyệt (`#approval-history`)**: Dòng thời gian truy vết từng bước kiểm duyệt.
11. **Theo dõi nhiệm vụ (`#tasks`)**: Bảng giao việc, cập nhật tiến độ % (0-100%).
12. **Cổng gửi yêu cầu trực tuyến (`#citizen-portal`)**: Biểu mẫu công dân gửi phản ánh dễ sử dụng.
13. **Trang tra cứu hồ sơ (`#request-tracking`)**: Tra cứu bảo mật bằng mã hồ sơ + số điện thoại.
14. **Quản lý hồ sơ công dân (`#requests-manage`)**: Cán bộ tiếp nhận, xử lý, phân công hồ sơ.
15. **Đánh giá chất lượng phục vụ (`#service-rating`)**: Khảo sát hài lòng 1-5 sao sau khi có kết quả.
16. **Đánh giá giao diện app (`#app-rating`)**: Khảo sát 6 câu hỏi UI/UX với emoji và sao.
17. **Trang thống kê đánh giá (`#rating-stats`)**: Phân tích 2 nhóm A (Dịch vụ) & B (Giao diện), biểu đồ tròn/cột.
18. **Trang báo cáo (`#reports`)**: Báo cáo tổng hợp số liệu, xuất Excel/CSV, bản in chuẩn.
19. **Trung tâm thông báo (`#notifications`)**: Báo sự kiện phê duyệt, công văn mới, quá hạn.
20. **Quản lý người dùng (`#users`)**: Admin tạo tài khoản, đổi quyền, khóa/mở tài khoản.
21. **Quản lý vai trò & phân quyền (`#roles`)**: Ma trận phân quyền 4 nhóm vai trò.
22. **Cài đặt đơn vị (`#unit-settings`)**: Đổi tên xã, huyện, hotline, email, quy tắc số công văn.
23. **Quy trình phê duyệt (`#workflows`)**: Cấu hình 1 cấp, 2 cấp, 3 cấp theo loại văn bản.
24. **Nhật ký hoạt động (`#audit-logs`)**: Ghi nhận toàn bộ thao tác, tài khoản, IP, thời gian.

---

## 5. HƯỚNG DẪN KHỞI CHẠY VÀ SỬ DỤNG

### Bước 1: Khởi động máy chủ
Tại thư mục dự án `E:\baitap\ubnd-xa-dieu-hanh`, chạy:
```cmd
npm install
npm start
```
hoặc nhấp đúp vào file `start.bat`.

### Bước 2: Truy cập ứng dụng
Mở trình duyệt web (Chrome, Edge, Firefox):
```
http://localhost:3001
```

### Bước 3: Đăng nhập hoặc Tạo tài khoản
- Sử dụng tài khoản mẫu: `admin` (MK: `admin123`) hoặc `chutich`, `phochutich`, `canbo_vp`, `canbo_dc`, `nguoidan` (MK: `123456`).
- Hoặc bấm chuyển sang tab **"Tạo tài khoản mới"** để đăng ký tài khoản Công dân / Cán bộ xã riêng.
- Nhấp vào nút **"★ Reset Demo"** ở chân thanh điều hướng nếu muốn khôi phục lại dữ liệu mẫu ban đầu.
