'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowRight, BookOpen, Check, Database, FileCode2, LoaderCircle, Play, RefreshCw, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react';
import { useConnection, useWorkspaceField } from '@/lib/connections';
import { useLocale } from '@/lib/i18n';
import { partitionQuery, relation, type Experiment, type ExperimentPreview, type Measurement } from '@/lib/workspace';
import { walkPlan } from '@/lib/engine/metrics';
import { Shell } from './shell';
import { SqlEditor } from './sql-editor';
import { QueryInvestigation } from './query-investigation';

export function OptimizationWorkspace() {
  const { local, catalog, refreshCatalog } = useConnection();
  const { t, formatNumber } = useLocale();
  const [tableKey, setTableKey] = useWorkspaceField('tableKey');
  const table = catalog?.tables.find(item => relation(item.schema, item.name) === tableKey) ?? catalog?.tables[0];
  const [sql, setSql] = useWorkspaceField('sql');
  const [kind, setKind] = useWorkspaceField('kind');
  const [columns, setColumns] = useWorkspaceField('columns');
  const [name, setName] = useWorkspaceField('name');
  const [dateColumn, setDateColumn] = useWorkspaceField('dateColumn');
  const [startMonth, setStartMonth] = useWorkspaceField('startMonth');
  const [months, setMonths] = useWorkspaceField('months');
  const [baseline, setBaseline] = useWorkspaceField('baseline');
  const [after, setAfter] = useWorkspaceField('after');
  const [afterExperiment, setAfterExperiment] = useWorkspaceField('afterExperiment');
  const [preview, setPreview] = useState<ExperimentPreview | null>(null);
  const [approved, setApproved] = useState(false);
  const [applied, setApplied] = useWorkspaceField('applied');
  const [comparisonTarget, setComparisonTarget] = useWorkspaceField('comparisonTarget');
  const [busy, setBusy] = useWorkspaceField('busy');
  const [error, setError] = useWorkspaceField('error');
  const [notice, setNotice] = useWorkspaceField('notice');
  const [recovery, setRecovery] = useWorkspaceField('recovery');
  const running = useRef(false);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const completionSchema = useMemo(() => {
    const tables = catalog?.tables ?? [];
    return Object.fromEntries([...new Set(tables.map(item => item.schema))].map(schema => [
      schema, Object.fromEntries(tables.filter(item => item.schema === schema).map(item => [item.name, item.columns.map(column => column.name)])),
    ]));
  }, [catalog]);

  useEffect(() => {
    if (!local) return;
    let active = true;
    local.status().then(status => { if (active) setRecovery(status.recoveryRequired); })
      .catch(failure => { if (active) setError(failure instanceof Error ? failure.message : t('Connection status unavailable.', 'Không kiểm tra được trạng thái kết nối.')); });
    return () => { active = false; };
  }, [local, t]);
  useEffect(() => { if (preview) previewHeading.current?.focus(); }, [preview]);

  const invalidate = () => { setPreview(null); setApproved(false); };
  const changeQuery = (value: string) => { setSql(value); invalidate(); };
  const selectTable = (key: string) => {
    setTableKey(key); setColumns([]); setDateColumn(''); setSql(''); setBaseline(null); setAfter(null); setComparisonTarget(null); invalidate(); setNotice(''); setError('');
  };
  const run = async (label: string, action: () => Promise<void>) => {
    if (!local || running.current || busy) return;
    running.current = true; setBusy(label); setError(''); setNotice('');
    try { await action(); }
    catch (failure) {
      setError(failure instanceof Error ? failure.message : t('Database action failed.', 'Thao tác database thất bại.'));
      try { setRecovery((await local.status()).recoveryRequired); }
      catch (statusFailure) { setError(previous => `${previous} · ${statusFailure instanceof Error ? statusFailure.message : t('Connection status unavailable.', 'Không kiểm tra được trạng thái kết nối.')}`); }
    } finally { running.current = false; setBusy(''); }
  };
  const partition: Extract<Experiment, { kind: 'partition' }> | null = table ? {
    kind: 'partition', schema: table.schema, table: table.name, name, column: dateColumn || table.columns.find(column => column.date)?.name || '', startMonth, months,
  } : null;
  const validMonth = /^(?:19|20|21)\d{2}-(?:0[1-9]|1[0-2])$/.test(startMonth);
  const partitionReady = kind !== 'partition' || !!(validMonth && partition?.column && baseline && baseline.result.sql.trim() === partitionQuery(partition).slice(0,-1).trim());
  const measureBaseline = () => void run(t('Measuring…', 'Đang đo…'), async () => {
    if (!table || !sql.trim()) throw new Error(t('Select a table and enter a SELECT query.', 'Chọn bảng và nhập query SELECT.'));
    const measured = await local!.measureWorkspace(table.schema, sql);
    setBaseline(measured); setAfter(null); setComparisonTarget(null); invalidate();
    setNotice(t('Measured. Now try a change in step 2.', 'Đã đo. Giờ thử một thay đổi ở bước 2.'));
  });
  const requestPreview = (experiment?: Experiment) => void run(t('Preparing SQL preview…', 'Đang chuẩn bị SQL…'), async () => {
    if (!table) throw new Error(t('Select a table first.', 'Chọn bảng trước.'));
    const proposal = experiment ?? (kind === 'partition' ? partition! : { kind: 'index', schema: table.schema, table: table.name, name, columns });
    setPreview(await local!.previewExperiment(proposal)); setApproved(false);
  });
  const confirm = () => void run(t('Applying reviewed SQL…', 'Đang áp dụng SQL đã duyệt…'), async () => {
    if (!preview || !approved) throw new Error(t('Review and confirm the SQL first.', 'Xem và xác nhận SQL trước.'));
    const current = preview; invalidate();
    const result = await local!.applyExperiment(current.approvalId);
    setApplied(previous => result.cleanup ? [...previous, result] : previous.filter(item => item.cleanup?.schema !== result.experiment.schema || item.cleanup.name !== result.experiment.name));
    setAfter(null);
    setComparisonTarget(result.cleanup ? result : null);
    if (!result.cleanup) setBaseline(null);
    setNotice(result.cleanup ? t('Done. Press "Measure after" to compare.', 'Đã chạy xong. Bấm "Đo sau thay đổi" để so sánh.') : t('Deleted.', 'Đã xóa.'));
    await refreshCatalog();
  });
  const comparisonSql = comparisonTarget?.experiment.kind === 'partition' ? partitionQuery(comparisonTarget.experiment, true) : baseline?.result.sql ?? sql;
  const measureAfter = () => void run(t('Measuring after…', 'Đang đo sau thay đổi…'), async () => {
    if (!baseline) throw new Error(t('Capture a baseline first.', 'Đo baseline trước.'));
    const candidate = kind === 'rewrite' ? sql : comparisonSql;
    setAfter(await local!.measureWorkspace(baseline.schema, candidate));
    setAfterExperiment(kind === 'rewrite' ? null : comparisonTarget?.experiment ?? null);
    setNotice(t('Measured.', 'Đã đo xong.'));
  });

  const disabled = !!busy || recovery;
  return <Shell title={t('Workspace', 'Workspace')} wide><main className="optimization-page">
    <header className="workspace-heading"><div><h1>{t('Optimization workspace', 'Workspace tối ưu')}</h1><p>{t('Measure a query, try one change, see the difference.', 'Đo một query, thử một thay đổi, xem khác biệt.')}</p></div></header>
    <ol className="workspace-steps" aria-label={t('Steps', 'Các bước')}>{[
      [t('Connect', 'Kết nối'), !!local],
      [t('Measure', 'Đo query'), !!baseline],
      [t('Change', 'Thay đổi'), applied.length > 0 || !!after],
      [t('Compare', 'So sánh'), !!after],
    ].map(([label, done], index) => <li key={String(label)} data-done={done}><span>{done ? <Check size={14}/> : index + 1}</span>{label}</li>)}</ol>
    {!local ? <section className="workspace-welcome"><div className="welcome-orbit"><Database size={40}/></div><h2>{t('Connect a database to start', 'Kết nối database để bắt đầu')}</h2><p>{t('Use a PostgreSQL database running on your computer.', 'Dùng PostgreSQL đang chạy trên máy bạn.')}</p><div className="workspace-actions"><Link className="button" href="/connections"><Database size={16}/>{t('Connect database', 'Kết nối database')}<ArrowRight size={16}/></Link><Link className="button secondary" href="/paths"><BookOpen size={16}/>{t('Learn SQL first', 'Học SQL trước')}</Link></div></section> : <>
      <div className="workspace-db-strip"><span><Database size={17}/><strong>{local.info.database}</strong><small>{local.info.user}@{local.info.host}:{local.info.port}</small></span><button className="icon-button" aria-label={t('Refresh tables', 'Tải lại danh sách bảng')} title={t('Refresh tables', 'Tải lại danh sách bảng')} disabled={!!busy} onClick={() => void run(t('Refreshing…', 'Đang tải lại…'), refreshCatalog)}><RefreshCw size={17}/></button><Link href="/connections" className="text-link">{t('Change', 'Đổi kết nối')}</Link></div>
      {error && <div className="error-banner" role="alert">{error}</div>}
      <div role="status" aria-live="polite" className="workspace-status">{busy ? <><LoaderCircle size={16} className="loading-spinner"/>{busy}</> : notice}</div>
      {recovery && <section className="warning-box"><TriangleAlert size={20}/><div><strong>{t('Not sure whether the last change finished.', 'Chưa rõ thay đổi vừa rồi đã chạy xong chưa.')}</strong><p>{t('Check your database, then continue. Nothing will be re-run.', 'Kiểm tra database rồi tiếp tục. Không có gì bị chạy lại.')}</p><button className="button secondary small-button" disabled={!!busy} onClick={() => void run(t('Checking…', 'Đang kiểm tra…'), async () => { await local.reconcileWorkspace(); await refreshCatalog(); setRecovery(false); invalidate(); setAfter(null); setBaseline(null); })}>{t('Checked, continue', 'Đã kiểm tra, tiếp tục')}</button></div></section>}
      {!table ? <div className="workspace-empty"><Database size={28}/><h2>{t('No tables found', 'Không thấy bảng nào')}</h2><p>{t('This role cannot read any table yet.', 'Role này chưa có quyền đọc bảng nào.')}</p><Link className="text-link" href="/paths#permissions">{t('How to grant access', 'Cách cấp quyền')}</Link></div> : <div className="workspace-layout">
        <aside className="schema-panel"><label htmlFor="workspace-table" className="panel-label">{t('Table', 'Bảng')}</label><select id="workspace-table" value={relation(table.schema, table.name)} disabled={!!busy} onChange={event => selectTable(event.target.value)}>{catalog?.tables.map(item => <option key={relation(item.schema, item.name)} value={relation(item.schema, item.name)}>{item.schema}.{item.name}</option>)}</select><p className="schema-summary">≈ {formatNumber(table.estimatedRows)} {t('rows', 'dòng')} · {formatNumber(Math.round(table.bytes / 1024 / 102.4) / 10)} MB</p><ul className="schema-columns">{table.columns.map(column => <li key={column.name}><span className="mono">{column.name}</span><small>{column.type}</small></li>)}</ul></aside>
        <div className="workspace-main">
          <section className="workspace-panel"><div className="panel-heading"><h2><span className="step-number">1</span>{t('Measure your query', 'Đo query hiện tại')}</h2><button className="button secondary small-button" disabled={disabled} onClick={() => changeQuery(`SELECT * FROM ${relation(table.schema, table.name)} LIMIT 100;`)}>{t('Sample query', 'Query mẫu')}</button></div>
            <div className="workspace-editor"><SqlEditor value={sql} onChange={changeQuery} onRun={measureBaseline} disabled={disabled} schema={completionSchema} defaultSchema={table.schema}/></div>
            <div className="workspace-actions"><button className="button" disabled={!sql.trim() || disabled} onClick={measureBaseline}><Play size={15}/>{baseline ? t('Measure again', 'Đo lại') : t('Measure', 'Đo')}</button><span className="hint">{t('SELECT only · runs for real · max 4.5 s', 'Chỉ SELECT · chạy thật · tối đa 4,5 giây')}</span></div>
          </section>
          <section className="workspace-panel"><div className="panel-heading"><h2><span className="step-number">2</span>{t('Try one change', 'Thử một thay đổi')}</h2></div>
            <div className="experiment-tabs" role="group" aria-label={t('Change type', 'Loại thay đổi')}>{([
              ['index', t('Add index', 'Thêm index')], ['partition', t('Monthly partition', 'Partition theo tháng')], ['rewrite', t('Rewrite query', 'Viết lại query')],
            ] as const).map(([value, label]) => <button key={value} aria-pressed={kind === value} disabled={disabled} onClick={() => { setKind(value); setName(value === 'partition' ? 'datalab_trial_partition' : 'datalab_trial_index'); invalidate(); }}>{label}</button>)}</div>
            {kind === 'rewrite' ? <p className="panel-text">{t('Edit the query in step 1, then press "Measure after" in step 3. Make sure it still returns the same data.', 'Sửa query ở bước 1, rồi bấm "Đo sau thay đổi" ở bước 3. Nhớ kiểm tra kết quả vẫn đúng.')}</p> : <>
              {kind === 'index' && <><p className="panel-text">{t('Pick columns in order (up to 4):', 'Chọn cột theo thứ tự (tối đa 4):')}</p><div className="column-picker">{table.columns.map(column => <button key={column.name} disabled={disabled || !columns.includes(column.name) && columns.length >= 4} aria-pressed={columns.includes(column.name)} onClick={() => { setColumns(previous => previous.includes(column.name) ? previous.filter(item => item !== column.name) : [...previous, column.name]); invalidate(); }}>{columns.includes(column.name) && <span>{columns.indexOf(column.name) + 1}</span>}{column.name}</button>)}</div></>}
              <div className="experiment-form"><label htmlFor="experiment-name">{kind === 'index' ? t('Index name', 'Tên index') : t('Copy name', 'Tên bản sao')}<input id="experiment-name" value={name} maxLength={42} disabled={disabled} onChange={event => { setName(event.target.value); invalidate(); }}/></label>
                {kind === 'partition' && <><label htmlFor="partition-column">{t('Date column', 'Cột ngày')}<select id="partition-column" value={partition?.column || ''} disabled={disabled} onChange={event => { setDateColumn(event.target.value); invalidate(); }}>{!table.columns.some(column => column.date) && <option value="">{t('No date column', 'Không có cột ngày')}</option>}{table.columns.filter(column => column.date).map(column => <option key={column.name}>{column.name}</option>)}</select></label><label htmlFor="partition-start">{t('First month', 'Tháng đầu')}<input id="partition-start" type="month" min="1900-01" max="2199-12" value={startMonth} disabled={disabled} onChange={event => { setStartMonth(event.target.value); invalidate(); }}/></label><label htmlFor="partition-count">{t('Months', 'Số tháng')}<input id="partition-count" type="number" min={1} max={24} value={months} disabled={disabled} onChange={event => { setMonths(Number(event.target.value)); invalidate(); }}/></label></>}
              </div>
              {kind === 'partition' && <button className="button secondary small-button" disabled={disabled || !partition?.column || !validMonth} onClick={() => { if (partition) { changeQuery(partitionQuery(partition)); setBaseline(null); setAfter(null); } }}>{t('Use a one-month query in step 1', 'Điền query 1 tháng vào bước 1')}</button>}
              <p className="experiment-warning">{kind === 'index' ? t('Building an index briefly blocks writes to the table and uses extra space.', 'Tạo index sẽ tạm chặn ghi vào bảng và tốn thêm dung lượng.') : t('Creates a separate copy. Your original table is not changed.', 'Tạo một bản sao riêng. Bảng gốc không bị thay đổi.')}</p>
              <div className="workspace-actions"><button className="button" disabled={disabled || !baseline || !partitionReady || kind === 'index' && !columns.length || kind === 'partition' && table.partitioned} onClick={() => requestPreview()}><FileCode2 size={16}/>{t('Show SQL', 'Xem SQL sẽ chạy')}</button><Link className="text-link" href={`/paths#${kind}`}>{kind === 'index' ? t('What is an index?', 'Index là gì?') : t('What is partitioning?', 'Partition là gì?')}</Link></div>
              {!baseline ? <p className="hint">{t('Measure a query in step 1 first.', 'Hãy đo query ở bước 1 trước.')}</p> : kind === 'partition' && !partitionReady && <p className="hint">{t('Measure the one-month query first.', 'Hãy đo query 1 tháng trước.')}</p>}
            </>}
          </section>
          {preview && <section className="workspace-panel sql-approval"><h2 ref={previewHeading} tabIndex={-1}><ShieldCheck size={21}/>{t('Check the SQL before running', 'Kiểm tra SQL trước khi chạy')}</h2><pre><code>{preview.sql}</code></pre><label className="approval-check"><input type="checkbox" checked={approved} disabled={!!busy} onChange={event => setApproved(event.target.checked)}/><span>{preview.experiment.kind === 'remove' ? t('I want to delete this test object.', 'Tôi muốn xóa đối tượng thử nghiệm này.') : t('I have read this SQL and want to run it.', 'Tôi đã đọc SQL này và muốn chạy.')}</span></label><div className="workspace-actions"><button className="button" disabled={!approved || disabled} onClick={confirm}>{t('Run', 'Chạy')}</button><button className="button secondary" disabled={!!busy} onClick={invalidate}>{t('Cancel', 'Hủy')}</button></div></section>}
          <section className="workspace-panel"><div className="panel-heading"><h2><span className="step-number">3</span>{t('Compare', 'So sánh')}</h2><button className="button" disabled={!baseline || disabled || kind !== 'rewrite' && !comparisonTarget} onClick={measureAfter}><Activity size={16}/>{t('Measure after', 'Đo sau thay đổi')}</button></div>
            {baseline && after ? <MeasurementComparison before={baseline} after={after} partition={afterExperiment?.kind === 'partition' ? afterExperiment : undefined}/> : <div className="comparison-placeholder"><Activity size={24}/><p>{t('Before/after charts appear here.', 'Biểu đồ trước/sau sẽ hiện ở đây.')}</p></div>}
            {baseline && <details className="measurement-sql"><summary>{t('Queries compared', 'Hai query được so sánh')}</summary><strong>{t('Before', 'Trước')}</strong><pre>{baseline.result.sql}</pre><strong>{t('After', 'Sau')}</strong><pre>{after?.result.sql ?? (kind === 'rewrite' ? sql : comparisonSql)}</pre></details>}
            {(after || baseline) && <details className="measurement-sql"><summary>{t('Plan details', 'Chi tiết plan')}</summary><QueryInvestigation result={(after || baseline)!.result} baseline={after ? baseline!.result : null} mode="native"/></details>}
          </section>
          {applied.length > 0 && <section className="workspace-panel"><h2>{t('Objects you created', 'Đối tượng bạn đã tạo')}</h2>{applied.map((item, index) => <div className="experiment-history" key={`${item.experiment.name}-${index}`}><div><strong>{item.experiment.schema}.{item.experiment.name}</strong><details><summary>SQL</summary><pre>{item.sql}</pre></details></div><button className="button secondary small-button" disabled={disabled} onClick={() => { if (item.cleanup) requestPreview(item.cleanup); }}><Trash2 size={14}/>{t('Delete', 'Xóa')}</button></div>)}</section>}
        </div>
      </div>}
    </>}
  </main></Shell>;
}

