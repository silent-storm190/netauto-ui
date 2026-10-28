# Khách hàng theo PON — giao diện bản mẫu

## Mục tiêu và cách mở

Mở [mockup.html](mockup.html) trực tiếp hoặc chọn **Quản lý Nghiệp vụ → Khách
hàng theo PON** trong `../index.html`. Tại chi tiết thiết bị, chọn một Port PON
rồi chọn **Khách hàng theo PON** cũng mở trang với thiết bị/Port điền sẵn.

Đây là giao diện đọc phản hồi của chức năng trong chat **Get Customer of PON**,
đã cập nhật theo bộ dữ liệu sau chuyển đổi ngày **28/10/2026**. Không gửi yêu
cầu mạng, kết nối thiết bị hoặc thay đổi cấu hình.

Chỉ đóng gói mẫu mới **HUEP13106GC16**, IP `11.75.123.34`, từ tệp
`372470fe-7f84-4041-bcca-c7c656d58e5d/Pasted text.txt`. Mẫu có **310 khách**:
306 có MAC/SN trên PON, 4 bản ghi chỉ có ở CDP chưa xác nhận và 3 cảnh báo.
Không suy đoán 4 bản ghi đó là Offline. Các số đếm lượt lấy CDP không được
coi là số khách của bảng.

| Port | Tổng khách | Có MAC/SN | Chưa xác nhận | Cảnh báo |
| --- | ---: | ---: | ---: | ---: |
| g0/1 | 60 | 60 | 0 | 1 |
| g0/3 | 92 | 91 | 1 | 1 |
| g0/5 | 80 | 79 | 1 | 1 |
| g0/9 | 78 | 76 | 2 | 0 |

`sample-current-response.js` giữ nguyên cấu trúc và giá trị của phản hồi.
Ba tệp dữ liệu cũ trước chuyển đổi đã được gỡ khỏi mã nguồn và trang, không
còn xuất hiện trong danh sách mẫu OLT. Trang mở trực tiếp nạp mẫu mới; mở
với tham số `olt` vẫn giữ lựa chọn của người dùng, có nút **Xem mẫu** để nạp
mẫu phù hợp. Đã bỏ dòng nguồn dưới thống kê. Thông báo nạp dữ liệu dành cho
công cụ hỗ trợ đọc màn hình vẫn ghi ngày cung cấp, không coi đây là truy vấn mới.

Phản hồi mới có `result.pon_results[]`; mỗi phần tử có `pon_port`, `count`
và `customers` riêng. `model.js` chỉ tạo danh sách nội bộ có gắn Port, không
thêm `result.customers` vào phản hồi hoặc đổi số đếm. Cảnh báo được gắn với
đúng Port, không liên kết nhầm cùng MAC/SN ở Port khác. Bộ đọc vẫn nhận cấu
trúc phẳng khi mở tệp riêng để tương thích, nhưng không còn mẫu cũ đóng gói.

Chọn OLT tự nạp đúng mẫu, chuyển về các Port đã kiểm tra, xóa bộ lọc/từ khóa
cũ và đóng Đối chiếu. **Nhập OLT khác…** cho nhập tên/IP thủ công và ẩn kết quả
trước đó. Tệp đang đọc không được ghi đè lựa chọn OLT mới hơn.

Bộ chọn OLT nằm ở đầu khối chọn, phía trên dãy Port dùng toàn bộ chiều rộng.
Port PON là các ô chữ nhật gọn, không có hình đầu nối. Bấm từng ô để chọn/bỏ
chọn, tối đa **2 Port**; chọn đủ thì các ô còn lại bị vô hiệu hóa và có chú
thích bỏ một Port trước khi chọn thêm. Đã bỏ Tìm Port, Chọn nhanh, Bỏ chọn
tất cả, nhãn Port quang, dòng đếm Port và phần nhập Port thủ công.
Chỉ dựng Port từ danh sách thật của đúng OLT,
không sinh theo tên model. Màu xanh chỉ biểu thị **đang chọn**, không phải
trạng thái hoạt động. Port chưa có kết quả ghi **Chưa có dữ liệu** ở tab,
không tự tạo khách hoặc số đo.

