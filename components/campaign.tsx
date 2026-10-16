'use client';

import Link from 'next/link';
import { Check, Flame } from 'lucide-react';
import { localizedLabs } from '@/lib/lab-localization';
import { useLocale } from '@/lib/i18n';
import { useProgress } from '@/lib/progress';
import { Shell } from './shell';

const planned = [
  ['Primary & foreign keys', 'Khóa chính và khóa ngoại'], ['NULL & constraints', 'NULL và ràng buộc'],
  ['CASE expressions', 'Biểu thức CASE'], ['HAVING', 'Mệnh đề HAVING'], ['UNION', 'Phép UNION'],
  ['Subqueries', 'Truy vấn con'], ['Common table expressions', 'Biểu thức bảng chung (CTE)'],
  ['Data normalization', 'Chuẩn hóa dữ liệu'],
  ['Covering indexes', 'Chỉ mục bao phủ'], ['Index write overhead', 'Chi phí ghi của chỉ mục'],
  ['SARGable predicates', 'Điều kiện tận dụng chỉ mục'], ['JOIN optimization', 'Tối ưu JOIN'],
  ['Query statistics', 'Thống kê truy vấn'], ['Data modeling', 'Mô hình hóa dữ liệu'],
  ['Production tradeoffs', 'Đánh đổi trong hệ thống thực tế'],
  ['Final assessment', 'Bài đánh giá cuối khóa'],
];
export function Campaign() {
  const { locale, t } = useLocale();
  const progress = useProgress();
  const labs = localizedLabs(locale);
  const done = labs.filter(lab => progress.completed[lab.id]).length;
  const upcoming = planned.slice(0, Math.max(0, 30 - labs.length));
  return <Shell title={t('30-day challenge', 'Thử thách 30 ngày')}><main className="simple-page"><div className="campaign-header"><div><div className="eyebrow orange-text">{t('30 DAYS OF ASKING BETTER QUESTIONS', '30 NGÀY ĐẶT NHỮNG CÂU HỎI HAY HƠN')}</div><h1>{t('Build a daily SQL habit.', 'Tạo thói quen học SQL mỗi ngày.')}</h1><p className="lead">{t('One hands-on lab a day. A little more understanding every time.', 'Mỗi ngày một bài thực hành. Mỗi lần học hiểu thêm một chút.')}</p></div><span className="campaign-day-count">30</span></div><div className="callout">{t(`The first ${labs.length} days are ready to explore in beta. Days ${labs.length + 1}–30 are on the content roadmap. Start today; practice at your own pace.`, `${labs.length} ngày đầu đã có trong bản beta. Nội dung ngày ${labs.length + 1}–30 đang được lên kế hoạch. Bạn có thể bắt đầu hôm nay và học theo nhịp của mình.`)}</div><div className="campaign-progress"><Flame size={18} className="orange-text"/><span>{done} / {labs.length} {t('available days completed', 'ngày đã có được hoàn thành')}</span><div className="progress-track"><span style={{ width: `${done / labs.length * 100}%` }}/></div><span className="badge">BETA</span></div><div className="campaign-grid">{labs.map((lab, i) => <Link href={`/labs/${lab.id}`} key={lab.id} className={`campaign-day ${progress.completed[lab.id] ? 'done' : ''}`}><div className="eyebrow">{t('DAY', 'NGÀY')} {String(i + 1).padStart(2, '0')}{progress.completed[lab.id] && <Check size={12} className="mint"/>}</div><h3>{lab.title}</h3><span className="small mint">{progress.completed[lab.id] ? t('Completed', 'Hoàn thành') : `${lab.durationMinutes} ${t('min · Start lab', 'phút · Bắt đầu')}`}</span></Link>)}{upcoming.map(([english, vietnamese], i) => <article className="campaign-day planned" key={english}><div className="eyebrow">{t('DAY', 'NGÀY')} {i + labs.length + 1}</div><h3>{t(english, vietnamese)}</h3><span className="small muted">{t('Planned', 'Dự kiến')}</span></article>)}</div></main></Shell>;
}
