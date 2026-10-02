# NetAuto UI mockup

Mở `index.html` để xem mockup tổng thể của nền tảng NetAuto.

## Phạm vi hiện tại

- App shell bám screenshot production: global rail, global toolbar và Portal Vận hành.
- Hai module chính: `Quản lý POP và Thiết bị` và `Quản lý Nghiệp vụ`.
- Module POP dùng số tổng từ screenshot production; tên POP, hostname, IP,
  model và vendor trong drawer lấy từ snapshot `data_devices_pop.json`
  ngày 28/08/2026.
- Module Nghiệp vụ chứa các subpage Kế hoạch, OLT Initialize,
  SwitchCE Initialize, Bandwidth Upgrade, Switch Stack Join và Power Monitoring.
- Các subpage tái sử dụng trực tiếp những bộ `ui_review_case` mới nhất.

## File vào chính

- `index.html`: portal tổng thể, mở được trực tiếp bằng trình duyệt.
- `shared/netauto-shell.css`: layout và design token của portal tổng thể.
- `shared/netauto-data.js`: dữ liệu production tham chiếu và snapshot mẫu.
- `shared/netauto-app.js`: điều hướng, lọc POP, drawer thiết bị và subpage nghiệp vụ.

Toàn bộ dữ liệu hiển thị hiện là dữ liệu mô phỏng. Các màn hình sẽ tiếp tục
được hiệu chỉnh theo screenshot production của từng nhóm nghiệp vụ.
