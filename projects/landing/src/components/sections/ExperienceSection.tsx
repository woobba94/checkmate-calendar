import { useEffect, useState, useRef } from 'react';
import './ExperienceSection.css';

const ExperienceSection = () => {
  const [animationStep, setAnimationStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [typedText, setTypedText] = useState('');
  const sectionRef = useRef<HTMLElement>(null);

  const fullText = '다음주 토요일 팀 미팅';

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
      { delay: 4200, step: 4 },
      { delay: 5200, step: 5 },
      { delay: 6200, step: 6 },
      { delay: 6800, step: 7 },
      { delay: 9500, step: 0 },
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
    <section ref={sectionRef} className="experience-section">
      <div className="experience-container">
        {/* 텍스트 영역 */}
        <div className={`experience-text ${isVisible ? 'visible' : ''}`}>
          <h2 className="experience-title">
            날짜 고르고, 시간 고르고...
            <br />
            그런 거 없습니다.
          </h2>
          <p className="experience-subtitle">
            "다음주 토요일 미팅" 이렇게만 입력하세요.
            <br />
            AI가 알아서 일정을 만들어드립니다.
          </p>
        </div>

        {/* AI 데모 영역 */}
        <div className={`ai-demo ${isVisible ? 'visible' : ''}`}>
          <div className="chat-container">
            <div className={`agent-input-area ${animationStep >= 1 ? 'focused' : ''}`}>
              <div className="agent-input-text">
                {animationStep >= 2 && animationStep < 8 ? (
                  <span className={`typing-chat ${animationStep >= 3 ? 'done' : ''}`}>
                    {typedText}
                  </span>
                ) : (
                  <span className="chat-placeholder">추가하고 싶은 일정을 입력하세요.</span>
                )}
              </div>
              <div className="agent-input-actions">
                <div className="input-left-buttons">
                  <button className="icon-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button className="icon-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <button className={`send-btn-round ${animationStep >= 3 && animationStep < 4 ? 'active' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* AI 로딩 */}
            {animationStep === 4 && (
              <div className="ai-loading">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="loading-text">AI가 분석 중...</span>
              </div>
            )}

            {/* AI 응답 */}
            {animationStep >= 5 && (
              <div className="ai-response">
                <div className="response-header">
                  <span className="ai-avatar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/>
                      <circle cx="7.5" cy="14.5" r="1.5"/>
                      <circle cx="16.5" cy="14.5" r="1.5"/>
                    </svg>
                  </span>
                  <span className="ai-label">체크메이트 AI</span>
                </div>
                <div className="response-body">
                  <p className="response-text">
                    <strong>2월 8일 토요일</strong>에 <strong>'팀 미팅'</strong> 일정을 추가할까요?
                  </p>
                  <div className="response-preview">
                    <div className="preview-indicator" />
                    <div className="preview-details">
                      <span className="preview-title">팀 미팅</span>
                      <span className="preview-date">2월 8일 (토) 오후 2:00</span>
                    </div>
                  </div>
                  <div className="response-actions">
                    <button className={`action-btn primary ${animationStep === 6 ? 'clicked' : ''} ${animationStep >= 7 ? 'success' : ''}`}>
                      {animationStep >= 7 ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          추가됨
                        </>
                      ) : '추가하기'}
                    </button>
                    <button className="action-btn secondary">수정하기</button>
                  </div>
                </div>
              </div>
            )}

            {/* 완료 메시지 */}
            {animationStep >= 7 && (
              <div className="ai-complete">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                일정이 캘린더에 추가되었습니다!
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
