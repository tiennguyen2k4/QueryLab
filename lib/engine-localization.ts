import type { Locale } from './locale';

// Translate presentation only: PostgreSQL SQL, identifiers, and engine behavior stay unchanged.
const messages: Record<string, string> = {
  'SQL is limited to 16,000 characters.': 'SQL được giới hạn ở 16.000 ký tự.',
  'SQL cannot contain a NUL character.': 'SQL không được chứa ký tự NUL.',
  'Unclosed SQL comment.': 'Chú thích SQL chưa được đóng.',
  'Escape-prefixed string literals are not supported; use ordinary quoted strings.': 'Chưa hỗ trợ chuỗi có tiền tố escape; hãy dùng chuỗi trong dấu nháy thông thường.',
  'Unclosed SQL quote.': 'SQL có dấu nháy chưa được đóng.',
  'SQL parameters are not supported in this playground.': 'Khu thực hành chưa hỗ trợ tham số SQL.',
  'Unclosed dollar-quoted string.': 'Chuỗi dollar-quoted chưa được đóng.',
  'Write a SELECT query to begin.': 'Viết truy vấn SELECT để bắt đầu.',
  'Run one SQL statement at a time.': 'Chạy một câu lệnh SQL mỗi lần.',
  'Use simple lowercase index, table and column names.': 'Dùng tên chỉ mục, bảng và cột đơn giản, viết thường.',
  'Use a new index name; internal and primary-key index names are reserved.': 'Dùng tên chỉ mục mới; tên chỉ mục nội bộ và khóa chính đã được dành riêng.',
  'DROP INDEX supports one playground index name only.': 'DROP INDEX chỉ hỗ trợ một tên chỉ mục trong khu thực hành.',
  'Indexes can be created on the four ecommerce tables only.': 'Chỉ được tạo chỉ mục trên bốn bảng thương mại điện tử.',
  'text_pattern_ops requires a TEXT column.': 'text_pattern_ops yêu cầu cột kiểu TEXT.',
  'INCLUDE requires at least one column.': 'INCLUDE yêu cầu ít nhất một cột.',
  'Use a simple B-tree index with up to four columns; expressions and partial indexes are not supported.': 'Dùng chỉ mục B-tree đơn giản với tối đa bốn cột; chưa hỗ trợ biểu thức và chỉ mục một phần.',
  'Unsupported EXPLAIN option.': 'Tùy chọn EXPLAIN chưa được hỗ trợ.',
  'Unclosed EXPLAIN options.': 'Phần tùy chọn EXPLAIN chưa được đóng.',
  'EXPLAIN requires a SELECT query.': 'EXPLAIN yêu cầu một truy vấn SELECT.',
  'Only SELECT, WITH, EXPLAIN, CREATE INDEX and DROP INDEX are supported.': 'Chỉ hỗ trợ SELECT, WITH, EXPLAIN, CREATE INDEX và DROP INDEX.',
  'System catalogs, filesystem and session functions are unavailable.': 'Không cho phép truy cập catalog hệ thống, filesystem và các hàm quản lý phiên.',
  'Unicode escape syntax is unavailable.': 'Không hỗ trợ cú pháp Unicode escape.',
  'Use unqualified function names.': 'Dùng tên hàm không kèm schema.',
  'Initialize the database first.': 'Khởi tạo cơ sở dữ liệu trước.',
  'The database did not return a query plan.': 'Cơ sở dữ liệu không trả về kế hoạch thực thi.',
  'Keep up to 12 playground indexes. Drop an index before creating another.': 'Chỉ giữ tối đa 12 chỉ mục. Xóa một chỉ mục trước khi tạo thêm.',
  'That index already belongs to the initial database; choose a new name.': 'Chỉ mục này thuộc dữ liệu ban đầu; hãy chọn tên mới.',
  'Only indexes created in this playground can be dropped.': 'Chỉ được xóa chỉ mục do bạn tạo trong khu thực hành này.',
  'The index baseline must be a read query.': 'Truy vấn mốc so sánh của chỉ mục phải là truy vấn đọc.',
  'Index change altered the full query result, so the transaction was rolled back. Add a deterministic ORDER BY when using LIMIT.': 'Thay đổi chỉ mục làm khác kết quả truy vấn nên transaction đã được rollback. Thêm ORDER BY xác định khi dùng LIMIT.',
  'Challenge validation requires a SELECT query.': 'Kiểm tra bài tập yêu cầu một truy vấn SELECT.',
  'The canonical result must be a read query.': 'Kết quả tham chiếu phải lấy từ truy vấn đọc.',
  'Return the expected columns in the expected order.': 'Trả về đúng các cột yêu cầu và đúng thứ tự cột.',
  'Use an explicit ORDER BY for the expected row order.': 'Thêm ORDER BY rõ ràng để trả về đúng thứ tự dòng yêu cầu.',
  'The complete result differs from the expected values, duplicate rows, or required row order.': 'Toàn bộ kết quả chưa khớp về giá trị, số lần lặp của dòng hoặc thứ tự dòng yêu cầu.',
  'Run the starter query before your changes to capture the baseline plan.': 'Chạy truy vấn ban đầu trước khi sửa để ghi lại kế hoạch thực thi làm mốc so sánh.',
  'Return the complete expected result.': 'Trả về toàn bộ kết quả yêu cầu.',
  'The database adapter was disposed.': 'Phiên cơ sở dữ liệu đã được đóng.',
  'The database worker failed. Reset the database to rebuild the dataset.': 'Worker cơ sở dữ liệu gặp lỗi. Bấm Đặt lại để tạo lại dữ liệu.',
  'The database worker returned an unreadable response. Reset the database to rebuild it.': 'Worker trả về dữ liệu không đọc được. Bấm Đặt lại để tạo lại cơ sở dữ liệu.',
  'Query timed out. Reset the database to rebuild it; transient indexes were discarded.': 'Truy vấn quá thời gian cho phép. Bấm Đặt lại để tạo lại cơ sở dữ liệu; các chỉ mục tạm đã bị xóa.',
  'Reset the database before running another query.': 'Đặt lại cơ sở dữ liệu trước khi chạy truy vấn khác.',
  'Dataset changed.': 'Bộ dữ liệu đã thay đổi.',
  'Database reset.': 'Đã đặt lại cơ sở dữ liệu.',
  'Database closed.': 'Đã đóng cơ sở dữ liệu.',
  'Query failed.': 'Truy vấn thất bại.',
  'Experiment failed. Try again.': 'Thí nghiệm gặp lỗi. Hãy thử lại.',
  'canceling statement due to statement timeout': 'Truy vấn đã bị dừng do vượt quá thời gian cho phép.',
  'division by zero': 'Không thể chia cho 0.',
};

