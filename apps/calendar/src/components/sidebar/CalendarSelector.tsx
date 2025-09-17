import type { Calendar as CalendarType } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreVertical } from 'lucide-react';
import React, { useState } from 'react';
import './CalendarSelector.scss';

interface CalendarSelectorProps {
  calendars: CalendarType[];
  selectedCalendarIds: string[];
  onCalendarChange: (calendarId: string, checked: boolean) => void;
  onCreateCalendarClick: () => void;
  onEditCalendar: (calendar: CalendarType) => void;
}

const CalendarSelector: React.FC<CalendarSelectorProps> = ({
  calendars,
  selectedCalendarIds,
  onCalendarChange,
  onCreateCalendarClick,
  onEditCalendar,
}) => {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  return (
    <div className="calendar-selector">
      <div className="calendar-selector__list">
        {calendars.length === 0 && (
          <div className="calendar-selector__list-empty">캘린더가 없습니다</div>
        )}
        {calendars.map((calendar) => (
          <div key={calendar.id} className="calendar-selector__list-item">
            <div className="calendar-selector__checkbox-card">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={calendar.id}
                  checked={selectedCalendarIds.includes(calendar.id)}
                  onCheckedChange={(checked) =>
                    onCalendarChange(calendar.id, Boolean(checked))
                  }
                />
                <label
                  htmlFor={calendar.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-grow cursor-pointer"
                >
                  {calendar.name}
                </label>
                <div className="calendar-selector__item-actions">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(
                        menuOpenId === calendar.id ? null : calendar.id
                      );
                    }}
                    aria-label="더보기"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            {menuOpenId === calendar.id && (
              <div className="calendar-selector__menu">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setMenuOpenId(null);
                    onEditCalendar(calendar);
                  }}
                >
                  수정
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setMenuOpenId(null);
                  }}
                >
                  삭제
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      <Button
        onClick={onCreateCalendarClick}
        variant="outline"
        size="sm"
        className="w-full"
      >
        + 새 캘린더 만들기
      </Button>
    </div>
  );
};

export default CalendarSelector;
