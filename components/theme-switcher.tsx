'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useLocale } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

const options = [
  { value: 'light', Icon: Sun, en: 'Light appearance', vi: 'Giao diện sáng' },
  { value: 'dark', Icon: Moon, en: 'Dark appearance', vi: 'Giao diện tối' },
  { value: 'system', Icon: Monitor, en: 'Use device appearance', vi: 'Theo giao diện thiết bị' },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { t } = useLocale();
  return <div className="theme-switcher" role="group" aria-label={t('Appearance', 'Giao diện')}>
    {options.map(({ value, Icon, en, vi }) => <button
      type="button"
      key={value}
      title={t(en, vi)}
      aria-label={t(en, vi)}
      aria-pressed={theme === value}
      onClick={() => setTheme(value)}
    ><Icon size={16} aria-hidden="true"/></button>)}
  </div>;
}
