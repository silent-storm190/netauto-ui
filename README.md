# NetAuto UI mockup

Mở `index.html` để xem mockup tổng thể của nền tảng NetAuto.

Giao diện **Khách hàng theo PON** mới: mở `customer_of_pon/mockup.html` hoặc
**Quản lý Nghiệp vụ → Khách hàng theo PON**. Có chọn nhiều cổng/tìm kiếm,
nạp phản hồi, bốn nhóm khách và danh sách mâu thuẫn riêng theo cấu trúc phẳng
mới. Có phản hồi thật mới nhất HCMP45608GC16 / g0/1: 103 khách và 6 cảnh báo tham chiếu,
không cộng cảnh báo vào tổng khách. Chưa gọi thiết bị. Xem cách dùng, hợp đồng dữ liệu,
thuật ngữ và kiểm thử tại [tài liệu giao diện](customer_of_pon/README.md).

## Phạm vi hiện tại

- App shell bám screenshot production: global rail, global toolbar và Portal Vận hành.
- Hai module chính: `Quản lý POP & Thiết bị` và `Quản lý Nghiệp vụ`.
- Module POP dùng toàn bộ dữ liệu thật từ `get-device-by-pop-1791453967439.json` do người dùng cung cấp:
  3.898 POP, 19.197 thiết bị, 59 tỉnh và 65 chi nhánh. Các tổng số được tính
  trực tiếp từ dữ liệu, không dùng số thống kê cũ trong screenshot.
- Danh sách cuộn liên tục, mặc định 100 POP/lần tải (có lựa chọn 36 / 72 / 100 / 144), tìm kiếm và thống kê trên toàn bộ
  kết quả lọc. POP có nhiều chi nhánh được giữ nguyên và lọc theo từng chi nhánh.
- Màu thẻ Layer 0: nhiều tỉnh thì mỗi tỉnh một màu cố định; chỉ một tỉnh thì mọi
  POP dùng chung một màu nhẹ. Màu chung được chọn lại khi vào Layer 0 hoặc tải
  lại trang, tránh trùng lần trước; tìm kiếm / lọc / phân trang không đổi màu
  chung trong cùng lần xem. Màu chỉ để phân nhóm, không thể hiện trạng thái POP.
- Chi tiết POP là trang Layer 1; chọn thiết bị mở trang Layer 2. Inventory được
  tải riêng theo POP đang mở, hỗ trợ cả mở file HTML trực tiếp và static hosting.
- Module Nghiệp vụ chứa các subpage Kế hoạch, OLT Initialize,
  SwitchCE Initialize, Bandwidth Upgrade, Switch Stack Join, Power Monitoring
  và Kiểm tra dịch vụ.
- Các subpage tái sử dụng trực tiếp những bộ `ui_review_case` mới nhất.

## File vào chính

Nhập tập điểm hỗ trợ `/HO`, `/HW`, `/HU`, `/HF` và `/HB` ở cả nút chọn
hậu tố, nhập mã đầy đủ và dán danh sách nhiều mã.

Tool Kiểm tra tập điểm gom trạng thái HĐ và ONU vào cột “Trạng thái”, gồm
hai dòng có nhãn HĐ/ONU. Tag Online/Offline chỉ thể hiện ONU, không gộp ý
nghĩa với trạng thái HĐ hay kết quả SNMP. Cột “Phiên kết nối” gom `last_logon`
(Đăng nhập gần nhất) và `last_logout` (Ngắt kết nối gần nhất), có nhãn nguồn
CSOC/Inside nhỏ ngay bên phải nhãn Đăng nhập gần nhất, không chiếm dòng riêng, khi response
cung cấp `connection_time_source`. ONU index có tag viền nhẹ để dễ nhận biết. Dùng trực tiếp
`onu_status` của backend, không tính lại từ boolean `status`, RX hoặc IP WAN.
Offline có `onu_status_source=default` được ghi “Chưa xác nhận”; lý do quyết
định có trong tooltip. Inside có Logon hợp lệ và Logout là chuỗi rỗng được
hiển thị “Phiên đang mở”; null/missing không được hiểu là phiên đang mở.

`shared/drop-point-uplink-response.js` giữ riêng JSON bổ sung gồm tỉnh/thành
phố, chi nhánh, POP, BCC2 và `uplink_parameters`. Ghép hiển thị theo mã
`tap_diem` của kết quả đang chọn, không gộp hoặc sửa response SNMP. Với
`HNIP246.0096/HO`, khối “Tuyến uplink” nằm trên bảng khách hàng: hai thẻ BCC2
thu gọn mặc định, chỉ hiện BCC2 và số điểm; bỏ phần điểm đầu → điểm cuối và
Tỉnh/Thành phố. Nhấn thẻ để mở các ô ngắn vừa nội dung, tự xuống hàng, đánh
số theo thứ tự. Mỗi tuyến giữ đủ 11 điểm, các port, “Trung Gian” và mọi
điểm lặp trong chuỗi gốc. Không suy ra Online hay so sánh PortNet/Radius từ
response này. Đổi tập điểm/Xóa dữ liệu sẽ xóa ngữ cảnh cũ; không có dữ liệu
bổ sung thì ẩn khối này. Có bố cục responsive, bàn phím và reduced-motion.

