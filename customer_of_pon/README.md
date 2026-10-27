# Khách hàng theo PON — giao diện bản mẫu

## Mục tiêu và cách mở

Mở [mockup.html](mockup.html) trực tiếp hoặc chọn **Quản lý Nghiệp vụ → Khách
hàng theo PON** trong `../index.html`. Tại chi tiết thiết bị, chọn một Port PON
rồi chọn **Khách hàng theo PON** cũng mở trang với thiết bị/Port điền sẵn.

Đây là giao diện đọc phản hồi của chức năng mới trong chat **Get Customer of
PON**, đối chiếu với mã nguồn ngày 26/10/2026. Không có khách hàng giả lập lúc
khởi tạo. Không gửi yêu cầu mạng, kết nối thiết bị hoặc thay đổi cấu hình.

Trang mở trực tiếp sẽ hiển thị nguyên phản hồi thật người dùng cung cấp:
**HCMP45608GC16 / g0/1**, 103 khách (100 có MAC/SN trên PON, 3 xác nhận mất
kết nối, 0 kết nối nơi khác, 0 chưa đủ dữ liệu). Phản hồi gốc có 6 cảnh báo
lịch sử; theo quy tắc mới, cả 6 không phải chênh lệch với CDP nên số cảnh báo
hiển thị là 0. `sample-response.js` lưu đúng phản hồi, không dựng lại bản ghi. Nhãn
nguồn ghi rõ ngày 26/10/2026, không phải kết quả kiểm tra mới. Nếu mở từ Port
với tham số `olt`, không tự nạp phản hồi của thiết bị khác; có nút mở mẫu riêng.

Đã thay mẫu cũ bằng tệp người dùng gửi mới nhất (tệp đính kèm
`bbc050fa-cd78-4a44-911a-01b33eb4eec9/Pasted text.txt`). Sáu cảnh báo trong
bản này là `multiple_contracts_for_mac`: lịch sử System Radius có nhiều hợp
đồng cho cùng MAC. Không hiển thị lịch sử này trong bảng cảnh báo, chỉ nhận
chênh lệch có giá trị hợp lệ ở cả hai bên và nguồn đối chiếu là CDP (`csoc_*`).
Giá trị rỗng, `None`, `null` hoặc chưa gán không tạo cảnh báo. Số Conflict data
trên tổng quan và nút lọc dùng số cảnh báo hợp lệ sau bước lọc này.
Giữ nguyên toàn bộ `customer_profile_resolution`, lựa chọn và thông tin bổ
sung trong phản hồi, không lọc mất dữ liệu gốc khi hiển thị.

Đã bổ sung trường hợp **HUEP00602GC16 / g0/16**, IP `11.75.122.161`, từ tệp
`239b87ec-5e0c-469f-8ce7-4903321228ec/Pasted text.txt`: **52 khách**, gồm 49
có MAC/SN trên PON, 3 Offline và 0 Conflict data. `sample-hue-response.js`
giữ nguyên nội dung phản hồi và đăng ký cùng mẫu cũ trong `NETAUTO_PON_SAMPLES`.
Không thay thế mẫu HCMP45608GC16; khi mở trực tiếp vẫn mặc định mẫu cũ.

Đã thêm **HUEP13106GC16 / g0/9**, IP `11.75.123.34`, từ tệp
`e55ecf7c-bfcf-4d07-b742-665a032538c1/Pasted text.txt` ngày **27/10/2026**:
**79 khách**, gồm 76 có MAC/SN trên PON, 1 Offline, 2 kết nối nơi khác,
0 chưa đủ dữ liệu và 1 chênh lệch hợp đồng với CDP. `sample-huep131-response.js`
giữ nguyên phản hồi và thêm mẫu vào danh sách hiện tại. Cảnh báo này liên kết
về khách đã có, không cộng thêm vào tổng 79; vị trí mới g0/13 vẫn được hiển
thị trong nhóm kết nối nơi khác. Hai mẫu trước và lựa chọn mặc định được giữ.
Phản hồi này có cùng một định danh trong nhóm có MAC/SN và nhóm kết nối nơi
khác; bản mẫu giữ nguyên hai dòng nguồn, không tự gộp hoặc đổi tổng 79. Một
cảnh báo hợp đồng được liên kết với cả hai dòng nhưng vẫn chỉ tính 1 cảnh báo.

