# ROLE

Bạn là một Senior Full-Stack Engineer + Product Engineer + UX Designer + EdTech Product Strategist.

Hãy xây dựng một sản phẩm SaaS học Data/SQL có tên tạm thời là **DataLab**.

Mục tiêu không phải tạo một website khóa học SQL thông thường.

Sản phẩm phải tập trung vào:

> **Learn Data by Doing — Run SQL, break databases, see performance, understand why.**

Người học không chỉ đọc lý thuyết mà phải trực tiếp chạy query, tạo index, xem execution plan, quan sát performance thay đổi và giải quyết các tình huống giống thực tế.

Sản phẩm hướng tới:

* Sinh viên IT/Data
* Người mới chuyển sang Data
* Junior Data Analyst
* Junior Data Engineer
* Backend Developer muốn hiểu database
* Người ôn phỏng vấn SQL/Data Engineer
* Người đang học Database / DWH / Big Data

---

# 1. PRODUCT VISION

Không xây:

> “Một website có 500 bài SQL.”

Mà xây:

> **Interactive Data Engineering Laboratory**

Người học phải có cảm giác:

> “Mình đang thao tác trên một database thật.”

Ví dụ:

Người học được đưa một database:

* customers: 1,000,000 rows
* orders: 10,000,000 rows
* order_items: 30,000,000 rows
* products: 100,000 rows

Sau đó được yêu cầu:

> “Query này đang chạy 4.8 giây. Hãy làm nó nhanh hơn.”

Người học tự:

```sql
CREATE INDEX ...
```

chạy lại query và thấy:

```text
Before:
4.82s
10,000,000 rows scanned

After:
0.008s
127 rows scanned
```

Sau đó hệ thống giải thích bằng visualization tại sao điều đó xảy ra.

---

# 2. CORE DIFFERENTIATOR

Đối thủ có thể dạy SQL syntax.

DataLab phải dạy:

> **WHY**

Ví dụ không chỉ hỏi:

```sql
SELECT ...
```

mà phải cho người học thấy:

* Full table scan
* Index scan
* Index seek
* B-tree
* Composite index
* Query planner
* Rows scanned
* Rows returned
* Disk I/O
* Execution time
* Query cost

Mỗi bài học nên có flow:

```text
Concept
↓
Experiment
↓
Run
↓
Observe
↓
Explain
↓
Challenge
↓
Real-world scenario
```

---

# 3. MVP SCOPE

Không xây toàn bộ Data Engineering ngay từ đầu.

MVP chỉ tập trung:

## SQL + Database Performance

Các module đầu tiên:

### Module 01 — SQL Fundamentals

* SELECT
* WHERE
* ORDER BY
* GROUP BY
* HAVING
* CASE
* JOIN
* UNION
* Subquery
* CTE
* Window Functions

### Module 02 — Database Fundamentals

* Primary Key
* Foreign Key
* UNIQUE
* NULL
* Constraints
* Normalization
* Relationships

### Module 03 — Index

Đây là module quan trọng nhất.

* What is an index?
* Full table scan
* B-tree
* Index lookup
* Composite index
* Column order
* Selectivity
* Covering index
* Index overhead
* INSERT/UPDATE cost
* Why indexes can hurt performance

### Module 04 — Query Optimization

* EXPLAIN
* Execution Plan
* JOIN optimization
* WHERE optimization
* ORDER BY
* GROUP BY
* Pagination
* SARGable queries
* Function on indexed column
* LIKE
* `%keyword%`

### Module 05 — Real-world Debugging

Ví dụ:

> Production database suddenly becomes slow.

Người học được cung cấp:

```text
CPU: 92%
Disk I/O: 87%
Average query latency: 4.8s
Connections: 180
```

Có nhiều query.

Người học phải tìm:

> Query nào gây bottleneck?

và sửa nó.

---

# 4. DATABASE ENGINE

MVP ưu tiên:

## PostgreSQL

Nếu browser execution khả thi thì ưu tiên:

* PGlite
* hoặc PostgreSQL WASM-compatible solution

Nếu một số feature không phù hợp với browser thì thiết kế abstraction layer để sau này chuyển sang backend PostgreSQL.

Không khóa toàn bộ architecture vào SQLite nếu mục tiêu dài hạn là Data Engineering.

