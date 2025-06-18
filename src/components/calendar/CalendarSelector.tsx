import React from 'react';
import type { Calendar as CalendarType } from '../../types/calendar';
import GoogleCalendarIntegration from '../common/google-calendar-integration/GoogleCalendarIntegration';
import GoogleCalendarSync from '../common/google-calendar-sync/GoogleCalendarSync';

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
        <div className="calendar-selector">
            <select
                value={selectedCalendar?.id || ''}
                onChange={(e) => {
                    const calendarId = e.target.value;
                    const calendar = calendars.find(c => c.id === calendarId);
                    onCalendarChange(calendar || null);
                }}
                disabled={calendars.length === 0}
            >
                {calendars.length === 0 && (
                    <option value="">No calendars available</option>
                )}
                {calendars.map(calendar => (
                    <option key={calendar.id} value={calendar.id}>
                        {calendar.name}
                    </option>
                ))}
            </select>
            <button
                className="create-calendar-button"
                onClick={onCreateCalendarClick}
            >
                Create Calendar
            </button>
            <GoogleCalendarIntegration />
            <GoogleCalendarSync />
        </div>
    );
};

export default CalendarSelector;