Trường OLT có danh sách chọn ba thiết bị. Chọn OLT tự nạp dữ liệu đúng mẫu,
chuyển về Port đã kiểm tra của mẫu, xóa bộ lọc/từ khóa cũ và đóng hộp Chi tiết.
Port còn có sẵn khác chỉ là phạm vi lựa chọn, không tự tạo kết quả cho Port
chưa có dữ liệu. Nút **Xem mẫu** nạp lại mẫu của OLT đang chọn. **Nhập OLT
khác…** cho phép nhập tên/IP thủ công và ẩn kết quả thiết bị trước; OLT mở
từ đường dẫn hoặc tệp riêng vẫn được giữ. Tệp đang đọc không được ghi đè lựa
chọn OLT mới hơn. Không thực hiện yêu cầu mạng hoặc kết nối thiết bị.

## Thuật ngữ

| Từ | Cách đọc | Nghĩa |
| --- | --- | --- |
| PON | pôn | Mạng quang thụ động; đơn vị lựa chọn là Port quang. |
| OLT / ONU | ô-el-ti / ô-en-iu | Thiết bị quang nhà mạng / thiết bị đầu cuối phía khách. |
| UI / API | iu-ai / ây-pi-ai | Giao diện người dùng / giao diện trao đổi dữ liệu phần mềm. |
| Endpoint | en-pọi-nt | Đường dẫn nhận và trả dữ liệu của hệ thống phía máy chủ. |
| JSON | giây-sần | Định dạng dữ liệu phản hồi được nạp tại trang. |
| IP / MAC | ai-pi / mắc | Địa chỉ mạng / địa chỉ nhận dạng Interface mạng. |
| SN | ét-en | Số định danh nối tiếp của thiết bị đầu cuối. |
| Rx / Tx, dBm | a-rờ-ích / tê-ích, đê-bê-em | Công suất quang thu / phát; đơn vị công suất. |
| CSOC / ISC / Inside | xi-sóc / ai-ét-xi / in-sai | Các hệ thống nguồn của dữ liệu đối soát. |
| Radius / PortNet | rê-đi-ợs / poọt-nét | Hai nguồn tọa độ CSOC trả độc lập. |
| System Radius / CDP | xít-tầm rê-đi-ợs / xi-đi-pi | Tên hiển thị hai nguồn đối chiếu. Hợp đồng phía System Radius lấy từ `GetOSPContractPON`; các khóa gốc `isc_system_radius`, `csoc_*` vẫn được giữ. |
| Slot / Index | x-lót / in-đếch | Vị trí khe / mã số vị trí thiết bị đầu cuối trong nguồn. |
| Port / Interface | poọt / in-tơ-phây-s | Thuật ngữ mạng, giữ nguyên; không dịch thành Cổng/Giao diện. |

## Hợp đồng dữ liệu và điểm bắt đầu

Giao diện chuẩn bị nội dung cho `POST /netauto/osp_info/check-customer-of-pon`:

```json
{"olt":"<tên hoặc IP thiết bị>","pon_ports":["<Port cần kiểm tra>"]}
```

Đường dẫn hiện có yêu cầu xác thực qua `token_required`; không lưu hay nhập
thông tin xác thực vào bản mẫu. Mã máy chủ bắt đầu tại
`../../components/endpoints/osp_info.py`, gọi
`../../components/get_info/customer_of_pon/workflow.py`; các quy tắc ghép và
đối chiếu nằm ở `reconciliation.py` và `move_check.py` cùng thư mục đó.
Xem [thiết kế chức năng](../../components/get_info/customer_of_pon/DESIGN.md)
cho nhánh nghiệp vụ đầy đủ. Mã 400 dùng cho nội dung đầu vào không hợp lệ;
mã 200 vẫn phải đọc `status`, `error`, `warnings` và chất lượng nguồn, không
coi việc nhận phản hồi là kiểm tra thành công.

Không thêm hoặc sửa đường dẫn máy chủ trong thay đổi này. Không thêm log
(đọc: loóc — bản ghi hoạt động) phía máy chủ hoặc ghi dữ liệu khách hàng ra
bảng điều khiển trình duyệt. Quy định tách bản ghi biên API và bản ghi hàm áp
dụng khi tích hợp máy chủ; bản mẫu không thực thi các bước đó và không tuyên
bố phần máy chủ hiện tại đã đáp ứng quy định vận hành mới.

