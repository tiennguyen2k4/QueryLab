'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLocale, T } from '@/lib/i18n';

type LevelOption = 'junior' | 'mid' | 'senior';

interface RoleCardItem {
  code: string;
  roleId: string;
  name: { en: string; vi: string };
  desc: { en: string; vi: string };
}

const roles: RoleCardItem[] = [
  {
    code: 'BE',
    roleId: 'backend',
    name: { en: 'Backend', vi: 'Backend' },
    desc: {
      en: 'Indexes, joins, transactions, query plans.',
      vi: 'Chỉ mục, JOINs, transactions, query plans.',
    },
  },
  {
    code: 'DA',
    roleId: 'data-analyst',
    name: { en: 'Data Analyst', vi: 'Data Analyst' },
    desc: {
      en: 'Aggregations, window functions, reporting.',
      vi: 'Hàm tổng hợp, window functions, báo cáo doanh thu.',
    },
  },
  {
    code: 'DE',
    roleId: 'data-engineer',
    name: { en: 'Data Engineer', vi: 'Data Engineer' },
    desc: {
      en: 'Pipelines, partitions, bulk loads, modeling.',
      vi: 'Data pipelines, partitions, bulk loads, modeling.',
    },
  },
  {
    code: 'DBA',
    roleId: 'dba',
    name: { en: 'Database Architect', vi: 'Database Architect' },
    desc: {
      en: 'Locking, tuning, replication, schema design.',
      vi: 'Locking, tuning, replication, thiết kế schema.',
    },
  },
];

export function LandingInterviewSection() {
  const { t } = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeLevel, setActiveLevel] = useState<LevelOption>('senior');

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);

    const onScroll = () => {
      if (window.scrollY < 60) {
        setIsVisible(false);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="interview-prep"
      className={`landing-interview-section ${isVisible ? 'is-visible' : ''}`}
      aria-label={t('Technical Interview Prep', 'Luyện phỏng vấn kỹ thuật')}
    >
      <div className="landing-interview-card">
        {/* Header: Title, Description, and Level Progression Switcher */}
        <div className="interview-section-header">
          <div className="interview-header-left">
            <div className="interview-eyebrow">
              <T en="TECHNICAL INTERVIEW PREP" vi="LUYỆN PHỎNG VẤN KỸ THUẬT" />
            </div>
            <h2 className="interview-main-title">
              <T en="Practice SQL interviews by Role & Level." vi="Luyện phỏng vấn SQL theo Vị trí & Cấp bậc." />
            </h2>
            <p className="interview-lead-text">
              <T
                en="Pick your role. Real timed challenges on real PostgreSQL datasets, graded automatically."
                vi="Chọn vị trí của bạn. Thử thách bấm giờ thực tế trên bộ dữ liệu PostgreSQL thật, chấm điểm tự động."
              />
            </p>
          </div>

          {/* Level Switcher (Junior -> Mid -> Senior) */}
          <div className="interview-level-switcher" role="group" aria-label={t('Filter level', 'Chọn cấp bậc')}>
            <button
              type="button"
              className={`level-pill-btn ${activeLevel === 'junior' ? 'active' : ''}`}
              onClick={() => setActiveLevel('junior')}
              aria-pressed={activeLevel === 'junior'}
            >
              Junior
            </button>
            <span className="level-arrow" aria-hidden="true">→</span>
            <button
              type="button"
              className={`level-pill-btn ${activeLevel === 'mid' ? 'active' : ''}`}
              onClick={() => setActiveLevel('mid')}
              aria-pressed={activeLevel === 'mid'}
            >
              Mid
            </button>
            <span className="level-arrow" aria-hidden="true">→</span>
            <button
              type="button"
              className={`level-pill-btn ${activeLevel === 'senior' ? 'active' : ''}`}
              onClick={() => setActiveLevel('senior')}
              aria-pressed={activeLevel === 'senior'}
            >
              Senior
            </button>
          </div>
        </div>

        {/* 4 Role Cards Grid */}
        <div className="interview-roles-grid">
          {roles.map((item, index) => {
            const href = `/interview?role=${item.roleId}&level=${activeLevel}`;
            return (
              <Link
                key={item.code}
                href={href}
                className="landing-role-card"
                style={{ '--card-idx': index } as React.CSSProperties}
              >
                <div className="role-card-top">
                  <span className="role-code">{item.code}</span>
                  <h3 className="role-name">{t(item.name.en, item.name.vi)}</h3>
                  <p className="role-desc">{t(item.desc.en, item.desc.vi)}</p>
                </div>
                <div className="role-card-bottom">
                  <span className="role-start-link">
                    <span>{t('Start', 'Bắt đầu')}</span>
                    <ArrowRight size={14} className="role-start-arrow" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom Perks Row */}
        <div className="interview-perks-row">
          <span className="perk-text">{t('Timed', 'Bấm giờ thực tế')}</span>
          <span className="perk-dot" aria-hidden="true" />
          <span className="perk-text">{t('Real PostgreSQL datasets', 'Bộ dữ liệu PostgreSQL thật')}</span>
          <span className="perk-dot" aria-hidden="true" />
          <span className="perk-text">{t('Automated grading', 'Chấm điểm tự động')}</span>
        </div>
      </div>
    </section>
  );
}
