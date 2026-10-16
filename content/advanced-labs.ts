import type { Lab } from './labs';
import type { LabTranslation } from './labs.vi';

const broadOrders = "SELECT count(*) AS order_count FROM orders WHERE status = 'completed';";
const juneOrders = `SELECT id, customer_id, order_date, total
FROM orders_partitioned
WHERE order_date >= DATE '2024-06-01'
  AND order_date < DATE '2024-07-01'
ORDER BY id;`;
const juneBaseline = `SELECT id, customer_id, order_date, total
FROM orders_partitioned
WHERE date_trunc('month', order_date) = TIMESTAMP '2024-06-01'
ORDER BY id;`;

export const advancedLabs: Lab[] = [
  {
    id: 'index-013', number: 13, slug: 'index-selectivity', title: 'When an Index Is Not a Shortcut',
    subtitle: 'A daily report needs most orders. Should every scan use an index?',
    category: 'index', difficulty: 'intermediate', durationMinutes: 12, xp: 130, dataset: 'ecommerce', contentVersion: 1,
    goals: ['Separate an existing index from the index selected by the planner.', 'Compare broad and selective filters.', 'Explain a measured plan without forcing an index.'],
    concept: 'An index is an available access path, not an instruction to use it. Selectivity, the required columns, ordering and visibility affect the planner choice. Counting completed orders can use an Index Only Scan because the status index covers that query, or choose another scan. Either observation is valid: inspect the actual plan before claiming improvement.',
    initialState: 'The status B-tree exists before the baseline; about 70% of orders are completed. Other indexes are primary keys.',
    setupSql: ['CREATE INDEX idx_orders_status ON orders (status);'], initialQuery: broadOrders, baselineQuery: broadOrders,
    task: 'Return the complete count of completed orders as order_count. Keep the status index, capture an actual plan, and compare with a narrow customer filter using the story experiment. No particular scan type or elapsed time is required to pass.',
    expectedBehavior: 'The count stays correct and the status index exists. The plan is observed rather than forced; a broad filter is not automatically an indexing failure.',
    hints: ['Look at the active indexes and compare them with Index Name in the plan.', 'The count query needs status, while SELECT * would need more columns.', 'Use the provided counterexperiment to inspect customer 42, then return to the report query before checking.'],
    solutionSql: broadOrders,
    solutionExplanation: 'The report is correct independently of its scan type. A status index can cover a count, but a query needing many table columns may have different access costs. Return to the exact report before submitting; a narrower query changes the question rather than optimizing the same answer.',
    realWorldScenario: 'A teammate wants to add indexes to every reporting filter. Your job is to measure the access path and explain the read/storage/write tradeoff.',
    validationRules: [
      { kind: 'result-equivalent', referenceSql: broadOrders, ordered: false, explanation: 'Return the complete completed-order count as order_count.' },
      { kind: 'has-index', table: 'orders', leadingColumns: ['status'], explanation: 'Keep the status index available for the experiment.' },
      { kind: 'plan-captured', explanation: 'Capture real executor counters; any observed scan type is accepted.' },
    ],
  },
  {
    id: 'partition-014', number: 14, slug: 'partition-pruning', title: 'One Month, Not Every Partition',
    subtitle: 'The finance team needs June. Help PostgreSQL skip the other months.',
    category: 'performance', difficulty: 'intermediate', durationMinutes: 15, xp: 160, dataset: 'ecommerce', contentVersion: 1,
    goals: ['Observe real monthly partition pruning.', 'Rewrite a date condition while preserving all June orders.', 'Separate partition pruning from index access within a partition.'],
    concept: 'A partitioned table routes rows to child tables by bounds. A compatible date range lets PostgreSQL exclude irrelevant children. The fixture intentionally has no secondary indexes on the partitioned copy, so a Seq Scan of the June child can be the successful outcome. Partitioning also serves data lifecycle needs and is not a universal speedup.',
    initialState: 'A trusted setup copies orders into orders_partitioned with 24 monthly children spanning 2024–2025. The original four tables are unchanged. The starter wraps order_date in date_trunc.',
    setupSql: [], initialQuery: juneBaseline, baselineQuery: juneBaseline,
    task: 'Return every June 2024 order with id, customer_id, order_date and total, sorted by id. Rewrite the filter so the actual plan reads only orders_p202406. Keep all results; do not add LIMIT.',
    expectedBehavior: 'The range condition keeps the result unchanged. The actual plan scans the June child and avoids an Append across the monthly children.',
    hints: ['Compare the monthly tiles for the starter query.', 'Express June as >= 2024-06-01 and < 2024-07-01 directly on order_date.', 'A Seq Scan of one selected month is fine. Partition pruning does not require an index.'],
    solutionSql: juneOrders,
    solutionExplanation: 'The half-open date interval matches the June partition bounds. PostgreSQL can exclude the remaining monthly children before execution. Sorting by id preserves the required output order. This lesson proves pruning on this fixture; it does not claim all partitioned queries become faster.',
    realWorldScenario: 'Finance runs month-end reports on historical orders. Read only the requested period while retaining the full history.',
    validationRules: [
      { kind: 'result-equivalent', referenceSql: juneOrders, ordered: true, explanation: 'Return all June orders and required columns in id order.' },
      { kind: 'plan-has-node', nodeType: 'Seq Scan', table: 'orders_p202406', explanation: 'Observe the June partition scan in the actual plan.' },
      { kind: 'plan-avoids-node', nodeType: 'Append', explanation: 'Prune the other monthly partitions instead of appending their scans.' },
      { kind: 'plan-avoids-node', nodeType: 'Merge Append', explanation: 'Avoid scanning multiple months through Merge Append.' },
    ],
  },
];