`model.js` kiểm tra cấu trúc và tạo bản nhìn của từng nhóm. `app.js` quản lý
nhập liệu, lựa chọn Port, lọc và hộp bằng chứng. `customer-of-pon.css`
dùng chung màu, phông và nút của `../shared/netauto-shell.css`.

## Luồng trên giao diện

1. Nhận tên/Port từ đường dẫn mở trang hoặc để người dùng nhập.
2. Chọn nhiều Port bằng danh sách có tìm kiếm, hộp đánh dấu và thẻ đã chọn.
   Có nút chọn toàn bộ kết quả đang lọc, bỏ chọn và gỡ từng thẻ. Mở danh sách
   đưa con trỏ vào tìm kiếm; phím Escape đóng và trả con trỏ về nút mở.
3. Danh sách lấy từ `result.ports.available_pon_ports` của **đúng thiết bị**,
   khớp một trong `olt.input`, `olt_name`, `name`, `olt_ip`, `ip` (không phân
   biệt hoa/thường). Nếu thiếu danh sách đầy đủ, chỉ dùng `valid_ports` và
   thông báo đây là các Port đã kiểm tra, không phải toàn bộ Port thiết bị.
   Không sinh Port dựa trên dòng thiết bị. Đổi thiết bị xóa lựa chọn cũ.
4. Khi chưa có danh sách, phần nhập thủ công vẫn dùng được. Port ngoài danh
   sách nguồn có nhãn **Chưa xác minh**. Không tự chuẩn hóa theo hãng thiết bị;
   máy chủ chịu trách nhiệm xác minh khi tích hợp. Khối chọn chỉ giữ các trường
   thiết bị/Port; không còn nút Chuẩn bị yêu cầu hoặc khối xem nội dung gửi đi.
5. Nút **Xem mẫu** mở dữ liệu có sẵn, **Mở tệp dữ liệu** nhận tệp đã lưu.
   Không còn phần dán phản hồi. Giới hạn tệp 8 MiB (8 × 1.024 × 1.024 byte).
   Tệp sai không thay kết quả cũ và có thông báo; tệp đọc muộn không ghi đè
   lần nạp mới hơn. Nhập tên thiết bị còn trống được điền từ phản hồi; bản
   nháp khác đã nhập được giữ nguyên.
6. Đọc cấu trúc phẳng mới: `observed_on_requested_pon`, `confirmed_offline`,
   `online_elsewhere`, `unconfirmed` và `conflicts` trong `customers`.
   Bốn nhóm đầu là khách; `conflicts` là cảnh báo tham chiếu, không cộng vào
   `count.total` và không tạo khách trùng. Phản hồi chỉ có `online/offline`
   cũ bị từ chối với hướng dẫn cấu trúc mới. `unclassified_customers` vẫn
   được giữ riêng khi không đọc được thiết bị, không biến thành mất kết nối.
7. Hiển thị liên tục toàn bộ bản ghi khớp bộ lọc để cuộn đến hết; không có
   phân trang, nút Trước/Sau hay chọn số dòng. Lọc Port dùng **PON yêu cầu**,
   không phải Port khách chuyển tới. Số khách nguồn không bị ghi đè; thiếu
   là “—”, giá trị 0 được giữ. Số cảnh báo hiển thị chỉ tính chênh lệch hợp lệ
   với CDP; số gốc vẫn giữ nguyên trong phản hồi đã nạp.
