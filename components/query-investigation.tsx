'use client';

import { Activity, ArrowRight, Database, Lightbulb } from 'lucide-react';
import { useLocale } from '@/lib/i18n';
import { investigateQuery, type NodeEvidence, type PartitionEvidence } from '@/lib/engine/insights';
import type { QueryResult } from '@/lib/engine/types';

type Props = {
  result: QueryResult;
  baseline: QueryResult | null;
  labId?: string;
  onStageSql?: (sql: string) => void;
  disabled?: boolean;
  mode?: 'browser' | 'native';
};

export function QueryInvestigation({ result, baseline, labId, onStageSql, disabled = false, mode = 'browser' }: Props) {
  const { t, formatNumber } = useLocale();
  if (!result.plan) return null;
  const evidence = investigateQuery(result, baseline, labId);
  const displayCount = (value: number | null) => value === null ? '—' : formatNumber(value);
  const buffers = evidence.buffers;
  const candidate = evidence.indexCandidate;
  const adviceCount = Number(!!candidate) + Number(evidence.estimateMismatches.length > 0) + Number(evidence.sortSpills.length > 0);
  const before = baseline?.metrics?.heapRowsVisitedApprox;
  const now = result.metrics?.heapRowsVisitedApprox;
  const workMax = Math.max(1, before ?? 0, now ?? 0);
  return <section className="query-investigation" aria-label={t('Investigate this query', 'Tìm hiểu query này')}>
    <div className="investigation-heading"><h3><Activity size={17}/>{t('What changed?', 'Điều gì thay đổi?')}</h3></div>
    <div className="investigation-summary result-highlights">
      <div><span>{t('Execution time', 'Thời gian chạy')}</span><strong>{result.metrics ? formatNumber(result.metrics.executionMs) + ' ms' : '—'}</strong></div>
      <div><span>{t('Heap row visits ≈', 'Lượt đọc dòng heap ≈')}</span><strong>{displayCount(now ?? null)}</strong></div>
      <div><span>{t('Rows produced', 'Dòng kết quả')}</span><strong>{displayCount(result.metrics?.actualRows ?? null)}</strong></div>
    </div>
    <p className="investigation-note">{t('Access path: ', 'Cách đọc: ')}<strong>{evidence.executedScans.join(' · ') || '—'}</strong>{evidence.usedIndexes.length > 0 && <> · {evidence.usedIndexes.join(', ')}</>}</p>
    {evidence.partitions ? <PartitionView evidence={evidence.partitions}/> : before !== undefined && now !== undefined && <div className="query-work-comparison" aria-label={t('Heap work before and after', 'Lượt đọc heap trước và sau')}>
      <div><span>{t('Initial', 'Ban đầu')}</span><div className="work-track"><span style={{width:`${before/workMax*100}%`}}/></div><strong>{formatNumber(before)}</strong></div>
      <div><span>{t('Current', 'Hiện tại')}</span><div className="work-track current"><span style={{width:`${now/workMax*100}%`}}/></div><strong>{formatNumber(now)}</strong></div>
      <p className="investigation-note">{t('Approximate heap visits from the measured plans.', 'Lượt đọc dòng heap ước tính từ plan thực tế.')}</p>
    </div>}
    {adviceCount > 0 && <details className="optimization-details"><summary><Lightbulb size={15}/>{t('Optimization ideas', 'Gợi ý tối ưu')}<span className="badge">{adviceCount}</span></summary>
    <div className="investigation-advice">
      {candidate && <article className="advice-card"><h4><Lightbulb size={16}/>{t('An index experiment to try', 'Một thử nghiệm index có thể thử')}</h4>
        <p><span className="advice-label">{t('Observed', 'Quan sát')}</span>{t(`An orders scan returned about ${formatNumber(candidate.returnedRowsApprox)} rows and filtered out ${formatNumber(candidate.filteredRowsApprox)}. The catalog shows no index referencing customer_id.`, `Scan trên orders trả khoảng ${formatNumber(candidate.returnedRowsApprox)} dòng, loại ${formatNumber(candidate.filteredRowsApprox)} dòng bằng Filter. Catalog chưa có index liên quan customer_id.`)}</p>
        <details><summary>{t('Hypothesis, tradeoff and verification', 'Giả thuyết, đánh đổi và cách kiểm chứng')}</summary>
          <p><span className="advice-label">{t('Hypothesis', 'Giả thuyết')}</span>{t('A B-tree on customer_id may reduce work for this selective equality lookup. It is not a demonstrated speedup yet.', 'B-tree trên customer_id có thể giảm công việc cho điều kiện bằng chọn ít dòng này. Chưa có kết quả đo chứng minh tăng tốc.')}</p>
          <p><span className="advice-label">{t('Tradeoff', 'Đánh đổi')}</span>{t('The index uses storage, takes time to build, and adds maintenance to writes. Other queries may benefit less.', 'Index tốn dung lượng, thời gian xây dựng và công cập nhật khi ghi. Query khác có thể hưởng lợi ít hơn.')}</p>
          <p><span className="advice-label">{t('Verify', 'Kiểm chứng')}</span>{t('Run the proposed index and the same query, compare the executed plan and work, and check the full result with the challenge validator. Repeat on the same device; one timing is not conclusive.', 'Chạy index đề xuất rồi cùng query, so plan và lượng công việc; kiểm tra toàn bộ kết quả bằng nút chấm bài. Đo lại trên cùng thiết bị; một lần đo thời gian chưa đủ kết luận.')}</p>
          <pre className="advice-sql">{candidate.createSql}</pre>
        </details>
        {onStageSql && <button type="button" className="button secondary small-button" disabled={disabled} onClick={() => onStageSql(candidate.stagedSql)}>{t('Stage index + query', 'Đưa index + query vào editor')}<ArrowRight size={14}/></button>}
        <p className="investigation-note">{t('Staging only fills the editor. You choose when to run it.', 'Nút này chỉ điền SQL vào editor. Bạn tự chọn lúc chạy.')}</p>
      </article>}
      {evidence.estimateMismatches.length > 0 && <article className="advice-card"><h4>{t('A row estimate worth checking', 'Ước tính số dòng cần xem thêm')}</h4><p><span className="advice-label">{t('Observed', 'Quan sát')}</span>{evidence.estimateMismatches.map(node => `${node.type}${node.relation ? ` (${node.relation})` : ''}: ${displayCount(node.estimatedRows)} → ${displayCount(node.rowsPerLoop)}`).join(' · ')} {t('estimated → actual rows per loop.', 'ước tính → thực tế mỗi vòng.')}</p>
        <details><summary>{t('Possible causes and how to verify', 'Nguyên nhân có thể và cách kiểm chứng')}</summary><p><span className="advice-label">{t('Hypothesis', 'Giả thuyết')}</span>{t('Data skew, correlated predicates or stale statistics may contribute. This plan alone does not identify the cause.', 'Phân bố lệch, điều kiện tương quan hoặc thống kê cũ có thể góp phần. Một plan chưa xác định được nguyên nhân.')}</p><p><span className="advice-label">{t('Tradeoff', 'Đánh đổi')}</span>{t('Collecting or refreshing statistics costs work and needs suitable permissions; an index alone may not fix a bad estimate.', 'Thu thập hay làm mới thống kê tốn công và cần quyền phù hợp; thêm index chưa chắc sửa được ước tính.')}</p><p><span className="advice-label">{t('Verify', 'Kiểm chứng')}</span>{t('Compare several filter values and inspect data distributions and statistics in the learning database before choosing a change.', 'So sánh vài giá trị lọc và xem phân bố dữ liệu, thống kê trong database học trước khi chọn thay đổi.')}</p></details>
      </article>}
      {evidence.sortSpills.length > 0 && <article className="advice-card"><h4>{t('A sort used external temporary space', 'Sort đã dùng vùng lưu tạm')}</h4><p><span className="advice-label">{t('Observed', 'Quan sát')}</span>{evidence.sortSpills.map(node => `${node.type}${node.sortSpaceKb !== null ? `: ${formatNumber(node.sortSpaceKb)} kB` : ''}`).join(' · ')}. {t('The executed node reports Disk/external sort.', 'Node đã thực thi báo Disk/external sort.')}</p>
        <details><summary>{t('Possible changes and how to verify', 'Thay đổi có thể và cách kiểm chứng')}</summary><p><span className="advice-label">{t('Hypothesis', 'Giả thuyết')}</span>{t('Reducing rows before sorting or using an appropriate ordering index may help. Memory settings are another possibility, not an automatic prescription.', 'Giảm số dòng trước Sort hoặc index phù hợp ORDER BY có thể giúp. Cấu hình bộ nhớ là một khả năng khác, chưa phải chỉ định tự động.')}</p><p><span className="advice-label">{t('Tradeoff', 'Đánh đổi')}</span>{t('More memory per operation can raise total memory use under concurrency; indexes also cost storage and writes.', 'Tăng bộ nhớ mỗi thao tác có thể làm tổng RAM tăng khi chạy đồng thời; index còn tốn dung lượng và công ghi.')}</p><p><span className="advice-label">{t('Verify', 'Kiểm chứng')}</span>{t('Compare the full result, sort method, temporary blocks, and timings under the same workload before keeping a change.', 'So kết quả đầy đủ, cách Sort, block tạm và thời gian trên cùng workload trước khi giữ thay đổi.')}</p></details>
      </article>}
    </div>

    </details>}

    <details className="investigation-flow"><summary><Database size={15}/>{t('Inspect rows, loops and existing indexes', 'Xem số dòng, vòng lặp và index có sẵn')}</summary>
    <div className="investigation-summary">
      <div><span>{t('Executed scans', 'Cách đọc đã thực thi')}</span><strong>{evidence.executedScans.join(' · ') || '—'}</strong></div>
      <div><span>{t('Indexes actually executed', 'Index đã thực thi')}</span><strong>{evidence.usedIndexes.join(', ') || t('None observed', 'Chưa thấy index được dùng')}</strong></div>
      <div><span>{t('Root shared hit / read blocks', 'Shared hit / read tại node gốc')}</span><strong>{displayCount(buffers?.sharedHits ?? null)} / {displayCount(buffers?.sharedReads ?? null)}</strong></div>
      <div><span>{t('Root temp read / write blocks', 'Temp read / write tại node gốc')}</span><strong>{displayCount(buffers?.tempReads ?? null)} / {displayCount(buffers?.tempWritten ?? null)}</strong></div>
    </div>
    <p className="investigation-note">{mode === 'browser'
      ? t('Browser PostgreSQL: buffer blocks do not measure a server’s physical disk I/O. Root counters include children; we do not add them again.', 'PostgreSQL trong browser: số block không đo I/O ổ đĩa của server. Bộ đếm node gốc đã gồm node con; không cộng thêm lần nữa.')
      : t('Shared read blocks may be served by the operating-system cache. These are buffer counters, not a measurement of physical disk reads; child counters are not added.', 'Shared read có thể lấy từ cache của hệ điều hành. Đây là bộ đếm buffer, không phải phép đo đọc ổ đĩa vật lý; không cộng lại node con.')}</p>


      <p className="investigation-note">{t('Each node returns rows to its parent. Rows are per-loop averages; multiplying by loops is approximate. Nodes overlap, so these figures are never summed into a query total. Planner cost is not milliseconds.', 'Mỗi node trả dòng lên node cha. Số dòng là trung bình mỗi vòng; nhân với số vòng chỉ là xấp xỉ. Các node có phần công việc lồng nhau nên không cộng thành tổng query. Cost không phải mili giây.')}</p>
      {evidence.hasEarlyStop && <p className="investigation-note">{t('LIMIT or a semi/anti join can stop requesting rows early. A partially consumed child is not evidence of incorrect statistics.', 'LIMIT hoặc semi/anti join có thể dừng yêu cầu dòng sớm. Node con mới đọc một phần chưa phải bằng chứng thống kê sai.')}</p>}
      <ol>{evidence.nodes.slice(0, 24).map(node => <FlowNode key={node.id} node={node}/>)}</ol>
      {evidence.nodes.length > 24 && <p className="investigation-note">{t('First 24 nodes shown. The complete plan is available in the Plan tab.', 'Hiển thị 24 node đầu. Plan đầy đủ có trong tab Kế hoạch.')}</p>}
      <p className="investigation-note"><strong>{t('Catalog for observed tables:', 'Catalog của các bảng xuất hiện:')}</strong> {evidence.indexes.length ? evidence.indexes.map(index => `${index.name} (${index.table})${index.used ? t(' — executed', ' — đã dùng') : t(' — not observed executing', ' — chưa thấy dùng')}`).join('; ') : t('No indexes listed for these tables.', 'Không có index được liệt kê cho các bảng này.')}</p>
      <p className="investigation-note">{t('An index can exist without being chosen. A sequential scan can be appropriate for a small table or a query returning much of it. Recommendations need workload and correctness checks.', 'Index có thể tồn tại mà không được chọn. Seq Scan có thể hợp lý với bảng nhỏ hoặc query lấy phần lớn dữ liệu. Muốn khuyến nghị cần kiểm tra workload và tính đúng.')}</p>
    </details>
  </section>;
}

