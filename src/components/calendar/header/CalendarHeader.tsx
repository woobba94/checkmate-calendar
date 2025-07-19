import React from 'react';
import type { CalendarViewType } from '@/types/calendar';
import './CalendarHeader.scss';
import { Button } from "@chakra-ui/react";

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
        <Button onClick={onToday}>Today</Button>
        <div className="navigation-buttons">
          <Button onClick={onPrev}>&lt;</Button>
          <Button onClick={onNext}>&gt;</Button>
        </div>
        <h2 className="calendar-title">{title}</h2>
      </div>

      <div className="calendar-header-right">
        <div className="view-buttons">
          <Button
            onClick={() => onViewChange('month')}
          >
            Month
          </Button>
          <Button
            onClick={() => onViewChange('week')}
          >
            Week
          </Button>
          <Button
            onClick={() => onViewChange('day')}
          >
            Day
          </Button>
          <Button
            onClick={() => onViewChange('list')}
          >
            List
          </Button>
        </div>

        <Button onClick={onAddEvent}>+ Add Event</Button>
      </div>
    </div>
  );
};

export default CalendarHeader;