8. **Chi tiết** là tóm tắt ngắn: trạng thái, nhóm khách, Port kiểm tra, Port
   mới nếu khác, định danh và số đo có thật. Không còn dòng “DỮ LIỆU ĐỐI CHIẾU”
   hoặc phần “Kết luận và nguồn quyết định”. Chỉ hiện các trường có dữ liệu;
   không có bảng kỹ thuật dày đặc, độ tin cậy, lịch sử phiên hoặc dữ liệu thô.
   Dữ liệu và lỗi gốc vẫn được giữ trong phản hồi gốc, không bị xóa.
   Chênh lệch được trình bày thành hai giá trị cạnh nhau, có tên nguồn và dấu
   khác nhau; tiêu đề cụ thể như “Hợp đồng không khớp”, “Vị trí khác nhau”.
   Giá trị hợp đồng `device_value` gắn nhãn **Giá trị phía System Radius**
   (nguồn thực là `GetOSPContractPON`), `csoc_value` gắn nhãn **Giá trị phía
   CDP** với loại chênh lệch hai nguồn. Bỏ `multiple_contracts_for_mac` khỏi
   phần hiển thị vì lịch sử một nguồn không phải chênh lệch với CDP.
   Không đổi khóa dữ liệu gốc. Cách gọi này dùng cả ở bảng mâu thuẫn và
   hộp Chi tiết; nhãn nguồn `csoc_*` được trình bày là CDP, không đổi dữ liệu.
   Không có chênh lệch thì không tạo khối cảnh báo trống. Liên kết về khách
   theo `matched_by` cùng MAC, SN hoặc hợp đồng, không dùng index làm khóa.
   Không ghép khe/Port giữa nguồn.
   Bộ lọc chỉ cảnh báo có thể gồm cả mâu thuẫn vị trí và index tái sử dụng;
   thẻ Conflict data chỉ chứa chênh lệch hợp lệ với CDP từ `customers.conflicts`.
   `index_reused` có cảnh báo ngắn “Index đang thuộc ONU khác”, cùng index và
   định danh đang dùng nếu có. Không lấy công suất của định danh khác và
   không sao chép `device_index_check.onu` vào công suất khách. Các lần kiểm
   tra PON đích, nguồn đồng thuận và trường kỹ thuật vẫn nằm trong phản hồi gốc,
   không dựng thêm khối rỗng hoặc cho mở dữ liệu thô trong hộp Chi tiết.
9. Đã bỏ nút **Xuất phản hồi gốc** và **Xóa kết quả**, cùng các phần xử lý
   của hai nút. Mở tệp mới hoặc xem mẫu thay kết quả đang hiển thị. Dữ liệu
   gốc vẫn được giữ nguyên trong bộ nhớ; không lưu dữ liệu người dùng nhập
   vào bộ nhớ lâu dài của trình duyệt.

## Những ý nghĩa phải giữ riêng

Nhãn tổng quan dùng “Tổng Khách hàng ghi nhận trên PON”, “Khách hàng Offline”,
“Khách hàng kết nối nơi khác” và “Conflict data” (cảnh báo tham chiếu khách,
không cộng thêm vào tổng). Bỏ câu tóm tắt thành công và dòng liệt kê toàn bộ
Port PON có sẵn. Danh sách Port vẫn được giữ nguyên trong hộp chọn nhiều Port
và trong dữ liệu gốc. Bỏ khối “Cần lưu ý từ phản hồi”; chỉ hiện lỗi thực sự
khi xử lý thất bại. Bỏ các nhãn chất lượng nguồn kỹ thuật khỏi khối tổng quan.
Tổng quan dùng 6 ô thống kê theo lưới 3 cột, 2 hàng; mỗi ô đặt nhãn bên trái,
số bên phải, canh giữa theo chiều dọc. Cả 6 ô dùng nền đậm, chữ trắng, cùng cỡ
số và độ đậm nhãn; không dùng vách dọc hoặc ký hiệu trừu tượng. Tổng khách
dùng xanh lam, “Có MAC/SN trên PON” dùng xanh lá, “Khách hàng Offline” dùng xám,
“Khách hàng kết nối nơi khác” xanh ngọc đậm, “Chưa đủ dữ liệu” tím và “Conflict
data” dùng cam, với chữ/số có độ tương phản rõ trên nền tương ứng. Các nhãn
vẫn hiển thị đầy đủ để không phụ thuộc riêng vào màu sắc.
Từ 1200px, khối chọn thiết bị/Port và khối kết quả nằm cạnh nhau
trên cùng một hàng, danh sách khách vẫn chiếm toàn bộ chiều rộng bên dưới.
Màn hình nhỏ hơn xếp dọc; các chỉ số xuống 2 cột trên điện thoại. Port kiểm tra
được đóng nhãn lớn cạnh tên OLT, xuống dòng khi chọn nhiều Port; IP nằm dưới
tên thiết bị. Không còn các nút xuất/xóa, chú thích và bảng
thuật ngữ cuối trang. `net_status` (hoặc `contract_status` do máy chủ chuẩn hóa)
được đóng nhãn nền xanh nhẹ bên dưới số hợp đồng, không tạo nhãn khi thiếu.

