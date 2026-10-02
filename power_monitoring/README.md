# Power Device Monitoring UI review cases

Bộ giao diện tĩnh để FE và DevNet review contract, trạng thái và cách hiển thị
evidence cho luồng Power Device Monitoring MN. Thiết kế dùng cùng ngôn ngữ giao
diện với OLT Initialize: topbar sáng, progress bốn bước, card kết quả và badge
trạng thái. Mở `mockup.html` để chuyển nhanh qua bảy case; mockup không gọi API,
database hoặc thiết bị thật.

Flow mới không yêu cầu chọn POP. Người dùng chọn trực tiếp OLT GCOM từ danh sách
được lọc theo quyền; backend suy ra POP/branch. Mockup cho phép đổi OLT ở case
đầu tiên.

| File | Trạng thái |
| --- | --- |
| `01_tao_ke_hoach_thanh_cong.html` | Tạo job thành công, chờ Allocate |
| `02_cap_phat_thanh_cong.html` | Allocate và giữ ba reservation thành công |
| `03_cap_phat_khong_thanh_cong.html` | Không còn port OLT phù hợp |
| `04_precheck_khong_thanh_cong.html` | LLDP live không khớp allocation |
| `05_precheck_thanh_cong.html` | SNMP/SSH/topology đều sẵn sàng |
| `06_config_khong_thanh_cong.html` | Post-check OLT thất bại, cần rollback snapshot |
| `07_config_thanh_cong.html` | Config, verify và commit thành công |

Fixture review dùng nguyên Allocate response thực tế của OLT `AGGP01304GC16`:
POP `AGGP013`, nguồn `AGGP01302PWDE1U` (`11.67.248.15`), port `e1/4`, switch
`CE701003AGGP01301HW63`, uplink `Eth-Trunk32`, downlink `Eth-Trunk4`, VLAN 44
và management gateway `DI701001AGGM00103HS64` (`11.67.11.3`). Payload fixture
tuân theo Allocate contract mới với field `POP` viết hoa và giá trị đã ghép
`province + pop` (`AGG` + `P013` = `AGGP013`); không còn field `pop` rút gọn.
Fixture vẫn giữ đầy đủ dữ liệu kỹ thuật, nhưng UI không phơi bày reservation owner,
thời điểm hết hạn dạng ISO hoặc source nội bộ `lldp_upstream`.

Topology chỉ vẽ `OLT e1/4 → Nguồn` vì Allocate response hiện chỉ trả tên
Eth-Trunk logic trên switch, không có interface vật lý ở cả hai đầu liên kết.
Gateway và switch vẫn có card chi tiết; gateway dùng duy nhất nhãn
`MANAGEMENT GATEWAY`. Khi contract bổ sung port peer hai đầu, topology mới nên
mở rộng lại để tránh vẽ một đường kết nối không đủ dữ liệu.

Information architecture bám trực tiếp OLT Initialize: progress card, thông tin
chung, bảng điều khiển vận hành, allocation split-view (device cards + topology),
hai result card Pre-check/Config và Allocate dialog. Các case chỉ thay state,
không dùng một dashboard layout riêng cho Power Monitoring.

Case Config hiển thị đúng section order như execution log:
`config.switch → config.switch_verify → config.olt → config.verify →
config.commit`. Đây là bằng chứng UI rằng VLAN đã được trunk và xác nhận trên
switch trước khi workflow cấu hình port giám sát OLT.

API phục vụ selector là `POST /netauto/ops_flow/power_monitoring/olt-options`.
Allocate gửi `olt_device`, `power_model` và optional `job_id`; không gửi
`power_pop`.
