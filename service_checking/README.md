# Kiểm tra dịch vụ · UI review NetAuto

Mở `mockup.html`, hoặc vào portal `../index.html` → Quản lý Nghiệp vụ →
Kiểm tra dịch vụ. Giao diện dùng trực tiếp `netauto-shell.css`, light mode,
token/màu, button và ngôn ngữ thiết kế NetAuto. Không sử dụng tiến trình giả,
topology mẫu hay gán kết luận không có trong response.

## Dữ liệu

### Tên thiết bị và thẻ loại · 02/11/2026

Tên thiết bị và thẻ loại nằm cùng một hàng, thẻ ở bên phải tên, ví dụ
`HCMP2604GC16 [OLT]`. Thẻ có viền/nền gọn; hàng có thể xuống dòng khi màn hình
hẹp hoặc tên dài. Địa chỉ IP và các thông tin thiết bị khác tiếp tục nằm dưới tên.

Thẻ đánh giá dịch vụ ở đầu kết quả dùng chung mọi vendor/loại thiết bị:

- **Dịch vụ: OK** (xanh): response thành công, có dữ liệu kiểm tra, không có
  lỗi thực thi hoặc hạng mục bắt buộc xác nhận không đạt.
- **Cần kiểm tra** (đỏ): có hạng mục Switch bắt buộc không đạt, hoặc kết quả
  multicast OLT xác nhận không đạt (`overall_ok`, `multicast_stream`,
  `igmp_request` bằng false). Lỗi hạng mục tùy chọn không tự làm đổi kết luận.
- **Dịch vụ: Chưa đủ dữ liệu** (cam): chưa triển khai bộ kiểm tra, không có
  kết quả, lỗi thực thi hoặc phản hồi thất bại chưa kèm bằng chứng đánh giá.

Không dùng nhãn Thu thập thành công/không thành công. Thông báo chi tiết ở
phần đánh giá giữ nguyên nguyên nhân để phân biệt dịch vụ không đạt với việc
không lấy được dữ liệu. Thẻ luôn hiện và được dựng lại khi đổi kết quả OLT/Switch.
Kết luận OK theo phạm vi/tùy chọn của lần chạy và trạng thái nguồn; không thêm
ngưỡng hoặc quy tắc dịch vụ mới, không chứng nhận độ ổn định ngoài mẫu đã kiểm tra.
Giữ nguyên response gốc và bản xuất JSON.

### Thứ tự thông tin và nhấn số liệu kết quả · 02/11/2026

Đầu kết quả có hai vùng tách biệt: tên thiết bị + thẻ loại, phía dưới là IP /
vendor / model / mô hình khi có; các nút Xuất JSON gốc và Xóa kết quả ở bên
phải vùng nhận diện. Hàng kế tiếp là thẻ đánh giá dịch vụ và các lý do/số liệu.
Không đặt thẻ đánh giá chen giữa tên thiết bị và địa chỉ IP. Màn hình hẹp xếp
thẻ đánh giá và chi tiết theo chiều dọc; nội dung dài tự xuống dòng.

Thông báo phân thành các ý theo dấu chấm phẩy. Nhấn đậm các giá trị số, đóng
thẻ riêng B1–B4 và nhấn màu kết quả multicast. Với thông báo B3 có hai tổng
cụ thể, diễn đạt service-port / thành viên IGMP / chênh lệch và định dạng số
theo tiếng Việt. B4 hiển thị số thuê bao IGMP đang hoạt động. Giá trị không đọc
được không được suy thành 0; thông báo chưa nhận diện vẫn giữ nguyên nội dung
và chỉ định dạng phần số. Mọi đoạn nguồn đều được escape trước khi chèn HTML.
Định dạng này không sửa message gốc, trạng thái nghiệp vụ hoặc bản xuất JSON.

Tab và nội dung **Chẩn đoán đã bỏ cho mọi vendor và deviceType**. Xóa cả nhánh
dựng nội dung và kiểu trình bày cũ; thao tác tab cũ bị bỏ qua, điều hướng bàn
phím chỉ qua các tab còn lại. Lỗi thực thi cần thiết hiện trong phần lý do ở
đầu kết quả; dữ liệu gốc vẫn có trong bản xuất JSON, chi tiết hạng mục vẫn giữ.

Nhãn thống kê MAC thống nhất là **Tổng MAC (trên X Port PON)**, X lấy từ
`count.device_total_ports`. Bảng PON dùng **ONU chi tiết / Tổng MAC PON**.
Không dùng chữ MAC (phản hồi) trên nhãn; giá trị vẫn lấy nguyên từ API.

### Tổng MAC và tổng quan gọn · 02/11/2026

Tổng quan OLT còn ba ô: **Port PON**, **Tổng MAC**, **IP WAN (theo tùy chọn)**.
Bỏ các ô ONU/SN trùng ý; số ONU được trả vẫn hiện tại phần bảng và tiêu đề
chi tiết. Tổng MAC lấy từ `count.device_total_mac` trước mac_limit; số IP WAN
vẫn thuộc phần chi tiết nên nhãn nêu rõ phạm vi.

