'use client';

import { useMemo, useState } from 'react';
import {
  Server,
  BarChart3,
  Cpu,
  Gauge,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Search,
  Building2,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
  Terminal,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import {
  interviewRoles,
  interviewLevels,
  enterpriseQuestions,
  type InterviewRole,
  type InterviewLevel,
  type QuestionCategory,
  type EnterpriseScenarioQuestion,
} from '@/content/interview-data';
import { useLocale } from '@/lib/i18n';
import { Shell } from './shell';

const roleIcons: Record<InterviewRole, React.ComponentType<{ size?: number; className?: string }>> = {
  backend: Server,
  'data-analyst': BarChart3,
  'data-engineer': Cpu,
  dba: Gauge,
};

export function Interview() {
  const { locale, t } = useLocale();

  // Selected target role (null = Stage 1: Role Picker, string = Stage 2: Interview Room)
  const [selectedRole, setSelectedRole] = useState<InterviewRole | null>(null);

  // Filters within Stage 2
  const [selectedLevel, setSelectedLevel] = useState<InterviewLevel | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive UI state for questions
  const [openQuestions, setOpenQuestions] = useState<Record<string, boolean>>({});
  const [scratchpads, setScratchpads] = useState<Record<string, string>>({});
  const [masteredMap, setMasteredMap] = useState<Record<string, boolean>>({});

  // Filtered questions for active role
  const filteredQuestions = useMemo(() => {
    if (!selectedRole) return [];
    return enterpriseQuestions.filter((q) => {
      if (q.role !== selectedRole) return false;
      if (selectedLevel !== 'all' && q.level !== selectedLevel) return false;
      if (selectedCategory !== 'all' && q.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = q.title.en.toLowerCase().includes(query) || q.title.vi.toLowerCase().includes(query);
        const narrativeMatch =
          q.scenarioNarrative.en.toLowerCase().includes(query) ||
          q.scenarioNarrative.vi.toLowerCase().includes(query);
        const questionMatch =
          q.question.en.toLowerCase().includes(query) || q.question.vi.toLowerCase().includes(query);
        const tagMatch = q.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!titleMatch && !narrativeMatch && !questionMatch && !tagMatch) return false;
      }
      return true;
    });
  }, [selectedRole, selectedLevel, selectedCategory, searchQuery]);

  // Mastered counts for progress tracking
  const roleTotalCount = useMemo(() => {
    if (!selectedRole) return 0;
    return enterpriseQuestions.filter((q) => q.role === selectedRole).length;
  }, [selectedRole]);

  const roleMasteredCount = useMemo(() => {
    if (!selectedRole) return 0;
    return enterpriseQuestions.filter((q) => q.role === selectedRole && masteredMap[q.id]).length;
  }, [selectedRole, masteredMap]);

  function toggleQuestion(id: string) {
    setOpenQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleMastered(id: string) {
    setMasteredMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleScratchpadChange(id: string, value: string) {
    setScratchpads((prev) => ({ ...prev, [id]: value }));
  }

  const currentRoleMeta = selectedRole ? interviewRoles.find((r) => r.id === selectedRole) : null;

  return (
    <Shell title={t('Interview practice', 'Luyện phỏng vấn')}>
      <main className="simple-page interview-hub">
        {/* ========================================================
            STAGE 1: Clean, Visual Role Selection (Initial Landing)
            ======================================================== */}
        {!selectedRole && (
          <div className="interview-stage-role-picker">
            <div className="eyebrow mint">
              <Sparkles size={13} />
              {t('ENTERPRISE DATA & SYSTEM DESIGN INTERVIEWS', 'PHỎNG VẤN DỮ LIỆU & KIẾN TRÚC DOANH NGHIỆP')}
            </div>
            <h1 className="role-picker-hero-title">
              {t('Select Your Target Role.', 'Chọn vị trí ứng tuyển mục tiêu.')}
            </h1>
            <p className="lead role-picker-lead">
              {t(
                'Enter an interactive mock interview room driven by real enterprise business challenges. Zero trivia memorization—each question guides you through real production problems, solution architectures, and hiring manager evaluation rubrics.',
                'Bước vào phòng phỏng vấn giả lập với các tình huống dẫn dắt từ doanh nghiệp thực tế. Không hỏi lý thuyết suông—mỗi bài toán đưa bạn vào bối cảnh sự cố cụ thể, dàn bài trả lời điểm 10 và bảng tiêu chí đánh giá của nhà tuyển dụng.'
              )}
            </p>

            <div className="giant-roles-grid">
              {interviewRoles.map((role) => {
                const Icon = roleIcons[role.id];
                const count = enterpriseQuestions.filter((q) => q.role === role.id).length;

                return (
                  <div
                    key={role.id}
                    className="giant-role-card"
                    onClick={() => setSelectedRole(role.id)}
                  >
                    <div className="giant-role-top">
                      <div className="giant-role-icon" style={{ color: role.color }}>
                        <Icon size={24} />
                      </div>
                      <span className="giant-role-badge">{role.shortTag}</span>
                      <span className="giant-role-count">
                        {count} {t('enterprise cases', 'bài toán thực chiến')}
                      </span>
                    </div>

                    <h3>{locale === 'vi' ? role.name.vi : role.name.en}</h3>
                    <p className="giant-role-tagline">
                      {locale === 'vi' ? role.tagline.vi : role.tagline.en}
                    </p>
                    <p className="giant-role-desc">
                      {locale === 'vi' ? role.description.vi : role.description.en}
                    </p>

                    <div className="giant-role-skills">
                      {role.skills.map((skill) => (
                        <span key={skill} className="giant-skill-pill">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="giant-role-footer">
                      <button className="giant-role-cta" style={{ background: role.color }}>
                        <span>{t('Start Mock Interview', 'Bắt đầu luyện phỏng vấn')}</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Sandbox Banner */}
            <div className="interview-sandbox-callout">
              <div className="sandbox-callout-icon">
                <Terminal size={20} className="mint" />
              </div>
              <div className="sandbox-callout-content">
                <h4>{t('Looking for hands-on SQL execution?', 'Bạn muốn tự tay thực hành gõ lệnh SQL?')}</h4>
                <p>
                  {t(
                    'Practice live queries and explain analyze plans on our browser-based PostgreSQL engine.',
                    'Luyện tập viết truy vấn và phân tích Execution Plan trên cơ sở dữ liệu PostgreSQL ngay trên trình duyệt.'
                  )}
                </p>
              </div>
              <Link href="/playground" className="button secondary small-btn">
                <Terminal size={14} />
                {t('Open SQL Sandbox', 'Mở SQL Sandbox')}
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================
            STAGE 2: Interactive Interview Room (Role Selected)
            ======================================================== */}
        {selectedRole && currentRoleMeta && (
          <div className="interview-stage-room">
            {/* Header with back button & role badge */}
            <div className="interview-room-nav">
              <button className="back-role-btn" onClick={() => setSelectedRole(null)}>
                <ArrowLeft size={16} />
                <span>{t('Change target role', 'Đổi vị trí ứng tuyển')}</span>
              </button>

              <div className="room-role-indicator">
                <span className="room-role-pill" style={{ borderColor: currentRoleMeta.color, color: currentRoleMeta.color }}>
                  {currentRoleMeta.shortTag}
                </span>
                <h2>{locale === 'vi' ? currentRoleMeta.name.vi : currentRoleMeta.name.en}</h2>
              </div>

              {/* Progress indicator */}
              <div className="room-progress-box">
                <div className="progress-labels">
                  <span>{t('Mastery Progress:', 'Tiến độ ôn luyện:')}</span>
                  <strong>
                    {roleMasteredCount} / {roleTotalCount} {t('mastered', 'đã nắm vững')}
                  </strong>
                </div>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${roleTotalCount > 0 ? (roleMasteredCount / roleTotalCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="interview-room-toolbar">
              {/* Level Filter */}
              <div className="room-filter-row">
                <label>{t('Level:', 'Cấp bậc:')}</label>
                <div className="pill-filters">
                  <button
                    className={`pill-btn ${selectedLevel === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedLevel('all')}
                  >
                    {t('All Levels', 'Tất cả')}
                  </button>
                  {interviewLevels.map((lvl) => (
                    <button
                      key={lvl.id}
                      className={`pill-btn ${selectedLevel === lvl.id ? 'active' : ''}`}
                      onClick={() => setSelectedLevel(lvl.id)}
                    >
                      {lvl.badge} ({lvl.exp})
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="room-filter-row">
                <label>{t('Focus Area:', 'Trọng tâm:')}</label>
                <div className="pill-filters">
                  <button
                    className={`pill-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    {t('All Focus Areas', 'Tất cả')}
                  </button>
                  <button
                    className={`pill-btn ${selectedCategory === 'foundational' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('foundational')}
                  >
                    {t('Core Concepts', 'Cơ bản có dẫn dắt')}
                  </button>
                  <button
                    className={`pill-btn ${selectedCategory === 'architecture' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('architecture')}
                  >
                    {t('System Architecture', 'Kiến trúc hệ thống')}
                  </button>
                  <button
                    className={`pill-btn ${selectedCategory === 'incident' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('incident')}
                  >
                    {t('Production Incidents', 'Sự cố Production')}
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="room-search-box">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder={t('Search enterprise scenario, question, or tag...', 'Tìm kiếm tình huống, câu hỏi hoặc tag...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="room-search-input"
                />
              </div>
            </div>

            {/* Questions Stream */}
            <div className="interview-questions-stream">
              {filteredQuestions.length === 0 ? (
                <div className="empty-questions-state">
                  <HelpCircle size={32} className="muted" />
                  <h3>{t('No scenarios match your filter criteria', 'Không tìm thấy câu hỏi phù hợp bộ lọc')}</h3>
                  <p>
                    {t(
                      'Try resetting your search query or selecting "All Levels" to view available enterprise questions.',
                      'Hãy thử xóa từ khóa tìm kiếm hoặc chọn "Tất cả cấp bậc" để xem các câu hỏi sẵn có.'
                    )}
                  </p>
                  <button
                    className="button secondary"
                    onClick={() => {
                      setSelectedLevel('all');
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                  >
                    <RotateCcw size={14} />
                    {t('Reset all filters', 'Đặt lại bộ lọc')}
                  </button>
                </div>
              ) : (
                filteredQuestions.map((q, index) => {
                  const isOpen = openQuestions[q.id];
                  const isMastered = masteredMap[q.id];
                  const scratchpadValue = scratchpads[q.id] || '';

                  return (
                    <article key={q.id} className={`scenario-question-card ${isMastered ? 'mastered' : ''}`}>
                      {/* Card Header */}
                      <div className="scenario-card-header">
                        <div className="scenario-card-badges">
                          <span className="badge-company">
                            <Building2 size={12} />
                            {q.companyContext}
                          </span>
                          <span className={`badge-level level-${q.level}`}>
                            {q.difficulty}
                          </span>
                          <span className="badge-category">
                            {q.category === 'incident'
                              ? t('Incident Case', 'Sự cố nóng')
                              : q.category === 'architecture'
                              ? t('System Architecture', 'Kiến trúc')
                              : t('Core Concept', 'Cơ bản')}
                          </span>
                        </div>

                        {/* Mastered Checkbox Button */}
                        <button
                          className={`mastery-toggle-btn ${isMastered ? 'active' : ''}`}
                          onClick={() => toggleMastered(q.id)}
                          title={isMastered ? t('Mark as unlearned', 'Bỏ đánh dấu') : t('Mark as mastered', 'Đánh dấu đã nắm vững')}
                        >
                          <CheckCircle2 size={16} />
                          <span>{isMastered ? t('Mastered', 'Đã nắm vững') : t('Mark Mastered', 'Đánh dấu')}</span>
                        </button>
                      </div>

                      {/* Question Title */}
                      <h3 className="scenario-title">
                        <span className="scenario-index">#{index + 1}.</span>{' '}
                        {locale === 'vi' ? q.title.vi : q.title.en}
                      </h3>

                      {/* 1. Guided Enterprise Background & Conflict Narrative */}
                      <div className="scenario-narrative-box">
                        <div className="narrative-tag">
                          <AlertTriangle size={13} />
                          <span>{t('ENTERPRISE CONTEXT & PROBLEM NARRATIVE', 'BỐI CẢNH DOANH NGHIỆP & BÀI TOÁN DẪN DẮT')}</span>
                        </div>
                        <p>{locale === 'vi' ? q.scenarioNarrative.vi : q.scenarioNarrative.en}</p>
                      </div>

                      {/* 2. Specific Interviewer Question */}
                      <div className="scenario-question-box">
                        <div className="question-tag">
                          <HelpCircle size={13} />
                          <span>{t('INTERVIEWER QUESTION', 'CÂU HỎI PHỎNG VẤN')}</span>
                        </div>
                        <h4>{locale === 'vi' ? q.question.vi : q.question.en}</h4>
                      </div>

                      {/* 3. Candidate Scratchpad (Self-Think Before Revealing) */}
                      <div className="scenario-scratchpad">
                        <label>
                          <span>{t('Your Thought Process & Key Bullet Points:', 'Ghi chú nhanh ý tưởng trả lời của bạn trước khi xem đáp án:')}</span>
                        </label>
                        <textarea
                          placeholder={t(
                            'Draft your response structure here (e.g. 1. Diagnosis, 2. Immediate hotfix, 3. Architecture fix, 4. Trade-offs)...',
                            'Gõ phác thảo dàn ý trả lời tại đây (vd: 1. Chẩn đoán nguyên nhân, 2. Biện pháp chữa cháy, 3. Giải pháp dài hạn, 4. Đánh đổi)...'
                          )}
                          value={scratchpadValue}
                          onChange={(e) => handleScratchpadChange(q.id, e.target.value)}
                          rows={2}
                          className="scratchpad-textarea"
                        />
                      </div>

                      {/* 4. Reveal Toggle Button */}
                      <div className="scenario-action-bar">
                        <button
                          className="button scenario-reveal-btn"
                          onClick={() => toggleQuestion(q.id)}
                        >
                          <span>
                            {isOpen
                              ? t('Hide Ideal Answer & Rubric', 'Thu gọn lời giải & Tiêu chí')
                              : t('Reveal Ideal Answer & Evaluation Rubric', 'Xem đáp án chuẩn điểm 10 & Tiêu chí đánh giá')}
                          </span>
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>

                      {/* 5. Revealed Solution, Framework, and Rubric */}
                      {isOpen && (
                        <div className="scenario-solution-panel">
                          {/* Dàn bài trả lời điểm 10 */}
                          <div className="solution-framework-card">
                            <div className="framework-header">
                              <Award size={15} className="mint" />
                              <strong>{t('Ideal Answer Framework (Top 1% Candidate)', 'Dàn ý trả lời điểm 10 (Ứng viên xuất sắc)')}</strong>
                            </div>
                            <ul className="framework-list">
                              {(locale === 'vi' ? q.idealAnswerFramework.vi : q.idealAnswerFramework.en).map(
                                (item, i) => (
                                  <li key={i}>
                                    <span className="framework-bullet">{i + 1}</span>
                                    <span>{item}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>

                          {/* Lời giải chi tiết */}
                          <div className="solution-detail-box">
                            <strong>{t('Comprehensive Technical Solution:', 'Giải pháp kỹ thuật chi tiết:')}</strong>
                            <p>{locale === 'vi' ? q.solutionDetail.vi : q.solutionDetail.en}</p>
                          </div>

                          {/* Code Snippet if present */}
                          {q.codeSnippet && (
                            <div className="solution-code-wrapper">
                              <pre>
                                <code>{q.codeSnippet}</code>
                              </pre>
                            </div>
                          )}

                          {/* Architectural Trade-offs */}
                          <div className="solution-tradeoffs-box">
                            <strong>{t('Architectural Trade-offs & Limitations:', 'Đánh đổi kiến trúc & Giới hạn cần lưu ý:')}</strong>
                            <p>{locale === 'vi' ? q.tradeoffs.vi : q.tradeoffs.en}</p>
                          </div>

                          {/* Rubric: Green Flags vs Red Flags */}
                          <div className="rubric-grid">
                            <div className="rubric-box green-flags">
                              <div className="rubric-header">
                                <span className="flag-dot green" />
                                <strong>{t('Green Flags (Senior Takeaways)', 'Green Flags (Điểm cộng lớn)')}</strong>
                              </div>
                              <ul>
                                {(locale === 'vi' ? q.rubric.greenFlags.vi : q.rubric.greenFlags.en).map(
                                  (flag, idx) => (
                                    <li key={idx}>{flag}</li>
                                  )
                                )}
                              </ul>
                            </div>

                            <div className="rubric-box red-flags">
                              <div className="rubric-header">
                                <span className="flag-dot red" />
                                <strong>{t('Red Flags (Avoid These Mistakes)', 'Red Flags (Sai lầm cần tránh)')}</strong>
                              </div>
                              <ul>
                                {(locale === 'vi' ? q.rubric.redFlags.vi : q.rubric.redFlags.en).map(
                                  (flag, idx) => (
                                    <li key={idx}>{flag}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Card Tags */}
                      <div className="scenario-card-tags">
                        {q.tags.map((tag) => (
                          <span key={tag} className="topic-tag">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>
    </Shell>
  );
}
