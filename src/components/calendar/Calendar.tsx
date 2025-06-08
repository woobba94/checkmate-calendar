import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { CalendarEvent, CalendarViewType } from '../../types/calendar';
import './Calendar.css';

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  currentView: CalendarViewType;
}

const Calendar: React.FC<CalendarProps> = ({
  events,
  onEventClick,
  onDateClick,
  currentView,
}) => {
  // 뷰 타입 매핑
  const getFullCalendarView = (view: CalendarViewType): string => {
    switch (view) {
      case 'month': return 'dayGridMonth';
      case 'week': return 'timeGridWeek';
      case 'day': return 'timeGridDay';
      case 'list': return 'listWeek';
      default: return 'dayGridMonth';
    }
  };

  const handleEventClick = (info: any) => {
    if (onEventClick) {
      const event = {
        id: info.event.id,
        title: info.event.title,
        start: info.event.start,
        end: info.event.end,
        allDay: info.event.allDay,
        description: info.event.extendedProps.description,
        color: info.event.backgroundColor,
        userId: info.event.extendedProps.userId,
        createdAt: info.event.extendedProps.createdAt,
        updatedAt: info.event.extendedProps.updatedAt,
      };
      onEventClick(event);
    }
  };

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView={getFullCalendarView(currentView)}
        headerToolbar={false} // 헤더는 CalendarHeader 컴포넌트에서 관리
        events={events.map(event => ({
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          description: event.description,
          backgroundColor: event.color,
          userId: event.userId,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        }))}
        eventClick={handleEventClick}
        dateClick={(info) => onDateClick && onDateClick(info.date)}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        height="auto"
      />
    </div>
  );
};

export default Calendar;