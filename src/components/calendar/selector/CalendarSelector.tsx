import React, { useState } from 'react';
import type { Calendar as CalendarType } from '@/types/calendar';
import type { User } from '@/types/calendar';
import GoogleCalendarIntegration from '@/components/common/google-calendar-integration/GoogleCalendarIntegration';
import GoogleCalendarSync from '@/components/common/google-calendar-sync/GoogleCalendarSync';
import { Link } from "react-router-dom";
import { Button } from "@chakra-ui/react";
import { LuSun, LuMoon } from "react-icons/lu";
import "./CalendarSelector.scss";

interface CalendarSelectorProps {
    calendars: CalendarType[];
    selectedCalendarIds: string[];
    onCalendarChange: (calendarId: string, checked: boolean) => void;
    onCreateCalendarClick: () => void;
    onEditCalendar: (calendar: CalendarType) => void;
    user?: User | null;
    logout?: () => void;
    colorMode: 'light' | 'dark';
    toggleColorMode: () => void;
}

const CalendarSelector: React.FC<CalendarSelectorProps> = ({
    calendars,
    selectedCalendarIds,
    onCalendarChange,
    onCreateCalendarClick,
    onEditCalendar,
    user,
    logout,
    colorMode,
    toggleColorMode,
}) => {
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    return (
        <aside className="calendar-sidebar">
            <div className="calendar-sidebar__logo">
                <Link to="/">
                    <img
                        src={colorMode === 'light' ? '/text-logo-light.svg' : '/text-logo-dark.svg'}
                        alt="Checkmate Calendar Logo"
                        className="calendar-sidebar__logo-img"
                    />
                </Link>
            </div>
            <div className="calendar-sidebar__main">
                <div className="calendar-sidebar__list-title">캘린더 목록</div>
                <ul className="calendar-sidebar__list">
                    {calendars.length === 0 && (
                        <li className="calendar-sidebar__list-empty">캘린더가 없습니다</li>
                    )}
                    {calendars.map(calendar => (
                        <li key={calendar.id} className={`calendar-sidebar__list-item${selectedCalendarIds.includes(calendar.id) ? ' calendar-sidebar__list-item--selected' : ''}`}>
                            <label className="calendar-sidebar__label">
                                <input
                                    type="checkbox"
                                    checked={selectedCalendarIds.includes(calendar.id)}
                                    onChange={e => onCalendarChange(calendar.id, e.target.checked)}
                                />
                                <span>{calendar.name}</span>
                            </label>
                            <Button
                                onClick={() => setMenuOpenId(menuOpenId === calendar.id ? null : calendar.id)}
                                aria-label="더보기"
                                variant="surface"
                            >
                                ⋮
                            </Button>
                            {menuOpenId === calendar.id && (
                                <div className="calendar-more-menu">
                                    <Button onClick={() => { setMenuOpenId(null); onEditCalendar(calendar); }} variant="surface">수정</Button>
                                    <Button onClick={() => { }} variant="surface">삭제</Button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
                <Button onClick={onCreateCalendarClick} variant="surface">
                    + 새 캘린더 만들기
                </Button>
                <div className="calendar-sidebar__google">
                    <GoogleCalendarIntegration />
                    <GoogleCalendarSync />
                </div>
            </div>
            <div className="calendar-sidebar__footer">
                <Button onClick={toggleColorMode} variant="ghost" size="sm" aria-label="색상 모드 토글">
                    {colorMode === 'light' ? <LuMoon /> : <LuSun />}
                </Button>
                {user ? (
                    <>
                        <div className="calendar-sidebar__user-email">{user.email}</div>
                        <Button onClick={logout} variant="surface" size="sm">Logout</Button>
                    </>
                ) : null}
            </div>
        </aside>
    );
};

export default CalendarSelector;