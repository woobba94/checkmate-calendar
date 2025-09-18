import React, { useRef, useEffect, useCallback, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { CalendarEvent, CalendarViewType } from '@/types/calendar';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import { useThrottledCallback } from '@/hooks/useThrottledCallback';

interface CalendarProps {
  events: CalendarEvent[];
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
  onEventClick,
  onDateClick,
  currentView,
  currentDate,
  onDateChange,
  isSidebarOpen,
  isAgentPanelOpen,
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isScrollingRef = useRef(false);
  const scrollDebounceRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleEventClick = (info: any) => {
    if (onEventClick) {
      // 이벤트 데이터를 CalendarEvent 형식으로 변환
      const event: CalendarEvent = {
        id: info.event.id,
        title: info.event.title,
        start: info.event.start,
        end: info.event.end,
        allDay: info.event.allDay,
        description: info.event.extendedProps.description,
        color: info.event.backgroundColor,
        calendar_id: info.event.extendedProps.calendar_id,
        created_by: info.event.extendedProps.created_by,
        created_at: info.event.extendedProps.created_at,
        updated_at: info.event.extendedProps.updated_at,
      };
      onEventClick(event);
    }
  };

  // 스크롤 핸들러 (쓰로틀링 적용)
  const handleWheel = useThrottledCallback(
    (e: WheelEvent) => {
      // month view에서만 작동
      if (currentView !== 'month') return;

      const calendarApi = calendarRef.current?.getApi();
      if (!calendarApi) return;

      // 기본 스크롤 동작 방지
      e.preventDefault();

      // deltaY 값으로 스크롤 방향 판단
      // 민감도를 높여서 작은 스크롤에도 반응하도록 조정
      if (Math.abs(e.deltaY) > 10) {
        // 이미 전환 중이면 무시
        if (isScrollingRef.current) return;

        isScrollingRef.current = true;
        setIsTransitioning(true);

        if (e.deltaY > 0) {
          calendarApi.next();
        } else {
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
          isScrollingRef.current = false;
          setIsTransitioning(false);
        }, 150); // 300ms에서 150ms로 줄임
      }
    },
    [currentView, onDateChange]
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

  // 캘린더 컨테이너에 휠 이벤트 리스너 추가
  useEffect(() => {
    const calendarEl = containerRef.current;
    if (!calendarEl) return;

    // 휠 이벤트 리스너 추가 (passive: false로 설정하여 preventDefault 허용)
    calendarEl.addEventListener('wheel', handleWheel, { passive: false });

    // 클린업
    return () => {
      calendarEl.removeEventListener('wheel', handleWheel);
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }
    };
  }, [handleWheel]);

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
      style={{
        opacity: isTransitioning ? 0.7 : 1,
        transition: 'opacity 0.1s ease-in-out',
        height: '100%',
      }}
    >
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView={getFullCalendarView(currentView)}
        initialDate={currentDate}
        headerToolbar={false} // 헤더는 CalendarHeader 컴포넌트에서 따로관리
        events={events.map((event) => ({
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          description: event.description,
          backgroundColor: event.color,
          // 확장 속성으로 추가 필드 전달
          extendedProps: {
            description: event.description,
            color: event.color,
            calendar_id: event.calendar_id,
            created_by: event.created_by,
            created_at: event.created_at,
            updated_at: event.updated_at,
          },
        }))}
        eventClick={handleEventClick}
        dateClick={(info) => onDateClick && onDateClick(info.date)}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        height="100%"
      />
    </div>
  );
};

export default React.memo(Calendar);
