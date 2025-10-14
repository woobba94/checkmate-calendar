import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import type { CalendarEvent, Calendar } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { cn } from '@/lib/utils';
import './DateEventsPanel.scss';

interface EventItemProps {
  event: CalendarEvent;
  calendar?: Calendar;
  onClick: (event: CalendarEvent) => void;
}

const EventItem: React.FC<EventItemProps> = ({ event, calendar, onClick }) => {
  const eventDate =
    typeof event.start === 'string' ? new Date(event.start) : event.start;
  const formattedTime = !event.allDay
    ? format(eventDate, 'HH:mm', { locale: ko })
    : '종일';

  return (
    <div
      className="event-item"
      onClick={() => onClick(event)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(event);
        }
      }}
    >
      <div
        className="event-item__color-indicator"
        style={{ backgroundColor: calendar?.color || '#e5e5e5' }}
      />
      <div className="event-item__content">
        <div className="event-item__header">
          <span className="event-item__time">{formattedTime}</span>
          {calendar && (
            <span className="event-item__calendar-name">{calendar.name}</span>
          )}
        </div>
        <h4 className="event-item__title">{event.title}</h4>
        {event.description && (
          <p className="event-item__description">{event.description}</p>
        )}
      </div>
    </div>
  );
};

interface DateEventsPanelProps {
  isOpen: boolean;
  date: Date | null;
  events: CalendarEvent[];
  calendars: Calendar[];
  onClose: () => void;
  onEventClick: (event: CalendarEvent) => void;
  onAddClick: () => void;
  calendarWeekView?: React.ReactNode;
}

export const DateEventsPanel: React.FC<DateEventsPanelProps> = ({
  isOpen,
  date,
  events,
  calendars,
  onClose,
  onEventClick,
  onAddClick,
  calendarWeekView,
}) => {
  const dateString = date ? format(date, 'M월 d일 EEEE', { locale: ko }) : '';

  // 캘린더 맵 생성
  const calendarMap = useMemo(() => {
    const map = new Map<string, Calendar>();
    calendars.forEach((cal) => {
      map.set(cal.id, cal);
    });
    return map;
  }, [calendars]);

  // 시간 순으로 이벤트 정렬
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aDate = typeof a.start === 'string' ? new Date(a.start) : a.start;
      const bDate = typeof b.start === 'string' ? new Date(b.start) : b.start;
      return aDate.getTime() - bDate.getTime();
    });
  }, [events]);

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={dateString}
        height="70%"
        className="date-events-panel"
      >
        {/* 선택된 주 캘린더 뷰 */}
        {calendarWeekView && (
          <div className="date-events-panel__week-view">{calendarWeekView}</div>
        )}

        {/* 일정 목록 */}
        <div className="date-events-panel__events">
          {sortedEvents.length === 0 ? (
            <div className="date-events-panel__empty">
              <p>일정이 없습니다.</p>
            </div>
          ) : (
            sortedEvents.map((event) => (
              <EventItem
                key={event.id}
                event={event}
                calendar={calendarMap.get(event.calendar_ids?.[0] || '')}
                onClick={onEventClick}
              />
            ))
          )}
        </div>
      </BottomSheet>

      {/* 플로팅 추가 버튼 */}
      {isOpen && (
        <Button
          className="date-events-panel__fab"
          size="icon"
          onClick={onAddClick}
          aria-label="일정 추가"
        >
          <Plus className="h-5 w-5" />
        </Button>
      )}
    </>
  );
};
