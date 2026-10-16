import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MarketingFooter, MarketingNav } from '@/components/shell';
import { LandingComparison } from '@/components/landing-comparison';
import { LandingStepsSection } from '@/components/landing-steps-section';
import { T } from '@/lib/i18n';

export default function Home() {
  return (
    <>
      <MarketingNav />
      <main className="landing database-landing">
        {/* Section 1: Hero matching screenshot */}
        <section id="workspace" className="landing-hero-editorial">
          <p className="hero-eyebrow-mono">
            <T en="EXPLAIN ANALYZE, without the squinting" vi="EXPLAIN ANALYZE, không còn phải căng mắt đoán" />
          </p>
          <h1 className="hero-headline-giant">
            <T
              en={<>Why is that query<br />slow?</>}
              vi={<>Vì sao query đó<br />bị chậm?</>}
            />
          </h1>

          <div className="hero-subbar">
            <p className="hero-subbar-lead">
              <T
                en="Connect your local PostgreSQL, add an index or a partition, and run the query again. QueryLab puts the two plans next to each other."
                vi="Kết nối database PostgreSQL local của bạn, thử thêm index hoặc partition, rồi chạy lại. QueryLab đặt hai execution plan cạnh nhau để so sánh trực quan."
              />
            </p>
            <div className="hero-subbar-actions">
              <Link className="hero-cta-btn" href="/connections">
                <T en="Connect database →" vi="Kết nối database →" />
              </Link>
              <Link className="hero-link-secondary" href="/paths">
                <T en="Learn SQL" vi="Học SQL" />
              </Link>
            </div>
          </div>

          {/* Animated Hero Comparison Card */}
          <LandingComparison />
        </section>

        {/* Section 2: One experiment, three steps (Animated Spread on Scroll) */}
        <LandingStepsSection />

        {/* Section 3: Interview Practice Banner */}
        <section className="landing-interview-banner">
          <div className="landing-interview-inner">
            <div className="eyebrow mint">
              <T en="TECHNICAL INTERVIEW PREP" vi="LUYỆN PHỎNG VẤN KỸ THUẬT" />
            </div>
            <h2>
              <T en="Practice SQL interviews by Role & Level." vi="Luyện phỏng vấn SQL theo Vị trí & Cấp bậc." />
            </h2>
            <p>
              <T
                en="Real timed challenges for Backend, Data Analyst, Data Engineer, and DBA from Junior to Senior. Test your SQL against real PostgreSQL datasets with automated grading."
                vi="Thử thách bấm giờ thực tế cho Backend, Data Analyst, Data Engineer và DBA từ Junior đến Senior. Chạy SQL thật trên PostgreSQL và chấm điểm tự động."
              />
            </p>
            <div className="landing-role-chips">
              <span className="role-chip">Backend (BE)</span>
              <span className="role-chip">Data Analyst (DA)</span>
              <span className="role-chip">Data Engineer (DE)</span>
              <span className="role-chip">Database Architect (DBA)</span>
            </div>
            <div style={{ marginTop: 22 }}>
              <Link className="button" href="/interview">
                <T en="Enter Interview Practice" vi="Vào luyện phỏng vấn ngay" />
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
