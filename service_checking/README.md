# Kiểm tra dịch vụ · UI review NetAuto

Mở `mockup.html`, hoặc vào portal `../index.html` → Quản lý Nghiệp vụ →
Kiểm tra dịch vụ. Giao diện dùng trực tiếp `netauto-shell.css`, light mode,
token/màu, button và ngôn ngữ thiết kế NetAuto. Không sử dụng tiến trình giả,
topology mẫu hay gán kết luận không có trong response.

## Dữ liệu

`responses.js` giữ nguyên 5 response format hiện tại người dùng cung cấp:
HW24 (bản mới đủ 7 route), H3C CV52, HW67 không đạt, OLT HA58 và GC16.
Hai OLT có tổng 48 PON và 130 ONU đã trả; response đang giới hạn 3 ONU/PON.
Không dùng các snapshot HW24/CH52 cũ hoặc log MB.

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
  `ONU chi tiết / Total MAC` dùng số bản ghi ONU / `total_mac` từ nguồn,
  không thay bằng `available_onu`. Số Có sẵn vẫn hiển thị khi mở PON.
- Bảng ONU con và toàn bộ dùng bố cục **Gom nhóm**: Khách hàng (HĐ / trạng thái),
  Kết nối (tập điểm / IP WAN), Thiết bị ONU (model / SN / MAC), Rx / Tx.
  Cột cuối của nhóm thông số có tiêu đề hai dòng `Nhiệt độ` / `Kh.cách OLT-ONU`,
  tương ứng giá trị °C / m; không dùng tên Vận hành. Đủ trường nguồn và null/0.
  Độ rộng tối thiểu 1.064px trong PON / 1.152px ở bảng toàn bộ; nhóm có thể ẩn
  và bảng tự thu gọn. PON/index giữ kích thước cố định; các cột còn lại chia
  chiều rộng theo tỷ lệ, không để riêng Kết nối hút hết phần dư. Tiêu đề 12px,
  nội dung chính 13px / phụ 12px, hàng gọn hơn và các dòng đầu cùng trục trên.
  Rx/Tx là cụm hai dòng canh giữa cột; nhãn sát số, giá trị cùng canh phải,
  không kéo nhãn và số ra hai mép. Chú ý khách hàng canh giữa cả tiêu đề và
  nội dung (kể cả tag nhiều dòng hoặc dấu “—”).
  Đường kẻ ngang nhẹ, giữ ghim PON/index.
  SN/MAC dùng monospace; CSV vẫn tách từng thông số thành cột riêng.
  Căn lề/độ rộng tiêu đề PON chỉ áp dụng cho `>thead>tr>th` của bảng đó,
  không lan xuống tiêu đề ONU lồng bên trong. Cột chữ cùng canh trái giữa
  tiêu đề và dữ liệu; cột số/index cùng canh giữa, dùng chung padding.
  Bảng con tối đa 25 kết quả chỉ hiển thị số ONU, không có cụm phân trang thừa.
  Khi người dùng chọn 50/100 và gộp thành một trang, vẫn giữ lựa chọn số dòng
  để có thể chuyển lại 25; ẩn nút Trước/Sau nếu không cần chuyển trang.
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
  `Lỗi / cảnh báo backend` (mở/đóng nội dung `error` và `result.warnings`).
  Không tách các nhóm IP, thông tin KH, trạng thái HĐ thành nhiều chip ở đây;
  nguyên nhân từng ONU vẫn hiển thị trong cột Chú ý khách hàng.
- Cảnh báo backend hiển thị riêng ở mức lượt chạy, không gán lỗi CSOC cho từng
  ONU khi response chưa cung cấp nguyên nhân. Chú ý KH không đổi `status`.
- CSV xuất **toàn bộ kết quả lọc**, không chỉ trang hiện tại, tôn trọng nhóm cột,
  BOM UTF-8 và phòng công thức bảng tính. JSON xuất nguyên response.

Switch CE có tổng quan, port/quang, đủ mẫu CRC/discard, aggregation/member,
PIM/routing, multicast và chẩn đoán. Bỏ qua/optional/null giữ nguyên ý nghĩa.
OLT giữ cả B1 NOT_OK và overall_ok=true nếu cùng có trong nguồn; GC16 không
có B1–B4 chi tiết thì không dựng thêm dữ liệu.

Thống kê đầu OLT dùng thẻ màu Port PON / ONU / MAC / SN / IP WAN bên trái;
Phạm vi & tham số bên phải cùng hàng, xếp xuống dưới trên màn hình hẹp.
Tham số hiển thị một hàng tóm tắt không rải tag: Giới hạn MAC/PON, Multicast,
`ONU: n thông số đã chọn`. Nhấn phần ONU mở/đóng danh sách hai cột (MAC, Model,
Khoảng cách, Rx, Tx, SN, Nhiệt độ), mặc định thu gọn. Dùng native details/summary
để hỗ trợ chuột và bàn phím. Boolean ✓ xanh / ✕ đỏ (nhãn truy cập Có/Không),
null/missing “-”; không coi dữ liệu thiếu là false, không có options thì ghi
Chưa có dữ liệu. Đếm chỉ các cờ ONU true; đây là tham số yêu cầu, không phải
kết quả SNMP đã lấy thành công. `multicast_only` vẫn ẩn; trường bổ sung có mục
Tham số khác để không mất dữ liệu. Màu thống kê chỉ phân nhóm, không chỉ sức khỏe.
Chẩn đoán chỉ giữ tóm tắt và cảnh báo, không còn các khối trích raw response,
command_errors hay interface bypass; xuất JSON gốc vẫn giữ toàn bộ dữ liệu.
Các ô Chẩn đoán dùng nền nhạt, viền nhấn bên trái, nhãn 12px / giá trị 20px:
thành công xanh, không thành công hoặc có lỗi lệnh ghi nhận cam, lỗi thực thi đỏ.
Không có lỗi dùng tông trung tính; nội dung lỗi dài giữ cỡ 13px để dễ đọc.
Màu không thay đổi status hoặc coi lỗi lệnh đã fallback là lỗi tổng.
Kết quả multicast GCOM bỏ ô overall, dùng thẻ Multicast Stream / IGMP Request
nền xanh OK / cam NOK, thiếu giá trị là thẻ trung tính “-”. HA58 vẫn giữ kết
quả tổng và chi tiết B1–B4 khi nguồn có. Không đổi cờ hoặc kết luận tổng nguồn.

## Handoff FE

Nút Mở kết quả chỉ mở snapshot khớp hostname/IP; chưa nối API. Nạp JSON xử lý
file local tối đa 20 MB, kiểm tra cấu trúc và bảo vệ kết quả đang mở khi file lỗi.
Mỗi lần đổi response/xóa kết quả hủy ngữ cảnh lọc, port chọn và import đang chờ.

Khi FE nhận response từ API sau khi xác thực/phân quyền, gọi:

```js
window.NETAUTO_SERVICE_CHECK_UI.loadResponse(response, 'Kết quả API');
```

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
