# Tiềm năng sản phẩm, độ sâu kiến thức và gợi ý tối ưu

> **Cập nhật implementation 08/10/2026:** đã có 14 bài theo câu chuyện, theme sáng/tối, bài partition thực và prototype PostgreSQL riêng. Các mô tả/đánh giá trước triển khai trong tài liệu này được giữ làm bối cảnh; đối chiếu [chức năng hiện có](current-features.md) và [hướng dẫn native](native-connector-setup.md) để biết phần đã hoàn thành. Hosted labs, account, cloud relay bền vững và SQL builder vẫn là mục tiêu.

Đánh giá ngày **08/10/2026**, dựa trên code hiện tại và hướng [lab trên PostgreSQL của người học](own-database-labs-design.md). Phần mở rộng dưới đây là đề xuất, chưa phải chức năng đã xây. Nhận định về thị trường là giả thuyết cần kiểm chứng với người học, không phải số liệu về nhu cầu hay doanh thu.

## 1. Dự án có tiềm năng ở đâu?

**Có nền tảng để trở thành công cụ học cách PostgreSQL xử lý dữ liệu và thực hành tối ưu bằng bằng chứng. Bản hiện tại chưa đủ để dạy sâu toàn bộ index, partition hay chẩn đoán mọi vấn đề dữ liệu.**

Điểm mạnh là kết nối câu hỏi nghiệp vụ → SQL → kết quả → plan → thay đổi → so sánh. Người học có thể thấy việc database làm thay vì chỉ ghi nhớ cú pháp. PostgreSQL thực thi query và trả plan; DataLab tổ chức trải nghiệm học, giải thích và kiểm chứng.

Nên phân biệt ba mục tiêu:

| Mục tiêu | Khả năng và yêu cầu |
| --- | --- |
| Dạy bằng lab có dataset, câu hỏi và trạng thái ban đầu đã biết | Phù hợp nhất để làm trước; tác giả có thể kiểm chứng lời giải, trường hợp đối chứng và tiêu chí chấm |
| Giúp phân tích query trên PostgreSQL riêng của người học | Khả thi theo thiết kế connector; cần thêm catalog, statistics, ngữ cảnh và giải thích giới hạn của từng gợi ý |
| Tự chẩn đoán và tối ưu toàn bộ hệ thống production | Phạm vi lớn hơn nhiều: workload, tải đồng thời, application, vận hành và ảnh hưởng khi thay đổi; chưa có nền đủ để cam kết |

Mục tiêu học phù hợp là người học biết **đặt giả thuyết, đọc bằng chứng, thử thay đổi và kiểm tra đánh đổi**. “Hiểu hết mọi vấn đề data” không phải tiêu chí nghiệm thu hữu ích: PostgreSQL, hệ thống phân tán, data warehouse, ETL và chất lượng dữ liệu có phạm vi khác nhau.

## 2. Bản hiện tại đã có nền gì?

Code đã có 12 bài về SQL cơ bản, quét bảng, index đầu tiên, composite index, LIKE, EXPLAIN, rewrite query, pagination và một tình huống incident. Có SQL ban đầu, hints, lời giải, reference query và validator theo bài. Xem [hiện trạng](current-features.md) và [curriculum](../content/labs.ts).

Engine PGlite thực thi PostgreSQL trong browser và tự lấy `EXPLAIN ANALYZE` dạng JSON. UI đã có cây plan, số đo thực thi, lượt truy cập dòng ước tính, index catalog và so sánh baseline. Validator có thể kiểm tra kết quả đầy đủ với reference, thay vì chỉ nhìn vài dòng preview. Các điểm này tạo nền tốt hơn cho việc học so với một editor chỉ báo query đúng/sai. Xem [engine](../lib/engine/core.ts) và [workspace](../components/lab-workspace.tsx).

Giới hạn cần hiểu đúng:

- Fixture chỉ có bốn bảng thương mại điện tử, với 10K/50K/100K orders; dữ liệu sinh theo công thức, không phải workload production đã quan sát.
- Bài hiện tại tập trung query đọc và B-tree index được guard hỗ trợ. Có hỗ trợ `INCLUDE`, nhưng chưa có chuỗi bài chuyên sâu về covering index/visibility; chưa có bài partition, transaction hay lock thực.
- Guard chưa cho người học tự tạo bảng partition, sửa dữ liệu hay điều khiển nhiều transaction. Thêm các bài đó cần thiết kế setup, quyền, reset và runner tương ứng.
- Slider lên một tỷ dòng dùng công thức mô phỏng. Nó không tăng database lên một tỷ dòng. CPU/p95/connections trong bài incident là bối cảnh kịch bản, không phải telemetry live.
- Browser hiện không cung cấp bằng chứng về I/O đĩa native, nhiều client đồng thời hay tài nguyên của một server thật.

Vì vậy hiện có thể gọi là **beta học SQL và nhập môn query performance**. Chưa nên giới thiệu là chương trình đã bao phủ toàn diện PostgreSQL performance.

## 3. Những chủ đề cần bổ sung và cách làm chúng dễ hiểu

Các hình trong bảng là hướng thiết kế, không phải chức năng hiện có.

| Chủ đề | Người học cần hiểu | Trực quan và thí nghiệm đề xuất |
| --- | --- | --- |
| Index và độ chọn lọc | Index tồn tại khác index được dùng; lấy ít dòng và lấy phần lớn bảng có thể cần cách đọc khác nhau | Đổi giá trị lọc trên cùng dataset; so plan và công việc trước/sau; có bài mà quét bảng là lựa chọn hợp lý |
| Composite, partial, expression, covering index | Index phải phù hợp điều kiện, thứ tự và phần dữ liệu cần lấy; thêm cột có chi phí | Đối chiếu query với định nghĩa index; thay một điều kiện mỗi lần; so kích thước index và các lần đọc heap |
| BRIN, GIN và loại index | Chọn theo dữ liệu, operator và kiểu truy vấn, thay vì mặc định B-tree cho mọi trường hợp | Lab riêng cho dữ liệu theo thời gian và dữ liệu nhiều thành phần; so nhiều phương án trên fixture đã kiểm chứng |
| Partition | Chia dữ liệu, loại bỏ partition không cần đọc, quản lý dữ liệu cũ; quan hệ với index | Vẽ các partition theo tháng, đánh dấu phần thực sự chạy và phần bỏ qua; so query có/không có điều kiện phù hợp |
| JOIN và aggregation | Số dòng trung gian, vòng lặp, lựa chọn thuật toán và lỗi nhân đôi kết quả | Pipeline nối bảng → lọc → nhóm; hiển thị đầu ra và loops từng node; đối chiếu kết quả nghiệp vụ |
| Statistics và phân phối dữ liệu | Planner ước tính dựa trên thống kê; dữ liệu lệch hoặc cột tương quan có thể ảnh hưởng lựa chọn | Cột “ước tính/thực tế” cạnh nhau; profile khách hàng lớn/nhỏ; thử cập nhật statistics và đo lại |
| Sort, hash, bộ nhớ và cache | Query có thể tốn ở sắp xếp/nhóm; index không giải quyết mọi chi phí | Phân biệt sort trong bộ nhớ với thông tin spill khi plan có; đọc temp/buffer counters và so các lần chạy |
| Transaction, MVCC và lock | Query chậm có thể đang chờ; hai phiên có thể tương tác dù SQL của từng phiên đơn giản | Timeline hai transaction và đồ thị “phiên A chờ phiên B”; runner nhiều connection và observer riêng |
| Đọc/ghi, VACUUM và vận hành | Một lựa chọn giúp đọc có thể tăng chi phí ghi; trạng thái dữ liệu thay đổi theo thời gian | Workload đọc/ghi có kiểm soát, biểu đồ latency/throughput và dung lượng; snapshot thống kê có timestamp |
| Mô hình và chất lượng dữ liệu | Nhanh nhưng trả sai vẫn là lỗi; NULL, trùng lặp, quan hệ và kiểu dữ liệu cần học riêng | Dataset phản ví dụ, sơ đồ quan hệ và so kết quả; câu hỏi nghiệp vụ trước khi đánh giá performance |

