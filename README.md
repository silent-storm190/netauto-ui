# NetAuto UI mockup

Mở `index.html` để xem mockup tổng thể của nền tảng NetAuto.

## Phạm vi hiện tại

- App shell bám screenshot production: global rail, global toolbar và Portal Vận hành.
- Hai module chính: `Quản lý POP và Thiết bị` và `Quản lý Nghiệp vụ`.
- Module POP dùng toàn bộ dữ liệu thật từ `data-full.json` do người dùng cung cấp:
  3.910 POP, 19.070 thiết bị, 63 tỉnh và 69 chi nhánh. Các tổng số được tính
  trực tiếp từ dữ liệu, không dùng số thống kê cũ trong screenshot.
- Danh sách có phân trang 36 / 72 / 144 POP, tìm kiếm và thống kê trên toàn bộ
  kết quả lọc. POP có nhiều chi nhánh được giữ nguyên và lọc theo từng chi nhánh.
- Màu thẻ Layer 0: nhiều tỉnh thì mỗi tỉnh một màu cố định; chỉ một tỉnh thì mọi
  POP dùng chung một màu nhẹ. Màu chung được chọn lại khi vào Layer 0 hoặc tải
  lại trang, tránh trùng lần trước; tìm kiếm / lọc / phân trang không đổi màu
  chung trong cùng lần xem. Màu chỉ để phân nhóm, không thể hiện trạng thái POP.
- Chi tiết POP là trang Layer 1; chọn thiết bị mở trang Layer 2. Inventory được
  tải riêng theo POP đang mở, hỗ trợ cả mở file HTML trực tiếp và static hosting.
- Module Nghiệp vụ chứa các subpage Kế hoạch, OLT Initialize,
  SwitchCE Initialize, Bandwidth Upgrade, Switch Stack Join và Power Monitoring.
- Các subpage tái sử dụng trực tiếp những bộ `ui_review_case` mới nhất.

## File vào chính

- `index.html`: portal tổng thể, mở được trực tiếp bằng trình duyệt.
- `shared/netauto-shell.css`: layout và design token của portal tổng thể.
- `shared/netauto-data.js`: dữ liệu mẫu cho kế hoạch / nghiệp vụ. Dữ liệu POP
  chỉ lấy từ nguồn thật trong `netauto-pop-index.js`, không còn danh sách POP mẫu.
- `shared/netauto-pop-index.js`: toàn bộ POP, metadata thiết bị và thống kê thật.
- `shared/netauto-pop-store.js`: nạp inventory theo POP, có cache và báo lỗi tải.
- `shared/pop-data/`: inventory của đủ 3.910 POP; cần giữ nguyên thư mục này khi
  bàn giao FE hoặc đưa bản mockup lên static hosting.
- `shared/netauto-pop-detail.js`, `shared/netauto-device-detail.js`: trang POP / thiết bị.
- `shared/netauto-pop-reference.js`: mẫu tài sản, topo và phần tham chiếu từ ảnh production.
- `shared/netauto-app.js`: điều hướng, lọc / phân trang POP và subpage nghiệp vụ.

## Dữ liệu và giới hạn

Nguồn có 17.190 thiết bị chứa inventory, 1.880 thiết bị không có inventory.
Đã giữ đủ 240.118 bản ghi chassis / module, gồm module quang, card, quạt, nguồn,
rectifier và routing engine nếu nguồn có. Số lượng `inventory.count` được giữ
nguyên; không tự tạo bản ghi để bù cho chênh lệch giữa count và danh sách module.
Phân loại thiết bị ưu tiên `function` vì nguồn có nhiều `deviceType: UNKNOWN`.
Hai thiết bị PI không có tên IPMS / OPMS được thống kê riêng là “PI khác”.

File nguồn có 21 giá trị Infinity / NaN không hợp lệ theo JSON chuẩn. Bộ nhập
chuyển các giá trị này thành `null` trong bản xuất dùng cho trình duyệt; không
sửa file gốc. Mã SHA-256 của nguồn được lưu trong `NETAUTO_DATA.snapshot`.

Theo yêu cầu duyệt bố cục, Layer 1 dùng ví dụ giả lập cho loại POP, ngày triển
khai, chức năng, số khách hàng và địa chỉ khi nguồn thiếu. Các ví dụ được tạo
ổn định theo mã POP, chỉ dùng ở lớp hiển thị và có nhãn “trường giả lập”; không
ghi vào snapshot, không thay thế giá trị thật (kể cả số 0) nếu có.
Nguồn chưa có telemetry PI, liên kết LLDP hay bảng tài sản POP. Những mục này
để trống hoặc ghi rõ “mẫu tham chiếu”, không dùng mẫu như dữ liệu thật của POP
đang mở. Công cụ chưa kết nối production.
Snapshot chứa IP và serial thật: chỉ chia sẻ / triển khai ở nơi có quyền truy cập
phù hợp, không mặc định công khai.

## Cập nhật snapshot

Chạy từ thư mục dự án, truyền đường dẫn file dữ liệu mới:

```powershell
node --max-old-space-size=4096 mockup_ui/scripts/import-pop-data.cjs "C:/Users/minhb/OneDrive/Desktop/data-full.json"
```

Bộ nhập tạo index và inventory từng POP trong `shared/`. Bàn giao toàn bộ
`mockup_ui/` để giữ đầy đủ tài nguyên và các màn hình nghiệp vụ.

## Kiểm tra

```powershell
node mockup_ui/tests/pop-layer0.test.cjs
node --max-old-space-size=4096 mockup_ui/tests/pop-data.test.cjs "C:/Users/minhb/OneDrive/Desktop/data-full.json"
```

Kiểm tra dữ liệu có thể chạy không truyền file nguồn để đối chiếu index với đủ
3.910 file inventory. Các bài kiểm tra giao diện thực thi controller thật trong
môi trường DOM mô phỏng, không thay thế kiểm tra hiển thị bằng trình duyệt.
