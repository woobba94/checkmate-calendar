import GoogleCalendarIntegration from '@/components/integrations/google-calendar-integration/GoogleCalendarIntegration';
import GoogleCalendarSync from '@/components/integrations/google-calendar-sync/GoogleCalendarSync';
import type { Calendar as CalendarType, User } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Settings, LogOut, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import CalendarSelector from './CalendarSelector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserSettingsDialog } from './UserSettingsDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useResponsive } from '@/hooks/useResponsive';

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
  const [settingsOpen, setSettingsOpen] = useState(false);

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const { isMobile } = useResponsive();

  return (
    <aside className="w-full h-full flex flex-col justify-between overflow-hidden">
      <div>
        <div className="py-3 px-4 text-center">
          <Link to="/">
            <img
              src={
                colorMode === 'light'
                  ? '/text-logo-light.svg'
                  : '/text-logo-dark.svg'
              }
              alt="Checkmate Calendar Logo"
              className="h-12"
            />
          </Link>
        </div>
        <div className={`flex-1 py-3 pl-2 ${isMobile ? 'pr-2' : ''}`}>
          <CalendarSelector
            calendars={calendars}
            selectedCalendarIds={selectedCalendarIds}
            onCalendarChange={onCalendarChange}
            onCreateCalendarClick={onCreateCalendarClick}
            onEditCalendar={onEditCalendar}
          />
          <div className="mt-4 flex flex-col gap-2">
            <GoogleCalendarIntegration />
            <GoogleCalendarSync />
          </div>
        </div>
      </div>
      {user && (
        <div className="flex items-center gap-2 pl-4 pr-2 pt-2 pb-4 w-full h-16">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden flex-1">
              <span className="text-sm font-medium truncate block">
                {user.user_metadata?.display_name || user.email?.split('@')[0]}
              </span>
              <span className="text-xs text-muted-foreground truncate block">
                {user.email}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-accent"
                aria-label="더보기 메뉴"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                <span>설정</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>로그아웃</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <UserSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        colorMode={colorMode}
        toggleColorMode={toggleColorMode}
      />
    </aside>
  );
};

export default AppSidebar;
