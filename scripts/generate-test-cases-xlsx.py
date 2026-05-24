#!/usr/bin/env python3
"""Generate Car Marketplace test cases Excel matching docs/request template."""

from copy import copy
from pathlib import Path

from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Font, Side

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "docs/request/File mẫu test cases.xlsx"
OUTPUT = ROOT / "docs/request/Car-Marketplace-Test-Cases.xlsx"

TEST_CASES = [
    # --- Đăng nhập (UC13) ---
    (
        "Đăng nhập",
        "Đăng nhập thành công với tài khoản admin hợp lệ",
        "phone: 0386008099 (hoặc SUPERADMIN_PHONE trong .env), password: theo SUPERADMIN_PASSWORD",
        "1. Mở http://localhost:8080/login (hoặc web dev)\n2. Nhập SĐT và mật khẩu đúng\n3. Nhấn Đăng nhập",
        "HTTP 200; nhận JWT; chuyển trang admin/dashboard hoặc trang chủ; localStorage lưu token",
        "",
        "",
        "API: POST /api/v1/auth/login",
    ),
    (
        "Đăng nhập",
        "Đăng nhập thất bại — SĐT chưa đăng ký",
        "phone: 0999999999, password: BatKy@123",
        "1. Truy cập trang đăng nhập\n2. Nhập SĐT chưa tồn tại\n3. Nhấn Đăng nhập",
        "HTTP 404; mã lỗi PHONE_NOT_REGISTERED; gợi ý đăng ký",
        "",
        "",
        "",
    ),
    (
        "Đăng nhập",
        "Đăng nhập thất bại — sai mật khẩu",
        "phone: tài khoản đã đăng ký, password: sai",
        "1. Nhập SĐT hợp lệ, mật khẩu sai\n2. Nhấn Đăng nhập",
        "HTTP 401; mã WRONG_PASSWORD; hiển thị số lần thử còn lại",
        "",
        "",
        "",
    ),
    (
        "Đăng nhập",
        "Khóa tạm sau 5 lần sai mật khẩu",
        "Cùng SĐT; nhập sai mật khẩu 5 lần liên tiếp",
        "1. Thử đăng nhập sai 5 lần\n2. Thử đăng nhập lần 6",
        "Lần 5: HTTP 429 WRONG_PASSWORD_LOCKOUT; khóa 15 phút; lần 6 vẫn bị chặn",
        "",
        "",
        "",
    ),
    # --- Đăng ký (UC11) ---
    (
        "Đăng ký tài khoản",
        "Đăng ký showroom (seller) thành công qua OTP",
        "fullName, phone mới, password ≥8 ký tự, accountType: showroom, OTP đúng từ SMS/log dev",
        "1. Vào /register\n2. Nhập thông tin → Gửi OTP\n3. Nhập OTP đúng → Hoàn tất",
        "HTTP 200; tạo user role seller; freeListingCredits=3; trả JWT",
        "",
        "",
        "API: POST register/request-otp, verify-otp",
    ),
    (
        "Đăng ký tài khoản",
        "Đăng ký thất bại — SĐT đã tồn tại",
        "phone: đã đăng ký trước đó",
        "1. Đăng ký với SĐT trùng\n2. Gửi OTP",
        "HTTP 409 PHONE_ALREADY_USED; gợi ý đăng nhập",
        "",
        "",
        "",
    ),
    (
        "Đăng ký tài khoản",
        "Đăng ký thất bại — OTP sai",
        "OTP: 000000 (sai)",
        "1. Hoàn tất bước gửi OTP\n2. Nhập OTP sai",
        "HTTP 4xx; không tạo user; thông báo OTP không hợp lệ",
        "",
        "",
        "Cần Redis chạy cho OTP",
    ),
    (
        "Đăng ký tài khoản",
        "Gửi lại OTP khi đang pending (UC11 A3)",
        "phone đang trong phiên đăng ký chưa hết hạn",
        "1. Gửi OTP lần 1\n2. Nhấn Gửi lại OTP",
        "OTP mới được gửi; OTP cũ vô hiệu; TTL reset",
        "",
        "",
        "",
    ),
    # --- OTP / Reset MK (UC12) ---
    (
        "OTP / Khôi phục mật khẩu",
        "Gửi OTP xác thực SĐT (password_reset)",
        "phone: tài khoản tồn tại, purpose: password_reset",
        "1. Gọi POST /api/v1/auth/otp/send\n2. Kiểm tra OTP (log/SMS mock)",
        "HTTP 200; OTP TTL 120s (mặc định)",
        "",
        "",
        "",
    ),
    (
        "OTP / Khôi phục mật khẩu",
        "Hoàn tất đổi mật khẩu sau OTP",
        "passwordResetToken hợp lệ, newPassword mạnh",
        "1. verify OTP password_reset\n2. POST password-reset/complete",
        "HTTP 200; đăng nhập được bằng MK mới",
        "",
        "",
        "",
    ),
    # --- Danh sách & tìm kiếm tin ---
    (
        "Xem danh sách tin",
        "Tải trang chủ — danh sách tin đã duyệt",
        "Không cần đăng nhập",
        "1. Mở /\n2. Quan sát danh sách tin",
        "HTTP 200 GET /api/v1/listings?status=approved; hiển thị card tin",
        "",
        "",
        "",
    ),
    (
        "Tìm kiếm tin (UC2)",
        "Tìm kiếm theo từ khóa hợp lệ",
        "q: Toyota (hoặc từ khóa có trong DB)",
        "1. Nhập từ khóa ô tìm kiếm\n2. Thực hiện tìm",
        "Trả về danh sách tin khớp tiêu đề/mô tả",
        "",
        "",
        "GET /api/v1/listings/search",
    ),
    (
        "Tìm kiếm tin (UC2)",
        "Tìm kiếm — không có kết quả",
        "q: xyzkhongtontai123",
        "1. Tìm với từ khóa vô nghĩa",
        "HTTP 200; danh sách rỗng; UI thông báo không tìm thấy",
        "",
        "",
        "",
    ),
    (
        "Lọc tin (UC3)",
        "Lọc theo hãng xe và khoảng giá",
        "carMake, priceMin, priceMax hợp lệ",
        "1. Mở bộ lọc\n2. Chọn tiêu chí → Áp dụng",
        "Danh sách chỉ còn tin thỏa điều kiện",
        "",
        "",
        "GET /api/v1/listings/filter",
    ),
    (
        "Chi tiết tin (UC4)",
        "Xem chi tiết tin đang hiển thị",
        "listingId: tin status approved",
        "1. Click một tin trên trang chủ\n2. Mở /listings/:id",
        "HTTP 200; hiển thị giá, mô tả, ảnh, thông tin seller",
        "",
        "",
        "",
    ),
    (
        "Chi tiết tin (UC4)",
        "Xem tin không tồn tại / đã gỡ",
        "listingId: UUID không có hoặc đã xóa",
        "1. Truy cập URL tin invalid",
        "HTTP 404; thông báo tin không tồn tại",
        "",
        "",
        "",
    ),
    (
        "Liên hệ người bán (UC5)",
        "Xem số điện thoại người bán",
        "listingId hợp lệ",
        "1. Trang chi tiết tin\n2. Nhấn xem SĐT liên hệ",
        "HTTP 200 GET .../phone; trả SĐT hiển thị",
        "",
        "",
        "",
    ),
    # --- Yêu thích (UC8) ---
    (
        "Yêu thích tin",
        "Thêm tin vào danh sách yêu thích",
        "JWT buyer; listingId approved",
        "1. Đăng nhập buyer\n2. Chi tiết tin → Thêm yêu thích",
        "HTTP 201/200; tin xuất hiện tại /favorites",
        "",
        "",
        "POST .../favorite",
    ),
    (
        "Yêu thích tin",
        "Thêm yêu thích khi chưa đăng nhập",
        "Không có token",
        "1. Chưa login → nhấn yêu thích",
        "Chuyển login hoặc HTTP 401",
        "",
        "",
        "",
    ),
    (
        "Yêu thích tin",
        "Xóa tin khỏi yêu thích",
        "Tin đã có trong favorites",
        "1. Vào /favorites\n2. Bỏ yêu thích",
        "Tin biến mất khỏi danh sách",
        "",
        "",
        "DELETE .../favorite",
    ),
    # --- Đăng tin seller (UC16) ---
    (
        "Đăng tin xe",
        "Seller tạo tin mới — chờ duyệt",
        "JWT seller; title, description, priceVnd, ảnh, thông tin xe đầy đủ",
        "1. Đăng nhập seller\n2. /seller/listing/new\n3. Điền form → Gửi",
        "HTTP 201; status=pending; không hiện công khai cho đến khi admin duyệt",
        "",
        "",
        "POST /api/v1/listings",
    ),
    (
        "Đăng tin xe",
        "Tạo tin thiếu trường bắt buộc",
        "Bỏ trống title hoặc priceVnd",
        "1. Form đăng tin\n2. Gửi với trường trống",
        "HTTP 400 validation error",
        "",
        "",
        "",
    ),
    (
        "Đăng tin xe",
        "Người chưa đăng nhập truy cập trang đăng tin",
        "Không JWT",
        "1. Mở /seller/listing/new",
        "Redirect /login",
        "",
        "",
        "RequireAuth roles=seller",
    ),
    (
        "Gói đăng tin (UC18)",
        "Lấy danh sách gói basic/premium/vip",
        "Không bắt buộc auth",
        "1. Gọi GET /api/v1/listings/packages",
        "HTTP 200; trả 3 gói và giá",
        "",
        "",
        "",
    ),
    # --- Admin moderation (UC32) ---
    (
        "Kiểm duyệt tin (Admin)",
        "Admin duyệt tin pending",
        "JWT admin; listingId pending",
        "1. Đăng nhập admin\n2. /admin/moderation\n3. Duyệt tin",
        "status=approved; tin hiển thị trang chủ",
        "",
        "",
        "PATCH admin/moderation/:id/approve",
    ),
    (
        "Kiểm duyệt tin (Admin)",
        "Admin từ chối tin — có lý do",
        "listingId pending; rejectionReason",
        "1. Chọn từ chối\n2. Nhập lý do → Xác nhận",
        "status=rejected; seller nhận thông báo (nếu MQ bật)",
        "",
        "",
        "",
    ),
    (
        "Kiểm duyệt tin (Admin)",
        "User seller truy cập trang moderation",
        "JWT role seller",
        "1. Seller mở /admin/moderation",
        "Bị chặn (403 hoặc redirect)",
        "",
        "",
        "",
    ),
    (
        "Yêu cầu chỉnh sửa (UC33)",
        "Admin yêu cầu seller sửa tin",
        "listingId pending; nội dung yêu cầu sửa",
        "1. Admin chọn Yêu cầu chỉnh sửa\n2. Gửi chi tiết",
        "Ghi modificationRequest; event notification",
        "",
        "",
        "",
    ),
    # --- Báo cáo (UC10/35) ---
    (
        "Báo cáo vi phạm",
        "Người dùng báo cáo tin đăng",
        "listingId; reason; description",
        "1. Chi tiết tin → Báo cáo\n2. Chọn lý do, mô tả → Gửi",
        "HTTP 201; report status pending",
        "",
        "",
        "POST .../report",
    ),
    (
        "Báo cáo vi phạm",
        "Báo cáo thiếu mô tả / lý do",
        "description trống",
        "1. Gửi báo cáo không đủ dữ liệu",
        "HTTP 400 validation",
        "",
        "",
        "",
    ),
    (
        "Xử lý báo cáo (Admin UC35)",
        "Admin xử lý báo cáo — cảnh báo tài khoản",
        "reportId pending; action warn_account",
        "1. Admin mở danh sách report\n2. Xử lý → Cảnh báo",
        "Report resolved; warning ghi lịch sử UC36",
        "",
        "",
        "",
    ),
    # --- Thanh toán (UC28) ---
    (
        "Thanh toán gói tin",
        "Tạo đơn thanh toán gói premium/vip",
        "JWT seller; listingPackageType; listingId (tuỳ chọn)",
        "1. SellerOrders hoặc API\n2. POST /api/v1/payments/orders",
        "HTTP 201; order status pending; có orderId",
        "",
        "",
        "",
    ),
    (
        "Thanh toán gói tin",
        "Sinh mã VietQR cho đơn pending",
        "orderId pending",
        "1. POST .../orders/:id/vietqr",
        "Trả URL ảnh QR, transferContent, thời hạn",
        "",
        "",
        "",
    ),
    (
        "Thanh toán gói tin",
        "Webhook VietQR — hoàn tất thanh toán",
        "Payload webhook hợp lệ (dev sandbox)",
        "1. Mô phỏng POST webhook vietqr\n2. Kiểm tra order + listing",
        "Order success; queue listing_package.paid; packageType cập nhật trên tin",
        "",
        "",
        "Cần RabbitMQ cho consumer",
    ),
    (
        "Thanh toán gói tin",
        "Xem đơn không tồn tại",
        "orderId: UUID random",
        "1. GET /payments/orders/:id",
        "HTTP 404",
        "",
        "",
        "",
    ),
    (
        "Thanh toán gói tin",
        "Tạo đơn khi chưa đăng nhập",
        "Không Authorization header",
        "1. POST orders không token",
        "HTTP 401 Unauthorized",
        "",
        "",
        "",
    ),
    # --- Profile seller (UC15) ---
    (
        "Hồ sơ người bán",
        "Cập nhật thông tin showroom",
        "JWT seller; address, sellerDescription",
        "1. /profile\n2. Sửa mô tả, địa chỉ → Lưu",
        "HTTP 200; dữ liệu lưu DB",
        "",
        "",
        "PATCH /api/v1/auth/profile/seller",
    ),
    # --- So sánh / thống kê ---
    (
        "So sánh xe (UC7)",
        "So sánh tối đa 3 tin",
        "ids: 3 listingId approved",
        "1. Chọn 3 tin so sánh",
        "Trả bảng so sánh thuộc tính",
        "",
        "",
        "GET listings/compare",
    ),
    (
        "So sánh xe (UC7)",
        "So sánh quá 3 tin",
        "ids: 4+ listingId",
        "1. Gửi >3 id",
        "HTTP 400 — giới hạn 3 xe",
        "",
        "",
        "",
    ),
    (
        "Thống kê tin (UC20)",
        "Seller xem thống kê tin đăng",
        "JWT seller",
        "1. Gọi GET listings/stats hoặc statistics",
        "Trả viewCount, contactCount, v.v.",
        "",
        "",
        "",
    ),
    # --- Khóa tài khoản (UC37) ---
    (
        "Quản lý người dùng (Admin)",
        "Admin khóa tài khoản vi phạm",
        "userId; lockReason",
        "1. POST listings/admin/users/:id/lock",
        "adminLocked=true; user không login được",
        "",
        "",
        "",
    ),
    (
        "Đăng nhập",
        "Đăng nhập tài khoản bị admin khóa",
        "user adminLocked=true",
        "1. Nhập đúng MK tài khoản bị khóa",
        "HTTP 403 ACCOUNT_LOCKED_ADMIN; hiển thị lý do",
        "",
        "",
        "",
    ),
    # --- Dashboard doanh thu (UC40) ---
    (
        "Dashboard doanh thu",
        "Admin xem tổng quan doanh thu",
        "JWT admin hoặc gọi qua gateway",
        "1. /admin/dashboard\n2. Tải dữ liệu",
        "HTTP 200 GET /api/v1/admin/revenue/dashboard",
        "",
        "",
        "admin-service",
    ),
    # --- Health / hạ tầng ---
    (
        "Hệ thống",
        "Health check auth-service",
        "Không",
        "1. GET http://localhost:3001/api/health",
        "HTTP 200 OK",
        "",
        "",
        "Khi chạy local",
    ),
    (
        "Hệ thống",
        "API Gateway proxy listings",
        "Gateway :3000, listing-service chạy",
        "1. GET http://localhost:3000/api/v1/listings",
        "HTTP 200; không 502 Bad Gateway",
        "",
        "",
        "",
    ),
]


