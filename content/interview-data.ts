export type InterviewRole = 'backend' | 'data-analyst' | 'data-engineer' | 'dba';
export type InterviewLevel = 'junior' | 'middle' | 'senior';
export type QuestionCategory = 'foundational' | 'architecture' | 'incident';

export interface RoleMeta {
  id: InterviewRole;
  name: { en: string; vi: string };
  shortTag: string;
  tagline: { en: string; vi: string };
  description: { en: string; vi: string };
  skills: string[];
  color: string;
}

export interface LevelMeta {
  id: InterviewLevel;
  name: { en: string; vi: string };
  badge: string;
  exp: string;
  description: { en: string; vi: string };
}

export interface EnterpriseScenarioQuestion {
  id: string;
  role: InterviewRole;
  level: InterviewLevel;
  category: QuestionCategory;
  companyContext: string;
  difficulty: 'Junior' | 'Middle' | 'Senior' | 'Staff';
  title: { en: string; vi: string };
  scenarioNarrative: { en: string; vi: string };
  question: { en: string; vi: string };
  idealAnswerFramework: { en: string[]; vi: string[] };
  solutionDetail: { en: string; vi: string };
  codeSnippet?: string;
  tradeoffs: { en: string; vi: string };
  rubric: {
    greenFlags: { en: string[]; vi: string[] };
    redFlags: { en: string[]; vi: string[] };
  };
  tags: string[];
}

export const interviewRoles: RoleMeta[] = [
  {
    id: 'backend',
    name: { en: 'Backend Engineer', vi: 'Lập trình viên Backend (BE)' },
    shortTag: 'BE / Fullstack',
    tagline: {
      en: 'High-throughput APIs, Concurrency, ACID transactions & B-Tree performance.',
      vi: 'Hiệu năng truy vấn API, tranh chấp đồng thời, giao dịch ACID & tối ưu chỉ mục B-Tree.',
    },
    description: {
      en: 'Tackle high-QPS flash sales, zero-downtime schema migrations, distributed deadlocks, and deep pagination bottlenecks in high-scale microservices.',
      vi: 'Giải quyết bài toán Flash Sale 100k QPS, di chuyển cấu trúc bảng 100M dòng không gián đoạn, khử deadlock phân tán và tối ưu phân trang Keyset.',
    },
    skills: ['B-Tree Index Design', 'Atomic UPDATE & Locking', 'Keyset Pagination', 'Zero-Downtime DDL', 'Idempotency Keys'],
    color: '#72D8BE',
  },
  {
    id: 'data-analyst',
    name: { en: 'Data Analyst', vi: 'Chuyên viên Phân tích Dữ liệu (DA)' },
    shortTag: 'DA / Product BI',
    tagline: {
      en: 'Advanced SQL, Window functions, Cohort retention & Business metric translation.',
      vi: 'SQL nâng cao, Window functions, Cohort retention & chuyển hóa bài toán kinh doanh.',
    },
    description: {
      en: 'Master Month-over-Month retention matrices, rolling moving averages, e-commerce conversion funnels, payment fraud detection, and multi-tier customer rankings.',
      vi: 'Thành thạo ma trận giữ chân khách hàng (Cohort), trung bình động làm mịn doanh thu, phân tích phễu chuyển đổi, phát hiện gian lận và xếp hạng VIP.',
    },
    skills: ['Window Functions (ROWS/RANGE)', 'Cohort Retention', 'Conversion Funnels', 'Fraud Detection via LAG()', 'DENSE_RANK() vs RANK()'],
    color: '#A9B7FF',
  },
  {
    id: 'data-engineer',
    name: { en: 'Data Engineer', vi: 'Kỹ sư Dữ liệu (DE / Big Data)' },
    shortTag: 'DE / Lakehouse',
    tagline: {
      en: 'Distributed data pipelines, Data skew, FinOps cost auditing & Exactly-Once streaming.',
      vi: 'Pipeline dữ liệu phân tán, xử lý lệch dữ liệu (Data skew), kiểm toán chi phí FinOps & Streaming an toàn.',
    },
    description: {
      en: 'Solve Spark/Batch OOM data skew, build idempotent Kafka-to-Warehouse streaming with MERGE INTO, audit +300% warehouse bills, and handle schema evolution.',
      vi: 'Chẩn đoán lỗi OOM do lệch dữ liệu trên Spark, xây dựng đường truyền Kafka chống trùng lặp, kiểm toán chi phí kho dữ liệu tăng 300% và quản trị Data Contracts.',
    },
    skills: ['Data Skew & Salting', 'Exactly-Once Ingestion', 'Warehouse FinOps', 'Schema Evolution & DLQ', 'Partition Overwrite Backfill'],
    color: '#F7C875',
  },
  {
    id: 'dba',
    name: { en: 'Database Administrator / Architect', vi: 'Quản trị viên / Kiến trúc sư DB (DBA)' },
    shortTag: 'DBA / Architect',
    tagline: {
      en: 'Production incident triage, CPU 100% runbooks, MVCC bloat & High Availability.',
      vi: 'Ứng phó sự cố nóng CPU 100%, runbook pg_stat_activity, dọn dẹp bloat MVCC & High Availability.',
    },
    description: {
      en: 'Master forensic runbooks for CPU 100% and connection exhaustion, tune aggressive autovacuum, mitigate read replica lag, and prevent Transaction ID wraparound.',
      vi: 'Làm chủ quy trình xử lý khẩn cấp khi DB chạm ngưỡng max connection, tinh chỉnh autovacuum bảng nóng, khử trễ bản sao read replica và phòng ngừa dừng DB.',
    },
    skills: ['pg_stat_activity Triage', 'PgBouncer Transaction Pooling', 'MVCC & Autovacuum Tuning', 'Replica Lag & LSN Tracking', 'Safe DDL & Zero Locks'],
    color: '#F294AA',
  },
];

export const interviewLevels: LevelMeta[] = [
  {
    id: 'junior',
    name: { en: 'Junior / Fresher', vi: 'Cơ bản (Junior / Fresher)' },
    badge: 'Junior',
    exp: '0–2 yrs',
    description: {
      en: 'Focus on clear SQL semantics, understanding grain, avoiding full table scans, and identifying simple bottlenecks.',
      vi: 'Tập trung vào tư duy ngữ nghĩa SQL, xác định đúng cấp độ dữ liệu (grain), hạn chế quét toàn bảng và nhận diện điểm nghẽn cơ bản.',
    },
  },
  {
    id: 'middle',
    name: { en: 'Middle / Professional', vi: 'Trung cấp (Middle / Mid-level)' },
    badge: 'Middle',
    exp: '2–5 yrs',
    description: {
      en: 'Master composite indexes, window frame clauses, idempotent pipeline patterns, and incident mitigation under production traffic.',
      vi: 'Làm chủ chỉ mục kết hợp, khung cửa sổ window frames, mô hình pipeline có tính idempotent và xử lý sự cố trong môi trường có tải thật.',
    },
  },
  {
    id: 'senior',
    name: { en: 'Senior / Staff / Architect', vi: 'Cao cấp (Senior / Staff Architect)' },
    badge: 'Senior / Staff',
    exp: '5+ yrs',
    description: {
      en: 'Architectural trade-offs, high-concurrency race conditions, distributed resilience, cost governance, and failure-mode analysis.',
      vi: 'Phân tích đánh đổi kiến trúc (trade-offs), xử lý tranh chấp khóa đồng thời cao, tối ưu chi phí hạ tầng và thiết kế chống sụp đổ lan chuyền.',
    },
  },
];

