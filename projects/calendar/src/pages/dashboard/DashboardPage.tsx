import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import Calendar from '@/components/calendar/core/Calendar';
import CalendarHeader from '@/components/calendar/header/CalendarHeader';
import EventModal from '@/components/calendar/modals/EventModal';
import type { CalendarEvent, Calendar as CalendarType } from '@/types/calendar';
import { useAuth } from '@/contexts/AuthContext';
import AppSidebar from '@/components/sidebar/AppSidebar';
import ErrorMessage from '@/components/common/error-message/ErrorMessage';
import CalendarCreateModal from '@/components/calendar/modals/CalendarCreateModal';
import AgentPanel from '@/components/agent/AgentPanel';
import { AgentProvider } from '@/contexts/AgentContext';
import { useCalendarNavigation } from '@/hooks/useCalendarNavigation';
import { updateCalendar } from '@/services/calendarService';
import { useQueryClient } from '@tanstack/react-query';
import { useCalendars } from '@/hooks/useCalendars';
import { useEventsByCalendars } from '@/hooks/useEventsByCalendars';
import { useEventMutations } from '@/hooks/useEventMutations';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/hooks/useTheme';
import { useResponsive } from '@/hooks/useResponsive';
import { MobileSidebarWrapper } from '@/components/sidebar/MobileSidebarWrapper';
import { TodayTomorrowView } from '@/components/calendar/kanban/TodayTomorrowView';
import { DateEventsPanel } from '@/components/calendar/panels/DateEventsPanel';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const userId = user?.id || '';
  const { isMobile } = useResponsive();
  const [editingCalendar, setEditingCalendar] = useState<CalendarType | null>(
    null
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(!isMobile);
  const [viewMode, setViewMode] = useState<'month' | 'today-tomorrow'>('month');
  const [selectedDateForPanel, setSelectedDateForPanel] = useState<Date | null>(
    null
  );
  const [isDatePanelOpen, setIsDatePanelOpen] = useState(false);
  const queryClient = useQueryClient();

  // 캘린더 데이터
  const {
    calendars,
    isLoading: isLoadingCalendars,
    error: calendarsError,
    createCalendar,
  } = useCalendars(userId);

  // 복수 선택된 캘린더 id
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);

  const handleCalendarToggle = (calendarId: string, checked: boolean) => {
    setSelectedCalendarIds((prev) =>
      checked ? [...prev, calendarId] : prev.filter((id) => id !== calendarId)
    );
  };

  // 선택된 캘린더들의 이벤트 데이터
  const {
    events: mergedEvents,
    eventsByCalendar: _eventsByCalendar,
    isLoading: isLoadingEvents,
    errors: eventsErrors,
    refetch: _refetchEvents,
  } = useEventsByCalendars(selectedCalendarIds);

  // 이벤트 변이 훅
  const { createEvent, updateEvent, deleteEvent } = useEventMutations(userId);

  const { view, currentDate, setCurrentDate, handleToday, getTitle } =
    useCalendarNavigation();

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(
    undefined
  );
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (calendarsError) {
      setLocalError(calendarsError.message);
    }
    if (eventsErrors && eventsErrors.length > 0) {
      setLocalError(eventsErrors[0].message);
    }
  }, [calendarsError, eventsErrors]);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleDateClick = (date: Date) => {
    if (!selectedCalendarIds.length) {
      setLocalError('Please select or create a calendar first');
      return;
    }

    if (!userId) {
      setLocalError('Please log in to add events');
      return;
    }

    if (isMobile) {
      // 모바일: 날짜 이벤트 패널 열기
      setSelectedDateForPanel(date);
      setIsDatePanelOpen(true);
    } else {
      // 데스크톱: 직접 이벤트 추가 모달 열기
      const newEvent: Omit<
        CalendarEvent,
        'id' | 'created_by' | 'created_at' | 'updated_at'
      > = {
        title: '',
        start: date,
        calendar_id: selectedCalendarIds[0],
      };

      setSelectedEvent(newEvent as CalendarEvent);
      setIsEventModalOpen(true);
    }
  };

  const handleSaveEvent = async (
    eventData:
      | CalendarEvent
      | Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>
  ) => {
    if (!userId) {
      setLocalError('Please log in to save events');
      return;
    }

    try {
      if ('id' in eventData && eventData.id) {
        await updateEvent(eventData as CalendarEvent);
      } else {
        await createEvent(
          eventData as Omit<
            CalendarEvent,
            'id' | 'created_by' | 'created_at' | 'updated_at'
          >
        );
      }
      setIsEventModalOpen(false);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Failed to save event');
    }
  };

  const handleCreateCalendar = async (name: string) => {
    if (!name.trim()) {
      setLocalError('Please enter a calendar name');
      return;
    }

    try {
      await createCalendar({ name });
      setIsCalendarModalOpen(false);
    } catch (e) {
      setLocalError(
        e instanceof Error ? e.message : 'Failed to create calendar'
      );
    }
  };

  // 사이드바에서 수정 클릭 시
  const onEditCalendar = (calendar: CalendarType) => {
    setEditingCalendar(calendar);
    setEditName(calendar.name);
    setEditDesc(calendar.description || '');
    setIsEditModalOpen(true);
  };

  // 수정 모달 저장
  const handleEditCalendarSave = async () => {
    if (!editingCalendar) return;
    setEditLoading(true);
    try {
      await updateCalendar(editingCalendar.id, {
        name: editName,
        description: editDesc,
      });
      await queryClient.invalidateQueries({ queryKey: ['calendars', userId] });
      setIsEditModalOpen(false);
      setEditingCalendar(null);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : '캘린더 수정 실패');
    } finally {
      setEditLoading(false);
    }
  };

  // 수정 모달 취소
  const handleEditCalendarCancel = () => {
    setIsEditModalOpen(false);
    setEditingCalendar(null);
  };

  // 오늘 날짜가 현재 월에 포함되어 있는지 확인
  const isTodayInCurrentMonth = useMemo(() => {
    const today = new Date();
    return (
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  }, [currentDate]);

  // 날짜별 이벤트 필터링
  const getEventsForDate = (date: Date) => {
    return mergedEvents.filter((event) => {
      const eventDate =
        typeof event.start === 'string' ? new Date(event.start) : event.start;
      return (
        eventDate.toISOString().split('T')[0] ===
        date.toISOString().split('T')[0]
      );
    });
  };

  // renderCalendarContent도 병합된 이벤트로 변경
  const renderCalendarContent = () => {
    if (isLoadingCalendars || isLoadingEvents) {
      return (
        <div className="flex justify-center items-center h-[400px] text-lg text-[var(--text-muted)]">
          Loading calendar...
        </div>
      );
    }
    if (eventsErrors && eventsErrors.length > 0) {
      return (
        <div className="text-[var(--error-color)]">
          {eventsErrors[0].message}
        </div>
      );
    }
    if (!selectedCalendarIds.length) {
      return (
        <div className="flex justify-center items-center h-full text-gray-500">
          <p>좌측에서 하나 이상의 캘린더를 선택하세요.</p>
        </div>
      );
    }

    // 뷰 모드에 따라 다른 컴포넌트 렌더링
    if (viewMode === 'today-tomorrow') {
      return (
        <TodayTomorrowView
          events={mergedEvents}
          calendars={calendars.map((cal) => ({
            id: cal.id,
            name: cal.name,
            color: '#3b82f6', // 기본 색상
          }))}
          onEventClick={handleEventClick}
          className="h-full"
        />
      );
    }

    return (
      <Calendar
        events={mergedEvents}
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
        currentView={view}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        isSidebarOpen={isSidebarOpen}
        isAgentPanelOpen={isAgentPanelOpen}
      />
    );
  };

  const { theme, toggleTheme } = useTheme();

  return (
    <Layout>
      <div
        className={cn(
          'flex flex-row w-full bg-[#f4f4f5]',
          isMobile && 'flex-col'
        )}
      >
        {/* 사이드바 */}
        {isMobile ? (
          <MobileSidebarWrapper
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          >
            <AppSidebar
              calendars={calendars}
              selectedCalendarIds={selectedCalendarIds}
              onCalendarChange={handleCalendarToggle}
              onCreateCalendarClick={() => setIsCalendarModalOpen(true)}
              onEditCalendar={onEditCalendar}
              user={user}
              logout={logout}
              colorMode={theme || 'light'}
              toggleColorMode={toggleTheme}
            />
          </MobileSidebarWrapper>
        ) : (
          <div
            className={`transition-all duration-300 ease-in-out ${
              isSidebarOpen ? 'w-64' : 'w-0'
            } overflow-hidden flex-shrink-0`}
          >
            <div className="w-64 h-full">
              <AppSidebar
                calendars={calendars}
                selectedCalendarIds={selectedCalendarIds}
                onCalendarChange={handleCalendarToggle}
                onCreateCalendarClick={() => setIsCalendarModalOpen(true)}
                onEditCalendar={onEditCalendar}
                user={user}
                logout={logout}
                colorMode={theme || 'light'}
                toggleColorMode={toggleTheme}
              />
            </div>
          </div>
        )}
        <div
          className={cn(
            'flex flex-col flex-1 min-w-0 bg-white',
            !isMobile && 'rounded-lg border border-zinc-300 m-2'
          )}
        >
          <CalendarHeader
            onToday={handleToday}
            title={getTitle()}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            currentDate={currentDate}
            isAgentPanelOpen={isAgentPanelOpen}
            onToggleAgentPanel={() => setIsAgentPanelOpen(!isAgentPanelOpen)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          <ErrorMessage
            error={localError}
            onDismiss={() => setLocalError(null)}
          />
          <div className="h-full p-5 flex flex-col">
            {renderCalendarContent()}
          </div>
        </div>
        {/* 에이전트 패널 */}
        {isMobile ? (
          <AgentProvider>
            <AgentPanel />
          </AgentProvider>
        ) : (
          <div
            className={`transition-all duration-300 ease-in-out ${
              isAgentPanelOpen ? 'w-80' : 'w-0'
            } overflow-hidden flex-shrink-0`}
          >
            <div className="w-80 h-full">
              <AgentProvider>
                <AgentPanel />
              </AgentProvider>
            </div>
          </div>
        )}
        <Dialog
          open={isEditModalOpen}
          onOpenChange={(open) => {
            if (!open) handleEditCalendarCancel();
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditCalendarSave();
              }}
            >
              <DialogHeader>
                <DialogTitle>캘린더 수정</DialogTitle>
                <DialogDescription>
                  캘린더의 정보를 수정합니다.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">설명</Label>
                  <Input
                    id="description"
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  onClick={handleEditCalendarCancel}
                  variant="outline"
                >
                  취소
                </Button>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? '저장 중...' : '저장'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {/* 모바일: 날짜 이벤트 패널 */}
        {isMobile && (
          <DateEventsPanel
            isOpen={isDatePanelOpen}
            date={selectedDateForPanel}
            events={
              selectedDateForPanel ? getEventsForDate(selectedDateForPanel) : []
            }
            calendars={calendars}
            onClose={() => setIsDatePanelOpen(false)}
            onEventClick={handleEventClick}
            onAddClick={() => {
              if (selectedDateForPanel) {
                const newEvent: Omit<
                  CalendarEvent,
                  'id' | 'created_by' | 'created_at' | 'updated_at'
                > = {
                  title: '',
                  start: selectedDateForPanel,
                  calendar_id: selectedCalendarIds[0],
                };
                setSelectedEvent(newEvent as CalendarEvent);
                setIsEventModalOpen(true);
              }
            }}
          />
        )}

        {/* 플로팅 오늘 버튼 */}
        {isMobile && !isTodayInCurrentMonth && viewMode === 'month' && (
          <Button
            variant="primary"
            size="default"
            className="fixed bottom-[120px] left-1/2 transform -translate-x-1/2 z-[900] shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            onClick={handleToday}
          >
            오늘
            <Crosshair className="h-4 w-4 ml-2" />
          </Button>
        )}

        {/* 이벤트 모달 / 바텀 시트 */}
        {isMobile ? (
          <BottomSheet
            isOpen={isEventModalOpen}
            onClose={() => setIsEventModalOpen(false)}
            title={selectedEvent?.id ? '일정 수정' : '새 일정'}
            height="70%"
          >
            {/* TODO: EventModal 내용을 모바일용으로 수정 필요 */}
            <EventModal
              isOpen={true}
              onClose={() => setIsEventModalOpen(false)}
              event={selectedEvent}
              onSave={handleSaveEvent}
              onDelete={async (eventId: string) => {
                if (selectedEvent?.calendar_id) {
                  await deleteEvent({
                    eventId,
                    calendarId: selectedEvent.calendar_id,
                  });
                  setIsEventModalOpen(false);
                }
              }}
              calendars={calendars.filter((c) =>
                selectedCalendarIds.includes(c.id)
              )}
              defaultCalendarId={
                selectedCalendarIds[selectedCalendarIds.length - 1]
              }
            />
          </BottomSheet>
        ) : (
          <EventModal
            isOpen={isEventModalOpen}
            onClose={() => setIsEventModalOpen(false)}
            event={selectedEvent}
            onSave={handleSaveEvent}
            onDelete={async (eventId: string) => {
              if (selectedEvent?.calendar_id) {
                await deleteEvent({
                  eventId,
                  calendarId: selectedEvent.calendar_id,
                });
                setIsEventModalOpen(false);
              }
            }}
            calendars={calendars.filter((c) =>
              selectedCalendarIds.includes(c.id)
            )}
            defaultCalendarId={
              selectedCalendarIds[selectedCalendarIds.length - 1]
            }
          />
        )}

        <CalendarCreateModal
          isOpen={isCalendarModalOpen}
          onClose={() => setIsCalendarModalOpen(false)}
          onCreateCalendar={handleCreateCalendar}
        />
      </div>
    </Layout>
  );
};

export default DashboardPage;
