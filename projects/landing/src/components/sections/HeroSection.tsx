import { Button } from '../ui/button';
import './HeroSection.css';

// 캘린더 관련 상수
const CALENDAR_CONFIG = {
  totalDays: 35,
  daysInMonth: 31,
  eventsOnDays: [5, 12, 15, 20, 25],
  animationBaseDelay: 0.8,
  animationStagger: 0.03,
};

const CALENDAR_ITEMS = [
  { name: '개인 일정', color: '#3B82F6', active: true },
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
      <section className="py-16 md:py-32">
        <div className="max-w-[1024px] mx-auto px-5 md:px-6 relative z-10 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl leading-normal font-bold text-foreground mb-4 md:mb-6">
            말씀만 하세요,
            <br />
            일정은 체크메이트가 정리합니다.
          </h1>
          <p className="text-base md:text-lg leading-normal font-medium text-muted-foreground mb-6 md:mb-10">
            여러 캘린더를 하나로, 누구와도 즉시 공유, 음성·프롬프트로 일정
            추가까지
          </p>
          <div className="flex justify-center md:justify-start">
            <Button
              onClick={handleGetStarted}
              className="w-full md:w-auto px-8 py-6 text-base font-medium"
              size="lg"
              variant="primary"
            >
              시작하기
            </Button>
          </div>
        </div>
      </section>

      {/* Hero 시각적 영역 */}
      <div className="hero-visual-container">
        <div className="hero-visual-content">
          <div className="product-frame">
            {/* 사이드바 영역 */}
            <aside className="product-sidebar">
              <div className="sidebar-logo">
                <div className="logo-placeholder">Checkmate</div>
              </div>
              <div className="sidebar-content">
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
                <div className="sidebar-integrations">
                  <button className="integration-btn">
                    <span>Google Calendar 연동</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* 메인 캘린더 영역 */}
            <div className="product-main">
              <div className="calendar-header">
                <div className="calendar-title">
                  <h3>2024년 12월</h3>
                  <div className="calendar-nav">
                    <button>&lt;</button>
                    <button>&gt;</button>
                  </div>
                </div>
                <div className="calendar-actions">
                  <button className="add-event-btn">+ 일정 추가</button>
                </div>
              </div>
              <div className="calendar-grid">
                <div className="weekdays">
                  {WEEKDAYS.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="days">
                  {/* 캘린더 날짜 생성 */}
                  {Array.from({ length: CALENDAR_CONFIG.totalDays }, (_, i) => {
                    const dayNumber =
                      i < CALENDAR_CONFIG.daysInMonth ? i + 1 : null;
                    const hasEvent =
                      dayNumber &&
                      CALENDAR_CONFIG.eventsOnDays.includes(dayNumber);
                    const animationDelay = `${CALENDAR_CONFIG.animationBaseDelay + i * CALENDAR_CONFIG.animationStagger}s`;

                    return (
                      <div key={i} className="day" style={{ animationDelay }}>
                        {dayNumber && (
                          <>
                            <span className="day-number">{dayNumber}</span>
                            {hasEvent && (
                              <div className="day-events">
                                <div
                                  className="event-dot"
                                  style={{
                                    backgroundColor: CALENDAR_ITEMS[0].color,
                                  }}
                                />
                              </div>
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
        <div className="checkerboard-overlay" />
      </div>
    </>
  );
};

export default HeroSection;