Bảng PON hiển thị **ONU chi tiết / Tổng MAC PON**, ví dụ `3 / 64`, chỉ số tổng
MAC (`64`) được đóng thẻ màu tím. Tên Port PON có thẻ màu xanh bên cạnh mũi
tên mở/thu gọn danh sách ONU; thao tác và số đếm nguồn được giữ nguyên. Bỏ nhóm số
MAC/SN/IP WAN lặp lại, thay bằng cột **IP WAN (theo tùy chọn)**. Dữ liệu mới có
`ports[].returned_mac` và `count.device_returned_mac` để phân biệt số mẫu
MAC được trả. Nhãn Tổng MAC giữ thống nhất cho các phản hồi; không thay số nguồn
bằng available_onu hoặc giả lập dữ liệu mới.
Các mẫu lịch sử đóng gói vẫn được giữ nguyên, cần backend mới để nhận tổng MAC
đầy đủ trên hệ thống thật. Chi tiết định nghĩa tại `OLT_CUSTOMERS.md`.

### Khoảng cách bảng ONU · 02/11/2026

Bảng ONU lồng trong PON và bảng ONU đầy đủ dùng chung độ rộng tối thiểu theo
từng trường. Tập điểm, MAC và Model có thêm chỗ; Tập điểm giữ nguyên trên một
dòng, không bẻ tại dấu `/`. Các cột RX/TX/nhiệt độ/khoảng cách và các thẻ định
danh giữ độ rộng gọn, không nhận thêm khoảng trắng khi bảng rộng.

`service-model.js::onuLayout` chia phần rộng dư cho trạng thái, Tập điểm,
Serial, MAC, Model và chú ý khách hàng. `service-checking.js::syncOnuLayouts`
dùng ResizeObserver theo vùng chứa, cập nhật độ rộng pixel cho từng cột và
tổng bảng. Cột PON/ONU index giữ đúng độ rộng để không lệch vị trí cố định khi
cuộn ngang. Khi ẩn/hiện nhóm cột hoặc đổi PON, tính lại theo các cột đang có;
ngắt theo dõi khi xóa kết quả. Nếu trình duyệt không có ResizeObserver, bảng
giữ độ rộng tối thiểu và vẫn có cuộn ngang.

Ổn định khi thu phóng (bao gồm 80%): vùng cuộn ONU dùng `contain:inline-size`
để độ rộng nội dung không tác động ngược tới vùng đang đo. ResizeObserver đọc
độ rộng content box, bỏ qua thay đổi chiều cao và sai lệch tối đa 2 CSS px so
với lần áp dụng gần nhất. Thay đổi lớn hơn được gộp vào một requestAnimationFrame;
không sửa cột ngay trong callback theo dõi. Hủy nhịp cập nhật và ngắt theo dõi
khi đổi bảng, rời tab ONU hoặc xóa kết quả. Cuộn ngang và độ rộng tối thiểu
của cột vẫn được giữ.

Hàng dữ liệu thông thường cao tối thiểu 40 px, chữ 12 px, đệm ô 8 × 10 px;
thẻ hợp đồng/IP/index gọn hơn. Trạng thái hoặc cảnh báo dài được xuống dòng
tự nhiên và hàng có thể cao hơn để không mất nội dung. Khoảng cách tiêu đề,
lề khối ONU và dòng đếm phía dưới cũng được thu gọn. Không thay dữ liệu, thứ
tự cột, bộ lọc hoặc cách xuất dữ liệu.

Kiểm chứng: `node mockup_ui/tests/service-checking.test.cjs`, gồm bảng lồng/
đầy đủ, vùng rộng/hẹp, đổi kích thước, ẩn nhóm cột, cột cố định, phân trang và
50.000 ONU. Kiểm thử bố cục dùng mô hình DOM, chưa xác nhận hình ảnh trình
duyệt trong đợt này vì công cụ trình duyệt chặn URL tệp cục bộ.

### Chọn mẫu và Online qua ISC · 02/11/2026

Backend ưu tiên MAC có trên OLT và CDP status=act; thiếu mẫu thì bổ sung MAC
OLT trước khi áp dụng mac_limit từng PON. Mọi MAC mẫu được tra IP WAN qua ISC.
`onu_online=true`/`onu_status=Online` chỉ khi có IP WAN hợp lệ từ ISC; không có
IP hoặc tra lỗi là chưa xác nhận Online, không dùng IP CDP/số đo RX để thay thế.
Tổng MAC giữ đầy đủ trước chọn mẫu; `total_ipwan` là số mẫu có IP ISC hợp lệ.

Phản hồi mới có `online_source=isc_ipwan_by_mac`: ô IP WAN ghi nguồn ISC trong
chú thích, không có IP thì hiển thị **Chưa xác nhận**. Tiêu đề chi tiết PON hiện
số ONU Online trong mẫu. Hộp Đối chiếu phân biệt nguồn xác nhận Online với
CDP act dùng xếp ưu tiên; giữ hai giá trị nếu IP ISC khác CDP. Các lỗi
`service_quality.issues` được hợp nhất vào Cần kiểm tra theo ONU cùng các lỗi
CDP hiện có. Phản hồi cũ không có bằng chứng ISC không bị suy diễn Online.

### Cần kiểm tra CDP · 30/10/2026

