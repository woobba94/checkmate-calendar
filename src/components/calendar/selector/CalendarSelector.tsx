import React from 'react';
import type { Calendar as CalendarType } from '@/types/calendar';
import GoogleCalendarIntegration from '@/components/common/google-calendar-integration/GoogleCalendarIntegration';
import GoogleCalendarSync from '@/components/common/google-calendar-sync/GoogleCalendarSync';

interface CalendarSelectorProps {
    calendars: CalendarType[];
    selectedCalendar: CalendarType | null;
    onCalendarChange: (calendar: CalendarType | null) => void;
    onCreateCalendarClick: () => void;
}

const CalendarSelector: React.FC<CalendarSelectorProps> = ({
    calendars,
    selectedCalendar,
    onCalendarChange,
    onCreateCalendarClick,
}) => {
    return (
        <aside className="calendar-sidebar">
            <div className="calendar-list-title">캘린더 목록</div>
            <ul className="calendar-list">
                {calendars.length === 0 && (
                    <li className="calendar-list-empty">캘린더가 없습니다</li>
                )}
                {calendars.map(calendar => (
                    <li
                        key={calendar.id}
                        className={`calendar-list-item${selectedCalendar?.id === calendar.id ? ' selected' : ''}`}
                        onClick={() => onCalendarChange(calendar)}
                    >
                        {calendar.name}
                    </li>
                ))}
            </ul>
            <button
                className="create-calendar-button sidebar"
                onClick={onCreateCalendarClick}
            >
                + 새 캘린더 만들기
            </button>
            <div className="calendar-sidebar-google">
                <GoogleCalendarIntegration />
                <GoogleCalendarSync />
            </div>
        </aside>
    );
};

export default CalendarSelector;