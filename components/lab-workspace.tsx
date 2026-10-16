'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Activity, Award, BookOpen, Check, CheckCircle2, ChevronDown, Clock3, Code2, Database, Lightbulb, LoaderCircle, LockKeyhole, Play, RotateCcw, ShieldCheck, Square, SquareTerminal, Table2, TriangleAlert, Waypoints } from 'lucide-react';
import { labs, type Lab } from '@/content/labs';
import { sqlSandboxChallenges, getSqlChallenge, type SqlSandboxChallenge } from '@/content/sql-sandbox-challenges';
import { BrowserPostgresAdapter } from '@/lib/engine/client';
import type { DatabaseAdapter, DatasetSize, PlanNode, QueryResult, ValidationRequest } from '@/lib/engine/types';
import { useConnection } from '@/lib/connections';
import { guardSql, splitStatements } from '@/lib/engine/sql-guard';
import { completeLab, useProgress } from '@/lib/progress';
import { track } from '@/lib/analytics';
import { useLocale } from '@/lib/i18n';
import type { Locale } from '@/lib/locale';
import { localizeLab } from '@/lib/lab-localization';
import { localizeEngineMessage } from '@/lib/engine-localization';
import { Shell } from './shell';
import { SqlEditor } from './sql-editor';
import { LabStory } from './lab-story';
import { DatabaseMode } from './database-mode';
import { QueryInvestigation } from './query-investigation';

type CheckResult = { passed: boolean; message: string };
const schema: Record<string, [string,string][]> = {customers:[['id','integer · PK'],['name','text'],['email','text'],['city','text']],orders:[['id','integer · PK'],['customer_id','integer · FK'],['order_date','date'],['status','text'],['total','numeric']],products:[['id','integer · PK'],['name','text'],['category','text'],['price','numeric']],order_items:[['id','integer · PK'],['order_id','integer · FK'],['product_id','integer · FK'],['quantity','integer'],['unit_price','numeric']]};
const partitionSchema: [string,string][] = schema.orders.map(([column,type])=>[column,type.split(' · ')[0]]);
const starter = 'SELECT id, customer_id, order_date, status, total\nFROM orders\nWHERE customer_id = 42\nORDER BY id;';

