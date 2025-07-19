import React, { useState } from 'react';
import type { Calendar as CalendarType } from '@/types/calendar';
import GoogleCalendarIntegration from '@/components/common/google-calendar-integration/GoogleCalendarIntegration';
import GoogleCalendarSync from '@/components/common/google-calendar-sync/GoogleCalendarSync';
import { Button } from "@chakra-ui/react";

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
        <aside className="calendar-sidebar">
            <div className="calendar-list-title">캘린더 목록</div>
            <ul className="calendar-list">
                {calendars.length === 0 && (
                    <li className="calendar-list-empty">캘린더가 없습니다</li>
                )}
                {calendars.map(calendar => (
                    <li key={calendar.id} className="calendar-list-item" style={{ position: 'relative' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                            <input
                                type="checkbox"
                                checked={selectedCalendarIds.includes(calendar.id)}
                                onChange={e => onCalendarChange(calendar.id, e.target.checked)}
                            />
                            <span className={selectedCalendarIds.includes(calendar.id) ? 'selected' : ''}>
                                {calendar.name}
                            </span>
                        </label>
                        <Button
                            onClick={() => setMenuOpenId(menuOpenId === calendar.id ? null : calendar.id)}
                            aria-label="더보기"
                        >
                            ⋮
                        </Button>
                        {menuOpenId === calendar.id && (
                            <div className="calendar-more-menu">
                                <Button onClick={() => { setMenuOpenId(null); onEditCalendar(calendar); }}>수정</Button>
                                <Button onClick={() => { }}>삭제</Button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
            <Button onClick={onCreateCalendarClick}>
                + 새 캘린더 만들기
            </Button>
            <div className="calendar-sidebar-google">
                <GoogleCalendarIntegration />
                <GoogleCalendarSync />
            </div>
        </aside>
    );
};

export default CalendarSelector;