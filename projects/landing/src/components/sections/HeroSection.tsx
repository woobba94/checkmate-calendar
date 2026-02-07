import { Button } from '../ui/button';
import './HeroSection.css';

const CALENDAR_ITEMS = [
  { name: '우리 캘린더', color: '#6366F1', active: true },
  { name: '업무 일정', color: '#10B981' },
  { name: '가족 일정', color: '#F59E0B' },
];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const HeroSection = () => {
  const handleGetStarted = () => {
    window.location.href = 'https://app.checkmate-calendar.com';
  };

  return (
    <>
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            <span>공유 캘린더의 새로운 기준</span>
          </div>
          <h1 className="hero-title">
            함께 쓰는 캘린더,
            <br />
            <span className="title-accent">함께 기억하는 일정</span>
          </h1>
          <p className="hero-subtitle">
            들은 건 기억나는데, 언제인지 모르겠다면.
            <br />
            이제 같이 쓰는 캘린더에 적으세요.
          </p>
          <div className="hero-actions">
            <Button
              onClick={handleGetStarted}
              className="hero-cta-primary"
              size="lg"
              variant="primary"
            >
              무료로 시작하기
            </Button>
            <Button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="hero-cta-secondary"
              size="lg"
              variant="outline"
            >
              자세히 알아보기
            </Button>
          </div>
        </div>
      </section>

      {/* 프로덕트 프레임 시각화 */}
      <div className="hero-visual-container">
        <div className="hero-visual-content">
          <div className="product-frame">
            {/* 사이드바 */}
            <aside className="product-sidebar">
              <div className="sidebar-logo">
                <span className="logo-icon">✓</span>
                <span className="logo-text">Checkmate</span>
              </div>
              <div className="calendar-list">
                {CALENDAR_ITEMS.map((item) => (
                  <div
                    key={item.name}
                    className={`calendar-item ${item.active ? 'active' : ''}`}
                  >
                    <span
                      className="calendar-color"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="calendar-name">{item.name}</span>
                  </div>
                ))}
              </div>
              <button className="integration-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Google Calendar 연동</span>
              </button>
            </aside>

            {/* 캘린더 메인 */}
            <div className="product-main">
              <div className="calendar-header">
                <div className="calendar-title">
                  <h3>2025년 2월</h3>
                  <div className="calendar-nav">
                    <button className="nav-btn">&lt;</button>
                    <button className="nav-btn">&gt;</button>
                  </div>
                </div>
                <button className="add-event-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  일정 추가
                </button>
              </div>
              <div className="calendar-grid">
                <div className="weekdays">
                  {WEEKDAYS.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="days">
                  {Array.from({ length: 35 }, (_, i) => {
                    const dayNumber = i >= 6 && i < 6 + 28 ? i - 5 : null;
                    const hasEvent = dayNumber && [1, 8, 14, 15, 22].includes(dayNumber);
                    const isToday = dayNumber === 8;
                    return (
                      <div key={i} className={`day ${isToday ? 'today' : ''}`}>
                        {dayNumber && (
                          <>
                            <span className="day-number">{dayNumber}</span>
                            {hasEvent && (
                              <div className="event-dot" style={{ backgroundColor: '#6366F1' }} />
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
