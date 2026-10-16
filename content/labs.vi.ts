import type { Lab, LabCategory } from './labs';
import { advancedLabsVi } from './advanced-labs';

/** Only learner-facing text is translated; SQL and validation data stay in labs.ts. */
export type LabTranslation = Pick<Lab,
  | 'title' | 'subtitle' | 'goals' | 'concept' | 'initialState' | 'task'
  | 'expectedBehavior' | 'hints' | 'solutionExplanation' | 'realWorldScenario'
> & {
  validationExplanations: string[];
  incidentObservations?: string[];
};

const equivalent = 'Trả về đúng các cột và giá trị như kết quả tham chiếu. Mọi cách viết SQL cho kết quả đúng đều được chấp nhận.';
const indexed = (table: string, columns: string[]) => [
  `Chỉ mục trên ${table} phải bắt đầu bằng ${columns.join(', ')}. Bạn có thể tự chọn tên chỉ mục.`,
  `Kế hoạch thực thi thực tế phải dùng chỉ mục để truy cập ${table}. Truy cập bitmap và index-only đều được chấp nhận.`,
];

export const categoriesVi: Record<LabCategory, { title: string; description: string }> = {
  sql: { title: 'SQL cơ bản', description: 'Dùng dữ liệu để trả lời các câu hỏi thực tế.' },
  index: { title: 'Chỉ mục & hiệu năng', description: 'Khám phá cách PostgreSQL tìm một dòng dữ liệu.' },
  performance: { title: 'Tối ưu truy vấn', description: 'Đọc kế hoạch thực thi và giảm công việc không cần thiết.' },
  incident: { title: 'Xử lý sự cố thực tế', description: 'Chẩn đoán một tình huống mô phỏng hệ thống thật.' },
};