export function localizeEngineMessage(message: string, locale: Locale): string {
  if (locale === 'en') return message;
  if (messages[message]) return messages[message];
  let match: RegExpMatchArray | null;
  if ((match = message.match(/^Run up to (\d+) statements at a time\.$/))) return `Mỗi lần chạy tối đa ${match[1]} câu lệnh.`;
  if ((match = message.match(/^Unsupported SQL character: (.*)$/))) return `Ký tự SQL không được hỗ trợ: ${match[1]}`;
  if ((match = message.match(/^Expected (.*) in index statement\.$/))) return `Câu lệnh chỉ mục cần có ${match[1]}.`;
  if ((match = message.match(/^Unknown column (.*) on (.*)\.$/))) return `Không có cột ${match[1]} trong bảng ${match[2]}.`;
  if ((match = message.match(/^Unknown INCLUDE column (.*)\.$/))) return `Không có cột INCLUDE ${match[1]}.`;
  if ((match = message.match(/^The (.*) operation is unavailable in this playground\.$/))) return `Thao tác ${match[1]} không được phép trong khu thực hành này.`;
  if ((match = message.match(/^Function (.*) is unavailable; use supported aggregate, string, date or window functions\.$/))) return `Hàm ${match[1]} không được hỗ trợ; hãy dùng các hàm tổng hợp, chuỗi, ngày hoặc window function được cho phép.`;
  if ((match = message.match(/^Return up to (\d+) columns in the result preview\.$/))) return `Preview chỉ hỗ trợ tối đa ${match[1]} cột.`;
  if ((match = message.match(/^Result comparison failed: (.*)$/))) return `Không thể so sánh kết quả: ${localizeEngineMessage(match[1], locale)}`;
  if ((match = message.match(/^The captured plan must (contain|avoid|use) (.*)\.$/))) return `Kế hoạch thực thi phải ${match[1] === 'contain' ? 'có node' : match[1] === 'avoid' ? 'tránh node' : 'sử dụng'} ${match[2]}.`;
  if ((match = message.match(/^(Created|Dropped) (.*)\.( Full query results are unchanged\.)?$/))) return `Đã ${match[1] === 'Created' ? 'tạo' : 'xóa'} ${match[2]}.${match[3] ? ' Toàn bộ kết quả truy vấn không thay đổi.' : ''}`;
  if ((match = message.match(/^syntax error at or near (.*)$/))) return `Lỗi cú pháp tại hoặc gần ${match[1]}`;
  if ((match = message.match(/^relation (.*) does not exist$/))) return `Bảng hoặc quan hệ ${match[1]} không tồn tại.`;
  if ((match = message.match(/^column (.*) does not exist$/))) return `Cột ${match[1]} không tồn tại.`;
  if ((match = message.match(/^column (.*) must appear in the GROUP BY clause or be used in an aggregate function$/))) return `Cột ${match[1]} phải có trong GROUP BY hoặc được dùng trong hàm tổng hợp.`;
  // Unrecognized PostgreSQL diagnostics remain intact so technical details are never lost.
  return message;
}
