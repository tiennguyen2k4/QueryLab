# Kết nối PostgreSQL local có sẵn

> **Cập nhật:** cách chính hiện nay là điền thông tin DB tại `/connections` (form host/port/database/user/mật khẩu, hoặc dán URL). Server DataLab chạy trên máy bạn kết nối trực tiếp tới PostgreSQL ở localhost; mật khẩu chỉ nằm trong RAM khi đang kết nối, không lưu trên trình duyệt hay ổ đĩa; API chỉ nhận request cùng nguồn qua localhost. Connector mô tả bên dưới là cách cũ, vẫn giữ cho dataset lab.

Luồng chính từ 15/10/2026: **DB có sẵn → baseline → xem SQL → xác nhận → đo sau → giải thích**. Không còn yêu cầu làm lab SQL cơ bản hay nạp bộ orders mẫu để dùng workspace.

## 1. Chạy web và connector trên máy bạn

Từ thư mục `datalab`, chạy `npm ci` nếu chưa có dependency, rồi:

```bash
npm run dev
```

Trong terminal khác, thay cấu hình mẫu bằng DB phát triển local của bạn:

```bash
DATALAB_MODE=existing \
DATABASE_URL='postgresql://YOUR_ROLE:YOUR_PASSWORD@127.0.0.1:5432/YOUR_DATABASE' \
DATALAB_URL=http://localhost:3000 \
npm run connector
```

Không đưa URL/mật khẩu vào form website hay source code. Với mật khẩu có ký tự đặc biệt, URL-encode theo cú pháp PostgreSQL URL; tránh ghi thông tin thật vào shell history dùng chung. Chỉ dùng PostgreSQL trên `localhost`, `127.0.0.1` hoặc `::1`. Chế độ existing từ chối URL có query/fragment override và relay ngoài loopback.

Role không được có SUPERUSER, CREATEDB, CREATEROLE, REPLICATION hoặc BYPASSRLS. **Không dùng database production**, kể cả khi database nằm trên máy local.

## 2. Ghép nối

Mở `/connections`, nhập mã 12 ký tự hex được in trong terminal. Mã dùng một lần, hết hạn sau 5 phút. Connector tự cấp mã mới khi mã hết hạn hoặc browser ngắt ghép nối.

Ứng dụng chỉ đọc metadata của các bảng thường/partitioned có quyền SELECT và schema USAGE, bỏ qua system schema và bảng partition con. Tối đa 200 bảng hiển thị; với DB lớn, giới hạn role vào schema cần khảo sát. Số dòng là ước tính từ catalog, có thể cũ; dung lượng bảng partitioned cha không đại diện tổng dung lượng toàn bộ bảng con.

**Ghép nối không seed, CREATE, DROP, reset hay sửa dữ liệu.** Không fetch result-row preview; query text, metadata và EXPLAIN plan đi qua web local. Plan có thể chứa giá trị filter. Token browser chỉ nằm trong bộ nhớ; reload cần ghép nối lại.

## 3. Quyền vừa đủ

Chạy các lệnh tương tự dưới đây bằng owner trong DB client local, thay tên theo DB của bạn:

```sql
GRANT USAGE ON SCHEMA public TO my_local_role;
GRANT SELECT ON TABLE public.orders TO my_local_role;
-- Chỉ cấp khi cần tạo bản sao thử nghiệm:
GRANT CREATE ON SCHEMA public TO my_local_role;
```

Tạo index còn cần quyền sở hữu bảng nguồn; SELECT không đủ. Không cấp superuser hay đổi chủ bảng ứng dụng chỉ để bỏ qua lỗi. Dùng bản sao phát triển do bạn sở hữu. UI hiển thị lỗi nếu thiếu quyền, không giả báo thành công.

## 4. Đo baseline

Mở `/workspace`, chọn bảng, điền SELECT mẫu hoặc query SELECT/WITH của bạn, bấm **Đo baseline** (`Ctrl/Cmd + Enter`). Autocomplete lấy cột từ schema đã đọc.

Đo dùng `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON, ...)`: query được chạy thật, không chỉ lập kế hoạch. Transaction read-only, mỗi statement tối đa 4,5 giây; SQL guard từ chối ghi dữ liệu, hàm không được hỗ trợ, system functions/catalog và nhiều statement. Tối đa 16.000 ký tự.

## 5. Thử thay đổi

### Index B-tree

Chọn 1–4 cột theo thứ tự khóa, đặt tên mới bắt đầu bằng `datalab_`, xem SQL, đọc đánh đổi rồi tích xác nhận và chạy. SQL được sinh và kiểm tra trong connector, không phải script DDL tùy ý từ browser.

Index là loại thường, **không concurrent**, có thể chặn ghi trong lúc xây. Chờ khóa tối đa 1,5 giây; mỗi DDL tối đa 20 giây. Không hứa rằng index luôn nhanh hơn: độ chọn lọc, kích thước bảng và workload quyết định.

