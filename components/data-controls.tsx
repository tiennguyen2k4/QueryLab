'use client';

import { useState } from 'react';
import { useLocale } from '@/lib/i18n';
import { clearProgress, readProgress } from '@/lib/progress';

export function DataControls() {
  const { t } = useLocale();
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState<'exported' | 'cleared' | null>(null);
  function exportData() {
    const blob = new Blob([JSON.stringify(readProgress(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'datalab-progress.json';
    link.click();
    URL.revokeObjectURL(url);
    setNotice('exported');
  }
  return <><div className="settings-actions"><button className="button secondary" onClick={exportData}>{t('Export my progress', 'Xuất tiến độ học')}</button><button className="danger-button" onClick={() => setConfirm(true)}>{t('Clear local learning data', 'Xóa dữ liệu học trên máy')}</button></div>{notice && <p role="status">{notice === 'exported' ? t('Your progress was exported.', 'Đã xuất tiến độ học của bạn.') : t('Your local learning data was cleared.', 'Đã xóa dữ liệu học trên máy của bạn.')}</p>}{confirm && <div className="confirm-data"><p>{t('Clear completed labs, XP, bookmarks, and local activity? This cannot be undone.', 'Xóa các bài đã hoàn thành, XP, bài đã lưu và lịch sử hoạt động trên máy? Thao tác này không thể hoàn tác.')}</p><div className="settings-actions"><button className="button secondary" onClick={() => setConfirm(false)}>{t('Keep my data', 'Giữ dữ liệu')}</button><button className="danger-button" onClick={() => {
    clearProgress();
    try { localStorage.removeItem('datalab.events.v1'); } catch {}
    setConfirm(false);
    setNotice('cleared');
  }}>{t('Clear data', 'Xóa dữ liệu')}</button></div></div>}</>;
}
