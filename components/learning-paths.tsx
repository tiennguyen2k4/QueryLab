'use client';

import Link from 'next/link';
import { BookOpen, Check, Layers3, Activity, Database } from 'lucide-react';
import { localizedCategories, localizedLabs } from '@/lib/lab-localization';
import { useLocale } from '@/lib/i18n';
import { useProgress } from '@/lib/progress';
import { Shell } from './shell';

const icons = [BookOpen, Layers3, Activity, Database];
export function LearningPaths() {
  const { locale, t } = useLocale();
  const progress = useProgress();
  const labs = localizedLabs(locale);
  return <Shell title={t('Learning paths', 'Lộ trình học')}><main className="simple-page"><div className="eyebrow mint">{t('FROM YOUR FIRST QUERY TO YOUR FIRST FIX', 'TỪ TRUY VẤN ĐẦU TIÊN ĐẾN LẦN TỐI ƯU ĐẦU TIÊN')}</div><h1>{t('Follow a learning path.', 'Học theo một lộ trình.')}</h1><p className="lead">{t('Start with a concrete story and SQL foundations. Then compare indexes, partition pruning, and query rewrites with real plans.', 'Bắt đầu từ tình huống cụ thể và SQL cơ bản. Sau đó dùng plan thật để so sánh chỉ mục, partition pruning và cách viết lại truy vấn.')}</p><div className="paths-list">
    {localizedCategories(locale).map((category, i) => {
      const Icon = icons[i];
      const group = labs.filter(lab => lab.category === category.id);
      const completed = group.filter(lab => progress.completed[lab.id]).length;
      const next = group.find(lab => !progress.completed[lab.id]) || group[0];
      return <section key={category.id} className="path-section"><div className="path-section-heading"><Icon size={23} className="mint"/><div><div className="eyebrow muted">{t('MODULE', 'PHẦN')} {String(i + 1).padStart(2, '0')}</div><h2>{category.title}</h2><p>{category.description}</p></div><Link className="button secondary" href={`/labs/${next.id}`}>{completed === group.length ? t('Revisit path', 'Ôn lại lộ trình') : t('Continue path', 'Tiếp tục học')}</Link></div><div className="path-progress"><div className="progress-track"><span style={{ width: `${completed / group.length * 100}%` }}/></div><span>{completed} / {group.length} {t('labs', 'bài')} · {Math.round(completed / group.length * 100)}%</span></div><div className="path-lessons">{group.map(lab => <Link href={`/labs/${lab.id}`} key={lab.id}><span className={`lab-number ${progress.completed[lab.id] ? 'done' : ''}`}>{progress.completed[lab.id] ? <Check size={14}/> : String(lab.number).padStart(2, '0')}</span><span>{lab.title}</span><span className="muted">{lab.durationMinutes} {t('min', 'phút')}</span></Link>)}</div></section>;
    })}
  </div><div className="settings-actions"><Link className="button secondary" href="/connections">{t('Continue on my PostgreSQL', 'Thực hành trên PostgreSQL của tôi')}</Link></div><div className="callout">{t('Database fundamentals — keys, constraints, and normalization — will become a separate path as the curriculum grows.', 'Kiến thức nền tảng về cơ sở dữ liệu — khóa, ràng buộc và chuẩn hóa — sẽ có lộ trình riêng khi nội dung được mở rộng.')}</div></main></Shell>;
}