Nhận `onu_data[].data_quality.issues` để đưa lỗi thiếu/sai/trùng CDP vào
**Cần kiểm tra**, kể cả khi hợp đồng đang có giá trị. Một ONU chỉ đếm một lần.
Chỉ tính các ONU có trong `ports[].onu_data[]` sau `mac_limit`; không cộng
`cdp_audit.records` hoặc `hidden_onu_records`, kể cả khi nạp phản hồi cũ.
Cột cuối mỗi hàng là nút **Đối chiếu**, màu cam khi có chú ý. Bấm nút mở hộp
chi tiết lý do, dữ liệu của ONU và `data_quality.cdp_snapshot` được phép hiển thị.
Không dựng bảng CDP riêng phía dưới. Có `cdp_snapshot` thì hiển thị cột
**Data CDP** bằng đúng các giá trị nguồn; không điền ngược từ dữ liệu đã ghép.
Phản hồi cũ thiếu hồ sơ nguồn dùng bảng hai cột thông tin/kết quả, không dựng
cột Data CDP toàn dấu trống. Nếu có bằng chứng ghép CDP, ghi rõ đã lấy thông tin
khách hàng từ CDP nhưng chưa kèm dữ liệu nguồn để so sánh. Phân biệt riêng
không khớp hồ sơ và lỗi lấy CDP theo `membership`/`issues`; không xem thiếu
snapshot là không có khách hàng trong CDP. Không gọi lại API hay sửa JSON gốc.
Hộp chi tiết đóng bằng nút Đóng/phím Escape, trả tiêu điểm về nút đã mở;
nạp thiết bị mới hoặc xóa kết quả sẽ đóng và xóa nội dung hộp.

Hồ sơ `status=off` bị backend loại khỏi thông tin khách hàng; không ghi đè
định danh ONU vật lý. Xung đột vẫn vào Cần kiểm tra, nút Đối chiếu màu cam.
Hộp chi tiết giải thích việc loại hồ sơ và cho xem `ignored_cdp_records` trong
mục **Data CDP không sử dụng**, có hợp đồng/trạng thái/định danh nguồn.
Nếu chọn được hồ sơ khác đủ điều kiện, cột Data CDP là hồ sơ đang dùng và
hồ sơ off vẫn nằm riêng trong phần bị bỏ qua. Không cộng thêm một khách hàng
chỉ vì có nhiều hồ sơ bị bỏ qua. Quy tắc áp dụng trên phản hồi từ backend mới.
Backend giữ chứng cứ trong log `CDP_AUDIT` cùng request_id; xem
`components/ops_flow/business/service_checking/OLT_CUSTOMERS.md` để tra mã lỗi
và liên kết hồ sơ nguồn. Cần triển khai/tích hợp bộ hiển thị và backend đồng bộ.

`responses.js` giữ nguyên 5 response format hiện tại người dùng cung cấp:
HW24 (bản mới đủ 7 route), H3C CV52, HW67 không đạt, OLT HA58 và GC16.
Hai OLT có tổng 48 PON và 130 ONU đã trả; response đang giới hạn 3 ONU/PON.
Không dùng các snapshot HW24/CH52 cũ hoặc log MB.

## Cập nhật giao diện theo vai trò · 29/10/2026

Đã đối chiếu chat **Kiểm Tra Dịch Vụ** và mã hiện tại trong
`components/ops_flow/business/service_checking`. Trang vẫn dùng một điểm mở,
nhưng thay đổi phần tổng quan theo dữ liệu thiết bị:

- OLT: bảng PON và bảng ONU lồng bên trong.
  Mỗi lần nạp/đổi thiết bị, tất cả PON được thu gọn; chưa tạo các hàng ONU
  trong trang cho đến khi bấm Port. Bấm lại đóng, mở Port khác đóng Port cũ.
  Giữ tìm kiếm toàn bộ nguồn, xuất dữ liệu và phân trang bên trong PON.
- Switch CE: thông tin thiết bị ở trên, lưới 8 hạng mục kiểm tra bên dưới. Mỗi thẻ
  thể hiện kết quả thật, phạm vi hoặc lý do bỏ qua; bấm chuyển đến bảng chi tiết
  tương ứng. Hạng mục tùy chọn không được biến thành lỗi bắt buộc.
- Topo Star / SEP / OSPF: chỉ nhận từ trường tường minh của phản hồi hoặc thông
  tin thiết bị do lớp tích hợp truyền vào. Star/Ring có thể được thêm vào dòng
  thông tin cơ bản; tab Topo dùng giá trị nguồn để đóng nhãn mô hình tương ứng.
  Không còn khối minh họa vai trò/kiểu kết nối riêng hoặc dòng báo chưa có
  thông tin. Không suy ra Ring từ LACP, không mặc định Star khi chưa biết.
- Switch DI / Switch chưa có bộ kiểm tra: đọc được phản hồi thông báo từ bộ
  định tuyến và hiển thị trạng thái trung tính **Chưa có bộ kiểm tra**.
  Không dựng các thẻ CE hoặc đánh giá thiết bị không đạt vì chức năng chưa
  triển khai. Nếu một phản hồi DI có `checks` đúng cấu trúc, trình bày các
  hạng mục được trả mà không thay kết luận nguồn.

Phần nghiệp vụ mới tự nhận diện Huawei ver1 / Huawei12 / ver2 theo thiết bị.
Giao diện không yêu cầu người dùng chọn phiên bản. Nhận `result.profile` và
`checks.counters.checked_metrics/not_checked_metrics`; ver2 có CRC và
OutDiscards, InDiscards được ghi **Không kiểm tra**, không hiển thị số 0 giả.
Các mẫu lịch sử còn thiếu trường này vẫn giữ đúng mảng số đo/null của chúng.
Lý do LACP `all_members_down`, nhóm rỗng và DOWN được giữ riêng với lỗi đọc.