export const enterpriseQuestions: EnterpriseScenarioQuestion[] = [
  // ==========================================
  // DATA ANALYST (DA)
  // ==========================================
  {
    id: 'da-scenario-1',
    role: 'data-analyst',
    level: 'middle',
    category: 'architecture',
    companyContext: 'SaaS Platform (Subscription 2M active users)',
    difficulty: 'Middle',
    title: {
      en: 'Month-over-Month (MoM) User Retention Cohort Analysis',
      vi: 'Phân tích Cohort giữ chân người dùng theo tháng (Month-over-Month Retention)',
    },
    scenarioNarrative: {
      en: 'The VP of Product at a SaaS company wants to track Month-over-Month User Retention. A retained user is defined as someone who performed any active event in month M and returned to perform at least one active event in month M+1. An initial query written by a junior analyst used triple self-joins on a 40-million-row `user_events` table and timed out after running for 25 minutes.',
      vi: 'Phó chủ tịch khối Sản phẩm của một công ty SaaS cần theo dõi tỷ lệ giữ chân người dùng theo từng tháng (Month-over-Month Retention). Người dùng được xem là "retained" nếu có hoạt động trong tháng M và quay lại hoạt động ở tháng M+1. Câu query ban đầu do một bạn junior viết dùng 3 lệnh self-join trên bảng `user_events` 40 triệu dòng chạy 25 phút bị timeout.',
    },
    question: {
      en: 'How would you write an optimal, scalable SQL query to return the cohort month, total active users in that cohort, retained users in the following month, and the retention percentage? How do you ensure it does not crash on divide-by-zero?',
      vi: 'Bạn hãy thiết kế câu truy vấn SQL tối ưu để trả về tháng cohort, tổng số user hoạt động trong tháng đó, số user quay lại ở tháng kế tiếp và tỷ lệ giữ chân %? Làm thế nào để đảm bảo không bị lỗi chia cho 0 khi tính toán?',
    },
    idealAnswerFramework: {
      en: [
        'Step 1: Clarify the grain (de-duplicate events down to unique user_id per month using DATE_TRUNC).',
        'Step 2: Use Common Table Expressions (CTEs) or window functions instead of cartesian self-joins.',
        'Step 3: Join Month M with Month M + 1 on user_id using date interval addition.',
        'Step 4: Defend against division by zero using NULLIF(total_users, 0).',
      ],
      vi: [
        'Bước 1: Xác định cấp độ dữ liệu (grain) - lọc trùng sự kiện xuống mức user_id duy nhất theo từng tháng bằng DATE_TRUNC.',
        'Bước 2: Dùng CTE để thu gọn dữ liệu trước khi ghép, tránh tự join trên toàn bộ 40 triệu dòng sự kiện thô.',
        'Bước 3: Ghép tháng M với tháng M + 1 theo user_id bằng phép cộng khoảng thời gian (INTERVAL 1 month).',
        'Bước 4: Phòng vệ lỗi chia cho 0 (divide-by-zero) bằng hàm NULLIF(total_users, 0).',
      ],
    },
    solutionDetail: {
      en: 'By pre-aggregating each user to their distinct active months, we reduce 40 million rows down to ~2 million monthly records. Then, joining Month M with Month M+1 produces an O(N) hash join that completes in seconds.',
      vi: 'Bằng cách thu gọn sự kiện của mỗi user về từng tháng hoạt động duy nhất, ta giảm từ 40 triệu dòng xuống còn ~2 triệu dòng. Sau đó phép join giữa tháng M và M+1 diễn ra siêu nhanh bằng Hash Join trong vài giây.',
    },
    codeSnippet: `WITH monthly_activity AS (
  -- Step 1: De-duplicate down to (user_id, active_month)
  SELECT DISTINCT 
    user_id, 
    DATE_TRUNC('month', event_date)::date AS activity_month
  FROM user_events
  WHERE event_date >= NOW() - INTERVAL '12 months'
),
cohort_pairs AS (
  -- Step 2: Join month M with month M + 1 month
  SELECT 
    m1.activity_month AS cohort_month,
    COUNT(DISTINCT m1.user_id) AS total_cohort_users,
    COUNT(DISTINCT m2.user_id) AS retained_users
  FROM monthly_activity m1
  LEFT JOIN monthly_activity m2 
    ON m1.user_id = m2.user_id 
    AND m2.activity_month = (m1.activity_month + INTERVAL '1 month')::date
  GROUP BY m1.activity_month
)
SELECT 
  cohort_month,
  total_cohort_users,
  retained_users,
  ROUND(retained_users * 100.0 / NULLIF(total_cohort_users, 0), 2) AS retention_rate_pct
FROM cohort_pairs
ORDER BY cohort_month DESC;`,
    tradeoffs: {
      en: 'Using calendar month boundaries (DATE_TRUNC) is standard for executive reporting, but can slightly bias users who joined on the 31st of a month. For product experiments, rolling 30-day windows from signup date are often preferred.',
      vi: 'Dùng mốc tháng lịch (DATE_TRUNC) là chuẩn báo cáo cho ban điều hành, nhưng có thể tạo sai lệch nhẹ với khách đăng ký vào ngày cuối tháng (31). Với thử nghiệm sản phẩm, khung rolling 30 ngày từ ngày tạo tài khoản sẽ công bằng hơn.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Immediately mentions clarifying the data grain first before writing code.',
          'Uses DATE_TRUNC and interval addition rather than string manipulation on dates.',
          'Proactively handles divide-by-zero using NULLIF.',
        ],
        vi: [
          'Chủ động làm rõ cấp độ dữ liệu (grain) trước khi bắt tay vào viết code.',
          'Dùng DATE_TRUNC và phép cộng interval chuẩn mực thay vì cắt chuỗi ngày tháng.',
          'Chủ động phòng chống lỗi chia cho 0 bằng NULLIF.',
        ],
      },
      redFlags: {
        en: [
          'Joins the raw 40M events table directly to itself without pre-aggregating distinct users.',
          'Uses raw division without protecting against zero denominators, causing runtime crashes.',
        ],
        vi: [
          'Tự join trực tiếp trên bảng 40 triệu dòng thô khiến RAM tràn và query timeout.',
          'Thực hiện phép chia số lượng mà không bọc NULLIF dẫn đến sập query khi mẫu số bằng 0.',
        ],
      },
    },
    tags: ['Cohort Retention', 'DATE_TRUNC', 'CTEs', 'Analytics Grain', 'NULLIF'],
  },
  {
    id: 'da-scenario-2',
    role: 'data-analyst',
    level: 'junior',
    category: 'foundational',
    companyContext: 'E-Commerce Marketplace ($50M GMV / Month)',
    difficulty: 'Junior',
    title: {
      en: '7-Day Rolling Moving Average & Cumulative Revenue Tracking',
      vi: 'Tính toán trung bình động 7 ngày & Doanh thu lũy kế đầu năm',
    },
    scenarioNarrative: {
      en: 'The Finance Director observes high daily revenue fluctuations between weekdays and weekends. They need a single daily executive dashboard showing: 1) Daily revenue, 2) A 7-day rolling moving average to smooth out weekend dips, and 3) Cumulative year-to-date revenue.',
      vi: 'Giám đốc Tài chính nhận thấy doanh thu hàng ngày biến động mạnh giữa các ngày trong tuần và cuối tuần. Họ yêu cầu một báo cáo hàng ngày hiển thị song song: 1) Doanh thu thực tế từng ngày, 2) Trung bình động 7 ngày (7-day Moving Average) để làm mịn biểu đồ, và 3) Tổng doanh thu lũy kế từ đầu năm (Cumulative YTD).',
    },
    question: {
      en: 'How do you formulate an analytic SQL query using window frames (`ROWS BETWEEN ...`) to calculate both metrics efficiently in a single scan of the daily aggregates?',
      vi: 'Bạn sẽ viết câu lệnh SQL dùng Window Functions với mệnh đề khung cửa sổ (`ROWS BETWEEN ...`) như thế nào để tính cả 2 chỉ số này chỉ trong một lần quét dữ liệu?',
    },
    idealAnswerFramework: {
      en: [
        'Step 1: Aggregate raw transactions into a daily revenue CTE (date grain).',
        'Step 2: Apply AVG(daily_rev) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW).',
        'Step 3: Apply SUM(daily_rev) OVER (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW).',
        'Step 4: Clarify the difference between ROWS BETWEEN and RANGE BETWEEN for gaps in dates.',
      ],
      vi: [
        'Bước 1: Gom nhóm giao dịch thô về cấp ngày (daily revenue) trong CTE đầu tiên.',
        'Bước 2: Áp dụng AVG(daily_rev) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW).',
        'Bước 3: Áp dụng SUM(daily_rev) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW).',
        'Bước 4: Nhấn mạnh sự khác nhau giữa ROWS (đếm số dòng) và RANGE (đếm theo giá trị ngày khi có ngày khuyết doanh số).',
      ],
    },
    solutionDetail: {
      en: 'Window functions calculate rolling metrics in memory in a single sequential pass over presorted daily aggregates, completely avoiding expensive correlated subqueries.',
      vi: 'Window functions tính toán các chỉ số lũy kế và trung bình động trực tiếp trên RAM chỉ trong 1 lượt duyệt dữ liệu đã sắp xếp, loại bỏ hoàn toàn các câu subquery lặp chậm chạp.',
    },
    codeSnippet: `WITH daily_sales AS (
  SELECT 
    order_timestamp::date AS sale_date,
    SUM(total_amount) AS daily_rev
  FROM orders
  WHERE order_timestamp >= '2024-01-01'
  GROUP BY order_timestamp::date
)
SELECT 
  sale_date,
  daily_rev,
  -- 7-Day Moving Average: current day + 6 previous days
  ROUND(AVG(daily_rev) OVER (
    ORDER BY sale_date 
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ), 2) AS moving_avg_7d,
  -- Cumulative Year-to-Date Revenue
  SUM(daily_rev) OVER (
    ORDER BY sale_date 
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS ytd_cumulative_rev
FROM daily_sales
ORDER BY sale_date;`,
    tradeoffs: {
      en: 'If there are missing calendar dates (e.g., a store was closed and generated 0 orders), `ROWS BETWEEN 6 PRECEDING` will take the last 6 active business days, not calendar days. To enforce calendar days, generate a calendar series with `GENERATE_SERIES` and LEFT JOIN.',
      vi: 'Nếu có ngày không có đơn hàng nào, `ROWS BETWEEN 6 PRECEDING` sẽ lấy 6 dòng có dữ liệu gần nhất chứ không phải 6 ngày lịch. Để đảm bảo đúng 7 ngày lịch, cần tạo chuỗi ngày bằng `GENERATE_SERIES` và LEFT JOIN với bảng doanh số.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Points out that ROWS BETWEEN 6 PRECEDING means 7 total days (current + 6 prior).',
          'Raises the edge case of missing dates and explains how to address it via calendar scaffolding.',
        ],
        vi: [
          'Chỉ ra chính xác 6 PRECEDING nghĩa là tổng cộng 7 ngày (ngày hiện tại + 6 ngày trước).',
          'Nêu được trường hợp khuyết ngày và cách xử lý bằng bảng lịch (Calendar table / GENERATE_SERIES).',
        ],
      },
      redFlags: {
        en: [
          'Writes correlated subqueries with `WHERE date <= current_date`, causing O(N^2) quadratic performance collapse.',
          'Confuses ROWS BETWEEN 7 PRECEDING (which actually computes an 8-day window).',
        ],
        vi: [
          'Dùng subquery tương quan tính tổng lặp lại từng ngày gây sập hiệu năng O(N^2).',
          'Nhầm lẫn viết ROWS BETWEEN 7 PRECEDING (dẫn đến tính cửa sổ 8 ngày thay vì 7 ngày).',
        ],
      },
    },
    tags: ['Window Frames', 'Moving Average', 'Running Total', 'ROWS BETWEEN', 'Financial SQL'],
  },
  {
    id: 'da-scenario-3',
    role: 'data-analyst',
    level: 'middle',
    category: 'architecture',
    companyContext: 'Travel & Hotel Booking Platform',
    difficulty: 'Middle',
    title: {
      en: 'Multi-Stage E-Commerce Conversion Funnel & Drop-Off Tracking',
      vi: 'Xây dựng phễu chuyển đổi đa tầng & Đo lường tỷ lệ rớt phễu',
    },
    scenarioNarrative: {
      en: 'Product management launched a redesigned checkout flow and wants to analyze user journey progression across 4 milestones: `search_hotel` -> `view_room` -> `initiate_checkout` -> `complete_booking`. The events table records raw clickstream telemetry with 60M events per week.',
      vi: 'Đội ngũ Product vừa ra mắt luồng đặt phòng mới và cần phân tích tỷ lệ chuyển đổi qua 4 mốc: `search_hotel` -> `view_room` -> `initiate_checkout` -> `complete_booking`. Bảng log sự kiện ghi nhận 60 triệu event mỗi tuần.',
    },
    question: {
      en: 'How do you construct a conversion funnel query using Conditional Aggregation (`SUM(CASE WHEN ...)`) to compute user drop-off across stages in a single pass over the user event logs?',
      vi: 'Bạn sẽ viết câu query phễu chuyển đổi dùng kỹ thuật Conditional Aggregation (`SUM(CASE WHEN ...)`) như thế nào để tính tỷ lệ rơi rụng chỉ trong một lần duyệt dữ liệu sự kiện?',
    },
    idealAnswerFramework: {
      en: [
        'Step 1: Aggregate event occurrences per user_id into milestone flags (0 or 1).',
        'Step 2: Aggregate the total users reaching each funnel stage.',
        'Step 3: Calculate step-to-step conversion rates and top-of-funnel overall conversion rate.',
        'Step 4: Account for event sequencing (ensuring step N occurred after step N-1).',
      ],
      vi: [
        'Bước 1: Gom sự kiện theo user_id và gắn cờ các mốc bằng hàm MAX(CASE WHEN ...).',
        'Bước 2: Tính tổng số lượng user chạm tới từng tầng của phễu.',
        'Bước 3: Tính tỷ lệ chuyển đổi từng bước (Step-to-step) và chuyển đổi tổng thể từ đầu phễu.',
        'Bước 4: Lưu ý tính tuần tự của sự kiện (bước sau phải diễn ra sau bước trước).',
      ],
    },
    solutionDetail: {
      en: 'Conditional aggregation flattens vertical event logs into horizontal milestone flags per user, allowing all funnel metrics to be computed without joining the 60M row table 4 times.',
      vi: 'Kỹ thuật Conditional Aggregation giúp chuyển dữ liệu sự kiện dạng dọc thành các cờ mốc ngang cho từng user, cho phép tính toàn bộ chỉ số phễu mà không cần JOIN bảng 60M dòng 4 lần.',
    },
    codeSnippet: `WITH user_funnel AS (
  SELECT 
    user_id,
    MAX(CASE WHEN event_name = 'search_hotel' THEN 1 ELSE 0 END) AS step_1_search,
    MAX(CASE WHEN event_name = 'view_room' THEN 1 ELSE 0 END) AS step_2_view,
    MAX(CASE WHEN event_name = 'initiate_checkout' THEN 1 ELSE 0 END) AS step_3_checkout,
    MAX(CASE WHEN event_name = 'complete_booking' THEN 1 ELSE 0 END) AS step_4_booked
  FROM clickstream_events
  WHERE event_timestamp >= '2024-10-01'
  GROUP BY user_id
)
SELECT 
  SUM(step_1_search) AS total_searched,
  SUM(step_2_view) AS total_viewed,
  SUM(step_3_checkout) AS total_checkout,
  SUM(step_4_booked) AS total_booked,
  -- Step-to-Step Conversion
  ROUND(SUM(step_2_view) * 100.0 / NULLIF(SUM(step_1_search), 0), 2) AS search_to_view_pct,
  ROUND(SUM(step_3_checkout) * 100.0 / NULLIF(SUM(step_2_view), 0), 2) AS view_to_checkout_pct,
  ROUND(SUM(step_4_booked) * 100.0 / NULLIF(SUM(step_3_checkout), 0), 2) AS checkout_to_booked_pct,
  -- Overall Conversion
  ROUND(SUM(step_4_booked) * 100.0 / NULLIF(SUM(step_1_search), 0), 2) AS overall_conversion_pct
FROM user_funnel;`,
    tradeoffs: {
      en: 'Simple milestone flags do not enforce strict chronological order (e.g. user booked yesterday and searched today). For strict sequencing, track MIN(event_timestamp) for each step and check t2 > t1.',
      vi: 'Cờ mốc đơn giản chưa ràng buộc chặt chẽ thứ tự thời gian. Nếu cần chặt chẽ, ta lấy MIN(timestamp) của từng bước và kiểm tra điều kiện t2 > t1 trong mệnh đề CASE.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Leverages conditional aggregation (MAX(CASE)) instead of multiple self-joins.',
          'Calculates both step-to-step drop-off and overall top-to-bottom conversion.',
          'Discusses chronological sequencing constraints.',
        ],
        vi: [
          'Tận dụng Conditional Aggregation thay vì self-join nhiều lần làm nặng DB.',
          'Trình bày cả 2 loại tỷ lệ: chuyển đổi từng bước kế tiếp và chuyển đổi toàn phễu.',
          'Chủ động đề cập đến việc kiểm tra thứ tự thời gian giữa các mốc.',
        ],
      },
      redFlags: {
        en: [
          'Performs 4 successive INNER JOINs on the 60M row events table.',
          'Forgets to mention edge cases where users complete bookings without searching (direct link).',
        ],
        vi: [
          'Thực hiện 4 phép INNER JOIN liên tiếp trên bảng 60 triệu dòng.',
          'Không để ý trường hợp người dùng vào thẳng trang thanh toán từ link ngoài.',
        ],
      },
    },
    tags: ['Funnel Analysis', 'Conditional Aggregation', 'Conversion Rates', 'Clickstream BI'],
  },
  {
    id: 'da-scenario-4',
    role: 'data-analyst',
    level: 'senior',
    category: 'incident',
    companyContext: 'Fintech & Payment Gateway (Stripe-like System)',
    difficulty: 'Senior',
    title: {
      en: 'Real-Time Payment Fraud Detection (Rapid Repeated Charges)',
      vi: 'Phát hiện gian lận thanh toán quẹt thẻ liên tiếp dưới 10 phút',
    },
    scenarioNarrative: {
      en: 'The Risk Engineering team detects an automated bot attack: stolen credit cards are being tested by triggering repeated small payments at the same merchant for the exact same dollar amount within short time windows. As an analyst on the risk team, you must write an alert query to detect all cards exhibiting repeated charges within 10 minutes.',
      vi: 'Đội ngũ Kiểm soát rủi ro phát hiện đợt tấn công bằng bot: các thẻ tín dụng bị đánh cắp đang bị thử quẹt liên tiếp với cùng một số tiền nhỏ tại cùng một cửa hàng trong thời gian rất ngắn. Là chuyên viên dữ liệu thuộc đội rủi ro, bạn cần viết câu truy vấn phát hiện các thẻ có giao dịch lặp lại trong vòng 10 phút.',
    },
    question: {
      en: 'How do you use the `LAG()` window function to calculate the time difference between consecutive payments for the same card, merchant, and amount?',
      vi: 'Bạn sử dụng Window function `LAG()` như thế nào để tính khoảng cách thời gian giữa 2 giao dịch liên tiếp của cùng một thẻ tại cùng một merchant với cùng số tiền?',
    },
    idealAnswerFramework: {
      en: [
        'Step 1: Partition by (credit_card_id, merchant_id, amount) and order by transaction_time.',
        'Step 2: Use LAG(transaction_time) to retrieve the previous payment timestamp.',
        'Step 3: Extract time delta in seconds using EXTRACT(EPOCH FROM (current - previous)).',
        'Step 4: Filter where diff_seconds <= 600 (10 minutes).',
      ],
      vi: [
        'Bước 1: Phân vùng (PARTITION BY) theo bộ 3: thẻ, merchant và số tiền; sắp xếp theo thời gian giao dịch.',
        'Bước 2: Dùng LAG(transaction_time) để lấy mốc thời gian của giao dịch liền trước.',
        'Bước 3: Trừ hai mốc thời gian và đổi ra giây bằng EXTRACT(EPOCH FROM ...).',
        'Bước 4: Lọc các giao dịch có độ chênh lệch <= 600 giây (10 phút).',
      ],
    },
    solutionDetail: {
      en: 'The LAG() function inspects preceding rows within the partitioned partition without requiring expensive self-joins, running in O(N log N) time based on index sorting.',
      vi: 'Hàm LAG() cho phép đọc ngược lại dòng trước đó trong từng phân vùng mà không cần self-join, tận dụng trực tiếp chỉ mục B-Tree để sắp xếp với độ phức tạp O(N log N).',
    },
    codeSnippet: `WITH payment_intervals AS (
  SELECT 
    transaction_id,
    credit_card_id,
    merchant_id,
    amount,
    transaction_time,
    -- Get timestamp of previous payment on same card, merchant & amount
    LAG(transaction_time) OVER (
      PARTITION BY credit_card_id, merchant_id, amount 
      ORDER BY transaction_time ASC
    ) AS prev_transaction_time
  FROM transactions
  WHERE transaction_time >= NOW() - INTERVAL '24 hours'
),
flagged_transactions AS (
  SELECT 
    *,
    EXTRACT(EPOCH FROM (transaction_time - prev_transaction_time)) AS gap_seconds
  FROM payment_intervals
  WHERE prev_transaction_time IS NOT NULL
)
SELECT 
  transaction_id,
  credit_card_id,
  merchant_id,
  amount,
  transaction_time,
  prev_transaction_time,
  ROUND(gap_seconds / 60.0, 1) AS gap_minutes
FROM flagged_transactions
WHERE gap_seconds <= 600 -- 10 minutes
ORDER BY gap_seconds ASC;`,
    tradeoffs: {
      en: 'Bot attacks can slightly vary the payment amount (e.g., $1.00 then $1.01). In advanced fraud models, omit `amount` from the PARTITION BY clause and inspect all rapid transactions on the card.',
      vi: 'Kẻ tấn công tinh vi có thể thay đổi số tiền nhẹ (vd: 1.00$ rồi 1.05$). Trong mô hình rủi ro nâng cao, ta có thể bỏ cột `amount` khỏi PARTITION BY để bắt mọi giao dịch quẹt nhanh bất thường.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Correctly sets PARTITION BY and ORDER BY within LAG().',
          'Converts timestamp differences to seconds cleanly using EPOCH extraction.',
          'Discusses adversary evasion strategies (varying amounts, switching merchants).',
        ],
        vi: [
          'Thiết lập chính xác mệnh đề PARTITION BY và ORDER BY cho hàm LAG().',
          'Chuyển đổi hiệu khoảng thời gian thành giây một cách chuẩn mực bằng EPOCH.',
          'Chủ động thảo luận cách kẻ gian lách luật (thay đổi số tiền, đổi merchant).',
        ],
      },
      redFlags: {
        en: [
          'Uses a cross join or cartesian product to compare dates, collapsing database performance.',
          'Forgets to filter out the first transaction of a card where LAG is NULL.',
        ],
        vi: [
          'Dùng self-join so sánh thời gian gây nghẽn I/O nghiêm trọng.',
          'Quên xử lý giá trị NULL của dòng đầu tiên trong phân vùng.',
        ],
      },
    },
    tags: ['Fraud Detection', 'LAG Window Function', 'Fintech SQL', 'Timestamp Arithmetic'],
  },
  {
    id: 'da-scenario-5',
    role: 'data-analyst',
    level: 'junior',
    category: 'foundational',
    companyContext: 'Luxury Retail VIP Loyalty Program',
    difficulty: 'Junior',
    title: {
      en: 'Top 2 VIP Customers per Region: Tie-Breaking Mechanics',
      vi: 'Xếp hạng Top 2 khách hàng VIP theo vùng & Cơ chế xử lý đồng hạng',
    },
    scenarioNarrative: {
      en: 'Marketing is sending exclusive VIP gift hampers to the "Top 2 spenders in each sales territory". If multiple customers are tied with the exact same high spending score, business policy mandates that ALL tied customers must receive a hamper. Using arbitrary tie-breaking previously caused customer complaints when someone was excluded unfairly.',
      vi: 'Phòng Marketing gửi quà tri ân đặc biệt cho "Top 2 khách hàng chi tiêu nhiều nhất ở mỗi khu vực". Nếu có nhiều người bằng điểm nhau, quy định kinh doanh bắt buộc TẤT CẢ người bằng điểm đều phải được nhận quà. Việc chọn ngẫu nhiên trước đây từng gây khiếu nại gay gắt từ các khách hàng lớn.',
    },
    question: {
      en: 'Explain the technical differences between `ROW_NUMBER()`, `RANK()`, and `DENSE_RANK()`. Which one guarantees business policy compliance here, and how is it written?',
      vi: 'Giải thích sự khác biệt giữa `ROW_NUMBER()`, `RANK()`, và `DENSE_RANK()`. Hàm nào đảm bảo đúng quy định kinh doanh trên, và câu lệnh SQL được viết ra sao?',
    },
    idealAnswerFramework: {
      en: [
        'Define ROW_NUMBER: Always unique sequence numbers (1, 2, 3, 4) - tie breaker is arbitrary.',
        'Define RANK: Same rank for ties, but skips subsequent rank numbers (1, 2, 2, 4) - skips rank 3.',
        'Define DENSE_RANK: Same rank for ties, never skips rank numbers (1, 2, 2, 3) - includes all tier 1 and tier 2 members.',
        'Identify DENSE_RANK as the correct choice to capture all users in the top 2 spending tiers.',
      ],
      vi: [
        'Định nghĩa ROW_NUMBER: Luôn gán số liên tiếp (1, 2, 3, 4) - phân xử ngẫu nhiên khi bằng điểm.',
        'Định nghĩa RANK: Gán cùng hạng cho điểm bằng nhau nhưng nhảy cóc thứ hạng kế tiếp (1, 2, 2, 4 - mất hạng 3).',
        'Định nghĩa DENSE_RANK: Gán cùng hạng cho điểm bằng nhau và không nhảy cóc (1, 2, 2, 3 - lấy trọn vẹn cả nhóm 1 và nhóm 2).',
        'Kết luận chọn DENSE_RANK để đảm bảo lấy đúng toàn bộ người thuộc 2 mức chi tiêu cao nhất.',
      ],
    },
    solutionDetail: {
      en: 'With DENSE_RANK, if customer A spent $10k (rank 1), and customers B and C each spent $8k (both rank 2), filtering by rank <= 2 returns all three customers without dropping anyone.',
      vi: 'Với DENSE_RANK, nếu khách A chi $10k (hạng 1), khách B và C cùng chi $8k (cả hai cùng hạng 2), lọc điều kiện rank <= 2 sẽ lấy trọn vẹn cả 3 người mà không bỏ sót ai.',
    },
    codeSnippet: `WITH regional_customer_spend AS (
  SELECT 
    region,
    customer_id,
    SUM(order_total) AS total_spend
  FROM customer_orders
  GROUP BY region, customer_id
),
ranked_customers AS (
  SELECT 
    region,
    customer_id,
    total_spend,
    -- DENSE_RANK keeps ties without skipping rank numbers
    DENSE_RANK() OVER (
      PARTITION BY region 
      ORDER BY total_spend DESC
    ) AS spending_tier
  FROM regional_customer_spend
)
SELECT 
  region,
  customer_id,
  total_spend,
  spending_tier
FROM ranked_customers
WHERE spending_tier <= 2
ORDER BY region, spending_tier, total_spend DESC;`,
    tradeoffs: {
      en: 'Using DENSE_RANK means you might return more than 2 recipients per region if ties exist. Marketing must be aware of potential budget variance.',
      vi: 'Dùng DENSE_RANK có thể khiến số lượng quà tặng ở mỗi vùng nhiều hơn 2 phần nếu có khách bằng điểm. Cần thông báo trước cho phòng Marketing để dự trù ngân sách.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Clearly contrasts all three ranking functions with a concrete numerical example.',
          'Proactively mentions budget implications of having multiple tied winners.',
        ],
        vi: [
          'Giải thích rõ ràng cả 3 hàm bằng ví dụ số cụ thể (1, 2, 2, 3 vs 1, 2, 2, 4).',
          'Chủ động nhắc nhở về rủi ro phát sinh thêm quà tặng so với dự toán ban đầu.',
        ],
      },
      redFlags: {
        en: [
          'Confuses RANK with DENSE_RANK, thinking RANK does not skip numbers.',
          'Suggests using LIMIT 2 inside a subquery, which cannot partition cleanly across regions.',
        ],
        vi: [
          'Nhầm lẫn giữa RANK và DENSE_RANK (tưởng RANK không nhảy số).',
          'Đề xuất dùng LIMIT 2 (không thể chia theo từng vùng được).',
        ],
      },
    },
    tags: ['Ranking', 'DENSE_RANK', 'Window Functions', 'Business Logic'],
  },
  {
    id: 'da-scenario-6',
    role: 'data-analyst',
    level: 'senior',
    category: 'incident',
    companyContext: 'AdTech & Cross-Device Attribution',
    difficulty: 'Senior',
    title: {
      en: 'Late-Arriving Events & Historical Reconciliation Lock',
      vi: 'Xử lý dữ liệu gửi trễ (Late-Arriving Events) & Đối soát khóa sổ',
    },
    scenarioNarrative: {
      en: 'Due to mobile offline mode and cellular latency, in-app ad conversion events arrive at the database with a 24-48 hour delay. Financial revenue reports generated at midnight on day D produce different totals when rerun 2 days later, causing discrepancies with partner payout invoices.',
      vi: 'Do người dùng dùng app offline và mạng di động chập chờn, các sự kiện chuyển đổi quảng cáo bị gửi trễ 24–48 tiếng. Báo cáo doanh thu chạy lúc nửa đêm ra số liệu A, nhưng 2 ngày sau chạy lại ra số liệu B, làm lệch số tiền thanh toán đối tác.',
    },
    question: {
      en: 'How do you design an enterprise attribution and reporting architecture that distinguishes between Event Time and Ingestion Time while preserving historical audit integrity?',
      vi: 'Bạn thiết kế kiến trúc đối soát dữ liệu thế nào để phân biệt rõ Event Time (giờ xảy ra) vs Ingestion Time (giờ server nhận), đồng thời bảo toàn tính bất biến của số liệu tài chính?',
    },
    idealAnswerFramework: {
      en: [
        'Store both event_timestamp (client device clock) and ingested_timestamp (server clock).',
        'Establish a formal financial reconciliation window (e.g. 72-hour grace period) before hard-closing the reporting ledger.',
        'Never silently overwrite historical closed periods; post late arrivals as prior-period delta adjustments in the current cycle.',
        'Surface dual views for stakeholders: Real-time estimated view vs Audited ledger view.',
      ],
      vi: [
        'Lưu trữ đồng thời 2 mốc: event_timestamp (giờ trên thiết bị) và ingested_timestamp (giờ server ghi nhận).',
        'Thiết lập chu kỳ đối soát cố định (ví dụ 72 giờ) trước khi khóa sổ kỳ kế toán.',
        'Không bao giờ sửa đè số liệu lịch sử của kỳ đã chốt; ghi nhận dữ liệu đến muộn dưới dạng điều chỉnh chênh lệch (Delta Adjustment) trong kỳ hiện tại.',
        'Cung cấp 2 góc nhìn cho ban điều hành: Dashboard ước tính thời gian thực vs Sổ cái kiểm toán chính thức.',
      ],
    },
    solutionDetail: {
      en: 'In enterprise data governance, financial numbers must be immutable once closed. Late-arriving events are assigned to the current reporting batch with an attribution tag pointing back to the original conversion date.',
      vi: 'Trong quản trị dữ liệu doanh nghiệp, số liệu tài chính khi đã chốt là bất biến. Các sự kiện gửi trễ sẽ được hạch toán vào kỳ hiện tại kèm nhãn tham chiếu ngày chuyển đổi ban đầu.',
    },
    tradeoffs: {
      en: 'Waiting 72 hours provides 100% accurate financial reconciliation but slows down immediate feedback for marketing campaign bidding algorithms.',
      vi: 'Chờ 72 giờ mang lại độ chính xác 100% cho đối soát tài chính nhưng làm trễ phản hồi tức thời cho các thuật toán tối ưu giá thầu quảng cáo.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Differentiates clearly between Event Time and Processing / Ingestion Time.',
          'Emphasizes financial ledger immutability and delta accounting.',
        ],
        vi: [
          'Phân biệt rành mạch giữa Event Time (thời điểm phát sinh) và Ingestion Time (thời điểm ghi nhận).',
          'Nhấn mạnh nguyên tắc bất biến của sổ sách tài chính và ghi nhận chênh lệch delta.',
        ],
      },
      redFlags: {
        en: [
          'Suggests silently updating historical database records in-place without audit trails.',
          'Relies solely on client device timestamps without bounds checks against server arrival time.',
        ],
        vi: [
          'Đề xuất chạy lệnh UPDATE sửa đè trực tiếp số liệu ngày hôm trước mà không để lại vết kiểm toán.',
          'Phụ thuộc hoàn toàn vào giờ thiết bị người dùng mà không kiểm tra sai lệch với giờ server nhận.',
        ],
      },
    },
    tags: ['Event Time vs Processing Time', 'Attribution', 'Data Governance', 'Audit Integrity'],
  },

  // ==========================================
  // DATA ENGINEER (DE)
  // ==========================================
  {
    id: 'de-scenario-1',
    role: 'data-engineer',
    level: 'senior',
    category: 'incident',
    companyContext: 'Cloud Lakehouse (Databricks / Spark on 5B Rows)',
    difficulty: 'Senior',
    title: {
      en: 'Big Data Distributed Join OOM & Data Skew Mitigation',
      vi: 'Xử lý lỗi OOM do lệch dữ liệu (Data Skew) khi JOIN 5 tỷ dòng',
    },
    scenarioNarrative: {
      en: 'A nightly Spark batch pipeline joins a massive transactional events table (5 billion rows) with a customer dimension table (10 million rows). Although the cluster has 2TB of aggregate memory, the job consistently crashes with `Executor OOM (Out Of Memory)` on 2 specific worker nodes, while the remaining 40 workers sit idle at 5% memory.',
      vi: 'Một pipeline Spark chạy đêm ghép bảng giao dịch khổng lồ 5 tỷ dòng với bảng thông tin khách hàng 10 triệu dòng. Mặc dù cụm máy chủ có tới 2TB RAM, tiến trình luôn bị sập với lỗi `Executor OOM (Out Of Memory)` ở đúng 2 máy worker, trong khi 40 worker còn lại chỉ dùng 5% RAM.',
    },
    question: {
      en: 'Diagnose the root cause of this failure. What are the two primary distributed computing techniques (Broadcast Join & Salting) used to eliminate data skew and stabilize memory?',
      vi: 'Hãy chẩn đoán nguyên nhân gốc rễ của sự cố. Hai kỹ thuật điện toán phân tán cốt lõi (Broadcast Join & Salting) được áp dụng như thế nào để triệt tiêu lệch dữ liệu và ổn định bộ nhớ?',
    },
    idealAnswerFramework: {
      en: [
        'Diagnosis: Data Skew - A few hot partition keys (e.g. user_id = NULL or enterprise bot accounts with 50M records) hash to the same single worker partition.',
        'Solution 1: Broadcast Hash Join if the dimension table fits in memory (< a few GBs), eliminating the shuffle entirely.',
        'Solution 2: Salting the hot keys - append random salt (0 to N) on the skewed table and replicate dimension keys N times.',
        'Solution 3: Filter or isolate NULL / bot keys beforehand into a separate processing branch.',
      ],
      vi: [
        'Chẩn đoán: Data Skew (Lệch dữ liệu) - một vài khóa join quá phổ biến (vd: user_id = NULL hoặc tài khoản bot doanh nghiệp triệu đơn) bị gom hết về đúng 1 partition.',
        'Giải pháp 1: Broadcast Hash Join nếu bảng dimension đủ nhỏ (< vài GB), loại bỏ hoàn toàn giai đoạn Shuffle mạng.',
        'Giải pháp 2: Kỹ thuật Salting (Rắc muối) - gắn tiền tố ngẫu nhiên (0..N) vào khóa bảng lớn và nhân bản dòng bảng nhỏ N lần.',
        'Giải pháp 3: Lọc tách riêng các giá trị NULL hoặc bot ra một nhánh xử lý độc lập trước khi JOIN.',
      ],
    },
    solutionDetail: {
      en: 'By salting hot keys, a single 100-million row skewed partition is fragmented across 10 separate workers, distributing memory consumption evenly across the entire cluster.',
      vi: 'Bằng cách rắc muối (Salting) lên các hot key, một partition bị dồn 100 triệu dòng sẽ được xé nhỏ chia đều cho 10 worker khác nhau, san phẳng mức tiêu thụ RAM trên toàn cụm.',
    },
    codeSnippet: `-- PySpark Salting Concept
from pyspark.sql.functions import concat, lit, floor, rand, explode, array

# Step 1: Salt the skewed large table with random suffix 0..9
skewed_df = large_df.withColumn("salt_key", concat(col("user_id"), lit("_"), floor(rand() * 10)))

# Step 2: Replicate the lookup dimension table 10 times with matching salts
replicated_dim = dim_df.withColumn("salt_array", array([lit(i) for i in range(10)])) \\
                       .withColumn("salt", explode("salt_array")) \\
                       .withColumn("salt_key", concat(col("user_id"), lit("_"), col("salt")))

# Step 3: Join on the salted key - no more single worker bottleneck!
result = skewed_df.join(replicated_dim, on="salt_key", how="inner")`,
    tradeoffs: {
      en: 'Salting increases the memory size of the dimension table by N times. It should only be applied to identified skewed keys rather than all keys indiscriminately.',
      vi: 'Kỹ thuật Salting làm tăng kích thước bộ nhớ của bảng dimension lên N lần. Chỉ nên áp dụng cho các khóa bị lệch nghiêm trọng thay vì rắc muối cho toàn bộ bảng.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Immediately identifies data skew rather than just blindly recommending "add more cluster RAM".',
          'Accurately explains how Salting works with a concrete random-split mechanism.',
          'Mentions Broadcast Join threshold configuration (e.g. spark.sql.autoBroadcastJoinThreshold).',
        ],
        vi: [
          'Nhận diện ngay hiện tượng Data Skew thay vì khuyên bừa "mua thêm RAM cho cụm máy chủ".',
          'Giải thích chính xác cơ chế hoạt động của kỹ thuật Salting.',
          'Nhắc đến cấu hình ngưỡng Broadcast Join trong Spark.',
        ],
      },
      redFlags: {
        en: [
          'Suggests increasing total cluster memory without addressing partition hashing.',
          'Does not understand why NULL keys cause executor OOM during hash shuffling.',
        ],
        vi: [
          'Đề xuất tăng RAM máy chủ mà không hiểu bản chất do băm partition bị lệch.',
          'Không hiểu vì sao giá trị NULL lại dồn vào 1 worker gây sập máy.',
        ],
      },
    },
    tags: ['Data Skew', 'Distributed Computing', 'Spark / Databricks', 'Salting', 'Broadcast Join'],
  },
  {
    id: 'de-scenario-2',
    role: 'data-engineer',
    level: 'senior',
    category: 'architecture',
    companyContext: 'Fintech Real-Time Pipeline (Kafka to Snowflake)',
    difficulty: 'Senior',
    title: {
      en: 'Streaming Deduplication & Exactly-Once Semantics',
      vi: 'Khử trùng lặp dữ liệu luồng & Cơ chế Exactly-Once Semantics',
    },
    scenarioNarrative: {
      en: 'A financial streaming consumer reads credit card transactions from Apache Kafka and streams them into a cloud data warehouse. During network blips, Kafka consumer groups rebalance and re-read historical offsets, causing thousands of duplicate transaction records to be written into production tables, creating phantom duplicate charges.',
      vi: 'Một tiến trình streaming đọc giao dịch quẹt thẻ từ Apache Kafka để ghi vào kho dữ liệu Snowflake. Khi có sự cố chập chờn mạng, consumer group bị rebalance và đọc lại các offset cũ, dẫn đến hàng nghìn bản ghi bị ghi trùng lặp vào bảng báo cáo, tạo ra số liệu doanh thu ảo.',
    },
    question: {
      en: 'How do you architect an end-to-end idempotent ingestion pipeline using deterministic hashing and `MERGE INTO` (upsert) to guarantee Exactly-Once semantics at the destination layer?',
      vi: 'Bạn thiết kế đường truyền nạp dữ liệu có tính Idempotent thế nào bằng mã băm định danh và câu lệnh `MERGE INTO` để bảo đảm tính chất Exactly-Once ở tầng lưu trữ đích?',
    },
    idealAnswerFramework: {
      en: [
        'Acknowledge that network transmission in distributed streaming is inherently At-Least-Once.',
        'Achieve Exactly-Once semantics by combining At-Least-Once delivery with an Idempotent Storage Sink.',
        'Generate a deterministic hash key (e.g. SHA256 of card_id + merchant + timestamp + amount).',
        'Use MERGE INTO (upsert) targeting the warehouse table based on the deterministic key.',
        'Commit Kafka offsets strictly after the atomic warehouse batch commit succeeds.',
      ],
      vi: [
        'Khẳng định việc truyền tải qua mạng trong hệ thống phân tán vốn là At-Least-Once.',
        'Đạt được Exactly-Once bằng cách kết hợp At-Least-Once delivery với Idempotent Sink ở tầng đích.',
        'Tạo mã băm định danh duy nhất (SHA256 của card_id + merchant + timestamp + amount).',
        'Dùng câu lệnh MERGE INTO (upsert) đối chiếu theo khóa định danh duy nhất này.',
        'Chỉ commit offset Kafka sau khi mẻ ghi vào kho dữ liệu đã hoàn tất thành công.',
      ],
    },
    solutionDetail: {
      en: 'By generating a deterministic unique event fingerprint and using atomic MERGE INTO operations, re-reading the same Kafka messages 10 times will result in the exact same state in the warehouse without duplicates.',
      vi: 'Bằng cách tạo vân tay dữ liệu duy nhất (Deterministic Fingerprint) kết hợp câu lệnh MERGE INTO nguyên tử, việc Kafka đọc lại cùng một message 10 lần vẫn cho ra kết quả đồng nhất trong kho dữ liệu mà không bị nhân bản.',
    },
    codeSnippet: `-- Snowflake / BigQuery / Databricks Idempotent MERGE
MERGE INTO raw_transactions target
USING staging_microbatch source
ON target.event_hash = source.event_hash
WHEN MATCHED THEN 
  UPDATE SET target.updated_at = source.updated_at
WHEN NOT MATCHED THEN 
  INSERT (event_hash, card_id, merchant_id, amount, tx_time, ingested_at)
  VALUES (source.event_hash, source.card_id, source.merchant_id, source.amount, source.tx_time, NOW());`,
    tradeoffs: {
      en: 'MERGE INTO introduces higher compute overhead than raw append-only INSERT. For extreme throughput (>100k events/sec), write append-only to an uncurated bronze table, then deduplicate via scheduled incremental dbt models using ROW_NUMBER.',
      vi: 'Lệnh MERGE INTO tốn tài nguyên tính toán hơn lệnh INSERT thuần túy. Với throughput cực lớn (>100k msg/s), ta ghi append-only vào bảng Bronze thô, sau đó chạy job dbt định kỳ khử trùng bằng ROW_NUMBER.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Correctly explains that Exactly-Once = At-Least-Once + Idempotent Processing.',
          'Uses deterministic event hashing rather than arbitrary database auto-increment IDs.',
          'Specifies the exact ordering between database commit and Kafka offset commit.',
        ],
        vi: [
          'Giải thích chính xác công thức Exactly-Once = At-Least-Once + Idempotent Sink.',
          'Dùng mã băm định danh từ nội dung thay vì dùng ID tự tăng ngẫu nhiên.',
          'Nêu rõ thứ tự commit: DB ghi thành công rồi mới commit offset Kafka.',
        ],
      },
      redFlags: {
        en: [
          'Claims Kafka standalone guarantees exactly-once across external database sinks without idempotent logic.',
          'Suggests doing a SELECT check before every individual INSERT.',
        ],
        vi: [
          'Cho rằng bản thân Kafka tự động đảm bảo exactly-once xuống mọi DB mà không cần làm gì ở tầng sink.',
          'Đề xuất chạy lệnh SELECT kiểm tra rồi mới INSERT từng dòng một.',
        ],
      },
    },
    tags: ['Kafka', 'Streaming', 'Exactly-Once', 'MERGE INTO', 'Idempotency'],
  },
  {
    id: 'de-scenario-3',
    role: 'data-engineer',
    level: 'middle',
    category: 'incident',
    companyContext: 'Enterprise SaaS (Snowflake / BigQuery Warehouse)',
    difficulty: 'Middle',
    title: {
      en: 'Cloud Data Warehouse FinOps: Auditing a 300% Bill Spike',
      vi: 'Kiểm toán chi phí FinOps: Xử lý hóa đơn kho dữ liệu tăng vọt 300%',
    },
    scenarioNarrative: {
      en: 'The CFO schedules an emergency meeting: the monthly cloud data warehouse bill jumped from $12,000 to $48,000 in the last 60 days. Executive dashboards must not be interrupted, but engineering leadership mandates a 50% spend reduction within two weeks.',
      vi: 'Giám đốc tài chính triệu tập cuộc họp khẩn: hóa đơn kho dữ liệu đám mây tăng từ $12.000 lên $48.000 trong 2 tháng qua. Các dashboard của ban giám đốc không được phép gián đoạn, nhưng đội ngũ kỹ thuật phải hạ 50% chi phí trong vòng 2 tuần.',
    },
    question: {
      en: 'What is your systematic Cost Audit Runbook? What architectural changes (clustering, auto-suspend, query guardrails, cold storage tiering) do you implement immediately?',
      vi: 'Quy trình kiểm toán chi phí (FinOps Runbook) của bạn gồm những bước nào? Những thay đổi kỹ thuật nào (phân vùng, auto-suspend, query guardrails, phân tầng lưu trữ) được triển khai ngay lập tức?',
    },
    idealAnswerFramework: {
      en: [
        'Phase 1 - Attribute Cost: Query `INFORMATION_SCHEMA.QUERY_HISTORY` to find top 5% most expensive queries and users.',
        'Phase 2 - Compute Governance: Set warehouse auto-suspend to 60-120 seconds (down from 10 minutes) and apply statement timeouts.',
        'Phase 3 - Storage Optimization: Enforce partition pruning and clustering keys on massive fact tables to avoid full table scans.',
        'Phase 4 - Lifecycle Tiering: Move cold raw data (>90 days) out of warehouse storage to S3/GCS in Iceberg/Parquet format.',
      ],
      vi: [
        'Bước 1 - Định danh chi phí: Soi `INFORMATION_SCHEMA.QUERY_HISTORY` tìm top 5% query ngốn nhiều tiền nhất và các user/BI tool chạy vô tội vạ.',
        'Bước 2 - Quản trị Compute: Giảm thời gian auto-suspend của warehouse từ 10 phút xuống 1-2 phút; đặt giới hạn thời gian chạy tối đa (statement_timeout).',
        'Bước 3 - Tối ưu lưu trữ: Đánh lại partition và clustering key trên các bảng lớn để chặn triệt để việc quét toàn bộ bảng.',
        'Bước 4 - Phân tầng dữ liệu: Đẩy dữ liệu cũ (>90 ngày) ra object storage (S3/GCS) dưới dạng Parquet/Iceberg.',
      ],
    },
    solutionDetail: {
      en: 'Over 80% of warehouse bill spikes stem from unpartitioned full table scans triggered by automated BI dashboard refreshes, and compute warehouses left running idle with long auto-suspend timeouts.',
      vi: 'Hơn 80% trường hợp tăng vọt chi phí bắt nguồn từ việc dashboard BI tự động refresh quét toàn bộ bảng triệu dòng do thiếu partition, kết hợp máy chủ compute để thời gian chờ tắt quá lâu.',
    },
    tradeoffs: {
      en: 'Aggressive auto-suspend (60s) causes minor cold-start latency (1-2 seconds) when new queries arrive. This small tradeoff is easily justified by thousands of dollars in monthly savings.',
      vi: 'Cài đặt auto-suspend ngắn (60s) có thể gây trễ 1-2 giây khởi động lại máy chủ khi có query mới. Sự đánh đổi này hoàn toàn xứng đáng so với việc tiết kiệm hàng chục nghìn USD mỗi tháng.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Mentions inspecting query metadata history (INFORMATION_SCHEMA.QUERY_HISTORY).',
          'Identifies both compute costs (idle warehouses) and scanning costs (unpartitioned tables).',
          'Proposes automated guardrails like query cancellation timeouts and cost alerts.',
        ],
        vi: [
          'Biết sử dụng bảng siêu dữ liệu hệ thống (INFORMATION_SCHEMA.QUERY_HISTORY) để truy vết.',
          'Phân biệt rõ chi phí compute (máy chạy rảnh) và chi phí quét đĩa (full table scan).',
          'Đưa ra các hàng rào bảo vệ tự động như timeout hủy câu lệnh và cảnh báo ngân sách.',
        ],
      },
      redFlags: {
        en: [
          'Recommends randomly deleting tables or stopping all pipelines without data audit.',
          'Unaware of warehouse auto-suspend configuration mechanics.',
        ],
        vi: [
          'Đề xuất xóa bảng hoặc dừng pipeline một cách cảm tính mà không đo lường.',
          'Không biết đến cơ chế tự động tắt máy (auto-suspend) của các cloud data warehouse.',
        ],
      },
    },
    tags: ['FinOps', 'Cost Optimization', 'Snowflake / BigQuery', 'Partition Pruning', 'Cloud Architecture'],
  },
  {
    id: 'de-scenario-4',
    role: 'data-engineer',
    level: 'middle',
    category: 'architecture',
    companyContext: 'High-Growth Fintech (15 Microservices to Central Warehouse)',
    difficulty: 'Middle',
    title: {
      en: 'Upstream Schema Drift Breaking Downstream dbt Models',
      vi: 'Xử lý gãy pipeline khi dịch vụ Upstream tự ý đổi cấu trúc dữ liệu',
    },
    scenarioNarrative: {
      en: 'An upstream backend engineering team deploying a new microservice release renamed a core payload field `user_id` to `account_id` and changed its type from string to integer without notifying the data team. That night, 35 downstream dbt models broke, causing morning executive dashboards to display stale data.',
      vi: 'Một đội backend phát hành phiên bản mới đã tự ý đổi tên trường `user_id` thành `account_id` và đổi kiểu dữ liệu mà không báo trước cho đội data. Đêm hôm đó, 35 model dbt phía sau bị gãy hoàn toàn, khiến toàn bộ dashboard sáng hôm sau của ban lãnh đạo bị trắng dữ liệu.',
    },
    question: {
      en: 'What is your immediate tactical mitigation to unblock morning dashboards, and what long-term architectural framework (Data Contracts & Dead-Letter Queues) do you institute to prevent this permanently?',
      vi: 'Biện pháp chữa cháy khẩn cấp của bạn là gì để kịp cứu dashboard buổi sáng, và bạn thiết lập cơ chế kiến trúc dài hạn nào (Data Contracts & Dead-Letter Queue) để ngăn chặn vĩnh viễn sự cố này?',
    },
    idealAnswerFramework: {
      en: [
        'Tactical Fix: Implement schema-on-read defensive projection using COALESCE(account_id, user_id)::string in staging models.',
        'Root Cause: Lack of formal interface agreements between software engineering and data engineering.',
        'Long-term Solution 1 - Data Contracts: Enforce schema contracts using Protobuf / Avro schemas in Kafka or JSON Schema validation.',
        'Long-term Solution 2 - CI/CD Integration: Breaking schema changes in upstream PRs must fail CI build tests automatically.',
        'Long-term Solution 3 - Dead-Letter Queue (DLQ): Route malformed payloads to a DLQ for review instead of crashing the pipeline.',
      ],
      vi: [
        'Chữa cháy tức thời: Dùng kỹ thuật schema-on-read với COALESCE(account_id, user_id)::string ở tầng staging để cứu pipeline.',
        'Nguyên nhân cốt lõi: Thiếu cam kết giao diện dữ liệu (Data Contract) giữa đội làm ứng dụng và đội làm data.',
        'Kiến trúc dài hạn 1 - Data Contracts: Thiết lập hợp đồng dữ liệu chuẩn với Protobuf/Avro hoặc Schema Registry.',
        'Kiến trúc dài hạn 2 - CI/CD Guardrails: Chặn việc merge code nếu PR của upstream làm thay đổi schema vi phạm hợp đồng.',
        'Kiến trúc dài hạn 3 - Dead-Letter Queue: Đẩy các bản ghi sai lệch cấu trúc vào hàng đợi DLQ để cách ly thay vì làm sập toàn bộ DAG.',
      ],
    },
    solutionDetail: {
      en: 'Defensive pipeline engineering treats upstream data as untrusted. By enforcing Data Contracts at the boundary and isolating malformed records in a Dead-Letter Queue, upstream releases can never break downstream analytics.',
      vi: 'Kiến trúc pipeline phòng thủ coi dữ liệu upstream là không đáng tin cậy. Bằng cách áp dụng Data Contract ở ranh giới và cách ly bản ghi lỗi vào DLQ, việc phát hành của đội backend sẽ không bao giờ làm sập hệ thống phân tích.',
    },
    tradeoffs: {
      en: 'Strict Data Contracts slow down rapid prototyping for frontend/backend developers, but drastically increase data reliability and trust across the enterprise.',
      vi: 'Áp dụng Data Contract chặt chẽ có thể làm chậm tốc độ thử nghiệm tính năng mới của đội backend một chút, nhưng đổi lại mang lại sự tin cậy tuyệt đối cho dữ liệu doanh nghiệp.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Proposes a quick schema-on-read COALESCE hotfix for immediate SLA recovery.',
          'Advocates for Data Contracts and automated CI/CD schema validation tests.',
          'Understands the Dead-Letter Queue (DLQ) pattern.',
        ],
        vi: [
          'Đưa ra giải pháp chữa cháy nhanh bằng COALESCE ở tầng staging để kịp giờ họp.',
          'Ủng hộ việc xây dựng văn hóa Hợp đồng dữ liệu (Data Contracts) và kiểm thử CI/CD tự động.',
          'Nắm rõ mô hình hàng đợi Dead-Letter Queue (DLQ).',
        ],
      },
      redFlags: {
        en: [
          'Blames upstream team without proposing any defensive technical safeguards.',
          'Has no plan for handling unparseable historical records.',
        ],
        vi: [
          'Chỉ biết đổ lỗi cho đội backend mà không đưa ra giải pháp kỹ thuật phòng vệ.',
          'Không có phương án xử lý các bản ghi lỗi đã lỡ nạp vào hệ thống.',
        ],
      },
    },
    tags: ['Data Contracts', 'Schema Evolution', 'dbt', 'Data Governance', 'Dead-Letter Queue'],
  },
  {
    id: 'de-scenario-5',
    role: 'data-engineer',
    level: 'senior',
    category: 'incident',
    companyContext: 'B2B SaaS Multi-Tenant Lakehouse',
    difficulty: 'Senior',
    title: {
      en: 'Idempotent Historical Backfill in Multi-Tenant Lakehouse',
      vi: 'Kỹ thuật Backfill dữ liệu lịch sử Idempotent trên quy mô lớn',
    },
    scenarioNarrative: {
      en: 'A logic bug was discovered in a core revenue aggregation model: for the past 90 days, foreign exchange conversions for 50 enterprise clients were calculated using inverted rates. You must backfill 90 days of data across 200 million rows without blocking ongoing hourly pipelines and without creating duplicate records.',
      vi: 'Một lỗi logic nghiêm trọng được phát hiện trong model tính doanh thu: trong suốt 90 ngày qua, tỷ giá quy đổi ngoại tệ của 50 khách hàng doanh nghiệp bị tính ngược. Bạn phải chạy lại (backfill) dữ liệu 90 ngày trên 200 triệu dòng mà không làm gián đoạn luồng chạy hàng giờ và không tạo bản ghi trùng lặp.',
    },
    question: {
      en: 'How do you design an idempotent backfilling strategy using Dynamic Partition Overwrites and partition isolation in modern Lakehouse table formats (Delta Lake, Apache Iceberg)?',
      vi: 'Bạn thiết kế chiến lược Backfill có tính Idempotent thế nào bằng cơ chế Dynamic Partition Overwrite trong các định dạng bảng Lakehouse hiện đại (Delta Lake, Iceberg)?',
    },
    idealAnswerFramework: {
      en: [
        'Step 1: Ensure the table is partitioned by date (dt=YYYY-MM-DD).',
        'Step 2: Use Dynamic Partition Overwrite (INSERT OVERWRITE TABLE ... partition(dt)) so only affected dates are atomically replaced.',
        'Step 3: Leverage Lakehouse ACID transactions (Delta/Iceberg snapshot isolation) so readers see consistent data without locks.',
        'Step 4: Execute the backfill in throttled date batches (e.g. 7 days per batch) to avoid starving cluster compute from live pipelines.',
      ],
      vi: [
        'Bước 1: Đảm bảo bảng được phân vùng theo ngày (dt=YYYY-MM-DD).',
        'Bước 2: Sử dụng cơ chế Dynamic Partition Overwrite (INSERT OVERWRITE) để ghi đè nguyên tử đúng các ngày cần sửa.',
        'Bước 3: Tận dụng tính năng ACID của Delta Lake / Iceberg để việc ghi đè diễn ra atomic mà người đang đọc báo cáo không bị gián đoạn.',
        'Bước 4: Chia việc backfill thành từng lô nhỏ (mỗi lần 7 ngày) để không chiếm hết tài nguyên của pipeline hàng giờ.',
      ],
    },
    solutionDetail: {
      en: 'Dynamic partition overwriting guarantees that running a backfill for a specific date range cleanly replaces bad data without dropping the entire table or creating duplicate rows.',
      vi: 'Cơ chế Dynamic Partition Overwrite đảm bảo việc chạy lại dữ liệu cho một khoảng ngày cụ thể sẽ thay thế sạch sẽ dữ liệu sai mà không cần xóa toàn bộ bảng và không bao giờ sinh ra dòng trùng lặp.',
    },
    tradeoffs: {
      en: 'Overwriting partitions triggers metadata commits and creates new Parquet files. Regular `VACUUM` maintenance must be run afterward to clean up obsolete historical file versions.',
      vi: 'Ghi đè partition sẽ sinh ra các file Parquet phiên bản cũ. Cần lên lịch chạy lệnh `VACUUM` sau khi backfill xong để thu hồi dung lượng đĩa từ các snapshot cũ.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Emphasizes partition-level atomic overwrites instead of dangerous DELETE + INSERT.',
          'Explains ACID snapshot isolation in Lakehouse table formats.',
          'Considers concurrency throttling so backfills do not disrupt regular hourly production SLAs.',
        ],
        vi: [
          'Nhấn mạnh việc ghi đè nguyên tử theo partition thay vì chạy lệnh DELETE + INSERT thủ công nguy hiểm.',
          'Nắm vững cơ chế Snapshot Isolation trong Delta Lake / Apache Iceberg.',
          'Biết giới hạn luồng chạy để không tranh chấp tài nguyên với pipeline sản xuất.',
        ],
      },
      redFlags: {
        en: [
          'Suggests running DELETE FROM table WHERE date BETWEEN ... followed by regular INSERT, which creates race conditions and read downtime.',
          'Attempts backfilling 90 days in a single monolithic transaction, overwhelming cluster memory and causing executor OOM.',
        ],
        vi: [
          'Đề xuất chạy lệnh DELETE FROM rồi INSERT lại, gây gián đoạn và sai lệch nếu có ai đang truy vấn giữa 2 lệnh.',
          'Cố gắng backfill toàn bộ 90 ngày trong 1 transaction khổng lồ duy nhất làm cạn bộ nhớ và tràn OOM cluster.',
        ],
      },
    },
    tags: ['Backfill', 'Delta Lake', 'Apache Iceberg', 'Idempotency', 'Dynamic Partition Overwrite'],
  },
  {
    id: 'de-scenario-6',
    role: 'data-engineer',
    level: 'junior',
    category: 'foundational',
    companyContext: 'High-Volume Telemetry Platform',
    difficulty: 'Junior',
    title: {
      en: 'Row-Oriented (PostgreSQL) vs Column-Oriented (ClickHouse/Parquet) Storage',
      vi: 'So sánh kiến trúc lưu trữ dạng Dòng (PostgreSQL) và dạng Cột (ClickHouse/Parquet)',
    },
    scenarioNarrative: {
      en: 'An early-stage tech startup stored all user event telemetry inside a PostgreSQL operational database. Now with 100 million rows, analytic queries like `SELECT country, SUM(duration) FROM telemetry GROUP BY country` take 45 seconds and spike CPU to 100%. The team is considering migrating analytics to a columnar database like ClickHouse or DuckDB.',
      vi: 'Một startup ban đầu lưu toàn bộ sự kiện telemetry vào PostgreSQL. Khi dữ liệu chạm mốc 100 triệu dòng, câu truy vấn báo cáo `SELECT country, SUM(duration) FROM telemetry GROUP BY country` mất 45 giây và đẩy CPU lên 100%. Đội ngũ đang cân nhắc chuyển mảng phân tích sang cơ sở dữ liệu dạng cột như ClickHouse hoặc DuckDB.',
    },
    question: {
      en: 'Explain from a disk I/O and CPU perspective why Columnar Storage is 50x–100x faster for aggregate queries compared to traditional Row-Oriented databases.',
      vi: 'Hãy giải thích từ góc độ I/O đĩa cứng và tập lệnh CPU: tại sao cơ sở dữ liệu dạng cột lại nhanh hơn từ 50 đến 100 lần so với DB dạng dòng khi thực hiện các phép tính tổng hợp (Aggregation)?',
    },
    idealAnswerFramework: {
      en: [
        'Row Storage reads all columns of a row sequentially from disk into memory, wasting 95%+ of I/O when only 2 columns are needed.',
        'Columnar Storage stores each column in separate contiguous blocks on disk, reading strictly the required columns.',
        'Compression Efficiency: Identical data types stored together achieve 5x–10x compression ratios (LZ4, ZSTD, Dictionary encoding).',
        'SIMD Vectorization: Columnar arrays fit directly into CPU L1/L2 cache, processing millions of values per clock cycle.',
      ],
      vi: [
        'DB dạng Dòng lưu toàn bộ các cột cạnh nhau; muốn tính 2 cột phải đọc toàn bộ 50 cột từ đĩa lên RAM, lãng phí 95% I/O.',
        'DB dạng Cột lưu từng cột thành các file riêng biệt; câu query chỉ đọc đúng 2 cột `country` và `duration`, giảm tải I/O ngoạn mục.',
        'Hiệu quả nén: Dữ liệu cùng kiểu nằm cạnh nhau nén cực tốt (nén 5-10 lần bằng LZ4, ZSTD, Run-length encoding).',
        'Tận dụng SIMD của CPU: Các mảng số nạp trực tiếp vào CPU Cache, tính toán hàng triệu phép cộng trong 1 chu kỳ máy.',
      ],
    },
    solutionDetail: {
      en: 'OLTP databases optimize for random single-row point lookups and transactional ACID safety. OLAP columnar databases optimize for sequential scans over billions of numbers with minimal disk reads.',
      vi: 'DB dạng Dòng (OLTP) sinh ra để phục vụ đọc/ghi ngẫu nhiên từng dòng an toàn theo ACID. DB dạng Cột (OLAP) sinh ra để quét tuần tự hàng tỷ số liệu với số lần đọc đĩa tối thiểu.',
    },
    tradeoffs: {
      en: 'Columnar databases are terrible for single-row updates, point lookups, and transactional ACID guarantees. Maintain PostgreSQL for OLTP app traffic and replicate to ClickHouse/Snowflake for OLAP analytics.',
      vi: 'DB dạng Cột rất kém khi cập nhật từng dòng đơn lẻ, tìm kiếm theo khóa chính hoặc đảm bảo giao dịch ACID. Do đó luôn giữ Postgres cho app chạy và đồng bộ sang ClickHouse để làm phân tích.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Explains the disk I/O difference clearly (reading 2 columns vs reading entire row width).',
          'Mentions data compression ratios and CPU cache vectorization (SIMD).',
          'Recognizes that columnar storage is unsuitable for frequent transactional updates.',
        ],
        vi: [
          'Giải thích rõ ràng sự khác biệt về I/O đĩa (đọc đúng 2 cột thay vì đọc toàn bộ bề ngang của dòng).',
          'Nêu được tỷ lệ nén dữ liệu và khả năng tối ưu hóa CPU cache (SIMD).',
          'Hiểu rõ DB dạng cột không phù hợp cho các lệnh UPDATE dòng lẻ thường xuyên.',
        ],
      },
      redFlags: {
        en: [
          'Thinks columnar databases are just "PostgreSQL with more indexes".',
          'Does not understand why row storage wastes I/O during aggregations.',
        ],
        vi: [
          'Nghĩ rằng DB dạng cột chỉ đơn giản là "Postgres đánh nhiều index hơn".',
          'Không hiểu vì sao DB dạng dòng lại tốn I/O khi chạy hàm SUM/COUNT.',
        ],
      },
    },
    tags: ['Columnar Storage', 'ClickHouse', 'PostgreSQL', 'OLTP vs OLAP', 'SIMD Vectorization'],
  },

  // ==========================================
  // BACKEND ENGINEER (BE)
  // ==========================================
  {
    id: 'be-scenario-1',
    role: 'backend',
    level: 'senior',
    category: 'incident',
    companyContext: 'E-Commerce Mega Scale (Midnight Flash Sale)',
    difficulty: 'Senior',
    title: {
      en: 'Midnight Flash Sale Concurrency & Inventory Overselling',
      vi: 'Chống bán vượt tồn kho (Overselling) trong đợt Flash Sale 100k QPS',
    },
    scenarioNarrative: {
      en: 'During a midnight product drop, only 50 units of a limited-edition sneaker are available. In the first 3 seconds, 80,000 users hit the checkout API concurrently. The application begins throwing database lock timeout exceptions, connection pools saturate, and upon audit, 78 customers successfully paid for only 50 items (overselling disaster).',
      vi: 'Trong đợt mở bán giày giới hạn lúc nửa đêm, chỉ có đúng 50 đôi giày. Trong 3 giây đầu tiên, 80.000 người dùng bấm thanh toán cùng lúc. Ứng dụng bắt đầu báo lỗi timeout khóa database, connection pool bị nghẽn, và khi đối soát phát hiện có tới 78 khách hàng đã trừ tiền thành công dù kho chỉ có 50 đôi.',
    },
    question: {
      en: 'Why did naive `SELECT stock -> if stock > 0 -> UPDATE` fail? Compare Pessimistic Locking (`SELECT FOR UPDATE`), Conditional Atomic Decrement, and Redis Lua Pre-allocation.',
      vi: 'Tại sao cách viết thông thường `SELECT stock -> kiểm tra > 0 -> UPDATE` lại gây họa? So sánh 3 giải pháp: Pessimistic Locking (`SELECT FOR UPDATE`), Conditional Atomic Decrement, và Redis Lua Pre-allocation.',
    },
    idealAnswerFramework: {
      en: [
        'Root Cause: Race condition (Time-of-check to time-of-use flaw) - multiple threads read stock = 50 concurrently before any thread updates.',
        'Solution 1: Atomic UPDATE with condition (WHERE quantity >= 1) - single statement, no separate read.',
        'Solution 2: Pessimistic row locking (SELECT ... FOR UPDATE) - handles 500 QPS but collapses under 80k concurrent connections.',
        'Solution 3 (Enterprise Standard): Redis Lua Pre-allocation - in-memory atomic decrement with instant rejection of sold-out traffic, enqueuing valid orders to Kafka.',
      ],
      vi: [
        'Nguyên nhân gốc rễ: Race condition (Kiểm tra trước khi ghi) - hàng nghìn thread đọc thấy số lượng = 50 cùng lúc trước khi lệnh UPDATE kịp chạy.',
        'Giải pháp 1: Lệnh UPDATE nguyên tử có điều kiện (WHERE quantity >= 1) - thực thi trong 1 thao tác duy nhất.',
        'Giải pháp 2: Pessimistic Row Locking (SELECT FOR UPDATE) - an toàn nhưng chỉ chịu được ~500 QPS trên cùng 1 dòng trước khi sập hàng đợi khóa.',
        'Giải pháp 3 (Chuẩn doanh nghiệp lớn): Redis Lua Pre-allocation - trừ số lượng trên RAM trong <1ms, từ chối ngay 79.950 người đến sau và đẩy 50 đơn hợp lệ vào hàng đợi để DB xử lý dần.',
      ],
    },
    solutionDetail: {
      en: 'At high concurrency, database row locks become a severe bottleneck. Decoupling stock validation into an in-memory Redis Lua script protects the relational database from collapsing while guaranteeing zero overselling.',
      vi: 'Ở mức tải đồng thời cao, khóa hàng trên database sẽ trở thành nút thắt cổ chai chết người. Tách việc trừ tồn kho ra Redis chạy Lua script trong RAM giúp bảo vệ database không bị sập và triệt tiêu hoàn toàn nguy cơ bán vượt.',
    },
    codeSnippet: `-- Method 1: Atomic Single Statement (Zero Overselling at DB Level)
UPDATE product_inventory 
SET quantity = quantity - 1, updated_at = NOW()
WHERE product_id = 4920 AND quantity >= 1
RETURNING quantity; -- If 0 rows returned, item is SOLD OUT

-- Method 2: Redis Lua Script for 100k QPS In-Memory Pre-Allocation
local stock = redis.call('get', KEYS[1])
if not stock or tonumber(stock) < tonumber(ARGV[1]) then
    return 0 -- Rejected immediately, stock exhausted
end
return redis.call('decrby', KEYS[1], ARGV[1])`,
    tradeoffs: {
      en: 'Redis pre-allocation introduces eventual consistency and requires robust refund logic if a user abandons payment within their 15-minute reservation window.',
      vi: 'Dùng Redis đòi hỏi phải xử lý bài toán hoàn tồn kho (Refund stock) cẩn thận khi khách hàng giữ chỗ nhưng không thanh toán trong thời hạn 15 phút.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Recognizes that checking stock in application code is an inherent race condition.',
          'Proposes atomic conditional UPDATE as the baseline database safeguard.',
          'Articulates why Redis in-memory pre-allocation is required to handle 80,000+ QPS.',
        ],
        vi: [
          'Chỉ rõ việc đọc stock lên code application rồi mới kiểm tra là nguyên nhân trực tiếp gây race condition.',
          'Nắm vững câu UPDATE nguyên tử có điều kiện (WHERE quantity >= 1).',
          'Biết cách dùng Redis Lua làm bộ đệm để hấp thụ lưu lượng 80.000 QPS.',
        ],
      },
      redFlags: {
        en: [
          'Suggests using application-level mutexes (e.g. synchronized block), which fails across multi-node servers.',
          'Advocates SELECT FOR UPDATE on a single row under 80,000 QPS, unaware of lock contention collapse.',
        ],
        vi: [
          'Đề xuất dùng mutex/lock trong code ứng dụng (không có tác dụng khi chạy nhiều server load balancing).',
          'Nghĩ rằng SELECT FOR UPDATE có thể gánh được 80.000 kết nối chọc vào cùng 1 dòng.',
        ],
      },
    },
    tags: ['Concurrency', 'Flash Sale', 'Row Locking', 'Atomic Update', 'Redis Lua'],
  },
  {
    id: 'be-scenario-2',
    role: 'backend',
    level: 'middle',
    category: 'architecture',
    companyContext: 'High-Traffic SaaS (4,000 QPS 24/7)',
    difficulty: 'Middle',
    title: {
      en: 'Zero-Downtime Schema Migration on a 100-Million-Row Live Table',
      vi: 'Migration không gián đoạn trên bảng 100 triệu dòng có 4.000 QPS',
    },
    scenarioNarrative: {
      en: 'You must add a new column `loyalty_tier` (NOT NULL with default "basic") and an index on a 100-million-row `users` table. The application serves 4,000 requests/second continuously. Running standard `ALTER TABLE` and `CREATE INDEX` commands will request an AccessExclusiveLock, blocking all reads and writes and taking down production.',
      vi: 'Bạn cần thêm cột mới `loyalty_tier` (NOT NULL, mặc định là "basic") và đánh index trên bảng `users` 100 triệu bản ghi. Ứng dụng chạy liên tục 4.000 request/giây. Nếu chạy `ALTER TABLE` và `CREATE INDEX` thông thường, lệnh sẽ giữ AccessExclusiveLock chặn toàn bộ đọc/ghi và đánh sập hệ thống.',
    },
    question: {
      en: 'Explain how to execute this schema migration with zero downtime. How do PostgreSQL 11+ metadata-only defaults, `lock_timeout`, and `CREATE INDEX CONCURRENTLY` work together?',
      vi: 'Làm thế nào để thực hiện đợt migration này với 0 giây gián đoạn (Zero-Downtime)? Cơ chế cập nhật metadata trong PostgreSQL 11+, tham số `lock_timeout` và lệnh `CREATE INDEX CONCURRENTLY` phối hợp ra sao?',
    },
    idealAnswerFramework: {
      en: [
        'Step 1: Set a strict local lock_timeout (e.g. 2s) so the DDL statement fails fast if blocked instead of queueing up production traffic.',
        'Step 2: In PG 11+, adding a column with constant DEFAULT NOT NULL only updates the catalog metadata in <10ms without table rewrites.',
        'Step 3: Always use CREATE INDEX CONCURRENTLY to build indexes without taking an exclusive table lock.',
        'Step 4: Verify index validity in pg_index after creation.',
      ],
      vi: [
        'Bước 1: Luôn thiết lập lock_timeout ngắn (vd: 2s) để lệnh DDL tự hủy ngay nếu bị vướng lock, tránh làm kẹt các truy vấn của khách hàng.',
        'Bước 2: Từ PostgreSQL 11+, thêm cột có DEFAULT hằng số chỉ tốn <10ms vì nó chỉ sửa catalog metadata chứ không viết lại 100 triệu dòng.',
        'Bước 3: Luôn tạo index bằng lệnh CREATE INDEX CONCURRENTLY để không chặn các câu lệnh SELECT/INSERT/UPDATE.',
        'Bước 4: Kiểm tra cờ indisvalid trong pg_index sau khi tạo để đảm bảo index không bị lỗi.',
      ],
    },
    solutionDetail: {
      en: 'Setting lock_timeout prevents the DDL statement from waiting behind long-running queries and queueing up all subsequent incoming traffic, preventing catastrophic connection pool exhaustion.',
      vi: 'Thiết lập lock_timeout ngăn lệnh DDL đứng xếp hàng sau các câu query dài, tránh hiện tượng tắc đường dây chuyền làm cạn kiệt connection pool.',
    },
    codeSnippet: `-- Step 1: Set safe lock timeout
SET lock_timeout = '2s';

-- Step 2: Metadata-only column addition in PG 11+ (<10ms)
ALTER TABLE users ADD COLUMN loyalty_tier VARCHAR(20) DEFAULT 'basic' NOT NULL;

-- Step 3: Build index concurrently (takes ShareUpdateExclusiveLock, writes stay alive)
CREATE INDEX CONCURRENTLY idx_users_loyalty_tier ON users (loyalty_tier);

-- Step 4: Verify index validity
SELECT indexrelid::regclass, indisvalid FROM pg_index 
WHERE indexrelid = 'idx_users_loyalty_tier'::regclass;`,
    tradeoffs: {
      en: 'CREATE INDEX CONCURRENTLY takes 2x to 3x longer to finish and consumes more CPU/IO, but guarantees 100% service uptime for users.',
      vi: 'Tạo index CONCURRENTLY tốn thời gian gấp 2-3 lần và tiêu tốn CPU/IO hơn, nhưng đổi lại hệ thống hoạt động 100% không bị gián đoạn dù chỉ 1 giây.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Highlights lock_timeout as the #1 safety measure for production DDL.',
          'Mentions PG 11+ metadata-only constant default optimization.',
          'Insists on CREATE INDEX CONCURRENTLY and checking indisvalid.',
        ],
        vi: [
          'Nêu bật lock_timeout là vũ khí an toàn số 1 khi chạy DDL trên production.',
          'Biết tối ưu hóa sửa metadata của PostgreSQL 11+ khi thêm cột DEFAULT.',
          'Nhất quyết dùng CREATE INDEX CONCURRENTLY và biết kiểm tra cờ indisvalid.',
        ],
      },
      redFlags: {
        en: [
          'Runs naive CREATE INDEX on a 100M row live table during business hours.',
          'Unaware that DDL statements queue locks and block all subsequent SELECT queries.',
        ],
        vi: [
          'Chạy lệnh CREATE INDEX thường trên bảng 100 triệu dòng lúc đang có khách.',
          'Không hiểu cơ chế xếp hàng khóa (Lock Queue) của DDL làm tắc nghẽn cả hệ thống.',
        ],
      },
    },
    tags: ['Zero Downtime', 'Schema Migration', 'PostgreSQL DDL', 'CREATE INDEX CONCURRENTLY', 'lock_timeout'],
  },
  {
    id: 'be-scenario-3',
    role: 'backend',
    level: 'senior',
    category: 'architecture',
    companyContext: 'Fintech / Peer-to-Peer Money Transfers',
    difficulty: 'Senior',
    title: {
      en: 'Distributed Deadlocks in Multi-Account Money Transfers',
      vi: 'Xử lý Deadlock phân tán trong giao dịch chuyển tiền giữa các tài khoản',
    },
    scenarioNarrative: {
      en: 'In a digital wallet platform, Alice transfers $50 to Bob at the exact millisecond Bob transfers $30 to Alice. Tx1 locks Alice\'s account and waits for Bob\'s account. Tx2 locks Bob\'s account and waits for Alice\'s account. Both transactions freeze until PostgreSQL detects a deadlock (error 40P01) and aborts one of them, resulting in failed customer transfers.',
      vi: 'Trong ứng dụng ví điện tử, Alice chuyển 50k cho Bob đúng tích tắc Bob chuyển 30k cho Alice. Giao dịch 1 khóa tài khoản Alice và chờ khóa tài khoản Bob. Giao dịch 2 khóa tài khoản Bob và chờ khóa tài khoản Alice. Cả 2 giao dịch bị treo cho đến khi PostgreSQL phát hiện deadlock (mã lỗi 40P01) và tự hủy một giao dịch.',
    },
    question: {
      en: 'How do you eliminate transfer deadlocks at the database architecture level using Deterministic Lock Ordering? What application-level retry policy and idempotency guards are required?',
      vi: 'Làm thế nào để triệt tiêu hoàn toàn deadlock ở tầng kiến trúc database bằng kỹ thuật Chuẩn hóa thứ tự khóa (Deterministic Lock Ordering)? Cần cơ chế retry và idempotency ra sao?',
    },
    idealAnswerFramework: {
      en: [
        'Deadlocks require a cyclic lock wait dependency (Tx1 waits for Tx2, Tx2 waits for Tx1).',
        'Solution: Deterministic Lock Ordering - Always sort account IDs in ascending order (min(A, B) then max(A, B)) before acquiring locks.',
        'Because all transactions lock resources in identical order, cyclic waits are mathematically impossible.',
        'Application retry: Even with deterministic locking, handle network drops and 40P01 with exponential backoff jitter.',
        'Idempotency Key: Store unique transfer idempotency keys to ensure retries never execute duplicate transfers.',
      ],
      vi: [
        'Bản chất Deadlock là do chu trình chờ khóa (Tx1 chờ Tx2, Tx2 chờ Tx1).',
        'Giải pháp cốt lõi: Deterministic Lock Ordering - Luôn sắp xếp ID tài khoản tăng dần (khóa ID nhỏ trước, ID lớn sau).',
        'Vì mọi giao dịch đều khóa tài nguyên theo cùng một chiều, việc tạo thành chu trình là điều không thể xảy ra.',
        'Cơ chế ứng dụng: Vẫn cần xử lý retry tự động kèm exponential backoff khi gặp lỗi mạng.',
        'Idempotency Key: Lưu mã giao dịch duy nhất trong bảng sổ cái để việc retry không bao giờ trừ tiền 2 lần.',
      ],
    },
    solutionDetail: {
      en: 'By enforcing an ordering convention (lock smaller ID first), all transactions flow in the same direction along the resource dependency graph, completely preventing circular wait states.',
      vi: 'Bằng cách chuẩn hóa thứ tự khóa (luôn khóa ID nhỏ trước), mọi transaction đều di chuyển theo cùng một chiều trên đồ thị tài nguyên, loại bỏ triệt để tình trạng chờ đợi vòng tròn.',
    },
    codeSnippet: `-- Always sort IDs in application code before querying:
-- const [firstId, secondId] = [fromId, toId].sort((a, b) => a - b);

SELECT id, balance 
FROM user_accounts 
WHERE id IN (101, 205) 
ORDER BY id ASC 
FOR UPDATE;

-- Perform balance deductions safely within the locked transaction
UPDATE user_accounts SET balance = balance - 50 WHERE id = 101;
UPDATE user_accounts SET balance = balance + 50 WHERE id = 205;`,
    tradeoffs: {
      en: 'Deterministic ordering requires application logic to know all participant resource IDs before acquiring locks, which works cleanly for 2 accounts but requires careful planning for multi-party escrow.',
      vi: 'Chuẩn hóa thứ tự khóa đòi hỏi code phải biết trước toàn bộ danh sách ID cần khóa trước khi mở transaction. Rất dễ làm với 2 tài khoản, nhưng với giao dịch nhiều bên cần quy chuẩn rõ ràng.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Identifies circular wait as the root cause of deadlocks.',
          'Proposes deterministic sorting of resource IDs (min then max).',
          'Mentions application retry with exponential backoff and idempotency keys.',
        ],
        vi: [
          'Chỉ ra chu trình chờ đợi (circular wait) là nguyên nhân cốt lõi sinh ra deadlock.',
          'Đưa ra giải pháp chuẩn hóa sắp xếp ID tăng dần trước khi SELECT FOR UPDATE.',
          'Nhắc đến cơ chế retry tự động có backoff và mã Idempotency Key.',
        ],
      },
      redFlags: {
        en: [
          'Suggests increasing deadlock_timeout, which merely prolongs how long threads hang.',
          'Proposes optimistic locking without retry handling.',
        ],
        vi: [
          'Đề xuất tăng timeout của deadlock (chỉ làm các thread bị treo lâu hơn).',
          'Không có phương án phòng chống trừ tiền 2 lần khi client bấm thử lại.',
        ],
      },
    },
    tags: ['Deadlock', 'Transactions', 'SELECT FOR UPDATE', 'Fintech', 'Idempotency'],
  },
  {
    id: 'be-scenario-4',
    role: 'backend',
    level: 'junior',
    category: 'foundational',
    companyContext: 'Public Search API (Millions of Catalog Items)',
    difficulty: 'Junior',
    title: {
      en: 'Deep Pagination Timeout on Search APIs: Keyset vs OFFSET',
      vi: 'Khắc phục Timeout khi phân trang sâu: Keyset Pagination vs OFFSET',
    },
    scenarioNarrative: {
      en: 'A public e-commerce catalog API uses standard `OFFSET` and `LIMIT`. When web crawlers or users paginate deeply (e.g. page 15,000 using `OFFSET 300000 LIMIT 20`), API response latency degrades from 8ms to 6,200ms, causing database worker saturation and gateway timeouts.',
      vi: 'Một API danh mục sản phẩm công khai dùng phân trang `OFFSET` và `LIMIT`. Khi bot tìm kiếm hoặc người dùng cuộn sâu (vd: trang 15.000 với `OFFSET 300000 LIMIT 20`), thời gian phản hồi API vọt từ 8ms lên 6,2 giây, làm nghẽn toàn bộ worker và gây lỗi Gateway Timeout.',
    },
    question: {
      en: 'Why does PostgreSQL slow down linearly with high `OFFSET` values? How does Keyset Pagination (Cursor-based) solve this in O(1) time?',
      vi: 'Tại sao PostgreSQL lại bị chậm dần theo tỷ lệ thuận với giá trị `OFFSET` lớn? Phương pháp Keyset Pagination (Cursor-based) giải quyết triệt để vấn đề này trong thời gian O(1) như thế nào?',
    },
    idealAnswerFramework: {
      en: [
        'Explain OFFSET N mechanics: The engine must scan and discard all N rows before returning the requested 20 rows.',
        'With OFFSET 300,000, PostgreSQL reads 300,020 tuples from disk/buffers and throws 300,000 away.',
        'Keyset Pagination solution: Pass the last seen item ID/timestamp as a cursor in the WHERE clause.',
        'The B-tree index seeks directly to the target record in O(log N) time and reads strictly 20 rows.',
      ],
      vi: [
        'Giải thích cơ chế OFFSET N: Engine buộc phải quét và vứt bỏ toàn bộ N dòng trước đó mới lấy được 20 dòng yêu cầu.',
        'Với OFFSET 300.000, DB phải đọc 300.020 bản ghi từ đĩa/RAM rồi vứt bỏ 300.000 bản ghi.',
        'Giải pháp Keyset: Truyền ID hoặc timestamp của bản ghi cuối cùng làm con trỏ (cursor) trong mệnh đề WHERE.',
        'Chỉ mục B-Tree nhảy trực tiếp tới vị trí con trỏ trong O(log N) và chỉ đọc đúng 20 dòng cần thiết.',
      ],
    },
    solutionDetail: {
      en: 'Keyset pagination eliminates discarded tuple scans entirely. Regardless of whether you are fetching page 1 or page 50,000, query response time remains constant at under 5ms.',
      vi: 'Keyset pagination loại bỏ hoàn toàn việc đọc các dòng dư thừa. Dù bạn đang ở trang 1 hay trang 50.000, thời gian phản hồi vẫn ổn định ở mức dưới 5ms.',
    },
    codeSnippet: `-- Inefficient: Scans and throws away 300,000 rows
SELECT id, title, price FROM products 
ORDER BY id DESC OFFSET 300000 LIMIT 20;

-- Optimal Keyset Pagination: O(1) seek via B-Tree index
SELECT id, title, price FROM products 
WHERE id < 8923410 -- Cursor from previous page
ORDER BY id DESC 
LIMIT 20;`,
    tradeoffs: {
      en: 'Keyset pagination cannot jump to an arbitrary page number (e.g. "Jump to Page 42"). It is designed for Infinite Scroll, Next/Previous feeds, and bulk data export APIs.',
      vi: 'Keyset pagination không cho phép nhảy cóc tới một số trang ngẫu nhiên (như "Đến trang 42"), nhưng hoàn hảo cho cuộn vô tận (Infinite Scroll), nút Trang tiếp và API xuất dữ liệu.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Articulates that OFFSET N must physically read and discard N tuples.',
          'Writes clean keyset cursor WHERE predicates utilizing indexed columns.',
          'Acknowledges the UI trade-off (no random page jump).',
        ],
        vi: [
          'Nêu rõ bản chất OFFSET N phải đọc vật lý và vứt bỏ N dòng trước đó.',
          'Viết câu lệnh WHERE dùng con trỏ cursor trên cột có index chuẩn xác.',
          'Nêu được sự đánh đổi về mặt UI (không nhảy cóc số trang ngẫu nhiên được).',
        ],
      },
      redFlags: {
        en: [
          'Thinks adding more RAM or index will fix high OFFSET performance.',
          'Does not understand why OFFSET is O(N) complexity.',
        ],
        vi: [
          'Nghĩ rằng mua thêm RAM hay đánh thêm index sẽ giúp câu lệnh OFFSET lớn chạy nhanh.',
          'Không hiểu độ phức tạp O(N) của mệnh đề OFFSET.',
        ],
      },
    },
    tags: ['Keyset Pagination', 'OFFSET Bottleneck', 'Cursor API', 'B-Tree Seek', 'Performance Tuning'],
  },
  {
    id: 'be-scenario-5',
    role: 'backend',
    level: 'senior',
    category: 'architecture',
    companyContext: 'Fintech Payment Processing (Stripe / PayPal API)',
    difficulty: 'Senior',
    title: {
      en: 'Idempotency & Double Charge Prevention in Distributed Retries',
      vi: 'Cơ chế Idempotency & Phòng chống trừ tiền 2 lần khi mạng Retry',
    },
    scenarioNarrative: {
      en: 'In a payment microservice, a customer clicks "Pay $100". The request reaches the server, the charge is authorized, but the return network connection drops before the client receives the HTTP 200 response. The mobile app automatically retries the request 3 times, causing the customer to be billed $400.',
      vi: 'Trong dịch vụ thanh toán, khách hàng bấm "Thanh toán $100". Request tới server, thẻ đã bị trừ tiền, nhưng mạng bị rớt trước khi client kịp nhận phản hồi HTTP 200. Ứng dụng mobile tự động retry 3 lần, khiến khách hàng bị trừ tiền 4 lần thành $400.',
    },
    question: {
      en: 'How do you design a database-backed Idempotency Layer using unique constraints and state machines to ensure duplicate retries return the original result without re-executing charges?',
      vi: 'Bạn thiết kế tầng Idempotency thế nào bằng ràng buộc UNIQUE trên database và máy trạng thái (State Machine) để đảm bảo việc retry luôn trả về kết quả ban đầu mà không trừ tiền lần 2?',
    },
    idealAnswerFramework: {
      en: [
        'Client generates a unique UUID (Idempotency-Key header) for each logical payment intent.',
        'Server inserts the key into an `idempotency_keys` table with status = IN_PROGRESS under a UNIQUE constraint.',
        'If a duplicate request arrives while IN_PROGRESS, return HTTP 409 Conflict or wait.',
        'When payment completes, atomically update status = COMPLETED and save the response payload.',
        'Subsequent retries hit the UNIQUE record, see COMPLETED, and return the cached response immediately without calling payment processors.',
      ],
      vi: [
        'Client sinh một mã UUID duy nhất (Header Idempotency-Key) cho mỗi ý định thanh toán.',
        'Server lưu key này vào bảng `idempotency_keys` với trạng thái IN_PROGRESS kèm ràng buộc UNIQUE.',
        'Nếu request trùng ập vào lúc đang IN_PROGRESS, trả về HTTP 409 Conflict hoặc bắt chờ.',
        'Khi thanh toán xong, cập nhật trạng thái COMPLETED và lưu luôn response payload vào bảng.',
        'Các request retry sau đó chạm vào bản ghi UNIQUE, thấy đã COMPLETED sẽ trả ngay response cũ mà không gọi sang cổng thanh toán lần nào nữa.',
      ],
    },
    solutionDetail: {
      en: 'Database unique constraints provide the foundational guarantee of distributed idempotency. By anchoring idempotency to an atomic insert, race conditions between concurrent duplicate retries are safely rejected.',
      vi: 'Ràng buộc UNIQUE trên database chính là nền tảng cốt lõi của tính Idempotent phân tán. Dựa vào thao tác chèn nguyên tử, các request gửi trùng nhau đồng thời đều bị chặn đứng an toàn.',
    },
    codeSnippet: `CREATE TABLE payment_idempotency (
  idempotency_key VARCHAR(64) PRIMARY KEY,
  user_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'IN_PROGRESS', 'COMPLETED', 'FAILED'
  response_code INT,
  response_body JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attempt atomic claim:
INSERT INTO payment_idempotency (idempotency_key, user_id, status)
VALUES ('idem_9f823a-482a', 1042, 'IN_PROGRESS')
ON CONFLICT (idempotency_key) DO NOTHING;
-- If rows affected == 0, key already exists -> return cached response!`,
    tradeoffs: {
      en: 'Storing response payloads requires storage cleanup. Institute a TTL retention policy (e.g. auto-delete idempotency keys after 24–48 hours).',
      vi: 'Lưu response payload sẽ tốn dung lượng đĩa. Cần có chính sách dọn dẹp TTL (tự động xóa key sau 24–48 giờ vì sau đó client sẽ không retry nữa).',
    },
    rubric: {
      greenFlags: {
        en: [
          'Understands client-generated idempotency keys (UUID / SHA256).',
          'Leverages database UNIQUE constraints for atomic concurrency control.',
          'Distinguishes between requests in-flight (IN_PROGRESS) vs finished (COMPLETED).',
        ],
        vi: [
          'Hiểu rõ cơ chế client sinh mã Idempotency Key (UUID).',
          'Tận dụng ràng buộc UNIQUE trên database để kiểm soát đồng thời.',
          'Phân biệt rõ trạng thái đang xử lý (IN_PROGRESS) và đã xong (COMPLETED).',
        ],
      },
      redFlags: {
        en: [
          'Suggests storing idempotency keys in Redis without persistence or transactions, risking double charges on cache eviction.',
          'Relies solely on checking transaction count via SELECT without unique constraints.',
        ],
        vi: [
          'Đề xuất lưu key vào Redis không có cơ chế bền vững, nếu Redis bị xóa cache khách sẽ bị trừ tiền lần 2.',
          'Chỉ kiểm tra bằng lệnh SELECT đơn thuần không có ràng buộc UNIQUE.',
        ],
      },
    },
    tags: ['Idempotency', 'Payment Systems', 'Distributed Systems', 'Unique Constraint', 'Fintech'],
  },
  {
    id: 'be-scenario-6',
    role: 'backend',
    level: 'middle',
    category: 'foundational',
    companyContext: 'High-Scale REST & GraphQL Microservices',
    difficulty: 'Middle',
    title: {
      en: 'The N+1 Query Problem in ORMs and GraphQL Resolvers',
      vi: 'Triệt tiêu bài toán N+1 Query trong ORM và GraphQL Resolvers',
    },
    scenarioNarrative: {
      en: 'A mobile user feed endpoint loads 50 posts. Under load testing, database connection pools are saturated. APM profiling reveals that loading 50 posts triggered 1 query to fetch posts, followed by 50 individual queries to fetch author profiles, and another 50 queries to fetch like counts (101 total queries for 1 HTTP request).',
      vi: 'Endpoint bảng tin mobile tải 50 bài viết. Khi test tải, database connection pool bị cạn sạch. Kết quả đo APM cho thấy để hiển thị 50 bài viết, hệ thống đã chạy 1 query lấy danh sách bài, sau đó chạy thêm 50 query con lấy tác giả, và 50 query con nữa đếm like (tổng cộng 101 câu query chỉ cho 1 request HTTP).',
    },
    question: {
      en: 'What causes the N+1 query problem in ORMs (Hibernate, Prisma, TypeORM) and GraphQL? How do batch fetching (DataLoader) and JOIN consolidation eliminate this?',
      vi: 'Nguyên nhân nào gây ra lỗi N+1 Query trong ORM và GraphQL? Kỹ thuật nạp theo mẻ (Batch Fetching / DataLoader) và gom lệnh JOIN triệt tiêu lỗi này như thế nào?',
    },
    idealAnswerFramework: {
      en: [
        'Root Cause: Lazy loading in ORMs / nested field resolvers in GraphQL executing queries inside loops.',
        'Solution 1 (Relational SQL): Consolidate into a single JOIN query with aggregate functions.',
        'Solution 2 (Application Layer): Use DataLoader pattern to batch IDs across concurrent resolvers into a single `WHERE id IN (...)` query.',
        'Explain why 1 query fetching 50 items is 50x faster than 50 individual queries (network latency & connection overhead).',
      ],
      vi: [
        'Nguyên nhân: Cơ chế Lazy Loading trong ORM hoặc các hàm resolver lồng nhau trong GraphQL chạy truy vấn bên trong vòng lặp.',
        'Giải pháp 1 (Tầng SQL): Gom thành 1 câu lệnh JOIN duy nhất kèm hàm tổng hợp.',
        'Giải pháp 2 (Tầng Application): Dùng pattern DataLoader để gom các ID cần lấy lại và nạp 1 mẻ duy nhất bằng `WHERE id IN (...)`.',
        'Giải thích vì sao 1 query lấy 50 dòng nhanh hơn 50 lần so với 50 query lấy 1 dòng (chi phí network roundtrip và connection overhead).',
      ],
    },
    solutionDetail: {
      en: 'Each database query incurs TCP roundtrip latency, parsing overhead, and connection acquisition. Consolidating N queries into a single batched query drops network roundtrips from 101 down to 2.',
      vi: 'Mỗi câu query đều tốn độ trễ mạng TCP roundtrip, phân tích cú pháp và chiếm giữ connection. Gom N câu query lại giúp giảm từ 101 lượt gọi mạng xuống chỉ còn 2 lượt.',
    },
    codeSnippet: `-- Bad: Executed 50 times in a loop
SELECT * FROM users WHERE id = 101;

-- Optimal: Batch fetched in 1 query via DataLoader
SELECT * FROM users WHERE id IN (101, 102, 103, ..., 150);

-- Or Consolidated relational JOIN
SELECT 
  p.id, p.content, p.created_at,
  u.name AS author_name,
  COUNT(l.id) AS likes_count
FROM posts p
JOIN users u ON p.author_id = u.id
LEFT JOIN post_likes l ON p.id = l.post_id
WHERE p.status = 'PUBLISHED'
GROUP BY p.id, u.name
ORDER BY p.created_at DESC LIMIT 50;`,
    tradeoffs: {
      en: 'Wide multi-table JOINs can return duplicated parent column data across rows. Batch fetching with DataLoader (`WHERE id IN (...)`) is often cleaner and easier to cache in microservices.',
      vi: 'Lệnh JOIN nhiều bảng lớn có thể làm lặp lại dữ liệu cột cha trên đường truyền. Nạp theo mẻ bằng DataLoader (`WHERE id IN`) thường gọn gàng hơn và rất dễ gắn cache.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Understands the network latency penalty of multiple DB roundtrips.',
          'Mentions DataLoader / Batching as the modern solution for GraphQL and microservices.',
          'Identifies eager loading vs lazy loading trade-offs.',
        ],
        vi: [
          'Chỉ ra tổn thất lớn nhất của N+1 là độ trễ mạng (Network Roundtrip) chứ không chỉ riêng CPU.',
          'Nhắc đến pattern DataLoader là giải pháp tiêu chuẩn cho GraphQL và microservices.',
          'Phân biệt rõ Eager Loading vs Lazy Loading.',
        ],
      },
      redFlags: {
        en: [
          'Thinks adding an index on author_id solves the N+1 problem (it still executes 50 separate queries).',
          'Suggests caching individual queries in Redis without addressing the underlying loop explosion.',
        ],
        vi: [
          'Tưởng rằng đánh index trên cột author_id sẽ sửa được lỗi N+1 (thực chất nó vẫn phải chạy 50 câu query riêng biệt).',
          'Đề xuất gắn cache Redis cho từng câu lẻ mà không giải quyết tận gốc việc vòng lặp bắn hàng trăm truy vấn.',
        ],
      },
    },
    tags: ['N+1 Queries', 'ORM', 'GraphQL', 'DataLoader', 'Performance Tuning'],
  },

  // ==========================================
  // DATABASE ADMINISTRATOR / ARCHITECT (DBA)
  // ==========================================
  {
    id: 'dba-scenario-1',
    role: 'dba',
    level: 'senior',
    category: 'incident',
    companyContext: 'Core Banking / E-Commerce Gateway',
    difficulty: 'Staff',
    title: {
      en: 'Production Emergency: CPU 100% & Connection Pool Exhaustion',
      vi: 'Quy trình xử lý sự cố khẩn cấp: CPU 100% & Cạn kiệt Connection Pool',
    },
    scenarioNarrative: {
      en: 'At 11:30 AM peak traffic, monitoring alerts scream: Primary database CPU hits 100%, active connections reach `max_connections = 300`, and all customer API requests are timing out with 504 errors. As the on-call database architect, you have 5 minutes to restore database stability before payment gateways automatically fail over.',
      vi: 'Lúc 11h30 trưa giờ cao điểm, còi báo động réo: CPU máy chủ DB chính chạm 100%, số lượng kết nối chạm trần `max_connections = 300`, toàn bộ API khách hàng bị timeout 504. Là kiến trúc sư DB trực chiến, bạn có 5 phút để lấy lại sự ổn định cho database trước khi các cổng thanh toán tự động ngắt kết nối.',
    },
    question: {
      en: 'What is your forensic triage runbook? How do you inspect `pg_stat_activity`, distinguish between CPU-burners vs Lock-blockers, terminate rogue sessions safely, and enforce PgBouncer transaction pooling?',
      vi: 'Quy trình xử lý sự cố khẩn cấp (Runbook) của bạn gồm những bước nào? Cách soi `pg_stat_activity` để phân biệt query ăn CPU vs query giữ khóa, hủy phiên an toàn và cấu hình PgBouncer transaction mode ra sao?',
    },
    idealAnswerFramework: {
      en: [
        'Step 1: Check pg_stat_activity for long-running queries (>30s) and sessions in "idle in transaction".',
        'Step 2: Identify lock contention trees - find the root blocker session holding exclusive table locks.',
        'Step 3: Terminate the top blocker using pg_cancel_backend() (graceful) or pg_terminate_backend() (immediate).',
        'Step 4: Set global statement_timeout and idle_in_transaction_session_timeout to prevent future cascading hangs.',
        'Step 5: Architectural root cause: Route traffic through PgBouncer in transaction mode to collapse 3,000 app threads into 30 dedicated DB processes.',
      ],
      vi: [
        'Bước 1: Soi `pg_stat_activity` tìm các câu chạy quá lâu (>30s) và các phiên bị treo ở trạng thái "idle in transaction".',
        'Bước 2: Vẽ cây lock để tìm phiên đầu đàn (Root Blocker) đang giữ AccessExclusiveLock khiến hàng trăm phiên khác xếp hàng chờ.',
        'Bước 3: Hủy phiên thủ phạm bằng pg_cancel_backend() (hủy êm) hoặc pg_terminate_backend() (ngắt kết nối ngay).',
        'Bước 4: Cài đặt statement_timeout và idle_in_transaction_session_timeout để chống nghẽn dây chuyền.',
        'Bước 5: Khắc phục kiến trúc: Dẫn luồng qua PgBouncer ở chế độ Transaction Pooling để gom 3.000 luồng ứng dụng xuống còn 30 kết nối máy chủ thật.',
      ],
    },
    solutionDetail: {
      en: 'In PostgreSQL, each connection is an OS process consuming ~10MB RAM. When 300 processes spin on CPU locks, the OS context-switching overhead causes total system collapse. Terminating root blockers and enforcing connection pooling restores stability immediately.',
      vi: 'Trong PostgreSQL, mỗi connection là 1 tiến trình hệ điều hành tốn ~10MB RAM. Khi 300 tiến trình cùng tranh chấp CPU và khóa, chi phí context switch của OS sẽ bóp nghẹt server. Ngắt phiên cầm đầu và bật PgBouncer sẽ cứu sống hệ thống tức thì.',
    },
    codeSnippet: `-- 1. Find long running queries & blockers
SELECT pid, now() - query_start AS duration, state, query 
FROM pg_stat_activity 
WHERE state != 'idle' AND (now() - query_start) > interval '30 seconds'
ORDER BY duration DESC LIMIT 5;

-- 2. Find sessions in "idle in transaction" holding locks
SELECT pid, now() - state_change AS idle_duration, query 
FROM pg_stat_activity 
WHERE state = 'idle in transaction'
ORDER BY idle_duration DESC;

-- 3. Terminate the blocker PID
SELECT pg_terminate_backend(14902);

-- 4. Apply emergency timeout guardrails
ALTER SYSTEM SET statement_timeout = '15s';
ALTER SYSTEM SET idle_in_transaction_session_timeout = '10s';
SELECT pg_reload_conf();`,
    tradeoffs: {
      en: 'Terminating active queries causes transient errors for those specific users, but prevents complete system outage for hundreds of thousands of active shoppers.',
      vi: 'Hủy query đang chạy sẽ khiến một vài người dùng gặp lỗi thử lại, nhưng cứu được toàn bộ hệ sinh thái của hàng trăm nghìn khách hàng khác không bị sập hoàn toàn.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Remains calm and executes a structured forensic runbook rather than restarting the DB server.',
          'Distinguishes between pg_cancel_backend (cancels query) and pg_terminate_backend (kills connection).',
          'Identifies "idle in transaction" as a major silent killer of database locks.',
          'Recommends PgBouncer transaction pooling as the architectural fix.',
        ],
        vi: [
          'Bình tĩnh thực hiện runbook bài bản thay vì hoảng loạn khởi động lại server DB.',
          'Phân biệt rõ pg_cancel_backend (chỉ hủy query) vs pg_terminate_backend (ngắt luôn kết nối).',
          'Chỉ ra trạng thái "idle in transaction" là sát thủ giấu mặt giữ khóa lâu nhất.',
          'Khẳng định PgBouncer transaction pooling là lời giải kiến trúc dài hạn bắt buộc.',
        ],
      },
      redFlags: {
        en: [
          'Suggests rebooting the database server (which triggers long crash recovery and prolonged downtime).',
          'Suggests blindly increasing max_connections to 2,000, which will crash server RAM.',
        ],
        vi: [
          'Đề xuất restart máy chủ DB (sẽ phải chạy crash recovery đọc WAL mất hàng chục phút chết cứng).',
          'Đề xuất tăng bừa max_connections lên 2.000 (sẽ làm tràn RAM và kernel OOM-killer bắn hạ DB).',
        ],
      },
    },
    tags: ['Incident Triage', 'CPU 100%', 'pg_stat_activity', 'PgBouncer', 'Lock Contention'],
  },
  {
    id: 'dba-scenario-2',
    role: 'dba',
    level: 'middle',
    category: 'incident',
    companyContext: 'AdTech / High-Frequency UPDATE Workloads',
    difficulty: 'Middle',
    title: {
      en: 'Table Bloat & Autovacuum Tuning under 50M Daily UPDATEs',
      vi: 'Xử lý Table Bloat & Cấu hình Autovacuum khi có 50M lượt UPDATE/ngày',
    },
    scenarioNarrative: {
      en: 'A high-velocity campaign tracking table with 10 million active rows has ballooned in disk size from 8GB to 115GB. Sequential scans are 15x slower because queries must scan through 100GB of dead tuples created by continuous UPDATE statements. Running `VACUUM FULL` will take an AccessExclusiveLock and freeze the database for 3 hours.',
      vi: 'Một bảng theo dõi chiến dịch quảng cáo có 10 triệu dòng thực tế chỉ nặng 8GB nhưng đã phình to lên tới 115GB trên đĩa cứng. Các câu truy vấn quét bảng bị chậm 15 lần vì phải đọc qua 100GB rác (dead tuples) do lệnh UPDATE liên tục sinh ra. Nếu chạy lệnh `VACUUM FULL`, bảng sẽ bị khóa chết trong suốt 3 tiếng.',
    },
    question: {
      en: 'Explain why PostgreSQL UPDATEs create dead tuples (MVCC mechanics). How do you tune table-level autovacuum parameters and use `pg_repack` to reclaim 100GB of disk space online without blocking writes?',
      vi: 'Giải thích tại sao lệnh UPDATE trong PostgreSQL lại sinh ra dead tuples (cơ chế MVCC). Làm thế nào để cấu hình lại autovacuum riêng cho bảng nóng và dùng `pg_repack` để thu hồi 100GB đĩa online mà không khóa bảng?',
    },
    idealAnswerFramework: {
      en: [
        'MVCC Mechanics: In PostgreSQL, an UPDATE is internally an INSERT of a new row version and marking the old row version with xmax as a dead tuple.',
        'Autovacuum Defect: Default autovacuum_vacuum_scale_factor = 0.2 means 20% of a table must change before vacuum triggers (2M rows on 10M table).',
        'Solution 1: Tune table-level autovacuum scale factor down to 2% (0.02) and increase cost limit so it vacuums continuously.',
        'Solution 2: Use pg_repack extension to build a clean copy of the table in the background and swap files in <1ms without taking exclusive locks.',
      ],
      vi: [
        'Cơ chế MVCC: Trong Postgres, bản chất của UPDATE là INSERT dòng mới và đánh dấu dòng cũ bằng xmax biến thành dead tuple.',
        'Hạn chế của Autovacuum mặc định: Hệ số autovacuum_vacuum_scale_factor = 0.2 đòi hỏi 20% bảng thay đổi mới kích hoạt dọn rác (bảng 10M dòng phải đợi 2M dòng thay đổi).',
        'Giải pháp 1: Hạ scale factor xuống 2% (0.02) cho riêng bảng nóng và tăng cost limit để autovacuum dọn rác thường xuyên hơn.',
        'Giải pháp 2: Sử dụng công cụ `pg_repack` để tái tạo bảng sạch ở chế độ nền và tráo đổi trong vài mili-giây mà không hề khóa đọc/ghi của ứng dụng.',
      ],
    },
    solutionDetail: {
      en: 'By lowering the table-level autovacuum scale factor, dead tuples are cleaned up promptly, allowing page space to be reused for new row versions (HOT updates) and preventing table bloat from ever occurring again.',
      vi: 'Hạ autovacuum scale factor riêng cho bảng nóng giúp dead tuples được dọn dẹp liên tục, giải phóng không gian block cho các cập nhật HOT Update kế tiếp và triệt tiêu vĩnh viễn nguy cơ phình to dữ liệu.',
    },
    codeSnippet: `-- 1. Tune autovacuum aggressively for the hot table
ALTER TABLE campaign_stats SET (
  autovacuum_vacuum_scale_factor = 0.02, -- Trigger after 2% changes
  autovacuum_vacuum_cost_limit = 2000,   -- Grant more I/O quota
  autovacuum_vacuum_cost_delay = 2       -- Minimize delay between cycles
);

-- 2. Online zero-downtime compaction via terminal:
-- $ pg_repack -d analytics_db -t campaign_stats`,
    tradeoffs: {
      en: 'More aggressive autovacuum consumes storage I/O bandwidth. It must be throttled with `autovacuum_vacuum_cost_limit` to prevent competing with user transaction IOPS.',
      vi: 'Chạy autovacuum mạnh sẽ tiêu tốn băng thông I/O của ổ cứng. Cần giới hạn bằng cost_limit hợp lý để không tranh chấp tài nguyên đĩa với các giao dịch của khách hàng.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Explains that UPDATE = DELETE (old tuple) + INSERT (new tuple) in PostgreSQL MVCC.',
          'Explains why VACUUM FULL is dangerous in production due to AccessExclusiveLock.',
          'Recommends table-level tuning and online tools like pg_repack.',
        ],
        vi: [
          'Nêu đúng bản chất UPDATE = DELETE dòng cũ + INSERT dòng mới trong MVCC của PostgreSQL.',
          'Cảnh báo nguy cơ của lệnh VACUUM FULL vì nó chiếm AccessExclusiveLock khóa bảng hàng tiếng.',
          'Đưa ra giải pháp cấu hình riêng ở cấp bảng và công cụ online pg_repack.',
        ],
      },
      redFlags: {
        en: [
          'Recommends running VACUUM FULL during production peak hours.',
          'Believes standard VACUUM returns disk space to the OS (it only marks pages reusable for Postgres).',
        ],
        vi: [
          'Khuyên chạy lệnh VACUUM FULL lúc ban ngày đang có người dùng.',
          'Nghĩ rằng lệnh VACUUM thường sẽ trả dung lượng đĩa về cho hệ điều hành (thực chất nó chỉ đánh dấu block để Postgres tái sử dụng).',
        ],
      },
    },
    tags: ['Table Bloat', 'MVCC Internals', 'Autovacuum', 'pg_repack', 'Storage Forensics'],
  },
  {
    id: 'dba-scenario-3',
    role: 'dba',
    level: 'junior',
    category: 'architecture',
    companyContext: 'High-Traffic Social Platform (Read Replicas Cluster)',
    difficulty: 'Junior',
    title: {
      en: 'Asynchronous Read Replica Lag & Read-Your-Own-Writes Consistency',
      vi: 'Khắc phục độ trễ Read Replica & Cơ chế Read-Your-Own-Writes',
    },
    scenarioNarrative: {
      en: 'To scale read throughput, application queries are routed to an asynchronous Read Replica. Users complain that immediately after creating a new post or editing their profile, hitting refresh displays their old data for 2 to 5 seconds. Frustrated users submit the same post 3 times, polluting the database with duplicate records.',
      vi: 'Để mở rộng khả năng đọc, hệ thống định tuyến các truy vấn đọc sang cụm Read Replica bất đồng bộ. Người dùng phàn nàn rằng ngay sau khi đăng bài hoặc sửa hồ sơ, bấm F5 lại thấy dữ liệu cũ trong 2 đến 5 giây. Người dùng tưởng lỗi nên bấm đăng lại 3 lần gây trùng lặp dữ liệu.',
    },
    question: {
      en: 'What causes replication lag in PostgreSQL? Compare Synchronous Replication vs the "Read-Your-Own-Writes" routing pattern (Session-Sticky routing & LSN tracking).',
      vi: 'Nguyên nhân nào gây ra Replication Lag trong PostgreSQL? So sánh giữa cấu hình Nhân bản đồng bộ (Synchronous Replication) và mô hình định tuyến "Read-Your-Own-Writes"?',
    },
    idealAnswerFramework: {
      en: [
        'Root Cause: Asynchronous replication replays WAL logs on replicas with slight network and disk replay delay.',
        'Synchronous Replication trade-off: Guarantees zero lag, but slows down every WRITE transaction by waiting for replica network acknowledgments (primary freezes if replica dies).',
        'Solution: "Read-Your-Own-Writes" routing pattern - When user executes a write, set a temporary session cookie/flag for 5 seconds.',
        'During those 5 seconds, route that specific user\'s read queries directly to the Primary database; all other public reads go to Replicas.',
      ],
      vi: [
        'Nguyên nhân: Nhân bản bất đồng bộ đọc và nạp lại WAL trên replica luôn có độ trễ do mạng và tốc độ ghi đĩa của máy replica.',
        'Đánh đổi của Synchronous Replication: Hết sạch trễ, nhưng làm chậm mọi lệnh GHI vì phải chờ replica xác nhận qua mạng (nếu replica đơ, primary cũng treo theo).',
        'Giải pháp tối ưu: Mô hình "Read-Your-Own-Writes" - Khi user vừa thực hiện thao tác ghi, gắn cờ vào session cookie trong 5 giây.',
        'Trong 5 giây này, mọi request đọc của riêng user đó được gửi thẳng về Primary; tất cả các lượt đọc của người khác vẫn xem ở Replica bình thường.',
      ],
    },
    solutionDetail: {
      en: 'The Read-Your-Own-Writes pattern provides flawless perceived consistency for the active author while keeping 99% of read traffic offloaded to read replicas without compromising write throughput.',
      vi: 'Mô hình Read-Your-Own-Writes đem lại cảm giác tức thì hoàn hảo cho chính người vừa thao tác ghi, trong khi vẫn giảm tải được 99% lưu lượng đọc cho cụm replica mà không làm chậm tốc độ ghi.',
    },
    codeSnippet: `-- Monitor replication lag on Primary:
SELECT 
  client_addr, 
  state, 
  sync_state,
  pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS lag_bytes,
  ROUND(EXTRACT(EPOCH FROM (now() - reply_time)), 2) AS lag_seconds
FROM pg_stat_replication;`,
    tradeoffs: {
      en: 'Routing recent writers to Primary slightly increases Primary read load. The sticky window should be kept short (3–5 seconds) to prevent overloading the primary.',
      vi: 'Điều hướng người vừa ghi về Primary sẽ làm tăng tải đọc trên Primary một chút. Cần giữ cửa sổ thời gian ngắn (3-5 giây) để không làm dồn tải về máy chính.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Understands the latency trade-off of Synchronous vs Asynchronous replication.',
          'Proposes session-sticky or LSN-based Read-Your-Own-Writes routing.',
          'Knows how to inspect replication lag via `pg_stat_replication`.',
        ],
        vi: [
          'Phân tích sâu sắc sự đánh đổi giữa Replication đồng bộ và bất đồng bộ.',
          'Đưa ra giải pháp định tuyến Read-Your-Own-Writes thông minh dựa trên session.',
          'Biết câu lệnh kiểm tra độ trễ replica qua bảng `pg_stat_replication`.',
        ],
      },
      redFlags: {
        en: [
          'Suggests switching to synchronous replication without mentioning the severe write throughput penalty.',
          'Tells the frontend to simply add a `sleep(5000)` delay before refreshing.',
        ],
        vi: [
          'Khuyên bật đồng bộ hoàn toàn mà không lường trước việc toàn bộ hệ thống ghi sẽ bị chậm lại.',
          'Khuyên frontend chỉ cần dùng hàm sleep chờ 5 giây trước khi cho reload.',
        ],
      },
    },
    tags: ['Replication Lag', 'Read Replicas', 'Read-Your-Own-Writes', 'High Availability', 'Distributed Data'],
  },
  {
    id: 'dba-scenario-4',
    role: 'dba',
    level: 'senior',
    category: 'incident',
    companyContext: 'High-Volume Enterprise Database (Billions of Transactions)',
    difficulty: 'Staff',
    title: {
      en: 'PostgreSQL MVCC & Transaction ID Wraparound Freeze Prevention',
      vi: 'Cơ chế MVCC & Phòng chống thảm họa Transaction ID Wraparound',
    },
    scenarioNarrative: {
      en: 'In PostgreSQL, Transaction IDs (XIDs) are 32-bit unsigned integers (~4.2 billion values). Because numbers wrap around modulo 2^32, a transaction from 2 billion transactions ago could suddenly appear to be in the "future", making historical data permanently invisible. To prevent catastrophic data corruption, PostgreSQL will forcibly shut down and refuse all connections when remaining XIDs drop below a safety threshold.',
      vi: 'Trong PostgreSQL, Transaction ID (XID) là số nguyên không dấu 32-bit (khoảng 4,2 tỷ giá trị). Vì số sẽ bị quay vòng sau 2^32, một giao dịch từ 2 tỷ giao dịch trước có thể bất ngờ bị coi là giao dịch trong "tương lai", khiến dữ liệu cũ biến mất vĩnh viễn. Để phòng ngừa thảm họa mất dữ liệu này, PostgreSQL sẽ tự động ngắt kết nối và từ chối khởi động nếu số XID còn lại rơi xuống dưới ngưỡng an toàn.',
    },
    question: {
      en: 'Explain how PostgreSQL Autovacuum Freeze prevents Transaction ID Wraparound. How do you monitor `datfrozenxid` and recover if a database enters emergency single-user maintenance mode?',
      vi: 'Hãy giải thích cơ chế Autovacuum Freeze trong PostgreSQL giải quyết vấn đề quay vòng Transaction ID như thế nào. Bạn giám sát `datfrozenxid` ra sao và quy trình xử lý khẩn cấp ở chế độ single-user mode nếu DB bị cưỡng chế dừng?',
    },
    idealAnswerFramework: {
      en: [
        'MVCC XID Space: PostgreSQL uses modular arithmetic where 2 billion XIDs are in the past and 2 billion are in the future.',
        'Freeze Mechanism: Autovacuum freeze marks old tuples with a special frozen bit (FrozenTransactionId), indicating they are committed in the permanent past.',
        'Monitoring: Monitor `datfrozenxid` and `age(datfrozenxid)` in `pg_database`. Alert if age exceeds 150 million transactions.',
        'Emergency Recovery: If forced into emergency shutdown, start PostgreSQL in single-user mode (`postgres --single -D ...`) and manually run `VACUUM FREEZE ANALYZE;`.',
      ],
      vi: [
        'Không gian XID của MVCC: Postgres chia vòng tròn 4 tỷ số thành 2 tỷ số trong quá khứ và 2 tỷ số trong tương lai.',
        'Cơ chế Freeze: Autovacuum freeze đánh dấu các bản ghi cũ thành Frozen (FrozenTransactionId), xác nhận chúng thuộc về quá khứ vĩnh cửu.',
        'Giám sát: Theo dõi `age(datfrozenxid)` trong bảng `pg_database`. Cảnh báo ngay nếu age vượt quá 150 triệu giao dịch.',
        'Khắc phục khẩn cấp: Nếu DB bị khóa cưỡng chế, phải khởi động PostgreSQL ở chế độ đơn người dùng (single-user mode: `postgres --single -D ...`) và chạy lệnh `VACUUM FREEZE ANALYZE;`.',
      ],
    },
    solutionDetail: {
      en: 'Transaction ID Wraparound is the most dangerous failure mode in PostgreSQL. Proactive autovacuum freeze tuning and Prometheus alerts on `datfrozenxid` ensure the database never reaches the emergency shutdown threshold.',
      vi: 'Transaction ID Wraparound là lỗi nguy hiểm nhất trong PostgreSQL. Giám sát chủ động `datfrozenxid` và cấu hình autovacuum freeze đúng cách giúp database không bao giờ chạm đến ngưỡng buộc phải dừng hoạt động.',
    },
    codeSnippet: `-- Monitor age of oldest unfrozen XID per database:
SELECT 
  datname, 
  age(datfrozenxid) AS xid_age,
  2000000000 - age(datfrozenxid) AS xids_until_forced_shutdown
FROM pg_database 
ORDER BY xid_age DESC;

-- Proactive table-level freeze:
VACUUM FREEZE ANALYZE hot_transaction_table;`,
    tradeoffs: {
      en: 'Vacuum freeze reads and rewrites table pages to set frozen bits, which generates heavy write I/O. Schedule deep freezing during weekend maintenance windows.',
      vi: 'Lệnh Vacuum Freeze phải đọc và ghi lại các block của bảng để đánh dấu frozen bit, sinh ra I/O đĩa rất lớn. Nên lên lịch freeze sâu vào các khung giờ bảo trì cuối tuần.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Understands 32-bit XID circular modulo arithmetic.',
          'Knows the exact monitoring query for age(datfrozenxid).',
          'Knows that single-user mode is required if forced shutdown occurs.',
        ],
        vi: [
          'Hiểu sâu cơ chế số học vòng tròn 32-bit của Transaction ID trong Postgres.',
          'Nắm vững câu truy vấn giám sát age(datfrozenxid) trên pg_database.',
          'Biết quy trình mở chế độ Single-user mode để cứu hộ nếu hệ thống bị khóa.',
        ],
      },
      redFlags: {
        en: [
          'Has never heard of Transaction ID Wraparound or thinks it can be solved by dropping indexes.',
          'Suggests restarting the server repeatedly without single-user maintenance mode, causing crash loops.',
        ],
        vi: [
          'Chưa từng nghe đến Transaction ID Wraparound hoặc tưởng xóa index là hết lỗi.',
          'Đề xuất restart máy chủ liên tục mà không vào chế độ single-user mode cứu hộ, khiến database bị crash loop.',
        ],
      },
    },
    tags: ['MVCC', 'Transaction ID Wraparound', 'Vacuum Freeze', 'Disaster Recovery', 'PostgreSQL Internals'],
  },
  {
    id: 'dba-scenario-5',
    role: 'dba',
    level: 'middle',
    category: 'incident',
    companyContext: 'High-Volume Production Database (Large Table Maintenance)',
    difficulty: 'Middle',
    title: {
      en: 'Safely Dropping a 200GB Unused Table in Production',
      vi: 'Quy trình DROP an toàn bảng 200GB không dùng đến trên Production',
    },
    scenarioNarrative: {
      en: 'During storage cleanup, engineering discovers an obsolete 200GB log table that is no longer referenced by application code. A junior engineer runs `DROP TABLE old_logs;` directly on production. The entire database immediately freezes for 18 seconds, dropping all active customer connections and triggering failover alarms.',
      vi: 'Trong đợt dọn dẹp đĩa, đội ngũ phát hiện một bảng log cũ nặng 200GB không còn được code sử dụng. Một bạn junior chạy thẳng lệnh `DROP TABLE old_logs;` trên production. Toàn bộ database lập tức bị đơ cứng (freeze) trong 18 giây, làm rớt hàng nghìn kết nối của khách hàng và kích hoạt báo động.',
    },
    question: {
      en: 'Why did running `DROP TABLE` freeze the entire PostgreSQL cluster? What is the safe, progressive operational procedure to delete multi-hundred-gigabyte tables without I/O stalls?',
      vi: 'Tại sao lệnh `DROP TABLE` lại làm đóng băng cả cụm máy chủ PostgreSQL? Quy trình an toàn từng bước để xóa các bảng hàng trăm GB mà không gây nghẽn I/O là gì?',
    },
    idealAnswerFramework: {
      en: [
        'Root Cause 1: DROP TABLE takes AccessExclusiveLock, blocking any stray queries referencing the table.',
        'Root Cause 2: OS filesystem freeze - When a 200GB table is unlinked, the Linux kernel holds filesystem locks while releasing thousands of ext4/xfs extents, stalling disk I/O and shared_buffers checkpoints.',
        'Safe Step 1: Set lock_timeout to prevent queueing locks.',
        'Safe Step 2: Soft rename the table first (`ALTER TABLE old_logs RENAME TO ...`) to verify in production that no code still queries it.',
        'Safe Step 3: Hardlink trick or progressive chunked TRUNCATE / shrinking before dropping.',
      ],
      vi: [
        'Nguyên nhân 1: Lệnh DROP TABLE chiếm AccessExclusiveLock chặn mọi truy vấn nếu còn sót lại code gọi tới.',
        'Nguyên nhân 2: Hiện tượng Filesystem I/O Freeze của Linux kernel - khi xóa đột ngột file 200GB, hệ điều hành phải giải phóng hàng triệu block extents cùng lúc, gây tắc nghẽn I/O làm toàn bộ database bị khựng lại.',
        'Bước an toàn 1: Luôn đặt `lock_timeout` trước.',
        'Bước an toàn 2: Đổi tên bảng trước (Soft Rename: `ALTER TABLE old_logs RENAME TO ...`) để kiểm chứng trên production rằng không còn luồng nào chọc vào.',
        'Bước an toàn 3: Dùng kỹ thuật hardlink trên Linux hoặc chia nhỏ truncate từng phân vùng trước khi drop hẳn.',
      ],
    },
    solutionDetail: {
      en: 'By soft-renaming the table first and using Linux hard links (`ln table_file table_file.bak`), PostgreSQL unlinks the catalog in milliseconds, and the physical 200GB file is subsequently truncated in small 100MB chunks via an asynchronous script without kernel stalls.',
      vi: 'Bằng cách đổi tên bảng trước và dùng kỹ thuật hardlink trên Linux (`ln file file.bak`), Postgres chỉ cần xóa metadata trong vài mili-giây, còn file vật lý 200GB sẽ được cắt nhỏ từ từ ngoài OS bằng script chạy ngầm mà kernel không bị nghẽn.',
    },
    codeSnippet: `-- Safe Step 1: Guard with lock timeout
SET lock_timeout = '2s';

-- Safe Step 2: Soft rename first to verify no application impact
ALTER TABLE old_logs RENAME TO old_logs_pending_drop;

-- (Wait 48 hours to confirm zero errors in logs)

-- Safe Step 3: Empty table contents before dropping
TRUNCATE TABLE old_logs_pending_drop;
DROP TABLE old_logs_pending_drop;`,
    tradeoffs: {
      en: 'The progressive hardlink cleanup procedure requires SSH/OS shell access to the database server host, which may be restricted in managed cloud databases (RDS/Cloud SQL). On managed services, truncate during low-traffic maintenance windows.',
      vi: 'Kỹ thuật hardlink cần quyền SSH vào máy chủ Linux, điều này có thể bị hạn chế trên các dịch vụ Managed Database (RDS/Cloud SQL). Trên cloud, ta thực hiện TRUNCATE vào khung giờ bảo trì thấp điểm nhất.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Explains the OS filesystem unlink stall on large multi-gigabyte files.',
          'Proposes renaming the table first as a safety buffer period.',
          'Applies lock_timeout before executing destructive DDL.',
        ],
        vi: [
          'Giải thích được hiện tượng nghẽn I/O của hệ điều hành Linux khi unlink file lớn.',
          'Đưa ra bước đổi tên bảng trước để tạo khoảng đệm an toàn kiểm chứng.',
          'Luôn cài đặt lock_timeout trước khi chạy DDL phá hủy.',
        ],
      },
      redFlags: {
        en: [
          'Believes dropping an unused table has zero performance impact.',
          'Runs DROP TABLE inside a long open transaction block.',
        ],
        vi: [
          'Nghĩ rằng bảng không dùng thì DROP lúc nào cũng không ảnh hưởng gì.',
          'Chạy lệnh DROP TABLE bên trong một transaction mở dài.',
        ],
      },
    },
    tags: ['Safe DDL', 'Production Operations', 'Disk I/O Freeze', 'Table Deletion'],
  },
  {
    id: 'dba-scenario-6',
    role: 'dba',
    level: 'senior',
    category: 'architecture',
    companyContext: 'High-Availability Multi-Zone Cluster (Zero Data Loss)',
    difficulty: 'Senior',
    title: {
      en: 'Database High Availability, Automatic Failover & Split-Brain Prevention',
      vi: 'Kiến trúc High Availability, Tự động Failover & Chống hiện tượng Split-Brain',
    },
    scenarioNarrative: {
      en: 'In a multi-zone PostgreSQL High Availability cluster, a transient network partition isolates the Primary database from the standby replica for 45 seconds. The automated orchestrator assumes the Primary died and promotes the Standby to Primary. Once network connectivity restores, BOTH database servers believe they are the writable Primary, accepting conflicting writes from split clients (Split-Brain disaster).',
      vi: 'Trong cụm PostgreSQL High Availability đa vùng, sự cố mạng chập chờn làm mất kết nối giữa máy Primary và Replica trong 45 giây. Hệ thống tự động tưởng máy Primary đã chết nên bầu máy Replica lên làm Primary mới. Khi mạng thông lại, CẢ HAI máy đều tưởng mình là Primary và cùng nhận dữ liệu ghi từ client (Thảm họa Split-Brain).',
    },
    question: {
      en: 'How do modern HA orchestrators (Patroni with Raft/etcd/Consul) guarantee consensus and enforce Node Fencing (STONITH) to make Split-Brain mathematically impossible?',
      vi: 'Các hệ thống HA hiện đại (như Patroni kết hợp etcd/Consul dùng thuật toán Raft) đảm bảo sự đồng thuận (Consensus) và cơ chế Node Fencing (STONITH) như thế nào để triệt tiêu nguy cơ Split-Brain?',
    },
    idealAnswerFramework: {
      en: [
        'Explain Split-Brain: Two writable primaries create diverged WAL timelines that cannot be merged without data loss.',
        'Consensus Quorum: Use distributed consensus engines (etcd / Consul with Raft algorithm) requiring a strict majority vote (Quorum = N/2 + 1).',
        'Leader Key Lease (TTL): The primary holds an ephemeral leader lock in etcd that it must refresh every 10 seconds. If isolated, its lease expires automatically.',
        'Node Fencing (STONITH): Shoot The Other Node In The Head - Ensure isolated primaries forcefully demote themselves to read-only or terminate before promotion occurs.',
      ],
      vi: [
        'Bản chất Split-Brain: Hai máy cùng ghi sẽ tạo ra 2 nhánh lịch sử WAL phân kỳ không thể gộp lại mà không mất dữ liệu.',
        'Thuật toán đồng thuận (Consensus Quorum): Dùng etcd / Consul với thuật toán Raft yêu cầu đa số tuyệt đối (Quorum = N/2 + 1) mới được bầu chọn.',
        'Leader Key Lease (Khóa thuê định kỳ): Primary phải liên tục làm mới hợp đồng giữ khóa trên etcd mỗi 10 giây. Nếu bị cô lập, khóa tự hết hạn.',
        'Node Fencing (STONITH): Cơ chế tự sát / cách ly - Primary khi mất kết nối với etcd phải tự động giáng cấp xuống read-only hoặc tự ngắt kết nối trước khi máy mới được đôn lên.',
      ],
    },
    solutionDetail: {
      en: 'By relying on Patroni and an etcd distributed consensus quorum with strict leader key TTLs, an isolated database node will automatically demote itself to read-only the second its lease expires, guaranteeing that there is only ever exactly one writable primary.',
      vi: 'Nhờ vào Patroni và cụm đồng thuận etcd với cơ chế Leader Lease có thời hạn, một máy bị cô lập mạng sẽ tự động giáng cấp về read-only ngay khi hết hạn giữ khóa, đảm bảo tại mọi thời điểm chỉ có duy nhất 1 máy Primary có quyền ghi.',
    },
    tradeoffs: {
      en: 'Requiring a strict consensus quorum (3 or 5 nodes) means that if more than half the DCS nodes fail, the cluster will deliberately lock down writes to prevent data corruption.',
      vi: 'Yêu cầu đa số đồng thuận (Quorum 3 hoặc 5 node) đồng nghĩa nếu mất hơn một nửa số node etcd, cụm DB sẽ chủ động khóa ghi để bảo vệ tính toàn vẹn dữ liệu.',
    },
    rubric: {
      greenFlags: {
        en: [
          'Articulates the mathematical necessity of consensus quorums (N/2 + 1 nodes).',
          'Mentions modern HA tooling (Patroni, etcd, Raft algorithm).',
          'Explains Node Fencing / STONITH and lease heartbeat expiration.',
        ],
        vi: [
          'Giải thích được nguyên lý đa số Quorum (N/2 + 1) trong hệ thống phân tán.',
          'Nhắc đến công cụ HA chuẩn công nghiệp hiện nay (Patroni, etcd, thuật toán Raft).',
          'Hiểu rõ cơ chế Node Fencing / STONITH và tự giáng cấp khi hết hạn thuê khóa.',
        ],
      },
      redFlags: {
        en: [
          'Suggests simple heartbeat scripts without consensus mechanisms, which guarantees split-brain under network partitions.',
          'Has no concept of WAL timeline divergence.',
        ],
        vi: [
          'Đề xuất dùng script ping đơn giản không có thuật toán đồng thuận (chắc chắn sẽ bị split-brain khi mạng lag).',
          'Không hiểu hiện tượng phân kỳ dòng thời gian WAL khi có 2 máy cùng ghi.',
        ],
      },
    },
    tags: ['High Availability', 'Patroni', 'Split-Brain', 'Consensus / Raft', 'Failover'],
  },
];
