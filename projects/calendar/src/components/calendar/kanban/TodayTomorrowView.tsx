import React, { useMemo } from 'react';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarEvent } from '@/types/calendar';
import { cn } from '@/lib/utils';
import './TodayTomorrowView.scss';

interface EventCardProps {
  event: CalendarEvent;
  calendarColor: string;
  calendarName?: string;
  onClick: (event: CalendarEvent) => void;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  calendarColor,
  calendarName,
  onClick,
}) => {
  const formattedTime = event.start_time
    ? format(new Date(`${event.date}T${event.start_time}`), 'HH:mm', { locale: ko })
    : null;

  return (
    <div
      className="event-card"
      onClick={() => onClick(event)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(event);
        }
      }}
    >
      <div className="event-card__color-bar" style={{ backgroundColor: calendarColor }} />
      <div className="event-card__content">
        {formattedTime && (
          <span className="event-card__time">{formattedTime}</span>
        )}
        <h4 className="event-card__title">{event.title}</h4>
        {calendarName && (
          <span className="event-card__calendar-name">{calendarName}</span>
        )}
      </div>
    </div>
  );
};

interface ColumnProps {
  title: '오늘' | '내일';
  date: Date;
  events: CalendarEvent[];
  calendars: Map<string, { name: string; color: string }>;
  onEventClick: (event: CalendarEvent) => void;
}

const Column: React.FC<ColumnProps> = ({
  title,
  date,
  events,
  calendars,
  onEventClick,
}) => {
  const dateString = format(date, 'M월 d일 EEEE', { locale: ko });
  
  // 시간 순으로 정렬
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (!a.start_time && !b.start_time) return 0;
      if (!a.start_time) return 1;
      if (!b.start_time) return -1;
      return a.start_time.localeCompare(b.start_time);
    });
  }, [events]);

  return (
    <div className="kanban-column">
      <div className="kanban-column__header">
        <h3 className="kanban-column__title">{title}</h3>
        <span className="kanban-column__date">{dateString}</span>
      </div>
      <div className="kanban-column__content">
        {sortedEvents.length === 0 ? (
          <div className="kanban-column__empty">일정이 없습니다.</div>
        ) : (
          <div className="kanban-column__events">
            {sortedEvents.map((event) => {
              const calendar = calendars.get(event.calendar_id);
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  calendarColor={calendar?.color || '#e5e5e5'}
                  calendarName={calendar?.name}
                  onClick={onEventClick}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

interface TodayTomorrowViewProps {
  events: CalendarEvent[];
  calendars: Array<{ id: string; name: string; color: string }>;
  onEventClick: (event: CalendarEvent) => void;
  className?: string;
}

export const TodayTomorrowView: React.FC<TodayTomorrowViewProps> = ({
  events,
  calendars,
  onEventClick,
  className,
}) => {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  // 캘린더 맵 생성
  const calendarMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    calendars.forEach((cal) => {
      map.set(cal.id, { name: cal.name, color: cal.color });
    });
    return map;
  }, [calendars]);

  // 오늘과 내일 일정 필터링
  const { todayEvents, tomorrowEvents } = useMemo(() => {
    const todayEvts: CalendarEvent[] = [];
    const tomorrowEvts: CalendarEvent[] = [];

    events.forEach((event) => {
      const eventDate = new Date(event.date);
      if (isToday(eventDate)) {
        todayEvts.push(event);
      } else if (isTomorrow(eventDate)) {
        tomorrowEvts.push(event);
      }
    });

    return { todayEvents: todayEvts, tomorrowEvents: tomorrowEvts };
  }, [events]);

  return (
    <div className={cn('today-tomorrow-view', className)}>
      <Column
        title="오늘"
        date={today}
        events={todayEvents}
        calendars={calendarMap}
        onEventClick={onEventClick}
      />
      <Column
        title="내일"
        date={tomorrow}
        events={tomorrowEvents}
        calendars={calendarMap}
        onEventClick={onEventClick}
      />
    </div>
  );
};