Switch DI và quy tắc MB chưa được triển khai ở nghiệp vụ hiện tại. Không thêm quy tắc cho DI/MB; đường dẫn endpoint, driver và cách ghi nhật ký
được giữ nguyên. OLT dùng lại bộ thu thập/ghép CDP của get_customer_of_pon
như mô tả trong ../../components/ops_flow/business/service_checking/OLT_CUSTOMERS.md. Không có kết quả ver2 mới do người dùng cung cấp,
nên không thêm mẫu ver2 giả vào danh sách 5 phản hồi thật.

### Kết quả Switch và hạng mục cần kiểm tra

- Bỏ dòng lý do trống dưới nhãn Đạt/Bỏ qua; chỉ hiện mô tả phụ khi có reason
  hoặc skip_reason thực tế. Giá trị đo thiếu vẫn giữ dấu “—”.
- Bảng Port/quang dùng bố cục cột cố định. Admin và Oper được thể hiện bằng
  hai nhãn độc lập: UP màu xanh đậm, DOWN màu cam đậm. Ngưỡng công suất dùng
  dạng `[Low  High]`, trong đó hai giá trị có màu riêng và không còn dấu `/`.
  RX, ngưỡng công suất và đánh giá cùng căn giữa. Nội dung bảng Switch tăng
  lên 14 px, tiêu đề cột 13 px, mô tả và nhãn trạng thái 12 px; không đổi
  kích thước bảng ONU/OLT. Bảng hẹp cuộn ngang thay vì ép dồn các cột.
- Khối **Hạng mục cần kiểm tra** ngay dưới thống kê nêu tên kiểm tra,
  lý do/vị trí và nút Xem chi tiết. Lấy từ cả checks thất bại và failures;
  gom nhiều lỗi Port cùng nhóm thành một hạng mục. Mục optional có nhãn
  Tùy chọn riêng, không tính vào tổng hạng mục bắt buộc không đạt; bỏ qua
  không bị xem là thất bại. Giữ nguyên status của phản hồi máy chủ.
- Bổ sung thẻ/tab **Topo** khi có dữ liệu topo hoặc lỗi SEP. Hiển thị mô hình
  theo phản hồi bằng nhãn màu riêng cho Star, SEP và OSPF; kèm segment,
  Port/role/state của thiết bị và liền kề,
  đóng góp PIM và kỳ vọng/thực tế; giữ đóng góp 0, không tự tính lại quy tắc.
  Star được xem là đạt khi SEP không áp dụng và không có lỗi Topo; nhãn Star
  dùng màu xanh đậm. Thiếu dữ liệu hoặc lỗi nhận diện mô hình có lý do và bằng
  chứng rõ ràng.
- Thẻ Topo trong Tổng quan dùng cùng kết luận với tab Topo: khi đã nhận diện
  Star, SEP hoặc OSPF và không có lỗi, thẻ hiển thị trực tiếp tên mô hình thay
  cho trạng thái Bỏ qua. Khi có lỗi Topo, thẻ chuyển sang **Cần kiểm tra** và
  giữ liên kết mở đúng tab chi tiết.
- Biểu tượng trạng thái trên tab dùng hình tròn: dấu tick trắng trên nền xanh
  đậm khi hạng mục ổn định, dấu chấm than trên nền đỏ/cam khi có lỗi hoặc cảnh
  báo. Hạng mục bỏ qua hợp lệ không còn hiển thị dấu gạch ngang; thiết bị chưa
  có bộ kiểm tra dùng dấu hỏi trung tính để tránh ngụ ý đã đạt.
- Tab Định tuyến làm đậm tên PIM neighbors, Management default và Route PIM.
  Prefix và Mask vẫn cùng một cột nhưng được tách thành hai thành phần; Mask
  chuyển sang dạng `/CIDR` và in đậm để dễ quét danh sách.
- Tab Multicast của Switch dùng tiêu đề/trạng thái cùng hàng, ba ô số liệu có
  độ tương phản cao hơn và số liệu chính lớn hơn. L2 multicast được đặt trong
  một dải thông tin riêng, giữ nhãn kết quả và Tùy chọn.
  H3C và Huawei dùng chung bố cục này: Huawei hiển thị tổng multicast/PIM và
  ngưỡng; H3C hiển thị luồng `(S,G)`, Interface hướng lên và PIM neighbor.
  Dữ liệu luồng H3C dạng JSON không còn mở mặc định mà nằm trong mục kỹ thuật
  có thể mở khi cần.
- Cảnh báo trong tab Định tuyến có thêm khối **Ý nghĩa vận hành** trước phần
  bằng chứng kỹ thuật. Khối này nêu rõ số PIM neighbor đang thiếu, tuyến nào
  không tồn tại hoặc next-hop nào không thuộc PIM neighbor. Phản hồi cũ dùng
  điều kiện bằng tuyệt đối được nhận diện để hướng dẫn chạy lại API sau cập nhật.
- Tab lỗi có dấu đỏ; hạng mục tùy chọn chưa đạt có dấu cam. Các hàng lỗi
  Port/quang, CRC/discard và LACP được tô nền. Bấm cảnh báo/thẻ lỗi sẽ mở
  đúng tab, tới trang đầu tiên có Port lỗi nếu bảng có phân trang.