function MeasurementComparison({ before, after, partition }: { before: Measurement; after: Measurement; partition?: Extract<Experiment, { kind: 'partition' }> }) {
  const { t, formatNumber } = useLocale();
  const first = before.result.metrics!; const second = after.result.metrics!;
  const delta = first.executionMs > 0 ? (second.executionMs - first.executionMs) / first.executionMs * 100 : null;
  const rows = [
    { label: t('Execution time', 'Thời gian chạy'), before: first.executionMs, after: second.executionMs, unit: 'ms' },
    { label: t('Rows read (≈)', 'Số dòng phải đọc (≈)'), before: first.heapRowsVisitedApprox, after: second.heapRowsVisitedApprox, unit: '' },
    { label: t('Blocks read outside cache', 'Khối dữ liệu đọc ngoài cache'), before: Number(before.result.plan!.Plan['Shared Read Blocks'] ?? 0), after: Number(after.result.plan!.Plan['Shared Read Blocks'] ?? 0), unit: '' },
  ];
  const scans = (measurement: Measurement) => walkPlan(measurement.result.plan!.Plan).filter(node => Number(node['Actual Loops']) > 0 && node['Relation Name']).map(node => String(node['Relation Name']));
  const beforeScans = [...new Set(scans(before))]; const afterScans = [...new Set(scans(after))];
  const parts = partition ? Array.from({ length: partition.months + 1 }, (_, index) => index === partition.months ? `${partition.name}_other` : `${partition.name}_p${index + 1}`) : [];
  const readParts = parts.filter(name => afterScans.includes(name)).length;
  const explanation = partition
    ? t(`Read ${readParts} of ${parts.length} parts — PostgreSQL skipped the months your date filter excludes (partition pruning).`, `Chỉ đọc ${readParts}/${parts.length} phần — PostgreSQL bỏ qua các tháng không khớp điều kiện ngày (partition pruning).`)
    : second.indexNames.length > 0
      ? t(`PostgreSQL used ${second.indexNames.join(', ')} to jump to the matching rows instead of reading the whole table.`, `PostgreSQL dùng ${second.indexNames.join(', ')} để nhảy thẳng tới dòng cần tìm thay vì đọc cả bảng.`)
      : second.scanTypes.includes('Seq Scan')
        ? t('PostgreSQL still reads the whole table (Seq Scan). For a small table or a filter matching many rows, this can be the right choice.', 'PostgreSQL vẫn đọc cả bảng (Seq Scan). Với bảng nhỏ hoặc điều kiện khớp nhiều dòng, đây có thể là lựa chọn hợp lý.')
        : t('Open "Plan details" to see which step costs the most.', 'Mở "Chi tiết plan" để xem bước nào tốn công nhất.');
  return <div className="measurement-comparison">
    <div className="comparison-headline"><strong>{delta === null ? t('Too fast to compare as a percentage', 'Quá nhanh để tính phần trăm') : delta < 0 ? t(`${formatNumber(Math.round(-delta))}% faster`, `Nhanh hơn ${formatNumber(Math.round(-delta))}%`) : t(`${formatNumber(Math.round(delta))}% slower`, `Chậm hơn ${formatNumber(Math.round(delta))}%`)}</strong><p>{explanation}</p></div>
    <div className="chart-legend"><span className="before-dot"/>{t('Before', 'Trước')}<span className="after-dot"/>{t('After', 'Sau')}</div>
    {rows.map(row => <div className="measurement-chart" key={row.label}><h3>{row.label}</h3>{(['before', 'after'] as const).map(key => <div className="measurement-bar-row" key={key}><span>{key === 'before' ? t('Before', 'Trước') : t('After', 'Sau')}</span><div className={`measurement-track ${key}`}><span style={{ width: `${row[key] / Math.max(row.before, row.after, 0.001) * 100}%` }}/></div><strong>{formatNumber(row[key])} {row.unit}</strong></div>)}</div>)}
    <div className="plan-change"><div><span>{t('Before', 'Trước')}</span><strong>{first.scanTypes.join(' · ') || '—'}</strong><small>{beforeScans.join(', ') || '—'}</small></div><ArrowRight size={18}/><div><span>{t('After', 'Sau')}</span><strong>{second.scanTypes.join(' · ') || '—'}</strong><small>{afterScans.join(', ') || '—'}</small></div></div>
    {partition && <div className="partition-grid" aria-label={t('Partitions read', 'Các phần đã đọc')}>{parts.map((name, index) => {
      const read = afterScans.includes(name);
      return <div className="partition-month" key={name} data-state={read ? 'executed' : 'unknown'}><strong>{index === partition.months ? t('Other', 'Khác') : `T${index + 1}`}</strong><span>{read ? t('read', 'đã đọc') : t('skipped', 'bỏ qua')}</span></div>;
    })}</div>}
    <p className="comparison-caveat">{t('One measurement each. Repeat a few times before deciding.', 'Mỗi bên đo một lần. Hãy đo lại vài lần trước khi kết luận.')}</p>
  </div>;
}
