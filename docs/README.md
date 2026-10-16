# Tài liệu DataLab

**Hướng sản phẩm hiện tại (15/10/2026):** bỏ lab SQL cơ bản khỏi luồng chính; dùng workspace kết nối PostgreSQL local có sẵn, thử index/bản sao partition có xác nhận SQL, so sánh số đo thật. `/paths` là sổ tay 19 chủ đề cú pháp từ cơ bản đến nâng cao. Đọc [chức năng hiện có](current-features.md) và [kết nối DB local](native-connector-setup.md) trước; các đánh giá lab/scale bên dưới là bối cảnh phiên bản trước.

Bộ tài liệu mô tả phiên bản hiện có và phương án mở rộng đã trao đổi. Bổ sung giải thích về hoạt động và scale ngày **08/10/2026**, đối chiếu với code trong `datalab/`.

**Nếu chưa rõ sản phẩm đang làm gì hoặc “scale” trong docs nghĩa là gì, đọc [DataLab đang làm gì và sẽ scale như thế nào?](how-it-works-and-scales.md) trước.** Tài liệu đi từ một lượt làm bài thật tới giới hạn browser, session server, hàng đợi, capacity, chi phí và mở rộng nhiều máy.

**Phiên bản lab trước đây:** 14 bài có câu chuyện, sáng/tối, đọc plan theo bằng chứng và PostgreSQL riêng qua connector. Luồng hiện tại dùng DB có sẵn, không seed dataset; xem [hướng dẫn chạy native](native-connector-setup.md). [Thiết kế database của người học](own-database-labs-design.md) là bối cảnh thiết kế; hosted server labs vẫn là tùy chọn chưa triển khai.

**Đánh giá sản phẩm:** đọc [tiềm năng, độ sâu kiến thức và gợi ý tối ưu](product-potential-and-learning-roadmap.md) để thấy bản hiện tại dạy được tới đâu, cách bổ sung index/partition/lock, giới hạn chẩn đoán và cách kiểm chứng người học thực sự hiểu.

## Đọc tài liệu nào?

| Tài liệu | Nội dung | Trạng thái được mô tả |
| --- | --- | --- |
| [Hoạt động và scale](how-it-works-and-scales.md) | Ví dụ luồng học, các nghĩa của scale, simulation, giới hạn và cách mở rộng hạ tầng | Hiện tại + đề xuất, giải thích từ đầu |
| [Chức năng hiện có](current-features.md) | Workspace DB local, index/partition, so sánh plan, sổ tay cú pháp và giới hạn | Đã triển khai |
| [Kiến trúc và dữ liệu](architecture-and-data.md) | SQL chạy ở đâu, dữ liệu sinh thế nào, RAM và localStorage lưu gì | Đã triển khai |
| [Công nghệ sử dụng](technology-stack.md) | Stack hiện tại và stack đề xuất cho lab server | Tách rõ hai giai đoạn |
| [Thiết kế lab server](server-labs-design.md) | PostgreSQL thật, dữ liệu lớn, tải đồng thời, cô lập và vòng đời session | Đề xuất, chưa triển khai |
| [Lab trên database của người học](own-database-labs-design.md) | Dataset cài trên PostgreSQL riêng, connector, tự phân tích query, biểu đồ và SQL mẫu | Có prototype local; một số mục vẫn là mục tiêu |
| [Chạy connector PostgreSQL](native-connector-setup.md) | Docker local, ghép nối, dataset, thực thi/chấm và giới hạn relay | Đã triển khai và kiểm tra trên PostgreSQL native |
| [Tiềm năng và lộ trình học](product-potential-and-learning-roadmap.md) | Độ sâu curriculum, trực quan hóa, gợi ý tối ưu, cạnh tranh và đánh giá hiệu quả học | Đánh giá + đề xuất; chưa kiểm chứng thị trường |
| [Deploy và chi phí](deployment-and-costs.md) | Deploy gì lên Vercel/VPS, mua tài nguyên nào, cách tính chi phí và rollout | Hiện tại + phương án mở rộng |
| [Prompt gốc](original-prompt.md) | Yêu cầu sản phẩm ban đầu được giữ nguyên | Đặc tả ban đầu |
| [Bổ sung prompt](prompt-addendum.md) | Mục tiêu, tiêu chí nghiệm thu và ranh giới các giai đoạn | Đặc tả mục tiêu |

Nếu muốn hiểu từ đầu, đọc **Hoạt động và scale → Chức năng hiện có → Kiến trúc và dữ liệu**. Nếu muốn chuẩn bị phần server, đọc thêm **Thiết kế lab server → Deploy và chi phí**.

## Mốc hiện tại

- Web là workspace tối ưu DB local và sổ tay SQL ẩn danh; lab nâng cao và playground là demo phụ. Lab SQL cơ bản, interview và challenge cũ chuyển hướng sang sổ tay.
- PostgreSQL PGlite chạy trong Web Worker của trình duyệt. Dataset học nằm trong RAM của thiết bị người học.
- Tiến độ và sự kiện giới hạn được lưu bằng localStorage; chưa có tài khoản hoặc đồng bộ cloud.
- Có cấu hình deploy Next.js lên Vercel. Repo có API relay/connector và Docker Compose cho PostgreSQL lab local. Chưa có Redis, provisioner hay hosted server labs.
- Các phần lab server, tài khoản, thanh toán và vận hành thương mại trong tài liệu là kế hoạch. Việc viết tài liệu này không tạo hay thuê hạ tầng.
- Kết nối PostgreSQL riêng đã có prototype local với profile 1M orders; phiên relay lưu trong một tiến trình. Chế độ này dùng CPU/RAM/SSD của người học; hosted server labs dùng tài nguyên DataLab thuê và vẫn là đề xuất.

## Quy tắc đọc đặc tả

Prompt gốc và phần bổ sung mô tả sản phẩm hướng tới, **không phải bảng xác nhận tất cả tính năng đã hoàn thành**. Khi khác nhau, dùng code và tài liệu “hiện có” để đánh giá phiên bản đang chạy. Ví dụ: input SQL hiện giới hạn 16.000 ký tự, khởi tạo có watchdog 45 giây, và Reset database đã có xác nhận thay draft và xóa index thực hành.

Khi thay đổi chức năng, cập nhật tài liệu hiện trạng cùng thay đổi code. Chỉ chuyển một mục từ “đề xuất” sang “đã triển khai” sau khi có implementation và kiểm chứng tương ứng.
