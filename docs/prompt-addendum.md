# DataLab — Phụ lục để prompt có thể triển khai và nghiệm thu

> **Cập nhật implementation 08/10/2026:** đã có 14 bài theo câu chuyện, theme sáng/tối, bài partition thực và prototype PostgreSQL riêng. Các mô tả/đánh giá trước triển khai trong tài liệu này được giữ làm bối cảnh; đối chiếu [chức năng hiện có](current-features.md) và [hướng dẫn native](native-connector-setup.md) để biết phần đã hoàn thành. Hosted labs, account, cloud relay bền vững và SQL builder vẫn là mục tiêu.

Phụ lục này bổ sung yêu cầu còn thiếu cho prompt gốc. Tầm nhìn **RUN → SEE → BREAK → FIX → UNDERSTAND** được giữ nguyên. Các ngưỡng dưới đây là mục tiêu kỹ thuật cần đo khi nghiệm thu, không phải số liệu đã đạt. Không mô tả tính năng tương lai như tính năng đang hoạt động.

Nếu muốn biết hiện sản phẩm làm được gì và “scale về sau” đòi hỏi công việc nào, đọc [hoạt động và scale](how-it-works-and-scales.md). Phụ lục này là đặc tả mục tiêu; các profile, timeout và interface ví dụ bên dưới cần phân biệt với implementation trong [kiến trúc hiện tại](architecture-and-data.md).

## 1. Phạm vi bàn giao đầu tiên

**MVP 1: một vòng học hoàn chỉnh chạy PostgreSQL thật trong trình duyệt.** Bàn giao landing, dashboard, danh mục 12 lab, lab workspace, playground, trang pricing và trang chiến dịch. Người học không cần tài khoản; progress lưu trên thiết bị.

- Landing có CTA mở lab và demo tương tác lấy kết quả từ engine. Nếu dùng số liệu ví dụ, gắn nhãn “Ví dụ minh họa”, không dùng như benchmark hoặc kết quả đo trên thiết bị.
- 12 lab trong prompt gốc đều có dataset, SQL khởi đầu, nhiệm vụ, validator, hint tăng dần, solution và explanation. Không hiển thị lab chưa có nội dung như lab đã hoàn thành.
- Pricing mô tả Free đang có và Pro/Lifetime dự kiến, giá VND là giả thuyết thử nghiệm. CTA Pro dẫn tới thông tin lộ trình hoặc danh sách quan tâm có backend thật khi đã cấu hình; không giả lập checkout thành công, tài khoản trả phí hoặc entitlement.
- Campaign “30 Days SQL Challenge” là trang giới thiệu chương trình. Chỉ ngày có lab thật mới được mở; các ngày khác ghi “Sắp ra mắt”. Không tuyên bố đã có 30 lab, leaderboard hoặc chứng nhận nếu chưa triển khai.
- Playground dùng dataset dùng thử; không có chức năng kết nối database production.
- Account, đồng bộ thiết bị, leaderboard, referral, subscription/payment, CMS, chứng nhận và AI tutor thuộc giai đoạn sau. Tách interface để bổ sung được, không tạo màn hình giả hoạt động.

## 2. Kiến trúc thực thi và dữ liệu

