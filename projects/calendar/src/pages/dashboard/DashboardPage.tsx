import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Calendar from '@/components/calendar/core/Calendar';
import CalendarHeader from '@/components/calendar/header/CalendarHeader';
import CreateEventModal from '@/components/calendar/modals/CreateEventModal';
import EditEventModal from '@/components/calendar/modals/EditEventModal';
import type { CalendarEvent, Calendar as CalendarType } from '@/types/calendar';
import { useAuth } from '@/contexts/AuthContext';
import AppSidebar from '@/components/sidebar/AppSidebar';
import ErrorMessage from '@/components/common/error-message/ErrorMessage';
import CalendarCreateModal from '@/components/calendar/modals/CalendarCreateModal';
import CalendarEditModal from '@/components/calendar/modals/CalendarEditModal';
import AgentPanel from '@/components/agent/AgentPanel';
import { AgentProvider } from '@/contexts/AgentContext';
import { useCalendarNavigation } from '@/hooks/useCalendarNavigation';
import { updateCalendar, deleteCalendar } from '@/services/calendarService';
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
import { useTheme } from '@/hooks/useTheme';
import { useResponsive } from '@/hooks/useResponsive';
import { MobileSidebarWrapper } from '@/components/sidebar/MobileSidebarWrapper';
import { TodayTomorrowView } from '@/components/calendar/kanban/TodayTomorrowView';
import { DateEventsPanel } from '@/components/calendar/panels/DateEventsPanel';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';

const DashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const userId = user?.id || '';
  const { isMobile } = useResponsive();
  const [editingCalendar, setEditingCalendar] = useState<CalendarType | null>(
    null
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // localStorage에서 패널 상태 복원
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('checkmate:isSidebarOpen');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return !isMobile;
  });

  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(() => {
    const saved = localStorage.getItem('checkmate:isAgentPanelOpen');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return !isMobile;
  });

  const [viewMode, setViewMode] = useState<'month' | 'today-tomorrow'>('month');
  const [selectedDateForPanel, setSelectedDateForPanel] = useState<Date | null>(
    null
  );
  const [isDatePanelOpen, setIsDatePanelOpen] = useState(false);
  const [deletingCalendar, setDeletingCalendar] = useState<CalendarType | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  // 캘린더 데이터
  const {
    calendars,
    isLoading: isLoadingCalendars,
    error: calendarsError,
    createCalendar,
  } = useCalendars(userId);

  // 복수 선택된 캘린더 id (localStorage에서 복원)
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>(
    () => {
      const saved = localStorage.getItem('checkmate:selectedCalendarIds');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
      return [];
    }
  );

  // 패널 상태를 localStorage에 저장
  useEffect(() => {
    localStorage.setItem(
      'checkmate:isSidebarOpen',
      JSON.stringify(isSidebarOpen)
    );
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem(
      'checkmate:isAgentPanelOpen',
      JSON.stringify(isAgentPanelOpen)
    );
  }, [isAgentPanelOpen]);

  // 선택된 캘린더 ID를 localStorage에 저장
  useEffect(() => {
    localStorage.setItem(
      'checkmate:selectedCalendarIds',
      JSON.stringify(selectedCalendarIds)
    );
  }, [selectedCalendarIds]);

  // 캘린더 목록이 로드되면 저장된 선택 캘린더 ID 유효성 검사
  useEffect(() => {
    if (calendars.length > 0 && selectedCalendarIds.length > 0) {
      const validCalendarIds = calendars.map((cal) => cal.id);
      const filteredIds = selectedCalendarIds.filter((id) =>
        validCalendarIds.includes(id)
      );

      // 유효하지 않은 캘린더가 있다면 업데이트
      if (filteredIds.length !== selectedCalendarIds.length) {
        setSelectedCalendarIds(filteredIds);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendars]);

  // URL 쿼리 파라미터로 캘린더 ID가 전달된 경우 처리
  useEffect(() => {
    const calendarIdFromQuery = searchParams.get('calendar');
    if (calendarIdFromQuery && calendars.length > 0) {
      // 해당 캘린더가 존재하는지 확인
      const calendarExists = calendars.some(
        (cal) => cal.id === calendarIdFromQuery
      );
      if (
        calendarExists &&
        !selectedCalendarIds.includes(calendarIdFromQuery)
      ) {
        setSelectedCalendarIds([calendarIdFromQuery]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, calendars]);

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
  const [createEventDate, setCreateEventDate] = useState<Date | null>(null);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
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
    setIsEditEventModalOpen(true);
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
      setCreateEventDate(date);
      setIsCreateEventModalOpen(true);
    }
  };

  const handleCreateEvent = async (
    eventData: Omit<
      CalendarEvent,
      'id' | 'created_by' | 'created_at' | 'updated_at'
    >
  ) => {
    if (!userId) {
      setLocalError('Please log in to save events');
      return;
    }

    try {
      await createEvent(eventData);
      // 모달 닫기는 CreateEventModal 내부에서 처리
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Failed to create event');
      setIsCreateEventModalOpen(false);
    }
  };

  const handleUpdateEvent = async (eventData: CalendarEvent) => {
    if (!userId) {
      setLocalError('Please log in to save events');
      return;
    }

    try {
      await updateEvent(eventData);
      // 모달 닫기는 EditEventModal 내부에서 처리
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Failed to update event');
      setIsEditEventModalOpen(false);
    }
  };

  const handleEventDrop = async (eventId: string, newDate: Date) => {
    if (!userId) {
      setLocalError('Please log in to update events');
      return;
    }

    try {
      // 드래그된 이벤트 찾기
      const event = mergedEvents.find((e) => e.id === eventId);
      if (!event) return;

      // 새 날짜로 이벤트 업데이트 (종일 일정으로)
      const startDate = new Date(newDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);

      const updatedEvent: CalendarEvent = {
        ...event,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        allDay: true,
      };

      await updateEvent(updatedEvent);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Failed to update event');
    }
  };

  const handleCreateCalendar = async (
    name: string,
    color: string,
    inviteEmails: string[]
  ) => {
    if (!name.trim()) {
      setLocalError('Please enter a calendar name');
      return;
    }

    try {
      await createCalendar({ name, color, inviteEmails });
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
    setIsEditModalOpen(true);
  };

  // 수정 모달 저장
  const handleEditCalendarSave = async (
    calendarId: string,
    updates: { name: string; description?: string; color: string },
    inviteEmails: string[]
  ) => {
    try {
      await updateCalendar(calendarId, updates, inviteEmails);
      await queryClient.invalidateQueries({ queryKey: ['calendars', userId] });
      setIsEditModalOpen(false);
      setEditingCalendar(null);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : '캘린더 수정 실패');
      throw e;
    }
  };

  // 수정 모달 취소
  const handleEditCalendarCancel = () => {
    setIsEditModalOpen(false);
    setEditingCalendar(null);
  };

  // 캘린더 삭제 클릭 시
  const onDeleteCalendar = (calendar: CalendarType) => {
    setDeletingCalendar(calendar);
    setIsDeleteDialogOpen(true);
  };

  // 캘린더 삭제 확인
  const handleDeleteCalendar = async () => {
    if (!deletingCalendar) return;

    setIsDeleting(true);
    try {
      await deleteCalendar(deletingCalendar.id);
      await queryClient.invalidateQueries({ queryKey: ['calendars', userId] });

      // 삭제된 캘린더가 선택되어 있으면 선택 해제
      setSelectedCalendarIds((prev) =>
        prev.filter((id) => id !== deletingCalendar.id)
      );

      setIsDeleteDialogOpen(false);
      setDeletingCalendar(null);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : '캘린더 삭제 실패');
    } finally {
      setIsDeleting(false);
    }
  };

  // 캘린더 삭제 취소
  const handleDeleteCalendarCancel = () => {
    setIsDeleteDialogOpen(false);
    setDeletingCalendar(null);
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
            color: cal.color || '#3b82f6', // 캘린더 색상 사용
          }))}
          onEventClick={handleEventClick}
          className="h-full"
        />
      );
    }

    return (
      <Calendar
        events={mergedEvents}
        calendars={calendars}
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
        onEventDrop={handleEventDrop}
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
              onDeleteCalendar={onDeleteCalendar}
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
                onDeleteCalendar={onDeleteCalendar}
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
        <CalendarEditModal
          isOpen={isEditModalOpen}
          onClose={handleEditCalendarCancel}
          calendar={editingCalendar}
          onSave={handleEditCalendarSave}
        />
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
                setCreateEventDate(selectedDateForPanel);
                setIsCreateEventModalOpen(true);
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

        {/* 이벤트 생성 모달 / 바텀 시트 */}
        {isMobile ? (
          <BottomSheet
            isOpen={isCreateEventModalOpen}
            onClose={() => setIsCreateEventModalOpen(false)}
            title="새 일정"
            height="70%"
          >
            {createEventDate && (
              <CreateEventModal
                isOpen={true}
                onClose={() => setIsCreateEventModalOpen(false)}
                date={createEventDate}
                onSave={handleCreateEvent}
                calendars={calendars}
                defaultSelectedCalendarIds={selectedCalendarIds}
              />
            )}
          </BottomSheet>
        ) : (
          createEventDate && (
            <CreateEventModal
              isOpen={isCreateEventModalOpen}
              onClose={() => setIsCreateEventModalOpen(false)}
              date={createEventDate}
              onSave={handleCreateEvent}
              calendars={calendars}
              defaultSelectedCalendarIds={selectedCalendarIds}
            />
          )
        )}

        {/* 이벤트 수정 모달 / 바텀 시트 */}
        {isMobile ? (
          <BottomSheet
            isOpen={isEditEventModalOpen}
            onClose={() => setIsEditEventModalOpen(false)}
            title="일정 수정"
            height="70%"
          >
            {selectedEvent && (
              <EditEventModal
                isOpen={true}
                onClose={() => setIsEditEventModalOpen(false)}
                event={selectedEvent}
                onSave={handleUpdateEvent}
                onDelete={async (eventId: string) => {
                  if (selectedEvent?.calendar_ids?.[0]) {
                    await deleteEvent({
                      eventId,
                      calendarId: selectedEvent.calendar_ids[0],
                    });
                    setIsEditEventModalOpen(false);
                  }
                }}
                calendars={calendars}
              />
            )}
          </BottomSheet>
        ) : (
          selectedEvent && (
            <EditEventModal
              isOpen={isEditEventModalOpen}
              onClose={() => setIsEditEventModalOpen(false)}
              event={selectedEvent}
              onSave={handleUpdateEvent}
              onDelete={async (eventId: string) => {
                if (selectedEvent?.calendar_ids?.[0]) {
                  await deleteEvent({
                    eventId,
                    calendarId: selectedEvent.calendar_ids[0],
                  });
                  setIsEditEventModalOpen(false);
                }
              }}
              calendars={calendars}
            />
          )
        )}

        <CalendarCreateModal
          isOpen={isCalendarModalOpen}
          onClose={() => setIsCalendarModalOpen(false)}
          onCreateCalendar={handleCreateCalendar}
        />

        {/* 삭제 확인 다이얼로그 */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>캘린더 삭제</DialogTitle>
              <DialogDescription>
                정말로 이 캘린더를 삭제하시겠습니까?
                <br />
                <strong className="text-foreground">
                  {deletingCalendar?.name}
                </strong>
                <br />
                <br />
                <span className="text-red-600">
                  이 작업은 되돌릴 수 없으며, 캘린더와 모든 일정이 영구적으로
                  삭제됩니다.
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                onClick={handleDeleteCalendarCancel}
                variant="outline"
                disabled={isDeleting}
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={handleDeleteCalendar}
                variant="destructive"
                disabled={isDeleting}
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default DashboardPage;