Bảng chính gọn 5 cột: **Khách hàng**, **Thiết bị ONU**, **Port PON/Đối chiếu**,
**Thông số ONU**, **Chi tiết**. Cột Khách hàng chứa HĐ và IP WAN; model/SN/MAC
có cột ONU riêng, index nằm cạnh Port. Tag trạng thái và nhóm nhỏ, gắn góc
trên bên phải từng cụm, có chữ/dấu chấm để không chỉ dựa vào màu. Cảnh báo
ghi rõ “Một MAC · nhiều HĐ”, “HĐ không khớp” hoặc “Index của ONU khác”.
Thông số ONU gồm Rx/Tx và nhiệt độ/khoảng cách theo lưới 2×2, đơn vị luôn
đi cùng giá trị, không tự thêm số đo. Không hiển thị độ tin cậy, nguồn kỹ thuật, thông báo
“Có dữ liệu hợp lệ” hoặc thời gian vào/ra trên từng dòng. Bằng chứng kỹ thuật
đầy đủ vẫn còn trong phản hồi gốc đã nạp. Vị trí hiện tại chỉ hiện nếu khác
vị trí yêu cầu; không lặp lại vị trí cũ. Trường thiếu không tạo dòng nhãn
kèm “—”; giá trị 0 vẫn hiện, không bị xem là thiếu. Nếu chưa có công suất,
chỉ hiện “chưa có thông tin”.

| Trường | Cách đọc trên giao diện |
| --- | --- |
| `customers.observed_on_requested_pon` | Có MAC/SN trên PON; chưa bảo đảm đang kết nối hoặc có công suất. |
| `customers.confirmed_offline` | Các nguồn đã xác nhận mất kết nối. |
| `customers.online_elsewhere` | Đang kết nối ngoài trạng thái quan sát của PON đầu vào. |
| `customers.unconfirmed` | Chưa đủ bằng chứng kết luận. |
| `customers.conflicts` | Cảnh báo tham chiếu lại khách, không cộng thêm vào tổng. |
| `status` cấp khách | Có/không lấy được dữ liệu đo hợp lệ; không phải trạng thái kết nối. |
| `customer_state`, `onu_status` | Trạng thái kết nối do máy chủ trả; không suy từ công suất. |
| `move_check.status` | Kết luận di chuyển hoặc chưa đủ bằng chứng từ máy chủ. |
| `customer_state_source` | Nguồn được máy chủ chọn để quyết định trạng thái. |
| `location_sources`, `location_alternatives`, `conflicts` | Đồng thuận và mâu thuẫn theo từng nguồn. |
| `contract_status` | Giữ nhãn nguồn, bao gồm “Bình Thường”; không liên đới nhóm hiện diện. |

## Kiểm tra, khôi phục và giới hạn

Chạy từ thư mục `mockup_ui`:

```text
node tests/customer-of-pon.test.cjs
node tests/pop-layer0.test.cjs
node tests/device-overview.test.cjs
```

Dữ liệu tự tạo chỉ tồn tại trong kiểm thử, không được nhúng vào trang. Kiểm
thử gồm phân nhóm, số 0, lỗi/chưa phân loại, khách kết nối nơi khác, mâu thuẫn,
tọa độ thay thế, chèn mã qua dữ liệu, lọc, cuộn toàn bộ khách, chọn nhiều Port,
đổi thiết bị, nhập thủ công và thứ tự đọc tệp bất đồng bộ. Kiểm tra trực tiếp
phản hồi thật: đúng 103 khách hiển thị liên tục, 16 Port, loại 6 cảnh báo lịch sử
khỏi phần đối chiếu, vẫn giữ nguyên bản và cô lập công suất tại index dùng lại.

Giao diện dùng hộp thoại nguyên bản của trình duyệt, nền sáng/tối, bảng cuộn
ngang và bố cục co giãn. Chưa có kiểm chứng trực quan trên trình duyệt trong
phiên triển khai này; chưa kiểm tra liên thông hệ thống và thiết bị thật.
Phản hồi mẫu thật chứa dữ liệu khách hàng; không công khai hoặc đưa lên dịch
vụ lưu trữ bên ngoài. Không có bước đăng tải trong thay đổi này.

Không cần cấu hình, biến môi trường hoặc bí mật để mở bản mẫu. Dữ liệu nạp
có thể chứa thông tin khách hàng: chỉ mở trên máy được phép, không công
khai tệp. Để khôi phục giao diện, gỡ mục `customerpon` trong danh mục, đường
dẫn từ bảng Port và các tệp thuộc thư mục này; không hoàn tác toàn bộ các tệp
dùng chung vì còn thay đổi khác của người dùng. Không có thay đổi thiết bị
hay cơ sở dữ liệu cần khôi phục.