### Bản sao partition theo tháng

Chọn cột date/timestamp, tháng đầu và 1–24 tháng. Bấm điền query tháng, đo baseline rồi xem SQL:

1. Tạo bảng mới `LIKE` nguồn và chia RANGE theo cột ngày.
2. Tạo các partition tháng `[cận dưới, cận trên)` và partition DEFAULT.
3. Sao chép **toàn bộ** nguồn, tối đa 1 triệu dòng, kể cả NULL/ngày ngoài khoảng.
4. ANALYZE bản sao.

Toàn bộ chạy trong một transaction. Lỗi ở bước sau rollback cả các bước trước. Nguồn không bị chuyển đổi/xóa, nhưng copy giữ khóa SHARE và chặn ghi nguồn trong khi chạy, đồng thời cần thêm dung lượng. Bản sao không mang index/default/identity/generated behavior/trigger/khóa ngoại; không dùng nó như migration production.

Query sau đo trên bản sao. Biểu đồ phải được hiểu cùng khác biệt index và cấu trúc: đây không phải benchmark cô lập chỉ riêng partition pruning.

### Viết lại query

Giữ baseline, sửa SELECT ở editor, bấm **Đo sau thay đổi**. Chỉ so hiệu năng; không khẳng định đã so toàn bộ kết quả tương đương. Tự kiểm tra giá trị, dòng trùng, NULL, LIMIT và ORDER BY.

## 6. So sánh và dọn thử nghiệm

Biểu đồ gồm thời gian thực thi, lượt đọc heap xấp xỉ và shared blocks đọc mới. Plan hiển thị scan/index, rows/loops, buffers root, sort spill và sai lệch ước tính. Ô partition dựa trên scan có Actual Loops dương.

Một lần đo không đủ kết luận; cache, ghi đồng thời và planner ảnh hưởng kết quả. Shared reads không đồng nghĩa đọc đĩa vật lý. Không cộng buffer counters cha/con.

Lịch sử phiên có **Xem SQL dọn thử nghiệm**. DROP chỉ được duyệt cho đối tượng còn đúng OID/tên do tiến trình connector này tạo; không xóa index có sẵn hay bảng gốc. DROP cũng cần preview một lần và xác nhận.

Đối tượng vẫn tồn tại sau reload/ngắt kết nối. Lịch sử UI và registry cleanup trong connector không bền vững; khi restart connector, kiểm tra và dọn thủ công bằng DB client nếu cần.

Điều hướng client-side tới sổ tay rồi quay lại giữ query, baseline, biểu đồ và lịch sử thay đổi. Bản xem trước SQL và ô xác nhận không giữ khi rời workspace. Khi reload, browser gửi yêu cầu trả phiên cũ; nếu mạng làm mất yêu cầu này, restart connector để lấy phiên ghép nối mới.

## 7. Lỗi mạng, deadline và phục hồi

Relay chạy trong RAM của một tiến trình Node, mỗi connector một job tại một thời điểm. Job thường deadline 30 giây. Không tự replay SQL/DDL khi mất mạng. Connector hủy bằng một kết nối điều khiển riêng.

Khi DDL bị ngắt, trạng thái có thể chưa rõ. Đợi connector xác nhận hủy, kiểm tra DB bằng client local rồi dùng nút **Tôi đã kiểm tra DB; xác nhận trạng thái hiện tại**. Nút chỉ đọc lại metadata và bỏ chặn phiên; không chạy lại DDL, không rollback thay đổi đã commit, không reset DB.

Khởi động lại web mất token/job. Dừng connector rồi khởi động và ghép nối lại. Đây chưa phải dịch vụ production có auth, lưu job bền vững hoặc nhiều instance.

## Kiểm tra

```bash
npm run typecheck
npm test
npm run build
```

Để kiểm tra PostgreSQL thật, khởi động fixture riêng:

```bash
docker compose -p datalab-native -f connector/compose.yaml up -d --wait
```

Đặt `DATALAB_TEST_DATABASE_URL` chỉ tới database test `datalab_lab`/`datalab_lab_*`, rồi:

```bash
node --import tsx --test --test-isolation=none tests/workspace-postgres.test.ts
```

Test tạo schema test có tên riêng, kiểm tra schema discovery, baseline/index thật, partition copy đủ giá trị, NULL/default, rollback nguyên tử và cleanup rồi xóa riêng schema đó. Không có URL thì integration báo SKIP.

Backend fixture cũ vẫn được giữ cho sandbox và regression: mode mặc định `lab`, cần `DATALAB_DEDICATED_DATABASE=1`, tên DB `datalab_lab`/`datalab_lab_*`. **Mode existing luôn chặn initialize/reset/prepare/run của fixture engine**. `npm run test:connector:postgres` kiểm tra backend cũ và có reset riêng schema lab; không trỏ test đó vào DB ứng dụng.
