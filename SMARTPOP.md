# SmartPOP · Giám sát & Cảnh báo chỉ đọc

Vào **Quản lý POP & Thiết bị → mở POP → Giám sát & Cảnh báo**, bật **Payload
tham chiếu**. Nguồn mặc định: **Bản ghi 172.18.86.217 · số đo & cảnh báo**.
Ba nguồn cấu hình OPMS 835 / 1097 / 2035 vẫn chọn xem được.

## Nguồn dữ liệu

Ba response /devicetypes chứa cấu hình thanh ghi, không chứa số đo:

| OPMS | ID cấu hình | Ngoại vi | Thanh ghi |
| --- | --- | --- | --- |
| 835 | 835 | PIN1/PIN2 PINCOSLIGHT, CAC, ENTES_1P | 198 |
| 1097 | 1104 | CAC, ENTES_1P, PIN1/PIN2 PINVISION | 232 |
| 2035 | 2035 | CAC, PIN1/PIN2 PINCOSLIGHT | 192 |

Capture Socket.IO có 20 event mqtt_message_response:
- OPMS_REPORT_INFO_POP: Gateway IP 172.18.86.217, TinkerBoardR2/v3.3, slave v1.6/v3.3.
- OPMS_REPORT_INFO_SENSOR / OPMS_REPORT_INFO_SENSOR_SORTED: cảm biến, quạt,
  các mã điều khiển/input/state và dòng điện nguồn.
- OPMS_REPORT_RS485_RUNTIME: CAC id=1, PIN1 id=6, PIN2 id=5.
- OPMS_REPORT_ALARM: 25 dịch vụ — 18 bình thường / 6 cảnh báo / 1 nghiêm trọng.
- OPMS_REPORT_TOTAL_CONSOLE: 2.

Định nghĩa OPMS 2035 khớp id/model/tên/số thanh ghi, chỉ dùng làm **schema
tham chiếu**, chưa xác nhận IP ↔ OPMS ↔ POP. Không tự ghép bản ghi vào POP
đang mở. Tắt Payload tham chiếu chỉ hiển thị binding đã xác nhận rõ ràng.
Không dùng số trong ảnh để điền giả, không lưu cookie/headers.

Đây là **bản ghi đã thu, không trực tiếp**. Chọn mới nhất theo cmd và ts, không
phụ thuộc thứ tự event. SENSOR và SORTED cùng thời điểm không cộng đôi; ưu tiên
SORTED khi ts bằng nhau. Mỗi nhóm có timestamp nguồn riêng, giờ Việt Nam.
Thời gian do thiết bị báo, không đảm bảo đồng bộ DevTools; không lấy giờ mở
trang làm giờ đo. firstUpdated=1 trong cấu hình không phải timestamp.

## UX

- Dải thống kê 4 mức có chữ/ký hiệu ngoài màu. Đếm từ alarm_code: 0/1/2 được
  xác nhận bằng tiền tố message trong capture; mã khác → Chưa xác định.
- Hàng thống kê và hàng bốn nhóm dùng chung biến grid: desktop 4 cột bằng
  nhau, gap 12px. Tới 1350px chuyển 2 cột, tới 700px 1 cột; hai hàng luôn
  dùng chung track/gap. Bỏ mũi tên ↗ trên cả thẻ thống kê và ngoại vi; nút
  native vẫn giữ hover/focus/aria-haspopup và thao tác mở popup.
- Palette riêng SmartPOP tham chiếu tool cũ: xanh lá #00c36a, vàng #ffc400,
  hồng đỏ #ff4262, cyan #00bbee, blue #1654ff, tím #914dff, xám trung tính.
  Dùng nền nhẹ và màu chữ đậm cùng tông để giữ độ rõ, có ink riêng dark mode.
  Icon hạ tầng theo trạng thái đã có, không đổi classifier/counter/backend.
- Bấm thẻ thống kê để mở native dialog đúng nhóm. Trang chính không dựng sẵn
  danh sách/thông báo cảnh báo. Popup desktop rộng 1180px (1320px màn lớn), có
  5 nhóm kể cả Tất cả, tìm kiếm có/không dấu và phân trang 10 dòng. Bảng giữ
  nguyên nội dung backend, tên dịch vụ gốc và last_check/last_change.
