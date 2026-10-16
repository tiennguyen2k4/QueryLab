import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import './learning.css';
import './workspace.css';
import { PageEvents } from '@/components/page-events';
import { LocaleProvider } from '@/lib/i18n';
import { ConnectionProvider } from '@/lib/connections';
import { ThemeProvider } from '@/lib/theme';

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-be-vietnam-pro',
});

export const metadata: Metadata = {
  title: { default: 'QueryLab — Hiểu và tối ưu PostgreSQL của bạn', template: '%s · QueryLab' },
  description: 'Kết nối PostgreSQL local, thử index và partition có xác nhận, so sánh plan trước–sau bằng số liệu thật. Học cú pháp SQL từ cơ bản đến nâng cao.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" data-theme="light" suppressHydrationWarning className={beVietnamPro.variable}><head>
    <script dangerouslySetInnerHTML={{ __html: `(function(){var p='system';try{var s=localStorage.getItem('datalab:theme');if(s==='light'||s==='dark')p=s}catch(e){}var d=p==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;document.documentElement.dataset.theme=d;document.documentElement.dataset.themePreference=p;try{var loc=localStorage.getItem('querylab.locale.v2');if(!loc){localStorage.removeItem('datalab.locale.v1');localStorage.setItem('querylab.locale.v2','vi');}}catch(e){}})()` }}/>
  </head><body className={beVietnamPro.className}><ThemeProvider><LocaleProvider><ConnectionProvider><PageEvents/>{children}</ConnectionProvider></LocaleProvider></ThemeProvider></body></html>;
}
