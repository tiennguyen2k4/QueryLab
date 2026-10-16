'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { useLocale } from '@/lib/i18n';

export function LandingComparison() {
  const { t } = useLocale();
  const [animating, setAnimating] = useState(false);
  const [showAfter, setShowAfter] = useState(true);

  const barRef = useRef<HTMLDivElement>(null);
  const msRef = useRef<HTMLElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const runAnimation = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    setAnimating(true);
    setShowAfter(false);

    if (barRef.current) {
      barRef.current.style.width = '0%';
    }
    if (msRef.current) {
      msRef.current.textContent = '0.000 ms';
    }

    const start = performance.now();
    const duration = 1200; // ms for a natural, smooth pacing

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);

      // Silky smooth quintic ease-out curve: 1 - (1 - t)^3
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentWidth = Math.max(0, Math.min(100, ease * 100));
      const currentMs = ease * 312.48;

      if (barRef.current) {
        barRef.current.style.width = `${currentWidth}%`;
      }
      if (msRef.current) {
        msRef.current.textContent = `${currentMs.toFixed(3)} ms`;
      }

      if (progress >= 0.88) {
        setShowAfter(true);
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        if (barRef.current) barRef.current.style.width = '100%';
        if (msRef.current) msRef.current.textContent = '312.480 ms';
        setShowAfter(true);
        setAnimating(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    // Respect reduced-motion preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (barRef.current) barRef.current.style.width = '100%';
      if (msRef.current) msRef.current.textContent = '312.480 ms';
      setShowAfter(true);
      return;
    }

    const timer = setTimeout(() => {
      runAnimation();
    }, 350);

    return () => {
      clearTimeout(timer);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [runAnimation]);

  return (
    <div className="hero-comparison-card" aria-hidden="true">
      <div className="comparison-meta-row">
        <span className="query-spec mono">SELECT * FROM orders WHERE customer_id = 42;</span>
        <div className="meta-right-group">
          <span className="dataset-spec mono">
            {t('example run · 1,000,000 rows', 'lần chạy ví dụ · 1.000.000 dòng')}
          </span>
          <button
            type="button"
            className="rerun-btn mono"
            onClick={runAnimation}
            title={t('Re-run comparison', 'Chạy lại so sánh')}
            aria-label={t('Re-run comparison', 'Chạy lại so sánh')}
          >
            <RotateCcw size={12} className={animating ? 'spin-icon' : ''} />
            <span>{t('Re-run', 'Chạy lại')}</span>
          </button>
        </div>
      </div>

      {/* Before Row */}
      <div className="comparison-row before-row">
        <span className="comparison-phase-label mono">
          {t('before', 'trước')}
        </span>
        <div className="before-bar-track">
          <div
            ref={barRef}
            className={`before-bar ${animating ? 'is-animating' : ''}`}
            style={{ width: '100%' }}
          >
            <strong ref={msRef}>312.480 ms</strong>
          </div>
        </div>
      </div>

      {/* After Row */}
      <div className="comparison-row after-row">
        <span className="comparison-phase-label mono">
          {t('after', 'sau')}
        </span>
        <div className={`after-bar-content ${showAfter ? 'is-visible' : 'is-hidden'}`}>
          <span className="after-tick" />
          <strong className="after-timing">0.061 ms</strong>
          <span className="after-caption mono">
            {t('after CREATE INDEX ON orders (customer_id);', 'sau khi CREATE INDEX ON orders (customer_id);')}
          </span>
        </div>
      </div>

      {/* Plan Comparison Grid */}
      <div className="comparison-plans-grid">
        <div className="plan-col plan-before-col">
          <p className="plan-label mono">
            {t('plan before', 'plan ban đầu')}
          </p>
          <pre className="mono">
            <code>
{`- Seq Scan on orders
-   Filter: (customer_id = 42)
-   Rows Removed by Filter: `}
              <span className="highlight-wasted">999,995</span>
            </code>
          </pre>
        </div>

        <div className="plan-col plan-after-col">
          <p className="plan-label mono">
            {t('plan after', 'plan sau tối ưu')}
          </p>
          <pre className="mono">
            <code>
{`+ Index Scan using orders_customer_id_idx on orders
+   Index Cond: (customer_id = 42)
+   (`}
              <span className="highlight-optimal">actual rows=5</span>
{`)`}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
