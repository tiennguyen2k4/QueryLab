'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, Check, Clock3, Play, Zap, Layers3, Code2, Bookmark, Award, Flame, ChevronRight } from 'lucide-react';
import { localizedLabs } from '@/lib/lab-localization';
import { useLocale } from '@/lib/i18n';
import { useProgress, bookmarkLab, streak } from '@/lib/progress';
import { Shell } from './shell';

export function Dashboard() {
  const { locale, t, formatNumber } = useLocale();
  const labs = localizedLabs(locale);
  const progress = useProgress();
  const [filter, setFilter] = useState('All labs');
  const [search, setSearch] = useState('');
  const complete = labs.filter(lab => progress.completed[lab.id]).length;
  const shown = labs.filter(lab =>
    (filter === 'All labs' || filter === 'Bookmarked' && progress.bookmarks.includes(lab.id) || lab.category === filter) &&
    `${lab.title} ${lab.task}`.toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale))
  );
  const xp = Object.values(progress.completed).reduce((total, item) => total + item.xp, 0);
  const days = streak(progress);
  const filterLabels: Record<string, string> = {
    'All labs': t('All labs', 'Tất cả bài'), sql: t('SQL basics', 'SQL cơ bản'),
    index: t('Indexes', 'Chỉ mục'), performance: t('Performance', 'Hiệu năng'),
    incident: t('Incidents', 'Sự cố'), Bookmarked: t('Bookmarked', 'Đã lưu'),
  };
  const difficultyLabels = { beginner: t('Beginner', 'Cơ bản'), intermediate: t('Intermediate', 'Trung cấp'), advanced: t('Advanced', 'Nâng cao') };

  return <Shell title={t('Overview', 'Tổng quan')}><main className="dashboard page-content">
    <div className="page-heading"><div><div className="eyebrow">{t('YOUR DATA JOURNEY', 'HÀNH TRÌNH HỌC DỮ LIỆU')}</div><h1>{t('Learn by doing.', 'Học qua thực hành.')}<br/><span className="muted">{t('Understand by experimenting.', 'Hiểu qua thử nghiệm.')}</span></h1><p>{t('One query. One experiment. One breakthrough at a time.', 'Từng truy vấn, từng thử nghiệm, từng bước tiến.')}</p></div><div className="engine-pill"><span className="status-dot"/>{t('PostgreSQL · in your browser', 'PostgreSQL · ngay trong trình duyệt')}</div></div>
    <div className="journey-stats">
      <div><span className="stat-icon"><Code2 size={20}/></span><div><strong>{complete}<small> / {labs.length}</small></strong><span>{t('Labs completed', 'Bài đã hoàn thành')}</span></div></div>
      <div><span className="stat-icon"><Zap size={20}/></span><div><strong>{formatNumber(xp)}</strong><span>{t('Total experience', 'Tổng điểm kinh nghiệm')}</span></div></div>
      <div><span className="stat-icon orange"><Flame size={20}/></span><div><strong>{days}<small> {t(days === 1 ? 'day' : 'days', 'ngày')}</small></strong><span>{t('Current streak', 'Chuỗi ngày học')}</span></div></div>
      <div><span className="stat-icon purple"><Award size={20}/></span><div><strong>{Math.floor(xp / 300) + 1}</strong><span>{t('Learner level', 'Cấp độ học viên')}</span></div></div>
    </div>
    <section className="featured-lab"><div className="featured-copy"><span className="eyebrow mint"><span className="tiny-square"/>{t('THE LAB THAT CHANGES HOW YOU SEE SQL', 'BÀI HỌC GIÚP BẠN NHÌN SQL KHÁC ĐI')}</span><h2>{t('Small index.', 'Chỉ mục nhỏ.')}<br/>{t('Big difference.', 'Khác biệt lớn.')}</h2><p>{t('Watch a full table scan become an index lookup.', 'Xem truy vấn chuyển từ quét cả bảng sang tra chỉ mục.')}<br/>{t('Then understand exactly why it happened.', 'Và hiểu rõ vì sao sự thay đổi xảy ra.')}</p><div className="featured-meta"><span><Layers3 size={14}/>{t('Beginner', 'Cơ bản')}</span><span><Clock3 size={14}/>10 {t('min', 'phút')}</span><span><Award size={14}/>{labs.find(l => l.id === 'index-006')?.xp} XP</span></div><Link className="button" href="/labs/index-006"><Play size={15} fill="currentColor"/>{t('Try the index lab', 'Thử bài học chỉ mục')}</Link></div>
      <div className="index-demo-art"><div className="art-top"><span className="muted">orders / customer_id = 42</span><span className="badge">{t('ILLUSTRATION', 'MINH HỌA')}</span></div><div className="scan-comparison"><div><span className="small muted">{t('WITHOUT AN INDEX', 'KHI CHƯA CÓ CHỈ MỤC')}</span><div className="scan-rows">{Array.from({ length: 7 }, (_, i) => <div key={i} className={i === 4 ? 'matching' : ''}><span/>{i === 4 ? t('customer 42', 'khách hàng 42') : t('scan next row', 'quét dòng tiếp theo')}<span className="mono">{String(i * 713 + 1).padStart(5, '0')}</span></div>)}</div><span className="small orange-text">{t('Inspect each row', 'Kiểm tra từng dòng')}</span></div><div className="comparison-divider"/><div><span className="small muted">{t('WITH A B-TREE INDEX', 'KHI CÓ CHỈ MỤC B-TREE')}</span><div className="mini-tree"><div className="tree-key">{t('root', 'gốc')}</div><div className="tree-stems"/><div className="tree-branches"><div className="tree-key dim">1–32</div><div className="tree-key selected">33–64</div><div className="tree-key dim">65–96</div></div><div className="tree-stem"/><div className="tree-key target">customer_id = 42</div></div><span className="small mint">{t('Follow a shorter path', 'Đi theo đường ngắn hơn')}</span></div></div></div>
    </section>
    <section className="learning-section" id="labs"><div className="section-heading"><div><h2>{t('Your learning path', 'Lộ trình học của bạn')}</h2><p>{t('Start with a story. Predict, experiment, then explain what changed.', 'Bắt đầu từ một tình huống. Dự đoán, thử nghiệm rồi giải thích điều đã thay đổi.')}</p></div><span className="small muted">{t(`${labs.length} hands-on labs`, `${labs.length} bài thực hành`)}</span></div>
      <div className="lab-toolbar"><div className="filter-tabs" role="group" aria-label={t('Filter labs', 'Lọc bài thực hành')}>{Object.keys(filterLabels).map(key => <button key={key} className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)}>{filterLabels[key]}</button>)}</div><label className="search-box"><Search size={15}/><input aria-label={t('Search labs', 'Tìm bài thực hành')} placeholder={t('Search labs…', 'Tìm bài thực hành…')} value={search} onChange={event => setSearch(event.target.value)}/></label></div>
      <div className="labs-list"><div className="labs-list-head"><span>{t('LAB / CONCEPT', 'BÀI / KHÁI NIỆM')}</span><span>{t('DIFFICULTY', 'ĐỘ KHÓ')}</span><span>{t('DURATION', 'THỜI LƯỢNG')}</span><span>{t('PROGRESS', 'TIẾN ĐỘ')}</span><span/></div>
        {shown.map(lab => <div key={lab.id} className="lab-row"><Link href={`/labs/${lab.id}`} className="lab-primary"><span className={`lab-number ${progress.completed[lab.id] ? 'done' : ''}`}>{progress.completed[lab.id] ? <Check size={18}/> : String(lab.number).padStart(2, '0')}</span><span><strong>{lab.title}</strong><span className="lab-description">{lab.goals[0]}</span></span></Link><span className={`difficulty ${lab.difficulty}`}><span/>{difficultyLabels[lab.difficulty]}</span><span className="lab-duration"><Clock3 size={13}/>{lab.durationMinutes} {t('min', 'phút')}</span><Link className={`lab-status ${progress.completed[lab.id] ? 'completed' : ''}`} href={`/labs/${lab.id}`}>{progress.completed[lab.id] ? t('Completed', 'Hoàn thành') : t('Start lab', 'Bắt đầu')}<ChevronRight size={14}/></Link><button className={`icon-button bookmark ${progress.bookmarks.includes(lab.id) ? 'mint' : ''}`} aria-label={`${progress.bookmarks.includes(lab.id) ? t('Unbookmark', 'Bỏ lưu') : t('Bookmark', 'Lưu')} ${lab.title}`} onClick={() => bookmarkLab(lab.id)}><Bookmark size={16} fill={progress.bookmarks.includes(lab.id) ? 'currentColor' : 'none'}/></button></div>)}
        {!shown.length && <div className="empty-state">{t('No labs match this search. Try another concept.', 'Không tìm thấy bài phù hợp. Hãy thử tìm khái niệm khác.')}</div>}
      </div>
    </section>
    <div className="dashboard-bottom"><section className="campaign-strip"><span className="campaign-number">30</span><div><span className="eyebrow orange-text">{t('A LITTLE PRACTICE. EVERY DAY.', 'MỖI NGÀY MỘT CHÚT THỰC HÀNH.')}</span><h3>{t('The 30-day SQL challenge', 'Thử thách SQL 30 ngày')}</h3><p>{t('Build a habit with a daily experiment.', 'Tạo thói quen qua thử nghiệm mỗi ngày.')}</p></div><Link className="button secondary" href="/challenge">{t('Explore challenge', 'Xem thử thách')}</Link></section><section className="achievement-strip"><Award size={26}/><div><strong>{complete ? t('Your first breakthrough', 'Bước tiến đầu tiên của bạn') : t('Your first achievement awaits', 'Thành tích đầu tiên đang chờ bạn')}</strong><p>{complete ? t(`${complete} lab${complete === 1 ? '' : 's'} completed. Keep going.`, `Đã hoàn thành ${complete} bài. Tiếp tục nhé.`) : t('Complete a lab to earn your first badge.', 'Hoàn thành một bài để nhận thành tích đầu tiên.')}</p></div></section></div>
  </main></Shell>;
}
