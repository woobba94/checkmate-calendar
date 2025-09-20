import React, { useMemo, useState } from 'react';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { CalendarEvent } from '@/types/calendar';
import { cn } from '@/lib/utils';
import { useLongPress } from '@/hooks/useLongPress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash } from 'lucide-react';
import './TodayTomorrowView.scss';

interface EventCardProps {
  event: CalendarEvent;
  calendarColor: string;
  calendarName?: string;
  onClick: (event: CalendarEvent) => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  calendarColor,
  calendarName,
  onClick,
  onEdit,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const eventDate =
    typeof event.start === 'string' ? new Date(event.start) : event.start;
  const formattedTime = !event.allDay
    ? format(eventDate, 'HH:mm', { locale: ko })
    : null;

  const longPressHandlers = useLongPress({
    onLongPress: () => setShowMenu(true),
    onClick: () => onClick(event),
    threshold: 500,
  });

  return (
    <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
      <DropdownMenuTrigger asChild>
        <div
          className="event-card"
          role="button"
          tabIndex={0}
          {...longPressHandlers}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onClick(event);
            }
          }}
        >
          <div
            className="event-card__color-bar"
            style={{ backgroundColor: calendarColor }}
          />
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => {
            onEdit?.(event);
            setShowMenu(false);
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          수정
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onDelete?.(event);
            setShowMenu(false);
          }}
          className="text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" />
          삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface ColumnProps {
  title: '오늘' | '내일';
  date: Date;
  events: CalendarEvent[];
  calendars: Map<string, { name: string; color: string }>;
  onEventClick: (event: CalendarEvent) => void;
}

interface ColumnProps {
  title: '오늘' | '내일';
  date: Date;
  events: CalendarEvent[];
  calendars: Map<string, { name: string; color: string }>;
  onEventClick: (event: CalendarEvent) => void;
  onEventEdit?: (event: CalendarEvent) => void;
  onEventDelete?: (event: CalendarEvent) => void;
}

const Column: React.FC<ColumnProps> = ({
  title,
  date,
  events,
  calendars,
  onEventClick,
  onEventEdit,
  onEventDelete,
}) => {
  const dateString = format(date, 'M월 d일 EEEE', { locale: ko });

  // 시간 순으로 정렬
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aDate = typeof a.start === 'string' ? new Date(a.start) : a.start;
      const bDate = typeof b.start === 'string' ? new Date(b.start) : b.start;
      return aDate.getTime() - bDate.getTime();
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
                  onEdit={onEventEdit}
                  onDelete={onEventDelete}
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
  onEventEdit?: (event: CalendarEvent) => void;
  onEventDelete?: (event: CalendarEvent) => void;
  className?: string;
}

export const TodayTomorrowView: React.FC<TodayTomorrowViewProps> = ({
  events,
  calendars,
  onEventClick,
  onEventEdit,
  onEventDelete,
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
      const eventDate =
        typeof event.start === 'string' ? new Date(event.start) : event.start;
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
        onEventEdit={onEventEdit}
        onEventDelete={onEventDelete}
      />
      <Column
        title="내일"
        date={tomorrow}
        events={tomorrowEvents}
        calendars={calendarMap}
        onEventClick={onEventClick}
        onEventEdit={onEventEdit}
        onEventDelete={onEventDelete}
      />
    </div>
  );
};