def style_header_row(ws, row: int, cols: int = 9):
    thin = Side(style="thin")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    font = Font(bold=True)
    for c in range(1, cols + 1):
        cell = ws.cell(row=row, column=c)
        cell.font = font
        cell.border = border
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)


def main():
    wb = load_workbook(TEMPLATE)
    ws = wb.active

    ws["B1"] = "Hệ thống Car Marketplace (Sàn giao dịch ô tô cũ)"
    ws["B3"] = "1"
    ws["C3"] = "(Điền MSSV)"
    ws["B4"] = "2"
    ws["C4"] = "(Điền MSSV)"
    ws["B5"] = "3"
    ws["C5"] = "(Điền MSSV)"
    ws["B6"] = "4"
    ws["C6"] = "(Điền MSSV)"
    ws["B7"] = "5"
    ws["C7"] = "(Điền MSSV)"
    ws["B8"] = "6"
    ws["C8"] = "(Điền MSSV)"
    ws["B9"] = "(Điền lớp / nhóm)"

    start_row = 11
    # Clear old sample data rows 12-20 if any
    for r in range(start_row, start_row + 80):
        for c in range(1, 10):
            ws.cell(row=r, column=c).value = None

    style_header_row(ws, start_row - 1)

    for i, tc in enumerate(TEST_CASES, start=1):
        row = start_row + i - 1
        func, desc, data_in, steps, expected, actual, status, note = tc
        ws.cell(row=row, column=1, value=i)
        ws.cell(row=row, column=2, value=func)
        ws.cell(row=row, column=3, value=desc)
        ws.cell(row=row, column=4, value=data_in)
        ws.cell(row=row, column=5, value=steps)
        ws.cell(row=row, column=6, value=expected)
        ws.cell(row=row, column=7, value=actual or "Chưa test")
        ws.cell(row=row, column=8, value=status or "Chưa test")
        ws.cell(row=row, column=9, value=note)
        for c in range(1, 10):
            ws.cell(row=row, column=c).alignment = Alignment(
                vertical="top", wrap_text=True
            )

    # Column widths
    widths = [6, 22, 28, 32, 36, 36, 18, 14, 24]
    from openpyxl.utils import get_column_letter

    for idx, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(idx)].width = w

    wb.save(OUTPUT)
    print(f"Wrote {len(TEST_CASES)} test cases to {OUTPUT}")


if __name__ == "__main__":
    main()
