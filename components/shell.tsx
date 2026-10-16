'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Award, BookOpen, Database, FlaskConical, Menu, SquareTerminal, X } from 'lucide-react';
import { useState } from 'react';
import { Brand } from './brand';
import { useLocale } from '@/lib/i18n';
import { useConnection } from '@/lib/connections';
import { LanguageSwitcher } from './language-switcher';
import { ThemeSwitcher } from './theme-switcher';

const nav = [
  ['/workspace', 'Workspace', 'Workspace', FlaskConical],
  ['/connections', 'Connect database', 'Kết nối database', Database],
  ['/paths', 'Learn SQL', 'Học SQL', BookOpen],
  ['/interview', 'Interview prep', 'Luyện phỏng vấn', Award],
  ['/playground', 'SQL sandbox', 'Sandbox SQL', SquareTerminal],
] as const;

export function Shell({ children, title, wide = false, focused = false }: { children: React.ReactNode; title: string; wide?: boolean; focused?: boolean }) {
  const path = usePathname(); const [open, setOpen] = useState(false); const { t } = useLocale();
  const { local } = useConnection();
  const currentNav = nav.find(([url]) => url === path);
  const displayTitle = currentNav ? t(currentNav[1], currentNav[2]) : title;
  return <div className={`app-shell ${wide ? 'wide' : ''} ${focused ? 'focused' : ''}`} onKeyDown={event => { if (event.key === 'Escape' && open) { setOpen(false); event.currentTarget.querySelector<HTMLButtonElement>('.mobile-menu')?.focus(); } }}>
    <button className="mobile-menu icon-button" aria-expanded={open} aria-controls="shell-navigation" aria-label={open ? t('Close navigation', 'Đóng menu') : t('Open navigation', 'Mở menu')} onClick={() => setOpen(!open)}>{open ? <X size={20}/> : <Menu size={20}/>}</button>
    {open && <button className="sidebar-overlay" aria-label={t('Close navigation', 'Đóng menu')} onClick={() => setOpen(false)}/>}
    <aside id="shell-navigation" className={`sidebar ${open ? 'is-open' : ''}`}><Brand/>
      <nav aria-label={t('Main navigation', 'Menu chính')}>{nav.map(([url, en, vi, Icon]) => <Link key={url} href={url} onClick={() => setOpen(false)} aria-current={path === url ? 'page' : undefined} className={`nav-link ${path === url ? 'active' : ''}`}><Icon size={18}/>{t(en, vi)}</Link>)}</nav>
      <Link href="/connections" className={`sidebar-connection ${local ? 'is-connected' : ''}`} onClick={() => setOpen(false)}><span className="status-dot"/>{local ? <span><strong>{local.info.database}</strong><small>{local.info.host}:{local.info.port}</small></span> : <span>{t('Not connected', 'Chưa kết nối')}</span>}</Link>
    </aside>
    <div className="main-wrap"><header className="app-header"><div className="breadcrumb"><strong>{displayTitle}</strong></div><div className="header-stats"><ThemeSwitcher/><LanguageSwitcher/></div></header>{children}</div>
  </div>;
}

export function MarketingNav() {
  const { t } = useLocale();
  return <header className="marketing-nav"><Brand/><nav aria-label={t('Website navigation', 'Menu website')}><Link href="/workspace">Workspace</Link><Link href="/paths">{t('Learn SQL', 'Học SQL')}</Link><Link href="/interview">{t('Interview', 'Phỏng vấn')}</Link><Link href="/connections">{t('Connect', 'Kết nối')}</Link></nav><div className="marketing-actions"><ThemeSwitcher/><LanguageSwitcher/><Link className="button small-button" href="/workspace">{t('Open workspace', 'Mở workspace')}</Link></div></header>;
}

export function MarketingFooter() {
  const { t } = useLocale();
  return (
    <footer className="landing-footer">
      <div className="landing-footer-grid">
        <div className="footer-brand-col">
          <Brand />
          <p className="footer-tagline">
            {t(
              'Hands-on SQL and PostgreSQL optimization directly in your browser or on your local machine.',
              'Môi trường học SQL và tối ưu hoá PostgreSQL thực chiến trực tiếp trên trình duyệt hoặc máy local của bạn.'
            )}
          </p>
          <div className="footer-privacy-note">
            <span className="tiny-square" />
            <span>{t('Local-first · Queries stay on your machine', 'Chạy local · Dữ liệu và query không rời máy bạn')}</span>
          </div>
        </div>
        <div className="footer-nav-col">
          <h4>{t('Product', 'Sản phẩm')}</h4>
          <Link href="/workspace">Workspace</Link>
          <Link href="/playground">{t('SQL sandbox', 'Sandbox SQL')}</Link>
          <Link href="/connections">{t('Connect database', 'Kết nối database')}</Link>
        </div>
        <div className="footer-nav-col">
          <h4>{t('Learning', 'Học SQL')}</h4>
          <Link href="/paths">{t('Learning paths', 'Lộ trình học')}</Link>
          <Link href="/challenge">{t('30-day challenge', 'Thử thách 30 ngày')}</Link>
          <Link href="/interview">{t('Interview practice', 'Luyện phỏng vấn')}</Link>
        </div>
        <div className="footer-nav-col">
          <h4>{t('About', 'Thông tin')}</h4>
          <Link href="/about">{t('How it works', 'Cách hoạt động')}</Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>
      <div className="landing-footer-bottom">
        <span>© 2026 QueryLab. {t('Learn data and PostgreSQL by doing.', 'Học dữ liệu và PostgreSQL qua thực hành.')}</span>
        <div className="footer-bottom-actions">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