- Đóng bằng ×, Esc hoặc click backdrop; focus về thẻ mở, khóa cuộn nền và
  khôi phục khi đóng. Đổi nguồn/POP/render hoặc điều hướng đóng và xóa nội
  dung popup để tránh dữ liệu cũ. Nhóm 0 dịch vụ vẫn mở được trạng thái rỗng.
- Ba nhóm gọn: môi trường T1–T4/độ ẩm; quạt RPS/mức điều khiển; trạng thái
  cửa/đèn/điện lưới/máy phát/chống sét/chế độ. Không đoán vị trí lắp T1–T4.
- Ô nhiệt độ chuyển xanh → cam theo thang hiển thị 35–45 °C (clamp ngoài dải),
  theo yêu cầu trình bày; không phải ngưỡng cảnh báo thiết bị. Số đo gốc giữ
  nguyên, ô thiếu/sentinel/sai kiểu trung tính. T1–T4 12px/đậm 750. Nền/viền
  tươi hơn, chữ nhãn/số/đơn vị cùng tông với ô; dark mode dùng chữ sáng hơn.
  Tooltip phân biệt rõ thang màu và mức cảnh báo backend. Quạt 0 RPS không tự
  suy ra lỗi. Trạng thái tủ chỉ lấy token rõ ràng trong message backend, không
  giải mã input/mode/state/slave.error chưa có schema.
- Backend đồng thời báo OSN/VISION/COSLIGHT cho pin COSLIGHT, kết quả trái nhau:
  giữ từng dịch vụ kèm lưu ý trong popup; không lấy số từ message OSN thay
  telemetry PIN1. Số dịch vụ không phải số thiết bị lỗi.
- Bản ghi có một dải bốn nhóm: môi trường / quạt / hạ tầng / ngoại vi ở ngoài
  cùng bên phải. T1–T2 ở hàng trên, T3–T4 ở hàng dưới (2×2); quạt bốn dòng
  ngắn với icon/tên/RPS/% trên cùng dòng, môi trường/hạ tầng được thu gọn. Tablet
  hai cột, mobile một cột. Trang chính không dựng sẵn bảng ngoại vi: nhấn
  CAC/PIN1/PIN2 để mở native dialog 840px, cùng phong cách popup cảnh báo.
  Popup giữ chọn nhóm, tìm kiếm và phân trang 25 dòng; đơn vị ghép cạnh số.
  Đóng bằng ×/Esc/backdrop, trả focus về thẻ mở; đổi nguồn/POP/điều hướng
  đóng và xóa nội dung cũ. Hai popup dùng chung scroll-lock để xử lý đúng
  cả khi sự kiện close bị trình duyệt xếp hàng. Không đổi số đo/trạng thái.
  Nguồn PI (tên · IP) ở header được bọc tag riêng, không phải nhãn sức khỏe.
  Nguồn chỉ có cấu hình cũng dùng thẻ mở popup, không có bảng inline.
- Bảng tổng quan 6–7 dòng; chọn nhóm/cell/
  cấu hình/tất cả và tìm tiếng Việt có/không dấu, code hoặc địa chỉ. Tìm trong
  nhóm hiện chọn. Bảng dài phân trang 25 dòng.
- Tất cả định nghĩa đều xem được, kể cả isView thiếu/false. Hover nhãn xem
  biến/mô tả/địa chỉ/hàm/đơn vị gốc; bỏ gạch chân chấm trên nhãn. Hover số đo
  xem raw/lý do. Đã bỏ khối
  Thông tin kỹ thuật cảm biến & bộ giám sát và Chi tiết Modbus khỏi giao diện
  theo yêu cầu. Dữ liệu nguồn vẫn giữ nguyên trong model/fixture.
- Bảng số đo có hai cột: Thông số / Giá trị. Đơn vị ghép ngay cạnh số
  (44.5 °C, 53.09 V) với chữ nhỏ/dịu hơn. Không có đơn vị hợp lệ thì chỉ hiện
  giá trị; nhãn Cần xác minh nằm bên dưới. Đơn vị nguồn vẫn có ở hover.
- Responsive: nhóm/danh sách ngoại vi xếp dọc khi màn hình hẹp; native controls,
  không thêm framework, chart, hình thiết bị hoặc quạt quay.
