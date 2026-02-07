import { useEffect, useState, useRef } from 'react';
import './SharedCalendarSection.css';

const SharedCalendarSection = () => {
  const [animationStep, setAnimationStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [typedText, setTypedText] = useState('');
  const sectionRef = useRef<HTMLElement>(null);

  const fullText = '팀 미팅';

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
    if (animationStep !== 1) return;

    let charIndex = 0;
    const typeInterval = setInterval(() => {
      if (charIndex < fullText.length) {
        setTypedText(fullText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => setAnimationStep(2), 400);
      }
    }, 120);

    return () => clearInterval(typeInterval);
  }, [animationStep]);

  useEffect(() => {
    if (!isVisible) return;

    const steps = [
      { delay: 800, step: 1 },
      // step 2 is triggered by typing animation completion
      { delay: 2800, step: 3 },
      { delay: 3300, step: 4 },
      { delay: 3800, step: 5 },
      { delay: 5800, step: 6 },
      { delay: 9000, step: 0 },
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

  return (
    <section ref={sectionRef} className="shared-calendar-section">
      <div className="shared-calendar-container">
        {/* 텍스트 영역 */}
        <div className={`shared-calendar-text ${isVisible ? 'visible' : ''}`}>
          <h2 className="shared-title">
            한 명이 적으면,
            <br />
            모두가 봅니다
          </h2>
          <p className="shared-subtitle">
            공유 캘린더에 일정을 추가하면
            <br />
            함께 쓰는 사람 모두에게 즉시 동기화됩니다.
          </p>
        </div>

        {/* 공유 캘린더 데모 */}
        <div className={`shared-demo ${isVisible ? 'visible' : ''}`}>
          <div className="demo-container">
            {/* 사용자 A 화면 */}
            <div className="demo-screen">
              <div className="screen-header">
                <div className="user-avatar user-a">A</div>
                <span className="screen-label">사용자 A</span>
              </div>
              <div className="screen-content">
                <div className="mini-calendar">
                  <div className="calendar-date">2월 8일 토요일</div>
                  <div className={`event-card ${animationStep >= 2 ? 'visible' : ''}`}>
                    <div className="event-indicator" />
                    <div className="event-details">
                      <span className="event-title">
                        {animationStep >= 1 && animationStep < 8 && (
                          <span className={`typing-text ${animationStep >= 2 ? 'done' : ''}`}>
                            {typedText}
                          </span>
                        )}
                      </span>
                      <span className="event-time">오후 2:00</span>
                    </div>
                  </div>
                </div>
                {animationStep >= 2 && animationStep < 4 && (
                  <button className={`save-btn ${animationStep === 3 ? 'clicked' : ''}`}>
                    저장하기
                  </button>
                )}
                {animationStep >= 3 && animationStep < 5 && (
                  <div className="toast-message">
                    공유 캘린더에 추가됨
                  </div>
                )}
              </div>
            </div>

            {/* 동기화 화살표 */}
            <div className={`sync-arrow ${animationStep >= 4 ? 'active' : ''}`}>
              <div className="sync-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="sync-label">동기화</span>
            </div>

            {/* 사용자 B 화면 */}
            <div className="demo-screen">
              <div className="screen-header">
                <div className="user-avatar user-b">B</div>
                <span className="screen-label">사용자 B</span>
              </div>
              <div className="screen-content">
                <div className="mini-calendar">
                  <div className="calendar-date">2월 8일 토요일</div>
                  <div className={`event-card ${animationStep >= 5 ? 'visible' : ''}`}>
                    <div className="event-indicator" />
                    <div className="event-details">
                      <span className="event-title">팀 미팅</span>
                      <span className="event-time">오후 2:00</span>
                    </div>
                  </div>
                  {animationStep < 5 && (
                    <div className="empty-state">일정 없음</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 완료 메시지 */}
          <div className={`demo-message ${animationStep >= 6 ? 'visible' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            함께 쓰면 서로 다 보여요
          </div>
        </div>
      </div>
    </section>
  );
};

export default SharedCalendarSection;