function FlowNode({ node }: { node: NodeEvidence }) {
  const { t, formatNumber } = useLocale();
  const show = (value: number | null) => value === null ? '—' : formatNumber(value);
  return <li className="investigation-node" style={{ marginInlineStart: Math.min(node.depth, 5) * 12 }}>
    <strong>{node.type}{node.relation && ` · ${node.relation}`}{node.indexName && ` · ${node.indexName}`}</strong>
    <div className="node-counters"><span>{t('Estimated rows/loop', 'Dòng ước tính/vòng')}: {show(node.estimatedRows)}</span><span>{t('Actual rows/loop', 'Dòng thực tế/vòng')}: {show(node.rowsPerLoop)}</span><span>{t('Loops', 'Số vòng')}: {show(node.loops)}</span>
      {node.executed === true && <span>{t('Returned across loops', 'Dòng trả qua các vòng')}: ≈{show(node.rowsAcrossLoopsApprox)}</span>}
      {node.executed === true && node.filteredAcrossLoopsApprox !== null && <span>{t('Removed by Filter', 'Loại bởi Filter')}: ≈{show(node.filteredAcrossLoopsApprox)}</span>}
      {node.executed === false && <span>{t('Not executed (0 loops)', 'Không thực thi (0 vòng)')}</span>}
      {node.executed === null && <span>{t('Actual counters unavailable', 'Chưa có bộ đếm thực tế')}</span>}
    </div>
  </li>;
}

