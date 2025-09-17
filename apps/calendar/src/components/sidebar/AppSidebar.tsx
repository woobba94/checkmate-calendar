import GoogleCalendarIntegration from '@/components/integrations/google-calendar-integration/GoogleCalendarIntegration';
import GoogleCalendarSync from '@/components/integrations/google-calendar-sync/GoogleCalendarSync';
import type { Calendar as CalendarType, User } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import './AppSidebar.scss';
import CalendarSelector from './CalendarSelector';

interface AppSidebarProps {
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

const AppSidebar: React.FC<AppSidebarProps> = ({
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
  return (
    <aside className="app-sidebar">
      <div>
        <div className="app-sidebar__logo">
          <Link to="/">
            <img
              src={
                colorMode === 'light'
                  ? '/text-logo-light.svg'
                  : '/text-logo-dark.svg'
              }
              alt="Checkmate Calendar Logo"
              className="app-sidebar__logo-img"
            />
          </Link>
        </div>
        <div className="app-sidebar__main">
          <CalendarSelector
            calendars={calendars}
            selectedCalendarIds={selectedCalendarIds}
            onCalendarChange={onCalendarChange}
            onCreateCalendarClick={onCreateCalendarClick}
            onEditCalendar={onEditCalendar}
          />
          <div className="app-sidebar__integrations">
            <GoogleCalendarIntegration />
            <GoogleCalendarSync />
          </div>
        </div>
      </div>
      <div className="app-sidebar__footer">
        <Button
          onClick={toggleColorMode}
          variant="ghost"
          size="sm"
          aria-label="색상 모드 토글"
        >
          {colorMode === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
        {user ? (
          <>
            <div className="app-sidebar__user-email">{user.email}</div>
            <Button onClick={logout} variant="outline" size="sm">
              Logout
            </Button>
          </>
        ) : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