Danh sách khách và thống kê luôn thuộc **một Port đang mở**. Khi chọn 2 Port,
hiện 2 tab riêng; không có tab gộp tất cả Port. Mẫu hiện tại chọn sẵn `g0/1`
và `g0/3`, mở `g0/1` với 60 khách. Muốn xem `g0/5` hoặc `g0/9`, bỏ một Port
đang chọn rồi chọn Port cần xem. Dữ liệu gốc vẫn giữ đủ 310 khách của 4 Port.

## Thuật ngữ

| Từ | Nghĩa và vai trò |
| --- | --- |
| PON | Passive Optical Network, mạng quang thụ động; đơn vị lựa chọn là Port quang. |
| OLT / ONU | Optical Line Terminal / Optical Network Unit; thiết bị quang nhà mạng / thiết bị đầu cuối phía khách. |
| UI / API | Giao diện người dùng / giao diện trao đổi dữ liệu phần mềm. |
| Endpoint | Đường dẫn nhận và trả dữ liệu của hệ thống phía máy chủ. |
| JSON | Định dạng dữ liệu phản hồi được nạp tại trang. |
| IP / MAC | Địa chỉ mạng / địa chỉ nhận dạng Interface mạng. |
| SN | Serial Number, số định danh nối tiếp của thiết bị đầu cuối. |
| Rx / Tx, dBm | Công suất quang thu / phát và đơn vị đo công suất. |
| CDP (CSOC) | Nguồn hồ sơ khách hàng và đối chiếu với giá trị vật lý từ OLT trong luồng mới. |
| System Radius / ISC / Inside / PortNet | Các nguồn chỉ còn xuất hiện trong mẫu lịch sử; luồng mới không gọi các hệ thống này. |
| Slot / Index | Vị trí khe / mã số vị trí thiết bị đầu cuối trong nguồn. |
| Port / Interface | Thuật ngữ mạng, giữ nguyên; không dịch thành Cổng/Giao diện. |

## Thay đổi mô hình dữ liệu ngày 27/10/2026

Đã kiểm tra chat **Get Customer of PON** và mã xử lý hiện tại. Bộ dữ liệu ngày
28/10/2026 dùng `status/result/pon_results[]`; các nhóm `customers` và `count`
được đặt riêng trong từng Port, bên cạnh `count` tổng của kết quả:

- Luồng mới OLT → CDP, không gọi Inside, ISC/System Radius hoặc PortNet.
- Bổ sung `source_values.olt_device` và `source_values.cdp_csoc`; tên nguồn
  mới trong `data_sources` là `cdp_csoc`. Trang giữ đúng các trường có trong
  phản hồi, không tự tạo giá trị nguồn.
- Hợp đồng, IP WAN và trạng thái hợp đồng theo CDP. MAC, SN, ONU index của
  khách đang thấy trên PON ưu tiên `source_values.olt_device`; không dùng
  index CDP để thay thế index bị thiếu của thiết bị hoặc lấy thông số ONU.
- `customers.conflicts[].different_fields` có `reason=value_mismatch` hoặc
  `missing_on_one_source`. Giữ trường CDP bị thiếu khi máy chủ báo rõ lý do,
  giá trị OLT hợp lệ và bản ghi thuộc luồng OLT/CDP. Không biến `None` trong
  lịch sử System Radius thành cảnh báo mới.
- `selected_for_profile=false` nghĩa là bản ghi CDP khác cùng định danh,
  không phải hồ sơ được chọn. Vẫn giữ chênh lệch của bản ghi đó.
- Record chỉ có ở CDP nằm trong `unconfirmed`, không suy đoán Offline.
  `confirmed_offline` và `online_elsewhere` để trống trong luồng mới.
- Đối chiếu có bảng đối chiếu MAC/SN/index/OLT/Port theo hai nguồn. Cảnh báo
  mới ghi **Thiết bị OLT ↔ CDP**; cảnh báo hợp đồng trong mẫu cũ giữ nhãn
  **System Radius ↔ CDP**. Không sửa dữ liệu gốc để đổi nhãn.

Bộ mẫu hiện tại là phản hồi thực tế sau chuyển đổi. Các trường hợp phụ trợ
do kiểm thử tự tạo chỉ nằm trong tệp kiểm thử, không được đóng gói vào trang.

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

