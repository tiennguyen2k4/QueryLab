# Chức năng hiện có của DataLab

**Cập nhật 15/10/2026:** ứng dụng chuyển từ danh sách lab SQL sang **workspace tối ưu PostgreSQL local có sẵn**. Học cú pháp được tách thành sổ tay riêng, từ cơ bản đến nâng cao.

## Các trang chính

| URL | Chức năng | Giới hạn |
| --- | --- | --- |
| `/` | Giới thiệu database-first và minh họa luồng kết nối/đo/xác nhận | Không hiển thị số tăng tốc demo như kết quả đo |
| `/workspace` | Đọc schema, đo baseline, thử index/partition/query rewrite, so sánh và đọc plan | Cần connector local và PostgreSQL phát triển của bạn |
| `/connections` | Hướng dẫn chạy connector existing, ghép nối và đọc metadata | Không nhập thông tin DB trên web; reload cần ghép nối lại |
| `/paths` | 19 chủ đề cú pháp Việt/Anh, tìm kiếm, lọc cấp độ, ví dụ và lưu ý | Không tự chạy SQL; ví dụ dùng tên bảng giả định |
| `/learn` | Chuyển hướng tới `/workspace` | Không còn dashboard XP/lab cơ bản |
| `/playground` | Sandbox SQL dữ liệu sinh trong browser | Demo phụ, không phải DB có sẵn của người dùng |
| `/labs/sql-*` hợp lệ | Chuyển hướng tới sổ tay cú pháp | Không còn giao diện làm bài SQL cơ bản |
| `/interview`, `/challenge` | Chuyển hướng tới sổ tay cú pháp | Không giữ vòng lặp bài tập SQL cơ bản dưới entry point cũ |

Menu chính ưu tiên workspace, kết nối, cú pháp và sandbox. Advanced lab, pricing và concept URL cũ được giữ tương thích nhưng không còn là entry point chính.

## DB local có sẵn

- `DATALAB_MODE=existing`; PostgreSQL và web relay đều phải ở loopback.
- Role hạn chế; từ chối quyền quản trị cao và URL query override.
- Đọc tối đa 200 bảng thường/partitioned có quyền USAGE schema và SELECT bảng, cột/kiểu, ước tính dòng và dung lượng. Không tự COUNT toàn bảng lúc ghép nối.
- Không seed, reset hay migration khi kết nối. Không lấy result-row preview.
- Query text, schema metadata và plan chỉ qua web local. Plan có thể chứa giá trị filter.

Chi tiết: [hướng dẫn connector](native-connector-setup.md).

## Luồng thử nghiệm

1. Chọn bảng và nhập một SELECT/WITH.
2. Đo baseline bằng EXPLAIN ANALYZE read-only, timeout 4,5 giây.
3. Chọn index B-tree, bản sao partition tháng hoặc viết lại query.
4. Thay đổi cấu trúc luôn cần xem SQL sinh tại connector và xác nhận một lần trong 5 phút.
5. Đo sau thay đổi, xem biểu đồ và plan, cân nhắc đánh đổi.

### Index

Chọn thứ tự 1–4 cột khóa, tên mới `datalab_*`. Chạy trong transaction, không concurrent, có thể chặn ghi; lock timeout 1,5 giây, mỗi statement 20 giây. Quyền owner là cần thiết. Không tự đề xuất index tối ưu cho workload bất kỳ.

### Partition

Chỉ từ nguồn chưa partition, cột date/timestamp, 1–24 tháng và DEFAULT cho NULL/ngoài khoảng. Tạo bản sao riêng, sao chép toàn nguồn tối đa 1 triệu dòng và ANALYZE. Transaction rollback toàn bộ khi lỗi; không đổi/xóa bảng gốc.

Copy cần thêm dung lượng và chặn ghi nguồn bằng SHARE lock. Không sao chép index, default, identity/generated behavior, trigger hoặc khóa ngoại. Đây không phải migration production hay benchmark cô lập pruning.

### Query rewrite

Giữ baseline và đo SELECT đã sửa. Không chấm đáp án hoặc kiểm tra full-result equivalence. Người dùng chịu trách nhiệm kiểm tra tính đúng.

## Bằng chứng và trực quan hóa

- Biểu đồ trước/sau: execution time, approximate heap visits và shared-buffer-read blocks.
- Actual scan/index và tên relation thực thi; ô partition dựa trên Actual Loops.
- Chi tiết plan cây, rows/loops, root buffers, sort spill và sai lệch ước tính.
- SQL trước/sau luôn có thể mở xem.
- Không có số liệu giả khi chưa đo. Kết quả chậm hơn cũng được hiển thị.
- Cache, ghi đồng thời và planner ảnh hưởng thời gian; không hứa tốc độ từ một lần đo. Heap visits xấp xỉ, buffers cha/con không cộng trùng.

## Dọn thử nghiệm và phục hồi

Cleanup chỉ cho đối tượng do tiến trình connector này tạo, kiểm tra OID/tên/loại, vẫn cần SQL preview và xác nhận. Không DROP bảng nguồn hay index cũ.

Relay không retry DDL sau lỗi mạng. Trạng thái chưa rõ yêu cầu kiểm tra local và xác nhận, không reset DB có sẵn. Registry ownership, kết nối, baseline và lịch sử UI nằm trong RAM phiên; đối tượng được tạo vẫn tồn tại trong PostgreSQL sau reload/restart.

## Sổ tay cú pháp

19 chủ đề có ví dụ, nguyên lý và lưu ý: SELECT, WHERE/NULL, ORDER/LIMIT, GROUP/HAVING, JOIN, EXISTS, CTE, set operations, khóa/ràng buộc, transaction, window, EXPLAIN, index nhiều cột, partial/covering index, partition, keyset, statistics, lock/concurrent index và phân quyền.

Cú pháp nâng cao ngoài builder được ghi rõ **tham khảo**, không ngụ ý đã hỗ trợ chạy từ UI. Sao chép SQL không thực thi. Không dùng XP, chấm bài hay danh sách lab cơ bản cho luồng này.

## Phạm vi chưa có

MySQL/SQL Server, migration tùy ý, tự chạy concurrent index, AI diagnosis, full-result validation cho query rewrite, tài khoản, cloud sync, thanh toán, job bền vững và relay nhiều instance chưa triển khai. Chỉ dùng DB phát triển local, không production.

Browser PGlite và backend dataset lab cũ vẫn được giữ để sandbox/regression. Chi tiết cũ trong tài liệu kiến trúc/scale được hiểu là mô tả engine/demo, không phải luồng sản phẩm chính hiện tại.
