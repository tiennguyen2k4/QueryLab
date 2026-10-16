import type { Locale } from '../lib/locale';

/** Small, illustrative fixtures. These never replace the learner's actual database. */
export type StoryTable = {
  name: string;
  columns: string[];
  rows: string[][];
};

export type LabStory = {
  title: string;
  opening: string;
  motivation: string;
  inputTables: StoryTable[];
  output: StoryTable;
  exampleExplanation: string;
  /** SELECT over inline VALUES: no seeding, mutation, or benchmark claims. */
  sampleSql: string;
  constraints: string[];
  prediction: {
    question: string;
    choices: string[];
    correctChoice: number;
    explanation: string;
  };
  experiment: {
    title: string;
    sql: string;
    observation: string;
  };
  transferQuestion: string;
};

type StoryPair = Record<Locale, LabStory>;
type StoryText = Omit<LabStory, 'inputTables' | 'output' | 'sampleSql'>;

function pair(inputTables: StoryTable[], output: StoryTable, sampleSql: string, en: StoryText, vi: StoryText): StoryPair {
  return { en: { ...en, inputTables, output, sampleSql }, vi: { ...vi, inputTables, output, sampleSql } };
}

const orders: StoryTable = {
  name: 'orders', columns: ['id', 'customer_id', 'order_date', 'status', 'total'],
  rows: [
    ['101', '42', '2024-07-01', 'completed', '90'],
    ['102', '7', '2024-07-01', 'completed', '150'],
    ['103', '42', '2024-08-01', 'pending', '40'],
  ],
};
const ordersCte = `WITH orders(id, customer_id, order_date, status, total) AS (
  VALUES (101, 42, DATE '2024-07-01', 'completed', 90),
         (102, 7, DATE '2024-07-01', 'completed', 150),
         (103, 42, DATE '2024-08-01', 'pending', 40)
)`;
const customerOutput: StoryTable = {
  name: 'result', columns: ['id', 'order_date', 'total'],
  rows: [['101', '2024-07-01', '90'], ['103', '2024-08-01', '40']],
};
const customerSample = `${ordersCte}
SELECT id, order_date, total FROM orders WHERE customer_id = 42 ORDER BY id;`;
const fullCustomerOutput: StoryTable = {
  name: 'result', columns: orders.columns,
  rows: [orders.rows[0], orders.rows[2]],
};
const fullCustomerSample = `${ordersCte}
SELECT * FROM orders WHERE customer_id = 42 ORDER BY id;`;
const recent: StoryTable = {
  name: 'orders', columns: ['id', 'customer_id', 'order_date', 'total', 'status'],
  rows: [
    ['101', '42', '2024-06-01', '90', 'completed'],
    ['102', '7', '2024-08-15', '150', 'completed'],
    ['103', '42', '2024-07-01', '40', 'pending'],
    ['104', '42', '2024-07-01', '60', 'completed'],
    ['105', '42', '2024-05-31', '30', 'cancelled'],
  ],
};
const recentCte = `WITH orders(id, customer_id, order_date, total, status) AS (
  VALUES (101, 42, DATE '2024-06-01', 90, 'completed'),
         (102, 7, DATE '2024-08-15', 150, 'completed'),
         (103, 42, DATE '2024-07-01', 40, 'pending'),
         (104, 42, DATE '2024-07-01', 60, 'completed'),
         (105, 42, DATE '2024-05-31', 30, 'cancelled')
)`;
const recentOutput: StoryTable = {
  name: 'result', columns: ['id', 'order_date', 'total'],
  rows: [['104', '2024-07-01', '60'], ['103', '2024-07-01', '40'], ['101', '2024-06-01', '90']],
};
const recentSample = `${recentCte}
SELECT id, order_date, total FROM orders
WHERE customer_id = 42 AND order_date >= DATE '2024-06-01'
ORDER BY order_date DESC, id DESC LIMIT 20;`;
const inspectCustomer = 'SELECT id, customer_id, order_date, total FROM orders WHERE customer_id = 7 ORDER BY id;';
const broadRead = 'SELECT id, customer_id, order_date, total FROM orders ORDER BY id;';