- Icon SVG nét mảnh cho môi trường/quạt/hạ tầng và từng cửa/đèn/nguồn. Màu
  nhóm: ấm/xanh dương/xanh ngọc, là phân loại chứ không phải ngưỡng sức khỏe.
  Nền thẻ nhẹ, tag trạng thái và điểm nhấn ngoại vi theo loại; số đo không đổi.
  Layer 1 tận dụng chiều ngang tới 1920px, vẫn có layout hai/một cột responsive.
- Màu và status không phải chứng nhận sức khỏe toàn POP. Không có lệnh điều khiển.

## Giá trị và chất lượng dữ liệu

- Ghép id+model, kiểm tra tên và số thanh ghi trước khi nhận capture. Ghép giá
  trị theo **vị trí mảng cấu hình**, không dùng rid làm index. PINCOSLIGHT
  bắt đầu rid=1 nhưng phần tử đầu ở index 0; không suy PIN1/PIN2 từ id.
- Runtime đã có thập phân: giữ như bản tin, không nhân/chia unit lần nữa.
  PIN1 điện áp 53.09 V; CAC dàn bay hơi 44.5 °C trong bản tin cuối. Giữ nguyên
  hệ số nguồn và dtype để đối chiếu driver, chưa tự giải mã enum/bitmask.
- Giữ số 0. Mã 65535 hiển thị “—”, raw vẫn có ở hover, không coi là
  phép đo. PIN2 có message DISCONNECTED và toàn bộ 65535 → Mất kết nối / “—”.
- CAC 200 °C, độ ẩm 120% và 32767 có nhãn **Cần xác minh**, giữ raw, không
  đổi thành 0/hợp lệ. Đây là bảo vệ chất lượng hiển thị của capture hiện có,
  không phải ngưỡng cảnh báo thiết bị đã xác nhận.
- *C → °C, H → h, NA → —; không tự đổi mA thành A. Boolean rõ ràng → Có/Không;
  mã số enum vẫn là số. Nghĩa chưa rõ giữ mô tả gốc, ví dụ Gating alarm.

Tham chiếu UX: [không dùng màu đơn độc](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
và [thông báo trạng thái](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).
Không tuyên bố chứng nhận đầy đủ WCAG.

## Handoff FE

- shared/smartpop-config-responses.js: ba response cấu hình gốc.
- shared/smartpop-capture.js: 20 event gốc đã thu, không có credentials.
- shared/smartpop-model.js: nhãn/nhóm cấu hình, bảo toàn source.
- shared/smartpop-telemetry.js: parse/chọn mới nhất/ghép số đo.
- shared/smartpop-overview.js: tổng quan/cảnh báo/giá trị chỉ đọc.
- shared/smartpop-alarm-dialog.js: popup mức cảnh báo, search/paging, focus/scroll.
- shared/smartpop-workspace.js + .css: tương tác và binding vào Layer 1.

Sau xác thực/phân quyền và xác nhận ánh xạ POP ↔ OPMS ↔ IP:

```js
const api = window.NETAUTO_SMARTPOP;
api.loadConfiguration('POP_CODE', configurationResponse, opmsId);
api.loadSnapshot('POP_CODE', {frames: socketIoEvents}, '172.18.86.217');
// Cũng nhận text copy Messages: 42[event,body] + các cột phân cách tab.
// Trả {ok:true} hoặc {ok:false,message:'...'}.
```

loadSnapshot yêu cầu POP/IP đích rõ ràng và cấu hình đã ghép; từ chối IP,
id/model/tên/số thanh ghi lệch. Lỗi giữ binding cũ. Chỉ lưu trong bộ nhớ,
không localStorage. getView() có snapshot/sourceIP/reference để phân biệt nguồn.

Không gọi API/SSH/SNMP, không polling, không mở socket, không điều khiển/publish.
Giám sát trực tiếp cần adapter transport có xác thực và schema input/state/
error/sentinel đầy đủ; chưa triển khai trong bản này.

## Kiểm tra

```powershell
node mockup_ui/tests/smartpop.test.cjs
node mockup_ui/tests/smartpop-telemetry.test.cjs
node mockup_ui/tests/pop-layer0.test.cjs
node mockup_ui/tests/service-checking.test.cjs
```

Logic/DOM mô phỏng: fixture, đổi nguồn/ngoại vi/nhóm, các timestamp, không
double-scale, missing/zero/suspect, invalid update, XSS và cách ly POP.
**Chưa kiểm tra trực quan bằng trình duyệt**; cần visual/accessibility QA trước production.
