# Deploy và chi phí hạ tầng

**Có ba mô hình:** beta browser hiện tại; lab native trên database của người học; và hosted lab trên compute/storage DataLab thuê. Chế độ PostgreSQL riêng đã có prototype local; hosted native còn là thiết kế chưa triển khai. Tài liệu không tạo tài nguyên, đăng ký dịch vụ hoặc deploy thay người dùng.

Để hiểu vì sao các mô hình có chi phí và cách scale khác nhau, đọc [hoạt động và scale](how-it-works-and-scales.md). Hiện người học tự cung cấp CPU/RAM chạy SQL bằng thiết bị mình; hosted server labs chuyển phần công việc đó sang tài nguyên bạn thuê, còn chế độ database riêng tiếp tục dùng tài nguyên của người học.

Phần 2–5 dưới đây áp dụng khi **DataLab host database**. Nếu learner cài dataset vào PostgreSQL của họ, xem [phần 6](#6-khi-database-do-người-học-cung-cấp) và [thiết kế database của người học](own-database-labs-design.md). Chế độ đó không cần mua một slot database trên VPS DataLab cho mỗi learner.

## 1. Deploy phiên bản hiện có

Chế độ browser chỉ cần deploy Next.js trong `datalab/`. Prototype connector chạy local với PostgreSQL của người học; relay production mặc định bị tắt và chưa có lưu phiên bền vững. Không bật nó trên Vercel nhiều instance rồi coi là cloud service hoàn chỉnh. Xem [hướng dẫn native](native-connector-setup.md).

### Chạy local

Từ thư mục gốc workspace:

```bash
cd datalab
npm ci
npm run dev
```

Mở `http://localhost:3000`. Kiểm tra bản production:

```bash
npm run typecheck
npm test
npm run build
npm start
```

`npm start` dùng port 3000; dừng dev server trước nếu nó đang giữ port. Các lệnh này không publish URL public.

### Deploy Vercel

1. Đẩy source lên repository mà tài khoản Vercel của bạn có quyền truy cập.
2. Import project; đặt **Root Directory = `datalab`** nếu import repo DataForge.
3. Framework = Next.js; Build Command = `npm run build`; cài dependency từ lockfile. Repo có [vercel.json](../vercel.json).
4. Bản beta hiện tại không cần database URL, API key hoặc biến môi trường ứng dụng.
5. Deploy rồi kiểm tra JS/WASM/Worker tải được trên domain production; chạy thử lab, index, validation, reset, interview và mobile.

Cũng có thể dùng CLI `npx vercel` trong `datalab/` sau khi đăng nhập đúng tài khoản/project. Tài liệu này không khẳng định app đã được publish.

Domain mới có origin khác localhost nên không tự mang tiến độ local sang. Export được JSON nhưng chức năng import hiện chưa có.

Chọn gói Vercel theo điều kiện sử dụng thực tế. Hobby dành cho mục đích cá nhân phi thương mại; khi vận hành sản phẩm thương mại cần xem gói phù hợp và mức sử dụng được tính phí. [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Vercel pricing](https://vercel.com/pricing).

## 2. Khi bổ sung server labs, phải thuê/deploy gì?

**Phương án pilot đề xuất:** Vercel cho web + một VPS Linux có SSD cho phần lab. Đây là một máy chủ thuê cho hệ thống, không thuê một máy mới cho từng learner.

| Nơi đặt | Deploy gì? | Dữ liệu/resource |
| --- | --- | --- |
| Vercel | Next.js UI, auth/account API, endpoint submit job/status | Web assets, request ngắn |
| VPS: reverse proxy | HTTPS cho `lab-api.example.com` | TLS, routing và giới hạn request |
| VPS: Lab API | Ownership, quota, tạo session, nhận job | Metadata và policy |
| VPS: Redis/BullMQ | Queue và trạng thái job | Queue riêng, không để public |
| VPS: runner/provisioner | Query, validator, benchmark, tạo/hủy sandbox | Quyền được tách và giới hạn |
| VPS: App PostgreSQL | Account/progress/session/job records | Volume persistent, backup |
| VPS: lab containers | Một PostgreSQL instance riêng cho mỗi session đang hoạt động | CPU/RAM quota, volume tạm, dataset clone |
| Storage backup riêng | Backup App DB và cấu hình cần khôi phục | Không dùng cùng volume duy nhất với bản đang chạy |

Các port App DB/PostgreSQL lab/Redis chỉ mở nội bộ; public ingress là HTTPS. Vercel gọi gateway bằng credential server; browser không biết password DB và không truyền host/database tùy ý.

Hạ tầng đề xuất cần code tại [Thiết kế lab server](server-labs-design.md). **Chưa có Dockerfile/Compose/provisioner cho hosted server labs**, nên chưa thể chỉ chạy `docker compose up` để có phiên bản hosted này. Compose trong `connector/` chỉ dựng database local cho prototype PostgreSQL riêng.

## 3. Tài nguyên ban đầu và capacity

Mức dùng để khảo sát gói pilot: **4 vCPU, 8–16 GB RAM, 100–160 GB SSD**. Đây là budget thử nghiệm, chưa phải cấu hình bảo đảm chạy đủ mọi lab hoặc phục vụ một số user cụ thể. Nếu mục tiêu là benchmark có ít nhiễu, ưu tiên xem gói dedicated vCPU và kiểm chứng thực tế.

Trước khi thuê production, dựng bản server trên máy dev với Docker, đo một profile dataset 1 triệu orders và một benchmark. Đo cả:

- Dung lượng template, mỗi clone, index, WAL và temp peak.
- RAM/CPU peak cho lab và load generator; phần reserve cho OS, gateway, queue, App DB.
- Thời gian provision/reset/cleanup và độ trễ baseline.
- Tải I/O khi clone và benchmark cạnh tranh.

Ước lượng slot resource ban đầu:

```text
RAM khả dụng = RAM máy - OS - App DB - gateway/queue/runner - headroom

slot theo resource = min(
  floor(CPU budget / CPU quota mỗi lab),
  floor(RAM khả dụng / RAM quota mỗi lab),
  floor(disk budget / disk peak mỗi clone)
)

slot được mở = min(slot theo resource, giới hạn I/O, giới hạn công bằng benchmark)
```

Ví dụ giả định: sau reserve còn 8 GB RAM, quota 2 GB/session thì riêng RAM cho phép 4 slot. Nếu chỉ chấp nhận một benchmark nặng để tránh nhiễu, concurrency benchmark vẫn là **1**, không phải 4. Đây là ví dụ tính, không phải kết quả đo app.

Số user đăng ký, người đang xem trang, session database đang sống và số connection tạo tải là bốn con số khác nhau. 50 client trong pgbench không có nghĩa 50 learner độc lập. Hết slot thì xếp hàng; không cam kết “VPS này phục vụ X người” khi chưa load test.

### Capacity và throughput khác nhau thế nào?

Capacity session là số database tạm có thể giữ cùng lúc trong budget tài nguyên. Throughput job là số công việc hoàn thành trong một khoảng thời gian. Có 4 slot session nhưng chỉ một slot benchmark nặng thì 4 người có thể giữ database, còn benchmark cần xếp hàng.

Ví dụ giả định mỗi benchmark mất 2 phút và chỉ chạy một job tại một thời điểm: bỏ qua provision/warm-up/cleanup, trần lý thuyết là 30 job/giờ. Nếu nhu cầu liên tục 60 job/giờ, queue sẽ tăng; thêm Redis hoặc thêm API replica không tự tăng số query PostgreSQL có thể xử lý. Phải đo nút thắt rồi giảm tải mỗi job, điều chỉnh quota hoặc thêm tài nguyên/host.

Theo dõi queue wait, tỷ lệ lỗi/timeout và tài nguyên ở peak cùng với thời gian query. Khi ưu tiên độ ổn định benchmark, các công việc clone/query khác trên host cũng có thể cần hạn chế dù còn slot RAM.

## 4. Tiền được tính thế nào?

Khi tự host, một khoản thuê VPS bao gồm mức tài nguyên theo gói. Chạy thêm container trên cùng VPS không tự tạo hóa đơn VPS mới, nhưng tiêu thụ tài nguyên và giảm số slot còn lại.

| Khoản | Cách dự toán |
| --- | --- |
| Hosting web | Gói Vercel + usage vượt mức theo điều kiện hiện hành |
| VPS compute/RAM | Giá gói và thời gian được cấp máy; shared/dedicated vCPU khác nhau |
| SSD/volume bổ sung | GB được cấp và thời gian sử dụng |
| Backup/snapshot | Dung lượng/chính sách retention hoặc gói backup |
| Traffic/IP | Phần bao gồm trong gói, outbound vượt mức và IP tính riêng nếu có |
| Domain | Phí đăng ký/gia hạn theo năm |
| Managed services tùy chọn | App DB/Redis/logging riêng nếu không tự host |
| Vận hành | Theo dõi, cập nhật, backup/restore, xử lý lỗi và thời gian kỹ thuật |

Không chốt giá tuyệt đối trước khi chọn provider, region, loại CPU, disk, thuế và gói web. Dùng bảng giá chính thức lúc mua: [DigitalOcean Droplet pricing](https://docs.digitalocean.com/products/droplets/details/pricing/), [Hetzner Cloud billing FAQ](https://docs.hetzner.com/cloud/billing/faq/).

Với các nhà cung cấp này, máy vẫn được tính phí khi power off nếu resource còn được giữ. Dừng query/hủy container chỉ giải phóng slot trong VPS, **không giảm khoản thuê máy cố định**. Muốn dừng compute billing cần làm theo thao tác xóa/deallocate của provider; volume/snapshot/IP có thể còn phát sinh phí riêng. Kiểm tra tài nguyên liên quan trước khi kết thúc pilot. [DigitalOcean pricing](https://docs.digitalocean.com/products/droplets/details/pricing/), [Hetzner billing](https://docs.hetzner.com/cloud/billing/faq/).

### Mẫu bảng ngân sách để điền trước khi mua

| Khoản | Gói/region | Giá theo báo giá | Giới hạn/usage dự kiến |
| --- | --- | --- | --- |
| Vercel | … | … | Commercial eligibility, traffic, functions |
| VPS | … | … | vCPU, RAM, SSD, traffic |
| Extra volume/backup | … | … | GB và retention |
| Domain | … | … | Giá gia hạn/năm |
| Dự phòng usage | … | … | Ngưỡng cảnh báo chi tiêu |

```text
Chi phí tháng = hosting web + compute + volume + backup
             + traffic/IP phát sinh + domain quy đổi theo tháng
             + dịch vụ managed được chọn

Chi phí hạ tầng bình quân mỗi session hoàn thành
  = tổng chi phí hạ tầng tháng / số session hoàn thành tháng
```

Chi phí bình quân cần tính cả thời gian chờ provision, warm-up, máy rảnh nhưng vẫn thuê và session bỏ dở. Nếu autoscale về sau, chỉ việc tạo/hủy máy thuê thực sự mới thay đổi compute bill theo cơ chế provider; hủy container trong máy cố định không tương đương autoscale hạ tầng.

## 5. Triển khai theo từng bước

1. **Publish beta browser:** kiểm tra Vercel production và trải nghiệm 14 bài hiện có.
2. **Xây server prototype local:** auth tối thiểu, App DB, queue, runner, provisioner, dataset template và một lab server. Viết config deploy/Compose lúc này.
3. **Đo resource:** bootstrap, RAM/disk peak, timeout/cancel, workload và cleanup; chọn quota/slot.
4. **Thuê VPS pilot:** chọn region/gói từ số đo, thiết lập budget alert, firewall, TLS, backup App DB và secrets ngoài source.
5. **Deploy backend:** health checks, migrations, templates, gateway/runner/queue; cấu hình URL/token server cho web. Tên env cụ thể sẽ do implementation quyết định.
6. **Kiểm tra end-to-end:** tạo session, chạy/chấm, benchmark, reset, ownership, timeout, TTL và crash cleanup; thử restore backup.
7. **Mời nhóm nhỏ:** một benchmark nặng/host lúc đầu; theo dõi queue, lỗi, latency, resource và bill trước khi tăng concurrency.

App DB cần backup vì giữ dữ liệu lâu dài. Lab session tạm không cần backup từng bản nếu có thể dựng lại; template cần script/manifest để tái tạo. Không để toàn bộ bản backup duy nhất trên cùng đĩa với App DB.

## Điều gì còn thiếu trước khi mở bán?

Đăng nhập, server-side entitlement, thanh toán/webhook idempotent, quota trả phí, chính sách retention và quy trình vận hành chưa có. Hosting beta và thuê VPS không tự biến các mục này thành tính năng. Danh sách hiện trạng tại [Chức năng hiện có](current-features.md), stack dự kiến tại [Công nghệ sử dụng](technology-stack.md).

## 6. Khi database do người học cung cấp

Đây là hướng thiết kế mới, ưu tiên PostgreSQL trước. Người học cài connector và dataset vào máy/server họ quản lý; SQL và index dùng tài nguyên của họ. DataLab host UI, catalog nội dung/dataset, API ghép nối/job relay và App DB nếu có account. Chưa có các service mới trong repo.

| Khoản | Ai cung cấp/chịu tài nguyên? | Cần đo gì? |
| --- | --- | --- |
| Dataset và PostgreSQL native | Người học | Dung lượng sau import, index/temp peak, RAM/CPU, thời gian seed và query |
| Hosting và API relay | DataLab | Request/job đồng thời, payload, thời gian giữ kết quả và throughput relay |
| File dataset/generator | DataLab phân phối; người học tải/chạy | Traffic tải xuống, cache/CDN, kích thước file, thời gian tạo dữ liệu local |
| Tiến độ/account | DataLab nếu xây sync | App DB, backup và migrations; hiện progress vẫn localStorage |
| Connector | Chạy trên máy người học; DataLab phát triển/hỗ trợ | Đóng gói, cập nhật, ghép nối, lỗi kết nối và khả năng hủy/phục hồi job |

Không cần queue chờ slot PostgreSQL do DataLab cấp cho chế độ này. Vẫn cần backpressure cho API relay và điều phối tuần tự thao tác trên một schema lab; máy người học vẫn có giới hạn tài nguyên. Chi phí compute/storage chuyển sang người học, còn chi phí phân phối, API và hỗ trợ cài đặt vẫn thuộc sản phẩm.

Để giảm thời gian chờ, cài dataset một lần, giữ dữ liệu sau khi đóng web và reset đúng phần trạng thái bài cần khôi phục. Dùng profile đã đo; không bắt mọi máy tải/dựng một tỷ dòng. Đo onboarding, import, lần chạy đầu và mức người học hiểu biểu đồ trước khi tăng profile.
