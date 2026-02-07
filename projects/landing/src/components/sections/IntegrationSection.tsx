import { useEffect, useState, useRef } from 'react';
import './IntegrationSection.css';

const IntegrationSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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

  return (
    <section ref={sectionRef} className="integration-section">
      <div className="integration-container">
        {/* 텍스트 영역 */}
        <div className={`integration-text ${isVisible ? 'visible' : ''}`}>
          <h2 className="integration-title">
            흩어진 일정,
            <br />
            한 곳에 모으세요
          </h2>
          <p className="integration-subtitle">
            이미 쓰고 있는 Google 캘린더도 연동됩니다.
            <br />
            여기저기 흩어진 일정, 이제 한 곳에서 보세요.
          </p>
        </div>

        {/* 연동 데모 영역 */}
        <div className={`integration-demo ${isVisible ? 'visible' : ''}`}>
          <div className="demo-wrapper">
            <div className="integration-card">
              <div className="card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="#4285F4" strokeWidth="1.5"/>
                  <path d="M3 9h18" stroke="#4285F4" strokeWidth="1.5"/>
                  <path d="M9 4V7M15 4V7" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="12" cy="14" r="2" fill="#EA4335"/>
                </svg>
              </div>
              <div className="card-info">
                <div className="card-name">Google Calendar</div>
                <div className="card-desc">기존 일정 그대로</div>
              </div>
            </div>

            <div className="sync-connector">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <div className="integration-card checkmate">
              <div className="card-icon checkmate">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="card-info">
                <div className="card-name">체크메이트</div>
                <div className="card-desc">모든 일정을 한 곳에서</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationSection;
