import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventClickArg } from '@fullcalendar/core';
import type {
  CalendarEvent,
  CalendarViewType,
  Calendar as CalendarType,
} from '@/types/calendar';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import { useThrottledCallback } from '@/hooks/useThrottledCallback';
import { useResponsive } from '@/hooks/useResponsive';
import './Calendar.scss';

interface CalendarProps {
  events: CalendarEvent[];
  calendars?: CalendarType[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  currentView: CalendarViewType;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  isSidebarOpen?: boolean;
  isAgentPanelOpen?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  events,
  calendars,
  onEventClick,
  onDateClick,
  currentView,
  currentDate,
  onDateChange,
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(
    null
  );
  const isScrollingRef = useRef(false);
  const scrollDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const { isMobile } = useResponsive();
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  // 캘린더 맵 생성
  const calendarMap = useMemo(() => {
    const map = new Map<string, CalendarType>();
    calendars?.forEach((cal) => {
      map.set(cal.id, cal);
    });
    return map;
  }, [calendars]);

  // FullCalendar용 이벤트 데이터 메모이제이션 (깜빡임 방지)
  const fullCalendarEvents = useMemo(() => {
    return events.map((event) => {
      // 선택된 캘린더 중에서 이벤트가 속한 첫 번째 캘린더의 색상 사용
      const selectedCalendarId = event.calendar_ids?.find((id) =>
        calendarMap.has(id)
      );
      const calendar = selectedCalendarId
        ? calendarMap.get(selectedCalendarId)
        : undefined;
      const eventColor = calendar?.color || '#e5e5e5';

      return {
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        description: event.description,
        backgroundColor: eventColor,
        borderColor: eventColor,
        textColor: '#ffffff', // 색상 대비를 위해 흰색 텍스트
        // 확장 속성으로 추가 필드 전달
        extendedProps: {
          description: event.description,
          calendar_ids: event.calendar_ids,
          created_by: event.created_by,
          created_at: event.created_at,
          updated_at: event.updated_at,
        },
      };
    });
  }, [events, calendarMap]);

  // 뷰 타입 매핑
  const getFullCalendarView = (view: CalendarViewType): string => {
    switch (view) {
      case 'month':
        return 'dayGridMonth';
      case 'week':
        return 'timeGridWeek';
      case 'day':
        return 'timeGridDay';
      case 'list':
        return 'listWeek';
      default:
        return 'dayGridMonth';
    }
  };

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(getFullCalendarView(currentView));
    }
  }, [currentView]);

  useEffect(() => {
    if (calendarRef.current && currentDate) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(currentDate);
    }
  }, [currentDate]);

  const handleEventClick = (info: EventClickArg) => {
    if (onEventClick) {
      // 이벤트 데이터를 CalendarEvent 형식으로 변환
      const event: CalendarEvent = {
        id: info.event.id,
        title: info.event.title,
        start: info.event.start,
        end: info.event.end,
        allDay: info.event.allDay,
        description: info.event.extendedProps.description,
        calendar_ids: info.event.extendedProps.calendar_ids || [],
        created_by: info.event.extendedProps.created_by,
        created_at: info.event.extendedProps.created_at,
        updated_at: info.event.extendedProps.updated_at,
      };
      onEventClick(event);
    }
  };

  // 터치 제스처 핸들러
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (currentView !== 'month' || isScrollingRef.current) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchStartXRef.current - touchEndX;
      const deltaY = touchStartYRef.current - touchEndY;

      // 수평 스와이프가 더 크고, 최소 50px 이상 움직였을 때
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        const calendarApi = calendarRef.current?.getApi();
        if (!calendarApi) return;

        isScrollingRef.current = true;

        if (deltaX > 0) {
          // 왼쪽으로 스와이프: 다음 달
          setScrollDirection('down');
          calendarApi.next();
        } else {
          // 오른쪽으로 스와이프: 이전 달
          setScrollDirection('up');
          calendarApi.prev();
        }

        if (onDateChange) {
          onDateChange(calendarApi.getDate());
        }

        setTimeout(() => {
          setScrollDirection(null);
          isScrollingRef.current = false;
        }, 300);
      }
    },
    [currentView, onDateChange]
  );

  // 스크롤 핸들러 (쓰로틀링 적용)
  const handleWheel = useThrottledCallback(
    (e: WheelEvent) => {
      // 모바일에서는 스크롤 비활성화
      if (isMobile) return;

      // month view에서만 작동
      if (currentView !== 'month') return;

      const calendarApi = calendarRef.current?.getApi();
      if (!calendarApi) return;

      // 기본 스크롤 동작 방지
      e.preventDefault();

      // deltaY 값으로 스크롤 방향 판단
      // 스크롤 민감도
      if (Math.abs(e.deltaY) > 3) {
        // 이미 전환 중이면 무시
        if (isScrollingRef.current) return;

        isScrollingRef.current = true;

        if (e.deltaY > 0) {
          // 스크롤 다운: 다음달로 이동 (다음달이 아래에서 위로 올라옴)
          setScrollDirection('down');
          calendarApi.next();
        } else {
          // 스크롤 업: 이전달로 이동 (이전달이 위에서 아래로 내려옴)
          setScrollDirection('up');
          calendarApi.prev();
        }

        if (onDateChange) {
          onDateChange(calendarApi.getDate());
        }

        // 스크롤 상태 리셋 - 시간을 줄여서 더 빠르게 다음 스크롤 가능
        if (scrollDebounceRef.current) {
          clearTimeout(scrollDebounceRef.current);
        }

        scrollDebounceRef.current = setTimeout(() => {
          setScrollDirection(null);
          // 애니메이션이 완료된 후 스크롤 가능하도록 추가 지연
          setTimeout(() => {
            isScrollingRef.current = false;
          }, 150);
        }, 300);
      }
    },
    [currentView, onDateChange, isMobile]
  );

  // ResizeObserver를 사용하여 크기 변경 감지
  const containerRef = useResizeObserver(
    useCallback(() => {
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        calendarApi.updateSize();
      }
    }, []),
    { debounce: 100 }
  );

  // 캘린더 컨테이너에 이벤트 리스너 추가
  useEffect(() => {
    const calendarEl = containerRef.current;
    if (!calendarEl) return;

    // 휠 이벤트 리스너 추가 (passive: false로 설정하여 preventDefault 허용)
    calendarEl.addEventListener('wheel', handleWheel, { passive: false });

    // 모바일 터치 이벤트 리스너 추가
    if (isMobile) {
      calendarEl.addEventListener('touchstart', handleTouchStart, {
        passive: true,
      });
      calendarEl.addEventListener('touchend', handleTouchEnd, {
        passive: true,
      });
    }

    // 클린업
    return () => {
      calendarEl.removeEventListener('wheel', handleWheel);
      if (isMobile) {
        calendarEl.removeEventListener('touchstart', handleTouchStart);
        calendarEl.removeEventListener('touchend', handleTouchEnd);
      }
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }
    };
  }, [handleWheel, handleTouchStart, handleTouchEnd, isMobile]);

  // 레이아웃 변경 시 transitionend 이벤트로 크기 재계산
  useEffect(() => {
    const handleTransitionEnd = () => {
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        calendarApi.updateSize();
      }
    };

    // 컨테이너에 transitionend 이벤트 리스너 추가
    const container = containerRef.current;
    if (container) {
      container.addEventListener('transitionend', handleTransitionEnd);
      return () => {
        container.removeEventListener('transitionend', handleTransitionEnd);
      };
    }
  }, []);

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`calendar-container ${scrollDirection ? `scroll-${scrollDirection}` : ''}`}
      style={{
        height: '100%',
      }}
    >
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView={getFullCalendarView(currentView)}
        initialDate={currentDate}
        headerToolbar={false} // 헤더는 CalendarHeader 컴포넌트에서 따로관리
        events={fullCalendarEvents}
        eventClick={handleEventClick}
        dateClick={(info) => onDateClick && onDateClick(info.date)}
        editable={!isMobile}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={isMobile ? false : true}
        weekends={true}
        height="100%"
        // 모바일 최적화
        eventDisplay={isMobile ? 'block' : 'auto'}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: false,
        }}
        // 모바일에서 이벤트를 색상 바로 표시
        // FullCalendar의 eventContent는 React 컴포넌트를 직접 지원하지 않아서
        // EventColorBar 컴포넌트 대신 inline HTML을 사용
        eventContent={
          isMobile
            ? (arg) => {
                const eventColor = arg.event.backgroundColor || '#e5e5e5';
                return {
                  html: `<div class="fc-event-color-bar" style="background-color: ${eventColor}"></div>`,
                };
              }
            : undefined
        }
      />
    </div>
  );
};

export default React.memo(Calendar);
