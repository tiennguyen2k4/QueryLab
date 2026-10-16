export type Text = [en: string, vi: string];
export type Cell = string | number | null;
export type SampleTable = { name: 'customers' | 'orders'; columns: string[]; rows: Cell[][] };
export type HandbookLesson = {
  id: string;
  level: 'basic' | 'intermediate' | 'advanced';
  title: Text;
  tagline: Text;
  what: Text;
  when: Text[];
  syntax: string;
  parts: { code: string; meaning: Text }[];
  example: {
    question: Text;
    sql: string;
    uses?: SampleTable['name'][];
    /** Query whose output is shown, run after `sql` (for statements that change data). */
    check?: string;
    result?: { columns: string[]; rows: Cell[][] };
    error?: Text;
    illustration?: { columns: Text[]; rows: (string | Text)[][] };
    note?: Text;
    runnable?: false;
  };
  mistakes: Text[];
};

export const sampleTables: Record<SampleTable['name'], SampleTable> = {
  customers: { name: 'customers', columns: ['id', 'name', 'city'], rows: [
    [1, 'An', 'Hà Nội'], [2, 'Bình', 'Đà Nẵng'], [3, 'Chi', 'Hà Nội'], [4, 'Dũng', 'Huế'],
  ] },
  orders: { name: 'orders', columns: ['id', 'customer_id', 'order_date', 'status', 'total'], rows: [
    [101, 1, '2024-01-05', 'paid', 120], [102, 2, '2024-01-09', 'pending', 80], [103, 1, '2024-02-11', 'paid', 200],
    [104, 3, '2024-02-20', 'cancelled', 50], [105, 3, '2024-03-02', 'paid', 90], [106, 1, '2024-03-15', 'pending', 60],
  ] },
};

const literal = (value: Cell) => value === null ? 'NULL' : typeof value === 'number' ? String(value) : `'${value.replaceAll("'", "''")}'`;
/** Same data the lessons display; tests run every example against it. */
export const sampleSetupSql = `
DROP TABLE IF EXISTS orders_by_month CASCADE; DROP TABLE IF EXISTS orders; DROP TABLE IF EXISTS customers;
CREATE TABLE customers (id integer PRIMARY KEY, name text NOT NULL, city text);
CREATE TABLE orders (id integer PRIMARY KEY, customer_id integer NOT NULL REFERENCES customers(id), order_date date NOT NULL, status text NOT NULL, total integer NOT NULL CHECK (total >= 0));
INSERT INTO customers VALUES ${sampleTables.customers.rows.map(row => `(${row.map(literal).join(', ')})`).join(', ')};
INSERT INTO orders VALUES ${sampleTables.orders.rows.map(row => `(${row.map(literal).join(', ')})`).join(', ')};
`;