Đồng bộ DTO backend: ưu tiên nguyên envelope `result.uplink` khi field này
hiện diện; chọn payload có `tap_diem === result.drop_point`. `null`, payload
lỗi/rỗng hoặc không khớp sẽ ẩn và xóa tuyến cũ, chỉ hiện thông báo chữ thay
vì khung tuyến trống, tuyệt đối không dùng fixture để thay thế. Ưu tiên
message uplink từ `result.warnings`, rồi envelope message, cuối cùng là
thông báo chưa có dữ liệu. Không lặp thông báo uplink trong khung cảnh báo
ONU; các cảnh báo khác vẫn giữ nguyên. Không đổi customers/count.
Response không có khách hàng và thiếu count vẫn có thể hiển thị uplink.
Fixture độc lập chỉ dùng cho các object snapshot đã nạp trong demo và có
nhãn “Dữ liệu demo”; object response live mới không được hưởng fallback này.
Không gọi CSOC riêng từ trình duyệt hay yêu cầu thêm token cho payload UI.

Thời gian hiển thị theo `dd/mm/yyyy hh:mm:ss`, giữ offset/timezone nếu có,
không dịch theo múi giờ máy người xem. Snapshot cũ chưa có ba trường mới giữ
“—”; không bổ sung ngày giờ/trạng thái giả vào file response thật. Xuất JSON
giữ nguyên giá trị backend. Bảng hỗ trợ cuộn ngang và ghim cột Hợp đồng.
Nếu cả hai mốc hợp lệ, chỉ tô màu giá trị mới hơn: Logon xanh, Logout cam;
mốc còn lại giữ màu chữ mặc định. Hai mốc bằng nhau hoặc thiếu/không hợp lệ
thì không tô màu thời gian. So sánh theo thời điểm tuyệt đối (mốc không có
offset dùng UTC+7), giữ chính xác phần giây thập phân; không tính lại ONU status.

Response `HNIP246.0096/HO` được nạp từ JSON đầy đủ người dùng gửi ngày
12/10/2026: 10 hợp đồng, lấy công suất 10/10, ONU 9 Online + 1 Offline,
thời gian xử lý 2.634ms. HNH260673 vẫn Offline dù RX đọc được. BCC1 trong
nguồn là `HNIP246.0162/HO.01`, khác mã tập điểm truy vấn; giữ nguyên cả hai.
Nhập `HNIP246.0096/HO` và nhấn Kiểm tra để xem bản này; các response cũ vẫn
được giữ. Bản rút gọn 9/10 trước đó đã được thay bằng bản đầy đủ, không trộn
telemetry cũ/mới. Khi response có thiếu bản ghi, UI báo rõ số chi tiết thực
có so với số tổng hợp API.

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
khai, chức năng, số khách hàng và địa chỉ khi nguồn thiếu. Bộ mẫu theo yêu cầu:
Outdoor, 03-11-2003, POP AON+PON, 727 khách hàng, Góc Hồ Xuân Hương - Nguyễn Thông.
Chỉ dùng ở lớp hiển thị và có tooltip/data-demo; không
ghi vào snapshot, không thay thế giá trị thật (kể cả số 0) nếu có.
Tên POP có tag và icon tủ mạng SVG cùng tông với nền thẻ Chi tiết POP. Nền dùng
đường mạch/nút kết nối SVG mảnh và lưới chấm CSS mờ, không còn vòng cung lớn;
không animation hay tài nguyên tải ngoài. Mỗi lượt mở/quay lại POP đổi màu, tránh lặp màu lượt trước và màu lần gần
nhất của chính POP đó; inventory/theme/hash trùng không đổi màu. Preference màu
chỉ lưu hue tùy chọn, vẫn hoạt động nếu storage bị chặn; có tông chữ dark mode.
Nguồn chưa có telemetry PI, liên kết LLDP hay bảng tài sản POP. Những mục này
để trống hoặc ghi rõ “mẫu tham chiếu”, không dùng mẫu như dữ liệu thật của POP
đang mở. Công cụ chưa kết nối production.
Snapshot chứa IP và serial thật: chỉ chia sẻ / triển khai ở nơi có quyền truy cập
phù hợp, không mặc định công khai.

