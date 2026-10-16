'use client';

import { useEffect, useRef, useState } from 'react';
import { StepCodeBlock } from '@/components/step-code-block';
import { T } from '@/lib/i18n';

export function LandingStepsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Respect reduced motion preference
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

    // Reset when user scrolls all the way back to the top hero section
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
      id="how"
      className={`landing-steps-section ${isVisible ? 'is-visible' : ''}`}
    >
      <div className="steps-divider-line" aria-hidden="true" />

      {/* Left Column: Heading and Subtitle - spreads to the left */}
      <div className="steps-heading-col">
        <h2>
          <T en="One experiment, three steps" vi="Một thử nghiệm, ba bước thực hiện" />
        </h2>
        <p>
          <T
            en="Nothing to learn first. You write the SQL, QueryLab keeps score."
            vi="Không cần học lý thuyết phức tạp. Bạn viết câu lệnh SQL, QueryLab ghi nhận và so sánh hiệu năng."
          />
        </p>
      </div>

      {/* Right Column: 3 Steps - spreads to the right */}
      <div className="steps-list-col">
        <div className="step-row" style={{ '--step-index': 0 } as React.CSSProperties}>
          <span className="step-num">01</span>
          <div className="step-content">
            <h3>
              <T en="Measure" vi="Đo lường" />
            </h3>
            <p>
              <T
                en="Run your query as it is. QueryLab records the time, the rows read and the plan PostgreSQL chose."
                vi="Chạy câu truy vấn ban đầu của bạn. QueryLab ghi lại thời gian thực thi, số lượng dòng đọc và plan mà PostgreSQL đã chọn."
              />
            </p>
            <StepCodeBlock code={`SELECT * FROM orders\nWHERE customer_id = 42;`} />
          </div>
        </div>

        <div className="step-row" style={{ '--step-index': 1 } as React.CSSProperties}>
          <span className="step-num">02</span>
          <div className="step-content">
            <h3>
              <T en="Change" vi="Thay đổi" />
            </h3>
            <p>
              <T
                en="Try an index or a partition. QueryLab shows you the exact statement and waits for your OK before it runs."
                vi="Thử nghiệm thêm một index hoặc phân vùng (partition). QueryLab hiển thị câu lệnh chính xác và chỉ chạy khi có sự đồng ý của bạn."
              />
            </p>
            <StepCodeBlock code={`CREATE INDEX ON orders (customer_id);`} />
          </div>
        </div>

        <div className="step-row" style={{ '--step-index': 2 } as React.CSSProperties}>
          <span className="step-num">03</span>
          <div className="step-content">
            <h3>
              <T en="Compare" vi="So sánh" />
            </h3>
            <p>
              <T
                en="Run it again. Time, rows read and the plan sit beside the first run, so you can see what the change actually did."
                vi="Chạy lại truy vấn. Thời gian, số dòng đọc và execution plan mới sẽ được đặt cạnh lần chạy đầu để bạn thấy rõ hiệu quả thực tế."
              />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
