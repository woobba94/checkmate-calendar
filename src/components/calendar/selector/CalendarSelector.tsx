import React, { useState } from 'react';
import type { Calendar as CalendarType } from '@/types/calendar';
import type { User } from '@/types/calendar';
import GoogleCalendarIntegration from '@/components/common/google-calendar-integration/GoogleCalendarIntegration';
import GoogleCalendarSync from '@/components/common/google-calendar-sync/GoogleCalendarSync';
import { Link } from "react-router-dom";
import { Button, CheckboxCard } from "@chakra-ui/react";
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
            <div>
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
                <div className="calendar-sidebar__list">
                    {calendars.length === 0 && (
                        <div className="calendar-sidebar__list-empty">캘린더가 없습니다</div>
                    )}
                    {calendars.map(calendar => (
                        <div key={calendar.id} className="calendar-sidebar__list-item">
                            <CheckboxCard.Root
                                checked={selectedCalendarIds.includes(calendar.id)}
                                onCheckedChange={(details) => onCalendarChange(calendar.id, Boolean(details.checked))}
                                size="sm"
                                variant="outline"
                                className="calendar-sidebar__checkbox-card"
                            >
                                <CheckboxCard.HiddenInput />
                                <CheckboxCard.Control>
                                    <CheckboxCard.Label>{calendar.name}</CheckboxCard.Label>
                                    <div className="calendar-sidebar__item-actions">
                                        <Button
                                            size="xs"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMenuOpenId(menuOpenId === calendar.id ? null : calendar.id);
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
                                <div className="calendar-sidebar__menu">
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
                <Button onClick={onCreateCalendarClick} variant="outline" size="sm" w="100%">
                    + 새 캘린더 만들기
                </Button>
                <div className="calendar-sidebar__google">
                    <GoogleCalendarIntegration />
                    <GoogleCalendarSync />
                </div>
            </div>  
            </div>
            <div className="calendar-sidebar__footer">
                <Button onClick={toggleColorMode} variant="ghost" size="sm" aria-label="색상 모드 토글">
                    {colorMode === 'light' ? <LuMoon /> : <LuSun />}
                </Button>
                {user ? (
                    <>
                        <div className="calendar-sidebar__user-email">{user.email}</div>
                        <Button onClick={logout} variant="outline" size="sm">Logout</Button>
                    </>
                ) : null}
            </div>
        </aside>
    );
};

export default CalendarSelector;