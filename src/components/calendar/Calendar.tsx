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

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView={getFullCalendarView(currentView)}
        headerToolbar={false} // 헤더는 CalendarHeader 컴포넌트에서 따로관리
        events={events.map(event => ({
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
          }
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