Có thể dùng:

* PostgreSQL cho server-side execution
* DuckDB-WASM cho analytical exercises
* SQLite-WASM cho lightweight exercises

Nhưng MVP phải đơn giản.

Ưu tiên:

> **Chạy được SQL thật trước.**

---

# 5. LARGE DATA STRATEGY

Không tạo database 1 tỷ rows thật trên server.

Thiết kế 3 chế độ.

## Mode A — Real Dataset

Ví dụ:

```text
10,000 rows
100,000 rows
500,000 rows
1,000,000 rows
```

Dữ liệu có thể generate deterministic.

Không cần lưu toàn bộ dataset cho từng user.

Chỉ lưu:

```text
dataset configuration
seed
row count
schema
```

Dataset có thể regenerate.

---

## Mode B — Browser Dataset

Nếu browser engine đủ mạnh:

```text
10K
100K
500K
1M
```

chạy trực tiếp trên máy người học.

Mục tiêu giảm server cost.

---

## Mode C — Scale Simulation

Cho phép slider:

```text
10K ─────────────── 1B
```

Nhưng từ một ngưỡng nhất định trở lên không chạy thật.

Hiển thị:

> Simulation — estimated execution

Ví dụ:

```text
Dataset: 1,000,000,000 rows

Without index
Estimated scan:
~6m 42s

With index
Estimated lookup:
~12ms
```

Phải phân biệt rõ:

```text
REAL EXECUTION
```

và

```text
SIMULATION
```

Không được đánh lừa người dùng rằng query thực sự chạy trên 1 tỷ rows.

---

# 6. INTERACTIVE SQL EDITOR

Trang lab phải có:

```text
┌─────────────────────────────────────────────┐
│ Challenge                                   │
│ Make this query faster                      │
├─────────────────────────────────────────────┤
│                                             │
│ SQL Editor                                  │
│                                             │
│ SELECT *                                    │
│ FROM orders                                 │
│ WHERE customer_id = 12345;                 │
│                                             │
│                  [ Run Query ]              │
├─────────────────────────────────────────────┤
│ Result                                      │
│                                             │
│ 127 rows                                    │
│                                             │
├─────────────────────────────────────────────┤
│ Performance                                 │
│                                             │
│ 4.82s                                       │
│ 10,000,000 rows scanned                     │
└─────────────────────────────────────────────┘
```

Có các tab:

* Result
* Execution Plan
* Performance
* Explanation

---

# 7. INDEX VISUALIZATION

Đây là feature signature.

Khi user tạo index:

```sql
CREATE INDEX idx_orders_customer
ON orders(customer_id);
```

visualization phải thay đổi.

Before:

```text
TABLE SCAN

orders
│
├── row
├── row
├── row
├── row
├── ...
└── 10,000,000 rows
```

After:

```text
B-TREE INDEX

             root
           /      \
         /          \
      node          node
       │
       ↓
 customer_id=12345
       │
       ↓
    127 rows
```

Animation nhẹ, không cần 3D.

Có metrics:

```text
Rows scanned
Execution time
Estimated cost
Disk pages
```

---

# 8. QUERY EXPLANATION

Sau khi user chạy query, hệ thống phải giải thích.

Ví dụ:

```text
Your query is slow because:

1. PostgreSQL performs a sequential scan.
2. The table contains 10M rows.
3. Your filter returns only 127 rows.
4. An index on customer_id can reduce the amount of data scanned.
```

Không dùng AI cho toàn bộ explanation ở MVP.

Ưu tiên rule-based explanations để:

* giảm API cost
* deterministic
* không hallucinate
* dễ kiểm soát nội dung

AI có thể được thêm ở phase sau.

---

# 9. CHALLENGE SYSTEM

Mỗi lab có:

```text
Title
Difficulty
Concept
Dataset
Initial state
Task
Expected behavior
Validation
Hints
Solution
Explanation
```

Ví dụ:

```text
ID: IDX-001

Title:
Your First Index

Difficulty:
Beginner

Task:
Make the query faster.

Initial query:
SELECT *
FROM orders
WHERE customer_id = 12345;

Goal:
Reduce execution time by at least 80%.
```

Validation không nên chỉ check exact SQL.

Ví dụ:

User có thể dùng:

```sql
CREATE INDEX ...
```

với nhiều cách khác nhau.

Validator nên kiểm tra:

* Query result đúng
* Index tồn tại
* Performance threshold
* Expected execution behavior

---

# 10. HINT SYSTEM

Không hiển thị đáp án ngay.

Có:

```text
💡 Hint 1
Look at the WHERE clause.

💡 Hint 2
How does the database find customer_id?

💡 Hint 3
Think about indexes.

🔓 Show solution
```

Có thể giới hạn XP nếu xem solution.

---

# 11. GAMIFICATION

Không biến thành game trẻ con.

Chỉ dùng nhẹ:

```text
XP
Level
Progress
Streak
Achievements
```

Ví dụ:

```text
SQL Beginner
████████░░ 80%

12 / 15 labs completed
```

Achievements:

* First Query
* First JOIN
* First Index
* Query Optimizer
* EXPLAIN Master
* Database Debugger

---

# 12. LEARNING PATH

Dashboard:

```text
SQL Fundamentals
████████████ 100%

Database Fundamentals
████████░░░░ 65%

Index & Performance
████░░░░░░░░ 30%

Query Optimization
░░░░░░░░░░░░ 0%

Real-world Debugging
🔒 PRO
```

User phải nhìn thấy:

> “Tôi đang tiến bộ.”

---

# 13. INTERVIEW MODE

Một module kiếm tiền quan trọng.

Cho user chọn:

```text
SQL Interview
Data Analyst
Data Engineer
Backend
Database
```

Sau đó hệ thống random challenge.

Ví dụ:

```text
Time: 08:42

Find the second highest salary.

Difficulty:
Medium
```

Có:

* timer
* score
* test cases
* hidden test cases
* explanation sau khi submit

---

# 14. REAL-WORLD INCIDENT MODE

Đây là premium feature.

Ví dụ:

## Incident #001

> Orders API is slow.

Metrics:

```text
p95 latency: 4.7s
CPU: 91%
DB connections: 187
```

User có:

* query logs
* execution plans
* table schema
* indexes
* metrics

Task:

> Find the bottleneck and fix it.

Đây phải là feature khiến người học cảm thấy:

> “Mình đang debug production.”

---

# 15. CONTENT ARCHITECTURE

Content phải tách khỏi UI code.

Không hard-code lesson trong React component.

Ví dụ:

```text
/content
  /sql
    select.yaml
    joins.yaml
    group-by.yaml

  /database
    primary-key.yaml
    normalization.yaml

  /index
    first-index.yaml
    composite-index.yaml
    covering-index.yaml

  /performance
    explain.yaml
    pagination.yaml
```

Mỗi lesson có schema rõ ràng.

Ví dụ:

```yaml
id: index-001
title: Your First Index
difficulty: beginner
category: index

objective:
  - Understand full table scan
  - Understand basic B-tree index

dataset:
  name: ecommerce
  rows: 1000000

challenge:
  type: optimize-query

validation:
  min_speedup: 5

hints:
  - ...
  - ...

solution:
  sql: ...
  explanation: ...
```

Mục tiêu:

> Có thể thêm 1000 bài mà không cần sửa core application.

---

# 16. USER SYSTEM

MVP có thể cho người dùng sử dụng không cần account.

Anonymous:

* free labs
* local progress

Account:

* save progress
* leaderboard
* bookmarks
* history
* achievements

Sau này:

* subscription
* payment
* certificates

---

# 17. MONETIZATION

Không ép mua ngay.

## FREE

Cho người dùng trải nghiệm giá trị.

Ví dụ:

* 10 SQL labs
* 2 index labs
* basic playground
* basic interview questions

## PRO

Giá dự kiến:

```text
Monthly:
99k–149k VND

Yearly:
~799k–999k VND

Lifetime:
499k–999k VND
```

Giá chỉ là initial hypothesis, cần test thị trường.

PRO mở:

* toàn bộ labs
* performance labs
* incident simulations
* interview mode
* advanced database labs
* progress analytics
* certificates
* future modules

---

# 18. SEASONAL / CAMPAIGN MARKETING

Sản phẩm phải có khả năng chạy campaign.

Không chỉ bán subscription.

Tạo các campaign:

## “30 Days SQL Challenge”

Landing page:

```text
30 DAYS
TO BECOME
SQL READY

Day 01
SELECT

Day 02
WHERE

...

Day 30
QUERY OPTIMIZATION
```

Có:

* daily challenge
* streak
* leaderboard
* completion badge

Campaign có thể chạy miễn phí để kéo users.

Sau campaign:

> Unlock DataLab Pro

---

## “SQL Interview Bootcamp”

Campaign 14 ngày.

Target:

* sinh viên năm cuối
* người tìm việc
* người chuyển ngành

CTA:

> Prepare for your next Data Interview.

---

## “Data Engineer Challenge”

7 ngày:

```text
Day 1 SQL
Day 2 Index
Day 3 EXPLAIN
Day 4 ETL
Day 5 Data Modeling
Day 6 Performance
Day 7 Production Incident
```

---

# 19. REFERRAL SYSTEM

Cho phép:

> Invite 3 friends → unlock 7 days Pro.

Hoặc:

> Share challenge → receive bonus labs.

Mục tiêu tạo organic growth.

---

# 20. SEO STRATEGY

Mỗi lesson phải có SEO-friendly public page.

Ví dụ:

```text
/data/sql/index
/data/sql/composite-index
/data/sql/explain
/data/sql/window-function
```

Public page có:

* concept explanation
* example
* interactive demo
* CTA:

> Try this concept in DataLab.

Blog/content:

```text
Why SQL indexes make queries faster
What is a B-tree index?
SQL JOIN explained
EXPLAIN ANALYZE tutorial
Why LIKE '%keyword%' is slow
```

Không chỉ phụ thuộc quảng cáo.

---

# 21. PRODUCT ANALYTICS

Track:

```text
lesson_started
lesson_completed
query_executed
hint_opened
solution_opened
lab_failed
lab_completed
interview_started
interview_completed
pricing_viewed
checkout_started
subscription_started
```

Quan trọng nhất:

```text
Free → Pro conversion
```

và:

```text
Which lab creates the most engagement?
```

Không thu thập dữ liệu không cần thiết.

---

# 22. PAYMENT

Thiết kế payment abstraction.

Có thể tích hợp:

* PayOS cho Việt Nam
* Stripe cho international users

Không hard-code payment provider vào business logic.

Subscription state:

```text
FREE
TRIAL
PRO
EXPIRED
LIFETIME
```

---

# 23. TECH STACK

Ưu tiên stack đơn giản:

Frontend:

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* Monaco Editor hoặc CodeMirror

Backend:

* Next.js API routes hoặc NestJS nếu cần
* PostgreSQL

Auth:

* Supabase Auth hoặc Auth.js

Database:

* PostgreSQL
* PGlite / DuckDB-WASM nếu phù hợp cho browser execution

Storage:

* Object storage nếu cần datasets/assets

Deployment:

* Vercel

Không tạo microservices ở MVP.

---

# 24. UI/UX DIRECTION

Không làm UI kiểu:

> “Udemy clone.”

Không dùng quá nhiều card.

Phong cách:

**Developer tool + learning platform.**

Tham khảo cảm giác:

* VS Code
* Linear
* Vercel
* GitHub
* modern developer documentation

Màu sắc sạch.

Typography mạnh.

Code editor là trung tâm.

Dark mode phải đẹp.

Desktop-first nhưng responsive.

---

# 25. LANDING PAGE

Hero:

> **Stop memorizing SQL. Start understanding data.**

Subtitle:

> Interactive labs where you run queries, break databases, optimize performance, and learn how data systems actually work.

CTA:

```text
Start Learning Free
```

Secondary:

```text
Try an Index Lab →
```

Hero demo phải cho người dùng thấy:

```text
Query: 4.82s

        ↓ Add Index

Query: 0.008s
```

Ngay trên landing page.

Không cần login để thử.

---

# 26. PRICING PAGE

Có 3 tiers:

### Free

$0

* Basic SQL
* Limited labs
* Playground
* Basic progress

### Pro

~99k–149k/month

* All labs
* Performance labs
* Incident mode
* Interview mode
* Advanced analytics
* Certificates

### Lifetime

~499k–999k one-time

* All current content
* Future content policy clearly defined
* No recurring payment

