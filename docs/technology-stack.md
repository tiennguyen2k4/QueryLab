# Công nghệ sử dụng

Để hiểu các công nghệ phối hợp ra sao qua một lượt làm bài, đọc [hoạt động và scale](how-it-works-and-scales.md). Bảng stack hiện tại là những gì đang chạy; bảng server labs là phương án DataLab thuê hạ tầng. Phương án mới cho [database của người học](own-database-labs-design.md) có stack đề xuất riêng ở cuối file này, ưu tiên PostgreSQL trước.

## Stack đã có trong repo

| Thành phần | Công nghệ | Vai trò |
| --- | --- | --- |
| Web framework | Next.js App Router | Routing, render trang, metadata và build web |
| UI | React + TypeScript | Dashboard, editor workspace, trạng thái học và component |
| Giao diện | CSS tùy chỉnh, Lucide icons | Layout responsive, theme sáng/tối/theo thiết bị, icon; không dùng Tailwind/shadcn trong implementation hiện tại |
| SQL editor | CodeMirror qua `@uiw/react-codemirror`, SQL language extension | Sửa SQL, completion, số dòng, phím tắt |
| Database browser | `@electric-sql/pglite` | PostgreSQL WASM chạy query/plan/validator trong RAM |
| Database riêng | Node.js CLI + `pg` | Connector polling, PostgreSQL native, seed persistent và cùng validator |
| Relay prototype | Next.js Route Handler + bộ nhớ một process | Mã ghép nối ngắn hạn, browser/agent tokens riêng, job/status/cancel có giới hạn |
| Dữ liệu native local | PostgreSQL Docker Compose, role giới hạn | Profile đến 1M orders, độc lập với hosted server labs |
| Tách thực thi khỏi UI | Dedicated Web Worker | Message protocol, xử lý tuần tự, terminate/reset |
| Lưu tiến độ | localStorage | Hoàn thành, XP, bookmark, ngày hoạt động và sự kiện local |
| Ngôn ngữ VI/EN | React Context + bản dịch TypeScript | Chuyển text tức thì, localStorage lưu lựa chọn; không cần dịch vụ dịch bên ngoài |
| Build | Next.js với Webpack | Bundle Worker/WASM đã dùng trong app |
| Kiểm tra | TypeScript, `node:test` qua `tsx` | Typecheck, engine correctness, guard, watchdog và toàn bộ đáp án curriculum |
| Hosting được cấu hình | Vercel / Next.js | Phục vụ web và assets; browser SQL chạy local; native SQL chạy ở connector, relay cần một tiến trình local |

[package.json](../package.json) khai báo các dải phiên bản chính: Next.js `^16.3.8`, React `^19.2.8`, PGlite `^0.5.8`, TypeScript `^5.9.3`. Dùng [package-lock.json](../package-lock.json) và `npm ci` để cài đúng phiên bản đã khóa; dải trong package.json không phải phiên bản mới nhất hay phiên bản cài chính xác.

CSS tải DM Sans và JetBrains Mono từ Google Fonts. Không có image generation service, AI API hoặc analytics cloud trong luồng học hiện tại.

## Stack đề xuất cho server labs

**Bảng dưới chưa được cài đặt/triển khai trong repo.** Đây là lựa chọn thiết kế cho giai đoạn mở rộng.

| Thành phần | Đề xuất | Lý do |
| --- | --- | --- |
| Frontend | Giữ Next.js/React/TypeScript | Tái sử dụng UI và bài browser hiện có |
| Account/session API | Next.js phía web + Lab API Node.js/TypeScript trên VPS | Tách request web ngắn khỏi job SQL/benchmark dài |
| Database học server | PostgreSQL native, pin major và image cụ thể | Index, transaction, locks, I/O và connections thật |
| Database ứng dụng | PostgreSQL riêng | Tài khoản, tiến độ, session/job metadata; không nhận learner SQL |
| PostgreSQL client | `pg` / node-postgres | Connection pool, query và transaction từ runner |
| Queue | Redis + BullMQ | Điều phối provision/query/benchmark/cleanup, trạng thái và retry có kiểm soát |
| Workload | `pgbench` custom script | Tạo nhiều client/transaction và thu latency/throughput thật |
| Runtime | Docker trên Linux VPS | Instance PostgreSQL riêng/session, network và resource limits |
| Orchestration pilot | Docker Compose | Khai báo gateway/runner/Redis/App DB; session động do provisioner quản lý |
| Public ingress | Reverse proxy HTTPS, ví dụ Caddy | TLS và routing tới Lab API; database không mở public |
| Quan sát | Structured logs, PostgreSQL stats, container metrics | Theo dõi latency, lỗi, quota, cleanup và capacity |

