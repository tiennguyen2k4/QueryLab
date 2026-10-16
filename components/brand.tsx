'use client';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n';
export function Brand() {
  const { t } = useLocale();
  return <Link href="/" className="brand" aria-label={t('QueryLab home', 'Trang chủ QueryLab')}><span className="brand-mark" aria-hidden="true"><i/><i/><i/><i/></span>QueryLab</Link>;
}