Không nhất thiết đưa mọi chủ đề vào native ngay. Một số khái niệm về index, partition và kết quả JOIN có thể học với dataset nhỏ trong browser sau khi mở rộng setup/guard. Native hữu ích khi bài cần tài nguyên thật, dữ liệu lớn, ghi dữ liệu hoặc nhiều connection.

BRIN dựa trên tóm tắt các block range và phù hợp khi giá trị cột tương quan với thứ tự vật lý; GIN hỗ trợ kiểu dữ liệu có nhiều thành phần. Đây là các mục tiêu học khác nhau. [PostgreSQL: Index Types](https://www.postgresql.org/docs/current/indexes-types.html).

Covering index cũng cần bài đối chứng: `Index Only Scan` có thể vẫn đọc heap để kiểm tra visibility. Không được dạy rằng thêm `INCLUDE` đảm bảo bỏ mọi truy cập bảng. [PostgreSQL: Index-Only Scans](https://www.postgresql.org/docs/current/indexes-index-only-scans.html).

### Riêng partition: cần dạy cả lý do dùng và điều kiện có ích

Ví dụ thiết kế bài: bảng orders chia theo tháng. Người học chọn khoảng thời gian một tháng và thấy những partition nào được xét/chạy. Sau đó đổi sang lọc khách hàng trên toàn thời gian để quan sát khác biệt. Index trên các partition là một biến thí nghiệm riêng; partition không tự thay thế mọi nhu cầu index.

Tiếp theo có bài quản lý dữ liệu cũ, số lượng partition và yêu cầu khóa/unique. PostgreSQL mô tả lợi ích performance có điều kiện, lợi ích lifecycle và chi phí khi thiết kế hoặc số lượng partition không phù hợp. Không có quy tắc “đủ N triệu dòng thì bắt buộc partition”. [PostgreSQL: Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html).

### Riêng dữ liệu: số dòng lớn chưa đủ tạo bài học tốt

Một dataset một tỷ dòng nhưng phân phối đơn giản vẫn có thể chỉ dạy lặp lại một kiểu bài. Nên xây một bộ dataset **có nhiều profile theo mục tiêu học**:

- Phân phối đều và phân phối lệch: một khách hàng có nhiều đơn, các khách hàng khác có ít đơn.
- Query chọn ít và nhiều dòng; điều kiện có tính tương quan giữa các cột.
- Dữ liệu theo thời gian, với bố trí vật lý khác nhau khi bài cần khảo sát BRIN.
- Trạng thái index/partition/statistics và tỷ lệ đọc/ghi khác nhau.
- Profile có NULL, trùng lặp hoặc dữ liệu biên cho bài kiểm tra kết quả; tách khỏi fixture hiện tại có nhiều cột NOT NULL.

Mỗi profile phải được version và kiểm chứng bằng query/reference của bài. Bắt đầu ở quy mô đủ làm hiện tượng cần học xuất hiện trên môi trường hỗ trợ; chỉ tăng khi số liệu cho thấy cần. Không dùng dung lượng lớn làm thước đo duy nhất của độ sâu kiến thức.

## 4. Trực quan hóa thế nào để người học hiểu nguyên nhân?

Chỉ vẽ cây plan đẹp chưa đủ. Mỗi bài nên đi qua vòng:

**Dự đoán → chạy → quan sát → giải thích → thay đổi → đo lại → áp dụng cho tình huống mới.**

Ví dụ bài index, các số sau **minh họa thiết kế**, không phải kết quả benchmark đã đo:

```text
Yêu cầu: lấy đơn hàng của một khách hàng.

Trước:  [Quét orders] ── kiểm tra ≈ 1.000.000 dòng ──> trả 100 dòng
Thử:    tạo index trên customer_id
Sau:    [Scan dùng index, nếu planner chọn] ──> lấy các dòng phù hợp

Đối chiếu: cùng kết quả? plan đổi gì? công việc giảm gì? index tốn bao nhiêu?
Đổi đề: lấy phần lớn orders. Index vừa tạo còn có ích không?
```

UI gắn mỗi biểu đồ với nguồn dữ liệu:

| Hình/số liệu | Nguồn và cách đọc |
| --- | --- |
| Query plan, tên scan/index, rows và loops | Plan PostgreSQL của đúng lần chạy; giữ raw JSON để kiểm tra |
| Index/bảng/partition hiện có | Catalog của đúng database/schema; không suy ra chỉ từ tên trong SQL |
| So sánh trước/sau | Cùng mục tiêu, dataset và trạng thái đã ghi nhận; giữ kết quả đúng và chỉ thay biến cần thử |
| Sơ đồ B-tree hoặc chuyển động dòng minh họa | Mô hình giảng dạy có nhãn; không nhận là trace vật lý thật của từng page |
| Lock graph | Quan sát phiên/khóa tại thời điểm đó; cần nhiều connection và quyền đọc phù hợp |
| CPU, RAM, I/O hệ điều hành, latency endpoint | Telemetry hoặc load test riêng; thiếu thì hiển thị chưa có dữ liệu |

Không cộng thời gian inclusive của mọi node để tạo tổng giả; không coi planner cost là mili giây. Rows output cũng không tự bằng số dòng đã kiểm tra. Khi hiển thị ước tính/thực tế cần xét loops, LIMIT và node dừng sớm, không kết luận mọi chênh lệch là statistics sai. `EXPLAIN ANALYZE` thêm overhead và không đo trọn thời gian truyền kết quả qua mạng. [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html).

Bài statistics nên cho thấy cả trường hợp ước tính thay đổi và trường hợp không giải quyết vấn đề. PostgreSQL có extended statistics cho một số quan hệ giữa cột, với giới hạn áp dụng; không chỉ có cách thêm index. [PostgreSQL: Planner Statistics](https://www.postgresql.org/docs/current/planner-stats.html).

## 5. Có thể giúp người dùng biết cần tối ưu gì không?

**Có, trong phạm vi dữ liệu đã quan sát.** Nên tách ba mức phản hồi để người học biết kết luận có chắc tới đâu:

| Mức | Ví dụ | Điều kiện |
| --- | --- | --- |
| Quan sát | “Plan dùng Seq Scan trên orders; nhiều dòng bị loại bởi bộ lọc.” | Có plan thực và giải thích đúng counter |
| Giả thuyết cần thử | “Có thể thử index phù hợp customer_id; cần xét index đang có và tỷ lệ dòng được chọn.” | Có SQL, plan, catalog và ngữ cảnh; nêu đánh đổi |
| Kết quả đã kiểm chứng trong thí nghiệm | “Ở profile này, thay đổi giảm công việc/thời gian theo phép đo này và vẫn trả đúng kết quả.” | Thử phương án, đối chiếu baseline, ghi môi trường và giới hạn của phép đo |

Một gợi ý hữu ích nên có: **bằng chứng → khả năng giải thích → SQL/cách thử → đánh đổi → cách kiểm chứng → trạng thái kết luận**. Có nút đưa SQL vào editor, giải thích vì sao và cho learner chọn chạy. Nút này chưa có trong app hiện tại.

Không dùng rule “Seq Scan = lỗi” hoặc “Sort = phải thêm index”. Trong bài có lời giải đã kiểm chứng, gợi ý có thể rất cụ thể. Khi người học đưa query/database tùy ý, phải yêu cầu thêm ngữ cảnh và chấp nhận có nhiều lời giải hợp lý.

### Cần quan sát thêm gì ngoài một query plan?

| Câu hỏi | Dữ liệu cần thêm |
| --- | --- |
| Có index nào đáng thử? | Định nghĩa index hiện có, điều kiện JOIN/lọc/order, phân phối dữ liệu, kích thước và các query liên quan |
| Query nào đáng tối ưu trước? | Tần suất, tổng thời gian, mục tiêu latency và vai trò nghiệp vụ |
| Có nên partition? | Kiểu truy cập theo thời gian/key, lifecycle, tăng trưởng, index hiện tại và yêu cầu schema |
| Vì sao phải chờ? | Phiên đang chạy, wait events và quan hệ blocking; không chỉ plan sau khi chạy xong |
| Thêm index ảnh hưởng ghi bao nhiêu? | Workload ghi có kiểm soát và đo trước/sau |
| Có N+1 hoặc chậm ở ứng dụng không? | Query sequence theo request, application trace, pool/network và số liệu endpoint |

`pg_stat_statements` có số lần gọi và thống kê thời gian tổng/trung bình để bổ sung góc nhìn workload. Nó cần được cấu hình; không mặc định có ở mọi database. Không suy ra p95 từ một EXPLAIN hay chỉ từ mean/min/max của extension. [PostgreSQL: pg_stat_statements](https://www.postgresql.org/docs/current/pgstatstatements.html).

Ví dụ số học minh họa trong cùng khoảng đo: query A mất trung bình 20 ms, chạy 100.000 lần, tổng là 2.000 giây; query B mất 1 giây, chạy 100 lần, tổng là 100 giây. Chỉ nhìn lần chạy chậm nhất sẽ bỏ sót query A. Tổng thời gian này không đồng nghĩa CPU time; vẫn phải xét mục tiêu nghiệp vụ và concurrency.

Thông tin phiên/wait có thể lấy từ `pg_stat_activity`; thống kê I/O của PostgreSQL vẫn cần đối chiếu hệ điều hành để hiểu đầy đủ việc đọc dữ liệu. [PostgreSQL: Monitoring Statistics](https://www.postgresql.org/docs/current/monitoring-stats.html).

### Vai trò của thư viện và AI

PostgreSQL cung cấp plan/counter; driver vận chuyển dữ liệu; thư viện biểu đồ có thể vẽ cây, thanh so sánh và timeline. **Phần giải thích, suy luận, ưu tiên vấn đề và kiểm chứng phương án là logic/nội dung DataLab cần xây.** Không có một thư viện vẽ biểu đồ nào tự mang theo toàn bộ kiến thức tối ưu.

Bản đầu nên dùng nội dung do tác giả viết và rule có điều kiện rõ cho các bài được hỗ trợ. AI có thể bổ sung đối thoại hoặc giúp viết SQL sau; mọi khẳng định phải bám vào dữ liệu có sẵn. AI không tạo được bằng chứng CPU/lock/workload khi hệ thống chưa thu thập các số liệu đó.

Validator của bài có reference giúp kiểm chứng trên fixture đã thiết kế. Với rewrite SQL tùy ý, một preview hoặc một lần kết quả trùng nhau chưa chứng minh tương đương cho mọi dữ liệu, NULL, duplicates hay thay đổi đồng thời. Đừng hứa tự chứng minh mọi rewrite luôn đúng.

## 6. Tiềm năng cạnh tranh và rủi ro sản phẩm

Khả năng tương tác với SQL và cung cấp gợi ý có tiền lệ: Crunchy Data có tutorial partition kèm thực hành; pganalyze có Index Advisor phân tích workload và xét đánh đổi đọc/ghi. Đây là bằng chứng về những chức năng đã tồn tại trong ngành, chưa chứng minh người dùng sẽ trả tiền cho DataLab. [Crunchy Data: Partitioning Tutorial](https://www.crunchydata.com/developers/playground/partitioning), [pganalyze: Index Advisor](https://pganalyze.com/blog/index-advisor-v3).

Giả thuyết nhóm người dùng nên thử trước: backend developer đã viết được SELECT/JOIN nhưng chưa biết đọc plan và giải thích query chậm. Có thể mở sang data engineer sau khi có bài phù hợp. Chọn một nhóm để thiết kế độ khó và tình huống thay vì cố đáp ứng mọi người ngay từ đầu.

Lợi thế có thể xây là tiếng Việt dễ hiểu, bài có nguyên nhân/đối chứng, SQL mẫu, plan thật, so sánh và kiểm tra khả năng áp dụng. Chỉ có editor và plan viewer sẽ khó tạo khác biệt, vì các công cụ hiện có đã cung cấp nhiều phần đó.

Rủi ro cần kiểm chứng bằng sử dụng thật:

- Người học xem lời giải rồi qua bài nhưng không hiểu khi gặp query mới.
- Cài PostgreSQL/connector/import làm họ bỏ cuộc; chế độ browser giúp thử trước nhưng không tự xóa ma sát native.
- Plan/thời gian khác nhau giữa máy gây hiểu nhầm; chấm cần dựa vào mục tiêu và bằng chứng phù hợp, tránh mốc ms chung cho mọi thiết bị.
- Một biểu đồ gắn nhãn sai có thể dạy sai kiến thức dù giao diện hấp dẫn.
- Database riêng chuyển compute/storage cho người học; DataLab vẫn chịu công phát triển, hỗ trợ, phân phối dataset và vận hành API.

Chưa có cơ sở trong repo để ước lượng doanh thu, tỷ lệ chuyển đổi hay gọi sản phẩm đã chứng minh thị trường.

## 7. Lộ trình tập trung và cách đánh giá thành công

Giữ browser cho nhập môn. Theo hướng người dùng đã chọn, mở PostgreSQL riêng cho bài cần native. Ưu tiên một luồng index hoàn chỉnh của [prototype connector](own-database-labs-design.md), rồi thử ba nhóm thí nghiệm sâu:

1. **Index có ích và không có ích:** query chọn ít/nhiều dòng, index tồn tại/được dùng, chi phí dung lượng và kết quả đúng.
2. **Composite index và pagination:** lọc/order/LIMIT, công việc của OFFSET/keyset, thứ tự và điều kiện của trang kế tiếp.
3. **Partition:** pruning, kết hợp index, trường hợp query đi qua nhiều partition và lifecycle dữ liệu cũ.

Sau khi người học làm được những vòng này, bổ sung statistics/JOIN/sort, rồi mới đến transaction/lock và workload đọc/ghi. Nhóm cuối cần runner nhiều connection và telemetry mới; không thể chỉ thêm biểu đồ vào runner hiện tại là đủ.

Đánh giá từng bài bằng ba câu hỏi:

- **Trước khi xem lời giải:** người học dự đoán database sẽ làm gì và vì sao?
- **Sau khi thử:** họ giải thích được bằng chứng và đánh đổi nào, thay vì chỉ nói “nhanh hơn”?
- **Ở query/profile mới:** họ chọn được bước điều tra phù hợp và nhận ra khi tối ưu đã học không có ích?

Prototype nên thử với một nhóm nhỏ người học mục tiêu, ghi thời gian onboarding/import, lỗi setup, bước cần hints và kết quả bài mới chưa có lời giải. So sánh khả năng giải thích trước/sau và quay lại sau vài ngày. Số người học/XP/completion là chỉ số sử dụng, chưa đủ để chứng minh hiểu kiến thức.

Tiêu chí đáng theo đuổi: người học biết tìm bằng chứng trước khi thêm index/partition và biết kiểm tra kết quả sau thay đổi. Khi làm tốt điều này, DataLab có giá trị thực hành rõ ngay cả khi chưa bao phủ toàn bộ chủ đề PostgreSQL.
