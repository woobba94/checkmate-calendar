import React from 'react';
import type { CalendarViewType } from '@/types/calendar';
import './CalendarHeader.scss';
import { Button, SegmentGroup } from "@chakra-ui/react";

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
        <Button onClick={onToday} variant="surface">Today</Button>
        <div className="navigation-buttons">
          <Button onClick={onPrev} variant="surface">&lt;</Button>
          <Button onClick={onNext} variant="surface">&gt;</Button>
        </div>
        <h2 className="calendar-title">{title}</h2>
      </div>

      <div className="calendar-header-right">
        <div className="view-buttons">
          <SegmentGroup.Root value={view} onValueChange={({ value }) => onViewChange(value as CalendarViewType)}>
            <SegmentGroup.Indicator />
            <SegmentGroup.Items items={[
              { label: "Month", value: "month" },
              { label: "Week", value: "week" },
              { label: "Day", value: "day" },
              { label: "List", value: "list" },
            ]} />
          </SegmentGroup.Root>
        </div>
        <Button onClick={onAddEvent} variant="surface">+ Add Event</Button>
      </div>
    </div>
  );
};

export default CalendarHeader;