- Hạng mục mới chưa có cách trình bày riêng đi vào **Kiểm tra khác**, không
  bị ẩn khỏi cảnh báo. Dữ liệu/lệnh nguồn có thể mở xem bằng chứng, được
  escape; JSON xuất ra và danh sách phản hồi thật đóng gói không đổi.

Kiểm thử dùng dữ liệu giả trong bộ nhớ cho SEP lỗi, SEP bỏ qua, đóng góp 0,
Port lỗi ở trang thứ hai, optional và hạng mục mới; không giả lập thành kết quả
thiết bị thật trong responses.js. Chưa xác nhận trực quan trên trình duyệt.

Chứa IP, SN, MAC và định danh khách hàng thật: chỉ bàn giao trong phạm vi
được phép. Trang không gửi dữ liệu ra ngoài, không gọi SSH/SNMP, không publish.

## UX dữ liệu ONU lớn

- `Theo PON`: hiển thị toàn bộ port PON của response, không phân trang hoặc
  cắt cứng ở 32, không tự bổ sung port. Bộ lọc vẫn áp dụng trên toàn bộ PON.
  Không có chọn PON/trang hoặc nút chuyển trang. Bấm tên port mở bảng ONU ngay dưới
  hàng, bấm lại đóng; chỉ một PON được mở. Bảng con phân trang 25/50/100 ONU.
- `Toàn bộ ONU`: mặc định 50 ONU/trang, có thể chọn 25/50/100; tìm và rà soát
  nhiều PON cùng lúc. Phân trang trong từng PON vẫn mặc định 25.
- Bảng PON bỏ cột Kết quả lọc; tiêu đề và dữ liệu cùng canh lề.
  `ONU chi tiết / Tổng MAC PON` dùng số bản ghi ONU / `total_mac` từ nguồn,
  không thay bằng `available_onu`. Số Có sẵn vẫn hiển thị khi mở PON.
- Bảng ONU con và toàn bộ là **bảng thuần**, mỗi trường một cột: ONU index,
  hợp đồng, trạng thái HĐ, tập điểm, IP WAN, SN, MAC, model, Rx, Tx,
  nhiệt độ, khoảng cách và chú ý khách hàng. Chỉ hợp đồng (xanh dương),
  ONU index (tím) và IP WAN (xanh ngọc) dùng tag; trạng thái và cảnh báo là chữ thuần.
  Tiêu đề/giá trị căn giữa, số có độ rộng ký tự đồng đều; đơn vị nằm ở tiêu đề.
  Không phân tầng các giá trị trong một ô. Giữ 0, hiển thị giá trị thiếu bằng “—”.
  Nhóm cột có thể ẩn để thu gọn; PON/index ghim khi cuộn ngang, mọi cột còn lại
  được căn theo quy tắc độ rộng ở mục cập nhật 02/11/2026. Tiêu đề/dữ liệu
  12px; khoảng đệm ngang 10px.
  Quy tắc độ rộng PON chỉ áp dụng trực tiếp cho bảng cha, không lan vào ONU.
  Bảng con mặc định 25 ONU; giữ lựa chọn 25/50/100 khi có nhiều hơn 25 kết quả.
  Ẩn nút chuyển trang nếu không cần; CSV vẫn xuất toàn bộ kết quả lọc.
- Tìm kiếm áp dụng trên toàn bộ response, gồm PON, ONU index, SN, MAC, model,
  hợp đồng, tập điểm, IP WAN. Lập index một lần, cache theo response, debounce
  160 ms. Chỉ render trang đang xem; không tạo DOM cho hàng chục nghìn ONU.
- Lọc theo trạng thái **port PON**, dấu hiệu khách hàng và phạm vi PON.
  Mọi filter áp dụng trước pagination. Có nhãn phạm vi và Bỏ lọc rõ ràng.
- Các chỉ số nguồn hiển thị mặc định. Người dùng có thể ẩn nhóm SN/MAC/model,
  khách hàng, quang, vận hành. Ghim cột PON/ONU index khi cuộn ngang; giữ
  nguyên tên, không cắt SN/MAC. Chỉ lựa chọn nhóm cột được lưu localStorage,
  không lưu dữ liệu khách hàng hay từ khóa.
- Chú ý KH là projection UI: thiếu IP WAN hoặc 0.0.0.0, thiếu HĐ/tập điểm/
  trạng thái HĐ, HĐ khác Bình thường. Một ONU được đếm một lần trong mỗi nhóm.
  Thiếu MAC từ SNMP không bị coi là lỗi khách hàng. Không suy ra ONU Offline.
  Nút tại PON mở danh sách ONU cần xem đúng phạm vi; nút tổng mở toàn bộ.
- Hàng chú ý chỉ có hai mục tổng: `Chú ý KH` (lọc các ONU cần xem) và
  `Cảnh báo` (mở/đóng nội dung `error` và `result.warnings`).
  Không tách các nhóm IP, thông tin KH, trạng thái HĐ thành nhiều chip ở đây;
  nguyên nhân từng ONU vẫn hiển thị trong cột Chú ý khách hàng.
- Cảnh báo backend hiển thị riêng ở mức lượt chạy, không gán lỗi CSOC cho từng
  ONU khi response chưa cung cấp nguyên nhân. Chú ý KH không đổi `status`.
