// Script generate Word document (.docx) chuẩn phông chữ Times New Roman (Nghị định 30/2020/NĐ-CP)
const fs = require('fs');
const path = require('path');
const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    AlignmentType,
    ShadingType
} = require('docx');

const FONT_NAME = "Times New Roman";
const PRIMARY_COLOR = "1E3A8A";   // Xanh dương đậm hành chính
const SECONDARY_COLOR = "0369A1"; // Xanh ngọc chính quyền
const TEXT_COLOR = "1E293B";      // Xám đen đậm dễ đọc
const BORDER_COLOR = "CBD5E1";

// Helper tạo TextRun chuẩn phông Times New Roman và chuẩn hóa Unicode NFC
function r(text, options = {}) {
    return new TextRun({
        text: String(text).normalize('NFC'),
        font: FONT_NAME,
        size: options.size || 26, // 13pt
        color: options.color || TEXT_COLOR,
        bold: options.bold || false,
        italics: options.italics || false,
        ...options
    });
}

// Helper tạo Paragraph chuẩn khoảng cách và canh lề
function p(children, options = {}) {
    return new Paragraph({
        spacing: {
            line: 276, // 1.15 line spacing
            before: options.before !== undefined ? options.before : 80,
            after: options.after !== undefined ? options.after : 80
        },
        alignment: options.alignment || AlignmentType.LEFT,
        bullet: options.bullet || undefined,
        heading: options.heading || undefined,
        children: Array.isArray(children) ? children : [children]
    });
}