## Chế độ danh sách POP

Nút **Thẻ / Bảng** cạnh tiêu đề Danh sách POP chuyển giữa hai cách trình bày,
ghi nhớ lựa chọn bằng preference local tùy chọn.
Màu nhận diện POP ở cả hai mode chỉ dùng tông lạnh teal/cyan/xanh dương/tím xanh
(hue 165 ≤ h < 265), không dùng đỏ/cam/nâu/vàng hoặc hồng để tránh gợi trạng thái lỗi.
Màu viền/tên/tag, watercolor, lưới chấm/đường mạch và nền hàng đều theo dải này.
Chọn màu theo tỉnh, xử lý hue trùng và đổi palette khi refresh đều giới hạn trong
dải lạnh; preference màu nóng cũ không được dùng lại. Đây chỉ là màu trang trí,
không đổi trạng thái dữ liệu hay màu cảnh báo thực, không đổi palette Layer 1/2.
Thẻ tối đa 4 cột trên desktop, gap 14px; theo chiều rộng nội dung khả dụng
giảm còn 3 cột (dưới 1100px), 2 cột (dưới 820px), 1 cột (dưới 540px).
Container query xử lý cả sidebar/fullscreen, có media-query fallback.
Thẻ gọn theo chiều ngang: icon/tên/vị trí cùng phần đầu, Chi tiết ở góc phải;
góc phải có lưới chấm thưa 16px và đường mạch/nút nối mảnh trong vùng 180×112px,
cùng màu POP, chấm 23% và đường mạch 21% để rõ hơn; lưới mờ dần về phía nội dung.
Họa tiết nằm dưới nội dung/nút, không nhận click, ẩn trong forced-colors.
ba thông tin POP xếp ngang. Switch / OLT / Nguồn / PI có bốn ô bằng nhau,
nhãn phía trên và số căn giữa/tabular-nums để các chỉ số luôn thẳng hàng.
Bốn ô không nền/viền/vạch dọc; sau mỗi số và Tổng khách hàng dùng chung một
mảng watercolor wash: ba vùng màu loang chồng nhẹ, mép tan mềm và hai đốm phụ rất nhỏ.
Tất cả cùng mẫu, góc −3°, chiều cao 30px và cùng tông màu POP, không chia màu loại thiết bị.
Nhãn xám, số màu chữ chính (xanh đen ở Light, sáng ở Dark) không bị xoay;
họa tiết không nhận click, ẩn trong forced-colors, không suy ra cảnh báo từ số lượng.
Loại POP giữ tag nền nhạt; Tổng khách hàng dùng cùng mảng màu loang và màu chữ chính như các số thiết bị;
Chức năng giữ dạng chữ. Mảng loang dùng CSS gradient, góc lưới/mạch giữ nguyên vector nội bộ, không tải ảnh ngoài.
Thứ tự cột Table: POP,
**Miền → Vùng → Tỉnh → Chi nhánh**, Switch/OLT/Nguồn/PI và tổng thiết bị;
chi nhánh giữ đủ các nhánh nếu nhiều nhánh. Cùng một nguồn/kết quả lọc với
thẻ; đổi mode giữ số POP đã hiển thị, tìm kiếm, bộ lọc và số liệu tổng.
Table canh trái nội dung chữ, canh giữa tiêu đề và dữ liệu các cột số/thao tác.
Độ rộng cột theo tỉ lệ cố định, tự phân bổ lại khi ẩn/hiện cột vị trí; chữ dài xuống dòng.
Sáu cột số (Tổng khách hàng, Switch/OLT/Nguồn/PI, Tổng thiết bị) dùng watercolor wash
cùng mẫu với thẻ nhưng gọn/nhạt hơn (24px, cao nhất 8% mỗi lớp màu), không viền hay nền hộp.
Một hàng dùng chung màu loang theo POP/tỉnh và chữ chính; mọi số 0 dùng loang/chữ xám.
Tổng thiết bị chỉ tăng độ đậm chữ. Nền hàng pha màu tỉnh 1–2%, hover/focus 5%.
Cột Thao tác vẫn sticky nhưng không có vạch dọc.
Cạnh nút đổi mode có bộ chọn cột vị trí, chỉ hiện trong Table; mặc định bật
Vùng + Tỉnh, tắt Miền + Chi nhánh. Lựa chọn lưu tùy chọn trong
`netauto.pop.locationColumns`, kể cả chọn 0 cột. Đây là ẩn/hiện header và ô
tương ứng bằng CSS, không lọc dữ liệu, không dựng lại dòng hay reset scroll;
các dòng nối thêm tuân theo cùng lựa chọn. Giá trị lưu sai quay về mặc định.
Mặc định Vùng/Tỉnh chỉ áp dụng khi chưa có lựa chọn hợp lệ; đi vào Layer 1/2 rồi
quay lại không đổi bộ lọc hoặc cột đã chọn (kể cả chủ động tắt hết cột vị trí).
Vị trí cuộn lưu riêng trong bộ nhớ cho Thẻ/Bảng và từng trang POP/thiết bị:
Back bằng nút trong app hoặc lịch sử trình duyệt khôi phục vị trí portal/window,
cuộn dọc/ngang của bảng và số POP đã tải. Chuyển mode giữ vị trí riêng của mode đó;
lần đầu đổi mode giữ vị trí viewport hiện tại, không neo vào footer cuối danh sách.
Đổi bộ lọc/từ khóa/số POP mỗi lần tải xóa vị trí cũ của hai mode để không khôi phục
một vị trí thuộc bộ kết quả khác. Không lưu vị trí cuộn hoặc dữ liệu POP vào storage.

