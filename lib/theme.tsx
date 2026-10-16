'use client';

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'datalab:theme';
const ThemeContext = createContext<{
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
} | null>(null);

function parseTheme(value: string | null): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;
}

function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = preference;
  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The layout's inline script sets the palette before paint. Keep hydration's
  // React output stable, then synchronize controls and CodeMirror before paint.
  const [theme, updateTheme] = useState<ThemePreference>('system');
  const [resolvedTheme, updateResolved] = useState<ResolvedTheme>('light');

  useLayoutEffect(() => {
    let preference = parseTheme(document.documentElement.dataset.themePreference ?? null);
    const sync = (next: ThemePreference) => {
      preference = next;
      updateTheme(next);
      updateResolved(applyTheme(next));
    };
    try { preference = parseTheme(localStorage.getItem(STORAGE_KEY)); } catch { /* Follow the device when storage is unavailable. */ }
    sync(preference);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onDeviceChange = () => {
      // Read the DOM preference, which also changes immediately on user input.
      preference = parseTheme(document.documentElement.dataset.themePreference ?? null);
      if (preference === 'system') sync(preference);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) sync(parseTheme(event.newValue));
    };
    media.addEventListener('change', onDeviceChange);
    window.addEventListener('storage', onStorage);
    return () => {
      media.removeEventListener('change', onDeviceChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    updateTheme(next);
    updateResolved(applyTheme(next));
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* The current page still changes theme. */ }
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider.');
  return context;
}