- CSV xuất **toàn bộ kết quả lọc**, không chỉ trang hiện tại, tôn trọng nhóm cột,
  BOM UTF-8 và phòng công thức bảng tính. JSON xuất nguyên response.

Switch CE có tổng quan, port/quang, đủ mẫu CRC/discard, aggregation/member,
PIM/routing và multicast. Bỏ qua/optional/null giữ nguyên ý nghĩa.
OLT giữ cả B1 NOT_OK và overall_ok=true nếu cùng có trong nguồn; GC16 không
có B1–B4 chi tiết thì không dựng thêm dữ liệu.

Kết quả xếp dọc: **thông tin thiết bị và thống kê ở trên**, các tab và bảng/thẻ
kiểm tra **dùng toàn bộ chiều ngang bên dưới**, cách nhau 14px.
Mỗi tab có viền, bo góc và nền riêng; tab đang chọn dùng viền/nền xanh để dễ
nhận biết, thay cho kiểu chỉ có gạch chân mảnh.
Phần trên gọn với tên, trạng thái, IP/vendor/model và thao tác cùng hàng.
Thống kê OLT gồm ba thẻ Port PON / Tổng MAC / IP WAN và thẻ Tùy chọn kiểm tra
trên cùng một hàng bốn khối; Switch dùng 3 ô. Trên màn hình rộng, ba thẻ số liệu
chia khoảng 60% chiều ngang và thẻ Tùy chọn kiểm tra chiếm khoảng 40% để hạn chế
việc nội dung xuống dòng. Màn hình nhỏ tự xuống dòng để giữ khả năng đọc. Bảng rộng cuộn trong vùng kết quả, thông tin thiết bị
không bám cạnh màn hình. Màu thống kê chỉ phân nhóm, không chỉ sức khỏe.

Đã bỏ khối mô tả vai trò/kiểu kết nối và khối cũ **Phạm vi & tham số đã chạy**.
OLT có khối gọn **Tùy chọn kiểm tra** làm khối thứ tư cùng hàng với ba ô thống
kê trên màn hình rộng, chỉ đọc từ
`result.options`, không có ô nhập/chỉnh sửa yêu cầu:

- **Số mẫu:** `Kiểm tra 3 MAC/Port PON` theo mac_limit, hoặc
  `Kiểm tra toàn bộ MAC/Port PON` khi giá trị null.
- **Check Multicast:** Bật/Tắt theo giá trị boolean được trả.
- **Thông tin ONU:** gộp các cờ đang true thành danh sách MAC, SN, Model,
  Công suất thu/phát, Nhiệt độ, Khoảng cách OLT–ONU. Không liệt kê mục tắt.

Không hiện các mã online_source/sampling_policy hay tên cờ kỹ thuật. Chế độ
multicast-only chỉ hiện **Chế độ: Chỉ kiểm tra multicast**, bỏ số mẫu và cờ ONU
không áp dụng. Switch hoặc phản hồi thiếu các tùy chọn có thể hiển thị thì ẩn
khối này; không suy đoán giá trị mặc định. Dữ liệu phản hồi/bản xuất JSON giữ
nguyên. Các nhãn IP WAN trong thống kê và bảng PON dùng **IP WAN (theo tùy chọn)**.
Không có tab Chẩn đoán. Lỗi thực thi hiển thị ở phần thông báo đầu kết quả;
xuất JSON gốc vẫn giữ command_errors, Interface bypass và dữ liệu nguồn.
Màu không thay đổi status hoặc coi lỗi lệnh đã fallback là lỗi tổng.
Kết quả multicast OLT dùng hai thẻ **Lưu lượng multicast** và **Đối chiếu cấu
hình IGMP** khi có các cờ tương ứng: xanh **Đạt**, cam **Cần kiểm tra**, thiếu
giá trị là thẻ trung tính **Chưa có dữ liệu**. Khi nguồn chỉ có `overall_ok`,
hiện một thẻ **Kết quả multicast**. Không đổi cờ hoặc kết luận tổng nguồn.

### Kết quả multicast OLT dễ đọc · 03/11/2026

Huawei có dữ liệu B1–B4 được trình bày thành danh sách **Hạng mục / Kết quả /
Chi tiết**. Mặc định tất cả hàng đóng, chỉ hiện hạng mục, kết quả và thao tác
Chi tiết. Nhấn vào bất kỳ vị trí nào trên hàng hoặc dùng bàn phím để mở/đóng
phần Chi tiết bên dưới. Sắp thứ tự B1 đến B4, mã bước đóng thẻ xanh riêng cạnh
tên tiếng Việt. Các ô chỉ mang dữ liệu nguồn, không áp thêm tiêu chí hoặc thay
đổi quyết định nghiệp vụ của driver.
Trong bảng kênh B1, chỉ số căn trái, lưu lượng căn phải và ghi nhận căn giữa;
độ rộng ba cột cố định để tiêu đề và dữ liệu không lệch nhau.

- **B1 — Lưu lượng các kênh multicast cấu hình sẵn:** bảng chỉ số kênh, lưu
  lượng kb/s và ghi nhận có/không có lưu lượng. Tóm tắt số kênh có lưu lượng
  trên số kênh có trong phản hồi. Chỉ số có trong `indexes` nhưng thiếu dòng
  số đo vẫn hiện Chưa có số liệu. Giá trị 0 khác với số đo thiếu.