Cả Thẻ và Table có **Loại POP / Chức năng / Tổng khách hàng**. Dùng chung
`NETAUTO_POP_DETAIL.metadata(pop)` với Layer 1, giữ giá trị thật (kể cả 0);
chỉ dự phòng Outdoor / POP AON+PON / 727 khi nguồn thiếu. Có data-demo/tooltip
cho giá trị mẫu, không ghi các giá trị trình bày vào snapshot hay cộng vào
thống kê tổng thiết bị.

Mỗi hàng có nút **Chi tiết** ở cuối; mỗi thẻ có nút này ở phía trên bên phải.
Chỉ nút Chi tiết mới mở trang POP. Nhấn phần còn lại của hàng/thẻ (hoặc nút
tên POP bằng bàn phím) mở native popup xem thiết bị, không đổi route/trang.
Popup dùng chung renderer nhóm Thiết bị mạng / Nguồn & Giám sát với Layer 1,
với cả Thẻ / Bảng nhưng không có hành động mở Layer 2 trên thiết bị. Popup mặc
định Bảng, độc lập với mode Layer 0/Layer 1. User chọn mode trong popup thì lưu
riêng bằng `netauto.pop.previewView` cho các lần mở sau (kể cả tải lại trang).
Preference không hợp lệ/không đọc được dùng Bảng; nếu không ghi được storage,
vẫn giữ lựa chọn trong phiên. Nút chuyển mode dùng chung icon/style với hai layer.
Inventory tải muộn giữ mode đang chọn.
Bảng popup giữ đủ 8 cột và icon loại thiết bị như Layer 1; thu gọn chữ 11px,
padding hàng 7×9px, khoảng cách nhóm và min-width 960px riêng cho popup.
Màn hình nhỏ cuộn ngang; bảng Layer 1 và mode Thẻ giữ nguyên kích thước.
Header popup có nút Chi tiết ngay cạnh tag tên POP, dùng chung style nền xanh
nhạt/viền mảnh với nút trên thẻ ngoài; mở đúng Layer 1 của POP đang xem. Đã bỏ nhãn
“Chỉ xem” và nút ×; đóng bằng Esc / backdrop, trả focus về nút mở và khôi phục
cuộn nền. Mở popup focus vào nút Chi tiết; đóng xóa POP đích để tránh route cũ.
Không tải thêm inventory chỉ để xem popup; dùng metadata thiết bị đã có.
Đã bỏ nút Đăng ký thiết bị.

