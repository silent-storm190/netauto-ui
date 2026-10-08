# SwitchCE Initialize UI review cases

Bộ bản duyệt Interface cho luồng SwitchCE Initialize MN, bám theo 7 trạng thái của bộ OLT Initialize:

## Mockup tổng thể cho FE/DevNet

Mở `mockup.html` để xem bản mô phỏng tương tác của flow mới. Mockup dùng lại
toàn bộ token và component nền từ `review.css` nên giữ cùng DNA với OLT Init,
nhưng bổ sung các phần riêng của SwitchCE:

- Tạo kế hoạch chỉ yêu cầu tên kế hoạch, đồng bộ cách làm của OLT Initialize.
- Form nhập `switch_device`, POP, mode, model và thông tin switch cũ chỉ xuất
  hiện sau khi người dùng bấm `Cấp phát (Allocate)`.
- Chuyển qua lại giữa `new` và `replacement` ngay trong form cấp phát.
- Chuyển model mới giữa Huawei `HW63` và H3C `CH52` ngay trong form cấp phát.
- Minh họa gateway được backend tìm từ default route live, không giả định DI.
- Vòng đời replacement gồm config, chờ vật lý, kiểm tra trước chuyển Port,
  chuyển Port và rollback.
- Các vùng nội dung hai cột dùng tỷ lệ 50–50; thông tin đã nhập được trình bày
  ở dạng chỉ đọc sau khi cấp phát.

Ba file của mockup tổng thể là `mockup.html`, `mockup.css` và `mockup.js`.
Mockup chỉ thay đổi state ở trình duyệt, không gửi request hoặc chạm thiết bị.

| File | Trạng thái mô phỏng |
| --- | --- |
| `01_tao_ke_hoach_thanh_cong.html` | Tạo kế hoạch thành công, chưa chạy allocate |
| `02_cap_phat_thanh_cong.html` | Allocate thành công |
| `03_cap_phat_khong_thanh_cong.html` | Allocate thất bại do không đủ port phù hợp |
| `04_precheck_khong_thanh_cong.html` | Precheck thất bại do port uplink chưa UP/UP |
| `05_precheck_thanh_cong.html` | Precheck thành công |
| `06_config_khong_thanh_cong.html` | Config thất bại khi SwitchCE không kết nối được config FTP |
| `07_config_thanh_cong.html` | Config và đồng bộ Inventory/AutoSync/LLDP thành công |

## Dữ liệu dùng để review

Dữ liệu mặc định của mockup là case replacement đã chạy thành công đến trạng
thái `ready_for_cutover` ngày `25/09/2026`, gồm:

- Job `6ab5e6449a3b0d61eacfb8a0`, plan code
  `SWCE_INIT.2509260001`.
- Thay `CE701001VLGP00301HW57` (`11.64.81.31`) bằng
  `CE701001VLGP00302CH52` (`11.64.61.21`) tại POP `VLGP003`.
- Gateway/uplink: `DI701000VLGM00102HS64` (`11.64.11.2`), gateway SVI
  `11.64.61.1`.
- Hai link 10G: `Ten-GigabitEthernet1/0/23` ↔
  `XGigabitEthernet0/0/12` và `Ten-GigabitEthernet1/0/24` ↔
  `XGigabitEthernet1/0/12`.
- Aggregation: `Bridge-Aggregation32` phía SwitchCE và `Eth-Trunk9` phía
  uplink.
- Management VLAN `36`, PIM VLAN `61`, PPPoE VLAN reuse `1306`.
- Bootstrap IP `11.64.151.7`; firmware H3C đã ở release `R8337`.

Các giá trị DHCP bootstrap, optical power và kết quả lỗi là dữ liệu mô phỏng có chủ đích để biểu diễn đầy đủ các trạng thái UI.

## Cách xem

Mở trực tiếp một file HTML bằng trình duyệt. Bảy file dùng chung `review.css` và `review.js`, vì vậy cần giữ các file trong cùng thư mục.

Các nút thao tác chỉ hiển thị thông báo mô phỏng. Bộ review không gọi API, không kết nối thiết bị và không thực thi cấu hình thật.