`pg` có API query và pooling; giới hạn pool cần phối hợp với connection budget từng session. [node-postgres queries](https://node-postgres.com/features/queries), [pooling](https://node-postgres.com/features/pooling).

BullMQ cung cấp cơ chế queue/job; vẫn phải tự thiết kế ownership, idempotency và cleanup cho lab. Redis là lựa chọn queue backend đề xuất ở đây. [BullMQ documentation](https://docs.bullmq.io/).

Compose mô tả ứng dụng nhiều container, nhưng không tự cung cấp luồng cấp session hoặc quota theo user. Phần đó thuộc gateway/provisioner của sản phẩm. [Docker Compose application model](https://docs.docker.com/compose/intro/compose-application-model/).

## Phần nào cần trả tiền?

PostgreSQL, Redis, Docker, Node.js và pgbench có thể tự host trên máy thuê. Khi tự host, chi phí chính là compute/RAM/SSD/traffic/backup của máy đó và công sức vận hành. Không cần thuê riêng một dịch vụ trả phí cho từng tên công nghệ.

Có thể thay App DB/Redis bằng dịch vụ managed để giảm vận hành, nhưng đó là lựa chọn sau; không bắt buộc cho pilot. Chọn provider, region và gói tài nguyên dựa trên số đo tại [Deploy và chi phí](deployment-and-costs.md).

Kubernetes và autoscaling nhiều host chưa cần trong thiết kế pilot một máy. Khi capacity hoặc độ sẵn sàng đòi hỏi, đánh giá lại orchestration sau khi có dữ liệu vận hành.

## Những lựa chọn còn phải chốt khi implementation

- Provider auth, chính sách tài khoản và đồng bộ dữ liệu anonymous sang account.
- PostgreSQL major/image server và cách kiểm chứng khác biệt với PGlite.
- Dataset profiles, quota/session, template cloning và giới hạn benchmark.
- Provider VPS/region, shared hoặc dedicated vCPU, backup và mục tiêu khôi phục.
- Lưu SQL hay chỉ metrics, retention log và quyền riêng tư.
- Provider thanh toán nếu mở Pro; hiện chưa chọn/tích hợp adapter hoặc webhook.

Các điểm này không cản trở việc hiểu kiến trúc; chúng cần được chốt bằng pilot trước khi cam kết chi phí/capacity thương mại.

## Stack đề xuất cho database của người học

**Chưa triển khai.** Người học cung cấp PostgreSQL native và CPU/RAM/SSD; DataLab cung cấp nội dung, dataset, kết nối và trực quan hóa. Giữ PGlite cho bài browser.

| Thành phần | Đề xuất | Vai trò |
| --- | --- | --- |
| Web UI | Next.js/React/TypeScript hiện tại | Editor, bài học, schema, plan, chart và hướng dẫn |
| Connector | Chương trình Node.js/TypeScript chạy trên máy có thể truy cập database người học | Giữ credential local, nhận job qua kết nối outbound, thực thi và gửi preview/plan |
| Driver | `pg` / node-postgres | Kết nối PostgreSQL native của người học |
| API điều phối | Node.js/TypeScript, job metadata và quyền ghép nối | Web submit/status/cancel; connector polling HTTPS, WebSocket bổ sung sau |
| Dataset | Manifest + dump hoặc generator deterministic có version | Import/seed một lần, kiểm tra profile và reset theo bài |
| Phân tích | PostgreSQL EXPLAIN JSON, catalog và rules của bài | Tự lấy plan, ghi baseline, index và kiểm tra đáp án |
| Trực quan | Cây plan và chart từ dữ liệu có provenance | Thời gian, tuple work ≈, estimated/actual rows, buffers và trước/sau |
| SQL hỗ trợ | Query mẫu/hints/solution; SQL builder theo phạm vi bài | Người học hiểu SQL và thử gợi ý mà không cần tự viết EXPLAIN |

Đã có CLI connector dùng `pg`, API relay Next.js, NativePostgresAdapter, dataset 1M orders và fixture partition. Đây là prototype local: phiên/job trong RAM của một tiến trình; cloud relay bền vững và đóng gói installer vẫn cần xây. Xem [cài đặt native](native-connector-setup.md). `DatabaseAdapter` đã có prepare/cancel và native adapter. Chart hiện dùng React/CSS từ plan, gợi ý theo rule hẹp; chưa có SQL parser tổng quát hoặc installer đóng gói. MySQL sau này cần driver và parser plan riêng; không dùng nguyên syntax/metrics PostgreSQL cho MySQL.