Không thêm hoặc sửa đường dẫn máy chủ trong thay đổi này. Không thêm bản ghi
hoạt động phía máy chủ hoặc ghi dữ liệu khách hàng ra
bảng điều khiển trình duyệt. Quy định tách bản ghi biên API và bản ghi hàm áp
dụng khi tích hợp máy chủ; bản mẫu không thực thi các bước đó và không tuyên
bố phần máy chủ hiện tại đã đáp ứng quy định vận hành mới.

`model.js` kiểm tra cấu trúc và tạo bản nhìn của từng nhóm. `app.js` quản lý
nhập liệu, lựa chọn Port, lọc và hộp bằng chứng. `customer-of-pon.css`
dùng chung màu, phông và nút của `../shared/netauto-shell.css`.

## Luồng trên giao diện

1. Nhận tên/Port từ đường dẫn mở trang hoặc để người dùng nhập.
2. Chọn tối đa 2 Port trên mặt thiết bị mô phỏng luôn hiển thị, không dùng hộp
   chọn thả xuống. 16 Port của mẫu hiện tại được bố trí 8 ô mỗi hàng trên màn
   hình rộng, 4 ô mỗi hàng trên điện thoại. Chọn/bỏ chọn qua chuột hoặc Tab
   và phím Space của hộp đánh dấu gốc; có đường viền khi nhận bàn phím.
   Chọn/bỏ từng ô hoặc gỡ từng thẻ đã chọn, không có nút chọn/bỏ chọn hàng loạt.
   Giới hạn áp dụng cả khi mở bằng tham số
   đường dẫn, nạp mẫu hoặc tệp: chỉ chọn sẵn 2 Port hợp lệ đầu tiên.
   Khi chọn 2 Port, thanh tab trên bảng có từng Port kèm số khách, không có
   tab **Tất cả**. Chuyển tab đổi đồng thời thống kê, bảng khách và bảng đối chiếu, kết hợp
   được với tìm kiếm/nhóm trạng thái. Port chọn thêm nhưng chưa nằm trong
   phản hồi được ghi **Chưa có dữ liệu**, không hiển thị số 0 như Port đã quét
   nhưng rỗng. Tab không gọi thiết bị hoặc tự sinh khách. Đổi OLT/nạp mẫu mới
   đặt lại tab Port; nút Bỏ lọc giữ Port đang mở. Bỏ toàn bộ Port thì hiện
   lời nhắc chọn Port, không hiện bảng khách gộp.
3. Danh sách lấy từ `result.ports.available_pon_ports` của **đúng thiết bị**,
   khớp một trong `olt.input`, `olt_name`, `name`, `olt_ip`, `ip` (không phân
   biệt hoa/thường). Nếu thiếu danh sách đầy đủ, chỉ dùng `valid_ports` và
   thông báo đây là các Port đã kiểm tra, không phải toàn bộ Port thiết bị.
   Không sinh Port dựa trên dòng thiết bị. Đổi thiết bị xóa lựa chọn cũ.
4. Khi chưa có danh sách, hướng dẫn nạp dữ liệu đúng thiết bị; không có ô nhập
   Port thủ công. Port từ tham số đường dẫn nằm ngoài danh sách nguồn có nhãn
   **Chưa xác minh**. Khối chọn chỉ giữ các trường
   thiết bị/Port; không còn nút Chuẩn bị yêu cầu hoặc khối xem nội dung gửi đi.
5. Nút **Xem mẫu** mở dữ liệu có sẵn, **Mở tệp dữ liệu** nhận tệp đã lưu.
   Không còn phần dán phản hồi. Giới hạn tệp 8 MiB (8 × 1.024 × 1.024 byte).
   Tệp sai không thay kết quả cũ và có thông báo; tệp đọc muộn không ghi đè
   lần nạp mới hơn. Nạp tệp thành công đồng bộ thiết bị theo phản hồi, chọn
   sẵn tối đa 2 Port hợp lệ đầu tiên và mở tab Port đầu tiên.
6. Đọc `pon_results[]`, gắn mỗi khách/cảnh báo với `pon_port`, rồi đọc
   `observed_on_requested_pon`, `confirmed_offline`, `online_elsewhere`,
   `unconfirmed` và `conflicts` trong `customers` của từng Port.
   Bốn nhóm đầu là khách; `conflicts` là cảnh báo tham chiếu, không cộng vào
   `count.total` và không tạo khách trùng. Phản hồi chỉ có `online/offline`
   cũ bị từ chối với hướng dẫn cấu trúc mới. `unclassified_customers` vẫn
   được giữ riêng khi không đọc được thiết bị, không biến thành mất kết nối.
