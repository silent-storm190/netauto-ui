# NetAuto UI mockup

Mở `index.html` để xem mockup tổng thể của nền tảng NetAuto.

## Phạm vi hiện tại

- App shell bám screenshot production: global rail, global toolbar và Portal Vận hành.
- Hai module chính: `Quản lý POP và Thiết bị` và `Quản lý Nghiệp vụ`.
- Module POP dùng toàn bộ dữ liệu thật từ `get-device-by-pop-1791453967439.json` do người dùng cung cấp:
  3.898 POP, 19.197 thiết bị, 59 tỉnh và 65 chi nhánh. Các tổng số được tính
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
- `shared/pop-data/`: inventory của đủ 3.898 POP trong snapshot mới; cần giữ nguyên thư mục này khi
  bàn giao FE hoặc đưa bản mockup lên static hosting.
- `shared/netauto-pop-detail.js`, `shared/netauto-device-detail.js`: trang POP / thiết bị.
- `shared/netauto-device-port-models.js`: ánh xạ model, bank/slot và telemetry port.
- `shared/netauto-device-ports.js`, `shared/netauto-device-ports.css`: quản lý port Layer 2.
- `shared/netauto-pop-reference.js`: mẫu tài sản, topo và phần tham chiếu từ ảnh production.
- `shared/netauto-app.js`: điều hướng, lọc / phân trang POP và subpage nghiệp vụ.

## Dữ liệu và giới hạn

Nguồn có 17.217 thiết bị chứa inventory, 1.980 thiết bị không có inventory.
Đã giữ đủ 245.229 bản ghi chassis / module, gồm module quang, card, quạt, nguồn,
rectifier và routing engine nếu nguồn có. Số lượng `inventory.count` được giữ
nguyên; không tự tạo bản ghi để bù cho chênh lệch giữa count và danh sách module.
Phân loại thiết bị ưu tiên `function` vì nguồn có nhiều `deviceType: UNKNOWN`.
Hai thiết bị PI không có tên IPMS / OPMS được thống kê riêng là “PI khác”.