export const labTranslationsVi: Record<string, LabTranslation> = {
  ...advancedLabsVi,
  'sql-001': {
    title: 'SELECT & WHERE',
    subtitle: 'Biến câu hỏi nghiệp vụ thành truy vấn đầu tiên.',
    goals: [
      'Chọn các cột cần có trong kết quả.',
      'Lọc bản ghi bằng WHERE.',
      'Dùng ORDER BY để kết quả có thứ tự rõ ràng.',
    ],
    concept: 'Bảng lưu các dòng dữ liệu; SELECT chọn các cột cần trả về. WHERE giữ lại những dòng thỏa điều kiện. ORDER BY điều khiển thứ tự hiển thị. SQL không đảm bảo thứ tự dòng nếu bạn không yêu cầu, ngay cả khi một lần chạy trước có vẻ đã được sắp xếp.',
    initialState: 'Cơ sở dữ liệu thương mại điện tử có 1.000 khách hàng và 50.000 đơn hàng. Các khóa chính đã tồn tại; chưa có chỉ mục bổ sung dành cho bài học.',
    task: 'Nhóm hỗ trợ cần tất cả đơn hàng của khách hàng 42. Chỉ trả về id, order_date và total, sắp xếp theo id từ nhỏ đến lớn.',
    expectedBehavior: 'Mọi dòng trả về đều thuộc khách hàng 42. Kết quả có đúng ba cột được yêu cầu và tăng dần theo id. Bộ lọc thay đổi các dòng được trả về; truy vấn chạy nhanh chưa chắc đã xử lý dữ liệu hiệu quả.',
    hints: [
      'Tìm cột liên kết đơn hàng với khách hàng.',
      'Thêm WHERE customer_id = 42 sau FROM orders.',
      'Liệt kê ba cột sau SELECT, rồi kết thúc bằng ORDER BY id.',
    ],
    solutionExplanation: 'Danh sách cột chỉ lấy những trường được yêu cầu. Điều kiện bằng xác định khách hàng cần tìm, còn phép sắp xếp tường minh tạo thứ tự ổn định cho nhóm hỗ trợ. PostgreSQL vẫn có thể phải kiểm tra mọi đơn hàng vì customer_id chưa có chỉ mục.',
    realWorldScenario: 'Nhân viên hỗ trợ cần lịch sử đơn hàng của một khách hàng mà không phải tải toàn bộ bảng orders.',
    validationExplanations: [equivalent],
  },
  'sql-002': {
    title: 'GROUP BY',
    subtitle: 'Tổng hợp hàng nghìn đơn hàng thành doanh thu theo khách hàng.',
    goals: [
      'Tổng hợp nhiều dòng thành một dòng cho mỗi khách hàng.',
      'Phân biệt lọc dòng với lọc nhóm.',
      'Dùng quy tắc phụ để thứ tự ổn định khi các giá trị bằng nhau.',
    ],
    concept: 'GROUP BY tạo các nhóm dòng. SUM và COUNT tính giá trị cho từng nhóm. WHERE loại các dòng trước khi tổng hợp; HAVING loại các nhóm sau khi tổng hợp. Một cột được chọn phải nằm trong GROUP BY hoặc được tổng hợp, trừ khi cơ sở dữ liệu chứng minh được quan hệ phụ thuộc.',
    initialState: 'Đơn hàng có các trạng thái completed, pending và cancelled. Doanh thu trong bài này chỉ tính các đơn completed.',
    task: 'Tìm 10 khách hàng có doanh thu từ đơn đã hoàn tất cao nhất. Trả về customer_id và SUM(total) AS revenue. Sắp xếp revenue giảm dần, rồi customer_id tăng dần để xử lý các trường hợp bằng doanh thu.',
    expectedBehavior: 'Kết quả gồm 10 nhóm khách hàng. Mỗi giá trị revenue chỉ cộng các đơn completed của khách hàng đó; những tổng bằng nhau dùng thứ tự phụ đã yêu cầu.',
    hints: [
      "Áp dụng status = 'completed' trước khi nhóm.",
      'Nhóm theo customer_id và tính SUM(total) AS revenue.',
      'Sắp xếp bằng revenue DESC, customer_id ASC và giới hạn kết quả còn 10 dòng.',
    ],
    solutionExplanation: 'WHERE loại doanh thu chưa được ghi nhận trước khi tính tổng. Mỗi nhóm đại diện cho một khách hàng. SUM(total) tính doanh thu của khách hàng từ các đơn completed; thứ tự phụ giúp danh sách 10 khách hàng có thể lặp lại khi tổng doanh thu bằng nhau.',
    realWorldScenario: 'Chuyên viên phân tích lập báo cáo doanh thu khách hàng và cần tránh tính các đơn đang chờ hoặc đã hủy.',
    validationExplanations: [equivalent],
  },
  'sql-003': {
    title: 'JOIN',
    subtitle: 'Kết nối dữ liệu đơn hàng với người đặt hàng.',
    goals: [
      'Nối các bảng thông qua quan hệ khóa ngoại.',
      'Ghi rõ nguồn của cột để tránh nhầm lẫn.',
      'Giải thích vì sao nối sai cột làm số dòng tăng lên.',
    ],
    concept: 'JOIN kết hợp các dòng thỏa một quan hệ. orders.customer_id tham chiếu customers.id: nhiều đơn hàng có thể thuộc một khách hàng. Hãy nối theo quan hệ đó, thay vì các tên hay số tiền tình cờ giống nhau. Điều kiện nối thiếu hoặc sai có thể tạo ra một tích Descartes rất lớn.',
    initialState: 'customers.id là khóa chính; orders.customer_id xác định khách hàng đã đặt đơn.',
    task: 'Hiển thị đơn hàng của khách hàng 42 kèm tên khách hàng cho nhóm hỗ trợ. Trả về o.id AS order_id, c.name AS customer_name và o.total, sắp xếp order_id tăng dần.',
    expectedBehavior: 'Mỗi đơn hàng xuất hiện một lần với đúng tên khách hàng. Kết quả không bị lặp đơn do điều kiện nối sai.',
    hints: [
      'Nối orders o với customers c.',
      'Quan hệ giữa hai bảng là o.customer_id = c.id.',
      'Lọc o.customer_id = 42 và đặt bí danh cho các cột như yêu cầu.',
    ],
    solutionExplanation: 'Khóa chính của khách hàng đảm bảo mỗi đơn chỉ khớp một khách hàng. Bí danh làm rõ nguồn của từng trường và tạo đúng tên cột đầu ra. Khóa ngoại mô tả quan hệ; nó không tự tạo chỉ mục trên orders.customer_id.',
    realWorldScenario: 'Bảng điều khiển vận hành cần tên khách hàng dễ đọc thay cho mã khách hàng nội bộ.',
    validationExplanations: [equivalent],
  },
  'sql-004': {
    title: 'Hàm cửa sổ',
    subtitle: 'Giữ nguyên chi tiết khi xếp hạng các dòng trong từng nhóm.',
    goals: [
      'Xếp hạng đơn hàng trong từng khách hàng.',
      'Dùng CTE để lọc kết quả của hàm cửa sổ.',
      'Xử lý các ngày bằng nhau bằng quy tắc phân định ổn định.',
    ],
    concept: 'Phép tổng hợp gộp một nhóm thành một dòng, còn hàm cửa sổ giữ lại từng dòng. ROW_NUMBER gán vị trí trong mỗi nhóm PARTITION BY. ORDER BY của hàm quyết định thứ tự xếp hạng. Hãy tính số thứ tự trong CTE hoặc truy vấn con, rồi lọc ở truy vấn ngoài vì WHERE được xử lý trước hàm cửa sổ.',
    initialState: 'Khách hàng có thể đặt nhiều đơn cùng ngày. Khi ngày bằng nhau, đơn có id lớn hơn được quy ước là mới hơn.',
    task: 'Trả về đơn hàng mới nhất của mỗi khách hàng. Các cột gồm customer_id, id AS order_id, order_date và total. Nếu cùng ngày, chọn id lớn nhất; sau đó sắp xếp kết quả cuối theo customer_id tăng dần.',
    expectedBehavior: 'Mỗi khách hàng có đơn được trả về đúng một đơn. Đơn có ngày mới nhất và id lớn nhất trong các đơn cùng ngày đó. Các cách tương đương như DISTINCT ON đều được chấp nhận.',
    hints: [
      'Phân nhóm ROW_NUMBER bằng customer_id.',
      'Sắp xếp mỗi nhóm bằng order_date DESC, id DESC.',
      'Đặt truy vấn xếp hạng trong CTE, rồi giữ rn = 1 ở truy vấn ngoài.',
    ],
    solutionExplanation: 'Mỗi khách hàng có bảng xếp hạng riêng. Sắp xếp theo cả ngày và id tránh chọn tùy ý khi ngày bằng nhau. CTE giúp cách tính dễ đọc; bộ lọc ngoài chọn một dòng cho mỗi khách hàng. Cách viết khác cho kết quả đúng vẫn hợp lệ vì hiểu kết quả quan trọng hơn việc chép một cú pháp cụ thể.',
    realWorldScenario: 'Bảng điều khiển khách hàng hiển thị lần mua mới nhất của từng người mà vẫn giữ các trường chi tiết của đơn.',
    validationExplanations: [equivalent],
  },
  'index-005': {
    title: 'Quét toàn bảng',
    subtitle: 'Khám phá công việc ẩn sau một kết quả nhỏ.',
    goals: [
      'Tìm phép quét tuần tự trong kế hoạch thực thi.',
      'Phân biệt số dòng trả về với số dòng được kiểm tra.',
      'Giải thích vì sao LIMIT không giải quyết mọi vấn đề hiệu năng.',
    ],
    concept: 'Khi thiếu chỉ mục phù hợp, PostgreSQL có thể đọc bảng orders và kiểm tra bộ lọc trên từng dòng. Chỉ một số ít dòng có thể thỏa điều kiện. Kết quả nhỏ không đồng nghĩa với ít công việc: Actual Rows cộng Rows Removed by Filter mô tả số dòng mà phép quét đã kiểm tra. Quét tuần tự vẫn có thể là lựa chọn tốt nhất khi truy vấn cần phần lớn dữ liệu trong bảng.',
    initialState: 'Chỉ có các chỉ mục khóa chính. Chưa có chỉ mục bắt đầu bằng cột orders.customer_id.',
    task: 'Chạy nguyên truy vấn tìm khách hàng 42, mở kế hoạch thực thi và xem phép quét. Hoàn thành thí nghiệm với kết quả chứa mọi đơn hàng của khách hàng 42.',
    expectedBehavior: 'Kế hoạch có phép quét tuần tự trên orders. Nó trả về những đơn khớp điều kiện và loại nhiều dòng khác. Minh họa phép quét phân biệt các dòng được kiểm tra với các dòng được trả về.',
    hints: [
      'Chạy truy vấn trước khi thêm chỉ mục.',
      'Tìm Seq Scan trên orders trong kế hoạch.',
      'So sánh Actual Rows với Rows Removed by Filter. Tổng của chúng ước lượng số dòng mà phép quét đã kiểm tra.',
    ],
    solutionExplanation: 'Cơ sở dữ liệu biết khách hàng cần tìm nhưng không có cấu trúc có thứ tự ánh xạ customer_id tới các dòng. Nó quét bảng rồi kiểm tra điều kiện. Thêm LIMIT sẽ thay đổi câu hỏi và vẫn có thể cần quét nhiều dòng; bài tiếp theo sẽ tạo cấu trúc tra cứu còn thiếu.',
    realWorldScenario: 'Truy vấn trả về lịch sử của một khách hàng nhưng công việc của cơ sở dữ liệu lớn hơn nhiều so với kích thước kết quả.',
    validationExplanations: [equivalent, 'Quan sát phép quét orders chưa có chỉ mục phù hợp trong cơ sở dữ liệu mới của bài học.'],
  },
  'index-006': {
    title: 'Chỉ mục đầu tiên',
    subtitle: 'Tạo đường truy cập nhanh tới những dòng bạn cần.',
    goals: [
      'Tạo chỉ mục B-tree cho bộ lọc có tính chọn lọc cao.',
      'So sánh cách truy cập trước và sau tối ưu.',
      'Giải thích chi phí lưu trữ và cập nhật của chỉ mục.',
    ],
    concept: 'B-tree lưu các khóa có thứ tự cùng tham chiếu tới dòng trong bảng. PostgreSQL có thể đi qua cây tới khách hàng cần tìm, rồi lấy các dòng khớp. Tùy ước tính chi phí, nó có thể chọn Index Scan hoặc Bitmap Index Scan kết hợp Bitmap Heap Scan. Chỉ mục tốn dung lượng và phải được cập nhật khi ghi dữ liệu; lợi ích đó có chi phí.',
    initialState: 'Truy vấn tìm khách hàng đã được đo khi chưa có chỉ mục customer_id. Dữ liệu ban đầu chỉ có các chỉ mục khóa chính.',
    task: 'Tạo chỉ mục hỗ trợ tìm đơn của khách hàng 42, rồi chạy lại cùng SELECT. Giữ nguyên mọi dòng kết quả và giảm ít nhất 80% số dòng orders được kiểm tra so với mốc ban đầu.',
    expectedBehavior: 'Có chỉ mục customer_id phù hợp và kế hoạch thực tế sử dụng nó. Các đơn trả về giữ nguyên trong khi công việc quét giảm rõ rệt. Thời gian chạy được hiển thị để tham khảo; sai số thời gian trên trình duyệt không dùng làm ngưỡng đạt bài.',
    hints: [
      'Bộ lọc so sánh với một giá trị customer_id.',
      'B-tree trên orders(customer_id) có thể tìm nhóm dòng này.',
      'Chạy CREATE INDEX, rồi SELECT ban đầu. Bạn tự chọn tên chỉ mục.',
    ],
    solutionExplanation: 'Chỉ mục mới thu hẹp phạm vi tìm kiếm tới một khách hàng. Truy cập bitmap cũng là kết quả đúng: nó gom vị trí các dòng khớp rồi đọc các trang dữ liệu tương ứng. Hình minh họa mô tả đường truy cập; số liệu kế hoạch đến từ bộ máy thực thi thật. Khóa chính trên orders.id không hỗ trợ điều kiện customer_id này.',
    realWorldScenario: 'API đơn hàng thực hiện truy vấn chọn lọc nhiều lần mỗi phút và cần chỉ mục khớp với bộ lọc.',
    validationExplanations: [equivalent, ...indexed('orders', ['customer_id']), 'Giảm ít nhất 80% số dòng orders cần kiểm tra mà không thay đổi kết quả.'],
  },
  'index-007': {
    title: 'Chỉ mục nhiều cột',
    subtitle: 'Kết hợp bộ lọc bằng với thứ tự của danh sách.',
    goals: [
      'Chọn cột đầu tiên của chỉ mục nhiều cột.',
      'Dùng thứ tự chỉ mục cho truy vấn có ORDER BY và LIMIT.',
      'Hiểu vì sao thứ tự cột thay đổi các cách truy cập hữu ích.',
    ],
    concept: 'B-tree nhiều cột sắp xếp theo cột đầu tiên, rồi theo các cột sau trong những khóa trước bằng nhau. Khi customer_id cố định, chỉ mục (customer_id, order_date DESC, id DESC) có thể đọc các đơn mới nhất thỏa điều kiện theo đúng thứ tự kết quả và dừng sau 20 dòng. Đặt ngày lên đầu có thể khiến truy vấn xử lý thêm dữ liệu của các khách hàng khác.',
    initialState: 'Đã có chỉ mục một cột customer_id. Nó tìm được các đơn của khách hàng nhưng không cung cấp thứ tự theo ngày và id như yêu cầu.',
    task: 'Trả về 20 đơn mới nhất của khách hàng 42 từ ngày 01/06/2024 trở đi. Thêm chỉ mục nhiều cột để PostgreSQL tạo trang kết quả có thứ tự này mà không cần bước Sort riêng.',
    expectedBehavior: 'Kết quả giữ nguyên, kể cả thứ tự khi cùng ngày. Kế hoạch dùng chỉ mục customer_id, order_date, id và không cần nút Sort. Quét ngược một chỉ mục tăng dần tương đương cũng hợp lệ.',
    hints: [
      'Đặt customer_id, cột được lọc bằng, ở đầu.',
      'Thứ tự các khóa còn lại cần khớp ORDER BY order_date DESC, id DESC.',
      'Chỉ mục một cột customer_id vẫn cần sắp xếp các dòng khớp.',
    ],
    solutionExplanation: 'Khóa đầu tiên khoanh vùng một khách hàng. Các khóa sau hỗ trợ khoảng ngày và thứ tự giảm dần ổn định. PostgreSQL có thể dừng ở LIMIT 20 thay vì sắp xếp toàn bộ nhóm thỏa điều kiện. Thêm id giúp các trang có thứ tự xác định khi ngày đặt hàng bằng nhau.',
    realWorldScenario: 'Ứng dụng liên tục tải các đơn gần đây của một khách hàng và cần giảm công việc để lấy trang đầu.',
    validationExplanations: [equivalent, ...indexed('orders', ['customer_id', 'order_date', 'id']), 'Thứ tự chỉ mục cần tạo đúng trang kết quả mà không có bước Sort riêng.'],
  },
  'index-008': {
    title: 'LIKE và chỉ mục',
    subtitle: 'So sánh tìm tiền tố với tìm chuỗi ở vị trí bất kỳ.',
    goals: [
      'Nhận biết điều kiện tiền tố có thể dùng chỉ mục.',
      'Giải thích vì sao ký tự đại diện ở đầu cản trở tra cứu tiền tố bằng B-tree thông thường.',
      'Dùng lớp toán tử văn bản của PostgreSQL để tìm tiền tố.',
    ],
    concept: "LIKE 'customer42%' bắt đầu bằng các ký tự đã biết, nên B-tree phù hợp có thể thu hẹp tìm kiếm về một khoảng tiền tố. LIKE '%42%' bắt đầu ở vị trí không xác định và thường không dùng được khoảng đó. text_pattern_ops của PostgreSQL hỗ trợ thứ tự tiền tố khi dùng collation khác C. Chỉ mục trigram là một công cụ khác dành cho tìm chuỗi con và nằm ngoài bài này.",
    initialState: 'customers.email có kiểu TEXT. Email theo mẫu customer{id}@example.com, có 1.000 khách hàng và chưa có chỉ mục email.',
    task: 'Tìm tất cả email bắt đầu bằng customer42, trả về id, name và email theo id tăng dần. Thêm chỉ mục mà PostgreSQL có thể dùng cho truy vấn tiền tố. Sau đó thử %42% và quan sát cách truy cập khác.',
    expectedBehavior: 'Kết quả tiền tố có customer42@example.com và các email từ customer420@example.com đến customer429@example.com. Truy vấn tiền tố được nộp dùng chỉ mục văn bản phù hợp; thí nghiệm chuỗi con vẫn có thể quét bảng.',
    hints: [
      'Giữ ký tự đại diện ở cuối: customer42%.',
      'Trong PostgreSQL, email text_pattern_ops hỗ trợ tìm tiền tố bằng B-tree cho trường TEXT.',
      'Tạo chỉ mục rồi chạy lại truy vấn tiền tố. So sánh riêng với %42%.',
    ],
    solutionExplanation: 'Thứ tự của chỉ mục giúp PostgreSQL xác định một khoảng ứng viên nhỏ, rồi kiểm tra điều kiện LIKE. Không phải mọi mẫu đều nhanh: ký tự đại diện ở đầu không có khoảng bắt đầu cố định đó. B-tree thông thường cũng có thể hỗ trợ tiền tố với collation phù hợp, nên bài được kiểm tra bằng việc dùng chỉ mục thực tế và kết quả đúng.',
    realWorldScenario: 'API gợi ý khách hàng tìm từ đầu email, còn công cụ điều tra cần tìm chuỗi con ở mọi vị trí.',
    validationExplanations: [equivalent, ...indexed('customers', ['email'])],
  },
  'performance-009': {
    title: 'EXPLAIN',
    subtitle: 'Đọc cách cơ sở dữ liệu đã thực thi truy vấn của bạn.',
    goals: [
      'Phân biệt số dòng ước tính với số dòng thực tế.',
      'Diễn giải các nút quét và số dòng bị bộ lọc loại.',
      'Hiểu rằng ANALYZE thực thi câu lệnh được giải thích.',
    ],
    concept: 'EXPLAIN cho biết kế hoạch và các ước tính chi phí. EXPLAIN ANALYZE chạy câu lệnh rồi bổ sung số dòng thực tế, số vòng lặp và thời gian thực thi đo được. Cost dùng đơn vị của bộ lập kế hoạch, không phải mili giây. Thời gian và số dòng của nút được báo theo mỗi vòng lặp, nên cần xem cả loops. Thời gian của nút cha bao gồm công việc của nút con; cộng tất cả thời gian nút sẽ tính trùng.',
    initialState: 'orders chưa có chỉ mục customer_id. Thí nghiệm chỉ đọc này phân tích truy vấn tìm một khách hàng.',
    task: 'Chạy EXPLAIN ANALYZE cho truy vấn tìm khách hàng 42. Tìm nút truy cập orders, so sánh Plan Rows với Actual Rows và xem Rows Removed by Filter. Bài hoàn thành khi ghi nhận được kế hoạch đã thực thi thật.',
    expectedBehavior: 'Kế hoạch có các trường thực thi thực tế và nút truy cập orders. Giao diện phân biệt chi phí ước tính, số dòng ước tính, số dòng thực tế, số dòng bị loại và thời gian chạy, thay vì coi chúng là cùng một đại lượng.',
    hints: [
      'Đặt EXPLAIN (ANALYZE, FORMAT JSON) trước SELECT.',
      'Tìm nút Seq Scan có Relation Name là orders.',
      'EXPLAIN không có ANALYZE sẽ không cung cấp số dòng hay thời gian thực thi đo được.',
    ],
    solutionExplanation: 'Kế hoạch cho biết PostgreSQL đã thực thi truy vấn này như thế nào, vượt ra ngoài các dòng kết quả cuối. Quét tuần tự orders loại phần lớn dòng. Plan Rows là ước tính; Actual Rows là quan sát của lần chạy này. Execution Time được đo bằng mili giây, còn Total Cost vẫn là ước tính theo đơn vị của bộ lập kế hoạch.',
    realWorldScenario: 'Kỹ sư backend nhận báo cáo truy vấn chậm và dùng kế hoạch thực thi để tìm công việc không cần thiết trong cơ sở dữ liệu.',
    validationExplanations: [
      'Ghi nhận kế hoạch đã thực thi thật với Actual Rows, Actual Loops và Execution Time.',
      'Quan sát cách truy cập orders chưa có chỉ mục phù hợp trong dữ liệu mới của bài học.',
    ],
  },
  'performance-010': {
    title: 'Tối ưu truy vấn chậm',
    subtitle: 'Tạo điều kiện khoảng cho cột ngày đã có chỉ mục.',
    goals: [
      'Nhận biết hàm được áp dụng lên cột có chỉ mục.',
      'Viết lại bộ lọc lịch thành khoảng nửa mở.',
      'Giữ nguyên ý nghĩa truy vấn khi cải thiện cách truy cập.',
    ],
    concept: 'Chỉ mục trên order_date lưu các giá trị ngày gốc. EXTRACT áp dụng lên cột này thường không tạo được điều kiện khoảng trên B-tree gốc. Hãy viết tháng 7 thành order_date >= ngày 1 tháng 7 và order_date < ngày 1 tháng 8. Khoảng nửa mở cũng dùng được cho timestamp mà không phải giả định giây cuối cùng của một ngày.',
    initialState: 'Đã có chỉ mục thông thường trên order_date, nhưng truy vấn ban đầu bọc cột có chỉ mục trong EXTRACT.',
    task: 'Trả về đúng các đơn tháng 7/2024 với cùng thứ tự id. Viết lại điều kiện để PostgreSQL dùng chỉ mục ngày đã có và kiểm tra ít hơn ít nhất 80% số dòng orders.',
    expectedBehavior: 'Truy vấn tối ưu trả về cùng các bản ghi tháng 7. Kế hoạch dùng chỉ mục ngày bằng cách truy cập index hoặc bitmap. Có thể vẫn cần sắp xếp các dòng theo id; điều đó được chấp nhận.',
    hints: [
      'Giữ cột có chỉ mục không bị bọc trong hàm ở một phía của phép so sánh.',
      'Dùng khoảng ngày bao gồm mốc bắt đầu nhưng loại trừ mốc kết thúc.',
      'Tháng 7 bắt đầu ở 2024-07-01; mốc kết thúc không bao gồm là 2024-08-01.',
    ],
    solutionExplanation: 'Điều kiện viết lại khớp với thứ tự được lưu trong chỉ mục hiện có. Nó tương đương hai phép so sánh EXTRACT đối với các giá trị ngày trong dữ liệu này. Kế hoạch bitmap hợp lệ vì giảm các dòng ứng viên trước khi đọc bảng. Chỉ mục biểu thức cũng có thể tăng tốc biểu thức ban đầu, nhưng cách viết khoảng ngày thông thường có thể áp dụng rộng rãi.',
    realWorldScenario: 'Báo cáo tháng có chỉ mục ngày nhưng vẫn quét toàn bộ orders vì WHERE áp dụng các hàm ngày lên cột.',
    validationExplanations: [
      equivalent,
      'Kế hoạch thực tế cần dùng chỉ mục ngày đã có hoặc một chỉ mục hữu ích tương đương.',
      'Giữ nguyên kết quả tháng 7 và giảm ít nhất 80% công việc quét orders.',
    ],
  },
  'performance-011': {
    title: 'Hiệu năng phân trang',
    subtitle: 'Tiếp tục từ con trỏ thay vì bỏ qua 40.000 dòng.',
    goals: [
      'Đo công việc ẩn sau OFFSET lớn.',
      'Dùng phân trang keyset với khóa duy nhất có chỉ mục.',
      'Giải thích ý nghĩa của con trỏ khi dữ liệu thay đổi.',
    ],
    concept: 'OFFSET yêu cầu PostgreSQL tạo các dòng rồi bỏ đi phần đầu. Chỉ mục id có thể hỗ trợ sắp xếp nhưng vẫn phải duyệt các dòng bị bỏ qua. Phân trang keyset yêu cầu bắt đầu sau id cuối cùng đã xem, tránh đi qua các trang trước. Con trỏ trong hệ thống thật phải chứa đầy đủ khóa sắp xếp có thứ tự xác định; chỉ dùng một ngày không duy nhất có thể bỏ sót hoặc lặp các dòng cùng ngày.',
    initialState: 'orders.id là khóa chính có chỉ mục, với id cố định từ 1 đến 50.000. Trang trước kết thúc ở id 40.000.',
    task: 'Lấy 20 đơn tiếp theo sau con trỏ id 40000, trả về id, customer_id, order_date và total theo id tăng dần. Giữ kết quả giống truy vấn ban đầu và giảm ít nhất 80% số dòng được duyệt.',
    expectedBehavior: 'Cả hai truy vấn đều trả về id từ 40001 đến 40020 trong dữ liệu cố định này. Truy vấn tối ưu dùng khoảng id và chỉ duyệt xấp xỉ một trang kết quả thay vì 40.020 dòng.',
    hints: [
      'Con trỏ là id cuối cùng được trả về ở trang trước.',
      'Dùng WHERE id > 40000.',
      'Giữ ORDER BY id và LIMIT 20; bỏ OFFSET lớn.',
    ],
    solutionExplanation: 'B-tree của khóa chính tìm id đầu tiên sau con trỏ, rồi đọc 20 phần tử tiếp theo. Truy vấn ban đầu có thể dùng cùng chỉ mục nhưng vẫn bỏ đi 40.000 phần tử. Việc tương đương trang OFFSET này chỉ đúng với bộ dữ liệu cố định có id liên tục; trong hệ thống thật, con trỏ lấy từ dòng cuối đã đọc, không tính từ số trang.',
    realWorldScenario: 'Danh sách hoạt động càng chậm ở các trang sau dù chỉ mục đã hỗ trợ ORDER BY.',
    validationExplanations: [
      equivalent,
      'Dùng chỉ mục khóa chính để bắt đầu sau con trỏ.',
      'Kiểm tra ít hơn ít nhất 80% số dòng orders so với phân trang OFFSET lớn.',
    ],
  },
  'incident-012': {
    title: 'Sự cố cơ sở dữ liệu thực tế',
    subtitle: 'API đơn hàng chậm. Tìm cách truy cập gây tốn công việc.',
    goals: [
      'Dùng tần suất truy vấn và kế hoạch truy cập để ưu tiên nút thắt.',
      'Áp dụng chỉ mục khớp bộ lọc và thứ tự ổn định.',
      'Kiểm chứng bản sửa bằng kết quả đúng và công việc đo được.',
    ],
    concept: 'Xử lý sự cố cần bằng chứng: truy vấn nào thường xuyên chạy, nó làm bao nhiêu công việc và bản sửa có giữ nguyên hành vi không. Tra sản phẩm theo khóa chính vốn đã chọn lọc. Tổng hợp toàn bộ doanh thu là một loại công việc khác. Danh sách đơn của khách hàng liên tục quét orders và sắp xếp nhóm nhỏ khớp điều kiện; chỉ mục nhiều cột có thể loại công việc quét và sắp xếp lặp lại này.',
    initialState: 'Số liệu tình huống là dữ liệu minh họa, không phải giám sát trực tiếp: độ trễ p95 là 4,7 giây, CPU 91%, 187 kết nối. Thí nghiệm trong trình duyệt vẫn chạy thật trên dữ liệu 50.000 đơn hàng. Chỉ có các chỉ mục khóa chính.',
    task: 'Điều tra nhật ký truy vấn và sửa /api/customers/42/orders. Trả về cùng 20 đơn mới nhất, bao gồm status. Thêm chỉ mục nhiều cột phù hợp, tránh Sort riêng và giảm ít nhất 80% số dòng orders được kiểm tra.',
    expectedBehavior: 'Danh sách đơn thường xuyên được gọi dùng chỉ mục bắt đầu bằng customer_id, order_date và id. Kết quả và thứ tự khi cùng ngày giữ nguyên, bước Sort riêng biến mất và công việc quét giảm. Độ trễ sự cố đã cho vẫn là số liệu tình huống; thời gian thực thi đo trên thiết bị này được hiển thị riêng.',
    hints: [
      'Ưu tiên truy vấn lặp lại thường xuyên, quét nhiều dòng để trả về ít kết quả.',
      'API đơn hàng lọc theo customer_id và sắp xếp order_date DESC, id DESC.',
      'Tạo B-tree nhiều cột theo thứ tự khóa đó, chạy lại truy vấn của API và so sánh kế hoạch.',
    ],
    solutionExplanation: 'Chỉ mục giải quyết đúng cách truy cập của API được gọi thường xuyên. PostgreSQL tìm khoảng khóa của một khách hàng, đọc theo thứ tự yêu cầu và dừng sau 20 dòng. Kiểm tra cả kết quả lẫn kế hoạch: truy vấn nhanh nhưng thiếu status, đổi khách hàng hoặc trả về ít dòng hơn chưa sửa đúng API. Chỉ mục bao phủ với INCLUDE (total, status) là thí nghiệm mở rộng; Index Only Scan còn phụ thuộc thông tin visibility.',
    realWorldScenario: 'Nhóm backend điều tra độ trễ API đơn hàng tăng đột ngột và chọn bản sửa từ bằng chứng kế hoạch, thay vì thêm chỉ mục tùy tiện.',
    validationExplanations: [
      equivalent,
      ...indexed('orders', ['customer_id', 'order_date', 'id']),
      'Dùng thứ tự chỉ mục để lấy trang đơn hàng gần đây.',
      'Giảm ít nhất 80% công việc truy cập orders cho truy vấn của API.',
    ],
    incidentObservations: [
      'Tra cứu chọn lọc bằng khóa chính trả về một dòng với ít công việc quét.',
      'Truy vấn thường xuyên quét orders, lọc một khách hàng rồi sắp xếp các dòng khớp.',
      'Phép tổng hợp theo lịch cần nhiều đơn hàng và chạy ít thường xuyên hơn nhiều.',
    ],
  },
};