async function createDocument() {
    console.log('Generating docx document with Times New Roman standard font...');

    const tableBorder = {
        style: BorderStyle.SINGLE,
        size: 1,
        color: BORDER_COLOR,
    };

    const borders = {
        top: tableBorder,
        bottom: tableBorder,
        left: tableBorder,
        right: tableBorder,
        insideHorizontal: tableBorder,
        insideVertical: tableBorder,
    };

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: FONT_NAME,
                        size: 26, // 13pt chuẩn văn bản
                        color: TEXT_COLOR
                    },
                    paragraph: {
                        spacing: {
                            line: 276, // 1.15
                            before: 80,
                            after: 80
                        }
                    }
                },
                heading1: {
                    run: {
                        font: FONT_NAME,
                        size: 32, // 16pt
                        bold: true,
                        color: PRIMARY_COLOR
                    },
                    paragraph: {
                        spacing: { before: 240, after: 120 }
                    }
                },
                heading2: {
                    run: {
                        font: FONT_NAME,
                        size: 28, // 14pt
                        bold: true,
                        color: SECONDARY_COLOR
                    },
                    paragraph: {
                        spacing: { before: 180, after: 80 }
                    }
                },
                heading3: {
                    run: {
                        font: FONT_NAME,
                        size: 26, // 13pt
                        bold: true,
                        color: "334155"
                    },
                    paragraph: {
                        spacing: { before: 140, after: 60 }
                    }
                }
            }
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 1440,    // 1 inch = 2.54 cm
                            bottom: 1440,
                            left: 1440,
                            right: 1440,
                        },
                    },
                },
                children: [
                    // Tiêu ngữ Quốc hiệu / Cơ quan ban hành
                    p([
                        r("ỦY BAN NHÂN DÂN XÃ / PHƯỜNG", { bold: true, size: 26, color: "475569" }),
                    ], { alignment: AlignmentType.CENTER, before: 100, after: 60 }),

                    p([
                        r("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", { bold: true, size: 26, color: "0F172A" }),
                    ], { alignment: AlignmentType.CENTER, before: 0, after: 40 }),

                    p([
                        r("Độc lập - Tự do - Hạnh phúc", { bold: true, size: 26, italics: true, color: "0F172A" }),
                    ], { alignment: AlignmentType.CENTER, before: 0, after: 200 }),

                    p([
                        r("--------------------------------------------------", { color: "94A3B8" })
                    ], { alignment: AlignmentType.CENTER, before: 0, after: 200 }),

                    // Tiêu đề tài liệu
                    p([
                        r("HỆ THỐNG QUẢN LÝ VĂN BẢN, ĐIỀU HÀNH CÔNG VIỆC & DỊCH VỤ CÔNG TRỰC TUYẾN", {
                            bold: true,
                            size: 34,
                            color: PRIMARY_COLOR
                        }),
                    ], { alignment: AlignmentType.CENTER, before: 100, after: 80 }),

                    p([
                        r("TÀI LIỆU ĐẶC TẢ KIẾN TRÚC, MASTER SYSTEM PROMPT & THIẾT KẾ GIAO DIỆN HOÀN CHỈNH", {
                            italics: true,
                            size: 24,
                            color: "64748B"
                        }),
                    ], { alignment: AlignmentType.CENTER, before: 0, after: 300 }),

                    // ==========================================
                    // PHẦN 1
                    // ==========================================
                    p([
                        r("PHẦN 1: TỔNG QUAN HỆ THỐNG & PHÂN QUYỀN NGƯỜI DÙNG", { bold: true, size: 28, color: PRIMARY_COLOR })
                    ], { heading: HeadingLevel.HEADING_1 }),

                    p([
                        r("Hệ thống Quản lý & Điều hành Điện tử UBND Xã/Phường là giải pháp phần mềm chuyển đổi số toàn diện cho chính quyền cơ sở, tích hợp đồng bộ giữa công tác quản lý điều hành nội bộ và cung cấp dịch vụ công trực tuyến cho công dân.")
                    ]),

                    p([
                        r("Hệ thống phân quyền nghiêm ngặt theo mô hình RBAC với 5 vai trò nghiệp vụ:", { bold: true })
                    ]),

                    p([
                        r("1. Lãnh đạo UBND (lanh_dao): ", { bold: true }),
                        r("Chủ tịch, Phó Chủ tịch xã/phường có thẩm quyền phê duyệt công văn đi, giao việc chỉ đạo, đánh giá KPI bộ phận và duyệt tin tức phát ngôn chính thống.")
                    ], { bullet: { level: 0 } }),

                    p([
                        r("2. Văn thư - Lưu trữ (van_thu): ", { bold: true }),
                        r("Tiếp nhận công văn đến, vào sổ văn bản, cấp số và đóng dấu phát hành công văn đi, theo dõi luồng xử lý văn bản toàn cơ quan.")
                    ], { bullet: { level: 0 } }),

                    p([
                        r("3. Chuyên viên chuyên môn (chuyen_vien): ", { bold: true }),
                        r("Cán bộ các ban ngành (Tư pháp, Địa chính - Xây dựng, Văn hóa - Xã hội...) soạn thảo văn bản, tiếp nhận xử lý hồ sơ công dân, thực hiện các chỉ tiêu OKR/KPI được giao.")
                    ], { bullet: { level: 0 } }),

                    p([
                        r("4. Công dân địa phương (cong_dan): ", { bold: true }),
                        r("Đăng ký tài khoản nhanh chóng chỉ bằng Số điện thoại cá nhân (không bắt buộc CCCD phức tạp), gửi phản ánh hiện trường, nộp hồ sơ dịch vụ công và theo dõi tiến độ giải quyết một cửa trực tuyến.")
                    ], { bullet: { level: 0 } }),

                    p([
                        r("5. Quản trị viên An ninh (admin): ", { bold: true }),
                        r("Giám sát hệ thống B-Firewall, theo dõi IP logs thời gian thực, quản lý danh sách IP Whitelist/Blacklist, phân tích và ngăn chặn các mối đe dọa an ninh mạng.")
                    ], { bullet: { level: 0 } }),

                    // ==========================================
                    // PHẦN 2
                    // ==========================================
                    p([
                        r("PHẦN 2: KIẾN TRÚC KỸ THUẬT & CÔNG NGHỆ ÁP DỤNG", { bold: true, size: 28, color: PRIMARY_COLOR })
                    ], { heading: HeadingLevel.HEADING_1 }),

                    p([
                        r("Hệ thống được xây dựng trên nền tảng công nghệ tối ưu hóa, đảm bảo hiệu năng cao và độ ổn định liên tục:")
                    ]),

                    p([
                        r("• Backend: ", { bold: true }),
                        r("Node.js kết hợp Express framework, thiết kế RESTful API tiêu chuẩn cao, xử lý bất đồng bộ đa luồng.")
                    ]),

                    p([
                        r("• Cơ sở dữ liệu: ", { bold: true }),
                        r("SQLite cục bộ thông qua better-sqlite3 cho tốc độ truy xuất cực nhanh (trên 10,000 queries/giây), hỗ trợ chế độ WAL (Write-Ahead Logging) an toàn dữ liệu.")
                    ]),

                    p([
                        r("• Frontend: ", { bold: true }),
                        r("Kiến trúc Single Page Application (SPA) viết bằng JavaScript thuần (Vanilla JS), giao diện responsive bằng Tailwind CSS, hệ thống biểu tượng Lucide Icons và biểu đồ trực quan hóa dữ liệu Chart.js.")
                    ]),

                    p([
                        r("• Bảo mật & Quản lý Phiên: ", { bold: true }),
                        r("Sử dụng express-session với cookie bảo mật HttpOnly, thuật toán băm mật khẩu bcryptjs. Thời hạn phiên đăng nhập được cố định an toàn 6 tiếng chuẩn theo múi giờ Hà Nội (GMT+7 - Asia/Ho_Chi_Minh).")
                    ]),

                    p([
                        r("• Tường lửa B-Firewall: ", { bold: true }),
                        r("Cơ chế theo dõi rủi ro IP tự động ở mỗi yêu cầu, phát hiện quét cổng, rate limiting, hỗ trợ Captcha toán học khi phát hiện hành vi bất thường, quản lý IP Whitelist và Blacklist trực tiếp từ giao diện quản trị.")
                    ]),

                    // ==========================================
                    // PHẦN 3
                    // ==========================================
                    p([
                        r("PHẦN 3: NGUYÊN TẮC NGHIỆP VỤ CỐT LÕI (CORE BUSINESS RULES)", { bold: true, size: 28, color: PRIMARY_COLOR })
                    ], { heading: HeadingLevel.HEADING_1 }),

                    p([
                        r("3.1. Đăng ký & Xác thực Tài khoản Công dân", { bold: true, size: 26, color: SECONDARY_COLOR })
                    ], { heading: HeadingLevel.HEADING_2 }),

                    p([
                        r("Nhằm nâng cao tỷ lệ tiếp cận dịch vụ công trực tuyến của người dân địa phương, hệ thống áp dụng cơ chế đăng ký trực tiếp và tối giản: Công dân chỉ cần nhập Họ tên, Số điện thoại (chính là tên đăng nhập) và Mật khẩu. Bỏ qua các bước quét thẻ CCCD hoặc OTP phức tạp ở bước đăng ký ban đầu, giúp người cao tuổi và mọi tầng lớp nhân dân đều dễ dàng tạo tài khoản và nộp hồ sơ.")
                    ]),

                    p([
                        r("3.2. Quy trình Xử lý Văn bản 4 Bước", { bold: true, size: 26, color: SECONDARY_COLOR })
                    ], { heading: HeadingLevel.HEADING_2 }),

                    p([
                        r("• Luồng Công văn Đi: ", { bold: true }),
                        r("Soạn thảo (Chuyên viên) -> Trình duyệt (Lãnh đạo ký số) -> Cấp số & Ban hành (Văn thư đóng dấu số, sinh mã QR tra cứu) -> Lưu trữ hồ sơ điện tử.")
                    ]),

                    p([
                        r("• Luồng Công văn Đến: ", { bold: true }),
                        r("Tiếp nhận & Vào sổ (Văn thư) -> Báo cáo & Xin ý kiến (Lãnh đạo phân công phụ trách) -> Tiếp nhận xử lý (Chuyên viên thực hiện) -> Báo cáo kết quả hoàn thành.")
                    ]),

                    p([
                        r("3.3. Đánh giá OKR/KPI & Trợ lý ảo AI HanoiWork B-Algo", { bold: true, size: 26, color: SECONDARY_COLOR })
                    ], { heading: HeadingLevel.HEADING_2 }),

                    p([
                        r("Tích hợp trợ lý trí tuệ nhân tạo (AI Assistant) phân tích công việc theo quy trình 5 bước nghiêm ngặt: (1) Khảo sát nhiệm vụ được giao, (2) Đánh giá tỷ lệ hoàn thành thực tế, (3) Nhận diện điểm nghẽn tồn đọng, (4) Tính toán chỉ số hiệu suất B-Algo dựa trên trọng số công việc, (5) Đề xuất giải pháp và biểu dương khen thưởng.")
                    ]),

                    // ==========================================
                    // PHẦN 4
                    // ==========================================
                    p([
                        r("PHẦN 4: THIẾT KẾ GIAO DIỆN FRONTEND & HỆ THỐNG BIỂU MẪU (FORMS)", { bold: true, size: 28, color: PRIMARY_COLOR })
                    ], { heading: HeadingLevel.HEADING_1 }),

                    p([
                        r("Giao diện được thiết kế theo chuẩn nhận diện chính quyền điện tử hiện đại, sử dụng Tailwind CSS với các tông màu xanh lam hành chính (Deep Blue - Slate), bố cục thân thiện, hỗ trợ tối ưu trên máy tính để bàn, máy tính bảng và điện thoại di động.")
                    ]),

                    p([
                        r("Bảng tổng hợp chi tiết các Biểu mẫu (Forms) trong toàn bộ hệ thống:", { bold: true })
                    ]),

                    // Bảng biểu mẫu
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: borders,
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                                        children: [p([r("STT", { bold: true, color: "FFFFFF" })], { alignment: AlignmentType.CENTER })],
                                        width: { size: 8, type: WidthType.PERCENTAGE }
                                    }),
                                    new TableCell({
                                        shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                                        children: [p([r("Tên Biểu mẫu (Form)", { bold: true, color: "FFFFFF" })])],
                                        width: { size: 28, type: WidthType.PERCENTAGE }
                                    }),
                                    new TableCell({
                                        shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                                        children: [p([r("Tệp Giao diện", { bold: true, color: "FFFFFF" })])],
                                        width: { size: 20, type: WidthType.PERCENTAGE }
                                    }),
                                    new TableCell({
                                        shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                                        children: [p([r("Các Trường Dữ liệu Nhập (Inputs)", { bold: true, color: "FFFFFF" })])],
                                        width: { size: 44, type: WidthType.PERCENTAGE }
                                    }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("1")], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("Form Đăng nhập", { bold: true })])] }),
                                    new TableCell({ children: [p([r("login.js")])] }),
                                    new TableCell({ children: [p([r("Tên đăng nhập / Số điện thoại, Mật khẩu, Ghi nhớ phiên làm việc (6 giờ)")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("2")], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("Form Đăng ký Công dân", { bold: true })])] }),
                                    new TableCell({ children: [p([r("login.js")])] }),
                                    new TableCell({ children: [p([r("Họ và tên, Số điện thoại (tên tài khoản), Mật khẩu, Xác nhận mật khẩu")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("3")], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("Form Soạn Công văn Đi", { bold: true })])] }),
                                    new TableCell({ children: [p([r("doc-out.js")])] }),
                                    new TableCell({ children: [p([r("Trích yếu, Loại văn bản, Mức độ khẩn, Lãnh đạo ký duyệt, Tệp đính kèm PDF")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("4")], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("Form Tiếp nhận Công văn Đến", { bold: true })])] }),
                                    new TableCell({ children: [p([r("doc-in.js")])] }),
                                    new TableCell({ children: [p([r("Số hiệu văn bản đến, Cơ quan ban hành, Ngày đến, Trích yếu, Hạn xử lý, Cán bộ phụ trách")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("5")], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("Form Nộp Hồ sơ / Phản ánh", { bold: true })])] }),
                                    new TableCell({ children: [p([r("requests.js")])] }),
                                    new TableCell({ children: [p([r("Lĩnh vực thủ tục, Tiêu đề phản ánh, Nội dung chi tiết, Hình ảnh / Tệp tài liệu minh chứng")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("6")], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("Form Xử lý Hồ sơ Một cửa", { bold: true })])] }),
                                    new TableCell({ children: [p([r("requests.js")])] }),
                                    new TableCell({ children: [p([r("Trạng thái phê duyệt (Duyệt/Từ chối), Ý kiến xử lý của cán bộ, Tệp kết quả giải quyết")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("7")], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("Form Giao việc OKR/KPI", { bold: true })])] }),
                                    new TableCell({ children: [p([r("kpi.js")])] }),
                                    new TableCell({ children: [p([r("Chuyên viên nhận việc, Mục tiêu chỉ tiêu, Trọng số (%), Hạn hoàn thành, Đơn vị tính")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("8")], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("Form Cấu hình Quy tắc B-Firewall", { bold: true })])] }),
                                    new TableCell({ children: [p([r("security.js")])] }),
                                    new TableCell({ children: [p([r("Loại quy tắc (Whitelist/Blacklist), Địa chỉ IP / CIDR, Lý do áp dụng quy tắc")])] }),
                                ]
                            }),
                        ]
                    }),

                    // ==========================================
                    // PHẦN 5
                    // ==========================================
                    p([
                        r("PHẦN 5: ĐẶC TẢ HỆ THỐNG REST API BACKEND", { bold: true, size: 28, color: PRIMARY_COLOR })
                    ], { heading: HeadingLevel.HEADING_1 }),

                    p([
                        r("Danh mục các điểm cuối (endpoints) giao tiếp dữ liệu giữa Client và Server:")
                    ]),

                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: borders,
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                                        children: [p([r("Phương thức", { bold: true, color: "FFFFFF" })], { alignment: AlignmentType.CENTER })],
                                        width: { size: 16, type: WidthType.PERCENTAGE }
                                    }),
                                    new TableCell({
                                        shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                                        children: [p([r("Điểm cuối (Endpoint)", { bold: true, color: "FFFFFF" })])],
                                        width: { size: 34, type: WidthType.PERCENTAGE }
                                    }),
                                    new TableCell({
                                        shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
                                        children: [p([r("Chức năng & Mô tả Nghiệp vụ", { bold: true, color: "FFFFFF" })])],
                                        width: { size: 50, type: WidthType.PERCENTAGE }
                                    }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("POST", { bold: true, color: "16A34A" })], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("/api/auth/register")])] }),
                                    new TableCell({ children: [p([r("Đăng ký tài khoản công dân trực tiếp bằng Họ tên và Số điện thoại")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("POST", { bold: true, color: "16A34A" })], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("/api/auth/login")])] }),
                                    new TableCell({ children: [p([r("Đăng nhập hệ thống (áp dụng chung cho cả cán bộ và công dân)")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("GET", { bold: true, color: "0284C7" })], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("/api/auth/me")])] }),
                                    new TableCell({ children: [p([r("Lấy thông tin người dùng hiện tại và kiểm tra quyền hạn (RBAC)")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("POST", { bold: true, color: "DC2626" })], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("/api/auth/logout")])] }),
                                    new TableCell({ children: [p([r("Đăng xuất khỏi hệ thống và hủy bỏ phiên làm việc")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("GET", { bold: true, color: "0284C7" })], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("/api/documents")])] }),
                                    new TableCell({ children: [p([r("Lấy danh sách công văn (hỗ trợ phân loại, tìm kiếm và lọc trạng thái)")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("POST", { bold: true, color: "16A34A" })], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("/api/documents")])] }),
                                    new TableCell({ children: [p([r("Tạo mới hoặc ban hành văn bản hành chính điện tử")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("PATCH", { bold: true, color: "D97706" })], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("/api/documents/:id/status")])] }),
                                    new TableCell({ children: [p([r("Cập nhật trạng thái luồng văn bản (Trình duyệt, Ký số, Ban hành)")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("GET", { bold: true, color: "0284C7" })], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("/api/citizen-requests")])] }),
                                    new TableCell({ children: [p([r("Danh sách phản ánh và hồ sơ dịch vụ công một cửa")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("POST", { bold: true, color: "16A34A" })], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("/api/citizen-requests")])] }),
                                    new TableCell({ children: [p([r("Công dân nộp hồ sơ thủ tục hoặc gửi phản ánh hiện trường mới")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("POST", { bold: true, color: "16A34A" })], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("/api/kpis/ai-evaluate")])] }),
                                    new TableCell({ children: [p([r("Khởi chạy Trợ lý ảo AI B-Algo phân tích và chấm điểm KPI")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("GET", { bold: true, color: "0284C7" })], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("/api/security/logs")])] }),
                                    new TableCell({ children: [p([r("Lấy nhật ký giám sát IP và phân tích rủi ro an ninh B-Firewall")])] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p([r("POST", { bold: true, color: "16A34A" })], { alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [p([r("/api/security/rules")])] }),
                                    new TableCell({ children: [p([r("Thêm quy tắc IP Whitelist / Blacklist vào tường lửa")])] }),
                                ]
                            }),
                        ]
                    }),

                    // ==========================================
                    // PHẦN 6
                    // ==========================================
                    p([
                        r("PHẦN 6: HƯỚNG DẪN TRIỂN KHAI, VẬN HÀNH & KIỂM THỬ", { bold: true, size: 28, color: PRIMARY_COLOR })
                    ], { heading: HeadingLevel.HEADING_1 }),

                    p([
                        r("1. Khởi tạo Cơ sở dữ liệu & Nạp dữ liệu mẫu:", { bold: true })
                    ]),
                    p([
                        r("Chạy lệnh: node database/seed.js để tự động khởi tạo toàn bộ bảng, cấu trúc khóa ngoại và nạp dữ liệu mẫu cho hệ thống.")
                    ]),

                    p([
                        r("2. Khởi động Máy chủ Ứng dụng:", { bold: true })
                    ]),
                    p([
                        r("Chạy lệnh: node server.js. Hệ thống sẽ khởi động và sẵn sàng phục vụ tại địa chỉ http://localhost:3001.")
                    ]),

                    p([
                        r("3. Danh mục Tài khoản Đăng nhập Kiểm thử Mẫu:", { bold: true })
                    ]),
                    p([
                        r("• Lãnh đạo UBND: ", { bold: true }),
                        r("Tài khoản: lanhdao / Mật khẩu: 123456")
                    ]),
                    p([
                        r("• Bộ phận Văn thư: ", { bold: true }),
                        r("Tài khoản: vanthu / Mật khẩu: 123456")
                    ]),
                    p([
                        r("• Chuyên viên chuyên môn: ", { bold: true }),
                        r("Tài khoản: chuyenvien / Mật khẩu: 123456")
                    ]),
                    p([
                        r("• Quản trị viên An ninh: ", { bold: true }),
                        r("Tài khoản: admin / Mật khẩu: 123456")
                    ]),
                    p([
                        r("• Công dân: ", { bold: true }),
                        r("Tài khoản: 0912345678 / Mật khẩu: 123456 (hoặc bấm nút Đăng ký tài khoản trên giao diện)")
                    ]),

                    p([
                        r("4. Bộ Kiểm thử Tự động (136/136 test cases đạt 100%):", { bold: true })
                    ]),
                    p([
                        r("Hệ thống bao gồm 5 kịch bản kiểm thử tự động toàn diện: đăng ký bằng số điện thoại, an ninh kiểm tra IP và múi giờ GMT+7, đường ống AI đánh giá OKR/KPI, luồng công văn 4 bước và xử lý hồ sơ dịch vụ công.")
                    ]),

                    p([
                        r("--------------------------------------------------", { color: "94A3B8" })
                    ], { alignment: AlignmentType.CENTER, before: 300, after: 100 }),

                    p([
                        r("HẾT TÀI LIỆU ĐẶC TẢ", { bold: true, color: "94A3B8" })
                    ], { alignment: AlignmentType.CENTER, before: 0, after: 100 })
                ]
            }
        ]
    });

    const buffer = await Packer.toBuffer(doc);
    const outputPath = path.resolve('E:/baitap/ubnd-xa-dieu-hanh/Tai_Lieu_Dac_Ta_He_Thong_UBND_Xa_Phuong.docx');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Successfully generated document at: ${outputPath}`);
}

createDocument().catch(err => {
    console.error('Error generating docx:', err);
    process.exit(1);
});
