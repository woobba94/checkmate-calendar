import { useEffect, useState, useRef } from 'react';
import './FeaturesSection.css';

const FeaturesSection = () => {
  const [animationStep, setAnimationStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [typedText, setTypedText] = useState('');
  const sectionRef = useRef<HTMLElement>(null);

  const fullText = '팀 회의';

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isVisible]);

  // 타이핑 애니메이션
  useEffect(() => {
    if (animationStep !== 2) return;

    let charIndex = 0;
    const typeInterval = setInterval(() => {
      if (charIndex < fullText.length) {
        setTypedText(fullText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => setAnimationStep(3), 400);
      }
    }, 120);

    return () => clearInterval(typeInterval);
  }, [animationStep]);

  useEffect(() => {
    if (!isVisible) return;

    const steps = [
      { delay: 600, step: 1 },
      { delay: 1200, step: 2 },
      // step 3 is triggered by typing animation completion
      { delay: 3400, step: 4 },
      { delay: 4000, step: 5 },
      { delay: 4600, step: 6 },
      { delay: 7000, step: 0 },
    ];

    const timers = steps.map(({ delay, step }) =>
      setTimeout(() => setAnimationStep(step), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [isVisible, animationStep === 0 ? Date.now() : 0]);

  // Reset typed text when animation restarts
  useEffect(() => {
    if (animationStep === 0) {
      setTypedText('');
    }
  }, [animationStep]);

  const problems = [
    { problem: '입력이 귀찮아서', solution: '제목만 적으면 끝' },
    { problem: '혼자만 보니까', solution: '함께 쓰는 공유 캘린더' },
    { problem: '열기 귀찮아서', solution: 'AI한테 물어보면 됨' },
  ];

  return (
    <section ref={sectionRef} className="features-section" id="features">
      <div className="features-container">
        {/* 문제 제기 영역 */}
        <div className={`problem-area ${isVisible ? 'visible' : ''}`}>
          <h2 className="section-title">왜 캘린더를 안 쓰게 될까요?</h2>
          <p className="section-subtitle">
            캘린더가 어려워서가 아닙니다.
            <br />
            그냥 귀찮았던 거예요.
          </p>

          <div className="problem-grid">
            {problems.map((item, index) => (
              <div
                key={index}
                className="problem-card"
                style={{ transitionDelay: `${0.1 + index * 0.1}s` }}
              >
                <div className="problem-side">
                  <span className="problem-label">문제</span>
                  <span className="problem-text">{item.problem}</span>
                </div>
                <div className="arrow-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 5l6 7-6 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="solution-side">
                  <span className="solution-label">체크메이트</span>
                  <span className="solution-text">{item.solution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 일정 등록 데모 영역 */}
        <div className={`demo-area ${isVisible ? 'visible' : ''}`}>
          <div className="demo-header">
            <h3 className="demo-title">제목만 적으면 끝</h3>
            <p className="demo-subtitle">3초면 일정이 등록됩니다.</p>
          </div>

          <div className={`event-dialog ${animationStep >= 1 ? 'visible' : ''}`}>
            <div className="dialog-header">
              <span className="dialog-title">2월 8일 (토)</span>
              <button className="dialog-close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="dialog-body">
              <div className="title-input-area">
                {animationStep >= 2 && animationStep < 8 ? (
                  <span className={`typing-title ${animationStep >= 3 ? 'done' : ''}`}>
                    {typedText}
                  </span>
                ) : (
                  <span className="title-placeholder">어떤 일정인가요?</span>
                )}
              </div>

              <div className="memo-area">
                <span className="memo-placeholder">메모</span>
              </div>

              <div className="calendar-select-area">
                <label className="calendar-label">공유할 캘린더</label>
                <div className="calendar-grid">
                  <div className="calendar-option selected">
                    <span className="calendar-checkbox checked">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <span className="calendar-name">업무 캘린더</span>
                  </div>
                  <div className="calendar-option">
                    <span className="calendar-checkbox" />
                    <span className="calendar-name">개인 캘린더</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`demo-complete-message ${animationStep >= 6 ? 'visible' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            끝! 이게 전부예요.
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
