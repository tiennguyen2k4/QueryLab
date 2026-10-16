'use client';
import { useEffect, useRef, useState } from 'react';
import { Database, LoaderCircle, RotateCcw, Zap } from 'lucide-react';
import { BrowserPostgresAdapter } from '@/lib/engine/client';
import type { QueryResult } from '@/lib/engine/types';
import { useLocale } from '@/lib/i18n';
import { localizeEngineMessage } from '@/lib/engine-localization';

export function LandingDemo() {
  const { locale, t, formatNumber } = useLocale();
  const [busy, setBusy] = useState(false);
  const [before, setBefore] = useState<QueryResult | null>(null);
  const [after, setAfter] = useState<QueryResult | null>(null);
  const [error, setError] = useState('');
  const adapter = useRef<BrowserPostgresAdapter | null>(null);
  useEffect(() => () => { adapter.current?.dispose(); }, []);

  async function experiment() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (!adapter.current) adapter.current = new BrowserPostgresAdapter();
      await adapter.current.initialize(50000);
      if (after) {
        await adapter.current.reset(50000);
        setBefore(null); setAfter(null);
        return;
      }
      const query = 'SELECT * FROM orders WHERE customer_id = 42';
      setBefore(await adapter.current.run(query));
      await adapter.current.run('CREATE INDEX idx_demo_customer ON orders(customer_id)', { baselineQuery: query });
      setAfter(await adapter.current.run(query));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Experiment failed. Try again.');
      adapter.current?.dispose(); adapter.current = null;
      setBefore(null); setAfter(null);
    } finally { setBusy(false); }
  }

  const timing = (result: QueryResult) => new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(result.metrics?.executionMs || 0);
  return <section className="hero-demo" aria-label={t('Interactive index experiment', 'Thí nghiệm tương tác về chỉ mục')}>
    <div className="demo-chrome"><span className="window-dots"><i /><i /><i /></span><span className="mono">your-first-index.sql</span><Database size={13} /></div>
    <div className="demo-content">
      <div className="eyebrow mint">{t('A REAL EXPERIMENT. RIGHT HERE.', 'THÍ NGHIỆM THỰC TẾ. NGAY TẠI ĐÂY.')}</div>
      <h3>{t('50,000 rows. Find one customer.', '50.000 dòng. Tìm một khách hàng.')}</h3>
      <p>{t('How much work does a little index save?', 'Một chỉ mục nhỏ giúp giảm bao nhiêu công việc?')}</p>
      <pre className="demo-code"><span className="sql-purple">SELECT</span> *<br /><span className="sql-purple">FROM</span> orders<br /><span className="sql-purple">WHERE</span> customer_id = <span className="sql-mint">42</span>;</pre>
      <div className="demo-metrics">
        <div className="demo-metric"><span>{t('BEFORE · HEAP VISITS ≈', 'TRƯỚC · LƯỢT ĐỌC DÒNG HEAP ≈')}</span><strong>{formatNumber(before?.metrics?.heapRowsVisitedApprox ?? 50000)}</strong><span>{before ? `${timing(before)} ms · ${t('measured', 'đã đo')}` : t('Full table scan · expected', 'Quét toàn bảng · dự kiến')}</span></div>
        <div className="demo-metric improved"><span>{t('AFTER · HEAP VISITS ≈', 'SAU · LƯỢT ĐỌC DÒNG HEAP ≈')}</span><strong>{after?.metrics ? formatNumber(after.metrics.heapRowsVisitedApprox) : '—'}</strong><span>{after ? `${timing(after)} ms · ${t('measured', 'đã đo')}` : t('Run to find out', 'Chạy để xem kết quả')}</span></div>
      </div>
      <button className="button" disabled={busy} onClick={experiment}>{busy ? <LoaderCircle className="loading-spinner" size={15} /> : after ? <RotateCcw size={15} /> : <Zap size={15} />} {busy ? t('Running real PostgreSQL…', 'Đang chạy PostgreSQL thực…') : after ? t('Reset experiment', 'Đặt lại thí nghiệm') : t('Run experiment + add index', 'Chạy thí nghiệm + tạo chỉ mục')}</button>
      <div className="demo-note" role="status">{error ? localizeEngineMessage(error, locale) : t('Runs on your device. Real execution, variable timings.', 'Chạy trên thiết bị của bạn. Thực thi thật, thời gian có thể thay đổi.')}</div>
    </div>
  </section>;
}
