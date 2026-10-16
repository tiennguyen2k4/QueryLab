'use client';
import { ChevronDown, Database, Laptop } from 'lucide-react';
import { useConnection } from '@/lib/connections';
import { useLocale } from '@/lib/i18n';

export function DatabaseMode({ disabled = false }: { disabled?: boolean }) {
  const { mode, native, nativeSize, selectMode } = useConnection();
  const { t, formatNumber } = useLocale();
  return <details className="database-mode mode-compact" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false; }} onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); } }}>
    <summary aria-label={t('Choose where SQL runs', 'Chọn nơi chạy SQL')}><Database size={14}/><span>{mode === 'native' ? t('My PostgreSQL', 'PostgreSQL riêng') : t('Browser PostgreSQL', 'PostgreSQL trình duyệt')}</span><ChevronDown size={13}/></summary>
    <div className="mode-popover">
    <div className="mode-options">
      <button type="button" aria-pressed={mode === 'browser'} disabled={disabled} onClick={event => { selectMode('browser'); event.currentTarget.closest('details')?.removeAttribute('open'); }}><Laptop size={17}/><span><strong>{t('Learn in your browser', 'Học ngay trong browser')}</strong><small>{t('No installation · private RAM dataset', 'Không cần cài đặt · dữ liệu riêng trong RAM')}</small></span></button>
      {native ? <button type="button" aria-pressed={mode === 'native'} disabled={disabled} onClick={event => { selectMode('native'); event.currentTarget.closest('details')?.removeAttribute('open'); }}><Database size={17}/><span><strong>{t('My PostgreSQL', 'PostgreSQL của tôi')}</strong><small>{formatNumber(nativeSize)} {t('real orders · local connector', 'đơn thật · qua connector')}</small></span></button> : null}
    </div>
    {mode === 'native' && <p className="mode-note">{t('SQL runs in the connector’s dedicated lab schema. Query plans and limited result previews travel through this web app.', 'SQL chạy trong schema lab riêng của connector. Plan và phần kết quả giới hạn đi qua web này.')}</p>}
    </div>
  </details>;
}
