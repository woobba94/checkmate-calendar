import React from 'react';
import type { CalendarViewType } from '@/types/calendar';
import './CalendarHeader.scss';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
        <Button onClick={onToday} variant="secondary">
          Today
        </Button>
        <div className="navigation-buttons">
          <Button onClick={onPrev} variant="secondary">
            &lt;
          </Button>
          <Button onClick={onNext} variant="secondary">
            &gt;
          </Button>
        </div>
        <h2 className="calendar-title">{title}</h2>
      </div>

      <div className="calendar-header-right">
        <div className="view-buttons">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => {
              if (value) onViewChange(value as CalendarViewType);
            }}
          >
            <ToggleGroupItem value="month" aria-label="Month view">
              Month
            </ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="Week view">
              Week
            </ToggleGroupItem>
            <ToggleGroupItem value="day" aria-label="Day view">
              Day
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              List
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Button onClick={onAddEvent} variant="default">
          + Add Event
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
