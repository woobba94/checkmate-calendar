import React from 'react';
import type { CalendarViewType } from '../../types/calendar';
import './CalendarHeader.css';

interface CalendarHeaderProps {
  view: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  title: string;
  onAddEvent: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  title,
  onAddEvent,
}) => {
  return (
    <div className="calendar-header">
      <div className="calendar-header-left">
        <button onClick={onToday} className="today-button">
          Today
        </button>
      <div className="navigation-buttons">
          <button onClick={onPrev} className="nav-button">
            &lt;
          </button>
          <button onClick={onNext} className="nav-button">
            &gt;
          </button>
        </div>
        <h2 className="calendar-title">{title}</h2>
      </div>
      
      <div className="calendar-header-right">
        <div className="view-buttons">
          <button
            className={`view-button ${view === 'month' ? 'active' : ''}`}
            onClick={() => onViewChange('month')}
          >
            Month
          </button>
          <button
            className={`view-button ${view === 'week' ? 'active' : ''}`}
            onClick={() => onViewChange('week')}
          >
            Week
          </button>
          <button
            className={`view-button ${view === 'day' ? 'active' : ''}`}
            onClick={() => onViewChange('day')}
          >
            Day
          </button>
          <button
            className={`view-button ${view === 'list' ? 'active' : ''}`}
            onClick={() => onViewChange('list')}
          >
            List
          </button>
        </div>
        
        <button onClick={onAddEvent} className="add-event-button">
          + Add Event
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;