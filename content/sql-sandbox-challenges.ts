export type Text = [en: string, vi: string];

export type SqlSandboxChallenge = {
  id: string;
  lessonId: string;
  number: number;
  level: 'basic' | 'intermediate' | 'advanced';
  topic: Text;
  title: Text;
  scenario: Text;
  task: Text;
  tables: string[];
  starterSql: string;
  solutionSql: string;
  referenceSql: string;
  ordered: boolean;
  hints: Text[];
  explanation: Text;
  expectedColumns?: string[];
};

export const sqlSandboxChallenges: SqlSandboxChallenge[] = [
  // -------------------------------------------------------------
  // LEVEL: BASIC (CƠ BẢN)
  // -------------------------------------------------------------
  {
    id: 'sql-sb-01-select',
    lessonId: 'select',
    number: 1,
    level: 'basic',
    topic: ['SELECT & ALIAS', 'SELECT & ĐỔI TÊN CỘT'],
    title: ['Customer Directory & Contact Info', 'Danh bạ khách hàng Hà Nội & Đổi tên cột'],
    scenario: [
      'The Marketing team in Hanoi needs a list of all local customers with formatted contact columns for an email campaign.',
      'Đội ngũ Marketing tại chi nhánh Hà Nội cần danh sách liên hệ gồm tên khách và email với tên cột chuẩn hóa để chuẩn bị chiến dịch gửi thư mời.'
    ],
    task: [
      'Select customer name renamed as "customer_name" and email renamed as "contact_email" from the "customers" table for customers living in "Hanoi". Order by "id" in ascending order.',
      'Viết câu lệnh SELECT lấy cột name (đổi tên thành customer_name) và email (đổi tên thành contact_email) từ bảng customers với điều kiện city = \'Hanoi\'. Sắp xếp tăng dần theo id.'
    ],
    tables: ['customers'],
    starterSql: `-- Đề bài 01: Lấy danh sách khách hàng tại Hà Nội
-- Chọn cột name đổi tên thành customer_name, email đổi tên thành contact_email
SELECT
  name AS customer_name,
  email AS contact_email
FROM customers
WHERE city = 'Hanoi'
ORDER BY id ASC;`,
    solutionSql: `SELECT
  name AS customer_name,
  email AS contact_email
FROM customers
WHERE city = 'Hanoi'
ORDER BY id ASC;`,
    referenceSql: `SELECT name AS customer_name, email AS contact_email FROM customers WHERE city = 'Hanoi' ORDER BY id ASC;`,
    ordered: true,
    hints: [
      ['Use AS keyword to rename columns: name AS customer_name, email AS contact_email.', 'Dùng từ khóa AS để đổi tên cột: name AS customer_name, email AS contact_email.'],
      ['Filter for Hanoi with WHERE city = \'Hanoi\'. Text values in SQL are enclosed in single quotes.', 'Lọc thành phố với điều kiện WHERE city = \'Hanoi\'. Lưu ý giá trị chuỗi đặt trong dấu nháy đơn.']
    ],
    explanation: [
      'SELECT allows returning specific columns with aliases (AS), and WHERE filters matching rows without modifying table structure.',
      'Cú pháp SELECT ... AS giúp lấy đúng các cột cần thiết và đặt lại tên hiển thị, kết hợp WHERE để lọc các khách hàng cư trú tại Hà Nội.'
    ]
  },
  {
    id: 'sql-sb-02-where',
    lessonId: 'where',
    number: 2,
    level: 'basic',
    topic: ['WHERE & FILTERING', 'WHERE & ĐIỀU KIỆN LỌC'],
    title: ['High-Value Completed Orders', 'Lọc đơn hàng hoàn tất có giá trị cao'],
    scenario: [
      'Customer support needs to review successful transactions valued at 500 or higher to credit loyalty points.',
      'Bộ phận Chăm sóc khách hàng cần kiểm tra các đơn hàng đã hoàn tất (status = \'completed\') có tổng giá trị đơn từ 500 trở lên (total >= 500) để cộng điểm tích lũy.'
    ],
    task: [
      'Query "id", "customer_id", "order_date", and "total" from "orders" where "status" is "completed" and "total" is at least 500. Order by "total" descending, then "id" ascending.',
      'Lấy các cột id, customer_id, order_date, total từ bảng orders thỏa mãn điều kiện status = \'completed\' VÀ total >= 500. Sắp xếp giảm dần theo total, sau đó tăng dần theo id.'
    ],
    tables: ['orders'],
    starterSql: `-- Đề bài 02: Lọc đơn hàng completed có total >= 500
SELECT
  id,
  customer_id,
  order_date,
  total
FROM orders
WHERE status = 'completed'
  AND total >= 500
ORDER BY total DESC, id ASC;`,
    solutionSql: `SELECT
  id,
  customer_id,
  order_date,
  total
FROM orders
WHERE status = 'completed'
  AND total >= 500
ORDER BY total DESC, id ASC;`,
    referenceSql: `SELECT id, customer_id, order_date, total FROM orders WHERE status = 'completed' AND total >= 500 ORDER BY total DESC, id ASC;`,
    ordered: true,
    hints: [
      ['Combine conditions using the AND operator: WHERE status = \'completed\' AND total >= 500.', 'Kết hợp hai điều kiện bằng toán tử AND: WHERE status = \'completed\' AND total >= 500.'],
      ['Sort using ORDER BY total DESC, id ASC.', 'Sắp xếp bằng ORDER BY total DESC, id ASC.']
    ],
    explanation: [
      'Combining WHERE conditions with AND ensures only rows satisfying both criteria are returned, while compound ORDER BY provides deterministic sorting.',
      'Toán tử AND kết hợp hai điều kiện lọc chính xác, còn ORDER BY với hai khóa sắp xếp đảm bảo thứ tự kết quả luôn nhất quán.'
    ]
  },
  {
    id: 'sql-sb-03-order-limit',
    lessonId: 'order',
    number: 3,
    level: 'basic',
    topic: ['ORDER BY & LIMIT', 'SẮP XẾP & GIỚI HẠN SỐ DÒNG'],
    title: ['Top 10 Most Expensive Products', 'Top 10 sản phẩm có giá niêm yết cao nhất'],
    scenario: [
      'The merchandising team wants to feature the top 10 most expensive items currently listed in the store catalog.',
      'Đội ngũ Quản lý sản phẩm muốn hiển thị top 10 sản phẩm có giá bán cao nhất trên sàn để chuẩn bị bộ sưu tập hàng cao cấp.'
    ],
    task: [
      'Select "name", "category", and "price" from the "products" table. Order by "price" descending, then "id" ascending, and limit the result to exactly 10 rows.',
      'Lấy các cột name, category, price từ bảng products, sắp xếp giảm dần theo price (giá cao nhất lên đầu), sau đó tăng dần theo id, và giới hạn đúng 10 dòng.'
    ],
    tables: ['products'],
    starterSql: `-- Đề bài 03: Top 10 sản phẩm giá cao nhất
SELECT
  name,
  category,
  price
FROM products
ORDER BY price DESC, id ASC
LIMIT 10;`,
    solutionSql: `SELECT
  name,
  category,
  price
FROM products
ORDER BY price DESC, id ASC
LIMIT 10;`,
    referenceSql: `SELECT name, category, price FROM products ORDER BY price DESC, id ASC LIMIT 10;`,
    ordered: true,
    hints: [
      ['Order by price in descending order with DESC.', 'Sắp xếp giá giảm dần bằng từ khóa DESC.'],
      ['Use LIMIT 10 at the end of the query to restrict the number of rows returned.', 'Đặt LIMIT 10 ở cuối câu lệnh để giới hạn lấy đúng 10 dòng đầu tiên.']
    ],
    explanation: [
      'ORDER BY ... DESC sorts from highest to lowest, and LIMIT 10 cuts off the result set once 10 rows have been collected.',
      'ORDER BY price DESC sắp xếp từ đắt nhất xuống rẻ nhất, kết hợp LIMIT 10 để lấy đúng 10 bản ghi đứng đầu.'
    ]
  },
  {
    id: 'sql-sb-04-aggregate',
    lessonId: 'aggregate',
    number: 4,
    level: 'basic',
    topic: ['AGGREGATE FUNCTIONS', 'HÀM TẬP HỢP TOÀN BẢNG'],
    title: ['Global Orders Summary Metrics', 'Tổng hợp chỉ số doanh thu và đơn hàng toàn sàn'],
    scenario: [
      'The Finance department needs an executive summary showing total order count, total revenue, average order value, and highest order value across all orders.',
      'Ban Giám đốc và phòng Tài chính cần một báo cáo tổng quan gồm: tổng số đơn hàng, tổng doanh thu, giá trị đơn trung bình và giá trị đơn lớn nhất trong hệ thống.'
    ],
    task: [
      'From the "orders" table, compute: COUNT(*) AS total_orders, ROUND(SUM(total), 2) AS total_revenue, ROUND(AVG(total), 2) AS avg_order_value, and MAX(total) AS max_order_value.',
      'Từ bảng orders, tính: COUNT(*) AS total_orders, ROUND(SUM(total), 2) AS total_revenue, ROUND(AVG(total), 2) AS avg_order_value, và MAX(total) AS max_order_value.'
    ],
    tables: ['orders'],
    starterSql: `-- Đề bài 04: Thống kê chỉ số đơn hàng toàn sàn
SELECT
  COUNT(*) AS total_orders,
  ROUND(SUM(total), 2) AS total_revenue,
  ROUND(AVG(total), 2) AS avg_order_value,
  MAX(total) AS max_order_value
FROM orders;`,
    solutionSql: `SELECT
  COUNT(*) AS total_orders,
  ROUND(SUM(total), 2) AS total_revenue,
  ROUND(AVG(total), 2) AS avg_order_value,
  MAX(total) AS max_order_value
FROM orders;`,
    referenceSql: `SELECT COUNT(*) AS total_orders, ROUND(SUM(total), 2) AS total_revenue, ROUND(AVG(total), 2) AS avg_order_value, MAX(total) AS max_order_value FROM orders;`,
    ordered: false,
    hints: [
      ['Use COUNT(*) to count rows, SUM(total) for sum, AVG(total) for average, and MAX(total) for maximum.', 'Dùng COUNT(*) để đếm đơn, SUM(total) để tính tổng tiền, AVG(total) cho trung bình và MAX(total) cho giá trị lớn nhất.'],
      ['Wrap numeric expressions in ROUND(..., 2) to keep 2 decimal places.', 'Dùng hàm ROUND(..., 2) để làm tròn 2 chữ số thập phân.']
    ],
    explanation: [
      'Aggregate functions collapse multiple rows into a single summary row without needing a GROUP BY clause when aggregating the whole table.',
      'Các hàm tập hợp (Aggregate functions) tổng hợp toàn bộ dữ liệu của bảng thành một dòng duy nhất chứa các chỉ số KPI trọng yếu.'
    ]
  },
  {
    id: 'sql-sb-05-group-by',
    lessonId: 'group-by',
    number: 5,
    level: 'basic',
    topic: ['GROUP BY', 'GOM NHÓM THEO TRẠNG THÁI'],
    title: ['Order Volume & Revenue by Status', 'Thống kê số lượng đơn và doanh thu theo trạng thái'],
    scenario: [
      'Operations needs to see the distribution of orders and revenue across statuses: completed, pending, and cancelled.',
      'Bộ phận Vận hành cần theo dõi khối lượng đơn hàng và dòng tiền được phân bổ theo từng trạng thái đơn: hoàn tất, đang chờ xử lý và đã hủy.'
    ],
    task: [
      'Group by "status" from "orders". Return "status", COUNT(*) AS order_count, and ROUND(SUM(total), 2) AS total_amount. Sort by total_amount descending.',
      'Gom nhóm theo status từ bảng orders. Lấy status, COUNT(*) AS order_count, và ROUND(SUM(total), 2) AS total_amount. Sắp xếp giảm dần theo total_amount.'
    ],
    tables: ['orders'],
    starterSql: `-- Đề bài 05: Gom nhóm đơn hàng theo status
SELECT
  status,
  COUNT(*) AS order_count,
  ROUND(SUM(total), 2) AS total_amount
FROM orders
GROUP BY status
ORDER BY total_amount DESC;`,
    solutionSql: `SELECT
  status,
  COUNT(*) AS order_count,
  ROUND(SUM(total), 2) AS total_amount
FROM orders
GROUP BY status
ORDER BY total_amount DESC;`,
    referenceSql: `SELECT status, COUNT(*) AS order_count, ROUND(SUM(total), 2) AS total_amount FROM orders GROUP BY status ORDER BY total_amount DESC;`,
    ordered: true,
    hints: [
      ['Include GROUP BY status after the FROM clause.', 'Thêm mệnh đề GROUP BY status ngay sau FROM orders.'],
      ['Every non-aggregated column in the SELECT list (like status) must appear in GROUP BY.', 'Mọi cột không nằm trong hàm tập hợp xuất hiện ở SELECT (như status) đều phải có mặt trong GROUP BY.']
    ],
    explanation: [
      'GROUP BY clusters rows by distinct status values, then applies COUNT and SUM independently for each cluster.',
      'GROUP BY chia nhỏ bảng thành từng nhóm theo trạng thái, sau đó tính toán số lượng và tổng tiền riêng biệt cho mỗi nhóm.'
    ]
  },
  {
    id: 'sql-sb-06-having',
    lessonId: 'having',
    number: 6,
    level: 'basic',
    topic: ['HAVING FILTER', 'LỌC SAU KHI GOM NHÓM'],
    title: ['Large Customer Hubs (Cities with >= 120 Customers)', 'Tìm các thành phố lớn có từ 120 khách hàng trở lên'],
    scenario: [
      'Logistics wants to identify the largest metropolitan delivery hubs with at least 120 registered customers to negotiate lower carrier rates.',
      'Đội ngũ Hậu cần muốn xác định các thành phố lớn tập trung từ 120 khách hàng trở lên để đàm phán hợp đồng vận chuyển ưu đãi.'
    ],
    task: [
      'From the "customers" table, group by "city", count customers as "customer_count", and use HAVING to keep only cities with COUNT(*) >= 120. Sort by customer_count descending, then city ascending.',
      'Từ bảng customers, gom nhóm theo city, đếm số khách hàng đặt tên là customer_count, dùng HAVING để chỉ giữ các thành phố có COUNT(*) >= 120. Sắp xếp giảm dần theo customer_count, sau đó tăng dần theo city.'
    ],
    tables: ['customers'],
    starterSql: `-- Đề bài 06: Lọc thành phố có từ 120 khách hàng trở lên
SELECT
  city,
  COUNT(*) AS customer_count
FROM customers
GROUP BY city
HAVING COUNT(*) >= 120
ORDER BY customer_count DESC, city ASC;`,
    solutionSql: `SELECT
  city,
  COUNT(*) AS customer_count
FROM customers
GROUP BY city
HAVING COUNT(*) >= 120
ORDER BY customer_count DESC, city ASC;`,
    referenceSql: `SELECT city, COUNT(*) AS customer_count FROM customers GROUP BY city HAVING COUNT(*) >= 120 ORDER BY customer_count DESC, city ASC;`,
    ordered: true,
    hints: [
      ['WHERE filters individual rows before grouping, but HAVING filters groups after aggregation.', 'WHERE lọc từng dòng trước khi gom nhóm, còn HAVING lọc kết quả sau khi gom nhóm.'],
      ['Write HAVING COUNT(*) >= 120 right after GROUP BY city.', 'Viết mệnh đề HAVING COUNT(*) >= 120 ngay sau GROUP BY city.']
    ],
    explanation: [
      'HAVING evaluates aggregate expressions over groups, filtering out groups that do not meet the aggregate threshold.',
      'Mệnh đề HAVING áp dụng điều kiện lọc trên giá trị tập hợp (COUNT(*) >= 120), loại bỏ các nhóm không đủ tiêu chuẩn sau khi gom nhóm.'
    ]
  },
  {
    id: 'sql-sb-07-inner-join',
    lessonId: 'join',
    number: 7,
    level: 'basic',
    topic: ['INNER JOIN', 'NỐI HAI BẢNG LIÊN QUAN'],
    title: ['Customer Info with Orders for Customer #42', 'Xem chi tiết đơn hàng kèm thông tin khách hàng #42'],
    scenario: [
      'Customer support received an inquiry from customer #42 and needs to pull up their full order history with customer name and city.',
      'Bộ phận Hỗ trợ khách hàng nhận được yêu cầu từ khách hàng ID = 42 và cần xem lịch sử tất cả các đơn của khách này kèm họ tên và thành phố.'
    ],
    task: [
      'Join "orders" (alias "o") with "customers" (alias "c") on "o.customer_id = c.id". Select o.id AS order_id, c.name AS customer_name, c.city, o.order_date, and o.total where c.id = 42. Order by o.id ascending.',
      'Nối bảng orders (đặt alias là o) với bảng customers (đặt alias là c) qua điều kiện o.customer_id = c.id. Lấy o.id AS order_id, c.name AS customer_name, c.city, o.order_date, o.total cho khách có c.id = 42. Sắp xếp tăng dần theo o.id.'
    ],
    tables: ['orders', 'customers'],
    starterSql: `-- Đề bài 07: Nối đơn hàng với thông tin khách hàng #42
SELECT
  o.id AS order_id,
  c.name AS customer_name,
  c.city,
  o.order_date,
  o.total
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE c.id = 42
ORDER BY o.id ASC;`,
    solutionSql: `SELECT
  o.id AS order_id,
  c.name AS customer_name,
  c.city,
  o.order_date,
  o.total
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE c.id = 42
ORDER BY o.id ASC;`,
    referenceSql: `SELECT o.id AS order_id, c.name AS customer_name, c.city, o.order_date, o.total FROM orders o JOIN customers c ON o.customer_id = c.id WHERE c.id = 42 ORDER BY o.id ASC;`,
    ordered: true,
    hints: [
      ['Use JOIN customers c ON o.customer_id = c.id to link the foreign key to the primary key.', 'Dùng cú pháp JOIN customers c ON o.customer_id = c.id để liên kết khóa ngoại với khóa chính.'],
      ['Prefix column names with their table alias (e.g. o.id, c.name) to avoid ambiguity.', 'Ghi kèm tiền tố alias của bảng (như o.id, c.name) để tránh trùng tên cột.']
    ],
    explanation: [
      'INNER JOIN combines matching records from two tables based on the join predicate o.customer_id = c.id.',
      'INNER JOIN kết hợp các dòng tương ứng giữa hai bảng dựa trên khóa liên kết, giúp bổ sung dữ liệu khách hàng vào chi tiết đơn hàng.'
    ]
  },
  {
    id: 'sql-sb-08-left-join',
    lessonId: 'left-join',
    number: 8,
    level: 'basic',
    topic: ['LEFT JOIN & AGGREGATE', 'LEFT JOIN BẢO TOÀN DANH SÁCH'],
    title: ['Customer Order Counts & Total Spending', 'Thống kê đơn hàng và chi tiêu khách hàng qua LEFT JOIN'],
    scenario: [
      'The CRM analytics team needs an overview of customer profiles showing the total number of orders placed and their total spending to date.',
      'Đội ngũ phân tích dữ liệu CRM cần bảng tổng hợp hồ sơ khách hàng hiển thị số lượng đơn đã đặt và tổng số tiền chi tiêu để phân loại đối tượng chăm sóc.'
    ],
    task: [
      'Left join "customers" ("c") with "orders" ("o") on "c.id = o.customer_id". Group by "c.id, c.name, c.city". Select "c.id", "c.name", "c.city", COUNT(o.id) AS order_count, and COALESCE(ROUND(SUM(o.total), 2), 0) AS total_spent. Order by "c.id ASC" and limit to 15 rows.',
      'Dùng LEFT JOIN nối bảng customers (c) với orders (o) qua c.id = o.customer_id. Gom nhóm theo c.id, c.name, c.city. Lấy c.id, c.name, c.city, COUNT(o.id) AS order_count, và COALESCE(ROUND(SUM(o.total), 2), 0) AS total_spent. Sắp xếp tăng dần theo c.id và giới hạn 15 dòng đầu.'
    ],
    tables: ['customers', 'orders'],
    starterSql: `-- Đề bài 08: Thống kê số lượng đơn và chi tiêu khách hàng qua LEFT JOIN
SELECT
  c.id,
  c.name,
  c.city,
  COUNT(o.id) AS order_count,
  COALESCE(ROUND(SUM(o.total), 2), 0) AS total_spent
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name, c.city
ORDER BY c.id ASC
LIMIT 15;`,
    solutionSql: `SELECT
  c.id,
  c.name,
  c.city,
  COUNT(o.id) AS order_count,
  COALESCE(ROUND(SUM(o.total), 2), 0) AS total_spent
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name, c.city
ORDER BY c.id ASC
LIMIT 15;`,
    referenceSql: `SELECT c.id, c.name, c.city, COUNT(o.id) AS order_count, COALESCE(ROUND(SUM(o.total), 2), 0) AS total_spent FROM customers c LEFT JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.name, c.city ORDER BY c.id ASC LIMIT 15;`,
    ordered: true,
    hints: [
      ['A LEFT JOIN preserves every row from customers even if they have zero orders.', 'LEFT JOIN bảo toàn mọi khách hàng từ bảng customers ngay cả khi họ chưa từng có đơn hàng nào.'],
      ['Use COUNT(o.id) rather than COUNT(*) so unmatched rows count as 0 instead of 1.', 'Sử dụng COUNT(o.id) thay vì COUNT(*) để các dòng không khớp được đếm là 0 thay vì 1.'],
      ['Wrap SUM(o.total) in COALESCE(..., 0) to replace NULL totals with 0.', 'Bọc SUM(o.total) trong COALESCE(..., 0) để chuyển giá trị NULL thành 0.']
    ],
    explanation: [
      'LEFT JOIN paired with COUNT(foreign_table.id) and COALESCE correctly computes aggregations while preserving all master entities.',
      'Sự kết hợp giữa LEFT JOIN và COUNT(o.id) cùng hàm COALESCE là chuẩn mực SQL để thống kê dữ liệu liên quan mà vẫn bảo toàn đầy đủ danh sách khách hàng.'
    ]
  },

  // -------------------------------------------------------------
  // LEVEL: INTERMEDIATE (TRUNG CẤP)
  // -------------------------------------------------------------
  {
    id: 'sql-sb-09-case',
    lessonId: 'case',
    number: 9,
    level: 'intermediate',
    topic: ['CASE WHEN', 'RẼ NHÁNH PHÂN LOẠI LOGIC'],
    title: ['Tier Orders by Spending Value', 'Phân loại đơn hàng theo phân khúc giá trị'],
    scenario: [
      'Marketing wants to segment transactions into spending tiers: VIP for orders >= 600, Standard for orders >= 200, and Economy for the rest.',
      'Phòng Marketing cần phân loại đơn hàng thành 3 phân khúc chi tiêu: "VIP" (từ 600 trở lên), "Standard" (từ 200 đến dưới 600), và "Economy" (dưới 200).'
    ],
    task: [
      'Select "id", "customer_id", "total", and a computed column "order_tier" using CASE WHEN: "VIP" if total >= 600, "Standard" if total >= 200, else "Economy". Order by "id" ascending, limit 15.',
      'Lấy id, customer_id, total từ bảng orders, kèm một cột mới đặt tên là order_tier dùng CASE WHEN: nếu total >= 600 thì \'VIP\', total >= 200 thì \'Standard\', còn lại là \'Economy\'. Sắp xếp tăng dần theo id, lấy 15 dòng.'
    ],
    tables: ['orders'],
    starterSql: `-- Đề bài 09: Phân loại đơn hàng bằng CASE WHEN
SELECT
  id,
  customer_id,
  total,
  CASE
    WHEN total >= 600 THEN 'VIP'
    WHEN total >= 200 THEN 'Standard'
    ELSE 'Economy'
  END AS order_tier
FROM orders
ORDER BY id ASC
LIMIT 15;`,
    solutionSql: `SELECT
  id,
  customer_id,
  total,
  CASE
    WHEN total >= 600 THEN 'VIP'
    WHEN total >= 200 THEN 'Standard'
    ELSE 'Economy'
  END AS order_tier
FROM orders
ORDER BY id ASC
LIMIT 15;`,
    referenceSql: `SELECT id, customer_id, total, CASE WHEN total >= 600 THEN 'VIP' WHEN total >= 200 THEN 'Standard' ELSE 'Economy' END AS order_tier FROM orders ORDER BY id ASC LIMIT 15;`,
    ordered: true,
    hints: [
      ['Evaluate higher thresholds first: WHEN total >= 600, then WHEN total >= 200, then ELSE.', 'Kiểm tra ngưỡng cao trước: WHEN total >= 600 trước, sau đó mới tới WHEN total >= 200.'],
      ['End the expression with END AS order_tier.', 'Kết thúc biểu thức bằng END AS order_tier.']
    ],
    explanation: [
      'CASE expressions evaluate conditions in top-down order and return the result corresponding to the first true branch.',
      'Biểu thức CASE kiểm tra các điều kiện từ trên xuống dưới và trả về giá trị của nhánh thỏa mãn đầu tiên.'
    ]
  },
  {
    id: 'sql-sb-10-subquery',
    lessonId: 'subquery',
    number: 10,
    level: 'intermediate',
    topic: ['SUBQUERY', 'TRUY VẤN CON TƯƠNG QUAN'],
    title: ['Products Priced Above Category Average', 'Tìm sản phẩm có giá bán cao hơn trung bình danh mục'],
    scenario: [
      'Product managers need to spot premium items whose price exceeds the average price of all products within their own category.',
      'Bộ phận Quản lý sản phẩm cần tìm các mặt hàng có giá bán cao hơn mức giá trung bình của chính danh mục hàng hóa đó.'
    ],
    task: [
      'From "products" ("p1"), select "id", "name", "category", and "price" where "p1.price > (SELECT AVG(p2.price) FROM products p2 WHERE p2.category = p1.category)". Order by "category" ASC, "price" DESC, "id" ASC. Limit 15.',
      'Từ bảng products (p1), lấy id, name, category, price thỏa mãn p1.price > (SELECT AVG(p2.price) FROM products p2 WHERE p2.category = p1.category). Sắp xếp theo category ASC, price DESC, id ASC. Giới hạn 15 dòng.'
    ],
    tables: ['products'],
    starterSql: `-- Đề bài 10: Sản phẩm có giá cao hơn trung bình danh mục
SELECT
  p1.id,
  p1.name,
  p1.category,
  p1.price
FROM products p1
WHERE p1.price > (
  SELECT AVG(p2.price)
  FROM products p2
  WHERE p2.category = p1.category
)
ORDER BY p1.category ASC, p1.price DESC, p1.id ASC
LIMIT 15;`,
    solutionSql: `SELECT
  p1.id,
  p1.name,
  p1.category,
  p1.price
FROM products p1
WHERE p1.price > (
  SELECT AVG(p2.price)
  FROM products p2
  WHERE p2.category = p1.category
)
ORDER BY p1.category ASC, p1.price DESC, p1.id ASC
LIMIT 15;`,
    referenceSql: `SELECT p1.id, p1.name, p1.category, p1.price FROM products p1 WHERE p1.price > (SELECT AVG(p2.price) FROM products p2 WHERE p2.category = p1.category) ORDER BY p1.category ASC, p1.price DESC, p1.id ASC LIMIT 15;`,
    ordered: true,
    hints: [
      ['In a correlated subquery, the inner query references the outer row category: WHERE p2.category = p1.category.', 'Trong subquery tương quan, câu truy vấn bên trong liên kết với danh mục của dòng ngoài: WHERE p2.category = p1.category.'],
      ['The outer WHERE condition checks if p1.price is strictly greater than the subquery result.', 'Mệnh đề WHERE bên ngoài so sánh p1.price lớn hơn giá trị trung bình tính được từ subquery.']
    ],
    explanation: [
      'Correlated subqueries evaluate per outer row, comparing each product against its specific category benchmark.',
      'Subquery tương quan chạy đối chiếu cho từng dòng của bảng ngoài, giúp so sánh mỗi sản phẩm với chuẩn trung bình của ngành hàng tương ứng.'
    ]
  },
  {
    id: 'sql-sb-11-cte',
    lessonId: 'cte',
    number: 11,
    level: 'intermediate',
    topic: ['CTE (WITH)', 'TÁCH BẢNG TẠM VỚI CTE'],
    title: ['Completed Revenue Contribution by Category', 'Doanh thu đơn hàng hoàn tất theo từng ngành hàng'],
    scenario: [
      'Strategy leaders want to see the performance of each product category: how many completed orders touched it, and total sales generated.',
      'Ban Chiến lược cần phân tích doanh số của từng danh mục sản phẩm đối với các đơn hàng thành công (status = \'completed\').'
    ],
    task: [
      'Define a CTE named "category_sales" that joins products (p), order_items (oi), and orders (o) with o.status = \'completed\'. Group by p.category to get: category, COUNT(DISTINCT o.id) AS total_orders, and ROUND(SUM(oi.quantity * oi.unit_price), 2) AS category_revenue. Select all columns from category_sales ordered by category_revenue descending.',
      'Dùng CTE đặt tên là category_sales nối products (p), order_items (oi), orders (o) với điều kiện o.status = \'completed\'. Gom nhóm theo p.category để lấy: category, COUNT(DISTINCT o.id) AS total_orders, và ROUND(SUM(oi.quantity * oi.unit_price), 2) AS category_revenue. Sau đó SELECT từ CTE, sắp xếp giảm dần theo category_revenue.'
    ],
    tables: ['products', 'order_items', 'orders'],
    starterSql: `-- Đề bài 11: Doanh thu theo danh mục sản phẩm dùng CTE
WITH category_sales AS (
  SELECT
    p.category,
    COUNT(DISTINCT o.id) AS total_orders,
    ROUND(SUM(oi.quantity * oi.unit_price), 2) AS category_revenue
  FROM products p
  JOIN order_items oi ON p.id = oi.product_id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.status = 'completed'
  GROUP BY p.category
)
SELECT
  category,
  total_orders,
  category_revenue
FROM category_sales
ORDER BY category_revenue DESC;`,
    solutionSql: `WITH category_sales AS (
  SELECT
    p.category,
    COUNT(DISTINCT o.id) AS total_orders,
    ROUND(SUM(oi.quantity * oi.unit_price), 2) AS category_revenue
  FROM products p
  JOIN order_items oi ON p.id = oi.product_id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.status = 'completed'
  GROUP BY p.category
)
SELECT
  category,
  total_orders,
  category_revenue
FROM category_sales
ORDER BY category_revenue DESC;`,
    referenceSql: `WITH category_sales AS (SELECT p.category, COUNT(DISTINCT o.id) AS total_orders, ROUND(SUM(oi.quantity * oi.unit_price), 2) AS category_revenue FROM products p JOIN order_items oi ON p.id = oi.product_id JOIN orders o ON oi.order_id = o.id WHERE o.status = 'completed' GROUP BY p.category) SELECT category, total_orders, category_revenue FROM category_sales ORDER BY category_revenue DESC;`,
    ordered: true,
    hints: [
      ['Start with WITH category_sales AS (...) and write the main query underneath.', 'Bắt đầu với WITH category_sales AS (...) và viết câu query chính ngay bên dưới.'],
      ['Use COUNT(DISTINCT o.id) to prevent counting the same order multiple times when it contains multiple items.', 'Dùng COUNT(DISTINCT o.id) để đếm số đơn duy nhất, tránh bị đếm lặp khi đơn có nhiều món hàng.']
    ],
    explanation: [
      'Common Table Expressions (CTEs) break complex multi-table joins and aggregations into clean, readable logical blocks.',
      'CTE (Common Table Expressions) giúp phân rã truy vấn nhiều bảng phức tạp thành các khối logic mạch lạc và dễ bảo trì.'
    ]
  },
  {
    id: 'sql-sb-12-multi-join',
    lessonId: 'join',
    number: 12,
    level: 'intermediate',
    topic: ['MULTI-TABLE JOIN', 'NỐI NHIỀU BẢNG LIÊN TỤC'],
    title: ['Itemized Invoice Breakdown for Order #42', 'Bóc tách chi tiết từng món hàng trong đơn #42'],
    scenario: [
      'A customer requested a receipt breakdown for order #42 showing item details: product name, category, quantity, unit price, and line item total.',
      'Khách hàng cần hóa đơn chi tiết cho đơn hàng #42: tên sản phẩm, ngành hàng, số lượng, đơn giá và thành tiền của từng món.'
    ],
    task: [
      'Join "order_items" ("oi") with "products" ("p") on "oi.product_id = p.id". Select oi.id AS item_id, p.name AS product_name, p.category, oi.quantity, oi.unit_price, and (oi.quantity * oi.unit_price) AS line_total where oi.order_id = 42. Order by oi.id ascending.',
      'Nối order_items (oi) với products (p) qua oi.product_id = p.id. Lấy oi.id AS item_id, p.name AS product_name, p.category, oi.quantity, oi.unit_price, và (oi.quantity * oi.unit_price) AS line_total với điều kiện oi.order_id = 42. Sắp xếp tăng dần theo oi.id.'
    ],
    tables: ['order_items', 'products'],
    starterSql: `-- Đề bài 12: Chi tiết các mặt hàng trong đơn #42
SELECT
  oi.id AS item_id,
  p.name AS product_name,
  p.category,
  oi.quantity,
  oi.unit_price,
  (oi.quantity * oi.unit_price) AS line_total
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = 42
ORDER BY oi.id ASC;`,
    solutionSql: `SELECT
  oi.id AS item_id,
  p.name AS product_name,
  p.category,
  oi.quantity,
  oi.unit_price,
  (oi.quantity * oi.unit_price) AS line_total
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = 42
ORDER BY oi.id ASC;`,
    referenceSql: `SELECT oi.id AS item_id, p.name AS product_name, p.category, oi.quantity, oi.unit_price, (oi.quantity * oi.unit_price) AS line_total FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = 42 ORDER BY oi.id ASC;`,
    ordered: true,
    hints: [
      ['Multiply quantity by unit_price to get line_total: (oi.quantity * oi.unit_price) AS line_total.', 'Nhân số lượng với đơn giá để tính thành tiền: (oi.quantity * oi.unit_price) AS line_total.'],
      ['Filter directly on the foreign key with WHERE oi.order_id = 42.', 'Lọc trực tiếp trên khóa ngoại bằng WHERE oi.order_id = 42.']
    ],
    explanation: [
      'Joining order line items to products bridges transactional quantities with catalog master data to calculate financial sub-totals.',
      'Liên kết giữa chi tiết đơn hàng (order_items) và bảng sản phẩm (products) cho phép tính toán chính xác thành tiền từng món hàng.'
    ]
  },

  // -------------------------------------------------------------
  // LEVEL: ADVANCED (NÂNG CAO)
  // -------------------------------------------------------------
  {
    id: 'sql-sb-13-window-row-number',
    lessonId: 'window',
    number: 13,
    level: 'advanced',
    topic: ['WINDOW ROW_NUMBER', 'ĐÁNH SỐ THỨ TỰ PHÂN VÙNG'],
    title: ['Latest Order for Each Customer', 'Lấy đơn hàng mới nhất của mỗi khách hàng'],
    scenario: [
      'The CRM application needs to display each customer\'s most recent purchase date and amount on their profile card.',
      'Hệ thống quản lý khách hàng (CRM) cần hiển thị đơn hàng mới nhất (ngày đặt và số tiền) trên hồ sơ cá nhân của từng khách hàng.'
    ],
    task: [
      'Use ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC, id DESC) in a CTE or subquery to rank orders per customer. Filter for customers with customer_id <= 20 and pick only rows with rn = 1. Return order_id (from id), customer_id, order_date, total ordered by customer_id ascending.',
      'Dùng ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC, id DESC) AS rn trong CTE để xếp hạng đơn theo từng khách. Lọc các khách có customer_id <= 20 và lấy các dòng có rn = 1. Trả về order_id (từ id), customer_id, order_date, total sắp xếp tăng dần theo customer_id.'
    ],
    tables: ['orders'],
    starterSql: `-- Đề bài 13: Đơn hàng mới nhất của mỗi khách hàng
WITH ranked_orders AS (
  SELECT
    id AS order_id,
    customer_id,
    order_date,
    total,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id
      ORDER BY order_date DESC, id DESC
    ) AS rn
  FROM orders
  WHERE customer_id <= 20
)
SELECT
  order_id,
  customer_id,
  order_date,
  total
FROM ranked_orders
WHERE rn = 1
ORDER BY customer_id ASC;`,
    solutionSql: `WITH ranked_orders AS (
  SELECT
    id AS order_id,
    customer_id,
    order_date,
    total,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id
      ORDER BY order_date DESC, id DESC
    ) AS rn
  FROM orders
  WHERE customer_id <= 20
)
SELECT
  order_id,
  customer_id,
  order_date,
  total
FROM ranked_orders
WHERE rn = 1
ORDER BY customer_id ASC;`,
    referenceSql: `WITH ranked_orders AS (SELECT id AS order_id, customer_id, order_date, total, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC, id DESC) AS rn FROM orders WHERE customer_id <= 20) SELECT order_id, customer_id, order_date, total FROM ranked_orders WHERE rn = 1 ORDER BY customer_id ASC;`,
    ordered: true,
    hints: [
      ['PARTITION BY customer_id restarts the sequence for each customer.', 'PARTITION BY customer_id khởi động lại bộ đếm cho từng khách hàng riêng biệt.'],
      ['Wrap in a CTE so you can filter WHERE rn = 1 in the outer query.', 'Bọc câu lệnh vào CTE để lọc WHERE rn = 1 ở truy vấn bên ngoài (vì không thể dùng Window function trực tiếp trong WHERE).']
    ],
    explanation: [
      'Window functions like ROW_NUMBER() calculate metrics across row partitions while retaining the original granular row identity.',
      'Hàm cửa sổ ROW_NUMBER() xếp hạng các dòng trong từng nhóm phân vùng mà không làm co cụm (collapse) dữ liệu như GROUP BY.'
    ]
  },
  {
    id: 'sql-sb-14-window-running-total',
    lessonId: 'window',
    number: 14,
    level: 'advanced',
    topic: ['WINDOW RUNNING TOTAL', 'TỔNG TÍCH LŨY LŨY KẾ'],
    title: ['Cumulative Daily Revenue in January 2024', 'Tính doanh thu lũy kế theo ngày tháng 01/2024'],
    scenario: [
      'Finance tracks a daily cumulative revenue curve (running total) for January 2024 to verify if monthly sales meet milestone targets.',
      'Bộ phận Kế toán muốn theo dõi đường cong tăng trưởng doanh thu tích lũy lũy kế theo từng ngày trong tháng 01/2024 đối với các đơn đã hoàn tất.'
    ],
    task: [
      'Using a CTE "daily_revenue", sum completed orders by order_date in January 2024 (order_date >= \'2024-01-01\' AND order_date < \'2024-02-01\' AND status = \'completed\'). Then select order_date, daily_total (ROUND(SUM(total), 2)), and running_total computed as ROUND(SUM(daily_total) OVER (ORDER BY order_date), 2). Order by order_date ascending.',
      'Dùng CTE daily_revenue gom nhóm theo order_date trong tháng 01/2024 (order_date >= \'2024-01-01\' AND order_date < \'2024-02-01\' và status = \'completed\'), tính daily_total = ROUND(SUM(total), 2). Ở truy vấn ngoài, lấy order_date, daily_total và tính running_total = ROUND(SUM(daily_total) OVER (ORDER BY order_date), 2). Sắp xếp theo order_date tăng dần.'
    ],
    tables: ['orders'],
    starterSql: `-- Đề bài 14: Doanh thu tích lũy lũy kế tháng 01/2024
WITH daily_revenue AS (
  SELECT
    order_date,
    ROUND(SUM(total), 2) AS daily_total
  FROM orders
  WHERE order_date >= DATE '2024-01-01'
    AND order_date < DATE '2024-02-01'
    AND status = 'completed'
  GROUP BY order_date
)
SELECT
  order_date,
  daily_total,
  ROUND(SUM(daily_total) OVER (ORDER BY order_date), 2) AS running_total
FROM daily_revenue
ORDER BY order_date ASC;`,
    solutionSql: `WITH daily_revenue AS (
  SELECT
    order_date,
    ROUND(SUM(total), 2) AS daily_total
  FROM orders
  WHERE order_date >= DATE '2024-01-01'
    AND order_date < DATE '2024-02-01'
    AND status = 'completed'
  GROUP BY order_date
)
SELECT
  order_date,
  daily_total,
  ROUND(SUM(daily_total) OVER (ORDER BY order_date), 2) AS running_total
FROM daily_revenue
ORDER BY order_date ASC;`,
    referenceSql: `WITH daily_revenue AS (SELECT order_date, ROUND(SUM(total), 2) AS daily_total FROM orders WHERE order_date >= DATE '2024-01-01' AND order_date < DATE '2024-02-01' AND status = 'completed' GROUP BY order_date) SELECT order_date, daily_total, ROUND(SUM(daily_total) OVER (ORDER BY order_date), 2) AS running_total FROM daily_revenue ORDER BY order_date ASC;`,
    ordered: true,
    hints: [
      ['SUM(daily_total) OVER (ORDER BY order_date) accumulates amounts from the beginning of the month up to the current day.', 'Cú pháp SUM(daily_total) OVER (ORDER BY order_date) sẽ cộng dồn giá trị từ đầu tháng cho tới ngày hiện tại.'],
      ['Always cast string dates with DATE \'2024-01-01\' for exact date comparison.', 'Nên ép kiểu ngày bằng tiền tố DATE \'2024-01-01\' để đảm bảo so sánh thời gian chính xác.']
    ],
    explanation: [
      'An OVER clause with ORDER BY without an explicit frame creates an unbounded preceding to current row running accumulation.',
      'Mệnh đề OVER kèm ORDER BY tự động tạo khung tích lũy từ dòng đầu tiên đến dòng hiện tại (Unbounded Preceding to Current Row).'
    ]
  },
  {
    id: 'sql-sb-15-keyset-pagination',
    lessonId: 'pagination',
    number: 15,
    level: 'advanced',
    topic: ['KEYSET PAGINATION', 'PHÂN TRANG CON TRỎ O(1)'],
    title: ['Keyset Cursor Pagination vs Heavy OFFSET', 'Phân trang Keyset Cursor hiệu năng cao O(1)'],
    scenario: [
      'In high-volume feeds, OFFSET 20000 causes PostgreSQL to scan and discard 20,000 tuples. Rewrite pagination using keyset cursor tuple comparisons.',
      'Trên bảng lớn, OFFSET 20000 buộc database phải quét và bỏ qua 20.000 dòng gây chậm hệ thống. Viết truy vấn phân trang con trỏ (keyset cursor) với cặp khóa (order_date, id).'
    ],
    task: [
      'Assume the previous page ended at order_date = \'2024-06-15\' and id = 1500. Fetch the next 10 orders using Keyset comparison: (order_date < DATE \'2024-06-15\') OR (order_date = DATE \'2024-06-15\' AND id < 1500). Select id, customer_id, order_date, total, status. Order by order_date DESC, id DESC. Limit 10.',
      'Giả sử trang trước kết thúc ở bản ghi order_date = \'2024-06-15\' và id = 1500. Lấy 10 đơn tiếp theo dùng điều kiện con trỏ: (order_date < DATE \'2024-06-15\') OR (order_date = DATE \'2024-06-15\' AND id < 1500). Lấy id, customer_id, order_date, total, status. Sắp xếp order_date DESC, id DESC, LIMIT 10.'
    ],
    tables: ['orders'],
    starterSql: `-- Đề bài 15: Phân trang Keyset Cursor hiệu năng O(1)
SELECT
  id,
  customer_id,
  order_date,
  total,
  status
FROM orders
WHERE (order_date < DATE '2024-06-15')
   OR (order_date = DATE '2024-06-15' AND id < 1500)
ORDER BY order_date DESC, id DESC
LIMIT 10;`,
    solutionSql: `SELECT
  id,
  customer_id,
  order_date,
  total,
  status
FROM orders
WHERE (order_date < DATE '2024-06-15')
   OR (order_date = DATE '2024-06-15' AND id < 1500)
ORDER BY order_date DESC, id DESC
LIMIT 10;`,
    referenceSql: `SELECT id, customer_id, order_date, total, status FROM orders WHERE (order_date < DATE '2024-06-15') OR (order_date = DATE '2024-06-15' AND id < 1500) ORDER BY order_date DESC, id DESC LIMIT 10;`,
    ordered: true,
    hints: [
      ['Keyset pagination uses the last seen values directly in the WHERE clause instead of OFFSET.', 'Keyset pagination dùng trực tiếp giá trị của bản ghi cuối trang trước trong mệnh đề WHERE thay vì dùng OFFSET.'],
      ['The compound condition (order_date < ... OR (order_date = ... AND id < ...)) handles tie-breaking when multiple orders share the same date.', 'Điều kiện kép giải quyết hoàn hảo trường hợp nhiều đơn hàng có cùng một ngày đặt.']
    ],
    explanation: [
      'Keyset pagination can jump directly to the target record via B-Tree index scan in O(1) time without scanning preceding discarded pages.',
      'Phân trang Keyset tận dụng B-Tree Index để nhảy thẳng tới vị trí cần lấy với độ phức tạp O(1), khắc phục hoàn toàn điểm nghẽn hiệu năng của OFFSET.'
    ]
  },
  {
    id: 'sql-sb-16-index',
    lessonId: 'index',
    number: 16,
    level: 'advanced',
    topic: ['B-TREE INDEX & EXPLAIN', 'TẠO CHỈ MỤC & TỐI ƯU TRUY VẤN'],
    title: ['Accelerate Customer Query with B-Tree Index', 'Tối ưu tra cứu đơn hàng bằng B-Tree Index'],
    scenario: [
      'Looking up orders for a specific customer currently performs a sequential scan over the entire orders table. Create an index to make this lookup instant.',
      'Truy vấn tìm đơn của một khách hàng cụ thể đang phải quét toàn bộ bảng orders (Sequential Scan). Hãy tạo B-Tree Index trên cột customer_id và thực hiện truy vấn.'
    ],
    task: [
      'First execute CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id); then select "id", "order_date", and "total" from "orders" where customer_id = 42 ordered by id ASC.',
      'Tạo chỉ mục CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id); sau đó thực hiện truy vấn SELECT id, order_date, total FROM orders WHERE customer_id = 42 ORDER BY id ASC.'
    ],
    tables: ['orders'],
    starterSql: `-- Đề bài 16: Tạo Index tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

SELECT
  id,
  order_date,
  total
FROM orders
WHERE customer_id = 42
ORDER BY id ASC;`,
    solutionSql: `CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

SELECT
  id,
  order_date,
  total
FROM orders
WHERE customer_id = 42
ORDER BY id ASC;`,
    referenceSql: `SELECT id, order_date, total FROM orders WHERE customer_id = 42 ORDER BY id ASC;`,
    ordered: true,
    hints: [
      ['Execute both the CREATE INDEX DDL and the SELECT query together.', 'Bạn có thể chạy cả câu lệnh CREATE INDEX và câu lệnh SELECT cùng một lúc trong Editor.'],
      ['Inspect the Execution Plan tab to verify that the query now performs an Index Scan instead of a Seq Scan.', 'Mở tab "Kế hoạch thực thi" (Execution plan) để thấy câu lệnh chuyển từ Sequential Scan sang Index Scan.']
    ],
    explanation: [
      'Creating a B-Tree index on a foreign key allows PostgreSQL to traverse directly to matching rows in O(log N) operations instead of scanning all table pages.',
      'Tạo B-Tree Index trên khóa ngoại giúp database tìm kiếm trực tiếp các dòng phù hợp trong thời gian O(log N) thay vì phải duyệt tuần tự toàn bộ dữ liệu.'
    ]
  }
];

export function getSqlChallenge(idOrSlug: string): SqlSandboxChallenge | undefined {
  return sqlSandboxChallenges.find(c => c.id === idOrSlug || c.lessonId === idOrSlug);
}

export function getChallengeByLesson(lessonId: string): SqlSandboxChallenge | undefined {
  return sqlSandboxChallenges.find(c => c.lessonId === lessonId);
}

export function getChallengesByLevel(level: 'basic' | 'intermediate' | 'advanced'): SqlSandboxChallenge[] {
  return sqlSandboxChallenges.filter(c => c.level === level);
}
