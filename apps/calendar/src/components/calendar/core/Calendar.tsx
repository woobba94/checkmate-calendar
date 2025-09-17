import React, { useRef, useEffect, useCallback, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { CalendarEvent, CalendarViewType } from '@/types/calendar';

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
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTime = useRef<number>(0);
  const isScrolling = useRef<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  // 스크롤 핸들러
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // month view에서만 작동
      if (currentView !== 'month') return;

      const now = Date.now();
      const timeSinceLastScroll = now - lastScrollTime.current;

      // 연속된 스크롤 이벤트를 하나로 묶기 위한 디바운싱
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      if (!isScrolling.current || timeSinceLastScroll > 500) {
        isScrolling.current = true;
        lastScrollTime.current = now;

        // deltaY 값으로 스크롤 방향 판단
        if (e.deltaY > 0) {
          // 스크롤 다운 - 다음 월로 이동
          if (calendarRef.current) {
            setIsTransitioning(true);
            setTimeout(() => {
              const calendarApi = calendarRef.current!.getApi();
              calendarApi.next();
              if (onDateChange) {
                onDateChange(calendarApi.getDate());
              }
              setTimeout(() => setIsTransitioning(false), 50);
            }, 150);
          }
        } else if (e.deltaY < 0) {
          // 스크롤 업 - 이전 월로 이동
          if (calendarRef.current) {
            setIsTransitioning(true);
            setTimeout(() => {
              const calendarApi = calendarRef.current!.getApi();
              calendarApi.prev();
              if (onDateChange) {
                onDateChange(calendarApi.getDate());
              }
              setTimeout(() => setIsTransitioning(false), 50);
            }, 150);
          }
        }
      }

      // 일정 시간 후 스크롤 상태 리셋
      scrollTimeoutRef.current = setTimeout(() => {
        isScrolling.current = false;
      }, 500);

      // 기본 스크롤 동작 방지
      e.preventDefault();
    },
    [currentView, setIsTransitioning, onDateChange]
  );

  // 캘린더 컨테이너에 휠 이벤트 리스너 추가
  useEffect(() => {
    const calendarEl = calendarContainerRef.current;
    if (!calendarEl) return;

    // 휠 이벤트 리스너 추가 (passive: false로 설정하여 preventDefault 허용)
    calendarEl.addEventListener('wheel', handleWheel, { passive: false });

    // 클린업
    return () => {
      calendarEl.removeEventListener('wheel', handleWheel);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleWheel]);

  // 레이아웃 변경 시 캘린더 크기 재계산 (사이드바, 에이전트 패널)
  useEffect(() => {
    if (calendarRef.current) {
      // 애니메이션이 완료될 때까지 대기
      const resizeTimer = setTimeout(() => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
          calendarApi.updateSize();
        }
      }, 320); // 애니메이션 duration(300ms) + 여유 시간

      return () => clearTimeout(resizeTimer);
    }
  }, [isSidebarOpen, isAgentPanelOpen]);

  return (
    <div
      ref={calendarContainerRef}
      style={{
        opacity: isTransitioning ? 0.3 : 1,
        transition: 'opacity 0.15s ease-in-out',
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

export default Calendar;
