# Bandwidth Upgrade UI review cases

Bộ review dùng cùng ngôn ngữ giao diện với OLT Initialize: nền sáng, card có
header cố định, progress 4 bước, allocation + topology ở cùng một khối và hai
result card đặt song song trên desktop.

Mở `review.html` để xem case config thất bại giống tình huống ảnh đầu vào.
Bảy file đánh số bao phủ toàn bộ vòng đời:

1. Tạo kế hoạch thành công
2. Cấp phát thành công
3. Cấp phát không thành công
4. Precheck không thành công
5. Precheck thành công
6. Config không thành công
7. Config thành công

UI dùng `details` schema 2.0 mô tả trong `../UI_MAPPING.md`. Các note tương
thích trong mockup nhắc rõ nguồn field mới và field legacy vẫn được giữ.