Trong **Layer 1 → Thiết bị trong POP**, có chế độ **Thẻ / Bảng** riêng,
ghi nhớ bằng preference `netauto.pop.deviceListView`. Nút dùng cùng icon, CSS,
kích thước và trạng thái với Layer 0; đặt sau ô tìm kiếm, cạnh Topo thiết bị,
cả cụm canh phải và xuống dòng trên màn hình nhỏ. Bảng vẫn chia hai nhóm,
màu theo loại, gồm tên / IP / loại / chức năng / vendor / model / Firmware /
Total MAC; cùng thứ tự và object nguồn với Thẻ. Hai nhóm dùng chung tám track cột cố định để canh
thẳng; giá trị dài xuống dòng, màn hình hẹp cuộn ngang không mất thông tin.
Đổi mode không xóa search, inventory tải muộn giữ mode
và filter; nút tên hoặc dòng vẫn mở Layer 2 như trước. EN… → ENATEL và DE… →
DELTA được áp dụng nhất quán cho cả hai mode và popup, không sửa snapshot.
Thẻ thiết bị tối đa 4 cột, gap 14px, giảm 3/2/1 theo chiều rộng vùng nội dung
ở các mốc 1100/820/540px như Layer 0. Bố cục ngang gọn: icon+tên/IP ở đầu,
Firmware/Total MAC giữa thẻ, vendor/model và tag loại/chức năng ở chân.
Góc phải dùng chấm thưa 16px/10% và bảng mạch + đường tín hiệu abstract,
dùng chung mọi loại thiết bị, không còn hình cổng/chassis/pin theo loại.
Hình gọn 148×92px, tối đa 50% chiều rộng thẻ, opacity 18%, nằm trên cùng góc
phải thay vì kéo dài xuống phần thông số. SVG tham chiếu device-motifs/circuit.svg,
bản nhúng qua shared/netauto-motifs.js với nét 1.3px/currentColor. Không tải mask SVG từ file
riêng để tránh hình biến mất khi xem bằng file URL hoặc qua preview đóng gói.
Tint theo loại, không chặn click; hỗ trợ
high-contrast/reduced-motion. Popup xem nhanh dùng cùng thẻ nhưng không mở thiết bị.
Firmware lấy từ thiết bị hoặc inventory.device, giữ version/chi tiết patch trong
tooltip; Total MAC nhận totalMac/total_mac và inventory.device.total_mac, giữ số 0,
thiếu/không hợp lệ để “—”. Tìm kiếm bao gồm hai trường mới. Không tự sinh dữ liệu.
Bỏ hẳn dòng đếm bản ghi/tên file nguồn dưới danh sách thiết bị.

Cụm nhận diện POP ở Layer 1 chỉ có icon và tag tên POP trên cùng một hàng,
căn giữa trực tiếp theo chiều dọc; đã bỏ nhãn “CHI TIẾT POP” và khoảng trống
của dòng đó. Dòng Miền/Vùng/Tỉnh/Chi nhánh
nằm riêng bên dưới, thẳng mép trái với icon. Tên dài và vị trí có thể xuống dòng,
không đẩy tràn nhóm thống kê thiết bị bên phải. Tag giữ màu theo lần vào POP.
Bốn ô thông tin POP dùng nền sáng chuyển nhẹ, viền trung tính rõ hơn và bóng
đổ mỏng; giá trị nhấn bằng độ đậm. Không thêm tương tác hover cho ô thông tin.
Icon trước cả năm trường dùng nét màu trong ô pastel bo góc 28px, SVG 17px:
Loại POP xanh dương, ngày triển khai cyan, chức năng tím, khách hàng xanh ngọc,
địa chỉ xanh ngọc. Nhãn và giá trị vẫn trung tính, icon chỉ trang trí và hỗ trợ
theme sáng/tối cùng high-contrast; không đổi dữ liệu hay màu trạng thái POP.

### Công cụ ở cuối trang POP / thiết bị

Layer 1 có sáu thẻ: Reboot Thiết bị, Nâng cấp băng thông, Cấu hình mới OLT,
Cấu hình mới switchCE, Kiểm tra Pin/Accu, Cấu hình giám sát nguồn mới.
Section nằm dưới cả Tổng quan và Quản lý vật tư, không làm thay đổi tab hiện tại.
Thẻ công cụ có nền chuyển xanh lạnh rất nhẹ, chấm thưa 16px/10% ở góc phải; icon
dùng chung hệ nét màu/nền pastel 10% như metadata, không viền, bo góc 11px.
Icon công cụ lớn 40px/SVG 21px; Reboot/switchCE xanh dương, băng thông/nguồn
cyan, OLT/FTI/thay switchCE tím, Pin/PI xanh ngọc, đồng nhất Layer 1/2.
Không có mũi tên/ký hiệu phụ. Viền focus bàn phím vẫn giữ,
họa tiết không bắt click; có fallback high-contrast và reduced-motion.
Grid công cụ tối đa 4 thẻ/hàng, gap 14px, giảm 3/2/1 theo chiều rộng vùng nội
dung tại 1100/820/540px như thẻ POP. Mỗi thẻ có tên và mô tả ngắn (nội dung mẫu
phục vụ duyệt UI, chưa phải hợp đồng chức năng backend). Họa tiết chìm cờ-lê +
bánh răng SVG nhúng trực tiếp từ NETAUTO_MOTIFS, gọn 104×72px/tối đa 34%
chiều rộng thẻ, nét 1.3px/opacity 16%, cách mép phải/dưới 8px. Không thêm mũi
tên, không phụ thuộc ảnh mask tải từ file SVG riêng. Bố cục/dữ liệu giữ nguyên.
Layer 2 chỉ hiện Công cụ cho SWITCH/OLT: cả hai có Nâng cấp băng thông và Reboot device;
OLT thêm FTI trên PON, giám sát Nguồn và giám sát PI; switch có function CE/switchCE
thêm Thay thế switchCE. Không suy ra vai trò CE từ tên/model hoặc gán cho DI/SWMPLS.
Các thẻ mở native dialog theo đúng POP/thiết bị/IP, đóng bằng Đóng/Esc/backdrop,
giữ focus và scroll lock chung với các popup hiện có. Đây là launcher UI chưa kết nối
backend: nút Thực thi bị vô hiệu hóa; không gửi lệnh, reboot hay cấu hình.