7. Hiển thị liên tục toàn bộ bản ghi khớp bộ lọc để cuộn đến hết; không có
   phân trang, nút Trước/Sau hay chọn số dòng. Lọc Port dùng **PON yêu cầu**,
   không phải Port khách chuyển tới. Số khách nguồn không bị ghi đè; thiếu
   là “-”, giá trị 0 được giữ. Số cảnh báo hiển thị chỉ tính chênh lệch hợp lệ
   với CDP; số gốc vẫn giữ nguyên trong phản hồi đã nạp.
8. **Đối chiếu** là tóm tắt ngắn: trạng thái, nhóm khách, Port kiểm tra, Port
   mới nếu khác, định danh và số đo có thật. Không còn dòng “DỮ LIỆU ĐỐI CHIẾU”
   hoặc phần “Kết luận và nguồn quyết định”. Chỉ hiện các trường có dữ liệu;
   không có bảng kỹ thuật dày đặc, độ tin cậy, lịch sử phiên hoặc dữ liệu thô.
   Dữ liệu và lỗi gốc vẫn được giữ trong phản hồi gốc, không bị xóa.
   Trạng thái kết nối, trạng thái hợp đồng và nhóm khách nằm trên một dòng
   co giãn. Phần tóm tắt dùng tối đa 3 cột; không lặp MAC/SN/index đã có trong
   bảng nguồn. OLT và Port nguồn được gom thành một dòng trong bảng so sánh;
   nếu bảng nguồn đã thể hiện đúng vị trí yêu cầu thì không lặp Port kiểm tra.
   Trường thiếu ở nguồn vẫn hiện “-”; giá trị khác nhau có nền nhạt và chữ
   “Khác nhau”, không làm thay đổi số cảnh báo từ phản hồi. Các bản ghi chênh
   lệch khác do máy chủ báo vẫn hiện riêng để không mất bằng chứng.
   Chênh lệch được trình bày thành hai giá trị cạnh nhau, có tên nguồn và dấu
   khác nhau; tiêu đề cụ thể như “Hợp đồng không khớp”, “Vị trí khác nhau”.
   Giá trị `device_value` của luồng mới gắn nhãn **Thiết bị OLT**; dữ liệu cũ
   dùng **Giá trị phía System Radius**. `csoc_value` gắn nhãn **Giá trị phía
   CDP**. Cảnh báo thiếu trường ở CDP hiện rõ “CDP thiếu SN” và giá trị thiết
   bị; giá trị CDP bị thiếu hiển thị “-”. Bỏ `multiple_contracts_for_mac` khỏi
   phần hiển thị vì lịch sử một nguồn không phải chênh lệch với CDP.
   Không đổi khóa dữ liệu gốc. Cách gọi này dùng cả ở bảng mâu thuẫn và
   hộp Đối chiếu; nhãn nguồn `csoc_*` được trình bày là CDP, không đổi dữ liệu.
   Không có chênh lệch thì không tạo khối cảnh báo trống. Liên kết về khách
   theo `matched_by` cùng MAC, SN hoặc hợp đồng, không dùng index làm khóa.
   Không ghép khe/Port giữa nguồn.
   Bộ lọc chỉ cảnh báo có thể gồm cả mâu thuẫn vị trí và index tái sử dụng;
   thẻ Cần kiểm tra chỉ chứa chênh lệch hợp lệ với CDP từ `customers.conflicts`.
   `index_reused` có cảnh báo ngắn “Index đang thuộc ONU khác”, cùng index và
   định danh đang dùng nếu có. Không lấy công suất của định danh khác và
   không sao chép `device_index_check.onu` vào công suất khách. Các lần kiểm
   tra PON đích, nguồn đồng thuận và trường kỹ thuật vẫn nằm trong phản hồi gốc,
   không dựng thêm khối rỗng hoặc cho mở dữ liệu thô trong hộp Đối chiếu.
9. Đã bỏ nút **Xuất phản hồi gốc** và **Xóa kết quả**, cùng các phần xử lý
   của hai nút. Mở tệp mới hoặc xem mẫu thay kết quả đang hiển thị. Dữ liệu
   gốc vẫn được giữ nguyên trong bộ nhớ; không lưu dữ liệu người dùng nhập
   vào bộ nhớ lâu dài của trình duyệt.

