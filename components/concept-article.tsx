'use client';

import Link from 'next/link';
import { localizedLabs } from '@/lib/lab-localization';
import { useLocale } from '@/lib/i18n';
import { MarketingNav } from './shell';

export function ConceptArticle({ labId }: { labId: string }) {
  const { locale, t } = useLocale();
  const labs = localizedLabs(locale);
  const index = labs.findIndex(lab => lab.id === labId);
  const lab = labs[index];
  const previous = labs[index - 1];
  const next = labs[index + 1];
  const categories = { sql: t('SQL', 'SQL'), index: t('INDEXES', 'CHỈ MỤC'), performance: t('PERFORMANCE', 'HIỆU NĂNG'), incident: t('INCIDENTS', 'SỰ CỐ') };
  return <><MarketingNav/><article className="article-content"><div className="eyebrow mint">{t('SQL FIELD NOTES', 'GHI CHÚ THỰC HÀNH SQL')} · {categories[lab.category]}</div><h1>{t(`${lab.title}, explained.`, `${lab.title}: giải thích.`)}</h1><div className="callout">{lab.realWorldScenario}</div><p>{lab.concept}</p><h2>{t('See it in SQL', 'Xem ví dụ SQL')}</h2><pre>{lab.initialQuery}</pre><h2>{t('Try an experiment', 'Thử làm một thí nghiệm')}</h2><p>{lab.task}</p><ul>{lab.goals.map(goal => <li key={goal}>{goal}</li>)}</ul><Link className="button" href={`/labs/${lab.id}`}>{t('Try this concept in QueryLab', 'Thực hành khái niệm này trong QueryLab')}</Link><h2>{t('What to observe', 'Những điều cần quan sát')}</h2><p>{lab.expectedBehavior}</p><nav className="lab-nav" aria-label={t('Related SQL concepts', 'Các khái niệm SQL liên quan')}>{previous ? <Link href={`/data/sql/${previous.slug}`}>{previous.title}</Link> : <Link href="/learn">{t('Learning paths', 'Lộ trình học')}</Link>}{next && <Link href={`/data/sql/${next.slug}`}>{next.title}</Link>}</nav></article></>;
}
