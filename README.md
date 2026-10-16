# 🚀 QueryLab

> **Môi trường học SQL và tối ưu hóa PostgreSQL thực chiến — chạy trực tiếp trên trình duyệt hoặc máy local của bạn.**  
> *Hands-on SQL and PostgreSQL optimization directly in your browser or on your local machine.*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PGlite%20%26%20Native-336791?logo=postgresql)](https://github.com/electric-sql/pglite)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Mục Lục

- [Giới Thiệu](#-giới-thiệu)
- [Các Phân Hệ Chính (Core Modules)](#-các-phân-hệ-chính-core-modules)
  - [1. Optimization Workspace (`/workspace`)](#1-optimization-workspace-workspace)
  - [2. Kết Nối Database An Toàn (`/connections`)](#2-kết-nối-database-an-toàn-connections)
  - [3. Sổ Tay Học SQL 21 Bài Học (`/paths`)](#3-sổ-tay-học-sql-21-bài-học-paths)
  - [4. SQL Sandbox & 16 Đề Bài Thực Hành Có Chấm Điểm (`/playground`)](#4-sql-sandbox--16-đề-bài-thực-hành-có-chấm-điểm-playground)
  - [5. Luyện Phỏng Vấn Data & SQL Chuyên Sâu (`/interview`)](#5-luyện-phỏng-vấn-data--sql-chuyên-sâu-interview)
- [Kiến Trúc & Bảo Mật Local-First](#-kiến-trúc--bảo-mật-local-first)
- [Cài Đặt & Chạy Ứng Dụng (Quick Start)](#-cài-đặt--chạy-ứng-dụng-quick-start)
- [Kiểm Thử & Đảm Bảo Chất Lượng](#-kiểm-thử--đảm-bảo-chất-lượng)
- [Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
- [Giấy Phép](#-giấy-phép)

---

## 🌟 Giới Thiệu

**QueryLab** là nền tảng thực hành SQL và kỹ thuật tối ưu hóa cơ sở dữ liệu chuyên sâu dành cho **Software Engineers, Data Analysts, Data Engineers và DBAs**.

Khác với các nền tảng học vẹt chỉ kiểm tra cú pháp giả lập trên trình duyệt, QueryLab mang lại trải nghiệm kỹ thuật thực thụ:
- **Chạy engine PostgreSQL thật**: Sử dụng **PGlite (PostgreSQL WASM)** chạy ngay trong Web Worker của trình duyệt, hoặc **kết nối trực tiếp tới PostgreSQL chạy trên máy local** của bạn.
- **Đo lường bằng chứng kỹ thuật thực tế**: Phân tích kế hoạch thực thi `EXPLAIN (ANALYZE, BUFFERS)` với các chỉ số thật (Execution Time, Shared Buffers, Heap Visits).
- **Triết lý Local-First**: Dữ liệu và truy vấn không bao giờ rời khỏi máy tính cá nhân.
- **Hỗ trợ Song ngữ & Đa giao diện**: Hỗ trợ đầy đủ tiếng Việt và tiếng Anh, chuyển đổi linh hoạt Dark / Light appearance.

---

## 🎯 Các Phân Hệ Chính (Core Modules)

| Phân hệ / URL | Chức năng chính | Trạng thái kỹ thuật |
| --- | --- | --- |
| **`/` (Landing Page)** | Giới thiệu sản phẩm, so sánh Before/After 60fps Sequential Scan vs Index Scan, quy trình 3 bước tương tác với nút copy SQL một chạm. | Hoàn thiện, Responsive |
| **`/workspace` (Optimization Workspace)** | Đo lường `EXPLAIN (ANALYZE, BUFFERS)` thật, thử nghiệm dựng B-Tree Index và Range Partitioning có xác nhận và rollback. | Hỗ trợ PGlite & Local Native |
| **`/connections` (Connect Database)** | Ghép nối an toàn tới PostgreSQL local (`127.0.0.1`), đọc schema, danh sách bảng, cột, kiểu dữ liệu, ước tính số dòng và kích thước đĩa (zero seeding / zero migration). | Hoàn thiện, Bảo mật loopback |
| **`/paths` (Learn SQL Handbook)** | Sổ tay 21 bài học SQL từ Cơ bản đến Nâng cao (Basic, Intermediate, Advanced) với giao diện accordion thu gọn, giải thích cú pháp, ví dụ mẫu kiểm chứng 100% trên PostgreSQL và banner chuyển tiếp sang Sandbox. | Hoàn thiện, Song ngữ |
| **`/playground` (SQL Sandbox)** | 16 bài tập SQL theo tình huống kinh doanh thực tế, custom UI dropdown chọn bài với icon `SquareTerminal` đồng bộ sidebar, hệ thống **Chấm bài tự động** đối chiếu kết quả với PostgreSQL chuẩn. | Hoàn thiện, 16 bài tập + Free mode |
| **`/interview` (Interview Prep)** | Trung tâm luyện phỏng vấn kỹ thuật phân luồng theo 4 vai trò (BE, DA, DE, DBA) và 3 cấp độ (Junior, Middle, Senior) với 12+ Case Study xử lý sự cố thực tế và 20+ câu hỏi lý thuyết kiến trúc chuyên sâu. | Hoàn thiện, Phân quyền trực quan |

### 1. Optimization Workspace (`/workspace`)
Môi trường thực nghiệm tối ưu truy vấn đối chiếu Before vs After:
- **Đo Baseline**: Chạy `EXPLAIN ANALYZE` dưới transaction `READ ONLY` với timeout an toàn (4.5 giây).
- **Thử nghiệm B-Tree Index**: Trình tạo chỉ mục hỗ trợ từ 1–4 cột có thứ tự, kiểm tra lock timeout, tự động dọn dẹp chỉ mục sau thử nghiệm.
- **Thử nghiệm Range Partitioning**: Thử nghiệm phân vùng theo tháng (1–24 partitions) trên một bản sao độc lập, không làm ảnh hưởng bảng gốc.
- **Biểu đồ so sánh trực quan**: Đối chiếu thời gian thực thi, số trang buffer được đọc và số lần truy cập heap.

### 2. Kết Nối Database An Toàn (`/connections`)
Ghép nối ứng dụng trực tiếp với cơ sở dữ liệu PostgreSQL đang chạy trên máy local:
- **Không seeding, không migration**: Chỉ đọc metadata (schemas, tables, columns, data types, estimated rows và dung lượng đĩa).
- **Bảo mật tuyệt đối**: Chỉ lắng nghe trên giao diện loopback `127.0.0.1`, phòng chống CSRF và DNS Rebinding; mật khẩu chỉ lưu trong bộ nhớ RAM phiên làm việc.

### 3. Sổ Tay Học SQL 21 Bài Học (`/paths`)
Giáo trình SQL toàn diện từ cơ bản đến nâng cao:
- **3 Cấp độ rõ ràng**: Cơ bản (8 bài), Trung cấp (4 bài), Nâng cao (4 bài) cùng các bài học bổ trợ.
- **Giao diện Accordion linh hoạt**: Cho phép thu gọn / mở rộng từng nhóm kiến thức, kèm công cụ tìm kiếm bài học nhanh.
- **Nội dung đa tầng**: Mỗi bài học gồm định nghĩa, trường hợp sử dụng thực tế, bóc tách chi tiết từng thành phần cú pháp, ví dụ mẫu kiểm chứng 100% trên PostgreSQL và phân tích các lỗi sai phổ biến.
- **Cầu nối Sandbox**: Tích hợp nút làm bài tập trực tiếp sang môi trường SQL Sandbox cho đúng bài học tương ứng.

### 4. SQL Sandbox & 16 Đề Bài Thực Hành Có Chấm Điểm (`/playground`)
Phòng thực hành SQL tự do và luyện tập đề bài:
- **16 Đề bài bám sát tình huống kinh doanh (Business Scenarios)**:
  - *Cơ bản*: SELECT & ALIAS, WHERE & Toán tử, Xử lý NULL, ORDER BY & LIMIT, GROUP BY & Hàm tổng hợp, HAVING, INNER JOIN, LEFT JOIN.
  - *Trung cấp*: CASE WHEN phân loại, SUBQUERY tương quan, CTE (WITH), Phân tích doanh thu đa bảng (Multi-Table JOIN).
  - *Nâng cao*: Window Function ROW_NUMBER, Window Running Total (Doanh thu lũy kế), Keyset Pagination $O(1)$, B-Tree Index & Phân tích EXPLAIN.
- **Custom UI Dropdown**: Dropdown chọn đề bài tùy biến hiện đại, đồng bộ icon **`SquareTerminal`** từ thanh điều hướng bên trái, không dùng emoji thô sơ.
- **Hệ thống Chấm bài tự động**: Nút **"Chấm bài"** đối chiếu kết quả của học viên với câu lệnh chuẩn `referenceSql` trên engine PostgreSQL thật (kiểm tra số dòng, cấu trúc cột và giá trị dữ liệu).
- **Gợi ý & Lời giải mẫu**: Mở dần các tầng gợi ý (Hints) và xem giải thích chi tiết lời giải.

### 5. Luyện Phỏng Vấn Data & SQL Chuyên Sâu (`/interview`)
Trung tâm chuẩn bị phỏng vấn kỹ thuật thực chiến:
- **Chọn vai trò & cấp bậc**:
  - *4 Vai trò*: Backend Engineer (BE), Data Analyst (DA), Data Engineer (DE), Database Administrator (DBA).
  - *3 Cấp bậc*: Junior, Middle, Senior.
- **12+ Case Study xử lý sự cố sản xuất**:
  - *BE*: Flash sale 100k QPS chống bán vượt tồn kho, Zero-downtime migration bảng 100M dòng, Deadlock giao dịch tài chính, Keyset pagination.
  - *DA*: Phân tích Cohort 30-Day Retention, Phễu chuyển đổi E-commerce, Xử lý sự kiện gửi trễ (Late-Arriving Events).
  - *DE*: Nạp mẻ 200GB ban đêm bị nghẽn WAL, Đường truyền CDC thời gian thực (Kafka -> DWH), Upsert khử trùng lặp 20M dòng/ngày.
  - *DBA*: Xử lý khẩn cấp CPU 100% và cạn kiệt Connection Pool, Table Bloat & Autovacuum Tuning, Replication Lag trên Read Replica.
- **20+ Câu hỏi lý thuyết & kiến trúc**: Đào sâu bản chất MVCC, ACID, 4 Isolation Levels, B+Tree vs Columnar, Overhead của Connection Pool.
- **Góc nhìn nhà tuyển dụng (Interviewer Tip)**: Cung cấp tiêu chí đánh giá và định hướng trả lời đạt điểm tối đa.

---

## 🔒 Kiến Trúc & Bảo Mật Local-First

```text
┌─────────────────────────────────────────────────────────────────┐
│                      Trình duyệt của bạn                        │
│                                                                 │
│  ┌──────────────────────┐         ┌──────────────────────────┐  │
│  │   Next.js 16 UI      │         │   PGlite WASM Engine     │  │
│  │ (Workspace/Handbook/ │◄───────►│  (In-browser PostgreSQL  │  │
│  │  Sandbox/Interview)  │         │   Commerce Dataset RAM)  │  │
│  └──────────┬───────────┘         └──────────────────────────┘  │
└─────────────┼───────────────────────────────────────────────────┘
              │ Loopback HTTP (127.0.0.1:3000)
              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Local Relay API (Next.js Server)                   │
│  - Chặn CSRF & DNS Rebinding (Strict Same-Origin)               │
│  - Mật khẩu chỉ lưu trong RAM phiên làm việc                    │
│  - Read-only Transaction Guard & Timeouts                       │
└─────────────┬───────────────────────────────────────────────────┘
              │ Local TCP Connection
              ▼
┌─────────────────────────────────────────────────────────────────┐
│             PostgreSQL Database trên máy cá nhân                │
│  - Khám phá Schema / Tables không xâm phạm                      │
│  - B-Tree Index / Range Partitioning có xác nhận & Rollback    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 Cài Đặt & Chạy Ứng Dụng (Quick Start)

### Yêu Cầu Tiên Quyết
- **Node.js**: Phiên bản `20.x`, `22.x` hoặc `24.x`.
- **npm**: Phiên bản `10.x` trở lên.

### Các Bước Khởi Chạy

```bash
# 1. Cài đặt các thư viện phụ thuộc
npm ci

# 2. Khởi chạy server phát triển (bind an toàn tới 127.0.0.1:3000)
npm run dev

# 3. Mở trình duyệt và trải nghiệm
# http://localhost:3000
```

### Build Sản Phẩm (Production)

```bash
npm run build
npm start
```

---

## 🧪 Kiểm Thử & Đảm Bảo Chất Lượng

Dự án bao gồm bộ kiểm thử tự động toàn diện, chạy trực tiếp trên engine PostgreSQL thật (45/45 suites passed):

```bash
# 1. Kiểm tra Type Safety với TypeScript (0 errors)
npm run typecheck

# 2. Chạy toàn bộ Test Suites tự động
npm test

# 3. Kiểm thử riêng lẻ các module trọng tâm
node --import tsx --test tests/sql-sandbox-challenges.test.ts tests/sql-handbook.test.ts tests/interview.test.ts tests/core.test.ts
```

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
.
├── app/                             # Next.js App Router (40 routes)
│   ├── page.tsx                     # Landing page với animation Before/After & 3 bước
│   ├── workspace/page.tsx           # Trang tối ưu hóa PostgreSQL
│   ├── connections/page.tsx         # Quản lý kết nối Database local
│   ├── paths/page.tsx               # Sổ tay 21 bài học SQL
│   ├── playground/page.tsx          # SQL Sandbox & 16 bài tập có chấm điểm
│   ├── interview/page.tsx           # Trung tâm luyện phỏng vấn kỹ thuật
│   ├── globals.css                  # Hệ thống biến giao diện Dark/Light
│   └── workspace.css                # Styles cho Workspace, Sandbox & Custom Dropdown
├── components/                      # Các UI components tái sử dụng
│   ├── lab-workspace.tsx            # Không gian làm việc SQL Sandbox & Custom Dropdown
│   ├── optimization-workspace.tsx   # Không gian phân tích EXPLAIN & Index Builder
│   ├── sql-handbook.tsx             # Component sổ tay lý thuyết có Accordion
│   ├── interview.tsx                # Component luyện phỏng vấn phân quyền theo Role
│   ├── landing-comparison.tsx       # Hiệu ứng so sánh 60fps Before/After
│   ├── landing-steps-section.tsx    # Hiệu ứng bung dãn 2 bên khi cuộn
│   └── shell.tsx                    # Khung điều hướng Sidebar & Header
├── content/                         # Dữ liệu nội dung song ngữ
│   ├── sql-sandbox-challenges.ts    # 16 đề bài thực hành kèm test cases & solution
│   ├── sql-handbook.ts              # 21 bài học SQL lý thuyết chi tiết
│   └── interview-data.ts            # 12+ Case study & 20+ Câu hỏi phỏng vấn
├── lib/                             # Core logic, PGlite WASM engine, i18n & connectors
├── tests/                           # Bộ test suites tự động
├── docs/                            # Tài liệu kiến trúc và hướng dẫn vận hành
└── package.json                     # Cấu hình scripts & dependencies
```

---

## 📄 Giấy Phép

Dự án được phân phối dưới giấy phép [MIT License](LICENSE).
