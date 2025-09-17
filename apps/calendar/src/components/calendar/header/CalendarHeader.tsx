import React from 'react';
import type { CalendarViewType } from '@/types/calendar';
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
    <div className="flex justify-between items-center p-3 flex-wrap gap-3 md:flex-nowrap">
      <div className="flex items-center gap-4">
        <Button onClick={onToday} variant="secondary">
          Today
        </Button>
        <div className="flex gap-1">
          <Button onClick={onPrev} variant="secondary">
            &lt;
          </Button>
          <Button onClick={onNext} variant="secondary">
            &gt;
          </Button>
        </div>
        <h2 className="text-lg font-semibold m-0">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex border border-[var(--border-color)] rounded overflow-hidden">
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