## Những ý nghĩa phải giữ riêng

Nhãn tổng quan dùng “Tổng khách hàng”, “Kh.H có MAC trên port PON”,
“Khách hàng Offline” và “Cần kiểm tra” (cảnh báo tham chiếu khách,
không cộng thêm vào tổng). Bỏ câu tóm tắt thành công và dòng liệt kê toàn bộ
Port PON có sẵn. Danh sách Port vẫn được giữ nguyên trong dãy ô chọn Port
và trong dữ liệu gốc. Bỏ khối “Cần lưu ý từ phản hồi”; chỉ hiện lỗi thực sự
khi xử lý thất bại. Bỏ các nhãn chất lượng nguồn kỹ thuật khỏi khối tổng quan.
Tổng quan dùng 4 ô thống kê theo lưới 2 cột, 2 hàng; mỗi ô đặt nhãn bên trái,
số bên phải, canh giữa theo chiều dọc. Cả 4 ô dùng nền đậm, chữ trắng, cùng cỡ
số và độ đậm nhãn; không dùng vách dọc hoặc ký hiệu trừu tượng. Tổng khách
dùng xanh lam, “Kh.H có MAC trên port PON” dùng xanh lá, “Khách hàng Offline”
dùng xám và “Cần kiểm tra” dùng cam, với chữ/số có độ tương phản rõ trên nền.
Bỏ hai ô “Khách hàng kết nối nơi khác” và “Chưa đủ dữ liệu” khỏi tổng quan;
vẫn giữ dữ liệu và bộ lọc của hai nhóm này. Thống kê lấy từ `count` của Port
đang mở, không dùng tổng 4 Port. Với tệp phẳng cũ, đếm theo các dòng thuộc
Port; không thay đổi phản hồi gốc. Không tự đổi số lượng các nhóm.
Đã bỏ câu mô tả dài dưới tiêu đề trang. Các nhãn
vẫn hiển thị đầy đủ để không phụ thuộc riêng vào màu sắc.
Từ 1200px, khối chọn thiết bị/Port chiếm **2/3**, thống kê bên phải chiếm
**1/3** trên cùng một hàng; danh sách khách chiếm toàn bộ chiều rộng bên dưới.
Màn hình nhỏ hơn xếp dọc; các chỉ số xuống 2 cột trên điện thoại. Port kiểm tra
được đóng nhãn lớn cạnh tên OLT, xuống dòng khi chọn nhiều Port; IP nằm dưới
tên thiết bị. Không còn các nút xuất/xóa, chú thích và bảng
thuật ngữ cuối trang. `net_status` (hoặc `contract_status` do máy chủ chuẩn hóa)
được đóng nhãn nền xanh nhẹ ở cột Trạng thái HĐ, không tạo nhãn khi thiếu.
Riêng “Chủ thuê bao đi vắng” dùng cam và “Ngưng vì lý do thanh toán” dùng đỏ,
gồm chữ/viền có màu và nền nhạt cùng tông. So khớp không phân biệt hoa/thường,
dấu tiếng Việt hoặc khoảng trắng thừa; giữ nguyên nội dung nhãn từ nguồn.

Bảng chính thuần bảng với 15 cột: **Hợp đồng**, **Trạng thái HĐ**, **Trạng thái
ONU**, **Có MAC trên Port PON**, **Port PON**, **ONU index**, **Model ONU**,
**MAC**, **SN**, **IP WAN**, **Rx**, **Tx**, **Nhiệt độ**, **Khoảng cách**,
và nút **Đối chiếu**. Các thông tin vị trí hiện tại, kết luận vị trí và chênh
lệch giữa nguồn nằm trong hộp mở từ nút Đối chiếu, không chiếm cột riêng. Mỗi ô chỉ
có một giá trị, không có khối con hoặc thông tin xếp tầng. Chỉ hai trạng thái
dùng nhãn màu; số hợp đồng giữ chữ đậm xanh. Cột Có MAC trên Port PON chỉ dùng
dấu tick xanh khi nhóm quan sát trên PON có MAC thiết bị, dấu chéo đỏ khi chưa
ghi nhận MAC. Biểu tượng có chú thích và nhãn hỗ trợ đọc màn hình; không suy
ra trạng thái Online/Offline từ dấu tick/chéo này.