function PartitionView({ evidence }: { evidence: PartitionEvidence }) {
  const { t } = useLocale();
  const reasonText = (reason: PartitionEvidence['months'][number]['reason']) => ({
    'positive-loops': t('Actual Loops > 0 in this plan', 'Actual Loops > 0 trong plan này'),
    'zero-loops': t('Present in the plan with 0 loops', 'Có trong plan nhưng 0 vòng'),
    absent: t('No node for this partition in this plan', 'Không có node của partition này trong plan'),
    'missing-counters': t('No actual loop counter', 'Chưa có bộ đếm số vòng thực tế'),
    'not-observed': t('No measured fixture partition scan observed', 'Chưa quan sát được scan thực tế trên partition của bài'),
  })[reason];
  return <div className="partition-investigation"><div className="partition-summary"><strong>{t('Which months did this query execute?', 'Query này đã đọc những tháng nào?')}</strong><span>{t('Current', 'Hiện tại')}: {evidence.executedCount ?? '—'} / {evidence.months.length} · {t('Baseline', 'Ban đầu')}: {evidence.baselineExecutedCount ?? '—'} / {evidence.months.length}</span></div>
    <div className="partition-grid">{evidence.months.map(month => <div key={month.table} className="partition-month" data-state={month.state} data-baseline={month.baselineExecuted ? 'true' : 'false'} title={`${month.table}: ${reasonText(month.reason)}${month.baselineExecuted ? t('; executed in baseline', '; có chạy trong baseline') : ''}`}><strong>{month.month}</strong><span>{month.state === 'executed' ? t('Executed', 'Đã chạy') : month.state === 'not-executed' ? t('Not executed', 'Không chạy') : t('Not measured', 'Chưa đo')}</span></div>)}</div>
    <details className="partition-reading"><summary>{t('How to read this chart', 'Cách đọc biểu đồ')}</summary><p className="partition-legend">{t('24 monthly partitions come from this lesson’s controlled 2024–2025 fixture. Execution status comes from actual plan nodes, not a size formula. An absent or zero-loop node alone does not establish why it was skipped.', '24 partition theo tháng lấy từ dataset kiểm soát 2024–2025 của bài này. Trạng thái thực thi lấy từ node trong plan thật, không tính bằng công thức quy mô. Node vắng mặt hoặc 0 vòng chưa tự xác định được vì sao nó bị bỏ qua.')}</p></details>
  </div>;
}
