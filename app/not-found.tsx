import Link from 'next/link';
import { Brand } from '@/components/brand';
import { LanguageSwitcher } from '@/components/language-switcher';
import { T } from '@/lib/i18n';

export default function NotFound() {
  return <main className="not-found"><Brand/><LanguageSwitcher/><div className="eyebrow"><T en="404 · NO ROWS FOUND" vi="404 · KHÔNG TÌM THẤY DÒNG NÀO"/></div><h1><T en="This page isn’t in the dataset." vi="Trang này không có trong bộ dữ liệu."/></h1><p><T en="There are plenty of good experiments waiting in your workspace." vi="Nhiều thử nghiệm thú vị đang chờ bạn trong khu thực hành."/></p><Link className="button" href="/learn"><T en="Back to your labs" vi="Quay lại các bài học"/></Link></main>;
}