/** Every story is original; execution rules remain in labs.ts. */
export const labStories: Record<string, StoryPair> = {
  'sql-001': pair([orders], customerOutput, customerSample, {
    title: 'A customer calls the support desk',
    opening: 'Mai handles support at the Mây shop. Customer 42 asks for an order history, but the export contains everyone’s orders.',
    motivation: 'Give Mai a focused list: only this customer, only the three requested fields, in a predictable order.',
    exampleExplanation: 'Order 102 belongs to customer 7, so it disappears. Both orders for customer 42 remain, including the pending order.',
    constraints: ['Use the actual orders table for the main task; the example is a separate tiny fixture.', 'Return id, order_date, total in that order, with all matching rows.', 'Sort by id ascending. A LIMIT would omit part of the requested history.'],
    prediction: { question: 'If you add LIMIT 1, have you answered Mai’s question?', choices: ['Yes: one matching order proves the filter works.', 'No: the task asks for the complete order history.'], correctChoice: 1, explanation: 'A correct filter and a complete result are separate requirements. LIMIT changes the business question.' },
    experiment: { title: 'Serve a different customer', sql: inspectCustomer, observation: 'Inspect customer 7’s history. Which WHERE value changes, and which ordering rule stays the same? This is a separate experiment, not the main submission.' },
    transferQuestion: 'How would you return all pending orders for customer 7, keeping a stable id order?',
  }, {
    title: 'Khách gọi đến bộ phận hỗ trợ',
    opening: 'Mai phụ trách hỗ trợ ở cửa hàng Mây. Khách 42 hỏi lịch sử mua hàng, nhưng bản xuất dữ liệu đang chứa đơn của tất cả khách.',
    motivation: 'Giúp Mai lấy đúng khách, đúng ba thông tin cần dùng và một thứ tự dễ đối chiếu.',
    exampleExplanation: 'Đơn 102 của khách 7 bị loại. Hai đơn của khách 42 vẫn được giữ, kể cả đơn đang chờ xử lý.',
    constraints: ['Làm bài chính trên bảng orders thật; ví dụ nhỏ dùng dữ liệu riêng.', 'Trả đủ các đơn phù hợp và ba cột id, order_date, total theo thứ tự này.', 'Sắp xếp id tăng dần. LIMIT sẽ làm thiếu lịch sử được yêu cầu.'],
    prediction: { question: 'Thêm LIMIT 1 thì đã trả lời đúng yêu cầu của Mai chưa?', choices: ['Rồi: một đơn đúng khách là đủ chứng minh bộ lọc.', 'Chưa: Mai cần toàn bộ lịch sử đơn hàng.'], correctChoice: 1, explanation: 'Lọc đúng và trả đủ là hai yêu cầu khác nhau. LIMIT làm thay đổi câu hỏi nghiệp vụ.' },
    experiment: { title: 'Tra lịch sử một khách khác', sql: inspectCustomer, observation: 'Xem đơn của khách 7. Giá trị nào trong WHERE thay đổi, quy tắc sắp xếp nào vẫn giữ? Đây là thí nghiệm riêng, không phải lời giải bài chính.' },
    transferQuestion: 'Muốn lấy tất cả đơn pending của khách 7, theo id tăng dần, bạn sẽ sửa gì?',
  }),
  'sql-002': pair([{
    name: 'orders', columns: ['id', 'customer_id', 'status', 'total'],
    rows: [['101', '42', 'completed', '90'], ['102', '7', 'completed', '150'], ['103', '42', 'pending', '40'], ['104', '42', 'completed', '60']],
  }], { name: 'result', columns: ['customer_id', 'revenue'], rows: [['7', '150'], ['42', '150']] }, `WITH orders(id, customer_id, status, total) AS (
  VALUES (101, 42, 'completed', 90), (102, 7, 'completed', 150),
         (103, 42, 'pending', 40), (104, 42, 'completed', 60)
)
SELECT customer_id, SUM(total) AS revenue FROM orders WHERE status = 'completed'
GROUP BY customer_id ORDER BY revenue DESC, customer_id ASC LIMIT 10;`, {
    title: 'Who deserves the loyalty reward?',
    opening: 'An prepares a loyalty campaign for Mây. A customer with many unpaid orders looks valuable in the raw export, but finance only counts completed purchases.',
    motivation: 'Build a top-ten revenue list that finance can trust, including a rule for tied totals.',
    exampleExplanation: 'Customer 42 contributes 90 + 60, not 190: the pending 40 is excluded. Both customers total 150, so customer 7 comes first.',
    constraints: ['Only completed orders count as revenue.', 'Return customer_id and SUM(total) AS revenue, one row per customer.', 'Order by revenue descending, then customer_id ascending; limit the full dataset to 10.'],
    prediction: { question: 'When should you remove pending orders?', choices: ['Before grouping, with WHERE.', 'After summing every status, by hiding some groups.'], correctChoice: 0, explanation: 'WHERE controls which rows contribute to SUM. Filtering groups afterward cannot undo pending amounts already included in each sum.' },
    experiment: { title: 'Compare the all-status ranking', sql: 'SELECT customer_id, SUM(total) AS revenue FROM orders GROUP BY customer_id ORDER BY revenue DESC, customer_id ASC LIMIT 10;', observation: 'Compare this list with completed-only revenue. A valid SQL statement can still answer a different business question.' },
    transferQuestion: 'If finance wants only customers with completed revenue above 500, where should that group-level condition go?',
  }, {
    title: 'Ai nên nhận ưu đãi khách thân thiết?',
    opening: 'An chuẩn bị chương trình tri ân cho Mây. Trong dữ liệu thô, khách có nhiều đơn chưa thanh toán trông rất giá trị, nhưng kế toán chỉ tính đơn hoàn tất.',
    motivation: 'Tạo danh sách 10 khách có doanh thu cao nhất, kể cả quy tắc xử lý khi hai khách bằng điểm.',
    exampleExplanation: 'Khách 42 có 90 + 60, không phải 190: đơn pending trị giá 40 không được tính. Cùng doanh thu 150 nên khách 7 đứng trước khách 42.',
    constraints: ['Chỉ tính các đơn completed.', 'Trả customer_id và SUM(total) AS revenue, mỗi khách một dòng.', 'Sắp xếp revenue giảm dần, customer_id tăng dần rồi lấy 10 khách trên dataset thật.'],
    prediction: { question: 'Nên loại đơn pending ở bước nào?', choices: ['Trước khi gom nhóm, bằng WHERE.', 'Sau khi đã cộng mọi trạng thái, bằng cách ẩn một số nhóm.'], correctChoice: 0, explanation: 'WHERE quyết định dòng nào được cộng. Lọc nhóm sau đó không trừ được tiền pending đã nằm trong tổng.' },
    experiment: { title: 'So với doanh thu của mọi trạng thái', sql: 'SELECT customer_id, SUM(total) AS revenue FROM orders GROUP BY customer_id ORDER BY revenue DESC, customer_id ASC LIMIT 10;', observation: 'So danh sách này với danh sách chỉ tính completed. SQL chạy được vẫn có thể trả lời sai câu hỏi nghiệp vụ.' },
    transferQuestion: 'Muốn chỉ giữ khách có doanh thu completed trên 500, điều kiện áp dụng cho nhóm nên đặt ở đâu?',
  }),
  'sql-003': pair([orders, { name: 'customers', columns: ['id', 'name'], rows: [['7', 'Long'], ['42', 'Mai']] }],
    { name: 'result', columns: ['order_id', 'customer_name', 'total'], rows: [['101', 'Mai', '90'], ['103', 'Mai', '40']] },
    `${ordersCte}, customers(id, name) AS (VALUES (7, 'Long'), (42, 'Mai'))
SELECT o.id AS order_id, c.name AS customer_name, o.total
FROM orders o JOIN customers c ON o.customer_id = c.id
WHERE o.customer_id = 42 ORDER BY order_id;`, {
      title: 'Turn IDs into a useful packing list',
      opening: 'Linh packs orders at Mây. The order sheet shows customer_id = 42, but she needs the customer’s name to check the parcel.',
      motivation: 'Connect the order to the right customer without duplicating or losing orders.',
      exampleExplanation: 'Both orders reference customers.id = 42, so both get Mai’s name. Order 102 belongs to Long and is outside the request.',
      constraints: ['Join orders.customer_id to customers.id, the actual relationship.', 'Return order_id, customer_name, total, sorted by order_id ascending.', 'Keep exactly one result row for each requested order.'],
      prediction: { question: 'What happens if you join orders and customers without their relationship?', choices: ['SQL automatically detects the foreign key and fixes the join.', 'A cross join can pair each order with every customer.'], correctChoice: 1, explanation: 'The database does not infer a missing join condition. A Cartesian product creates extra rows and can greatly increase work.' },
      experiment: { title: 'Inspect joined orders for another customer', sql: 'SELECT o.id AS order_id, c.name AS customer_name, o.total FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.customer_id = 7 ORDER BY o.id;', observation: 'Check that each order still appears once. Shared column names such as id are why table aliases matter.' },
      transferQuestion: 'How would you attach product names to order_items using product_id, without multiplying each item unnecessarily?',
    }, {
      title: 'Biến mã khách thành danh sách giao hàng',
      opening: 'Linh đóng hàng tại Mây. Phiếu đơn chỉ có customer_id = 42, trong khi Linh cần tên khách để kiểm tra kiện hàng.',
      motivation: 'Nối mỗi đơn với đúng khách, không làm trùng hay mất đơn.',
      exampleExplanation: 'Hai đơn đều tham chiếu customers.id = 42 nên cùng mang tên Mai. Đơn 102 thuộc Long và không nằm trong yêu cầu.',
      constraints: ['Nối orders.customer_id với customers.id theo đúng quan hệ.', 'Trả order_id, customer_name, total, sắp xếp order_id tăng dần.', 'Mỗi đơn được yêu cầu xuất hiện đúng một lần.'],
      prediction: { question: 'Nối hai bảng mà không chỉ rõ quan hệ thì sao?', choices: ['SQL tự tìm khóa ngoại và sửa phép nối.', 'CROSS JOIN có thể ghép mỗi đơn với mọi khách.'], correctChoice: 1, explanation: 'Database không tự suy ra điều kiện JOIN bị thiếu. Tích Descartes tạo thêm nhiều dòng và có thể làm lượng công việc tăng mạnh.' },
      experiment: { title: 'Xem đơn đã nối của khách khác', sql: 'SELECT o.id AS order_id, c.name AS customer_name, o.total FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.customer_id = 7 ORDER BY o.id;', observation: 'Kiểm tra mỗi đơn vẫn xuất hiện một lần. Khi hai bảng đều có id, alias giúp chỉ rõ cột thuộc bảng nào.' },
      transferQuestion: 'Muốn gắn tên sản phẩm vào order_items qua product_id, bạn sẽ nối thế nào để không nhân số dòng ngoài ý muốn?',
    }),
  'sql-004': pair([recent], {
    name: 'result', columns: ['customer_id', 'order_id', 'order_date', 'total'],
    rows: [['7', '102', '2024-08-15', '150'], ['42', '104', '2024-07-01', '60']],
  }, `${recentCte}, ranked_orders AS (
  SELECT customer_id, id, order_date, total,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC, id DESC) AS rn
  FROM orders
)
SELECT customer_id, id AS order_id, order_date, total FROM ranked_orders
WHERE rn = 1 ORDER BY customer_id;`, {
    title: 'One latest purchase per customer',
    opening: 'Huy builds a follow-up dashboard at Mây. Showing every purchase overwhelms the team; they want each customer’s latest order with its full details.',
    motivation: 'Choose one complete row per customer, even when two orders share a date.',
    exampleExplanation: 'Customer 42 has two orders on July 1. The rule chooses order 104 because its id is larger. Customer 7 keeps order 102.',
    constraints: ['The most recent order has the greatest order_date, then greatest id on a tie.', 'Return customer_id, order_id, order_date, total and sort by customer_id ascending.', 'PARTITION BY in a window is a logical group; it does not create partitioned tables.'],
    prediction: { question: 'Does MAX(order_date) alone preserve the latest order’s total and id?', choices: ['Yes: the other columns automatically come from that row.', 'No: it gives a date; you still need a rule to select a complete row.'], correctChoice: 1, explanation: 'Aggregation collapses rows. A window ranking keeps the row’s fields, and the tie-breaker makes the selected order deterministic.' },
    experiment: { title: 'Inspect ranking before selecting the winner', sql: 'SELECT customer_id, id AS order_id, order_date, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC, id DESC) AS rn FROM orders WHERE customer_id IN (7, 42) ORDER BY customer_id, rn;', observation: 'Observe how rn starts again for each customer. The main answer then filters rn = 1 in an outer query.' },
    transferQuestion: 'For each customer’s latest three orders, which ranking filter changes? What if “latest” is based on a non-unique timestamp?',
  }, {
    title: 'Mỗi khách chỉ hiện lần mua gần nhất',
    opening: 'Huy làm màn hình chăm sóc khách cho Mây. Hiện mọi đơn thì quá rối; đội chăm sóc muốn một đơn gần nhất của từng khách, kèm đủ chi tiết.',
    motivation: 'Chọn đúng một dòng cho mỗi khách, kể cả khi hai đơn cùng ngày.',
    exampleExplanation: 'Khách 42 có hai đơn ngày 1/7. Theo quy tắc, chọn đơn 104 vì id lớn hơn. Khách 7 giữ đơn 102.',
    constraints: ['Đơn mới nhất có order_date lớn nhất; nếu cùng ngày, chọn id lớn nhất.', 'Trả customer_id, order_id, order_date, total rồi sắp xếp customer_id tăng dần.', 'PARTITION BY trong window chỉ chia nhóm tính toán; nó không tạo bảng partition.'],
    prediction: { question: 'Chỉ dùng MAX(order_date) có giữ được total và id của đúng đơn mới nhất không?', choices: ['Có: các cột khác tự lấy từ đơn đó.', 'Không: mới có ngày; vẫn cần quy tắc chọn nguyên dòng.'], correctChoice: 1, explanation: 'Phép gom nhóm gộp các dòng. Window ranking giữ các cột của dòng, còn khóa phụ giúp chọn một đơn ổn định khi ngày trùng nhau.' },
    experiment: { title: 'Xem thứ hạng trước khi chọn người đứng đầu', sql: 'SELECT customer_id, id AS order_id, order_date, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC, id DESC) AS rn FROM orders WHERE customer_id IN (7, 42) ORDER BY customer_id, rn;', observation: 'Quan sát rn bắt đầu lại với mỗi khách. Bài chính sẽ lọc rn = 1 ở query ngoài.' },
    transferQuestion: 'Muốn ba đơn gần nhất của mỗi khách, bạn đổi điều kiện thứ hạng thế nào? Nếu ngày giờ có thể trùng thì cần khóa phụ gì?',
  }),
  'index-005': pair([orders], fullCustomerOutput, fullCustomerSample, {
    title: 'A short result can hide a long search',
    opening: 'Mai’s customer-history screen returns only a handful of rows. Nam asks why the database still checks so many orders to find them.',
    motivation: 'Separate the rows shown on screen from the rows the database had to inspect.',
    exampleExplanation: 'Two of the three sample rows belong to customer 42. This explains filtering, not the real scan cost: inspect the full lab’s executed plan for that.',
    constraints: ['Keep the main customer-42 lookup unchanged and return every matching order.', 'Start with primary-key indexes only; orders.customer_id is not indexed.', 'Observe the actual access node, not a speed claim inferred from output size.'],
    prediction: { question: 'The query returns 50 rows. Must it have inspected only 50 rows?', choices: ['Yes: result size is the amount of database work.', 'No: it may have tested the entire table to find them.'], correctChoice: 1, explanation: 'A Seq Scan can return few rows while rejecting many others. Actual Rows and Rows Removed by Filter help describe work at that node; account for loops.' },
    experiment: { title: 'Read all orders as a counterexample', sql: broadRead, observation: 'This query asks for every order. A sequential scan can be sensible when most of the table is needed. Compare the actual access node; do not treat every scan as a bug.' },
    transferQuestion: 'If a report needs almost every order, what evidence would you want before recommending an index?',
  }, {
    title: 'Ít kết quả chưa chắc ít công việc',
    opening: 'Màn hình của Mai chỉ trả một ít đơn. Nam thắc mắc vì sao database vẫn phải kiểm tra rất nhiều đơn để tìm ra chúng.',
    motivation: 'Phân biệt số dòng nhìn thấy với số dòng database phải kiểm tra.',
    exampleExplanation: 'Hai trong ba dòng ví dụ thuộc khách 42. Ví dụ giải thích cách lọc, không phải chi phí quét thật: hãy xem plan chạy trên dataset của bài.',
    constraints: ['Giữ query khách 42 của bài chính và trả đủ các đơn phù hợp.', 'Trạng thái đầu chỉ có index khóa chính; chưa có index trên orders.customer_id.', 'Quan sát node truy cập thật, không suy ra tốc độ từ số dòng kết quả.'],
    prediction: { question: 'Query trả 50 dòng thì chắc chỉ kiểm tra 50 dòng?', choices: ['Đúng: số dòng kết quả là lượng công việc.', 'Không: có thể đã kiểm tra cả bảng để tìm chúng.'], correctChoice: 1, explanation: 'Seq Scan có thể trả ít dòng nhưng loại rất nhiều dòng. Actual Rows và Rows Removed by Filter giúp giải thích công việc ở node đó; cần xét cả số vòng lặp.' },
    experiment: { title: 'Thử đọc toàn bộ đơn hàng', sql: broadRead, observation: 'Query này cần mọi đơn. Quét tuần tự có thể hợp lý khi cần phần lớn bảng. So node truy cập thực tế, đừng coi mọi scan là lỗi.' },
    transferQuestion: 'Nếu báo cáo cần gần hết các đơn, bạn cần bằng chứng gì trước khi đề xuất thêm index?',
  }),
  'index-006': pair([orders], fullCustomerOutput, fullCustomerSample, {
    title: 'Build a shortcut for the busy support desk',
    opening: 'Mai looks up individual customers all day. Nam wants the database to find one customer’s orders without repeating a full-table search each time.',
    motivation: 'Create a useful customer lookup index, then prove that the complete result is unchanged and scan work decreases.',
    exampleExplanation: 'The target rows stay 101 and 103. An index changes how they are found, not which customer’s orders should be returned.',
    constraints: ['Create an index starting with orders.customer_id; its name is your choice.', 'Rerun the original SELECT and preserve all fields and matching rows.', 'The lab checks at least 80% less orders tuple work and actual index use; milliseconds alone do not determine success.'],
    prediction: { question: 'Once this index exists, should every orders query become faster?', choices: ['Yes: an index is a universal acceleration switch.', 'No: its usefulness depends on the query; it also costs storage and write work.'], correctChoice: 1, explanation: 'An index suits an access pattern. Queries needing most rows may prefer a scan, and each index must be maintained as data changes.' },
    experiment: { title: 'Try a query that needs the whole table', sql: broadRead, observation: 'After adding the customer index, compare this broad query with the selective lookup. Observe PostgreSQL’s choice instead of assuming the new index should serve both.' },
    transferQuestion: 'If the application filters orders by status instead of customer, what would you investigate before adding another index?',
  }, {
    title: 'Tạo đường tắt cho đội hỗ trợ bận rộn',
    opening: 'Mai tra từng khách cả ngày. Nam muốn database tìm đơn của một khách mà không lặp lại việc dò cả bảng mỗi lần.',
    motivation: 'Tạo index phù hợp rồi chứng minh kết quả vẫn đủ, đúng và lượng quét giảm.',
    exampleExplanation: 'Kết quả vẫn là đơn 101 và 103. Index đổi cách tìm, không đổi khách hay các đơn cần trả.',
    constraints: ['Tạo index bắt đầu bằng orders.customer_id; tự chọn tên index.', 'Chạy lại SELECT gốc, giữ đủ cột và các dòng phù hợp.', 'Bài kiểm tra index được dùng và lượng công việc trên orders giảm ít nhất 80%; số mili giây không quyết định việc đạt bài.'],
    prediction: { question: 'Có index này rồi, mọi query trên orders đều nhanh hơn?', choices: ['Có: index là nút tăng tốc cho mọi query.', 'Không: còn tùy query; index cũng tốn lưu trữ và công cập nhật.'], correctChoice: 1, explanation: 'Index phục vụ một cách truy cập. Query cần nhiều dòng có thể chọn quét bảng, và mọi index đều cần bảo trì khi dữ liệu thay đổi.' },
    experiment: { title: 'Thử query cần toàn bộ bảng', sql: broadRead, observation: 'Sau khi thêm index khách, so query rộng này với query lọc một khách. Xem PostgreSQL chọn gì thay vì mặc định index mới phải dùng cho cả hai.' },
    transferQuestion: 'Nếu ứng dụng chuyển sang lọc theo status, bạn cần tìm hiểu gì trước khi thêm một index nữa?',
  }),
  'index-007': pair([recent], recentOutput, recentSample, {
    title: 'The newest orders should appear first',
    opening: 'Mây’s customer page loads the latest 20 orders. The customer index finds the right group, but PostgreSQL still has to sort that group for every page view.',
    motivation: 'Give the database an access path that matches both the customer filter and the stable newest-first order.',
    exampleExplanation: 'Order 102 is another customer’s; 105 is before June. Orders 104 and 103 share a date, so descending id puts 104 first.',
    constraints: ['Keep customer_id = 42 and order_date >= 2024-06-01.', 'Return id, order_date, total; order by order_date DESC, id DESC; limit 20.', 'The actual plan should use a customer_id, order_date, id index without a separate Sort.'],
    prediction: { question: 'Why does the index begin with customer_id?', choices: ['The equality filter isolates one customer before reading date/id order.', 'The first column is decorative; any order serves this query identically.'], correctChoice: 0, explanation: 'A composite B-tree has a key order. Fixing the leading customer key lets subsequent date/id keys provide the requested ordering within that customer.' },
    experiment: { title: 'Remove the leading-key filter', sql: "SELECT id, order_date, total FROM orders WHERE order_date >= DATE '2024-06-01' ORDER BY order_date DESC, id DESC LIMIT 20;", observation: 'This feed covers every customer. Does the customer-first index still remove sorting? Compare the observed plan; the answer depends on the available indexes and planner.' },
    transferQuestion: 'For a feed filtered by customer_id and status, what candidate key orders would you test, and what writes would those indexes add?',
  }, {
    title: 'Đơn mới nhất phải hiện trước',
    opening: 'Trang khách hàng của Mây tải 20 đơn mới nhất. Index khách tìm được đúng nhóm, nhưng PostgreSQL vẫn phải sắp xếp nhóm đó mỗi lần mở trang.',
    motivation: 'Tạo cách truy cập khớp cả bộ lọc khách và thứ tự mới nhất ổn định.',
    exampleExplanation: 'Đơn 102 thuộc khách khác; 105 trước tháng 6. Đơn 104 và 103 cùng ngày nên id giảm dần đưa 104 lên trước.',
    constraints: ['Giữ customer_id = 42 và order_date >= 2024-06-01.', 'Trả id, order_date, total; sắp xếp order_date DESC, id DESC; giới hạn 20.', 'Plan thật cần dùng index customer_id, order_date, id và không có Sort riêng.'],
    prediction: { question: 'Vì sao đặt customer_id đầu index?', choices: ['Điều kiện bằng chọn một khách trước khi đọc theo thứ tự ngày/id.', 'Cột đầu chỉ để trang trí; thứ tự nào cũng phục vụ query như nhau.'], correctChoice: 0, explanation: 'B-tree nhiều cột có thứ tự khóa. Cố định khóa khách đầu tiên giúp các khóa ngày/id tiếp theo cung cấp thứ tự bên trong nhóm khách đó.' },
    experiment: { title: 'Bỏ bộ lọc trên khóa đầu', sql: "SELECT id, order_date, total FROM orders WHERE order_date >= DATE '2024-06-01' ORDER BY order_date DESC, id DESC LIMIT 20;", observation: 'Trang này lấy mọi khách. Index bắt đầu bằng khách còn bỏ được Sort không? So plan quan sát được; kết quả còn tùy index đang có và planner.' },
    transferQuestion: 'Nếu trang lọc theo cả customer_id và status, bạn sẽ thử thứ tự khóa nào, và các index đó làm tăng công ghi ra sao?',
  }),
  'index-008': pair([{
    name: 'customers', columns: ['id', 'name', 'email'],
    rows: [['42', 'Mai', 'customer42@example.com'], ['142', 'Long', 'customer142@example.com'], ['420', 'An', 'customer420@example.com']],
  }], { name: 'result', columns: ['id', 'name', 'email'], rows: [['42', 'Mai', 'customer42@example.com'], ['420', 'An', 'customer420@example.com']] }, `WITH customers(id, name, email) AS (
  VALUES (42, 'Mai', 'customer42@example.com'), (142, 'Long', 'customer142@example.com'), (420, 'An', 'customer420@example.com')
)
SELECT id, name, email FROM customers WHERE email LIKE 'customer42%' ORDER BY id;`, {
    title: 'Autocomplete and investigation ask different questions',
    opening: 'Mai remembers the beginning of a customer’s email. Meanwhile, fraud support wants to find “42” anywhere in an email. Both look like text search, but they ask for different matching ranges.',
    motivation: 'Support a prefix lookup and understand why the same B-tree is not a general substring-search tool.',
    exampleExplanation: 'customer42% matches 42 and 420. It does not match customer142@example.com; %42% would match all three examples.',
    constraints: ["The main predicate stays email LIKE 'customer42%'.", 'Return id, name, email sorted by id.', 'Create a useful email B-tree; text_pattern_ops is the provided PostgreSQL prefix approach.'],
    prediction: { question: 'Does a trailing wildcard describe the same search as a leading wildcard?', choices: ['Yes: both mean the text can occur anywhere.', 'No: a fixed prefix gives an ordered range; a leading wildcard does not.'], correctChoice: 1, explanation: 'Prefix and substring searches differ in both meaning and possible access paths. Observe the actual plan; PostgreSQL may choose a scan on small or broad results.' },
    experiment: { title: 'Switch to a substring search', sql: "SELECT id, name, email FROM customers WHERE email LIKE '%42%' ORDER BY id;", observation: 'Compare both the returned customers and access node with the prefix query after creating the index. The experiment changes the search question.' },
    transferQuestion: 'If the product must search an arbitrary substring, what different indexing approach would you investigate instead of promising this prefix B-tree will solve it?',
  }, {
    title: 'Gợi ý email và điều tra là hai câu hỏi khác nhau',
    opening: 'Mai nhớ phần đầu email của khách. Đội kiểm tra gian lận lại cần tìm “42” ở bất kỳ đâu trong email. Cùng là tìm văn bản nhưng phạm vi khớp khác nhau.',
    motivation: 'Tối ưu tìm theo tiền tố và hiểu vì sao cùng một B-tree không giải quyết mọi tìm kiếm chuỗi con.',
    exampleExplanation: 'customer42% khớp khách 42 và 420. Nó không khớp customer142@example.com; %42% sẽ khớp cả ba ví dụ.',
    constraints: ["Bộ lọc bài chính giữ email LIKE 'customer42%'.", 'Trả id, name, email theo id tăng dần.', 'Tạo B-tree phù hợp trên email; text_pattern_ops là cách tìm tiền tố PostgreSQL được gợi ý.'],
    prediction: { question: 'Wildcard ở cuối và ở đầu có cùng ý nghĩa tìm kiếm không?', choices: ['Có: đều tìm đoạn chữ ở bất kỳ đâu.', 'Không: tiền tố cố định tạo một khoảng có thứ tự; wildcard đầu thì không.'], correctChoice: 1, explanation: 'Tìm tiền tố và chuỗi con khác cả ý nghĩa lẫn cách truy cập. Xem plan thật; bảng nhỏ hoặc kết quả rộng vẫn có thể khiến PostgreSQL chọn scan.' },
    experiment: { title: 'Chuyển sang tìm chuỗi con', sql: "SELECT id, name, email FROM customers WHERE email LIKE '%42%' ORDER BY id;", observation: 'Sau khi tạo index, so cả danh sách khách lẫn node truy cập với query tiền tố. Thí nghiệm này thay đổi câu hỏi tìm kiếm.' },
    transferQuestion: 'Nếu sản phẩm cần tìm chuỗi ở vị trí bất kỳ, bạn sẽ tìm hiểu cách đánh index nào khác thay vì hứa B-tree tiền tố sẽ giải quyết?',
  }),
  'performance-009': pair([orders], {
    name: 'result', columns: ['id', 'customer_id', 'total'], rows: [['101', '42', '90'], ['103', '42', '40']],
  }, `${ordersCte}
SELECT id, customer_id, total FROM orders WHERE customer_id = 42 ORDER BY id;`, {
    title: 'Read the database’s evidence before guessing',
    opening: 'Nam receives “the orders page feels slow” with no useful explanation. He needs evidence about the access path, estimates and work actually performed.',
    motivation: 'Read an executed plan rather than treating planner cost, row estimates and milliseconds as the same number.',
    exampleExplanation: 'These are the rows the tiny SELECT would return. They are not a measured plan; run the main lab to capture actual metrics from its real dataset.',
    constraints: ['Capture an executed plan for the main customer lookup; ANALYZE executes the SELECT.', 'Read Plan Rows, Actual Rows, Actual Loops and Rows Removed by Filter at the appropriate node.', 'Do not add parent and child timings as if they were independent costs.'],
    prediction: { question: 'Is Total Cost = 500 a measured execution time of 500 ms?', choices: ['No: cost is a planner estimate in its own units.', 'Yes: cost always means milliseconds.'], correctChoice: 0, explanation: 'Execution Time is measured in milliseconds; Total Cost is a planner estimate. Estimated rows and observed rows also answer different questions.' },
    experiment: { title: 'Change selectivity and inspect the new plan', sql: 'SELECT id, customer_id, total FROM orders WHERE customer_id BETWEEN 1 AND 500 ORDER BY id;', observation: 'The filter now requests many customers. Compare estimates, actual rows and access work. A plan is evidence for this query and dataset, not every future query.' },
    transferQuestion: 'If estimated and actual rows differ greatly at a join, what would you investigate before deciding that an index is missing?',
  }, {
    title: 'Đọc bằng chứng của database trước khi đoán',
    opening: 'Nam nhận báo cáo “trang đơn hàng hơi chậm” nhưng chưa có giải thích hữu ích. Anh cần biết cách truy cập, số dòng dự đoán và công việc thật đã làm.',
    motivation: 'Đọc plan đã chạy, phân biệt chi phí dự đoán, số dòng và mili giây.',
    exampleExplanation: 'Đây là các dòng SELECT nhỏ sẽ trả, không phải plan đã đo. Chạy bài chính để lấy số liệu thật từ dataset của bài.',
    constraints: ['Lấy plan đã chạy cho query khách của bài; ANALYZE thực sự chạy SELECT.', 'Đọc Plan Rows, Actual Rows, Actual Loops và Rows Removed by Filter ở đúng node.', 'Không cộng thời gian node cha và con như các phần chi phí độc lập.'],
    prediction: { question: 'Total Cost = 500 có nghĩa query đã chạy mất 500 ms không?', choices: ['Không: cost là ước tính theo đơn vị của planner.', 'Có: cost luôn là số mili giây.'], correctChoice: 0, explanation: 'Execution Time được đo bằng mili giây; Total Cost là ước tính của planner. Số dòng ước tính và số dòng thực tế cũng trả lời hai câu hỏi khác nhau.' },
    experiment: { title: 'Đổi độ chọn lọc rồi xem plan mới', sql: 'SELECT id, customer_id, total FROM orders WHERE customer_id BETWEEN 1 AND 500 ORDER BY id;', observation: 'Bộ lọc giờ lấy nhiều khách. So số dòng ước tính, thực tế và lượng công việc. Plan là bằng chứng cho query và dataset này, không phải mọi query sau đó.' },
    transferQuestion: 'Nếu số dòng ước tính và thực tế lệch nhiều ở JOIN, bạn cần tìm hiểu gì trước khi kết luận thiếu index?',
  }),
  'performance-010': pair([{
    name: 'orders', columns: ['id', 'order_date', 'total'],
    rows: [['101', '2024-06-30', '90'], ['102', '2024-07-01', '150'], ['103', '2024-07-31', '40'], ['104', '2024-08-01', '60'], ['105', '2025-07-01', '30']],
  }], { name: 'result', columns: ['id', 'order_date', 'total'], rows: [['102', '2024-07-01', '150'], ['103', '2024-07-31', '40']] }, `WITH orders(id, order_date, total) AS (
  VALUES (101, DATE '2024-06-30', 90), (102, DATE '2024-07-01', 150),
         (103, DATE '2024-07-31', 40), (104, DATE '2024-08-01', 60), (105, DATE '2025-07-01', 30)
)
SELECT id, order_date, total FROM orders
WHERE order_date >= DATE '2024-07-01' AND order_date < DATE '2024-08-01' ORDER BY id;`, {
    title: 'The date index exists. Why is July still expensive?',
    opening: 'An’s July report already has an order_date index, but the query extracts year and month from every date. Nam wants the query to express the range the index actually stores.',
    motivation: 'Rewrite the predicate while keeping exactly the same July 2024 orders.',
    exampleExplanation: 'July 1 and July 31 are included. June 30, August 1 and July 2025 are excluded: both boundaries and year matter.',
    constraints: ['The date index is already present; adding more indexes is not required.', 'Use a start-inclusive, end-exclusive July 2024 range.', 'Keep id, order_date, total in id order; the lab checks equal results and at least 80% less tuple work.'],
    prediction: { question: 'Would filtering only EXTRACT(MONTH FROM order_date) = 7 preserve this report?', choices: ['Yes: July always means July 2024.', 'No: it would also include July in other years.'], correctChoice: 1, explanation: 'Optimization must preserve meaning. A date range expresses both the year and month and can give the ordinary date index a usable condition.' },
    experiment: { title: 'Spot a boundary mistake', sql: "SELECT id, order_date, total FROM orders WHERE order_date >= DATE '2024-07-01' AND order_date <= DATE '2024-08-01' ORDER BY id;", observation: 'The inclusive end admits August 1. Compare results with the correct half-open range: a query can use an index and still be wrong.' },
    transferQuestion: 'How would the same half-open rule select one day from a timestamp column without guessing the last fraction of a second?',
  }, {
    title: 'Có index ngày rồi, vì sao báo cáo tháng 7 vẫn tốn việc?',
    opening: 'Báo cáo tháng 7 của An đã có index order_date, nhưng query tách năm và tháng từ từng ngày. Nam muốn viết đúng khoảng ngày mà index đang lưu.',
    motivation: 'Đổi bộ lọc nhưng giữ chính xác các đơn tháng 7/2024.',
    exampleExplanation: 'Lấy ngày 1/7 và 31/7. Loại 30/6, 1/8 và tháng 7/2025: cần đúng cả biên lẫn năm.',
    constraints: ['Index ngày đã có; không cần thêm index để giải bài này.', 'Dùng khoảng tháng 7/2024 gồm ngày bắt đầu, không gồm ngày kết thúc.', 'Giữ id, order_date, total theo id; bài kiểm tra kết quả tương đương và công việc giảm ít nhất 80%.'],
    prediction: { question: 'Chỉ lọc EXTRACT(MONTH FROM order_date) = 7 có giữ đúng báo cáo không?', choices: ['Có: tháng 7 luôn là tháng 7/2024.', 'Không: nó còn lấy tháng 7 của các năm khác.'], correctChoice: 1, explanation: 'Tối ưu phải giữ đúng ý nghĩa. Khoảng ngày thể hiện cả năm lẫn tháng và có thể tạo điều kiện truy cập cho index ngày thông thường.' },
    experiment: { title: 'Tìm lỗi ở biên kết thúc', sql: "SELECT id, order_date, total FROM orders WHERE order_date >= DATE '2024-07-01' AND order_date <= DATE '2024-08-01' ORDER BY id;", observation: 'Biên <= lấy thêm ngày 1/8. So kết quả với khoảng đúng: dùng được index vẫn có thể sai nghiệp vụ.' },
    transferQuestion: 'Muốn lọc một ngày trên cột timestamp, bạn dùng khoảng tương tự thế nào để không phải đoán phần giây cuối cùng?',
  }),
  'performance-011': pair([{
    name: 'orders', columns: ['id', 'total'], rows: [['10', '90'], ['20', '150'], ['30', '40'], ['40', '60'], ['50', '30']],
  }], { name: 'result', columns: ['id', 'total'], rows: [['40', '60'], ['50', '30']] }, `WITH orders(id, total) AS (VALUES (10, 90), (20, 150), (30, 40), (40, 60), (50, 30))
SELECT id, total FROM orders WHERE id > 30 ORDER BY id LIMIT 20;`, {
    title: 'The next page should not revisit every earlier page',
    opening: 'Linh scrolls far down Mây’s order list. Page one is quick; a deep page makes the database walk past thousands of orders the UI will never show.',
    motivation: 'Continue after the last seen id instead of repeatedly counting and discarding earlier rows.',
    exampleExplanation: 'In this tiny example the last seen id is 30, so the next page starts at 40. IDs need not be consecutive. The main lab’s cursor is 40000, not 30.',
    constraints: ['The main lab asks for id, customer_id, order_date, total where id > 40000, ordered by id, limit 20.', 'Use the primary-key ordering and preserve the exact expected page.', 'On the 10,000-row profile, this cursor has no next page; use at least 50,000 rows to inspect the deep-page effect.'],
    prediction: { question: 'With an id index, is a large OFFSET free?', choices: ['No: PostgreSQL can still visit and discard the skipped rows.', 'Yes: it jumps directly to the row number at no cost.'], correctChoice: 0, explanation: 'An index can provide order without eliminating OFFSET’s skipped work. A keyset predicate describes the key after which to continue.' },
    experiment: { title: 'Inspect the first page', sql: 'SELECT id, order_date, total FROM orders ORDER BY id LIMIT 20;', observation: 'Compare first-page work with the starter deep OFFSET and your cursor query. Different pages should not be compared as if their results were identical.' },
    transferQuestion: 'For ORDER BY order_date DESC, id DESC, which two values must a stable cursor contain, and how would you continue after them?',
  }, {
    title: 'Trang tiếp theo không nên đọc lại mọi trang trước',
    opening: 'Linh cuộn sâu trong danh sách đơn của Mây. Trang đầu nhanh, còn trang xa khiến database đi qua hàng nghìn đơn mà giao diện không hiển thị.',
    motivation: 'Tiếp tục sau id đã xem thay vì liên tục đếm và bỏ các dòng cũ.',
    exampleExplanation: 'Ví dụ nhỏ đã xem đến id 30 nên trang tiếp bắt đầu từ 40. ID không cần liền nhau. Cursor bài chính là 40000, không phải 30.',
    constraints: ['Bài chính lấy id, customer_id, order_date, total với id > 40000, theo id tăng dần, giới hạn 20.', 'Dùng thứ tự khóa chính và giữ đúng trang kết quả được yêu cầu.', 'Dataset 10.000 dòng không còn trang sau cursor này; chọn ít nhất 50.000 dòng để quan sát phân trang sâu.'],
    prediction: { question: 'Có index id rồi thì OFFSET lớn không tốn công nữa?', choices: ['Không: PostgreSQL vẫn có thể đọc rồi bỏ các dòng bị skip.', 'Đúng: nó nhảy thẳng đến số thứ tự dòng mà không tốn công.'], correctChoice: 0, explanation: 'Index có thể cung cấp thứ tự nhưng không loại công việc bỏ dòng của OFFSET. Điều kiện keyset chỉ rõ khóa sau đó cần tiếp tục.' },
    experiment: { title: 'Xem trang đầu tiên', sql: 'SELECT id, order_date, total FROM orders ORDER BY id LIMIT 20;', observation: 'So công việc của trang đầu với OFFSET sâu của query ban đầu và query cursor của bạn. Hai trang khác nhau không có cùng kết quả để kiểm tra tương đương.' },
    transferQuestion: 'Với ORDER BY order_date DESC, id DESC, cursor ổn định phải giữ hai giá trị nào, và lọc trang tiếp thế nào?',
  }),
  'incident-012': pair([recent], {
    name: 'result', columns: ['id', 'order_date', 'total', 'status'],
    rows: [['104', '2024-07-01', '60', 'completed'], ['103', '2024-07-01', '40', 'pending'], ['101', '2024-06-01', '90', 'completed'], ['105', '2024-05-31', '30', 'cancelled']],
  }, `${recentCte}
SELECT id, order_date, total, status FROM orders WHERE customer_id = 42
ORDER BY order_date DESC, id DESC LIMIT 20;`, {
    title: 'The team needs a fix, not another guess',
    opening: 'Mây’s order screen is slow during a campaign. Nam sees a product lookup, a frequent customer-order feed and a daily revenue report in the scenario log. He must choose where to investigate first.',
    motivation: 'Prioritize repeated expensive work, repair the access pattern and verify that the API still returns the right orders.',
    exampleExplanation: 'The customer feed keeps every status and sorts dates, then ids, descending. The tiny example has only four matching orders, so LIMIT 20 keeps all four.',
    constraints: ['The scenario’s CPU, p95 and call counts are illustrative; the browser does not measure production telemetry.', 'Preserve id, order_date, total, status and the newest-20 ordering for customer 42.', 'Use a customer/date/id index, remove the separate Sort and reduce orders tuple work at least 80%.'],
    prediction: { question: 'Which is the strongest first investigation?', choices: ['The frequent customer feed that scans and sorts for a small page.', 'Every query gets the same new index before reading any plan.'], correctChoice: 0, explanation: 'Frequency and observed work guide prioritization. The primary-key product lookup and whole-table revenue aggregate serve different access patterns.' },
    experiment: { title: 'Inspect the competing revenue workload', sql: 'SELECT status, SUM(total) AS revenue FROM orders GROUP BY status;', observation: 'This report needs data from many orders. Compare its purpose with a customer feed before deciding whether another index is a useful fix.' },
    transferQuestion: 'After a read gets faster, what evidence about write cost, workload frequency and end-to-end latency would you want before calling the incident resolved?',
  }, {
    title: 'Đội cần một cách sửa có bằng chứng',
    opening: 'Màn hình đơn của Mây chậm trong chiến dịch. Nam thấy query sản phẩm, trang đơn theo khách chạy thường xuyên và báo cáo doanh thu ngày trong log tình huống. Anh phải chọn chỗ điều tra trước.',
    motivation: 'Ưu tiên công việc tốn kém bị lặp lại, sửa cách truy cập rồi kiểm tra API vẫn trả đúng đơn.',
    exampleExplanation: 'Trang khách giữ mọi trạng thái và sắp xếp ngày, rồi id, giảm dần. Ví dụ nhỏ chỉ có bốn đơn phù hợp nên LIMIT 20 giữ cả bốn.',
    constraints: ['CPU, p95 và tần suất của tình huống là số minh họa; browser không đo telemetry production.', 'Giữ id, order_date, total, status và thứ tự 20 đơn mới nhất của khách 42.', 'Dùng index khách/ngày/id, bỏ Sort riêng và giảm công việc trên orders ít nhất 80%.'],
    prediction: { question: 'Đâu là hướng điều tra đầu tiên có cơ sở nhất?', choices: ['Trang đơn theo khách chạy thường xuyên, quét và sắp xếp để trả ít dòng.', 'Thêm cùng một index cho mọi query trước khi xem plan.'], correctChoice: 0, explanation: 'Tần suất và công việc quan sát được giúp chọn ưu tiên. Query sản phẩm theo khóa chính và báo cáo doanh thu toàn bảng có cách truy cập khác nhau.' },
    experiment: { title: 'Xem workload báo cáo doanh thu', sql: 'SELECT status, SUM(total) AS revenue FROM orders GROUP BY status;', observation: 'Báo cáo này cần dữ liệu từ nhiều đơn. So mục đích với trang theo khách trước khi quyết định thêm index có giúp ích không.' },
    transferQuestion: 'Query đọc nhanh hơn rồi, bạn cần bằng chứng gì về chi phí ghi, tần suất và thời gian toàn request trước khi kết luận đã xử lý xong sự cố?',
  }),
  'index-013': pair([orders], {
    name: 'result', columns: ['order_count'], rows: [['2']],
  }, `${ordersCte}
SELECT COUNT(*) AS order_count FROM orders WHERE status = 'completed';`, {
    title: 'An index exists, but a scan can still be sensible',
    opening: 'An counts completed orders for a campaign report. Most orders have that status. Nam has added a status index, yet he must check whether it is useful for this broad request.',
    motivation: 'Learn to judge selectivity and observed work before deciding that every sequential scan needs fixing.',
    exampleExplanation: 'Two of the three sample orders are completed. The count is 2. This illustrates a broad filter, not the exact selectivity or plan of the full dataset.',
    constraints: ['Keep the main COUNT(*) AS order_count for status = completed.', 'The planner may choose an index or a sequential scan; observe its actual decision.', 'A different status changes the result and selectivity, so use it as an experiment rather than the main submission.'],
    prediction: { question: 'If a status matches most rows, must using its index be cheaper?', choices: ['No: the planner weighs the cost of each available access path.', 'Yes: an available index must always be used.'], correctChoice: 0, explanation: 'Selectivity matters, along with table size, ordering, visibility and cost estimates. Inspect the actual plan instead of forcing an index to manufacture a success.' },
    experiment: { title: 'Compare a less frequent status', sql: "SELECT COUNT(*) AS order_count FROM orders WHERE status = 'cancelled';", observation: 'Compare matching-row proportions and actual access nodes with completed orders. Different predicates may favor different plans, but a plan switch is not guaranteed.' },
    transferQuestion: 'If completed orders later become rare, what measurements and statistics would you revisit before changing the indexing strategy?',
  }, {
    title: 'Có index rồi, quét bảng vẫn có thể hợp lý',
    opening: 'An đếm đơn completed cho báo cáo chiến dịch. Phần lớn đơn có trạng thái này. Nam đã thêm index trạng thái nhưng cần kiểm tra nó có ích cho yêu cầu rộng đó không.',
    motivation: 'Hiểu độ chọn lọc và lượng công việc thực tế trước khi quyết định mọi quét tuần tự đều cần sửa.',
    exampleExplanation: 'Hai trong ba đơn ví dụ là completed nên kết quả đếm là 2. Ví dụ minh họa bộ lọc rộng, không phải độ chọn lọc hay plan chính xác của dataset thật.',
    constraints: ['Giữ COUNT(*) AS order_count với status = completed cho bài chính.', 'Planner có thể chọn index hoặc quét tuần tự; hãy quan sát quyết định thật.', 'Đổi trạng thái làm đổi kết quả và độ chọn lọc, nên dùng làm thí nghiệm riêng.'],
    prediction: { question: 'Một trạng thái khớp phần lớn dòng thì dùng index chắc rẻ hơn?', choices: ['Không: planner cân nhắc chi phí các cách truy cập đang có.', 'Đúng: có index thì luôn phải dùng.'], correctChoice: 0, explanation: 'Độ chọn lọc quan trọng, cùng với kích thước bảng, thứ tự, visibility và ước tính chi phí. Xem plan thật thay vì ép dùng index để tạo kết quả đẹp.' },
    experiment: { title: 'So với trạng thái ít phổ biến hơn', sql: "SELECT COUNT(*) AS order_count FROM orders WHERE status = 'cancelled';", observation: 'So tỷ lệ dòng khớp và node truy cập với completed. Bộ lọc khác có thể phù hợp plan khác, nhưng không đảm bảo plan phải đổi.' },
    transferQuestion: 'Nếu sau này đơn completed trở nên hiếm, bạn cần xem lại phép đo và statistics nào trước khi đổi chiến lược index?',
  }),
  'partition-014': pair([{
    name: 'orders_partitioned', columns: ['id', 'customer_id', 'order_date', 'total'],
    rows: [['101', '42', '2024-05-31', '90'], ['102', '7', '2024-06-01', '150'], ['103', '42', '2024-06-30', '40'], ['104', '42', '2024-07-01', '60']],
  }], {
    name: 'result', columns: ['id', 'customer_id', 'order_date', 'total'],
    rows: [['102', '7', '2024-06-01', '150'], ['103', '42', '2024-06-30', '40']],
  }, `WITH orders_partitioned(id, customer_id, order_date, total) AS (
  VALUES (101, 42, DATE '2024-05-31', 90), (102, 7, DATE '2024-06-01', 150),
         (103, 42, DATE '2024-06-30', 40), (104, 42, DATE '2024-07-01', 60)
)
SELECT id, customer_id, order_date, total FROM orders_partitioned
WHERE order_date >= DATE '2024-06-01' AND order_date < DATE '2024-07-01' ORDER BY id;`, {
    title: 'Open the June drawer, leave the others closed',
    opening: 'Mây stores orders in monthly partitions. An only needs June’s report, but a date_trunc filter can make the database inspect drawers from many months.',
    motivation: 'Express the partition-key range clearly so PostgreSQL can prune unrelated monthly partitions.',
    exampleExplanation: 'June 1 and June 30 qualify; May 31 and July 1 do not. These inline rows illustrate the result only: the sample CTE is not a physically partitioned table.',
    constraints: ['Use the actual orders_partitioned table for the main pruning experiment.', 'Return id, customer_id, order_date, total in id order for June 2024.', 'Partition pruning and index access are different mechanisms. An appropriate query may scan just the needed partition.'],
    prediction: { question: 'If the query scans June’s partition, does that mean partition pruning failed?', choices: ['Yes: a successful partition query must avoid every sequential scan.', 'No: pruning can skip other months while June is scanned.'], correctChoice: 1, explanation: 'Pruning decides which partitions can be skipped using bounds. A scan inside the remaining partition can be a reasonable access path.' },
    experiment: { title: 'Request two adjacent months', sql: "SELECT id, customer_id, order_date, total FROM orders_partitioned WHERE order_date >= DATE '2024-06-01' AND order_date < DATE '2024-08-01' ORDER BY id;", observation: 'Inspect which real partitions the executed plan accesses. A wider range legitimately needs more partitions; compare this with the date_trunc baseline and the June-only range.' },
    transferQuestion: 'If a query has no date restriction, which monthly partitions can safely be skipped? What other benefits might monthly partitions have for data retention?',
  }, {
    title: 'Mở ngăn tháng 6, để yên các ngăn còn lại',
    opening: 'Mây chia đơn hàng thành partition theo tháng. An chỉ cần báo cáo tháng 6, nhưng bộ lọc date_trunc có thể khiến database kiểm tra các ngăn của nhiều tháng.',
    motivation: 'Viết rõ khoảng trên khóa partition để PostgreSQL bỏ qua những tháng không liên quan.',
    exampleExplanation: 'Lấy ngày 1/6 và 30/6; loại 31/5 và 1/7. Các dòng inline chỉ minh họa kết quả: CTE ví dụ không phải bảng được chia partition vật lý.',
    constraints: ['Dùng bảng orders_partitioned thật cho thí nghiệm pruning chính.', 'Trả id, customer_id, order_date, total theo id, cho tháng 6/2024.', 'Pruning và dùng index là hai cơ chế khác nhau. Query phù hợp vẫn có thể quét partition cần thiết.'],
    prediction: { question: 'Query quét partition tháng 6 thì pruning đã thất bại?', choices: ['Đúng: thành công thì không được có bất kỳ quét tuần tự nào.', 'Không: pruning có thể bỏ các tháng khác, còn tháng 6 được quét.'], correctChoice: 1, explanation: 'Pruning dựa vào biên để quyết định partition nào được bỏ qua. Quét bên trong partition còn lại vẫn có thể là cách truy cập hợp lý.' },
    experiment: { title: 'Lấy hai tháng liền nhau', sql: "SELECT id, customer_id, order_date, total FROM orders_partitioned WHERE order_date >= DATE '2024-06-01' AND order_date < DATE '2024-08-01' ORDER BY id;", observation: 'Xem plan đã chạy truy cập những partition thật nào. Khoảng rộng hơn cần nhiều partition hơn; so với baseline date_trunc và khoảng chỉ tháng 6.' },
    transferQuestion: 'Query không giới hạn ngày thì bỏ qua an toàn được partition tháng nào? Chia theo tháng còn giúp quản lý dữ liệu cũ ra sao?',
  }),
};

export function getLabStory(id: string, locale: Locale): LabStory | undefined {
  return labStories[id]?.[locale];
}