Không fake discount.

Nếu chạy campaign thì discount phải có thời gian thực.

---

# 27. TRUST

Không tuyên bố:

> “Become Data Engineer in 30 days.”

Không hứa:

> “Get a $100K job.”

Marketing phải dựa trên learning outcomes.

Ví dụ:

> Understand why indexes work.

> Read an execution plan.

> Optimize a slow query.

> Practice production-like database problems.

---

# 28. ADMIN CMS

Cần một admin interface đơn giản để:

* create lesson
* edit lesson
* publish/unpublish
* create challenge
* create campaign
* view users
* view conversion
* view popular labs

Không cần CMS phức tạp.

Content nên versioned.

---

# 29. COST CONTROL

Cực kỳ quan trọng.

Mục tiêu:

> Một free user không được tạo chi phí server lớn.

Ưu tiên:

1. Browser execution
2. Static content
3. Cached datasets
4. Deterministic data generation
5. Rule-based validation
6. Không dùng AI cho mọi query
7. Rate limit server execution
8. Giới hạn dataset free user
9. Simulation cho scale lớn

AI chỉ là premium enhancement.

---

# 30. AI PHASE 2

Sau khi product có users mới thêm:

### AI SQL Tutor

User hỏi:

> Why is my query slow?

AI nhận:

* SQL
* schema
* execution plan
* metrics

và giải thích.

AI không được tự ý chạy SQL nguy hiểm trên production database.

Có sandbox.

AI cũng có thể:

> Give me a hint, but don't show the answer.

Đây là premium feature rất tốt.

---

# 31. SECURITY

Không bao giờ cho arbitrary SQL của user chạy trực tiếp trên production database.

Mỗi execution phải:

* sandbox
* timeout
* memory limit
* CPU limit
* restricted permissions
* isolated database/session

Không cho:

```sql
DROP DATABASE
```

hoặc filesystem/network access.

Nếu browser execution thì vẫn validate query.

---

# 32. MVP IMPLEMENTATION ORDER

Build theo thứ tự:

### Step 1

Landing page.

### Step 2

SQL Playground.

### Step 3

Dataset:

```text
customers
products
orders
order_items
```

### Step 4

Query execution.

### Step 5

Result table.

### Step 6

Performance metrics.

### Step 7

Index Lab.

### Step 8

B-tree visualization.

### Step 9

Challenge validator.

### Step 10

Learning progress.

### Step 11

Authentication.

### Step 12

Pricing.

### Step 13

Payment.

### Step 14

30 Days SQL Challenge.

Không build tất cả cùng lúc.

---

# 33. FIRST MVP LABS

Implement exactly these first:

## LAB 001

SELECT & WHERE

## LAB 002

GROUP BY

## LAB 003

JOIN

## LAB 004

Window Function

## LAB 005

Full Table Scan

## LAB 006

Your First Index

## LAB 007

Composite Index

## LAB 008

LIKE and Index

## LAB 009

EXPLAIN

## LAB 010

Optimize a Slow Query

## LAB 011

Pagination Performance

## LAB 012

Real-world Database Incident

---

# 34. SUCCESS METRICS

Do not judge MVP by number of features.

Measure:

```text
Landing → Try Lab
Try Lab → Complete Lab
Complete Lab → Start another Lab
Free → Signup
Signup → Return Day 2
Free → Pro
```

Most important early metric:

> **Do users voluntarily complete another lab?**

If users finish one lab and immediately start another, the core loop works.

---

# 35. VALIDATION BEFORE BUILDING EVERYTHING

After implementing first 3–5 labs:

Deploy publicly.

Find 20–50 target users.

Ask them to complete:

> “Make this query faster.”

Observe:

* Where do they get stuck?
* Do they understand the visualization?
* Do they understand the explanation?
* Do they want another lab?
* Would they pay?

Do not build 100 labs before validating this.

---

# 36. FINAL PRODUCT PRINCIPLE

Every feature must answer:

> **Does this help the learner understand something they couldn't easily understand by just reading a tutorial?**

If yes:

Build it.

If no:

Do not add it just because competitors have it.

The product's strongest differentiator should remain:

# **RUN → SEE → BREAK → FIX → UNDERSTAND**

Build the MVP around that loop first.