export function LabWorkspace({lab,interviewMode=false,onCompleted}:{lab?:Lab;interviewMode?:boolean;onCompleted?:(success:boolean)=>void}) {
  const { locale, t, formatNumber } = useLocale();
  const connection = useConnection();
  const nativeMode = !interviewMode && connection.mode === 'native' && !!connection.native;
  // Translate presentation without replacing the canonical lab or its database lifecycle.
  const displayedLab = lab ? localizeLab(lab, locale) : undefined;
  const [sql,setSql]=useState(lab?.initialQuery||starter); const [result,setResult]=useState<QueryResult|null>(null); const [baseline,setBaseline]=useState<QueryResult|null>(null);
  const [tab,setTab]=useState(interviewMode ? 'Result' : 'Overview'); const [lessonTab,setLessonTab]=useState('brief'); const [hasRun,setHasRun]=useState(false); const [busy,setBusy]=useState(false); const [ready,setReady]=useState(false); const [booting,setBooting]=useState(true); const [error,setError]=useState(''); const [notice,setNotice]=useState('');
  const [hints,setHints]=useState(0); const [showSolutionConfirm,setShowSolutionConfirm]=useState(false); const [solutionUsed,setSolutionUsed]=useState(false); const [checks,setChecks]=useState<CheckResult[]>([]); const [completed,setCompleted]=useState(false); const [size,setSize]=useState<DatasetSize>(50000); const [browserMs,setBrowserMs]=useState(0);
  const [resetConfirm, setResetConfirm] = useState(false);
  const engine = useRef<DatabaseAdapter|null>(null); const executedEditor = useRef(''); const lastRead = useRef(''); const operation = useRef(false); const progress = useProgress();
  const generation = useRef(0);
  const effectiveSize = nativeMode ? connection.nativeSize : size;
  const id = lab?.id || 'playground';
  const canonical = lab?.validationRules.find(r=>r.kind==='result-equivalent');
  const challengeQuery = canonical?.kind==='result-equivalent'?canonical.referenceSql:lab?.baselineQuery||lab?.initialQuery||starter;

  const isSandbox = !lab && !interviewMode;
  const [activeChallengeId, setActiveChallengeId] = useState<string>('free');
  const [challengeFilter, setChallengeFilter] = useState<'all' | 'basic' | 'intermediate' | 'advanced'>('all');
  const [challengeHints, setChallengeHints] = useState<number>(0);
  const [challengeShowSolution, setChallengeShowSolution] = useState<boolean>(false);
  const [challengeCheckSuccess, setChallengeCheckSuccess] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeChallenge: SqlSandboxChallenge | undefined = isSandbox && activeChallengeId !== 'free'
    ? getSqlChallenge(activeChallengeId)
    : undefined;

  const filteredChallenges = useMemo(() => {
    if (challengeFilter === 'all') return sqlSandboxChallenges;
    return sqlSandboxChallenges.filter(c => c.level === challengeFilter);
  }, [challengeFilter]);

  const selectChallenge = useCallback((targetId: string) => {
    setActiveChallengeId(targetId);
    setChallengeHints(0);
    setChallengeShowSolution(false);
    setChallengeCheckSuccess(false);
    setError('');
    setNotice('');
    setChecks([]);
    if (targetId === 'free') {
      setSql(starter);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('challenge');
        url.searchParams.delete('lesson');
        window.history.replaceState(null, '', url.pathname);
      }
    } else {
      const c = getSqlChallenge(targetId);
      if (c) {
        setSql(c.starterSql);
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('challenge', c.id);
          window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!isSandbox) return;
    const params = new URLSearchParams(window.location.search);
    const param = params.get('challenge') || params.get('lesson');
    if (param) {
      const found = getSqlChallenge(param);
      if (found) {
        setActiveChallengeId(found.id);
        setSql(found.starterSql);
        setChallengeFilter(found.level);
      }
    }
  }, [isSandbox]);
 
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const checkChallenge = async () => {
    if (!activeChallenge || !engine.current || operation.current || !ready) return;
    const adapter = engine.current;
    operation.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    setChallengeCheckSuccess(false);
    try {
      const statements = splitStatements(sql);
      if (!statements.length) throw new Error('Write a query before running it.');
      statements.forEach(s => guardSql(s));
      let userOutput: QueryResult | null = null;
      for (const statement of statements) {
        userOutput = await adapter.run(statement);
      }
      if (!userOutput || userOutput.kind !== 'read') {
        throw new Error(t('Your query must include a SELECT statement to return results.', 'Truy vấn phải chứa câu lệnh SELECT để trả về kết quả.'));
      }

      setResult(userOutput);
      setHasRun(true);
      setTab('Result');

      const refOutput = await adapter.run(activeChallenge.referenceSql);
      if (!refOutput || refOutput.kind !== 'read') {
        throw new Error(t('Unable to verify reference result.', 'Không thể chạy kết quả đối chiếu.'));
      }

      if (userOutput.rows.length !== refOutput.rows.length) {
        setError(t(
          `Row count mismatch: expected ${refOutput.rows.length} rows, but your query returned ${userOutput.rows.length} rows.`,
          `Số dòng chưa khớp: đề bài yêu cầu ${refOutput.rows.length} dòng, nhưng câu truy vấn trả về ${userOutput.rows.length} dòng.`
        ));
        setChallengeCheckSuccess(false);
        return;
      }

      const normalize = (val: unknown) => val === null ? null : typeof val === 'number' || typeof val === 'bigint' ? Number(val) : String(val).trim();
      const userRows = userOutput.rows.map(r => r.map(normalize));
      const refRows = refOutput.rows.map(r => r.map(normalize));

      let matched = false;
      if (activeChallenge.ordered) {
        matched = JSON.stringify(userRows) === JSON.stringify(refRows);
      } else {
        const sort = (rows: unknown[][]) => [...rows].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
        matched = JSON.stringify(sort(userRows)) === JSON.stringify(sort(refRows));
      }

      if (matched) {
        setChallengeCheckSuccess(true);
        setNotice(t(
          'Outstanding! Complete query results match the challenge requirements.',
          'Xuất sắc! Kết quả truy vấn khớp hoàn toàn với yêu cầu đề bài.'
        ));
      } else {
        setError(t(
          'Query executed successfully, but returned values differ from the expected solution. Check your filters, column aliases, or sorting.',
          'Truy vấn chạy thành công nhưng dữ liệu trả về chưa khớp với kết quả đề bài. Vui lòng kiểm tra lại điều kiện WHERE, các cột cần lấy hoặc cách sắp xếp.'
        ));
      }
    } catch (e) {
      setError(errorText(e));
      setChallengeCheckSuccess(false);
    } finally {
      setBusy(false);
      operation.current = false;
    }
  };

  const challengeIndex = activeChallenge ? sqlSandboxChallenges.findIndex(c => c.id === activeChallenge.id) : -1;
  const nextChallenge = challengeIndex >= 0 && challengeIndex < sqlSandboxChallenges.length - 1 ? sqlSandboxChallenges[challengeIndex + 1] : null;
  function displayMessage(message: string): string {
    if (message.includes('\n')) return message.split('\n').map(displayMessage).join(' ');
    if (lab && message === lab.solutionExplanation) return displayedLab!.solutionExplanation;
    const ruleIndex = lab?.validationRules.findIndex(rule => rule.explanation === message) ?? -1;
    if (ruleIndex >= 0) return displayedLab!.validationRules[ruleIndex].explanation;
    const localMessages: Record<string, string> = {
      'Write a query before running it.': 'Viết truy vấn trước khi chạy.',
      'Run up to five statements at a time.': 'Mỗi lần chạy tối đa năm câu lệnh.',
      'Index updated.': 'Đã cập nhật chỉ mục.',
      'Dataset rebuilt. Your learning indexes have been cleared.': 'Đã tạo lại dữ liệu và xóa các chỉ mục bạn đã thêm.',
      'Run the current editor contents before checking your solution.': 'Chạy nội dung hiện tại trong trình soạn thảo trước khi kiểm tra lời giải.',
      'Complete query results match the challenge.': 'Toàn bộ kết quả truy vấn khớp với yêu cầu bài tập.',
      'Query results differ.': 'Kết quả truy vấn chưa khớp.',
      'The execution plan meets the challenge.': 'Kế hoạch thực thi đáp ứng yêu cầu bài tập.',
      'The execution plan still needs work.': 'Kế hoạch thực thi vẫn cần cải thiện.',
      'Something went wrong. Reset your database and try again.': 'Đã xảy ra lỗi. Đặt lại cơ sở dữ liệu rồi thử lại.',
    };
    return locale === 'vi' && localMessages[message] ? localMessages[message] : localizeEngineMessage(message, locale);
  }

  useEffect(()=>{
    const adapter: DatabaseAdapter = nativeMode ? connection.native! : new BrowserPostgresAdapter();engine.current=adapter;let cancelled=false;operation.current=true;generation.current++;
    setSql(lab?.initialQuery||starter);setResult(null);setBaseline(null);setError('');setNotice('');setBooting(true);setReady(false);setCompleted(false);setChecks([]);setHints(0);setSolutionUsed(false);lastRead.current='';
    setBusy(false); setHasRun(false); setLessonTab('brief'); setTab(interviewMode ? 'Result' : 'Overview'); setResetConfirm(false); executedEditor.current='';
    (async()=>{try {await adapter.initialize(effectiveSize);if(cancelled)return;await adapter.prepareLab?.(id);if(cancelled)return;for(const setup of lab?.setupSql||[]) {if(cancelled)return;await adapter.run(setup);}
      const base = await adapter.run(lab?.baselineQuery||lab?.initialQuery||starter);
      if(!cancelled){setBaseline(base);setReady(true);setResult(base);lastRead.current=base.sql;executedEditor.current=lab?.initialQuery||starter;track('lesson_started',id);}
    }catch(e){if(!cancelled)setError(errorText(e));}finally{if(!cancelled){setBooting(false);operation.current=false;}}})();
    return()=>{cancelled=true;generation.current++;if(!nativeMode)adapter.dispose();else if(operation.current)void adapter.cancel?.().catch(()=>undefined);if(engine.current===adapter)engine.current=null;};
  // Each lab gets its own isolated database and learning indexes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[id,effectiveSize,nativeMode,connection.native]);

  const run=useCallback(async()=>{
    if(operation.current||!engine.current||!ready)return;
    const adapter = engine.current;
    operation.current=true;setBusy(true);setError('');setNotice('');setChecks([]);const start=performance.now();
    const currentGeneration = generation.current;
    try {
      const statements=splitStatements(sql);if(!statements.length)throw new Error('Write a query before running it.');if(statements.length>5)throw new Error('Run up to five statements at a time.');
      statements.forEach(s=>guardSql(s)); // Validate the whole batch before executing any statement.
      let output:QueryResult|null=null;let indexChanged=false;const messages:string[]=[];
      for(const statement of statements){if(currentGeneration!==generation.current)return;const r=await adapter.run(statement,{baselineQuery:challengeQuery});if(currentGeneration!==generation.current)return;output=r;if(r.kind==='read')lastRead.current=r.sql;else {indexChanged=true;messages.push(r.message||'Index updated.');}}
      if(indexChanged&&output?.kind==='index'){output=await adapter.run(lastRead.current||challengeQuery);if(currentGeneration!==generation.current)return;lastRead.current=output.sql;}
      if(currentGeneration!==generation.current)return;
      executedEditor.current=sql;setResult(output);setHasRun(true);setBrowserMs(performance.now()-start);setNotice(messages.join('\n'));track('query_executed',id);
      setTab(output?.explained ? 'Execution plan' : interviewMode ? 'Result' : 'Overview');
    }catch(e){if(currentGeneration!==generation.current)return;setError(errorText(e));track('lab_failed',id);if(/timed out|worker failed|unreadable|reset|cancel/i.test(errorText(e)))setReady(false);}
    finally {if(currentGeneration===generation.current){setBusy(false);operation.current=false;}}
  },[sql,ready,challengeQuery,id,interviewMode]);

  async function reset(){if(operation.current||!engine.current)return;const adapter=engine.current;const currentGeneration=generation.current;operation.current=true;setResetConfirm(false);setBusy(true);setHasRun(false);setError('');setResult(null);setChecks([]);setNotice('');setReady(false);try {await adapter.reset(effectiveSize);if(currentGeneration!==generation.current)return;await adapter.prepareLab?.(id);for(const setup of lab?.setupSql||[])await adapter.run(setup);const base=await adapter.run(lab?.baselineQuery||lab?.initialQuery||starter);if(currentGeneration!==generation.current)return;setBaseline(base);setResult(base);lastRead.current=base.sql;setSql(lab?.initialQuery||starter);executedEditor.current=lab?.initialQuery||starter;setReady(true);setNotice('Dataset rebuilt. Your learning indexes have been cleared.');setCompleted(false);}catch(e){if(currentGeneration===generation.current)setError(errorText(e));}finally{if(currentGeneration===generation.current){setBusy(false);operation.current=false;}}}

  const stageSql = (value: string) => { if(operation.current)return;setSql(value);setChecks([]);setCompleted(false);setNotice(t('SQL is in the editor. Review it, then choose Run and analyze.', 'Đã đưa SQL vào editor. Xem lại rồi chọn Chạy và phân tích.')); requestAnimationFrame(()=>{ document.querySelector('.editor-panel')?.scrollIntoView({block:'nearest'}); document.querySelector<HTMLElement>('.cm-content')?.focus({preventScroll:true}); }); };
  async function cancel(){if(!engine.current)return;try{await engine.current.cancel?.();setReady(false);setError(t('Stop requested. Reset the lab to recover before running another query.', 'Đã yêu cầu dừng. Đặt lại bài để khôi phục trước khi chạy query tiếp.'));}catch(failure){setError(errorText(failure));}}

  async function validate(){if(sql.trim()!==executedEditor.current.trim()){setError('Run the current editor contents before checking your solution.');return;}if(!lab||!engine.current||operation.current||!ready)return;const adapter=engine.current;const currentGeneration=generation.current;operation.current=true;setBusy(true);setError('');try {
    const request = {candidateSql:lastRead.current||sql,canonicalSql:challengeQuery,requireColumnNames:true,rules:lab.validationRules,baselinePlan:baseline?.plan||undefined} as ValidationRequest;
    const verdict=await adapter.validate(request);
    if(currentGeneration!==generation.current)return;
    const feedback:CheckResult[]=verdict.checks?.map(c=>({passed:c.passed,message:c.explanation}))||[{passed:verdict.resultMatches,message:verdict.resultMatches?'Complete query results match the challenge.':verdict.reasons.join(' ')||'Query results differ.'},{passed:verdict.planMatches,message:verdict.planMatches?'The execution plan meets the challenge.':'The execution plan still needs work.'}];
    setChecks(feedback);setCompleted(verdict.matches);if(verdict.matches){completeLab(lab.id,solutionUsed,lab.xp);track('lab_completed',lab.id);onCompleted?.(true);}else{track('lab_failed',lab.id);onCompleted?.(false);}
  }catch(e){if(currentGeneration===generation.current)setError(errorText(e));}finally{if(currentGeneration===generation.current){setBusy(false);operation.current=false;}}}

  useEffect(()=>{
    if(!resetConfirm)return;
    const previous=document.activeElement as HTMLElement|null;
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();setResetConfirm(false);}
      if(event.key==='Tab'){
        const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>('.reset-dialog button'));
        const first=buttons[0],last=buttons.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown',onKey);
    return()=>{document.removeEventListener('keydown',onKey);previous?.focus();};
  },[resetConfirm]);

  useEffect(()=>{
    const context=(document as Document&{modelContext?:{registerTool:(tool:unknown,options?:{signal:AbortSignal})=>void}}).modelContext;
    if(!context?.registerTool)return;const controller=new AbortController();
    try {context.registerTool({name:'stage_sql_query',description:'Put PostgreSQL SQL into the visible editor. This stages a query; it does not execute it.',inputSchema:{type:'object',properties:{sql:{type:'string',maxLength:10000}},required:['sql'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input:unknown){if(!input||typeof input!=='object'||typeof (input as {sql?:unknown}).sql!=='string')throw new Error('sql must be a string.');const value=(input as {sql:string}).sql;if(value.length>10000)throw new Error('SQL exceeds 10,000 characters.');setSql(value);return {staged:true,labId:id};}},{signal:controller.signal});}catch{ /* Optional browser standard. */ }
    return()=>controller.abort();
  },[id]);

  const isIndexed = !!result?.metrics?.indexNames.length;
  const next = lab ? labs[labs.findIndex(l => l.id === lab.id) + 1] : null;
  const displayedNext = next ? localizeLab(next, locale) : null;
  const hintLabel = displayedLab && hints >= displayedLab.hints.length
    ? t('All hints revealed', 'Đã mở hết gợi ý')
    : t('Reveal hint ', 'Mở gợi ý ') + (hints + 1);
  const revealHint = () => { setHints(hints + 1); track('hint_opened', id); };
  const difficultyLabel = lab ? {
    beginner: t('beginner', 'cơ bản'),
    intermediate: t('intermediate', 'trung cấp'),
    advanced: t('advanced', 'nâng cao'),
  }[lab.difficulty] : '';
  const categoryLabel = lab ? {
    sql: 'SQL', index: t('INDEX', 'CHỈ MỤC'),
    performance: t('PERFORMANCE', 'HIỆU NĂNG'), incident: t('INCIDENT', 'SỰ CỐ'),
  }[lab.category] : '';
  const lessonTabs = [{ id: 'brief', label: t('Task', 'Đề bài'), Icon: BookOpen }, { id: 'schema', label: t('Data', 'Dữ liệu'), Icon: Database }, ...(lab ? [{ id: 'help', label: t('Hints', 'Gợi ý'), Icon: Lightbulb }] : [])];
  const tabs = [
    ...(!interviewMode ? [{ id: 'Overview', label: t('Overview', 'Tổng quan'), Icon: Activity }] : []),
    { id: 'Result', label: t('Result', 'Kết quả'), Icon: Table2 },
    { id: 'Execution plan', label: t('Execution plan', 'Kế hoạch thực thi'), Icon: Waypoints },
    { id: 'Explanation', label: t('Explanation', 'Giải thích'), Icon: Lightbulb },
  ];
  return <Shell title={displayedLab?.title || t('SQL playground', 'Khu thực hành SQL')} wide focused>
    <main className="lab-page">
      <div className="lab-heading">
        <div>
          <div className="eyebrow mint">
            {lab
              ? t('LAB ', 'BÀI ') + String(lab.number).padStart(3, '0') + ' · ' + categoryLabel
              : activeChallenge
                ? t('SQL CHALLENGE ', 'ĐỀ BÀI THỰC HÀNH ') + String(activeChallenge.number).padStart(2, '0') + ' · ' + activeChallenge.topic[locale === 'vi' ? 1 : 0]
                : t('YOUR PERSONAL DATABASE SANDBOX', 'KHÔNG GIAN CƠ SỞ DỮ LIỆU CỦA BẠN')}
          </div>
          <h1>
            {displayedLab?.title || (activeChallenge ? activeChallenge.title[locale === 'vi' ? 1 : 0] : t('SQL playground', 'Khu thực hành SQL'))}
          </h1>
        </div>
        <div className="lab-meta">{lab && <>
          <span className={'difficulty ' + lab.difficulty}><span />{difficultyLabel}</span>
          <span className="muted"><Clock3 size={13} /> {lab.durationMinutes} {t('min', 'phút')}</span>
          <span className="mint"><Award size={13} /> {solutionUsed ? Math.min(40, lab.xp) : lab.xp} XP</span>
        </>}{activeChallenge && (
          <span className={`difficulty ${activeChallenge.level}`}>
            <span />
            {activeChallenge.level === 'basic' ? t('basic', 'cơ bản') : activeChallenge.level === 'intermediate' ? t('intermediate', 'trung cấp') : t('advanced', 'nâng cao')}
          </span>
        )}{!interviewMode && <DatabaseMode disabled={busy||booting}/>}</div>
      </div>
      <div className="workspace-grid">
        <aside className="challenge-panel">
          {isSandbox && (
            <div className="sandbox-picker-bar">
              <div className="picker-tabs">
                {(['all', 'basic', 'intermediate', 'advanced'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    className={`picker-tab ${challengeFilter === lvl ? 'active' : ''}`}
                    onClick={() => setChallengeFilter(lvl)}
                  >
                    {lvl === 'all' ? t('All', 'Tất cả') : lvl === 'basic' ? t('Basic', 'Cơ bản') : lvl === 'intermediate' ? t('Intermediate', 'Trung cấp') : t('Advanced', 'Nâng cao')}
                  </button>
                ))}
              </div>
              <div className="picker-dropdown-wrap" ref={dropdownRef}>
                <button
                  type="button"
                  className={`picker-dropdown-trigger ${dropdownOpen ? 'open' : ''}`}
                  onClick={() => setDropdownOpen(o => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOpen}
                  aria-label={t('Choose SQL challenge', 'Chọn đề bài thực hành SQL')}
                >
                  <span className="trigger-lead">
                    <SquareTerminal size={15} className="mint trigger-icon" />
                    <span className="trigger-text">
                      {activeChallenge ? (
                        <>
                          <span className="trigger-num">#{String(activeChallenge.number).padStart(2, '0')}</span>
                          <span className="trigger-title">{activeChallenge.title[locale === 'vi' ? 1 : 0]}</span>
                        </>
                      ) : (
                        <span className="trigger-title">{t('Free Sandbox (No challenge)', 'Tự do khám phá (SQL Sandbox)')}</span>
                      )}
                    </span>
                  </span>
                  <ChevronDown size={14} className={`dropdown-chevron ${dropdownOpen ? 'rotated' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="custom-dropdown-menu" role="listbox">
                    <button
                      type="button"
                      role="option"
                      aria-selected={activeChallengeId === 'free'}
                      className={`custom-dropdown-item free-item ${activeChallengeId === 'free' ? 'selected' : ''}`}
                      onClick={() => {
                        selectChallenge('free');
                        setDropdownOpen(false);
                      }}
                    >
                      <div className="item-icon-box">
                        <SquareTerminal size={14} className={activeChallengeId === 'free' ? 'mint' : 'muted'} />
                      </div>
                      <div className="item-info">
                        <div className="item-heading">
                          <span className="item-title">{t('Free Sandbox (No challenge)', 'Tự do khám phá (SQL Sandbox)')}</span>
                        </div>
                        <span className="item-desc">{t('Clean SQL workspace without tasks', 'Không đề bài · Workspace tự do')}</span>
                      </div>
                      {activeChallengeId === 'free' && <Check size={14} className="item-check" />}
                    </button>

                    <div className="dropdown-divider" role="separator" />

                    <div className="dropdown-group-header">
                      <span>{t('Challenges', 'Đề bài thực hành')}</span>
                      <span className="dropdown-group-count">{filteredChallenges.length}</span>
                    </div>

                    <div className="dropdown-scroll-list">
                      {filteredChallenges.length === 0 ? (
                        <div className="dropdown-empty">
                          {t('No challenges in this category', 'Không có đề bài trong danh mục này')}
                        </div>
                      ) : (
                        filteredChallenges.map(c => {
                          const isSelected = activeChallengeId === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              className={`custom-dropdown-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                selectChallenge(c.id);
                                setDropdownOpen(false);
                              }}
                            >
                              <div className="item-icon-box">
                                <SquareTerminal size={14} className={isSelected ? 'mint' : 'muted'} />
                              </div>
                              <div className="item-info">
                                <div className="item-heading">
                                  <span className="item-num">#{String(c.number).padStart(2, '0')}</span>
                                  <span className="item-title">{c.title[locale === 'vi' ? 1 : 0]}</span>
                                </div>
                                <div className="item-badges">
                                  <span className={`item-level-chip ${c.level}`}>
                                    {c.level === 'basic' ? t('Basic', 'Cơ bản') : c.level === 'intermediate' ? t('Inter', 'Trung cấp') : t('Adv', 'Nâng cao')}
                                  </span>
                                  <span className="item-topic">{c.topic[locale === 'vi' ? 1 : 0]}</span>
                                </div>
                              </div>
                              {isSelected && <Check size={14} className="item-check" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="lesson-tabs" role="tablist" aria-label={t('Lesson resources', 'Nội dung bài học')}>
            {lessonTabs.map(({id: name,label,Icon}, index) => <button key={name} id={'lesson-tab-'+name} role="tab" aria-selected={lessonTab===name} aria-controls={'lesson-pane-'+name} tabIndex={lessonTab===name?0:-1} onClick={()=>setLessonTab(name)} onKeyDown={event=>{
              let target=index;
              if(event.key==='ArrowRight')target=(index+1)%lessonTabs.length;
              else if(event.key==='ArrowLeft')target=(index+lessonTabs.length-1)%lessonTabs.length;
              else if(event.key==='Home')target=0;
              else if(event.key==='End')target=lessonTabs.length-1;
              else return;
              event.preventDefault();setLessonTab(lessonTabs[target].id);document.getElementById('lesson-tab-'+lessonTabs[target].id)?.focus();
            }}><Icon size={14}/>{label}</button>)}
          </div>
          <div className="lesson-pane" id="lesson-pane-brief" role="tabpanel" aria-labelledby="lesson-tab-brief" tabIndex={0} hidden={lessonTab!=='brief'}>
            {lab && !interviewMode ? (
              <LabStory labId={lab.id} mission={displayedLab?.task} onStageSql={stageSql} disabled={busy||booting}/>
            ) : activeChallenge ? (
              <div className="panel-body challenge-brief">
                <div className="challenge-badge-row">
                  <span className={`level-chip ${activeChallenge.level}`}>
                    {activeChallenge.level === 'basic' ? t('BASIC', 'CƠ BẢN') : activeChallenge.level === 'intermediate' ? t('INTERMEDIATE', 'TRUNG CẤP') : t('ADVANCED', 'NÂNG CAO')}
                  </span>
                  <span className="challenge-topic-tag">{activeChallenge.topic[locale === 'vi' ? 1 : 0]}</span>
                </div>

                <h3 className="challenge-main-title">{activeChallenge.title[locale === 'vi' ? 1 : 0]}</h3>

                <div className="challenge-block scenario-block">
                  <div className="challenge-block-label">{t('BUSINESS SCENARIO', 'TÌNH HUỐNG THỰC TẾ')}</div>
                  <p>{activeChallenge.scenario[locale === 'vi' ? 1 : 0]}</p>
                </div>

                <div className="challenge-block task-block">
                  <div className="challenge-block-label">{t('YOUR TASK', 'NHIỆM VỤ ĐỀ BÀI')}</div>
                  <p>{activeChallenge.task[locale === 'vi' ? 1 : 0]}</p>
                </div>

                <div className="challenge-tables-strip">
                  <span className="small muted">{t('Tables:', 'Bảng liên quan:')}</span>
                  {activeChallenge.tables.map(table => (
                    <span key={table} className="table-chip"><Database size={11}/> {table}</span>
                  ))}
                </div>

                <div className="challenge-actions-strip">
                  <button
                    type="button"
                    className="button secondary small-button"
                    onClick={() => stageSql(activeChallenge.starterSql)}
                    disabled={busy || booting}
                  >
                    <Code2 size={13}/> {t('Load template into editor', 'Nạp đề bài vào Editor')}
                  </button>
                  <button
                    type="button"
                    className="button secondary small-button"
                    onClick={() => setChallengeHints(prev => Math.min(activeChallenge.hints.length, prev + 1))}
                    disabled={busy || booting}
                  >
                    <Lightbulb size={13}/> {challengeHints >= activeChallenge.hints.length ? t('All hints opened', 'Đã mở hết gợi ý') : t('Hint ', 'Gợi ý ') + (challengeHints + 1)}
                  </button>
                </div>

                {challengeHints > 0 && (
                  <div className="challenge-hints-card">
                    {activeChallenge.hints.slice(0, challengeHints).map((hint, i) => (
                      <div key={i} className="hint-item">
                        <strong>{t('Hint ', 'Gợi ý ')}{i + 1}:</strong> {hint[locale === 'vi' ? 1 : 0]}
                      </div>
                    ))}
                  </div>
                )}

                <div className="challenge-solution-section">
                  <button
                    type="button"
                    className="solution-link-button"
                    onClick={() => setChallengeShowSolution(!challengeShowSolution)}
                  >
                    <LockKeyhole size={12}/> {challengeShowSolution ? t('Hide solution query', 'Ẩn câu lệnh giải mẫu') : t('Show solution query', 'Xem câu lệnh giải mẫu')}
                  </button>
                  {challengeShowSolution && (
                    <div className="solution-drawer">
                      <pre className="mono"><code>{activeChallenge.solutionSql}</code></pre>
                      <p className="small muted">{activeChallenge.explanation[locale === 'vi' ? 1 : 0]}</p>
                      <button
                        type="button"
                        className="button secondary small-button"
                        onClick={() => stageSql(activeChallenge.solutionSql)}
                        disabled={busy || booting}
                      >
                        {t('Put solution in editor', 'Đưa lời giải vào Editor')}
                      </button>
                    </div>
                  )}
                </div>

                {challengeCheckSuccess && (
                  <div className="challenge-success-callout">
                    <CheckCircle2 size={18} className="mint" />
                    <div className="callout-content">
                      <strong>{t('Challenge passed!', 'Hoàn thành đề bài!')}</strong>
                      <p>{t('Your SQL query produced the exact expected dataset.', 'Câu truy vấn của bạn cho kết quả hoàn toàn chính xác.')}</p>
                    </div>
                    {nextChallenge && (
                      <button
                        type="button"
                        className="button small-button"
                        onClick={() => selectChallenge(nextChallenge.id)}
                      >
                        {t('Next challenge →', 'Đề bài tiếp theo →')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="panel-body">
                <h3>{t('Your sandbox', 'Tự do khám phá')}</h3>
                <p>{t('Query the commerce data, add an index, and observe what changes. Or choose a challenge above to practice specific SQL lessons.', 'Truy vấn dữ liệu bán hàng, thêm index và quan sát điều gì thay đổi. Hoặc chọn một đề bài bên trên để thực hành theo bài học.')}</p>
                <div className="sandbox-free-quickstarts">
                  <div className="panel-label">{t('RECOMMENDED CHALLENGES', 'ĐỀ BÀI THỰC HÀNH GỢI Ý')}</div>
                  {sqlSandboxChallenges.slice(0, 4).map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="quickstart-item"
                      onClick={() => selectChallenge(c.id)}
                    >
                      <span className="item-num">{String(c.number).padStart(2, '0')}</span>
                      <span className="item-title">{c.title[locale === 'vi' ? 1 : 0]}</span>
                      <span className={`level-chip ${c.level}`}>{c.level === 'basic' ? t('Basic', 'Cơ bản') : c.level === 'intermediate' ? t('Intermediate', 'Trung cấp') : t('Advanced', 'Nâng cao')}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="lesson-pane panel-body" id="lesson-pane-help" role="tabpanel" aria-labelledby="lesson-tab-help" tabIndex={0} hidden={lessonTab!=='help'}>
            {displayedLab && <>
              <div className="panel-label">{t('NEED A NUDGE?', 'CẦN GỢI Ý?')}</div>
              <button className="hint-button" disabled={hints >= displayedLab.hints.length} onClick={revealHint}><Lightbulb size={14} />{hintLabel}<span className="muted" style={{ marginLeft: 'auto' }}>{hints}/{displayedLab.hints.length}</span></button>
              {displayedLab.hints.slice(0, hints).map((hint, index) => <div className="hint-text" key={index}><strong>{t('Hint ', 'Gợi ý ')}{index + 1}.</strong> {hint}</div>)}
              {!interviewMode && <button className="solution-button" disabled={busy||booting} onClick={() => setShowSolutionConfirm(!showSolutionConfirm)}><LockKeyhole size={13} />{solutionUsed ? t('Load solution again', 'Nạp lại lời giải') : t('Show a worked solution', 'Xem lời giải mẫu')}</button>}
              {showSolutionConfirm && <div className="solution-confirm">
                <p>{t('Seeing the solution caps this lab at 40 XP. Try the hints first if you’d like to solve it yourself.', 'Xem lời giải sẽ giới hạn điểm bài này ở 40 XP. Hãy thử các gợi ý trước nếu muốn tự giải.')}</p>
                <button className="button secondary" disabled={busy||booting} onClick={() => { setSolutionUsed(true); stageSql(lab!.solutionSql); setShowSolutionConfirm(false); track('solution_opened', id); }}>{t('Load solution', 'Nạp lời giải')}</button>
              </div>}
              <div className="panel-label">{t('WHAT YOU’LL LEARN', 'BẠN SẼ HỌC ĐƯỢC')}</div>
              {displayedLab.goals.map((goal, index) => <div key={index} className="goal-item"><Check size={13} /><span>{goal}</span></div>)}
            </>}
          </div>
          <section className="lesson-pane schema-section" id="lesson-pane-schema" role="tabpanel" aria-labelledby="lesson-tab-schema" tabIndex={0} hidden={lessonTab!=='schema'}>
            <div className="panel-label">{t('DATASET · ECOMMERCE', 'DỮ LIỆU · THƯƠNG MẠI ĐIỆN TỬ')}</div>
            {Object.entries(lab?.id==='partition-014'?{...schema,orders_partitioned:partitionSchema}:schema).map(([table, fields]) => <details key={table} open={table === 'orders' || table === 'orders_partitioned'}>
              <summary><Database size={13} />{table}<span className="muted" style={{ marginLeft: 'auto' }}>{formatNumber(table === 'orders' || table === 'orders_partitioned' ? effectiveSize : table === 'order_items' ? effectiveSize * 2 : table === 'customers' ? 1000 : 100)}</span></summary>
              <ul>{fields.map(([column, type]) => <li key={column}>{column}<span>{type}</span></li>)}</ul>
            </details>)}
            <div className="panel-label">{t('ACTIVE INDEXES', 'CHỈ MỤC HIỆN CÓ')}</div>
            {result?.indexes.filter(index => !index.name.endsWith('_pkey')).length ? result.indexes.filter(index => !index.name.endsWith('_pkey')).map(index => <p key={index.name} className="small mint mono" style={{ overflowWrap: 'anywhere', margin: '7px 0' }}>{index.name}</p>) : <p className="small muted">{t('Primary keys only', 'Chỉ có chỉ mục khóa chính')}</p>}
          </section>
        </aside>
        <div className="lab-workbench">
          {displayedLab?.incidentQueries && <details className="incident-console"><summary>{t('Incident logs · choose a query', 'Nhật ký sự cố · chọn truy vấn')}</summary>
            <div className="eyebrow orange-text">{t('INCIDENT #001 · SCENARIO TELEMETRY', 'SỰ CỐ #001 · SỐ LIỆU TÌNH HUỐNG')}</div>
            <h3 style={{ marginTop: 10 }}>{t('Orders API is slow.', 'API đơn hàng đang chậm.')}</h3>
            <div className="scenario-metrics"><span>p95 <strong>{t('4.7 s', '4,7 giây')}</strong></span><span>CPU <strong>91%</strong></span><span>{t('Connections', 'Kết nối')} <strong>187</strong></span></div>
            <p className="small muted">{t('Scenario values are illustrative. Run the logs below to measure your local database.', 'Số liệu tình huống chỉ để minh họa. Chạy các truy vấn bên dưới để đo cơ sở dữ liệu trên thiết bị của bạn.')}</p>
            {displayedLab.incidentQueries.map(query => <div className="incident-query" key={query.id}>
              <div><strong className="mono">{query.endpoint}</strong><span className="muted"> · {query.callsPerMinute} {t('calls / min', 'lượt gọi / phút')}</span><p>{query.observation}</p></div>
              <button onClick={() => stageSql(query.sql)} disabled={busy||booting}>{t('Inspect query', 'Khảo sát truy vấn')}</button>
            </div>)}
          </details>}
          {!lab && !nativeMode && <label className="dataset-select">{t('Real dataset size', 'Kích thước dữ liệu thực')}<select value={size} disabled={busy || booting} onChange={event => setSize(Number(event.target.value) as DatasetSize)}>
            {[10000, 50000, 100000].map(count => <option key={count} value={count}>{formatNumber(count)} {t('orders', 'đơn hàng')}</option>)}
          </select><span className="badge">{t('REAL EXECUTION', 'THỰC THI THẬT')}</span></label>}
          <section className="editor-panel">
            <div className="editor-top">
              <span className="editor-file"><Code2 size={14} />{lab ? lab.id + '.sql' : activeChallenge ? `${activeChallenge.id}.sql` : 'playground.sql'}</span>
              <div className="editor-actions"><button onClick={()=>setResetConfirm(true)} disabled={busy || booting} aria-label={t('Reset database', 'Đặt lại cơ sở dữ liệu')}><RotateCcw size={13} />{t('Reset', 'Đặt lại')}</button></div>
            </div>
            <div className="sql-editor-body"><SqlEditor value={sql} onChange={setSql} onRun={run} disabled={busy || booting} /></div>
            <div className="editor-bottom">
              <span>{booting ? <LoaderCircle size={12} className="loading-spinner" /> : <ShieldCheck size={12} />} {booting ? t('Preparing the lab and its baseline…', 'Đang chuẩn bị bài và mốc so sánh…') : ready ? t('Ready', 'Sẵn sàng') : t('Session stopped · reset to recover', 'Phiên đã dừng · đặt lại để khôi phục')}</span>
              <div>
                <kbd>⌘ / Ctrl + Enter</kbd>
                {activeChallenge && (
                  <button
                    type="button"
                    className="button secondary challenge-check-btn"
                    onClick={checkChallenge}
                    disabled={busy || booting || !ready}
                    title={t('Validate query against reference solution', 'Chấm bài đối chiếu kết quả')}
                  >
                    <CheckCircle2 size={14} className="mint" />
                    {t('Check solution', 'Chấm bài')}
                  </button>
                )}
                {lab && <button className="button secondary" onClick={validate} disabled={busy||booting||!ready||!hasRun}><CheckCircle2 size={14}/>{interviewMode ? t('Submit answer', 'Nộp đáp án') : t('Check solution', 'Chấm bài')}</button>}
                {(busy||booting)&&<button className="button secondary" onClick={cancel}><Square size={12}/>{t('Stop', 'Dừng')}</button>}
                <button className="button" onClick={run} disabled={busy || booting || !ready}>{busy ? <LoaderCircle size={14} className="loading-spinner" /> : <Play size={13} fill="currentColor" />}{busy ? t('Running…', 'Đang chạy…') : t('Run and analyze', 'Chạy và phân tích')}</button>
              </div>
            </div>
          </section>
          {error && <div className="error-banner" role="alert"><TriangleAlert size={17} /><div>{displayMessage(error)}{!ready && !booting && <button className="button secondary" style={{ display: 'flex', marginTop: 9 }} onClick={reset} disabled={busy}>{t('Rebuild database', 'Tạo lại cơ sở dữ liệu')}</button>}</div></div>}
          {notice && <div className="info-banner" role="status"><CheckCircle2 size={16} />{displayMessage(notice)}</div>}
          {lab && <>
            {checks.length > 0 && <div className="validation-list" aria-live="polite">{checks.map((check, index) => <div key={index} className={check.passed ? 'pass' : 'fail'}>{check.passed ? <Check size={14} /> : <TriangleAlert size={14} />}<span>{displayMessage(check.message)}</span></div>)}</div>}
            {completed && <div className="success-banner" role="status"><Award size={19} /><div><strong>{t('Lab complete. That’s a breakthrough.', 'Hoàn thành bài thực hành. Bạn đã tiến thêm một bước.')}</strong>{progress.completed[id]?.xp ?? (solutionUsed ? Math.min(40, lab.xp) : lab.xp)} {t('XP earned · Your progress is saved on this device.', 'XP đã nhận · Tiến độ được lưu trên thiết bị này.')}</div>{next && !interviewMode && <Link className="button" href={'/labs/' + next.id}>{t('Next lab', 'Bài tiếp theo')}</Link>}</div>}
          </>}
          <section className="output-panel">
            <div className="output-tabs" role="tablist" aria-label={t('Query output', 'Kết quả truy vấn')}>{tabs.map(({ id: name, label, Icon }) => <button key={name} role="tab" aria-selected={tab === name} tabIndex={tab === name ? 0 : -1} onKeyDown={event => {
              const names = tabs.map(item => item.id); let index = names.indexOf(tab);
              if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
              else if (event.key === 'ArrowLeft') index = (index + tabs.length - 1) % tabs.length;
              else if (event.key === 'Home') index = 0;
              else if (event.key === 'End') index = tabs.length - 1;
              else return;
              event.preventDefault(); setTab(names[index]); document.getElementById('tab-' + names[index].replace(/ /g, '-'))?.focus();
            }} id={'tab-' + name.replace(/ /g, '-')} aria-controls="output-panel" onClick={() => setTab(name)}><Icon size={14} />{label}</button>)}</div>
            <div className="output-area" role="tabpanel" id="output-panel" aria-labelledby={'tab-' + tab.replace(/ /g, '-')} tabIndex={0}>
              {!result || !hasRun ? <div className="result-placeholder"><SquareTerminal size={28} /><h3>{booting ? t('Preparing PostgreSQL', 'Đang chuẩn bị PostgreSQL') : t('Your next discovery starts here', 'Bắt đầu khám phá tại đây')}</h3><p>{booting ? t('Generating a deterministic e-commerce dataset.', 'Đang tạo bộ dữ liệu thương mại điện tử cố định.') : t('Run a query to inspect its results and execution plan.', 'Chạy truy vấn để xem kết quả và kế hoạch thực thi.')}</p></div> : tab === 'Overview' ? <><QueryInvestigation result={result} baseline={baseline} labId={lab?.id} onStageSql={stageSql} disabled={busy||booting} mode={nativeMode?'native':'browser'}/><details className="measurement-details"><summary>{t('Measurement details', 'Chi tiết số đo')}</summary><Performance result={result} baseline={baseline} browserMs={browserMs} native={nativeMode}/></details></> : tab === 'Result' ? <Results result={result} /> : tab === 'Execution plan' ? <ExecutionPlan result={result} /> : <Explanation result={result} lab={displayedLab} />}
            </div>
          </section>
          {!interviewMode && <details className="concept-visualization"><summary>{t('Explore the conceptual scan/index model', 'Xem mô hình minh họa scan/index')}</summary><section className="visualization">
            <div className="visualization-heading"><span>{t('How a scan/index can find data', 'Scan/index có thể tìm dữ liệu như thế nào')}</span><span className="badge">{t('TEACHING MODEL', 'MÔ HÌNH GIẢNG DẠY')}</span></div>
            <div className="visualization-body">
              {isIndexed ? <div className="large-tree"><div className="tree-key">{t('B-tree root', 'Gốc B-tree')}</div><div className="tree-stems" /><div className="tree-branches"><div className="tree-key dim">{t('lower values', 'giá trị nhỏ hơn')}</div><div className="tree-key selected">{t('matching range', 'khoảng phù hợp')}</div><div className="tree-key dim">{t('higher values', 'giá trị lớn hơn')}</div></div><div className="tree-stem" /><div className="tree-key target">{t('matching index entries', 'mục chỉ mục phù hợp')}</div></div> : <div className="viz-table">{Array.from({ length: 72 }, (_, index) => <span key={index} className={index === 25 || index === 54 ? 'match' : ''} style={{ animationDelay: index * 8 + 'ms' }} />)}</div>}
              <p className="viz-caption">{isIndexed ? t('The captured plan contains index access. The amount of work depends on its conditions and loops.', 'Plan ghi nhận truy cập index. Lượng công việc phụ thuộc điều kiện và số vòng lặp.') : t('This illustration shows the idea of checking rows in a scan.', 'Hình minh họa ý tưởng kiểm tra các dòng khi quét.')} {t('Teaching model, not a physical trace of this query.', 'Mô hình giảng dạy, không phải trace vật lý của query này.')}</p>
            </div>
          </section><ScaleSimulation base={baseline} realRows={effectiveSize} /></details>}
          <div className="lab-nav"><Link href="/learn">{t('Back to learning path', 'Quay lại lộ trình học')}</Link>{next && <Link href={'/labs/' + next.id}>{t('Up next: ', 'Tiếp theo: ')}{displayedNext?.title}</Link>}</div>
        </div>
      </div>
      {resetConfirm && <div className="reset-overlay"><section className="reset-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title"><h2 id="reset-title">{t('Reset this lab?', 'Đặt lại bài thực hành?')}</h2><p>{t('This replaces the editor draft and clears learning indexes. Native mode rebuilds the dedicated lab dataset; browser mode rebuilds its RAM database. Saved learning progress stays on this device.', 'Thao tác thay nội dung editor và xóa index thực hành. Chế độ native tạo lại dataset lab riêng; browser tạo lại database trong RAM. Tiến độ học đã lưu được giữ trên thiết bị.')}</p><div><button className="button secondary" autoFocus onClick={()=>setResetConfirm(false)}>{t('Keep my work', 'Giữ nội dung')}</button><button className="button" onClick={reset}>{t('Reset lab', 'Đặt lại bài')}</button></div></section></div>}
    </main>
  </Shell>;
}
function Results({ result }: { result: QueryResult }) {
  const { locale, t, formatNumber } = useLocale();
  return <>
    <div className="result-status"><span>{formatNumber(result.returnedRowCount)} {result.explained ? t('plan document', 'tài liệu kế hoạch') : t('rows returned', 'dòng trả về')}{result.previewTruncated ? t(' · preview limited to 200 rows / 2,000 characters per cell', ' · xem trước tối đa 200 dòng / 2.000 ký tự mỗi ô') : ''}</span><span className="badge">{t('REAL EXECUTION', 'THỰC THI THẬT')}</span></div>
    <div className="table-scroll"><table className="result-table"><thead><tr><th className="row-num">#</th>{result.fields.map((field, index) => <th key={index}>{field.name}</th>)}</tr></thead><tbody>{result.rows.map((row, index) => <tr key={index}><td className="row-num">{index + 1}</td>{row.map((value, column) => <td key={column} title={cell(value)}>{value === null ? <span className="muted">NULL</span> : cell(value)}</td>)}</tr>)}</tbody></table>{!result.rows.length && <div className="empty-state">{result.message ? localizeEngineMessage(result.message, locale) : t('Query ran successfully. No matching rows.', 'Truy vấn chạy thành công. Không có dòng phù hợp.')}</div>}</div>
  </>;
}

function ExecutionPlan({ result }: { result: QueryResult }) {
  const { t } = useLocale();
  return <div className="plan-content">
    <div className="plan-summary"><Waypoints size={15} />{result.metrics?.scanTypes.join(' + ') || t('Query plan', 'Kế hoạch truy vấn')}<span className="badge">EXPLAIN ANALYZE</span></div>
    {result.plan && <PlanTree node={result.plan.Plan} />}
    <details className="raw-plan"><summary>{t('View raw PostgreSQL JSON plan', 'Xem kế hoạch JSON gốc từ PostgreSQL')}</summary><pre>{JSON.stringify(result.plan, null, 2)}</pre></details>
  </div>;
}

function PlanTree({ node }: { node: PlanNode }) {
  const { t, formatNumber } = useLocale();
  return <div className="plan-node">
    <div className="node-name"><span className="tiny-square" />{node['Node Type']}{node['Relation Name'] && ' · ' + node['Relation Name']}</div>
    <p>{node['Index Name'] && t('Index: ', 'Chỉ mục: ') + node['Index Name'] + ' · '}{formatNumber(Number(node['Actual Rows'] || 0))} {t('rows / loop', 'dòng / vòng lặp')} · {node['Actual Loops'] || 0} {t('loops', 'vòng lặp')} · {t('cost', 'chi phí')} {formatNumber(Number(node['Total Cost'] || 0))}{node['Rows Removed by Filter'] ? ' · ' + formatNumber(Number(node['Rows Removed by Filter'])) + t(' removed by filter', ' bị loại bởi bộ lọc') : ''}</p>
    {node.Plans?.map((child, index) => <PlanTree key={index} node={child} />)}
  </div>;
}

function Performance({ result, baseline, browserMs, native = false }: { result: QueryResult; baseline: QueryResult | null; browserMs: number; native?: boolean }) {
  const { locale, t, formatNumber } = useLocale();
  const metrics = result.metrics;
  const before = baseline?.metrics;
  const cost = new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(metrics?.estimatedCost || 0);
  return <div className="performance-content">
    <div className="performance-metrics">
      <div><strong>{ms(metrics?.executionMs || 0, locale)}</strong><label>{t('Execution time', 'Thời gian thực thi')}</label><small>{t('Measured by PostgreSQL', 'Được đo bởi PostgreSQL')}</small></div>
      <div><strong>{formatNumber(metrics?.heapRowsVisitedApprox || 0)}</strong><label>{t('Heap row visits ≈', 'Lượt đọc dòng heap ≈')}</label><small>{t('From executor counters', 'Từ bộ đếm thực thi')}</small></div>
      <div><strong>{cost}</strong><label>{t('Estimated planner cost', 'Chi phí ước tính của kế hoạch')}</label><small>{t('Cost units, not milliseconds', 'Đơn vị chi phí, không phải mili giây')}</small></div>
    </div>
    {before && metrics && <div className="before-after">
      <h4>{t('Heap access compared with the initial query', 'So sánh truy cập heap với truy vấn ban đầu')}</h4>
      <div className="compare-bars"><span>{t('Before', 'Trước')}</span><span className="bar" /><span>{formatNumber(before.heapRowsVisitedApprox)}</span></div>
      <div className="compare-bars"><span>{t('Now', 'Hiện tại')}</span><span className="bar after" style={{ width: Math.max(1, Math.min(80, (metrics.heapRowsVisitedApprox / Math.max(1, before.heapRowsVisitedApprox)) * 80)) + '%' }} /><span>{formatNumber(metrics.heapRowsVisitedApprox)}</span></div>
    </div>}
    <p>{t('Planning: ', 'Lập kế hoạch: ')}{ms(metrics?.planningMs || 0, locale)} · {native ? t('Connector round trip: ', 'Thời gian qua connector: ') : t('Browser round trip: ', 'Thời gian xử lý qua trình duyệt: ')}{browserMs ? ms(browserMs, locale) : t('initial run', 'lần chạy đầu')} · {t('Index entries returned ≈ ', 'Mục chỉ mục trả về ≈ ')}{formatNumber(metrics?.indexEntriesReturnedApprox || 0)}</p>
    <p>{native ? t('Plans are measured by your native PostgreSQL. Connector round trips include relay and preview overhead. Heap visits are approximate executor counters; buffers do not by themselves measure physical disk I/O or CPU.', 'Plan được đo bởi PostgreSQL native của bạn. Thời gian qua connector gồm relay và preview. Lượt đọc heap là bộ đếm ước tính; buffers không tự đo I/O đĩa vật lý hay CPU.') : t('Queries run locally. Timings vary with your device and warm caches. Heap visits are approximate per-loop executor counts; index-only scans can avoid heap reads. Disk I/O and production CPU are not measured here.', 'Truy vấn chạy trên thiết bị của bạn. Thời gian thay đổi theo thiết bị và bộ nhớ đệm. Lượt đọc heap được ước tính từ bộ đếm mỗi vòng lặp; quét chỉ mục có thể tránh đọc heap. Công cụ này không đo I/O đĩa hay CPU của hệ thống thực tế.')}</p>
  </div>;
}

function Explanation({ result, lab }: { result: QueryResult; lab?: Lab }) {
  const { t, formatNumber } = useLocale();
  const metrics = result.metrics;
  const indexed = !!metrics?.indexNames.length;
  return <div className="explanation-content">
    <h3>{t('What PostgreSQL actually did', 'PostgreSQL thực sự đã làm gì')}</h3>
    <ol>
      <li>{t('The captured plan uses ', 'Kế hoạch thực thi ghi nhận sử dụng ')}<code>{metrics?.scanTypes.join(' + ') || result.plan?.Plan['Node Type'] || t('the query planner', 'bộ lập kế hoạch truy vấn')}</code>.</li>
      <li>{indexed ? t('PostgreSQL selected ', 'PostgreSQL chọn ') + metrics?.indexNames.join(', ') + t(' as access paths for this execution.', ' làm cách truy cập trong lần chạy này.') : t('The captured plan does not use an index. Sequential access can be appropriate when much of a table is needed; the plan alone does not prove a missing index.', 'Plan ghi nhận không dùng index. Quét tuần tự có thể hợp lý khi cần nhiều dữ liệu; riêng dấu hiệu này chưa chứng minh thiếu index.')}</li>
      <li>{t('The query produced ', 'Truy vấn trả về ')}{formatNumber(metrics?.actualRows || 0)} {t('rows, with approximately ', 'dòng, với khoảng ')}{formatNumber(metrics?.heapRowsVisitedApprox || 0)} {t('heap row visits.', 'lượt đọc dòng heap.')}</li>
      <li>{indexed ? t('Every index also takes space and must be maintained during writes. Faster reads come with a tradeoff.', 'Mỗi chỉ mục chiếm dung lượng và cần được cập nhật khi ghi dữ liệu. Đọc nhanh hơn đi kèm chi phí bảo trì.') : t('Look at the WHERE clause and how selective it is. An index can help PostgreSQL locate a small matching range.', 'Xem điều kiện WHERE và mức độ chọn lọc của nó. Chỉ mục có thể giúp PostgreSQL tìm khoảng dữ liệu nhỏ phù hợp.')}</li>
    </ol>
    {lab && <>
      <h3 style={{ marginTop: 21 }}>{t('The concept', 'Kiến thức cốt lõi')}</h3><p>{lab.concept}</p>
      <h3 style={{ marginTop: 18 }}>{t('In the real world', 'Ứng dụng thực tế')}</h3><p>{lab.realWorldScenario}</p>
      <Link className="mint" style={{ fontSize: 13 }} href={'/data/sql/' + lab.slug}>{t('Read the concept notes', 'Đọc tài liệu kiến thức')}</Link>
    </>}
    <p className="small muted">{t('Rule-based explanation from your actual plan. No AI request is made.', 'Giải thích theo quy tắc từ kế hoạch thực thi thực tế. Không gửi yêu cầu đến AI.')}</p>
  </div>;
}

function ScaleSimulation({ base, realRows }: { base: QueryResult | null; realRows: number }) {
  const { locale, t, formatNumber } = useLocale();
  const [power, setPower] = useState(6);
  const rows = 10 ** power;
  const scan = Math.max(.1, base?.metrics?.executionMs || 5) * rows / realRows;
  const lookup = Math.max(.01, Math.log2(rows) / Math.log2(realRows) * .15);
  return <section className="scale-panel">
    <label htmlFor="scale">{t('What happens as data grows?', 'Điều gì xảy ra khi dữ liệu tăng?')}<span className="badge">{t('SIMULATION · ESTIMATED', 'MÔ PHỎNG · ƯỚC TÍNH')}</span></label>
    <input id="scale" type="range" min={4} max={9} step={1} value={power} onChange={event => setPower(Number(event.target.value))} aria-label={t('Simulated dataset size', 'Kích thước dữ liệu mô phỏng')} />
    <div className="scale-summary"><div><span className="muted">{formatNumber(rows)} {t('rows · scan estimate', 'dòng · ước tính thời gian quét')}</span><strong className="orange-text">{ms(scan, locale)}</strong></div><div><span className="muted">{t('B-tree lookup model', 'Mô hình tra cứu B-tree')}</span><strong className="mint">{ms(lookup, locale)}</strong></div></div>
    <p>{t('Illustrative linear scan / logarithmic lookup model. No SQL runs at this scale. Estimates exclude I/O, cache, result size, and concurrent traffic.', 'Mô hình minh họa quét tuyến tính / tra cứu logarit. Không thực thi SQL ở quy mô này. Ước tính chưa tính I/O, bộ nhớ đệm, kích thước kết quả và tải đồng thời.')}</p>
  </section>;
}
function cell(value: unknown) { return typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? 'NULL'); }
function ms(value: number, locale: Locale) {
  const seconds = value >= 1000;
  const precision = !seconds && value < 1 ? 3 : 2;
  const formatted = new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { minimumFractionDigits: precision, maximumFractionDigits: precision }).format(seconds ? value / 1000 : value);
  return formatted + (seconds ? (locale === 'vi' ? ' giây' : ' s') : ' ms');
}
function errorText(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong. Reset your database and try again.'; }