Layer 2 có 8 ô thông tin kiểu POP (4/3/2/1 cột theo chiều rộng
nội dung), icon pastel và tag tên thiết bị; 5 trường Location gom thành dải nhỏ
ngay dưới tên: tag POP → Miền → Vùng → Tỉnh → Chi nhánh. Location không lặp
thành thẻ riêng. Vendor · Model gộp một ô; Serial chassis tự xuống dòng khi dài.
Không lặp Số port, Số transceiver, Module nguồn, Module quạt, Card trong các ô
chi tiết: chỉ giữ số lượng ở dải thống kê phía trên. Trạng thái port/tổng vật tư
vẫn dùng dữ liệu nguồn; đổi màu chỉ là trình bày, không đổi trạng thái.
Không hiển thị mục tổng Rectifier cho SWITCH/OLT; thiết bị nguồn vẫn giữ mục
này và giá trị nguồn. Không xóa hay thay đổi bản ghi vật tư thô.
Giữ giá trị nguồn/kể cả 0; trường thiếu là “—”, không lấy thời gian hiện tại làm ngày cập nhật.
Không lấy profile giả lập làm số port đã lắp. Firmware/Total MAC chưa có trong snapshot
vẫn để thiếu, không tự sinh dữ liệu. Layout/profile port không đổi, chờ dữ liệu bổ sung
cho những dòng Dasan/FiberHome/Juniper/H3C còn thiếu.

Nút **Làm mới dữ liệu** ở góc phải Quản lý Port có tooltip **Quét lại các module thuộc thiết bị**.
Đã bỏ nút Đặt lại và dòng hướng dẫn chọn/nhấn lại port. Nút làm mới có icon
refresh cyan trên nền pastel; dùng `reloadPop` để tải lại chunk snapshot
của POP (không quét trực tiếp), giữ bộ lọc, mode port, port đang chọn và tìm kiếm inventory.
Có trạng thái tải/lỗi, chống click lặp, coalesce các yêu cầu đồng thời, giữ cache khi lỗi
và bỏ qua callback khi người dùng đã chuyển thiết bị. Không bổ sung endpoint hay API scan giả.

Vật tư thiết bị dùng các nhóm details/summary native thay bảng dài lặp loại vật
tư. Nhóm ít mục/Chassis mở sẵn, nhóm nhiều mục thu gọn; mỗi mục giữ Slot/Port,
Model, Serial (kể cả bản ghi trùng). Danh sách 2 cột, về 1 khi hẹp, cuộn nội bộ
tối đa 360px. Tìm kiếm tự mở nhóm khớp; xóa từ khóa khôi phục lựa chọn trước,
refresh giữ trạng thái mở/đóng và hai trục cuộn bằng khóa nhóm ổn định. Tổng
backend không bị thay bằng số dòng đã tải; thiếu/lỗi/tải dữ liệu có trạng thái
riêng. Tên file nguồn nằm trong mục Nguồn dữ liệu thu gọn. Kiểm tra thêm bằng
`node mockup_ui/tests/device-overview.test.cjs`.

Port Mô phỏng dùng mint/cyan sáng cho UP, coral cho DOWN, lam nhạt nét đứt cho
chưa rõ; khe trống nền gần trắng với chấm nhỏ thưa hơn. Palette có light/dark,
đồng bộ nhãn tổng và LED Giả lập, giữ nguyên phân biệt telemetry/missing/module
và mọi hình học bank/slot/port. Không đổi màu cảnh báo nghiệp vụ hoặc Layer 0.

Môi trường tủ: bốn ô T1–T4 giữ bố cục 2×2 với nền xám nhạt và viền mảnh đồng nhất;
nhãn 12px đậm màu chữ chính, số đọc đậm hơn, chỉ giá trị/đơn vị đổi màu theo ramp nhiệt độ
hiện có. Header dùng teal; không thay ngưỡng, số đo, mức cảnh báo backend hoặc phần độ ẩm.

