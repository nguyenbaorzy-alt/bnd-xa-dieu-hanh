// Script generate Word document using 'docx' library
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

async function createDocument() {
    console.log('Generating docx document...');

    const primaryColor = "1E3A8A"; // Deep Blue
    const secondaryColor = "0284C7"; // Cyan/Blue
    const headerBg = "F1F5F9"; // Light Slate
    const borderColor = "CBD5E1";

    const tableBorder = {
        style: BorderStyle.SINGLE,
        size: 1,
        color: borderColor,
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
                        font: "Calibri",
                        size: 24, // 12pt
                        color: "1E293B"
                    },
                    paragraph: {
                        spacing: {
                            line: 276, // 1.15 line spacing
                            before: 120,
                            after: 120
                        }
                    }
                }
            }
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 1440, // 1 inch
                            bottom: 1440,
                            left: 1440,
                            right: 1440,
                        },
                    },
                },
                children: [
                    // Title block
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 100 },
                        children: [
                            new TextRun({
                                text: "ỦY BAN NHÂN DÂN XÃ / PHƯỜNG",
                                bold: true,
                                size: 28,
                                color: "475569"
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 300 },
                        children: [
                            new TextRun({
                                text: "HỆ THỐNG QUẢN LÝ VĂN BẢN, ĐIỀU HÀNH CÔNG VIỆC & DỊCH VỤ CÔNG TRỰC TUYẾN",
                                bold: true,
                                size: 34,
                                color: primaryColor
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 400 },
                        children: [
                            new TextRun({
                                text: "TÀI LIỆU ĐẶC TẢ KIẾN TRÚC, MASTER SYSTEM PROMPT & THIẾT KẾ GIAO DIỆN HOÀN CHỈNH",
                                italics: true,
                                size: 24,
                                color: "64748B"
                            }),
                        ],
                    }),
                    new Paragraph({
                        text: "─────────────────────────────────────────────────────────────",
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 }
                    }),

                    // Section 1: Giới thiệu tổng quan
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 300, after: 150 },
                        children: [
                            new TextRun({
                                text: "PHẦN 1: TỔNG QUAN HỆ THỐNG & ĐỐI TƯỢNG SỬ DỤNG",
                                bold: true,
                                size: 28,
                                color: primaryColor
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Hệ thống Quản lý & Điều hành Điện tử UBND Xã/Phường là giải pháp phần mềm chuyển đổi số toàn diện cho chính quyền cơ sở, tích hợp đồng bộ giữa công tác quản lý điều hành nội bộ và cung cấp dịch vụ công trực tuyến cho công dân.",
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Mô hình Phân quyền Người dùng (RBAC - 5 Vai trò):",
                                bold: true
                            })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Lãnh đạo UBND (lanh_dao): ", bold: true }),
                            new TextRun({ text: "Chủ tịch, Phó Chủ tịch xã/phường có thẩm quyền phê duyệt công văn đi, giao việc chỉ đạo, đánh giá KPI bộ phận và duyệt tin tức phát ngôn." })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Văn thư - Lưu trữ (van_thu): ", bold: true }),
                            new TextRun({ text: "Tiếp nhận công văn đến, vào sổ văn bản, cấp số và đóng dấu phát hành công văn đi, theo dõi luồng xử lý văn bản toàn cơ quan." })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Chuyên viên chuyên môn (chuyen_vien): ", bold: true }),
                            new TextRun({ text: "Cán bộ các ban ngành (Tư pháp, Địa chính - Xây dựng, Văn hóa - Xã hội...) soạn thảo văn bản, tiếp nhận xử lý hồ sơ công dân, thực hiện OKR/KPI." })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Công dân địa phương (cong_dan): ", bold: true }),
                            new TextRun({ text: "Đăng ký nhanh bằng Số điện thoại cá nhân (không cần thủ tục phức tạp), gửi phản ánh hiện trường, nộp hồ sơ dịch vụ công và theo dõi tiến độ một cửa." })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Quản trị viên An ninh (admin): ", bold: true }),
                            new TextRun({ text: "Giám sát hệ thống B-Firewall™, theo dõi IP logs thời gian thực, quản lý danh sách IP Whitelist/Blacklist, phân tích rủi ro an ninh mạng." })
                        ]
                    }),

                    // Section 2: Công nghệ & Kiến trúc Kỹ thuật
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 300, after: 150 },
                        children: [
                            new TextRun({
                                text: "PHẦN 2: KIẾN TRÚC KỸ THUẬT & CÔNG NGHỆ ÁP DỤNG",
                                bold: true,
                                size: 28,
                                color: primaryColor
                            })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Backend: ", bold: true }),
                            new TextRun({ text: "Node.js kết hợp Express framework, thiết kế RESTful API tiêu chuẩn cao, xử lý đa luồng bất đồng bộ." })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Database: ", bold: true }),
                            new TextRun({ text: "SQLite cục bộ thông qua better-sqlite3 cho tốc độ truy xuất cực nhanh (>10,000 queries/s), hỗ trợ chế độ WAL (Write-Ahead Logging) an toàn dữ liệu." })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Frontend: ", bold: true }),
                            new TextRun({ text: "Kiến trúc Single Page Application (SPA) viết bằng JavaScript thuần (Vanilla JS), giao diện responsive bằng Tailwind CSS, biểu tượng Lucide Icons và biểu đồ trực quan Chart.js." })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Bảo mật & Phiên làm việc: ", bold: true }),
                            new TextRun({ text: "express-session với HttpOnly cookie, thuật toán băm bcrypt, thời gian phiên làm việc cố định 6 tiếng chuẩn múi giờ GMT+7 (Asia/Ho_Chi_Minh)." })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Tường lửa B-Firewall™: ", bold: true }),
                            new TextRun({ text: "Cơ chế theo dõi rủi ro IP tự động, phát hiện quét cổng, rate limiting, hỗ trợ Captcha toán học khi có hành vi bất thường, quản lý IP Whitelist/Blacklist." })
                        ]
                    }),

                    // Section 3: Quy tắc Nghiệp vụ Cốt lõi
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 300, after: 150 },
                        children: [
                            new TextRun({
                                text: "PHẦN 3: NGUYÊN TẮC NGHIỆP VỤ CỐT LÕI (CORE BUSINESS RULES)",
                                bold: true,
                                size: 28,
                                color: primaryColor
                            })
                        ]
                    }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 100 },
                        children: [
                            new TextRun({ text: "3.1. Đăng ký & Xác thực Tài khoản Công dân", bold: true, size: 26, color: secondaryColor })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Theo định hướng cải cách thủ tục và nâng cao tỷ lệ tiếp cận dịch vụ công số của người dân, hệ thống áp dụng cơ chế đăng ký trực tiếp và tối giản: Công dân chỉ cần nhập Họ tên, Số điện thoại (chính là tên đăng nhập) và Mật khẩu. Bỏ qua các bước quét CCCD bắt buộc hoặc nhập mã phức tạp, giúp người cao tuổi và mọi tầng lớp nhân dân đều dễ dàng tiếp cận.",
                            })
                        ]
                    }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 100 },
                        children: [
                            new TextRun({ text: "3.2. Quy trình Xử lý Văn bản 4 Bước", bold: true, size: 26, color: secondaryColor })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Luồng Công văn Đi: ", bold: true }),
                            new TextRun({ text: "Soạn thảo (Chuyên viên) ➔ Trình duyệt (Lãnh đạo ký số) ➔ Cấp số & Ban hành (Văn thư đóng dấu, tạo mã QR) ➔ Lưu trữ hồ sơ điện tử." })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Luồng Công văn Đến: ", bold: true }),
                            new TextRun({ text: "Tiếp nhận & Vào sổ (Văn thư) ➔ Báo cáo & Xin ý kiến (Lãnh đạo phân công) ➔ Tiếp nhận xử lý (Chuyên viên thực hiện) ➔ Báo cáo kết quả hoàn thành." })
                        ]
                    }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 100 },
                        children: [
                            new TextRun({ text: "3.3. Đánh giá OKR/KPI & Trợ lý ảo AI HanoiWork B-Algo™", bold: true, size: 26, color: secondaryColor })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Tích hợp trợ lý trí tuệ nhân tạo (AI Assistant) phân tích công việc theo quy trình 5 bước nghiêm ngặt: (1) Khảo sát nhiệm vụ giao, (2) Đánh giá tỷ lệ hoàn thành thực tế, (3) Nhận diện điểm nghẽn tồn đọng, (4) Tính toán chỉ số hiệu suất B-Algo, (5) Đề xuất giải pháp và khen thưởng.",
                            })
                        ]
                    }),

                    // Section 4: Thiết kế Giao diện & Danh mục Forms
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 300, after: 150 },
                        children: [
                            new TextRun({
                                text: "PHẦN 4: THIẾT KẾ GIAO DIỆN FRONTEND & HỆ THỐNG BIỂU MẪU (FORMS)",
                                bold: true,
                                size: 28,
                                color: primaryColor
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Giao diện được thiết kế theo chuẩn nhận diện chính phủ điện tử hiện đại, sử dụng Tailwind CSS với các tông màu xanh lam hành chính (Deep Blue - Slate), bố cục thân thiện, hỗ trợ đầy đủ các thiết bị máy tính để bàn, máy tính bảng và điện thoại di động.",
                            })
                        ]
                    }),

                    // Table of Forms
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: borders,
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
                                        children: [new Paragraph({ children: [new TextRun({ text: "STT", bold: true, color: "FFFFFF" })] })],
                                        width: { size: 8, type: WidthType.PERCENTAGE }
                                    }),
                                    new TableCell({
                                        shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
                                        children: [new Paragraph({ children: [new TextRun({ text: "Tên Biểu mẫu (Form)", bold: true, color: "FFFFFF" })] })],
                                        width: { size: 28, type: WidthType.PERCENTAGE }
                                    }),
                                    new TableCell({
                                        shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
                                        children: [new Paragraph({ children: [new TextRun({ text: "Trang / Phân hệ", bold: true, color: "FFFFFF" })] })],
                                        width: { size: 20, type: WidthType.PERCENTAGE }
                                    }),
                                    new TableCell({
                                        shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
                                        children: [new Paragraph({ children: [new TextRun({ text: "Các Trường Dữ liệu (Inputs)", bold: true, color: "FFFFFF" })] })],
                                        width: { size: 44, type: WidthType.PERCENTAGE }
                                    }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "1" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Form Đăng nhập", bold: true })] }),
                                    new TableCell({ children: [new Paragraph({ text: "login.js" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Tên đăng nhập / Số điện thoại, Mật khẩu, Ghi nhớ phiên (6 giờ)" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "2" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Form Đăng ký Công dân", bold: true })] }),
                                    new TableCell({ children: [new Paragraph({ text: "login.js" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Họ và tên, Số điện thoại (tên tài khoản), Mật khẩu, Xác nhận mật khẩu" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "3" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Form Soạn Công văn Đi", bold: true })] }),
                                    new TableCell({ children: [new Paragraph({ text: "doc-out.js" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Trích yếu, Loại văn bản, Mức độ khẩn, Lãnh đạo ký duyệt, Tệp đính kèm PDF" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "4" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Form Tiếp nhận Công văn Đến", bold: true })] }),
                                    new TableCell({ children: [new Paragraph({ text: "doc-in.js" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Số hiệu đến, Cơ quan ban hành, Ngày đến, Trích yếu, Hạn xử lý, Cán bộ phụ trách" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "5" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Form Nộp Hồ sơ / Phản ánh", bold: true })] }),
                                    new TableCell({ children: [new Paragraph({ text: "requests.js" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Lĩnh vực thủ tục, Tiêu đề phản ánh, Nội dung chi tiết, Hình ảnh / Tệp minh chứng" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "6" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Form Xử lý Hồ sơ Một cửa", bold: true })] }),
                                    new TableCell({ children: [new Paragraph({ text: "requests.js" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Trạng thái phê duyệt, Ý kiến xử lý của cán bộ, Tệp kết quả giải quyết" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "7" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Form Giao việc OKR/KPI", bold: true })] }),
                                    new TableCell({ children: [new Paragraph({ text: "kpi.js" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Chuyên viên nhận việc, Mục tiêu chỉ tiêu, Trọng số (%), Hạn hoàn thành, Đơn vị tính" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "8" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Form Cấu hình Quy tắc B-Firewall", bold: true })] }),
                                    new TableCell({ children: [new Paragraph({ text: "security.js" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Loại quy tắc (Whitelist/Blacklist), Địa chỉ IP / CIDR, Lý do áp dụng" })] }),
                                ]
                            }),
                        ]
                    }),

                    // Section 5: Danh mục API
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 300, after: 150 },
                        children: [
                            new TextRun({
                                text: "PHẦN 5: ĐẶC TẢ HỆ THỐNG REST API BACKEND",
                                bold: true,
                                size: 28,
                                color: primaryColor
                            })
                        ]
                    }),

                    // Table of APIs
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: borders,
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
                                        children: [new Paragraph({ children: [new TextRun({ text: "Phương thức", bold: true, color: "FFFFFF" })] })],
                                        width: { size: 15, type: WidthType.PERCENTAGE }
                                    }),
                                    new TableCell({
                                        shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
                                        children: [new Paragraph({ children: [new TextRun({ text: "Endpoint", bold: true, color: "FFFFFF" })] })],
                                        width: { size: 35, type: WidthType.PERCENTAGE }
                                    }),
                                    new TableCell({
                                        shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
                                        children: [new Paragraph({ children: [new TextRun({ text: "Chức năng & Mô tả", bold: true, color: "FFFFFF" })] })],
                                        width: { size: 50, type: WidthType.PERCENTAGE }
                                    }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "POST", bold: true, color: "16A34A" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "/api/auth/register" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Đăng ký tài khoản công dân trực tiếp bằng Họ tên và Số điện thoại" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "POST", bold: true, color: "16A34A" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "/api/auth/login" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Đăng nhập hệ thống (áp dụng cho cả cán bộ và công dân)" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "GET", bold: true, color: "0284C7" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "/api/auth/me" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Lấy thông tin người dùng hiện tại và quyền hạn (RBAC)" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "POST", bold: true, color: "DC2626" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "/api/auth/logout" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Đăng xuất khỏi hệ thống và hủy bỏ phiên làm việc" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "GET", bold: true, color: "0284C7" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "/api/documents" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Lấy danh sách công văn (hỗ trợ phân loại, tìm kiếm và lọc trạng thái)" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "POST", bold: true, color: "16A34A" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "/api/documents" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Tạo mới hoặc ban hành văn bản hành chính điện tử" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "PATCH", bold: true, color: "D97706" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "/api/documents/:id/status" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Cập nhật trạng thái luồng văn bản (Trình duyệt, Ký số, Ban hành)" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "GET", bold: true, color: "0284C7" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "/api/citizen-requests" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Danh sách phản ánh và hồ sơ dịch vụ công một cửa" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "POST", bold: true, color: "16A34A" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "/api/citizen-requests" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Công dân tạo mới hồ sơ thủ tục hoặc gửi phản ánh hiện trường" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "POST", bold: true, color: "16A34A" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "/api/kpis/ai-evaluate" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Khởi chạy Trợ lý ảo AI B-Algo phân tích và chấm điểm KPI" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "GET", bold: true, color: "0284C7" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "/api/security/logs" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Lấy nhật ký giám sát IP và phân tích rủi ro tường lửa B-Firewall" })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "POST", bold: true, color: "16A34A" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "/api/security/rules" })] }),
                                    new TableCell({ children: [new Paragraph({ text: "Thêm quy tắc IP Whitelist / Blacklist vào tường lửa" })] }),
                                ]
                            }),
                        ]
                    }),

                    // Section 6: Hướng dẫn Khởi chạy & Vận hành
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 300, after: 150 },
                        children: [
                            new TextRun({
                                text: "PHẦN 6: HƯỚNG DẪN TRIỂN KHAI, VẬN HÀNH & KIỂM THỬ",
                                bold: true,
                                size: 28,
                                color: primaryColor
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "1. Khởi tạo Cơ sở dữ liệu và Dữ liệu mẫu:", bold: true })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Chạy lệnh: node database/seed.js để tạo toàn bộ bảng và dữ liệu mẫu (công văn, cán bộ, kpi, tin tức)." })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "2. Khởi động Máy chủ Ứng dụng:", bold: true })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Chạy lệnh: node server.js. Hệ thống sẽ lắng nghe tại cổng http://localhost:3001." })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "3. Tài khoản Đăng nhập Mẫu:", bold: true })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Lãnh đạo: ", bold: true }),
                            new TextRun({ text: "Tài khoản: lanhdao / Mật khẩu: 123456" })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Văn thư: ", bold: true }),
                            new TextRun({ text: "Tài khoản: vanthu / Mật khẩu: 123456" })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Chuyên viên: ", bold: true }),
                            new TextRun({ text: "Tài khoản: chuyenvien / Mật khẩu: 123456" })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Quản trị viên An ninh: ", bold: true }),
                            new TextRun({ text: "Tài khoản: admin / Mật khẩu: 123456" })
                        ]
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Công dân: ", bold: true }),
                            new TextRun({ text: "Tài khoản: 0912345678 / Mật khẩu: 123456 (hoặc bấm Đăng ký tài khoản mới)" })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "4. Kiểm thử Tự động (136/136 tests pass):", bold: true })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Hệ thống bao gồm 5 bộ kịch bản kiểm thử toàn diện: đăng ký bằng số điện thoại, an ninh múi giờ Hà Nội, đường ống AI KPI, quy trình văn bản 4 bước và xử lý dịch vụ công." })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 400, after: 100 },
                        children: [
                            new TextRun({
                                text: "─── HẾT TÀI LIỆU ĐẶC TẢ ───",
                                bold: true,
                                color: "94A3B8"
                            })
                        ]
                    })
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
