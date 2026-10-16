'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, Check, ChevronDown, Copy, Search, SquareTerminal, TriangleAlert } from 'lucide-react';
import { sampleTables, sqlLessons, type Cell, type HandbookLesson, type Text } from '@/content/sql-handbook';
import { getChallengeByLesson } from '@/content/sql-sandbox-challenges';
import { useLocale } from '@/lib/i18n';
import { Shell } from './shell';

const levels: Record<HandbookLesson['level'], Text> = { basic: ['Basics', 'Cơ bản'], intermediate: ['Intermediate', 'Trung cấp'], advanced: ['Advanced', 'Nâng cao'] };

function DataTable({ caption, columns, rows }: { caption?: string; columns: string[]; rows: Cell[][] }) {
  return <div className="lesson-table-wrap"><table className="lesson-table">{caption && <caption>{caption}</caption>}<thead><tr>{columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className={cell === null ? 'null-cell' : undefined}>{cell === null ? 'NULL' : String(cell)}</td>)}</tr>)}</tbody></table></div>;
}

export function SqlHandbook() {
  const { locale, t } = useLocale();
  const pick = (text: Text) => text[locale === 'vi' ? 1 : 0];
  const [activeId, setActiveId] = useState(sqlLessons[0].id);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const index = Math.max(0, sqlLessons.findIndex(lesson => lesson.id === activeId));
  const lesson = sqlLessons[index];

  useEffect(() => {
    const fromHash = (hash: string) => { const id = hash.replace('#', ''); if (sqlLessons.some(item => item.id === id)) { setActiveId(id); setSearch(''); } };
    fromHash(window.location.hash);
    const onHash = () => fromHash(window.location.hash);
    // Same-page Next links update history without a hashchange event.
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!link) return;
      const url = new URL(link.href);
      if (url.origin === window.location.origin && url.pathname === '/paths') fromHash(url.hash);
    };
    window.addEventListener('hashchange', onHash); document.addEventListener('click', onClick, true);
    return () => { window.removeEventListener('hashchange', onHash); document.removeEventListener('click', onClick, true); };
  }, []);

  const [openLevels, setOpenLevels] = useState<Record<HandbookLesson['level'], boolean>>({
    basic: true,
    intermediate: true,
    advanced: true,
  });

  const toggleLevel = (lvl: HandbookLesson['level']) => {
    setOpenLevels(prev => ({ ...prev, [lvl]: !prev[lvl] }));
  };

  const isLevelOpen = (lvl: HandbookLesson['level']) => {
    if (search.trim()) return true;
    return !!openLevels[lvl];
  };

  useEffect(() => {
    if (lesson?.level) {
      setOpenLevels(prev => (prev[lesson.level] ? prev : { ...prev, [lesson.level]: true }));
    }
  }, [lesson?.level]);

  const open = (id: string) => {
    setActiveId(id); setCopied(false);
    window.history.replaceState(null, '', `#${id}`);
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  };
  const matches = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);
    if (!query) return sqlLessons;
    return sqlLessons.filter(item => [...item.title, ...item.tagline, item.syntax].join(' ').toLocaleLowerCase(locale).includes(query));
  }, [search, locale]);
  const copy = async (sql: string) => {
    try { await navigator.clipboard.writeText(sql); setCopied(true); } catch { setCopied(false); }
  };

  return <Shell title={t('Learn SQL', 'Học SQL')}><main className="handbook-page">
    <header className="handbook-header"><h1>{t('Learn SQL, step by step', 'Học SQL từng bước')}</h1><p>{t('From your first SELECT to indexes and partitions. Every example runs on the same two small tables.', 'Từ câu SELECT đầu tiên đến index và partition. Mọi ví dụ đều chạy trên cùng hai bảng nhỏ.')}</p></header>
    <div className="handbook-layout">
      <nav className="lesson-nav" aria-label={t('Lessons', 'Danh sách bài')}>
        <label className="search-box"><Search size={16}/><input aria-label={t('Search lessons', 'Tìm bài')} value={search} onChange={event => setSearch(event.target.value)} placeholder={t('Search: JOIN, index…', 'Tìm: JOIN, index…')}/></label>
        <select className="lesson-select" aria-label={t('Choose a lesson', 'Chọn bài')} value={lesson.id} onChange={event => open(event.target.value)}>{sqlLessons.map((item, number) => <option key={item.id} value={item.id}>{number + 1}. {pick(item.title)}</option>)}</select>
        {(Object.keys(levels) as HandbookLesson['level'][]).map(level => {
          const group = matches.filter(item => item.level === level);
          if (!group.length) return null;
          const isOpen = isLevelOpen(level);
          return <div key={level} className={`lesson-group ${isOpen ? 'is-open' : 'is-collapsed'}`}>
            <button
              type="button"
              className="lesson-group-toggle"
              onClick={() => toggleLevel(level)}
              aria-expanded={isOpen}
              aria-controls={`lesson-group-list-${level}`}
              title={isOpen ? t('Collapse section', 'Thu nhỏ lại') : t('Expand section', 'Mở rộng')}
            >
              <span className="lesson-group-title">
                {pick(levels[level])}
              </span>
              <ChevronDown size={14} className={`lesson-group-chevron ${isOpen ? 'expanded' : ''}`} />
            </button>
            {isOpen && <ol id={`lesson-group-list-${level}`}>{group.map(item => {
              const number = sqlLessons.indexOf(item) + 1;
              return <li key={item.id}><a href={`#${item.id}`} aria-current={item.id === lesson.id ? 'page' : undefined} onClick={event => { event.preventDefault(); open(item.id); }}><span>{number}</span>{pick(item.title)}</a></li>;
            })}</ol>}
          </div>;
        })}
        {!matches.length && <p className="lesson-empty">{t('No lesson found.', 'Không tìm thấy bài.')}</p>}
      </nav>

      <article className="lesson" aria-labelledby="lesson-title">
        <div className="lesson-meta"><span className={`level-chip ${lesson.level}`}>{pick(levels[lesson.level])}</span><span>{t(`Lesson ${index + 1} of ${sqlLessons.length}`, `Bài ${index + 1} / ${sqlLessons.length}`)}</span></div>
        <h2 id="lesson-title" ref={heading} tabIndex={-1}>{pick(lesson.title)}</h2>
        <p className="lesson-tagline">{pick(lesson.tagline)}</p>

        <section className="lesson-section"><h3>{t('What is it?', 'Là gì?')}</h3><p className="lesson-what">{pick(lesson.what)}</p>
          {lesson.when.length > 0 && <><h3>{lesson.id === 'intro' ? t('Remember', 'Ghi nhớ') : t('When to use it', 'Dùng khi nào?')}</h3><ul className="lesson-when">{lesson.when.map(item => <li key={item[0]}><Check size={16}/>{pick(item)}</li>)}</ul></>}
        </section>

        <section className="lesson-section"><h3>{lesson.id === 'intro' ? t('Key terms', 'Các khái niệm') : t('Syntax', 'Cú pháp')}</h3>
          {lesson.id !== 'intro' && <pre className="lesson-code"><code>{lesson.syntax}</code></pre>}
          <dl className="lesson-parts">{lesson.parts.map(part => <div key={part.code}><dt><code>{part.code}</code></dt><dd>{pick(part.meaning)}</dd></div>)}</dl>
        </section>

        <section className="lesson-section lesson-example"><h3>{t('Example', 'Ví dụ')}</h3>
          <p className="example-question">{pick(lesson.example.question)}</p>
          {lesson.example.uses && <div className="example-input"><span className="example-label">{t('Data', 'Dữ liệu')}</span>{lesson.example.uses.map(name => <DataTable key={name} caption={name} columns={sampleTables[name].columns} rows={sampleTables[name].rows}/>)}</div>}
          <div className="example-sql"><span className="example-label">SQL</span><button className="copy-button" onClick={() => void copy(lesson.example.sql)} aria-label={t('Copy SQL', 'Sao chép SQL')}>{copied ? <Check size={15}/> : <Copy size={15}/>}{copied ? t('Copied', 'Đã chép') : t('Copy', 'Chép')}</button><pre className="lesson-code"><code>{lesson.example.sql}</code></pre></div>
          {lesson.example.check && <div className="example-sql"><span className="example-label">{t('Then check with', 'Kiểm tra lại bằng')}</span><pre className="lesson-code"><code>{lesson.example.check}</code></pre></div>}
          {(lesson.example.result || lesson.example.error || lesson.example.illustration) && <div className="example-arrow" aria-hidden="true"><ArrowDown size={20}/></div>}
          {lesson.example.result && <div className="example-output"><span className="example-label">{t('Result', 'Kết quả')}</span><DataTable columns={lesson.example.result.columns} rows={lesson.example.result.rows}/></div>}
          {lesson.example.error && <div className="example-error" role="note"><TriangleAlert size={18}/>{pick(lesson.example.error)}</div>}
          {lesson.example.illustration && <div className="example-output"><span className="example-label">{lesson.id === 'index' ? t('Illustration', 'Minh họa') : t('What you will see', 'Bạn sẽ thấy')}</span><DataTable columns={lesson.example.illustration.columns.map(pick)} rows={lesson.example.illustration.rows.map(row => row.map(cell => typeof cell === 'string' ? cell : pick(cell)))}/></div>}
          {lesson.example.note && <p className="example-note">{pick(lesson.example.note)}</p>}
        </section>

        <section className="lesson-section"><h3>{t('Common mistakes', 'Lỗi hay gặp')}</h3><ul className="lesson-mistakes">{lesson.mistakes.map(item => <li key={item[0]}><AlertTriangle size={17}/>{pick(item)}</li>)}</ul></section>

        {(() => {
          const challenge = getChallengeByLesson(lesson.id);
          if (!challenge) return null;
          return (
            <div className="handbook-sandbox-banner">
              <div className="handbook-sandbox-info">
                <div className="handbook-sandbox-eyebrow">
                  <SquareTerminal size={15} className="mint" />
                  <span>{t('PRACTICE ON SQL SANDBOX', 'BÀI TẬP THỰC HÀNH TRÊN SQL SANDBOX')}</span>
                </div>
                <h4>{pick(challenge.title)}</h4>
                <p>{pick(challenge.task)}</p>
              </div>
              <Link className="button handbook-sandbox-btn" href={`/playground?challenge=${challenge.id}`}>
                {t('Practice in Sandbox →', 'Làm bài tập trên Sandbox →')}
              </Link>
            </div>
          );
        })()}

        {['index', 'explain', 'partition'].includes(lesson.id) && <Link className="lesson-try" href="/workspace">{t('Try it on your own database', 'Thử trên database của bạn')}<ArrowRight size={16}/></Link>}

        <nav className="lesson-pager" aria-label={t('Lesson navigation', 'Chuyển bài')}>
          {index > 0 ? <button className="button secondary" onClick={() => open(sqlLessons[index - 1].id)}><ArrowLeft size={16}/>{pick(sqlLessons[index - 1].title)}</button> : <span/>}
          {index < sqlLessons.length - 1 && <button className="button" onClick={() => open(sqlLessons[index + 1].id)}>{pick(sqlLessons[index + 1].title)}<ArrowRight size={16}/></button>}
        </nav>
      </article>
    </div>
  </main></Shell>;
}