- **B2 — Lưu lượng multicast trên Port hướng lên:** khi `SKIPPED/B1_OK`,
  giải thích B1 đã xác nhận lưu lượng nên không cần kiểm tra bổ sung. Khi
  thực hiện, hiện Port, lưu lượng và lý do thiếu Port/chưa xác nhận lưu lượng.
- **B3 — Đối chiếu cấu hình IGMP:** hiện VLAN, tổng service-port, tổng thành
  viên IGMP và chênh lệch tuyệt đối cạnh nhau. Thiếu một tổng thì chưa xác định
  chênh lệch, không thay bằng 0. Khi B3 xác nhận không đạt và hai tổng lệch,
  đầu mục có câu tóm tắt nêu số bản ghi chênh lệch; không đoán bản ghi nào sai.
- **B4 — Thuê bao đang sử dụng multicast:** số thuê bao IGMP và số Port PON
  tương ứng. Khi không bắt buộc, không tô như lỗi bắt buộc nếu chưa ghi nhận
  thuê bao. Không đồng nhất số thuê bao IGMP với
  số ONU Online từ IP WAN ISC.

Đã bỏ hai câu hướng dẫn dài dưới B3 chênh lệch và B4 tham khảo; các số liệu và
trạng thái đã đủ để người vận hành đánh giá. Hạng mục bắt buộc không đạt được
đánh dấu nền/viền để tìm nhanh. B1 không đạt
vẫn hiện rõ nếu B2 xác nhận lưu lượng thay thế; không tự đổi kết quả chung.
Vendor chỉ trả các cờ tổng vẫn có thẻ tóm tắt, không tạo bảng B1–B4 rỗng.
Hạng mục chưa nhận diện có nhãn bổ sung và dẫn tới dữ liệu kỹ thuật.

Toàn bộ dữ liệu multicast gốc nằm trong **Xem dữ liệu kỹ thuật**, dùng
`details` mặc định đóng; phản hồi/bản xuất JSON không bị sửa. Phần đọc thông
thường không chứa JSON, tên trường nội bộ hoặc giá trị `null`.
Kiểm chứng bằng `node mockup_ui/tests/service-checking.test.cjs`: số liệu thực
trong các phản hồi mẫu, chênh lệch 1675/1674, bỏ qua B2, B4 tham khảo, phục hồi
qua B2, số 0 và số liệu thiếu, kênh thiếu số đo, dữ liệu cũ, nội dung có ký tự
HTML và tính bất biến của nguồn. Chưa kiểm chứng hình ảnh trên trình duyệt.

## Handoff FE

Thanh trên có **Dán kết quả** và menu thu gọn **Đổi thiết bị** (nhập tên/IP,
chọn kết quả đã lưu, nạp tệp). Các phần này chỉ phục vụ bản mẫu, có thuộc tính
`data-mockup-only`. Trang kết quả bỏ nhãn bản duyệt, nguồn dữ liệu và các ghi
chú triển khai; chỉ giữ lỗi, cảnh báo và thông tin phục vụ kiểm tra.
Trước khi chạy `service-checking.js` trong trang tích hợp production, đặt:

```js
window.NETAUTO_SERVICE_CHECK_CONFIG = {mockupTools: false};
```

Cấu hình này ẩn công cụ nhập/chọn mẫu và hộp dán; không tự nạp
mẫu lúc khởi động. Trang chờ lớp tích hợp truyền kết quả thực bằng `loadResponse`
hoặc `loadPayload`. Các điều khiển mẫu bị bỏ qua trong chế độ này. Không đóng
gói `responses.js` vào trang production. Cấu hình hiển thị không thay thế việc
xác thực/phân quyền tại lớp tích hợp. Bản mẫu mở trực tiếp vẫn bật các công cụ
này để người dùng thử dữ liệu; đợt sửa này không triển khai lên hệ thống thật.

Nút Mở kết quả chỉ mở snapshot khớp hostname/IP; chưa nối API. Nạp JSON xử lý
file local tối đa 20 MB, kiểm tra cấu trúc và bảo vệ kết quả đang mở khi file lỗi.
Mỗi lần đổi response/xóa kết quả hủy ngữ cảnh lọc, port chọn và import đang chờ.

Nút **Dán kết quả** mở hộp nhập trực tiếp toàn bộ object phản hồi dạng JSON.
Chọn **Hiển thị kết quả** hoặc Ctrl/Cmd + Enter để nạp qua cùng bộ kiểm tra cấu
trúc và dựng lại giao diện ngay. Dữ liệu OLT mở ở chế độ nhóm PON thu gọn;
Switch mở tổng quan theo vai trò. Không cần lưu tệp hay gọi lại API.

Nhận JSON chuẩn, BOM đầu chuỗi và JSON trong khối mã Markdown `json`; không
thực thi đoạn mã JavaScript hoặc object literal thiếu dấu ngoặc kép. Giới hạn
nội dung dán là 20 MiB theo byte UTF-8. Dữ liệu rỗng, sai JSON, sai cấu trúc
hoặc vượt giới hạn báo lỗi trong hộp nhập và giữ nguyên kết quả đang mở.
Hủy/đóng hộp không nạp dữ liệu; nội dung ô nhập được xóa khi đóng. Không lưu
nội dung dán vào bộ nhớ lâu dài của trình duyệt hoặc ghi ra nhật ký.