Mỗi tỉnh dùng một hue lạnh riêng cho viền dòng, tên, nhãn tỉnh và màu loang các chỉ số;
nền nhẹ và số giữ màu chữ trung tính. Palette bảng đổi trong dải lạnh khi refresh
trình duyệt hoặc nút làm mới, không đổi khi lọc/tải thêm/chuyển mode/theme.
Header và cột POP sticky; khung cuộn ngang/dọc trên màn nhỏ, có focus/bàn phím,
tông dark mode và target chạm. Ban đầu hiện 100 POP; IntersectionObserver
tự nối thêm từng đợt khi gần cuối. Table theo dõi khung cuộn bảng, Thẻ theo
viewport/clip của portal; chỉ tải khi trang POP đang hiển thị. Thêm bằng
insertAdjacentHTML, không thay các dòng cũ hay reset scroll/focus. Coalesce
requestAnimationFrame và ticket chống callback cũ sau đổi filter/mode/trang.
Đã bỏ Trước/Sau, còn nút Xem thêm dự phòng cho bàn phím/trình duyệt không hỗ
trợ observer; hết kết quả thì dừng. Lựa chọn 36/72/100/144 là kích thước mỗi
đợt, mặc định 100. Đã bỏ dòng ghi chú tên file nguồn và thống kê snapshot
dưới danh sách. Không sửa dữ liệu snapshot hay gọi thêm API.
Kiểm thử: `node mockup_ui/tests/pop-layer0.test.cjs` (đối chiếu toàn bộ POP).

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
node mockup_ui/tests/service-checking.test.cjs
node --max-old-space-size=4096 mockup_ui/tests/pop-data.test.cjs "C:/Users/minhb/OneDrive/Desktop/get-device-by-pop-1791453967439.json"
```

Kiểm tra dữ liệu có thể chạy không truyền file nguồn để đối chiếu index với đủ
3.898 file inventory đang được tham chiếu. Các bài kiểm tra Interface thực thi controller thật trong
môi trường DOM mô phỏng, không thay thế kiểm tra hiển thị bằng trình duyệt.

## SmartPOP

SmartPOP đã tích hợp vào Giám sát & Cảnh báo tại Layer 1, mặc định thu gọn;
bấm tiêu đề để mở/đóng. Đã bỏ các ghi chú và checkbox chọn nguồn. Nguồn mặc định là
bản ghi thực tế 172.18.86.217: cảm biến/quạt/trạng thái tủ, 25 dịch vụ cảnh báo
và số đo CAC/PIN1/PIN2. Nhãn Việt/hover mã gốc; cảnh báo chi tiết mở bằng popup.
Dữ liệu đã thu, không trực tiếp và chưa tự ghép POP; metadata nguồn ở tooltip IP.
Ba payload cấu hình OPMS 835 / 1097 / 2035 vẫn xem được qua API local trong
[SMARTPOP.md](SMARTPOP.md);
test: `node mockup_ui/tests/smartpop.test.cjs` và
`node mockup_ui/tests/smartpop-telemetry.test.cjs`.

## Kiểm tra dịch vụ

Tool Kiểm tra dịch vụ có UI local tại `service_checking/mockup.html`, dùng
style/token NetAuto, 5 response format hiện tại và adapter `loadResponse`.
ONU hỗ trợ Theo PON / Toàn bộ ONU, tìm kiếm/lọc toàn response, phân trang
hai tầng, nhóm cột, ghim định danh và chú ý KH. CSV xuất toàn bộ kết quả lọc;
JSON giữ nguyên nguồn. Chưa gọi API/thiết bị. Xem `service_checking/README.md`.

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
Mọi model dùng chung planner Giả lập theo số port/bank/card và chiều rộng thực.
Giữ các bank cùng hàng khi đủ chỗ; bank dài tự giảm số cột và thêm hàng, uplink
xuống hàng riêng nếu không vừa. Card modular giữ track của profile khi đủ chỗ,
tự chuyển thành một track ở màn hình hẹp; không trộn bank hoặc stack member.
Mọi bank/member dùng chung chiều rộng ô port (thông thường 54–86 px) và chiều
cao 35 px; nhóm ít port không giãn lớn riêng. Chiều rộng tối thiểu còn tính
theo tên port dài nhất của mọi model. Chỉ cuộn ngang khi không thể thu gọn thêm
mà vẫn giữ tên dễ đọc và cấu trúc card. CSS grid nhận track/row từ planner,
không áp dụng breakpoint hay bố cục ngoại lệ riêng cho từng model.
Nếu footprint chiếm ít nhất 88% vùng hiển thị, port có thể giãn nhẹ đến tối đa
96px để hấp thụ phần trống nhỏ. Phần trống lớn vẫn giữ ngoài vỏ thiết bị gọn.
Vỏ thiết bị trong Giả lập co theo footprint thực của các bank (đệm/viền +
số cột và kích thước port), không ép tối thiểu 720px hay 100% vùng chứa.
Các stack member giữ chung chiều rộng theo member lớn nhất; chassis chỉ có
một card được ghi nhận dùng một track, không chừa track trống thứ hai.
Resize tính lại chiều rộng vỏ, cột và hàng của bank; cập nhật style trên DOM
hiện tại, không dựng lại nút port hay làm mất lựa chọn. Tìm kiếm/lọc không làm
đổi vị trí hoặc độ rộng.
HW12/HS12 (CE12804S) dùng card xếp dọc. Giả lập tự chọn 16/12/8 port/hàng
theo chiều rộng và tên port: card 48 port có 3/4/6 hàng. Member của HS12 vẫn
nằm trong chassis riêng. Mô phỏng và profile preview giữ cùng cấu trúc card,
với bố cục cơ sở 12 cột. Resize chỉ cập nhật geometry hiển thị. Ô port của hai model
này có chiều rộng tối thiểu theo tên dài nhất (ít nhất 70px), để giữ đủ phần
member/slot/subslot/port; màn hình quá hẹp cuộn ngang, không cắt tên. Ảnh tham
chiếu chỉ định hướng bố cục, không thêm card, slot hay port chưa có trong snapshot.

- Header giữ tên thiết bị; metadata xếp ba nhóm: Nhận diện (IP, Model, Vendor,
  Serial chassis), Vị trí (POP, Tỉnh · Chi nhánh, Miền · Vùng), Vận hành (Chức
  năng, Firmware, Total MAC). Firmware giữ version/patch/epld và các khóa bổ sung;
  importer giữ `inventory.device.firmware`/`total_mac` nếu job cung cấp. Snapshot
  hiện tại chưa có hai trường này nên hiển thị “—”, không bịa version/count;
  giá trị 0 vẫn giữ nguyên. Không xuất username/password từ inventory device.
  API POP `_build_inventory` giữ branch/firmware/total_mac qua allowlist;
  không trả nguyên device document và không thay đổi quy tắc ghép tên/IP.
- Khi chọn port, dock hiện Thông tin port bên trái, Công cụ port bên phải;
  thông tin chiếm 1/3, công cụ chiếm 2/3; màn hình hẹp mới xếp dọc. Nhóm
  Danh sách “Thông tin port - transceiver” đọc toàn bộ các khóa module từ
  Device_Module_v2: nhận diện, status, loại/speed/description, ngày sản xuất,
  temperature/wavelength/connector/distance, RX/TX và RXH/RXL/TXH/TXL nếu có.
  Trường mới/chưa biết tên nằm trong Thông tin bổ sung; object/array nhiều kênh
  được hiển thị đầy đủ, không chuyển thành `[object Object]`. Không cần chọn
  công cụ Transceiver để xem dữ liệu quang. Rx/Tx PON không thay thế công suất ONU.
  Tiêu đề dùng tên Interface đầy đủ với font Segoe UI sans-serif gọn, weight 600;
  kind/status đặt bên phải. Bỏ các dòng lặp Interface đầy đủ, Media, Bank / Slot,
  Trạng thái port, Loại port, chữ “(nguồn)” và ghi chú snapshot dư.
  Bỏ tiêu đề phụ Interface/Transceiver; Speed nằm cùng các trường, sau Type.
  Serial module hiển thị trực tiếp dưới Part number, trong tag có viền nhẹ.
  Rx/Tx là công suất transceiver, gộp thành một trường
  `-5.3 / 2.3 (dBm)`, không dùng hai ô
  công suất lớn; ngưỡng quang chuyển vào Thông tin bổ sung để giữ phần chính gọn.
- Policy `NETAUTO_PORT_MODELS.portTools` dùng chung cho menu, dropdown và handler:
  CRC có trên các loại port nhưng disable khi chưa xác nhận transceiver hiện diện;
  LACP chỉ có NNI, disable khi DOWN hoặc chưa xác nhận UP; đổi speed chỉ có NNI
  trên switch Huawei/Dasan; Clear Offline Index chỉ có PON. Refresh inventory
  tự bỏ công cụ không còn đủ điều kiện. Không còn bộ công cụ Transceiver,
  Khách hàng/Tập điểm trong menu này.
- CRC/LACP/Clear Offline chưa kết nối API nên không tạo kết quả giả hay gửi lệnh.
  Clear Offline cần truy vấn danh sách Offline và xác nhận trước khi thực hiện;
  mockup chỉ hiển thị mô tả/nút truy vấn disabled, không xóa ONU index nào.
  Đổi speed chỉ xem trước khi có danh sách capability do nguồn cung cấp
  (`ports[*].capabilities.speeds` hoặc `portCapabilities[interface].speeds`),
  không suy ra tốc độ tương thích từ model/module, không thay đổi snapshot.
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