Ưu tiên PGlite, chạy trong dedicated Web Worker và lazy-load khi người học mở workspace. PGlite có thể chạy trong browser, dùng database trong bộ nhớ hoặc IndexedDB. [Tài liệu PGlite](https://pglite.dev/docs/)

```ts
interface DatabaseRunner {
  initialize(config: DatasetConfig): Promise<DatasetMetadata>;
  execute(sql: string): Promise<QueryResult>;
  explain(sql: string, analyze: boolean): Promise<PlanResult>;
  inspectSchema(): Promise<SchemaMetadata>;
  reset(config: DatasetConfig): Promise<void>;
  dispose(): Promise<void>;
}
```

Adapter engine không biết React/UI; validator không được dùng kết quả giả. Đóng gói kiểu dữ liệu gồm nguồn đo `real | estimate | simulation`, phiên bản engine, dataset seed, số dòng thật, run ID, SQL hash và thời điểm chạy. Tất cả request vào một database được xếp hàng; bỏ qua response cũ sau khi đổi lab/reset. Sau timeout, chấm dứt worker và tạo lại dataset; không để database lỗi tiếp tục nhận query.

Dataset ecommerce có `customers`, `products`, `orders`, `order_items`, PK/FK, giá tiền dùng integer cents hoặc NUMERIC, ngày tháng deterministic. Không dùng `Math.random()` không seed. Có khách chưa mua hàng, nhiều đơn cho cùng khách, giá trị NULL hợp lệ và dữ liệu trùng theo quy tắc nghiệp vụ để JOIN/GROUP BY/window có ý nghĩa. Sau seed phải cập nhật statistics bằng `ANALYZE`.

- Mặc định đề xuất 10K–30K orders; profile performance tối đa 100K orders cho MVP. Tổng dòng của các bảng phải được ghi rõ. Mobile/thiết bị yếu có profile nhẹ, không tự chọn 1M dòng.
- Giữ bảng độc lập giữa các lab. Reset lab trả về seed/schema/index ban đầu, xóa kết quả và baseline; reset không xóa tiến độ học.
- Khởi tạo dataset theo batch để UI có trạng thái tiến độ. Không chèn hàng triệu dòng bằng vòng lặp trên main thread.
- Giới hạn đề xuất: SQL 32KB, 1 execution đang chạy, timeout query 8 giây, bootstrap timeout 30 giây, tối đa 200 dòng/100 cột render. Chỉ số result ghi rõ kết quả bị giới hạn; limit render không biến thành số dòng thật toàn query.
- Kết quả lớn dùng phân trang/virtualization hoặc fetch có giới hạn ở adapter; không chỉ cắt mảng sau khi tải toàn bộ kết quả khổng lồ. Validator chỉ chạy bài trên dataset đã giới hạn và không dựa vào các dòng đã bị cắt ở UI.
- Mục tiêu desktop: workspace sẵn sàng trong 5 giây sau tải engine trên máy tham chiếu đã ghi cấu hình. Landing không tải WASM; mục tiêu JS ban đầu dưới 500KB gzip. Ghi kích thước tải engine, thời gian seed và profile thiết bị thực tế trong README.
- Memory browser là ràng buộc best effort qua dataset/result budget; không tuyên bố có hard CPU/memory isolation nếu browser không cung cấp. Backend executor tương lai phải có giới hạn thực tại OS/container.

## 3. Metrics phải nói đúng điều đã đo

Dùng `EXPLAIN (ANALYZE, FORMAT JSON)` cho query đọc phù hợp; `EXPLAIN (FORMAT JSON)` chỉ cung cấp plan ước lượng. `ANALYZE` thực sự thực thi statement và có thể gây tác dụng phụ; tránh tự chạy lại SQL mutation chỉ để lấy metrics. [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/sql-explain.html)

| Nhãn trong UI | Ý nghĩa và quy tắc |
| --- | --- |
| PostgreSQL execution time | `Execution Time` từ EXPLAIN ANALYZE, đơn vị ms; có overhead đo |
| Browser elapsed | Thời gian request worker → response bằng timer, gồm overhead client; tách khỏi thời gian engine |
| Rows returned | Số dòng đầu ra query; nếu chỉ fetch mẫu, ghi “200 dòng được hiển thị”, không suy ra toàn bộ |
| Estimated rows | `Plan Rows` tại node; là ước lượng dòng đầu ra, không phải dòng đọc |
| Actual rows | Dòng đầu ra node từ ANALYZE; phải xét `Actual Loops` khi diễn giải |
| Planner cost | Đơn vị tương đối của planner, không phải ms hoặc chi phí tiền |
| Buffer counters | Chỉ hiển thị khi engine trả về và ghi đúng block hit/read; không gọi là % disk I/O |
| CPU/Connections trong incident | Thông số của kịch bản đào tạo, gắn nhãn “Scenario metrics”, không mô tả là đo máy người học |

Không đổi `Actual Rows` thành “Rows scanned”. Chỉ diễn giải số dòng lọc tại scan node khi plan có đủ thông tin; các phép suy ra phải gắn nhãn ước lượng và không cộng trùng các node. Một index tồn tại không có nghĩa planner bắt buộc dùng index; giải thích hợp lý khi sequential scan vẫn rẻ hơn. [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)

Before/after chỉ so cùng query mục tiêu, cùng dataset/seed và cùng profile. Lưu baseline trước khi thay index; reset hoặc đổi seed làm baseline hết hiệu lực. Nếu benchmark nhiều lần, ghi số lần và median. Không yêu cầu mọi máy đạt giảm 80% hoặc cố định 4.82s → 0.008s.

B-tree visualization là sơ đồ giải thích, gắn nhãn minh họa; sơ đồ không tuyên bố đọc được layout page vật lý của engine. Node/scan type và index name lấy từ plan/catalog thật. Khi không có plan mới, UI phải ghi đang chờ chạy lại.

Scale simulation là tính năng sau MVP: công thức, giả định, giới hạn áp dụng, đơn vị và nhãn “Ước tính” phải công khai. Không trộn số mô phỏng với số thực trong một bảng mà thiếu nguồn.

## 4. Lab contract và tiêu chí nghiệm thu

Content nằm ngoài component, có schema kiểm tra lúc build. Mỗi lab gồm `id`, `version`, `title`, `difficulty`, `learningObjectives`, `datasetProfile`, `seed`, `initialSql`, `setupSql`, `task`, `validation`, `hints`, `solution`, `explanation`, `nextLabId`. Dataset/solution/setup được kiểm tra tự động để phát hiện content lỗi trước release.

Validator kiểm tra ngữ nghĩa kết quả và yêu cầu bài học. Cho phép SQL tương đương, đổi alias hoặc tên index. So sánh multiset khi thứ tự không thuộc đề bài; so sánh thứ tự khi có yêu cầu ordering, giữ đúng NULL, duplicate, kiểu dữ liệu và tolerance NUMERIC đã định. Không dùng string equality toàn SQL hoặc chỉ check có từ `JOIN/INDEX`.

| Lab | Hành vi hoàn thành tối thiểu |
| --- | --- |
| 001 SELECT & WHERE | Trả đúng tập đơn hàng theo bộ lọc được công bố, đúng cột cần chọn |
| 002 GROUP BY | Aggregate đúng tổng/số lượng từng nhóm, xử lý nhóm trùng đúng |
| 003 JOIN | Kết quả đúng quan hệ khách/đơn; tránh cross join và nhân tổng ngoài ý muốn |
| 004 Window Function | Ranking/top-N theo nhóm đúng; tie và ordering có quy tắc rõ |
| 005 Full Table Scan | Chạy query baseline thật, đọc được Seq Scan và giải thích filter |
| 006 Your First Index | Kết quả query mục tiêu giữ nguyên; catalog có index hữu ích; plan dùng scan thích hợp trên dataset chọn lọc |
| 007 Composite Index | Kết quả đúng; index composite phù hợp filter/order được kiểm tra qua catalog + plan; giải thích column order |
| 008 LIKE and Index | Phân biệt prefix với contains; kết quả đúng; giải thích điều kiện index có thể dùng, không đảm bảo mọi LIKE dùng B-tree |
| 009 EXPLAIN | Chạy/đọc plan thực, phân biệt estimate với actual, hoàn thành câu hỏi nhận diện node |
| 010 Optimize a Slow Query | Giữ ngữ nghĩa query; thay đổi hữu ích được chứng minh qua plan/cost/catalog; timing là phản hồi tham khảo |
| 011 Pagination Performance | Trang tiếp theo đúng, thứ tự ổn định với tie-breaker; keyset cursor đúng; so sánh kế hoạch với OFFSET |
| 012 Real-world Database Incident | Chọn bottleneck từ query/plan của kịch bản, tối ưu query mục tiêu giữ kết quả, xem plan trước/sau; nhãn metrics kịch bản rõ |

Hint mở theo thứ tự, solution chỉ xuất hiện khi người học chọn. Xem solution không tự hoàn thành bài; người học phải Run/Validate. Bài đã hoàn thành không được cộng XP lần nữa. Completion được ghi sau validator pass, có version content và thời điểm; chạy query sai vẫn cho kết quả/lỗi hữu ích, không tự pass vì có index.

Client-side validator không tạo chống gian lận hoặc hidden test bảo mật. Interview/certificate trả phí về sau cần validator server nếu sản phẩm yêu cầu điểm đáng tin cậy.

## 5. UX, accessibility và trạng thái lỗi

Desktop: concept/task bên trái, editor/result là trọng tâm, plan/metrics dễ đối chiếu. Mobile 360px: một cột hoặc tabs; bảng/editor scroll trong vùng riêng; navigation, Run, Reset, Validate và hints không tràn viewport. Không khóa người dùng vào desktop.

- Mọi nút/icon có accessible name; label input đầy đủ; focus rõ; tab bàn phím hợp lý; không truyền thông tin chỉ bằng màu.
- Run có shortcut hiển thị, nút luôn dùng được bằng bàn phím; Ctrl/Cmd+Enter không xung đột thao tác hệ thống.
- Execution có `idle / loading / ready / running / success / error / timedOut`, error SQL giữ nguyên editor và hiển thị thông báo engine đọc được; nút Run không chạy lặp khi đang bận.
- Thông báo hoàn thành/lỗi qua live region phù hợp; số liệu có đơn vị; dùng reduced-motion cho animation; tương phản đạt mục tiêu WCAG AA.
- Reset lab có xác nhận khi editor chứa thay đổi chưa lưu. Clear all progress là hành động riêng, có xác nhận và nêu cụ thể dữ liệu bị xóa.
- Initial engine download, offline lỗi tải WASM, private mode/storage quota, lỗi storage corruption và timeout đều có màn hình phục hồi/retry; không chuyển sang kết quả giả.
- Dark/light mode nếu có phải có contrast kiểm tra cả hai; nội dung kỹ thuật bằng tiếng Anh được, điều hướng/giải thích cần ngôn ngữ nhất quán.

## 6. Progress, privacy và dữ liệu cục bộ

Đề xuất schema versioned:

```json
{
  "schemaVersion": 1,
  "updatedAt": "ISO timestamp",
  "completedLabs": { "index-006": { "contentVersion": 1, "completedAt": "ISO timestamp", "solutionViewed": false } },
  "lastLabId": "index-006",
  "xp": 100,
  "activeDates": ["2026-10-07"],
  "preferences": { "theme": "dark", "datasetProfile": "standard" }
}
```

XP tính lại từ completed labs để tránh drift; lưu completion idempotent. Validate dữ liệu đọc từ localStorage; migration có version, xử lý JSON hỏng bằng trạng thái phục hồi, không crash ứng dụng. Unknown lab IDs không tính vào tổng hiện tại. Ngày streak dùng timezone người học; không lẫn UTC date với ngày địa phương. Có Export/Import progress nếu triển khai và phải validate file/import size.

Thông báo rõ: progress chỉ trên browser/thiết bị, không đồng bộ, có thể mất khi người dùng xóa storage. Không thu SQL, query result hoặc thông tin người học qua analytics mặc định. Không lưu secret trong client. Nếu chưa có backend tracking, events local chỉ là dữ liệu thử nghiệm trên thiết bị, không gọi là analytics toàn hệ thống. Nêu cơ chế xóa dữ liệu và consent khi thêm analytics.

## 7. Threat model và ranh giới an toàn

MVP chỉ dùng dữ liệu synthetic trên database browser tách biệt. SQL không có đường truy cập application database hoặc production database. Giới hạn statement được thiết kế theo bài: SELECT/CTE/EXPLAIN và index DDL phù hợp; setup/reset thuộc code tin cậy. Chặn extension/network/filesystem/database management ở executor policy. Regex đơn giản chỉ hỗ trợ UX, không phải SQL parser hoặc security boundary; transaction/CTE có mutation và function có side effect phải được xét khi mở rộng quyền.

Không tự nối SQL người học vào privileged administrative query. SQL error/content/result render như text; tránh HTML injection. Dependency/WASM nguồn cố định, không dùng runtime CDN không kiểm soát nếu có thể bundle; CSP theo nhu cầu WASM/worker. Query loop và result quá lớn có timeout/result budget. Dừng worker không hủy data ở production vì production không tham gia.

Executor backend tương lai: auth trước execution, sandbox/session riêng, role hạn chế, allowlist extension, statement timeout, row/result quota, rate limit, giới hạn CPU/memory thật, không mount secret/filesystem hoặc cho outbound network, audit metadata không lưu SQL nhạy cảm mặc định. Không cho SQL người học chạy cùng connection/role của billing/auth/content.

## 8. Kiểm thử và Definition of Done

- Build/typecheck/lint theo repo; engine và dependency được pin qua lockfile.
- Smoke test thực chạy toàn bộ 12 solution trên dataset seed; mỗi lab có ví dụ sai phải fail. Với optimization, kiểm tra result preservation + plan/catalog, không assert milliseconds trên máy CI.
- End-to-end: landing → lab → query error → sửa query → Run → plan → hint → Validate → dashboard progress → reload vẫn đúng; Reset khôi phục dataset; không cấp XP hai lần.
- Kiểm tra mobile 360px/desktop, keyboard, reduced motion, load/error/timeout; thử storage hỏng hoặc không ghi được để UI phục hồi.
- Verify không có query/plan/latency fake trong đường chạy thật; mọi số giả lập trong incident hoặc marketing được gắn nhãn.
- README ghi cách chạy local/build, asset/WASM requirements, cách thêm lab, engine/dataset version, limitation và phạm vi chưa triển khai.
- Bàn giao source, nội dung 12 lab, hướng dẫn, báo cáo checks đã chạy cùng kết quả thực; không nói test/deployment pass nếu chưa chạy.
- Public launch đầu tiên chỉ sau core loop hoạt động. Deploy không đồng nghĩa đã có authentication/payment/production sandbox backend.

## 9. Roadmap production có điều kiện

**Pha 1 — Validate learning loop:** MVP 12 lab; mời 20–50 người mục tiêu sau khi kiểm chứng 3–5 lab đầu. Đo và quan sát lý do bỏ cuộc trước khi viết 100 lab. Pricing chỉ ghi nhận quan tâm khi có hạ tầng lưu nhận thật.

**Pha 2 — Account/content:** auth bằng provider có thực, route authorization server, xác minh email nếu cần; progress sync có conflict policy, merge anonymous completion idempotent; content versioned + publish workflow; admin có role riêng, audit trail và rollback. Tạo account không tự cấp Pro.

**Pha 3 — Payments/entitlements:** `PaymentProvider` adapter cho PayOS/Stripe; tạo checkout ở server; tiền/plan IDs từ cấu hình server; xác thực chữ ký webhook trên raw request body, chống event duplicate/replay, trạng thái payment idempotent, out-of-order event/reconciliation, refund/cancel/expiry. Success redirect chỉ báo đang xác minh, không cấp Pro. Entitlement đọc từ trạng thái server đã xác minh; không lấy localStorage, URL param hoặc client flag làm quyền mua.

Mô hình dữ liệu tối thiểu: `users`, `plans`, `checkout_sessions`, `payment_events`, `subscriptions`, `entitlements`. Lưu tiền theo đơn vị nhỏ nhất/currency, thời gian chuẩn UTC, trình bày timezone địa phương. Sandbox provider phải end-to-end được trước live. Lifetime phải nêu quyền nội dung hiện tại/tương lai và chính sách thay đổi; không dùng giả discount/countdown không có ngày hết hạn thật.

**Pha 4 — Premium:** server interview scoring, incident nâng cao, referral chống abuse, certificates có tiêu chí, analytics opt-in, AI tutor có context giới hạn/cost budget/redaction. AI không được tự ý thi hành SQL có quyền ngoài sandbox.

## 10. Đo thành công thay vì đếm feature

Định nghĩa event có version, timestamp, lab ID/content version, anonymous session ID có TTL; không gửi SQL/result. Bổ sung `lab_viewed`, `validation_attempted`, `validation_passed`, `next_lab_started` để phân biệt query chạy thành công với học hoàn thành.

Metric đầu tiên: tỷ lệ người hoàn thành lab đầu tự bắt đầu lab thứ hai trong cùng phiên hoặc trong 24 giờ. Báo denominator, sample size, cửa sổ thời gian; chỉ thống kê khi có event collection thật. Mục tiêu thử nghiệm đề xuất: ít nhất 60% người tham gia hoàn thành lab hướng dẫn và 30% tự bắt đầu lab tiếp theo; đây là ngưỡng quyết định thử nghiệm, không phải thành tích sản phẩm.

Theo dõi thêm time-to-first-successful-query, lỗi bootstrap, drop-off từng lab, hint/solution usage và return Day 2. `Free → Pro` chỉ đo khi payment đã có thật; giai đoạn trước dùng pricing interest riêng, không gọi là conversion trả phí. Kết hợp quan sát và câu hỏi xem người học có giải thích được vì sao plan đổi sau thêm index.

## 11. Hướng bổ sung: database native của người học

Theo trao đổi ngày 08/10/2026, thiết kế thêm chế độ learner cài dataset vào database riêng và dùng DataLab để chạy/phân tích/học trực quan. **Ưu tiên PostgreSQL trước**, MySQL là nhánh sau. Giữ browser lab hiện tại; hosted server là phương án tùy chọn. Đây là mục tiêu mới chưa triển khai, được mô tả tại [thiết kế database của người học](own-database-labs-design.md).

- Connector giữ credential local và kết nối ra API; web không cần mở cổng PostgreSQL/MySQL trên laptop learner ra Internet.
- Người học chạy SQL mẫu hoặc query họ viết; hệ thống tự lấy plan, phân biệt plan ước tính với số đo thật và không yêu cầu tự viết EXPLAIN.
- Có cây plan, biểu đồ trước/sau, estimated/actual rows, buffers và lời giải thích gắn bằng chứng. Không biến sơ đồ minh họa hoặc counter suy ra thành số đo vật lý chính xác.
- Gợi ý/SQL builder đưa SQL vào editor; thao tác tạo index/mutation chỉ thực thi khi người học chọn. Setup/reset chỉ tác động schema lab.
- Dataset/profile có version và dung lượng/khởi tạo đã đo; import một lần, giữ dataset giữa các lần học và không đặt một tỷ dòng làm mặc định.
- Chấm bài dựa trên kết quả đúng và yêu cầu bài đã kiểm chứng trên native profile; tính đến phần cứng/cache. Score do connector người học kiểm soát chưa đáp ứng chống gian lận.
