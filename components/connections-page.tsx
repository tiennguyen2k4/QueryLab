'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Eye, EyeOff, HardDrive, KeyRound, Link2, LoaderCircle, PlugZap, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useConnection } from '@/lib/connections';
import { useLocale } from '@/lib/i18n';
import { Shell } from './shell';

const LOCAL = ['localhost', '127.0.0.1', '[::1]'];

export function ConnectionsPage() {
  const { local, catalog, connecting, error, errorCode, connectDatabase, disconnect } = useConnection();
  const { t } = useLocale();
  const [form, setForm] = useState({ host: 'localhost', port: '5432', database: '', user: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isLocal, setIsLocal] = useState(true);
  useEffect(() => { setIsLocal(LOCAL.includes(window.location.hostname)); }, []);

  const field = (key: keyof typeof form) => ({ value: form[key], onChange: (event: React.ChangeEvent<HTMLInputElement>) => setForm(previous => ({ ...previous, [key]: event.target.value })) });
  const applyUrl = () => {
    try {
      const parsed = new URL(url.trim());
      if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) throw new Error();
      setForm({ host: parsed.hostname.replace(/^\[(.*)\]$/, '$1') || 'localhost', port: parsed.port || '5432', database: decodeURIComponent(parsed.pathname.slice(1)), user: decodeURIComponent(parsed.username), password: decodeURIComponent(parsed.password) });
      setUrl(''); setUrlMode(false); setUrlError('');
    } catch { setUrlError(t('Not a valid postgresql:// URL.', 'URL không hợp lệ (cần dạng postgresql://...).')); }
  };
  const messages: Record<string, string> = {
    auth: t('Wrong user or password.', 'Sai user hoặc mật khẩu.'),
    refused: t('Cannot reach PostgreSQL. Is it running? Check host and port.', 'Không kết nối được. PostgreSQL đã chạy chưa? Kiểm tra host và port.'),
    'database-missing': t('That database does not exist.', 'Database này không tồn tại.'),
    host: t('Only localhost, 127.0.0.1 or ::1 are allowed.', 'Chỉ cho phép localhost, 127.0.0.1 hoặc ::1.'),
    'local-only': t('Open QueryLab at http://localhost:3000 to connect.', 'Hãy mở QueryLab bằng http://localhost:3000 để kết nối.'),
    limit: t('Too many attempts. Wait a minute.', 'Thử quá nhiều lần. Chờ 1 phút.'),
    network: t('QueryLab server is not responding.', 'Server QueryLab không phản hồi.'),
  };

  return <Shell title={t('Connect database', 'Kết nối database')}><main className="connections-page">
    <h1>{t('Connect your PostgreSQL', 'Kết nối PostgreSQL của bạn')}</h1>
    <p className="connections-lead">{t('Enter the details of a database on this computer.', 'Điền thông tin database đang chạy trên máy bạn.')}</p>
    <div className="connect-layout">
      <section className="connect-card">
        {local ? <>
          <h2><CheckCircle2 size={22} className="mint"/>{t('Connected', 'Đã kết nối')}</h2>
          <dl className="connection-facts">
            <div><dt>Database</dt><dd>{local.info.database}</dd></div>
            <div><dt>User</dt><dd>{local.info.user}</dd></div>
            <div><dt>Host</dt><dd>{local.info.host}:{local.info.port}</dd></div>
            <div><dt>{t('Tables', 'Số bảng')}</dt><dd>{catalog?.tables.length ?? 0}</dd></div>
          </dl>
          {local.info.elevated && <div className="warning-box" role="note"><TriangleAlert size={18}/><div><strong>{t('This is an admin (superuser) role.', 'Đây là role quản trị (superuser).')}</strong><p>{t('It works, but a dedicated read-only role is safer.', 'Vẫn dùng được, nhưng nên tạo role riêng chỉ đọc.')} <Link href="/paths#permissions">{t('How?', 'Cách tạo')}</Link></p></div></div>}
          <div className="connect-actions"><Link className="button" href="/workspace">{t('Open workspace', 'Mở Workspace')}<ArrowRight size={16}/></Link><button className="button secondary" onClick={disconnect}>{t('Disconnect', 'Ngắt kết nối')}</button></div>
        </> : <form onSubmit={async event => { event.preventDefault(); if (await connectDatabase({ ...form, port: Number(form.port) })) setForm(previous => ({ ...previous, password: '' })); }}>
          <h2><PlugZap size={21}/>{t('Connection details', 'Thông tin kết nối')}</h2>
          {!isLocal && <div className="warning-box" role="alert"><TriangleAlert size={18}/><p>{t('This page is not running on your computer, so it cannot reach your database. Run QueryLab locally and open http://localhost:3000.', 'Trang này không chạy trên máy bạn nên không thể kết nối DB local. Hãy chạy QueryLab trên máy và mở http://localhost:3000.')}</p></div>}
          <div className="form-grid">
            <label className="span-2">Host<input {...field('host')} autoComplete="off" spellCheck={false} required disabled={connecting}/></label>
            <label>Port<input {...field('port')} inputMode="numeric" pattern="[0-9]{1,5}" required disabled={connecting}/></label>
            <label className="span-3">Database<input {...field('database')} placeholder="my_app_dev" autoComplete="off" spellCheck={false} required disabled={connecting}/></label>
            <label className="span-3">User<input {...field('user')} placeholder="postgres" autoComplete="username" spellCheck={false} required disabled={connecting}/></label>
            <label className="span-3">{t('Password', 'Mật khẩu')}<span className="password-field"><input {...field('password')} aria-label={t('Password', 'Mật khẩu')} type={showPassword ? 'text' : 'password'} autoComplete="current-password" disabled={connecting}/><button type="button" className="icon-button" aria-label={showPassword ? t('Hide password', 'Ẩn mật khẩu') : t('Show password', 'Hiện mật khẩu')} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span></label>
          </div>
          <button type="button" className="text-link url-toggle" onClick={() => setUrlMode(!urlMode)}><Link2 size={14}/>{t('Paste a connection URL instead', 'Dán connection URL')}</button>
          {urlMode && <div className="url-paste"><input aria-label={t('Connection URL', 'Connection URL')} value={url} onChange={event => setUrl(event.target.value)} placeholder="postgresql://user:password@localhost:5432/mydb" spellCheck={false} autoComplete="off"/><button type="button" className="button secondary small-button" onClick={applyUrl}>{t('Fill form', 'Điền vào form')}</button>{urlError && <p role="alert" className="field-error">{urlError}</p>}</div>}
          {error && <div className="error-banner" role="alert">{messages[errorCode] ?? error}</div>}
          <button className="button connect-submit" type="submit" disabled={connecting || !isLocal}>{connecting ? <LoaderCircle size={16} className="loading-spinner"/> : <PlugZap size={16}/>}{connecting ? t('Connecting…', 'Đang kết nối…') : t('Connect', 'Kết nối')}</button>
        </form>}
      </section>
      <aside className="security-card" aria-labelledby="security-heading">
        <h2 id="security-heading"><ShieldCheck size={21}/>{t('Is it safe?', 'Có an toàn không?')}</h2>
        <ul>
          <li><HardDrive size={19}/><div><strong>{t('Stays on your computer', 'Không rời khỏi máy bạn')}</strong><p>{t('QueryLab and PostgreSQL both run on localhost. Nothing is sent to the internet.', 'QueryLab và PostgreSQL cùng chạy trên localhost. Không gửi gì ra Internet.')}</p></div></li>
          <li><KeyRound size={19}/><div><strong>{t('Password is not saved', 'Không lưu mật khẩu')}</strong><p>{t('Kept in memory only while connected. Never stored in the browser or on disk.', 'Chỉ giữ trong RAM khi đang kết nối. Không lưu vào trình duyệt hay ổ đĩa.')}</p></div></li>
          <li><ShieldCheck size={19}/><div><strong>{t('No silent changes', 'Không tự sửa dữ liệu')}</strong><p>{t('Read-only by default. Every change shows its SQL and needs your confirmation.', 'Mặc định chỉ đọc. Mọi thay đổi đều hiện SQL và cần bạn xác nhận.')}</p></div></li>
        </ul>
        <details className="security-details"><summary>{t('Technical details', 'Chi tiết kỹ thuật')}</summary><ul>
          <li>{t('Only requests from this page on localhost are accepted; other websites and other machines on your network are rejected.', 'Chỉ nhận request từ chính trang này qua localhost; website khác và máy khác trong mạng LAN bị từ chối.')}</li>
          <li>{t('Only databases on localhost / 127.0.0.1 / ::1 can be connected.', 'Chỉ kết nối được DB ở localhost / 127.0.0.1 / ::1.')}</li>
          <li>{t('The browser holds a random session token; the connection closes after 30 idle minutes, on disconnect, or when the page is closed.', 'Trình duyệt chỉ giữ token phiên ngẫu nhiên; kết nối tự đóng sau 30 phút không dùng, khi ngắt kết nối hoặc đóng trang.')}</li>
          <li>{t('Use a development database, never production.', 'Dùng DB phát triển, không dùng DB production.')}</li>
        </ul></details>
      </aside>
    </div>
  </main></Shell>;
}