File nguồn có 19 giá trị Infinity / NaN không hợp lệ theo JSON chuẩn. Bộ nhập
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
node --max-old-space-size=4096 mockup_ui/scripts/import-pop-data.cjs "C:/Users/minhb/OneDrive/Desktop/get-device-by-pop-1791453967439.json"
```

Bộ nhập tạo index và inventory từng POP trong `shared/`. Bàn giao toàn bộ
`mockup_ui/` để giữ đầy đủ tài nguyên và các màn hình nghiệp vụ.

## Kiểm tra

```powershell
node mockup_ui/tests/pop-layer0.test.cjs
node mockup_ui/tests/device-ports.test.cjs
node --max-old-space-size=4096 mockup_ui/tests/pop-data.test.cjs "C:/Users/minhb/OneDrive/Desktop/get-device-by-pop-1791453967439.json"
```

Kiểm tra dữ liệu có thể chạy không truyền file nguồn để đối chiếu index với đủ
3.898 file inventory đang được tham chiếu. Các bài kiểm tra Interface thực thi controller thật trong
môi trường DOM mô phỏng, không thay thế kiểm tra hiển thị bằng trình duyệt.

## Layer 2 · Thiết bị có port

Thông tin cơ bản và tag thống kê port UP/DOWN/chưa rõ, transceiver, card, quạt,
nguồn đặt trên cùng; bên dưới là Quản lý Port / Vật tư thiết bị. UI Port / Interface
dùng lại stylesheet và bố cục của `device-port-workspace.html`: mặt trước chassis,
stack hiển thị từng member, khung thông tin port + bộ chọn công cụ mở bên dưới.
Nhấn lại port đang chọn hoặc × để đóng, nhấn chuột phải hoặc ⋮ trong khung công cụ
để mở menu. Hai chế độ “Giả lập” (mặt trước thiết bị) / “Mô phỏng” (các nhóm port)
dùng chung thanh chuyển chế độ,
bộ lọc và tìm kiếm ở phía trên; chuyển chế độ giữ nguyên bộ lọc và port đang chọn.
Mô phỏng chia nhóm theo Giả lập, tự tính số port/hàng theo chiều rộng thực tế, hiển thị
tên port thay vì chỉ số thứ tự, không có nút ⋮ hay dòng trạng thái trên từng ô.
Ô port cao khoảng 36 px gồm viền trên desktop, nút tối thiểu 40 px trên màn hình hẹp;
chiều rộng không giãn quá 110 px, khoảng cách 6 px, đệm nhóm 11 px. Vùng đổi chế độ
không làm điểm neo cuộn của trình duyệt để hạn chế nhảy trang.
Trạng thái dùng nền/viền tươi nhẹ: UP xanh lá, DOWN cam,
không module xám chấm bi nhỏ (có nền sạch ngay sau tên để không che chữ), chưa rõ
xanh lam viền nét đứt. Chỉ đổi palette trong chế độ Mô phỏng, không đổi màu mặt trước.
Hover/tên đầy đủ và nhãn trợ năng
vẫn cung cấp trạng thái. Giả lập là mặc định khi chưa có lựa chọn; chế độ được nhớ
trên trình duyệt khi chuyển thiết bị, đặt lại bộ lọc hoặc tải lại trang.
Viền nhóm port tăng nhẹ độ tương phản trong cả light/dark. Mở topo fade/slide
220 ms, backdrop fade 180 ms; khung thông tin/công cụ port fade/slide 180 ms,
menu 140 ms, kết quả công cụ 150 ms. Chỉ dùng opacity/transform, không animate
chiều cao hay tự cuộn; tôn trọng prefers-reduced-motion. Đổi cùng công cụ hoặc
nạp lại snapshot không phát lại hiệu ứng kết quả.
Các bank được xếp theo bố cục mặt trước: port dịch vụ bên trái, uplink bên phải,
cùng hàng khi đủ chỗ; nhóm nhỏ dùng ít cột thay vì chiếm cả chiều ngang.
Không còn điều kiện/breakpoint sửa riêng cho GCOM, Huawei, H3C hay từng ảnh.
Mọi model dùng cùng planner dựa trên bank/card/member và độ dài tên port.
OLT modular giữ hai track card như Giả lập; nếu có hai PON + hai uplink thì
thành 2×2. Không tạo vùng trống/card giả nếu inventory thiếu bank.
Khung thiết bị dùng hết chiều ngang, nhãn vendor/model và member ở phía trên.
Port dùng chung chiều rộng trong mỗi unit và giới hạn 110px. Chỉ giảm số cột
hoặc tách hàng khi không đủ chỗ cho tên port; màn hình rộng có thể giữ nguyên
24 cột của Giả lập thay vì buộc bank 48 port luôn xuống hàng.
Stack tách theo member, không trộn các member; màn hình hẹp tự xuống hàng.
Nút quay lại nổi ở góc trên trái của vùng nội dung, cách mép trên 12 px (dưới
thanh công cụ portal), khi nút đầu trang khuất khỏi
màn hình, áp dụng Layer 1/2. Dùng chính thao tác lui hiện tại để giữ bộ lọc/trạng
thái; cập nhật vị trí khi cuộn, thu sidebar hoặc fullscreen, ẩn ở Layer 0.
Tìm kiếm/lọc làm mờ port không khớp nhưng
không xoá vị trí trên chassis. Sơ đồ chỉ mô phỏng theo bank/slot, không thay thế
faceplate hay sơ đồ đấu nối vật lý chuẩn của hãng.
Mọi bank/member dùng chung chiều rộng ô port (54–86 px theo vùng hiển thị) và
chiều cao 35 px; nhóm ít port không giãn lớn riêng. Màn hình hẹp cuộn ngang.

- PON: Transceiver (Rx/Tx), CRC, khách hàng, tập điểm. LACP hiện nhưng vô hiệu
  vì không áp dụng trực tiếp cho Interface PON quang.
- NNI: Transceiver (Rx/Tx), CRC, LACP, đổi speed. CRC/LACP/khách hàng/tập điểm
  chưa có dữ liệu trong snapshot nên không tạo kết quả giả. Đổi speed chỉ xem
  trước, không đổi snapshot hay gửi lệnh tới thiết bị.
- Giữ cả port có module `null`. Có module không suy ra UP; module `null`
  không suy ra DOWN. Rx/Tx `null` để “—”, số 0 vẫn hiển thị 0. Tên H3C có
  ký tự xuống dòng được làm sạch khi hiển thị, tên gốc vẫn nằm trong snapshot.
- H3C CH52/CH53/CV52/CV53 ánh xạ đúng S6520X-30HF/54HF-EI; số thành viên IRF
  lấy theo inventory, không theo giả định hai chassis. `typeDev: HUAWEI` trong
  danh mục cũ là bucket driver, không phải vendor của thiết bị H3C.
- GC08/GC16: GL5610-08P/16P, 8/16 PON + 4 GE combo + 2 10GE; combo tính
  một interface, không nhân đôi. Vị trí từ profile chưa có telemetry để trạng
  thái chưa rõ và được đánh dấu là profile.
- ZA62 (C620) và HA58 (MA5800-X2) theo card/port quan sát trong inventory.
  ZA61 (C610) có biến thể 8/16 PON nên không tự chọn biến thể. ZA63 (C620H)
  nhận diện theo danh mục nhưng chưa có profile phần cứng xác minh. HA51
  (MA5801-FL16-H1) có profile minh hoạ 16 Flex-PON + 4 GE/10GE. Ba model
  ZA61/ZA63/HA51 chưa xuất hiện trong snapshot mới; không thêm thiết bị giả.

Đối chiếu: [Datasheet GCOM GL5610](https://gcom.ge/products/108/f_5f414e132b054.pdf),
[H3C S6520X-EI](https://www.h3c.com/en/Products_and_Solutions/InterConnect/Switches/Products/Campus_Network/Aggregation/S6500/H3C_S6520X-EI/),
[ZTE C610](https://www.zte.com.cn/global/product_index/optical_access_en/pon-olt/zxa10/zxa10-c610.html),
[Huawei MA5800](https://carrier.huawei.com/en/products/fixed-network/access/OLT/smart-ng-olt-ma5800),
[Huawei MA5801-FL16](https://e.huawei.com/de/products/optical-access/ma5801-fl16).

Bản standalone `device-port-workspace.html` giữ nguyên để tham chiếu thiết kế;
Layer 2 chính dùng chung `device-port-workspace.css`, tái sử dụng model engine
Huawei, bố cục faceplate/tool dock và nạp trạng thái từ snapshot thật thay vì
inventory giả lập của bản standalone. Đèn SYS/PWR chưa có dữ liệu nên để “—”.

### Bố trí port dùng chung cho FE

`shared/netauto-device-port-models.js` cung cấp hàm thuần
`NETAUTO_PORT_MODELS.listRows(layout, unit, availableWidth)`. Không có nhánh
riêng cho từng mã model trong hàm bố trí này. `layout` là kết quả `build(device)`;
`unit` lấy từ `layout.hardware.units`, cũng chính là nguồn dựng **Giả lập**.
`availableWidth` là chiều rộng bên trong khung thiết bị, tính bằng px.

- Giữ nguyên thứ tự bank/card/member và port của Giả lập. Nếu đủ chỗ, giữ
  cả số cột gốc. Với chassis modular, giữ hai track card như Giả lập.
- Khi thiếu chỗ: chassis nhỏ có thể giảm số port mỗi hàng để giữ uplink bên
  phải; bank dày sẽ dùng hàng riêng, uplink xuống dưới. Số cột giảm theo
  các mức 24/16/12/8/4/2/1, không làm mất tên port hoặc tự thêm card.
- Kết quả mỗi hàng gồm `groups` (tham chiếu dữ liệu gốc), `kind`, `banks`
  (`id`, `columns`, `width`) và `portWidth` dùng chung trong một unit.
  Các bank phủ đủ chiều rộng khung; tile port tối đa 110px, không kéo giãn
  port ít số lượng thành các ô quá lớn.
- Controller đo `devicePortBanks.clientWidth` và trừ 26px padding/border
  của khung unit. `ResizeObserver` tính lại khi đổi mode, sidebar hoặc
  kích thước vùng nội dung. CSS không ghi đè số cột bằng breakpoint riêng.
- Bộ lọc chỉ lọc port hiển thị, không thay đổi cấu hình bank/member dùng
  để tính bố cục. Trạng thái/module thiếu dữ liệu vẫn giữ nguyên.

FE có thể tái sử dụng engine và các token/CSS/markup trong mockup; vẫn cần
tích hợp component, API và vòng đời đo kích thước vào framework thực tế.
Các thông số chrome/gap trong planner khớp CSS hiện tại: bank 24px, gap
bank 10px, gap tile 6px, nhãn monospace 11px. Nếu đổi CSS các thông số
này cần cập nhật đồng bộ.

Kiểm tra bằng `node mockup_ui/tests/device-ports.test.cjs`: toàn bộ 12.083
switch/OLT trong snapshot, 54 mã model, 153 cấu hình bank/card/member,
7 chiều rộng 280–3000px. Kiểm tra thứ tự, không mất/trùng port, không sửa
snapshot, đủ chỗ cho tên port và không vượt chiều rộng khung. Model
không có inventory/profile được giữ trạng thái thiếu dữ liệu, không dựng
sơ đồ phần cứng chưa được xác minh. Đây là kiểm tra logic, không thay thế
việc đối chiếu hình ảnh trong trình duyệt.