Khi FE nhận response từ API sau khi xác thực/phân quyền, gọi:

```js
window.NETAUTO_SERVICE_CHECK_UI.loadResponse(response, 'Kết quả API');
```

Hàm tiện ích dưới đây nhận cả object đã giải mã và chuỗi JSON; trả `true` khi
đã dựng kết quả, `false` khi từ chối dữ liệu và giữ nguyên kết quả cũ:

```js
window.NETAUTO_SERVICE_CHECK_UI.loadPayload(responseObject);
window.NETAUTO_SERVICE_CHECK_UI.loadPayload(responseJsonText);
```

Có thể truyền thêm thông tin thiết bị đã lấy từ kho thiết bị làm tham số thứ ba:

```js
window.NETAUTO_SERVICE_CHECK_UI.loadResponse(response, 'Kết quả API', {
  nameDev: device.nameDev,
  ipDev: device.ipDev,
  function: device.function,
  modelDev: device.modelDev,
  vendor: device.vendor,
  topology: device.topology // 'Ring', 'Star' hoặc {type: 'Ring'} khi nguồn có
});
```

Tên/IP/vendor/model trong phản hồi được ưu tiên; metadata chỉ bù phần thiếu.
Vai trò theo `device_type`, hoặc `function` cho Switch chưa ghi rõ vai trò.
Kiểu kết nối nhận `inventory.topology`, `result.topology` hoặc
`result.topology_type`. Metadata không được ghi thêm vào phản hồi, không sửa
`status`, không lưu lâu dài và được xóa khi đổi thiết bị/clear. Các phản hồi
mẫu hiện không có Ring/Star nên không hiện nhãn kiểu kết nối. Lớp tích hợp cần
cung cấp trường này nếu muốn thể hiện đúng kiểu kết nối.

Adapter giữ nguyên envelope và không đổi counters/status, không fallback sang
fixture khi response live trống hoặc lỗi. `clear()` xóa ngữ cảnh. `getView()`
trả lựa chọn UI; `getResponse()` trả object gốc để lớp tích hợp xuất dữ liệu.
Việc kết nối endpoint/token, chạy job/progress và quyền DEV_SERVICE chưa nằm
trong UI review này. Không gắn token vào URL hoặc source mockup.

## Kiểm tra

```powershell
node mockup_ui/tests/service-checking.test.cjs
node mockup_ui/tests/pop-layer0.test.cjs
```

Test dùng fixtures thật và stress 50.000 ONU **chỉ trong bộ nhớ test**. Kiểm tra
cache, nguồn bất biến, full-response search/filter, pagination, mở/đóng PON,
clear/import/race, escaping, CSV injection và tab bàn phím. Đây là kiểm tra
logic/DOM mô phỏng, không thay thế kiểm tra layout bằng trình duyệt.

Kiểm thử bổ sung dùng dữ liệu tự tạo chỉ trong bộ nhớ kiểm thử: CE/Ring/Star,
DI chưa triển khai, bộ đếm Huawei ver2 có trường không kiểm tra, giá trị 0,
điều hướng từ thẻ đến bảng, thoát ngữ cảnh khi đổi thiết bị, chống chèn mã qua
metadata và lý do bỏ qua. Không gọi thiết bị hoặc hệ thống thật.
Kiểm tra thêm đường nhập trực tiếp JSON/object, khối mã JSON, thông báo lỗi,
giới hạn nội dung, xác nhận/hủy, phím tắt và nạp lại PON thu gọn.
Kiểm tra thêm chế độ production: không tự nạp mẫu, ẩn điều khiển bản mẫu nhưng
vẫn dựng dữ liệu API, đổi tab và mở/đóng ONU. Xác nhận không còn hai khối đã bỏ
và thông tin thiết bị nằm trên vùng kết quả toàn chiều ngang.


## Đồng bộ dữ liệu khách hàng

Máy chủ dùng chung `CSOCPonCustomersAPI.get_customers_by_olt`,
`prepare_cdp_rows` và `reconcile_customers` với get_customer_of_pon.
Hợp đồng, tập điểm, trạng thái lấy từ CDP đã ghép; IP WAN của mọi MAC mẫu lấy
từ ISC và quyết định Online. MAC/SN/ONU index và số đo vẫn thuộc OLT.
Không ghép dữ liệu khác OLT hay lấy ngẫu nhiên theo
thứ tự phản hồi. Lỗi CDP giữ lại hàng vật lý và thông báo lỗi cấp lượt chạy.

Hai trang nạp cùng `../shared/customer-status.js`. Nhãn được sinh từ
`CONTRACT_STATUS_LABELS` trong Python, không duy trì bảng dịch riêng trong
service_checking. Nhãn Bình Thường theo get_customer_of_pon; giá trị chưa biết
giữ nguyên. Phản hồi đã lưu không bị sửa; bảng và CSV dùng nhãn có dấu,
bản xuất JSON giữ dữ liệu gốc.

Khi cập nhật danh mục trạng thái máy chủ:

```powershell
python mockup_ui/scripts/generate-customer-status.py
python mockup_ui/scripts/generate-customer-status.py --check
node mockup_ui/tests/customer-of-pon.test.cjs
node mockup_ui/tests/service-checking.test.cjs
```
