export type Locale = 'vi' | 'en';

export const DEFAULT_LOCALE: Locale = 'vi';
export const LOCALE_STORAGE_KEY = 'querylab.locale.v2';

export function parseLocale(value: string | null): Locale {
  return value === 'en' || value === 'vi' ? value : DEFAULT_LOCALE;
}