Cỡ chữ dữ liệu, MAC/SN/IP là 13px; tiêu đề và nhãn trạng thái 12px. Đơn vị số
đo nằm ở tiêu đề cột. Các giá trị từ Port PON đến khoảng cách được căn giữa
cùng trục với tên cột. Dòng gọn, viền ngang nhẹ, nền xen
kẽ; giữ cột hợp đồng bên trái khi cuộn ngang. Cột Đối chiếu cuộn cùng các cột
dữ liệu, không ghim đè lên Rx/Tx hoặc cắt tiêu đề giữa chừng. Bảng chiếm 100%
khung, chia độ rộng cột theo tỷ lệ và giảm khoảng đệm còn 6px để nút Đối chiếu
hiện đủ trên màn hình máy tính. Giá trị dài tự xuống dòng. Khung hẹp hơn
1100px vẫn cuộn ngang để giữ khả năng đọc. Rx và Tx rộng bằng nhau, tiêu đề
tách đơn vị xuống dòng, khoảng đệm ngang 6px. Nhiệt độ và khoảng cách cũng
tách tên chỉ số/đơn vị thành hai dòng rõ ràng, không tách rời ký hiệu đơn vị.
Toàn bộ tên cột và số đo bên dưới được căn giữa, áp dụng cho cả tiêu đề bám
đầu trang và tiêu đề gốc.
Tiêu đề và nội dung dài tự xuống dòng, không cắt bằng dấu ba chấm; vẫn là
một giá trị trong mỗi ô. Dữ liệu cột hợp đồng canh trái,
hai trạng thái và dấu ghi nhận MAC canh giữa. Tiêu đề cột MAC ngắt cố định thành
hai dòng “Có MAC trên” / “Port PON” để thu gọn cột. Không lặp tên OLT trên mọi dòng
khi đã có ở tổng quan.

Khung bảng chỉ có cuộn ngang, không giới hạn chiều cao. Cho phép cuộn dọc
tiếp ra trang (`overscroll-behavior:auto`), không chặn sự kiện bánh xe chuột,
để tiếp tục xem toàn bộ khách khi con trỏ ở trong bảng. Không có phân trang.
Tiêu đề được tách ra khung riêng bên ngoài vùng cuộn ngang, bám đầu khung
nhìn trong phạm vi bảng khi cuộn trang xuống. Tiêu đề và thân dùng cùng bộ
chiều rộng cột, đồng bộ cuộn ngang theo hai chiều bằng sự kiện thụ động,
không chặn cuộn dọc. Cả bảng khách và bảng đối chiếu dùng cách này. Bản tiêu
đề hiển thị được ẩn khỏi công cụ hỗ trợ đọc màn hình; tiêu đề có `scope` của
bảng dữ liệu vẫn còn, chỉ ẩn trực quan. Không sao chép ID vào tiêu đề hiển thị.
Không tự thêm số đo. Không hiển thị độ tin cậy, nguồn kỹ thuật, thông báo
“Có dữ liệu hợp lệ” hoặc thời gian vào/ra trên từng dòng. Bằng chứng kỹ thuật
đầy đủ vẫn còn trong phản hồi gốc đã nạp. Vị trí hiện tại chỉ hiện nếu khác
vị trí yêu cầu; không lặp lại vị trí cũ. `None`, `null`, `N/a`, chuỗi rỗng,
chuỗi chỉ có khoảng trắng và giá trị không có đều hiển thị **“-”**; không
phân biệt hoa/thường ở dấu hiệu thiếu dữ liệu. Số **0** và giá trị **false**
được giữ nguyên. Chỉ chuẩn hóa phần hiển thị, không sửa phản hồi gốc.

| Trường | Ý nghĩa hiển thị |
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
đổi thiết bị và thứ tự đọc tệp bất đồng bộ. Kiểm tra trực tiếp
phản hồi thật: giữ đủ 310 khách trong nguồn, 16 ô Port, 2 Port được chọn sẵn,
tab đầu hiển thị 60 khách. Thay lựa chọn để kiểm tra riêng số khách/cảnh báo
theo từng Port 60/92/80/78; thống kê theo tab, không có tab gộp. Kiểm tra chặn
Port thứ ba, Port chưa có dữ liệu, bỏ chọn từng ô đến hết,
giữ tab khi bỏ lọc và giữ nguyên phản hồi.

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
