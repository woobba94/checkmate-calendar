import type { Calendar as CalendarType } from '@/types/calendar';
import { Button, CheckboxCard } from '@chakra-ui/react';
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
            <CheckboxCard.Root
              checked={selectedCalendarIds.includes(calendar.id)}
              onCheckedChange={(details) =>
                onCalendarChange(calendar.id, Boolean(details.checked))
              }
              size="sm"
              variant="outline"
              className="calendar-selector__checkbox-card"
            >
              <CheckboxCard.HiddenInput />
              <CheckboxCard.Control>
                <CheckboxCard.Label>{calendar.name}</CheckboxCard.Label>
                <div className="calendar-selector__item-actions">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(
                        menuOpenId === calendar.id ? null : calendar.id
                      );
                    }}
                    aria-label="더보기"
                  >
                    ⋮
                  </Button>
                </div>
                <CheckboxCard.Indicator />
              </CheckboxCard.Control>
            </CheckboxCard.Root>
            {menuOpenId === calendar.id && (
              <div className="calendar-selector__menu">
                <Button
                  size="xs"
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
        w="100%"
      >
        + 새 캘린더 만들기
      </Button>
    </div>
  );
};

export default CalendarSelector;
