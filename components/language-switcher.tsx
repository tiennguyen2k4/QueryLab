'use client';

import { Languages } from 'lucide-react';
import { useLocale } from '@/lib/i18n';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  return <div className="language-switcher" role="group" aria-label={t('Language', 'Ngôn ngữ')}>
    <Languages size={15} aria-hidden="true"/>
    <button type="button" lang="vi" aria-label="Tiếng Việt" title="Tiếng Việt" aria-pressed={locale === 'vi'} onClick={() => setLocale('vi')}>VI</button>
    <button type="button" lang="en" aria-label="English" title="English" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>EN</button>
  </div>;
}