export const advancedLabsVi: Record<string, LabTranslation> = {
  'index-013': {
    title: 'Khi index chưa chắc là đường tắt', subtitle: 'Báo cáo cần phần lớn đơn hàng. Có nhất thiết phải dùng index?',
    goals: ['Phân biệt index tồn tại với index được planner chọn.', 'So sánh điều kiện lọc rộng và hẹp.', 'Giải thích plan thực đo, không ép database dùng index.'],
    concept: 'Index là một cách truy cập có sẵn, không phải mệnh lệnh phải dùng. Độ chọn lọc, cột cần lấy, thứ tự và visibility ảnh hưởng lựa chọn. Đếm đơn hoàn thành có thể dùng Index Only Scan vì index status bao phủ query, hoặc chọn cách quét khác. Hãy đọc plan thực trước khi kết luận.',
    initialState: 'Đã có B-tree trên status trước baseline; khoảng 70% đơn hoàn thành. Các index khác là khóa chính.',
    task: 'Trả về đầy đủ số đơn hoàn thành với tên cột order_count. Giữ index status, lấy plan thực và thử đối chiếu với điều kiện lọc một khách hàng trong câu chuyện. Bài không bắt buộc một loại scan hay mốc thời gian.',
    expectedBehavior: 'Kết quả đếm đúng, index status tồn tại và có plan thực. Điều kiện lọc rộng không tự có nghĩa là database dùng index sai.',
    hints: ['So danh sách index với Index Name trong plan.', 'Query đếm chỉ cần status; SELECT * cần thêm nhiều cột.', 'Thử query khách hàng 42 rồi quay lại query báo cáo trước khi chấm.'],
    solutionExplanation: 'Báo cáo đúng độc lập với loại scan. Index status có thể bao phủ phép đếm, trong khi query cần nhiều cột bảng có chi phí khác. Lọc ít dữ liệu hơn làm đổi câu hỏi; đó chưa phải tối ưu cùng một kết quả.',
    realWorldScenario: 'Đồng đội muốn thêm index cho mọi điều kiện báo cáo. Bạn cần đo, đọc plan và giải thích đánh đổi giữa đọc, dung lượng và ghi.',
    validationExplanations: ['Trả về đầy đủ số đơn hoàn thành với cột order_count.', 'Giữ index status để làm thí nghiệm.', 'Lấy bộ đếm thực thi thật; chấp nhận mọi loại scan quan sát được.'],
  },
  'partition-014': {
    title: 'Một tháng, không phải mọi partition', subtitle: 'Kế toán cần tháng Sáu. Giúp PostgreSQL bỏ qua các tháng khác.',
    goals: ['Quan sát partition pruning theo tháng trên PostgreSQL thật.', 'Viết lại điều kiện ngày và giữ đủ đơn tháng Sáu.', 'Phân biệt bỏ qua partition với dùng index trong một partition.'],
    concept: 'Bảng partition chuyển dòng vào các bảng con theo khoảng giá trị. Khoảng ngày phù hợp giúp PostgreSQL loại các tháng không cần đọc. Bản sao trong bài không có index phụ, nên Seq Scan của riêng tháng Sáu vẫn là kết quả đúng. Partition còn phục vụ vòng đời dữ liệu, không đảm bảo mọi query nhanh hơn.',
    initialState: 'Setup tin cậy sao chép orders vào orders_partitioned với 24 bảng con theo tháng của 2024–2025. Bốn bảng gốc được giữ. Query ban đầu bọc order_date trong date_trunc.',
    task: 'Lấy toàn bộ đơn tháng Sáu 2024 với id, customer_id, order_date, total, sắp xếp theo id. Viết lại điều kiện để plan chỉ đọc orders_p202406. Giữ đầy đủ kết quả, không thêm LIMIT.',
    expectedBehavior: 'Điều kiện khoảng ngày giữ nguyên kết quả. Plan đọc bảng con tháng Sáu và tránh Append qua nhiều tháng.',
    hints: ['So các ô tháng ở query ban đầu.', 'Dùng order_date >= 2024-06-01 và < 2024-07-01 trực tiếp trên cột.', 'Seq Scan của một tháng được chọn là hợp lý; pruning không cần index.'],
    solutionExplanation: 'Khoảng ngày có đầu đóng/cuối mở khớp ranh giới partition tháng Sáu. PostgreSQL loại các tháng còn lại trước khi thực thi. ORDER BY id giữ thứ tự yêu cầu. Thí nghiệm chứng minh pruning ở dataset này, không khẳng định mọi query partition đều nhanh hơn.',
    realWorldScenario: 'Kế toán chạy báo cáo cuối tháng trên lịch sử đơn hàng. Chỉ đọc kỳ được yêu cầu trong khi vẫn giữ toàn bộ lịch sử.',
    validationExplanations: ['Trả về đủ đơn tháng Sáu và các cột yêu cầu theo thứ tự id.', 'Quan sát scan của partition tháng Sáu trong plan thực.', 'Bỏ qua các tháng khác thay vì Append kết quả quét của chúng.', 'Tránh quét nhiều tháng qua Merge Append.'],
  },
};