export const sqlLessons: HandbookLesson[] = [
  {
    id: 'intro', level: 'basic',
    title: ['Database, tables, rows and columns', 'Database, bảng, dòng và cột'],
    tagline: ['Where data lives and how SQL talks to it.', 'Dữ liệu nằm ở đâu và SQL nói chuyện với nó thế nào.'],
    what: ['A database stores data in an organized way. Data lives in tables, much like spreadsheets: each column is one kind of information (name, city), each row is one record (one customer). SQL (Structured Query Language) is the language you use to ask the database questions and to change its data.',
      'Database là nơi lưu dữ liệu có tổ chức. Dữ liệu nằm trong các bảng, giống trang tính Excel: mỗi cột là một loại thông tin (tên, thành phố), mỗi dòng là một bản ghi (một khách hàng). SQL (Structured Query Language) là ngôn ngữ để hỏi database và thay đổi dữ liệu trong đó.'],
    when: [['Every lesson below uses the same two tables: customers and orders.', 'Mọi bài sau dùng chung hai bảng: customers (khách hàng) và orders (đơn hàng).'],
      ['orders.customer_id points to customers.id — that is how the two tables are linked.', 'orders.customer_id trỏ tới customers.id — đó là cách hai bảng liên kết với nhau.']],
    syntax: 'SELECT * FROM customers;',
    parts: [
      { code: 'table', meaning: ['A named set of rows with the same columns, e.g. customers.', 'Bảng: tập hợp các dòng có cùng cột, ví dụ customers.'] },
      { code: 'row', meaning: ['One record: one customer, one order.', 'Dòng: một bản ghi — một khách hàng, một đơn hàng.'] },
      { code: 'column', meaning: ['One attribute with a type: id is a number, name is text.', 'Cột: một thuộc tính có kiểu dữ liệu — id là số, name là chữ.'] },
      { code: 'primary key (id)', meaning: ['A column whose value identifies exactly one row. Never duplicated.', 'Khóa chính: cột định danh duy nhất một dòng, không bao giờ trùng.'] },
      { code: 'foreign key (customer_id)', meaning: ['A column that points to a primary key in another table.', 'Khóa ngoại: cột trỏ tới khóa chính của bảng khác.'] },
    ],
    example: {
      question: ['Show the whole customers table.', 'Xem toàn bộ bảng customers.'],
      sql: 'SELECT * FROM customers;',
      result: { columns: ['id', 'name', 'city'], rows: [[1, 'An', 'Hà Nội'], [2, 'Bình', 'Đà Nẵng'], [3, 'Chi', 'Hà Nội'], [4, 'Dũng', 'Huế']] },
    },
    mistakes: [['SQL keywords are not case-sensitive (select = SELECT), but text values are: \'paid\' ≠ \'Paid\'.', 'Từ khóa SQL không phân biệt hoa thường (select = SELECT), nhưng giá trị chữ thì có: \'paid\' khác \'Paid\'.'],
      ['End each statement with a semicolon ; when running several statements together.', 'Kết thúc mỗi câu lệnh bằng dấu chấm phẩy ; khi chạy nhiều câu cùng lúc.']],
  },
  {
    id: 'select', level: 'basic',
    title: ['SELECT: read data', 'SELECT: lấy dữ liệu ra'],
    tagline: ['Choose which columns you want to see.', 'Chọn những cột bạn muốn xem.'],
    what: ['SELECT is the statement for reading data. You tell the database: "give me these columns from this table". SELECT never changes data — it only reads and returns a result table.',
      'SELECT là câu lệnh đọc dữ liệu. Bạn nói với database: "lấy cho tôi những cột này, từ bảng này". SELECT không bao giờ thay đổi dữ liệu — nó chỉ đọc và trả về một bảng kết quả.'],
    when: [['List customers, products or orders.', 'Xem danh sách khách hàng, sản phẩm, đơn hàng.'], ['Fetch only the columns you need instead of the whole table.', 'Chỉ lấy vài cột cần thiết thay vì cả bảng.'], ['Rename a column in the result so it is easier to read.', 'Đổi tên cột trong kết quả cho dễ đọc.']],
    syntax: 'SELECT column_1, column_2\nFROM table_name;',
    parts: [
      { code: 'SELECT column_1, column_2', meaning: ['The columns to return, separated by commas. * means all columns.', 'Các cột muốn lấy, cách nhau bằng dấu phẩy. Dấu * nghĩa là tất cả cột.'] },
      { code: 'FROM table_name', meaning: ['The table to read from.', 'Bảng để đọc dữ liệu.'] },
      { code: 'AS new_name', meaning: ['Gives the column another name in the result only; the table is unchanged.', 'Đặt tên khác cho cột trong kết quả; bảng gốc không đổi.'] },
    ],
    example: {
      question: ['Get each customer\'s name and city, and call the city column "location".', 'Lấy tên và thành phố của khách, đặt tên cột thành phố là "location".'],
      sql: 'SELECT name, city AS location\nFROM customers;', uses: ['customers'],
      result: { columns: ['name', 'location'], rows: [['An', 'Hà Nội'], ['Bình', 'Đà Nẵng'], ['Chi', 'Hà Nội'], ['Dũng', 'Huế']] },
    },
    mistakes: [['Forgetting a comma: SELECT name city treats city as a new name for name.', 'Quên dấu phẩy: SELECT name city sẽ hiểu city là tên mới của cột name.'],
      ['Using SELECT * in applications: it fetches unneeded data and breaks when columns change.', 'Dùng SELECT * trong ứng dụng: lấy thừa dữ liệu và dễ lỗi khi bảng thêm/bớt cột.']],
  },
  {
    id: 'where', level: 'basic',
    title: ['WHERE: filter rows', 'WHERE: lọc dòng'],
    tagline: ['Keep only the rows that match a condition.', 'Chỉ giữ những dòng thỏa điều kiện.'],
    what: ['WHERE keeps rows whose condition is true and drops the rest. SELECT picks columns (vertical); WHERE picks rows (horizontal).',
      'WHERE giữ lại những dòng thỏa điều kiện và bỏ phần còn lại. SELECT chọn cột (theo chiều dọc), WHERE chọn dòng (theo chiều ngang).'],
    when: [['Find one customer\'s orders.', 'Tìm đơn của một khách hàng.'], ['Filter by status, price range or date range.', 'Lọc theo trạng thái, khoảng giá, khoảng ngày.'], ['Find rows with missing data (IS NULL).', 'Tìm dòng bị thiếu dữ liệu (IS NULL).']],
    syntax: 'SELECT columns\nFROM table_name\nWHERE condition;',
    parts: [
      { code: '=  <>  >  <  >=  <=', meaning: ['Compare values. <> means "not equal".', 'So sánh giá trị. <> nghĩa là "khác".'] },
      { code: 'AND / OR', meaning: ['AND: both must be true. OR: at least one. Use parentheses when mixing them.', 'AND: cả hai đều đúng. OR: ít nhất một đúng. Dùng ngoặc khi kết hợp cả hai.'] },
      { code: "IN ('a', 'b')", meaning: ['Value is one of a list.', 'Giá trị nằm trong danh sách.'] },
      { code: 'BETWEEN a AND b', meaning: ['Within a range, including both ends.', 'Nằm trong khoảng, gồm cả hai đầu.'] },
      { code: "LIKE 'A%'", meaning: ['Text pattern: % matches any characters.', 'Khớp mẫu chữ: % là chuỗi ký tự bất kỳ.'] },
      { code: 'IS NULL', meaning: ['Value is missing. Never write = NULL.', 'Giá trị bị trống. Không viết = NULL.'] },
    ],
    example: {
      question: ['Paid orders worth 100 or more.', 'Các đơn đã thanh toán (paid) có giá trị từ 100 trở lên.'],
      sql: "SELECT id, customer_id, total\nFROM orders\nWHERE status = 'paid' AND total >= 100;", uses: ['orders'],
      result: { columns: ['id', 'customer_id', 'total'], rows: [[101, 1, 120], [103, 1, 200]] },
    },
    mistakes: [["Text without single quotes: status = paid fails. Text uses 'single quotes'; \"double quotes\" are for column names.", "Quên nháy đơn: status = paid sẽ lỗi. Chuỗi dùng 'nháy đơn'; \"nháy kép\" dành cho tên cột."],
      ['column = NULL never matches anything. Use IS NULL / IS NOT NULL.', 'cột = NULL không bao giờ khớp. Dùng IS NULL / IS NOT NULL.']],
  },
  {
    id: 'order', level: 'basic',
    title: ['ORDER BY and LIMIT: sort and take the top', 'ORDER BY và LIMIT: sắp xếp, lấy top'],
    tagline: ['Control the order of results and how many you get.', 'Quyết định thứ tự kết quả và lấy bao nhiêu dòng.'],
    what: ['Without ORDER BY, the database promises no particular row order. ORDER BY sorts the result; LIMIT keeps only the first N rows.',
      'Nếu không có ORDER BY, database không hứa trả dòng theo thứ tự nào. ORDER BY sắp xếp kết quả; LIMIT chỉ lấy N dòng đầu tiên.'],
    when: [['Newest orders first.', 'Đơn mới nhất lên đầu.'], ['Top 3 biggest orders.', 'Top 3 đơn giá trị lớn nhất.'], ['Pagination.', 'Phân trang.']],
    syntax: 'SELECT columns\nFROM table_name\nORDER BY column DESC\nLIMIT n;',
    parts: [
      { code: 'ORDER BY column', meaning: ['Sort by this column.', 'Sắp xếp theo cột này.'] },
      { code: 'ASC / DESC', meaning: ['Ascending (default) or descending.', 'Tăng dần (mặc định) hoặc giảm dần.'] },
      { code: 'ORDER BY a, b', meaning: ['When a ties, sort by b.', 'Khi cột a bằng nhau thì xét tiếp cột b.'] },
      { code: 'LIMIT n OFFSET m', meaning: ['Return n rows after skipping m rows.', 'Lấy n dòng sau khi bỏ qua m dòng đầu.'] },
    ],
    example: {
      question: ['The 3 largest orders.', '3 đơn hàng có giá trị lớn nhất.'],
      sql: 'SELECT id, total\nFROM orders\nORDER BY total DESC\nLIMIT 3;', uses: ['orders'],
      result: { columns: ['id', 'total'], rows: [[103, 200], [101, 120], [105, 90]] },
    },
    mistakes: [['LIMIT without ORDER BY can return different rows each time.', 'Dùng LIMIT mà không ORDER BY: mỗi lần chạy có thể ra dòng khác nhau.'],
      ['Sorting by a column with duplicates and no tie-breaker (like id) makes pages skip or repeat rows.', 'Sắp theo cột có giá trị trùng mà không thêm cột phân xử (như id): phân trang bị lặp hoặc mất dòng.']],
  },
  {
    id: 'aggregate', level: 'basic',
    title: ['COUNT, SUM, AVG: summarize', 'COUNT, SUM, AVG: tính tổng hợp'],
    tagline: ['Turn many rows into one number.', 'Gộp nhiều dòng thành một con số.'],
    what: ['Aggregate functions combine many rows into a single value: how many rows, the total, the average, the smallest or largest.',
      'Hàm tổng hợp gộp nhiều dòng thành một giá trị: có bao nhiêu dòng, tổng, trung bình, nhỏ nhất, lớn nhất.'],
    when: [['How many orders are there?', 'Có bao nhiêu đơn hàng?'], ['Total revenue.', 'Tổng doanh thu.'], ['Average order value.', 'Giá trị đơn trung bình.']],
    syntax: 'SELECT COUNT(*), SUM(column), AVG(column),\n       MIN(column), MAX(column)\nFROM table_name;',
    parts: [
      { code: 'COUNT(*)', meaning: ['Number of rows.', 'Đếm số dòng.'] },
      { code: 'COUNT(column)', meaning: ['Number of rows where the column is not NULL.', 'Đếm số dòng mà cột đó không NULL.'] },
      { code: 'SUM / AVG', meaning: ['Total / average (NULLs are ignored).', 'Tổng / trung bình (bỏ qua NULL).'] },
      { code: 'MIN / MAX', meaning: ['Smallest / largest value.', 'Giá trị nhỏ nhất / lớn nhất.'] },
    ],
    example: {
      question: ['Summarize paid orders.', 'Thống kê các đơn đã thanh toán.'],
      sql: "SELECT COUNT(*) AS order_count,\n       SUM(total) AS revenue,\n       MAX(total) AS largest\nFROM orders\nWHERE status = 'paid';", uses: ['orders'],
      result: { columns: ['order_count', 'revenue', 'largest'], rows: [[3, 410, 200]] },
    },
    mistakes: [['Mixing a plain column with an aggregate without GROUP BY: SELECT customer_id, COUNT(*) FROM orders → error.', 'Trộn cột thường với hàm tổng hợp mà thiếu GROUP BY: SELECT customer_id, COUNT(*) FROM orders → lỗi.'],
      ['Expecting COUNT(column) to equal COUNT(*): it skips NULLs.', 'Nghĩ COUNT(cột) bằng COUNT(*): COUNT(cột) bỏ qua NULL.']],
  },
  {
    id: 'group-by', level: 'basic',
    title: ['GROUP BY and HAVING: summarize per group', 'GROUP BY và HAVING: tổng hợp theo nhóm'],
    tagline: ['One result row per group.', 'Mỗi nhóm cho ra một dòng kết quả.'],
    what: ['GROUP BY splits rows into groups by a column\'s value, then computes aggregates for each group. HAVING filters groups after they are computed.',
      'GROUP BY chia các dòng thành nhóm theo giá trị một cột, rồi tính hàm tổng hợp cho từng nhóm. HAVING lọc các nhóm sau khi đã tính xong.'],
    when: [['Revenue per customer.', 'Doanh thu theo từng khách.'], ['Orders per status.', 'Số đơn theo trạng thái.'], ['Customers with at least 2 orders.', 'Khách có từ 2 đơn trở lên.']],
    syntax: 'SELECT group_column, COUNT(*)\nFROM table_name\nWHERE row_condition\nGROUP BY group_column\nHAVING group_condition;',
    parts: [
      { code: 'GROUP BY column', meaning: ['Each distinct value becomes one group and one result row.', 'Mỗi giá trị khác nhau thành một nhóm, một dòng kết quả.'] },
      { code: 'WHERE', meaning: ['Filters rows BEFORE grouping.', 'Lọc dòng TRƯỚC khi gom nhóm.'] },
      { code: 'HAVING', meaning: ['Filters groups AFTER aggregation; can use COUNT, SUM…', 'Lọc nhóm SAU khi tính; dùng được COUNT, SUM…'] },
      { code: 'SELECT …', meaning: ['Every selected column must be in GROUP BY or inside an aggregate.', 'Mỗi cột trong SELECT phải có trong GROUP BY hoặc nằm trong hàm tổng hợp.'] },
    ],
    example: {
      question: ['Which customers have 2 or more orders, and how much did they spend?', 'Khách nào có từ 2 đơn trở lên, và tổng tiền là bao nhiêu?'],
      sql: 'SELECT customer_id,\n       COUNT(*) AS order_count,\n       SUM(total) AS spent\nFROM orders\nGROUP BY customer_id\nHAVING COUNT(*) >= 2\nORDER BY customer_id;', uses: ['orders'],
      result: { columns: ['customer_id', 'order_count', 'spent'], rows: [[1, 3, 380], [3, 2, 140]] },
    },
    mistakes: [['WHERE COUNT(*) >= 2 is an error; conditions on groups belong in HAVING.', 'WHERE COUNT(*) >= 2 sẽ lỗi; điều kiện trên nhóm phải dùng HAVING.'],
      ['Selecting a column that is neither grouped nor aggregated.', 'Chọn cột không nằm trong GROUP BY và cũng không trong hàm tổng hợp.']],
  },
  {
    id: 'join', level: 'basic',
    title: ['JOIN: combine two tables', 'JOIN: ghép hai bảng'],
    tagline: ['See related data from several tables in one result.', 'Xem dữ liệu liên quan từ nhiều bảng trong một kết quả.'],
    what: ['Data is usually split across tables: orders stores only customer_id; the name lives in customers. JOIN pairs rows from two tables when the ON condition is true, so you can see columns from both.',
      'Dữ liệu thường được tách ra nhiều bảng: orders chỉ lưu customer_id, còn tên khách nằm ở customers. JOIN ghép dòng của hai bảng khi điều kiện ON đúng, để bạn thấy cột của cả hai.'],
    when: [['Show orders with customer names.', 'Hiển thị đơn hàng kèm tên khách.'], ['Combine facts with descriptive data.', 'Ghép dữ liệu giao dịch với dữ liệu mô tả.']],
    syntax: 'SELECT a.column, b.column\nFROM table_a a\nJOIN table_b b ON b.key = a.key;',
    parts: [
      { code: 'FROM orders o', meaning: ['o is a short name (alias) for the table.', 'o là tên ngắn (alias) của bảng orders.'] },
      { code: 'JOIN customers c', meaning: ['The second table to combine.', 'Bảng thứ hai cần ghép.'] },
      { code: 'ON c.id = o.customer_id', meaning: ['Matching rule: pair rows where this is true.', 'Điều kiện ghép: dòng nào khớp thì ghép lại.'] },
      { code: 'JOIN = INNER JOIN', meaning: ['Keeps only matched pairs; unmatched rows disappear.', 'Chỉ giữ cặp khớp; dòng không có cặp bị bỏ.'] },
    ],
    example: {
      question: ['Paid orders with the customer\'s name.', 'Danh sách đơn đã thanh toán kèm tên khách.'],
      sql: "SELECT o.id, c.name, o.total\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nWHERE o.status = 'paid'\nORDER BY o.id;", uses: ['orders', 'customers'],
      result: { columns: ['id', 'name', 'total'], rows: [[101, 'An', 120], [103, 'An', 200], [105, 'Chi', 90]] },
    },
    mistakes: [['A missing or wrong ON multiplies rows (every order paired with every customer).', 'Thiếu hoặc sai ON: số dòng bị nhân lên (mỗi đơn ghép với mọi khách).'],
      ['Writing id when both tables have id → "ambiguous column" error. Write o.id or c.id.', 'Viết id khi cả hai bảng đều có cột id → lỗi "ambiguous". Ghi rõ o.id hoặc c.id.']],
  },
  {
    id: 'left-join', level: 'basic',
    title: ['LEFT JOIN: keep unmatched rows', 'LEFT JOIN: giữ cả dòng không khớp'],
    tagline: ['Every row from the left table stays.', 'Mọi dòng của bảng bên trái đều được giữ.'],
    what: ['LEFT JOIN keeps ALL rows from the left table, even those with no match on the right. Where nothing matches, the right-side columns are NULL.',
      'LEFT JOIN giữ TẤT CẢ dòng của bảng bên trái, kể cả khi không tìm thấy dòng khớp bên phải. Chỗ không khớp, các cột bên phải sẽ là NULL.'],
    when: [['Find customers who never ordered.', 'Tìm khách chưa từng mua hàng.'], ['Count orders for every customer, including zero.', 'Đếm đơn của mọi khách, kể cả khách có 0 đơn.']],
    syntax: 'SELECT …\nFROM left_table\nLEFT JOIN right_table ON condition;',
    parts: [
      { code: 'left_table', meaning: ['All of its rows are kept.', 'Bảng được giữ đủ mọi dòng.'] },
      { code: 'LEFT JOIN right_table', meaning: ['Matched when possible; otherwise filled with NULL.', 'Ghép nếu khớp; không khớp thì điền NULL.'] },
      { code: 'COUNT(o.id)', meaning: ['Counts real orders only, so a customer with none gets 0.', 'Chỉ đếm đơn thật, nên khách không có đơn được 0.'] },
    ],
    example: {
      question: ['How many orders does each customer have (including none)?', 'Mỗi khách có bao nhiêu đơn (kể cả khách chưa mua)?'],
      sql: 'SELECT c.name, COUNT(o.id) AS order_count\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id, c.name\nORDER BY c.id;', uses: ['customers', 'orders'],
      result: { columns: ['name', 'order_count'], rows: [['An', 3], ['Bình', 1], ['Chi', 2], ['Dũng', 0]] },
    },
    mistakes: [["Filtering the right table in WHERE (WHERE o.status = 'paid') removes the NULL rows and turns it back into an INNER JOIN. Put that condition in ON.", "Lọc bảng bên phải trong WHERE (WHERE o.status = 'paid') làm mất dòng NULL, biến thành INNER JOIN. Hãy đưa điều kiện vào ON."],
      ['COUNT(*) instead of COUNT(o.id) counts a customer with no orders as 1.', 'Dùng COUNT(*) thay vì COUNT(o.id): khách không có đơn bị đếm là 1.']],
  },
  {
    id: 'case', level: 'intermediate',
    title: ['CASE WHEN: if/else in a query', 'CASE WHEN: điều kiện trong câu truy vấn'],
    tagline: ['Compute a value that depends on each row.', 'Tạo giá trị tùy theo từng dòng.'],
    what: ['CASE works like if/else: it produces a value for each row depending on conditions, checked from top to bottom.',
      'CASE hoạt động như if/else: tạo ra giá trị cho từng dòng tùy điều kiện, kiểm tra lần lượt từ trên xuống.'],
    when: [['Classify orders as large/medium/small.', 'Phân loại đơn lớn/vừa/nhỏ.'], ['Turn codes into readable labels.', 'Đổi mã thành nhãn dễ đọc.'], ['Conditional counting: SUM(CASE WHEN … THEN 1 ELSE 0 END).', 'Đếm có điều kiện: SUM(CASE WHEN … THEN 1 ELSE 0 END).']],
    syntax: 'CASE\n  WHEN condition_1 THEN value_1\n  WHEN condition_2 THEN value_2\n  ELSE other_value\nEND',
    parts: [
      { code: 'WHEN … THEN …', meaning: ['The first true condition wins; the rest are skipped.', 'Điều kiện đúng đầu tiên được chọn, bỏ qua phần còn lại.'] },
      { code: 'ELSE', meaning: ['Used when no condition is true. Without ELSE you get NULL.', 'Dùng khi không điều kiện nào đúng. Thiếu ELSE sẽ ra NULL.'] },
      { code: 'END AS name', meaning: ['Ends the expression; give the column a name.', 'Kết thúc biểu thức; đặt tên cho cột.'] },
    ],
    example: {
      question: ['Label each order by size.', 'Gắn nhãn kích cỡ cho từng đơn.'],
      sql: "SELECT id, total,\n  CASE\n    WHEN total >= 100 THEN 'large'\n    WHEN total >= 70 THEN 'medium'\n    ELSE 'small'\n  END AS size\nFROM orders\nORDER BY id;", uses: ['orders'],
      result: { columns: ['id', 'total', 'size'], rows: [[101, 120, 'large'], [102, 80, 'medium'], [103, 200, 'large'], [104, 50, 'small'], [105, 90, 'medium'], [106, 60, 'small']] },
    },
    mistakes: [['Putting a broad condition first: WHEN total >= 70 before WHEN total >= 100 means "large" never appears.', 'Đặt điều kiện rộng lên trước: WHEN total >= 70 trước WHEN total >= 100 thì nhãn "large" không bao giờ xuất hiện.'],
      ['Forgetting END.', 'Quên END.']],
  },
  {
    id: 'subquery', level: 'intermediate',
    title: ['Subqueries, IN and EXISTS', 'Truy vấn con, IN và EXISTS'],
    tagline: ['Use the result of one query inside another.', 'Dùng kết quả của câu này bên trong câu khác.'],
    what: ['A subquery is a SELECT inside another SELECT. The inner result becomes a value, a list or a yes/no check for the outer query.',
      'Truy vấn con là một câu SELECT nằm trong câu SELECT khác. Kết quả bên trong trở thành một giá trị, một danh sách, hoặc câu trả lời có/không cho câu bên ngoài.'],
    when: [['Compare with an average.', 'So sánh với giá trị trung bình.'], ['Filter using a list from another table.', 'Lọc theo danh sách lấy từ bảng khác.'], ['Check whether related rows exist.', 'Kiểm tra có dòng liên quan hay không.']],
    syntax: 'SELECT …\nFROM table_a\nWHERE EXISTS (\n  SELECT 1 FROM table_b WHERE …\n);',
    parts: [
      { code: '( SELECT … )', meaning: ['The inner query, run to produce a value or list.', 'Câu bên trong, chạy để tạo giá trị hoặc danh sách.'] },
      { code: 'IN ( … )', meaning: ['The value is in the list returned.', 'Giá trị nằm trong danh sách trả về.'] },
      { code: 'EXISTS ( … )', meaning: ['True if the inner query returns at least one row.', 'Đúng nếu câu bên trong trả về ít nhất một dòng.'] },
      { code: 'NOT EXISTS', meaning: ['True if it returns no rows.', 'Đúng nếu không có dòng nào.'] },
    ],
    example: {
      question: ['Customers who have never ordered.', 'Khách hàng chưa từng có đơn.'],
      sql: 'SELECT name\nFROM customers c\nWHERE NOT EXISTS (\n  SELECT 1 FROM orders o\n  WHERE o.customer_id = c.id\n);', uses: ['customers', 'orders'],
      result: { columns: ['name'], rows: [['Dũng']] },
    },
    mistakes: [['NOT IN with a list containing NULL returns no rows at all. NOT EXISTS is safer.', 'NOT IN với danh sách có NULL sẽ không trả về dòng nào. NOT EXISTS an toàn hơn.'],
      ['Using = with a subquery that returns several rows → error.', 'Dùng = với truy vấn con trả về nhiều dòng → lỗi.']],
  },
  {
    id: 'cte', level: 'intermediate',
    title: ['WITH (CTE): write queries in steps', 'WITH (CTE): viết truy vấn theo từng bước'],
    tagline: ['Name an intermediate result and reuse it.', 'Đặt tên cho kết quả trung gian rồi dùng lại.'],
    what: ['WITH gives a name to an intermediate result, then the main query uses it like a table. Long queries become readable step by step.',
      'WITH đặt tên cho một kết quả trung gian, rồi câu chính dùng nó như một bảng. Câu truy vấn dài trở nên dễ đọc theo từng bước.'],
    when: [['A query that needs several steps.', 'Truy vấn cần nhiều bước xử lý.'], ['Reuse the same intermediate result.', 'Dùng lại cùng một kết quả trung gian.']],
    syntax: 'WITH step_name AS (\n  SELECT …\n)\nSELECT …\nFROM step_name;',
    parts: [
      { code: 'WITH name AS ( … )', meaning: ['Step 1: compute and name a result.', 'Bước 1: tính và đặt tên cho một kết quả.'] },
      { code: ', name_2 AS ( … )', meaning: ['More steps, separated by commas.', 'Thêm bước, cách nhau bằng dấu phẩy.'] },
      { code: 'SELECT … FROM name', meaning: ['The final query uses the name like a table.', 'Câu cuối dùng tên đó như một bảng.'] },
    ],
    example: {
      question: ['Paid revenue per customer, with names.', 'Doanh thu đã thanh toán theo khách, kèm tên.'],
      sql: "WITH paid AS (\n  SELECT customer_id, SUM(total) AS revenue\n  FROM orders\n  WHERE status = 'paid'\n  GROUP BY customer_id\n)\nSELECT c.name, p.revenue\nFROM paid p\nJOIN customers c ON c.id = p.customer_id\nORDER BY p.revenue DESC;", uses: ['orders', 'customers'],
      result: { columns: ['name', 'revenue'], rows: [['An', 320], ['Chi', 90]] },
    },
    mistakes: [['Assuming a CTE is faster. It mainly improves readability — measure the plan.', 'Nghĩ CTE luôn nhanh hơn. Nó chủ yếu giúp dễ đọc — hãy đo plan.'], ['Missing the comma between CTEs.', 'Thiếu dấu phẩy giữa các CTE.']],
  },
  {
    id: 'union', level: 'intermediate',
    title: ['UNION: stack results', 'UNION: nối kết quả theo chiều dọc'],
    tagline: ['JOIN adds columns; UNION adds rows.', 'JOIN thêm cột; UNION thêm dòng.'],
    what: ['UNION stacks the results of two SELECT statements on top of each other. UNION removes duplicate rows; UNION ALL keeps them.',
      'UNION xếp kết quả của hai câu SELECT chồng lên nhau. UNION loại dòng trùng; UNION ALL giữ nguyên dòng trùng.'],
    when: [['Combine similar data from two sources.', 'Gộp dữ liệu giống nhau từ hai nguồn.'], ['Merge results of different conditions.', 'Gộp kết quả của các điều kiện khác nhau.']],
    syntax: 'SELECT column FROM table_a\nUNION\nSELECT column FROM table_b;',
    parts: [
      { code: 'UNION', meaning: ['Combine and remove duplicates.', 'Gộp và bỏ dòng trùng.'] },
      { code: 'UNION ALL', meaning: ['Combine and keep duplicates (faster).', 'Gộp và giữ dòng trùng (nhanh hơn).'] },
      { code: 'same columns', meaning: ['Both sides need the same number of columns with compatible types.', 'Hai bên phải cùng số cột, kiểu dữ liệu tương thích.'] },
      { code: 'ORDER BY at the end', meaning: ['Sorts the combined result.', 'Sắp xếp toàn bộ kết quả đã gộp.'] },
    ],
    example: {
      question: ['Customers with a pending or a cancelled order.', 'Những khách có đơn đang chờ hoặc đơn bị hủy.'],
      sql: "SELECT customer_id FROM orders WHERE status = 'pending'\nUNION\nSELECT customer_id FROM orders WHERE status = 'cancelled'\nORDER BY customer_id;", uses: ['orders'],
      result: { columns: ['customer_id'], rows: [[1], [2], [3]] },
    },
    mistakes: [['Different numbers of columns on each side → error.', 'Số cột hai bên khác nhau → lỗi.'], ['Using UNION when duplicates matter: they silently disappear.', 'Dùng UNION khi cần giữ dòng trùng: dữ liệu bị mất mà không báo.']],
  },
  {
    id: 'writes', level: 'intermediate',
    title: ['INSERT, UPDATE, DELETE: change data', 'INSERT, UPDATE, DELETE: thay đổi dữ liệu'],
    tagline: ['Add, modify and remove rows.', 'Thêm, sửa và xóa dòng.'],
    what: ['Three statements change data: INSERT adds rows, UPDATE modifies rows, DELETE removes rows. Unlike SELECT, they change real data.',
      'Ba câu lệnh thay đổi dữ liệu: INSERT thêm dòng, UPDATE sửa dòng, DELETE xóa dòng. Khác với SELECT, chúng làm thay đổi dữ liệu thật.'],
    when: [['Create a new order.', 'Tạo đơn hàng mới.'], ['Update a status.', 'Cập nhật trạng thái.'], ['Remove wrong data.', 'Xóa dữ liệu sai.']],
    syntax: 'INSERT INTO table (col_1, col_2) VALUES (v1, v2);\nUPDATE table SET column = value WHERE condition;\nDELETE FROM table WHERE condition;',
    parts: [
      { code: 'INSERT INTO … VALUES', meaning: ['Adds new rows.', 'Thêm dòng mới.'] },
      { code: 'UPDATE … SET', meaning: ['Changes column values.', 'Đổi giá trị cột.'] },
      { code: 'DELETE FROM', meaning: ['Removes rows.', 'Xóa dòng.'] },
      { code: 'WHERE', meaning: ['Limits which rows are affected. Without it, EVERY row is changed.', 'Giới hạn dòng bị ảnh hưởng. Thiếu WHERE thì MỌI dòng đều bị đổi.'] },
    ],
    example: {
      question: ['Order 102 has been paid: update its status.', 'Đơn 102 đã thanh toán: cập nhật trạng thái.'],
      sql: "UPDATE orders\nSET status = 'paid'\nWHERE id = 102;", uses: ['orders'],
      check: 'SELECT id, status FROM orders WHERE id = 102;',
      result: { columns: ['id', 'status'], rows: [[102, 'paid']] },
      note: ['The QueryLab workspace never runs write statements. Practise them on a development database.', 'Workspace QueryLab không chạy lệnh ghi. Hãy thực hành trên DB phát triển.'],
    },
    mistakes: [['UPDATE/DELETE without WHERE changes the whole table. Run a SELECT with the same WHERE first.', 'UPDATE/DELETE thiếu WHERE sẽ đổi cả bảng. Hãy chạy SELECT với cùng WHERE trước để xem dòng nào bị ảnh hưởng.'],
      ['Running multi-step changes without a transaction.', 'Thay đổi nhiều bước mà không dùng transaction.']],
  },
  {
    id: 'transactions', level: 'intermediate',
    title: ['Transactions: all or nothing', 'Transaction: tất cả hoặc không gì cả'],
    tagline: ['Group several changes so they succeed or fail together.', 'Gom nhiều thay đổi để cùng thành công hoặc cùng hủy.'],
    what: ['A transaction groups statements into one unit: either all of them are saved (COMMIT) or all are undone (ROLLBACK). It prevents half-finished states, like taking money from account A without adding it to B.',
      'Transaction gom nhiều câu lệnh thành một khối: hoặc lưu tất cả (COMMIT), hoặc hủy tất cả (ROLLBACK). Tránh trạng thái nửa vời, ví dụ đã trừ tiền tài khoản A nhưng chưa cộng vào B.'],
    when: [['Changes that must happen together.', 'Các thay đổi phải xảy ra cùng nhau.'], ['Trying a change and undoing it.', 'Thử một thay đổi rồi hoàn tác.']],
    syntax: 'BEGIN;\n  -- statements\nCOMMIT;   -- or ROLLBACK;',
    parts: [
      { code: 'BEGIN', meaning: ['Starts the transaction.', 'Bắt đầu transaction.'] },
      { code: 'COMMIT', meaning: ['Saves everything permanently.', 'Lưu vĩnh viễn mọi thay đổi.'] },
      { code: 'ROLLBACK', meaning: ['Undoes everything since BEGIN.', 'Hủy mọi thay đổi kể từ BEGIN.'] },
    ],
    example: {
      question: ['Change an order, then undo it.', 'Sửa một đơn rồi hoàn tác.'],
      sql: 'BEGIN;\nUPDATE orders SET total = 0 WHERE id = 101;\nROLLBACK;', uses: ['orders'],
      check: 'SELECT id, total FROM orders WHERE id = 101;',
      result: { columns: ['id', 'total'], rows: [[101, 120]] },
    },
    mistakes: [['Forgetting COMMIT: changes are not saved and locks are held.', 'Quên COMMIT: thay đổi chưa được lưu và khóa vẫn bị giữ.'], ['Very long transactions block other users.', 'Transaction kéo dài quá lâu làm người khác phải chờ.']],
  },
  {
    id: 'constraints', level: 'intermediate',
    title: ['Keys and constraints', 'Khóa và ràng buộc'],
    tagline: ['Rules the database enforces to keep data correct.', 'Luật database tự kiểm tra để dữ liệu luôn đúng.'],
    what: ['Constraints are rules checked on every change: ids are unique, an order must belong to an existing customer, a total cannot be negative. Bad data is rejected before it is saved.',
      'Ràng buộc là luật được kiểm tra mỗi khi dữ liệu thay đổi: id không trùng, đơn phải thuộc một khách có thật, tổng tiền không âm. Dữ liệu sai bị từ chối trước khi được lưu.'],
    when: [['Designing a new table.', 'Thiết kế bảng mới.'], ['Preventing bugs from writing invalid data.', 'Ngăn lỗi ứng dụng ghi dữ liệu sai.']],
    syntax: 'CREATE TABLE orders (\n  id integer PRIMARY KEY,\n  customer_id integer NOT NULL REFERENCES customers(id),\n  total integer NOT NULL CHECK (total >= 0)\n);',
    parts: [
      { code: 'PRIMARY KEY', meaning: ['Unique and never NULL.', 'Duy nhất và không bao giờ NULL.'] },
      { code: 'REFERENCES table(col)', meaning: ['Foreign key: the value must exist in the other table.', 'Khóa ngoại: giá trị phải tồn tại ở bảng kia.'] },
      { code: 'NOT NULL', meaning: ['A value is required.', 'Bắt buộc có giá trị.'] },
      { code: 'CHECK (…)', meaning: ['A custom rule.', 'Luật tùy chỉnh.'] },
      { code: 'UNIQUE', meaning: ['No duplicates (NULL allowed).', 'Không trùng (cho phép NULL).'] },
    ],
    example: {
      question: ['Try to add an order for customer 99, who does not exist.', 'Thử thêm đơn cho khách 99 — khách này không tồn tại.'],
      sql: "INSERT INTO orders\nVALUES (107, 99, '2024-04-01', 'paid', 10);", uses: ['customers'],
      error: ['ERROR: insert or update on table "orders" violates foreign key constraint', 'LỖI: vi phạm khóa ngoại — không có customers.id = 99, đơn không được lưu.'],
    },
    mistakes: [['Relying only on application code for rules the database could enforce.', 'Chỉ kiểm tra trong code ứng dụng mà không dùng ràng buộc của database.'],
      ['PostgreSQL does not index foreign key columns automatically; add an index if you join or filter on them.', 'PostgreSQL không tự tạo index cho cột khóa ngoại; hãy thêm nếu hay JOIN hoặc lọc theo cột đó.']],
  },
  {
    id: 'window', level: 'advanced',
    title: ['Window functions', 'Window function (hàm cửa sổ)'],
    tagline: ['Calculate across related rows while keeping every row.', 'Tính toán trên nhóm dòng liên quan mà vẫn giữ từng dòng.'],
    what: ['GROUP BY collapses rows into one per group. A window function calculates over a "window" of related rows but keeps every row — for example numbering each customer\'s orders, or a running total.',
      'GROUP BY gộp mỗi nhóm thành một dòng. Window function tính toán trên một "cửa sổ" các dòng liên quan nhưng vẫn giữ nguyên từng dòng — ví dụ đánh số thứ tự đơn của mỗi khách, hay tính tổng lũy kế.'],
    when: [['Number or rank rows within a group.', 'Đánh số hoặc xếp hạng trong từng nhóm.'], ['Running totals, previous/next value (LAG/LEAD).', 'Tổng lũy kế, giá trị dòng trước/sau (LAG/LEAD).'], ['Latest order per customer.', 'Đơn gần nhất của mỗi khách.']],
    syntax: 'FUNCTION() OVER (\n  PARTITION BY group_column\n  ORDER BY sort_column\n)',
    parts: [
      { code: 'OVER ( … )', meaning: ['Makes the function a window function.', 'Biến hàm thành window function.'] },
      { code: 'PARTITION BY', meaning: ['Splits rows into groups without collapsing them.', 'Chia nhóm mà không gộp dòng.'] },
      { code: 'ORDER BY', meaning: ['Order inside each group.', 'Thứ tự bên trong mỗi nhóm.'] },
      { code: 'ROW_NUMBER, RANK, SUM, LAG', meaning: ['Common window functions.', 'Các hàm cửa sổ thường dùng.'] },
    ],
    example: {
      question: ['Which number order is this for each customer?', 'Đây là đơn thứ mấy của mỗi khách?'],
      sql: 'SELECT customer_id, id, order_date,\n  ROW_NUMBER() OVER (\n    PARTITION BY customer_id\n    ORDER BY order_date\n  ) AS nth\nFROM orders\nORDER BY customer_id, nth;', uses: ['orders'],
      result: { columns: ['customer_id', 'id', 'order_date', 'nth'], rows: [[1, 101, '2024-01-05', 1], [1, 103, '2024-02-11', 2], [1, 106, '2024-03-15', 3], [2, 102, '2024-01-09', 1], [3, 104, '2024-02-20', 1], [3, 105, '2024-03-02', 2]] },
    },
    mistakes: [['Filtering on a window function in WHERE → error. Wrap it in a CTE or subquery, then filter.', 'Lọc theo window function trong WHERE → lỗi. Bọc trong CTE/truy vấn con rồi mới lọc.'],
      ['Confusing PARTITION BY here with table partitioning — they are unrelated.', 'Nhầm PARTITION BY ở đây với partition bảng — hai thứ không liên quan.']],
  },
  {
    id: 'index', level: 'advanced',
    title: ['Indexes: find rows without reading everything', 'Index: tìm nhanh mà không đọc cả bảng'],
    tagline: ['Like the index at the back of a book.', 'Giống mục lục ở cuối sách.'],
    what: ['Without an index, PostgreSQL must read every row to find matches (Seq Scan) — like finding a word by turning every page. An index keeps values sorted with pointers to their rows, so the database jumps straight to the matches (Index Scan). The cost: extra disk space and slower writes, because the index must be updated too.',
      'Không có index, PostgreSQL phải đọc từng dòng để tìm (Seq Scan) — như tìm một từ bằng cách lật từng trang sách. Index lưu các giá trị đã sắp xếp kèm vị trí dòng, nên database nhảy thẳng tới chỗ cần (Index Scan). Cái giá: tốn thêm dung lượng và ghi dữ liệu chậm hơn, vì index cũng phải cập nhật.'],
    when: [['Columns often used in WHERE or JOIN that match few rows.', 'Cột hay dùng trong WHERE hoặc JOIN và chỉ lọc ra ít dòng.'], ['ORDER BY … LIMIT on large tables.', 'ORDER BY … LIMIT trên bảng lớn.']],
    syntax: 'CREATE INDEX index_name\nON table_name (column_1, column_2);',
    parts: [
      { code: 'CREATE INDEX name', meaning: ['Creates the index.', 'Tạo index.'] },
      { code: 'ON table (column)', meaning: ['The column whose values are sorted in the index.', 'Cột được sắp xếp trong index.'] },
      { code: '(col_1, col_2)', meaning: ['Multi-column: order matters. (customer_id, order_date) helps filter by customer, then by date.', 'Nhiều cột: thứ tự quan trọng. (customer_id, order_date) giúp lọc theo khách trước, rồi theo ngày.'] },
      { code: 'DROP INDEX name', meaning: ['Removes it.', 'Xóa index.'] },
    ],
    example: {
      question: ['Find one customer\'s orders in a table with 1 million rows.', 'Tìm đơn của một khách trong bảng 1 triệu dòng.'],
      sql: 'CREATE INDEX idx_orders_customer\nON orders (customer_id);', uses: ['orders'],
      illustration: { columns: [['Access', 'Cách đọc'], ['Rows read', 'Số dòng phải đọc']], rows: [[['Before: Seq Scan', 'Trước: Seq Scan'], '~1 000 000'], [['After: Index Scan', 'Sau: Index Scan'], ['~matching rows only', '~chỉ các dòng khớp']]] },
      note: ['Illustration. Measure it on your own data in the Workspace.', 'Minh họa. Hãy đo trên dữ liệu thật của bạn trong Workspace.'],
    },
    mistakes: [['Indexing every column: slower writes and wasted space.', 'Đánh index mọi cột: ghi chậm và tốn dung lượng.'],
      ['Expecting an index to help when the filter matches most of the table, or when the column is wrapped in a function (WHERE lower(email) = …).', 'Mong index giúp khi điều kiện khớp phần lớn bảng, hoặc khi cột bị bọc trong hàm (WHERE lower(email) = …).']],
  },
  {
    id: 'explain', level: 'advanced',
    title: ['EXPLAIN ANALYZE: see what the database did', 'EXPLAIN ANALYZE: xem database đã làm gì'],
    tagline: ['The tool for understanding why a query is slow.', 'Công cụ để hiểu vì sao query chậm.'],
    what: ['EXPLAIN shows the execution plan: how the database intends to read tables and in what order. Adding ANALYZE actually runs the query and reports real time and row counts.',
      'EXPLAIN cho xem kế hoạch thực thi (plan): database định đọc bảng bằng cách nào, theo thứ tự nào. Thêm ANALYZE thì query được chạy thật và báo thời gian, số dòng thực tế.'],
    when: [['A query is slow and you want to know why.', 'Query chậm và bạn muốn biết vì sao.'], ['Check whether an index is actually used.', 'Kiểm tra index có thực sự được dùng không.']],
    syntax: 'EXPLAIN (ANALYZE, BUFFERS)\nSELECT …;',
    parts: [
      { code: 'Seq Scan', meaning: ['Reads the whole table.', 'Đọc toàn bộ bảng.'] },
      { code: 'Index Scan / Bitmap Index Scan', meaning: ['Uses an index.', 'Dùng index.'] },
      { code: 'Rows Removed by Filter', meaning: ['Rows read and then thrown away — wasted work.', 'Số dòng đọc rồi bỏ — công sức thừa.'] },
      { code: 'rows=… vs actual rows=…', meaning: ['Estimate vs reality. A big gap means the planner guessed wrong.', 'Ước tính so với thực tế. Lệch nhiều nghĩa là planner đoán sai.'] },
      { code: 'Execution Time', meaning: ['How long it really took.', 'Thời gian chạy thực tế.'] },
    ],
    example: {
      question: ['How does PostgreSQL find customer 1\'s orders in the sample table?', 'PostgreSQL tìm đơn của khách 1 trong bảng mẫu thế nào?'],
      sql: 'EXPLAIN ANALYZE\nSELECT * FROM orders WHERE customer_id = 1;', uses: ['orders'],
      illustration: { columns: [['Plan line', 'Dòng trong plan'], ['Meaning', 'Ý nghĩa']], rows: [
        ['Seq Scan on orders', ['Reads the whole table', 'Đọc cả bảng']],
        ['Filter: (customer_id = 1)', ['The condition checked on each row', 'Điều kiện kiểm tra trên từng dòng']],
        ['Rows Removed by Filter: 3', ['3 rows read and discarded', 'Đọc rồi bỏ 3 dòng']],
        ['actual rows=3', ['3 rows returned', 'Trả về 3 dòng']],
      ] },
    },
    mistakes: [['EXPLAIN ANALYZE really runs the statement — on UPDATE/DELETE it changes data.', 'EXPLAIN ANALYZE chạy thật — với UPDATE/DELETE sẽ thay đổi dữ liệu.'], ['Drawing conclusions from one run; caching makes repeat runs faster.', 'Kết luận từ một lần đo; cache làm các lần sau nhanh hơn.']],
  },
  {
    id: 'partition', level: 'advanced',
    title: ['Partitioning: split a huge table', 'Partition: chia bảng lớn thành nhiều phần'],
    tagline: ['Skip the parts a query does not need.', 'Bỏ qua những phần query không cần.'],
    what: ['Partitioning splits one large table into child tables by a column, usually a date (one per month). When a query asks for one month, PostgreSQL skips the other parts — this is called partition pruning. Old data can be removed by dropping a whole partition.',
      'Partition chia một bảng lớn thành nhiều bảng con theo một cột, thường là ngày (mỗi tháng một phần). Khi query chỉ hỏi một tháng, PostgreSQL bỏ qua các phần còn lại — gọi là partition pruning. Xóa dữ liệu cũ chỉ cần bỏ cả partition.'],
    when: [['Very large tables that grow over time (logs, events, orders).', 'Bảng rất lớn tăng theo thời gian (log, sự kiện, đơn hàng).'], ['Queries usually filter by a time range.', 'Query thường lọc theo khoảng thời gian.']],
    syntax: "CREATE TABLE parent (…)\n  PARTITION BY RANGE (date_column);\n\nCREATE TABLE child PARTITION OF parent\n  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');",
    parts: [
      { code: 'PARTITION BY RANGE (col)', meaning: ['Split by ranges of this column.', 'Chia theo khoảng giá trị của cột này.'] },
      { code: 'PARTITION OF parent', meaning: ['Creates a child table.', 'Tạo một bảng con.'] },
      { code: 'FROM … TO …', meaning: ['Includes the lower bound, excludes the upper bound.', 'Gồm cận dưới, KHÔNG gồm cận trên.'] },
      { code: 'DEFAULT', meaning: ['A child that receives rows outside every range.', 'Bảng con nhận dữ liệu nằm ngoài mọi khoảng.'] },
    ],
    example: {
      question: ['Split orders by month and count rows in each part.', 'Chia orders theo tháng và đếm số dòng mỗi phần.'],
      sql: "CREATE TABLE orders_by_month (LIKE orders)\n  PARTITION BY RANGE (order_date);\nCREATE TABLE orders_2024_01 PARTITION OF orders_by_month\n  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');\nCREATE TABLE orders_2024_02 PARTITION OF orders_by_month\n  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');\nCREATE TABLE orders_2024_03 PARTITION OF orders_by_month\n  FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');\nINSERT INTO orders_by_month SELECT * FROM orders;", uses: ['orders'],
      check: 'SELECT tableoid::regclass::text AS part, COUNT(*) AS row_count\nFROM orders_by_month\nGROUP BY 1 ORDER BY 1;',
      result: { columns: ['part', 'row_count'], rows: [['orders_2024_01', 2], ['orders_2024_02', 2], ['orders_2024_03', 2]] },
    },
    mistakes: [['Queries that do not filter on the partition column still read every partition.', 'Query không lọc theo cột partition thì vẫn đọc mọi phần.'], ['Partitioning small tables: more complexity, no benefit.', 'Partition bảng nhỏ: phức tạp thêm mà không có lợi.']],
  },
  {
    id: 'pagination', level: 'advanced',
    title: ['Keyset pagination', 'Phân trang keyset'],
    tagline: ['Deep pages as fast as the first one.', 'Trang sâu nhanh như trang đầu.'],
    what: ['OFFSET 10000 makes the database read and discard 10,000 rows. Keyset pagination remembers the last row of the previous page and starts right after it, so page 1000 is as fast as page 1 (with a matching index).',
      'OFFSET 10000 buộc database đọc rồi bỏ 10.000 dòng. Phân trang keyset nhớ dòng cuối của trang trước và bắt đầu ngay sau nó, nên trang 1000 nhanh như trang 1 (khi có index phù hợp).'],
    when: [['Infinite scroll or "load more".', 'Cuộn vô hạn hoặc nút "xem thêm".'], ['APIs returning large lists.', 'API trả về danh sách lớn.']],
    syntax: 'SELECT …\nWHERE (sort_col, id) < (last_value, last_id)\nORDER BY sort_col DESC, id DESC\nLIMIT n;',
    parts: [
      { code: '(sort_col, id) < (…, …)', meaning: ['Continue after the last row you showed.', 'Tiếp tục ngay sau dòng cuối đã hiển thị.'] },
      { code: 'ORDER BY sort_col DESC, id DESC', meaning: ['Same order as the comparison; id breaks ties.', 'Cùng thứ tự với phép so sánh; id phân xử khi trùng.'] },
      { code: 'LIMIT n', meaning: ['Page size.', 'Số dòng mỗi trang.'] },
    ],
    example: {
      question: ['Page 1 ended at order 105 (2024-03-02). Load the next 2.', 'Trang 1 kết thúc ở đơn 105 (2024-03-02). Lấy 2 đơn tiếp theo.'],
      sql: "SELECT id, order_date\nFROM orders\nWHERE (order_date, id) < (DATE '2024-03-02', 105)\nORDER BY order_date DESC, id DESC\nLIMIT 2;", uses: ['orders'],
      result: { columns: ['id', 'order_date'], rows: [[104, '2024-02-20'], [103, '2024-02-11']] },
    },
    mistakes: [['No unique tie-breaker (id): rows get skipped or repeated.', 'Không có cột duy nhất (id) để phân xử: dòng bị bỏ sót hoặc lặp.'], ['Keyset cannot jump straight to "page 50".', 'Keyset không nhảy thẳng tới "trang 50" được.']],
  },
  {
    id: 'permissions', level: 'advanced',
    title: ['Roles and permissions', 'Role và phân quyền'],
    tagline: ['Give each account only what it needs.', 'Chỉ cấp cho mỗi tài khoản đúng quyền cần dùng.'],
    what: ['A role is an account in PostgreSQL. GRANT gives a role specific rights, such as reading a table or creating tables. The rule: grant only what is needed — a read-only role cannot accidentally delete data.',
      'Role là tài khoản trong PostgreSQL. GRANT cấp cho role các quyền cụ thể, như đọc bảng hay tạo bảng. Nguyên tắc: chỉ cấp vừa đủ — role chỉ đọc thì không thể vô tình xóa dữ liệu.'],
    when: [['Connecting tools like QueryLab to your database.', 'Kết nối công cụ như QueryLab vào database.'], ['Separating app, admin and reporting accounts.', 'Tách tài khoản ứng dụng, quản trị và báo cáo.']],
    syntax: "CREATE ROLE name LOGIN PASSWORD '…';\nGRANT privilege ON object TO name;",
    parts: [
      { code: 'LOGIN', meaning: ['The role can sign in.', 'Role đăng nhập được.'] },
      { code: 'USAGE ON SCHEMA', meaning: ['May access objects in the schema.', 'Được truy cập đối tượng trong schema.'] },
      { code: 'SELECT ON TABLE', meaning: ['May read the table.', 'Được đọc bảng.'] },
      { code: 'CREATE ON SCHEMA', meaning: ['May create new tables (needed for partition experiments).', 'Được tạo bảng mới (cần cho thử nghiệm partition).'] },
      { code: 'table owner', meaning: ['Only the owner can create indexes on a table.', 'Chỉ chủ sở hữu bảng mới tạo được index.'] },
    ],
    example: {
      question: ['A read-only role for QueryLab (run as an admin).', 'Tạo role chỉ đọc cho QueryLab (chạy bằng tài khoản quản trị).'],
      sql: "CREATE ROLE querylab_reader LOGIN PASSWORD 'change-me';\nGRANT CONNECT ON DATABASE my_app_dev TO querylab_reader;\nGRANT USAGE ON SCHEMA public TO querylab_reader;\nGRANT SELECT ON ALL TABLES IN SCHEMA public TO querylab_reader;",
      note: ['With this role you can measure queries but not create indexes.', 'Với role này bạn đo được query nhưng không tạo được index.'],
      runnable: false,
    },
    mistakes: [['Connecting tools as a superuser "for convenience".', 'Dùng superuser để kết nối công cụ "cho tiện".'], ['GRANT ALL when SELECT is enough.', 'GRANT ALL khi chỉ cần SELECT.']],
  },
];
