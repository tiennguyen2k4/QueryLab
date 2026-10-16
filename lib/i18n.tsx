'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { labs } from '@/content/labs';
import { localizeLab } from './lab-localization';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, parseLocale, type Locale } from './locale';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (en: string, vi: string) => string;
  formatNumber: (value: number) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const pageTitles: Record<string, [string, string]> = {
  '/': ['Understand and optimize your PostgreSQL', 'Hiểu và tối ưu PostgreSQL của bạn'],
  '/workspace': ['Workspace', 'Workspace'],
  '/learn': ['Optimization workspace', 'Workspace tối ưu'],
  '/paths': ['Learn SQL', 'Học SQL'],
  '/playground': ['SQL sandbox', 'Sandbox SQL'],
  '/connections': ['Connect database', 'Kết nối database'],
  '/interview': ['Interview practice', 'Luyện phỏng vấn'],
  '/challenge': ['30-day challenge', 'Thử thách 30 ngày'],
  '/about': ['How your sandbox works', 'Cách QueryLab hoạt động'],
};

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Keep server render and first hydration identical. Browser preferences load after hydration.
  const [locale, updateLocale] = useState<Locale>(DEFAULT_LOCALE);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored === 'en' || stored === 'vi') {
        updateLocale(stored);
      }
    } catch { /* Use Vietnamese when storage is unavailable. */ }
    const sync = (event: StorageEvent) => {
      if (event.key === LOCALE_STORAGE_KEY || event.key === null) {
        updateLocale(parseLocale(event.newValue));
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    updateLocale(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
      document.cookie = `${LOCALE_STORAGE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    } catch { /* Switching still works for this page session. */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    const lab = labs.find(item => pathname === `/labs/${item.id}` || pathname === `/data/sql/${item.slug}`);
    const title = lab
      ? `${localizeLab(lab, locale).title}${pathname.startsWith('/data/sql/') ? (locale === 'vi' ? ' — Giải thích' : ' explained') : ''}`
      : pageTitles[pathname]?.[locale === 'vi' ? 1 : 0] || (locale === 'vi' ? 'Không tìm thấy trang' : 'Page not found');
    const localizedTitle = `${title} · QueryLab`;
    const syncTitle = () => { if (document.title !== localizedTitle) document.title = localizedTitle; };
    syncTitle();
    // Next may stream default-language metadata after client navigation finishes.
    const observer = new MutationObserver(syncTitle);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [locale, pathname]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: (en, vi) => locale === 'vi' ? vi : en,
    formatNumber: value => new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(value),
  }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used inside LocaleProvider.');
  return context;
}

/** Also usable from Server Components: both ReactNode variants are serializable props. */
export function T({ en, vi }: { en: ReactNode; vi: ReactNode }) {
  const { locale } = useLocale();
  return <>{locale === 'vi' ? vi : en}</>;
}
