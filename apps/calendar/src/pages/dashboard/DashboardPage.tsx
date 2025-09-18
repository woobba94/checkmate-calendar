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

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const userId = user?.id || '';
  const [editingCalendar, setEditingCalendar] = useState<CalendarType | null>(
    null
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(true);
  const queryClient = useQueryClient();

  // 캘린더 데이터
  const { calendars, isLoading: isLoadingCalendars, error: calendarsError, createCalendar } = useCalendars(userId);

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
    eventsByCalendar, 
    isLoading: isLoadingEvents, 
    errors: eventsErrors,
    refetch: refetchEvents 
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

    const newEvent: Omit<
      CalendarEvent,
      'id' | 'created_by' | 'created_at' | 'updated_at'
    > = {
      title: '',
      start: date,
      calendar_id: selectedCalendarIds[0], // TODO 일단 첫 번째 선택된 캘린더로 이벤트 생성 -> 기획 결정 필요
    };

    setSelectedEvent(newEvent as CalendarEvent);
    setIsEventModalOpen(true);
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
        await createEvent(eventData as Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>);
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
      return <div className="text-[var(--error-color)]">{eventsErrors[0].message}</div>;
    }
    if (!selectedCalendarIds.length) {
      return (
        <div className="flex justify-center items-center h-full text-gray-500">
          <p>좌측에서 하나 이상의 캘린더를 선택하세요.</p>
        </div>
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
      <div className="flex flex-row w-full bg-[#f4f4f5]">
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
        <div className="flex flex-col flex-1 min-w-0 rounded-lg border border-zinc-300 bg-white m-2">
          <CalendarHeader
            onToday={handleToday}
            title={getTitle()}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            currentDate={currentDate}
            isAgentPanelOpen={isAgentPanelOpen}
            onToggleAgentPanel={() => setIsAgentPanelOpen(!isAgentPanelOpen)}
          />
          <ErrorMessage
            error={localError}
            onDismiss={() => setLocalError(null)}
          />
          <div className="h-full p-5 flex flex-col">
            {renderCalendarContent()}
          </div>
        </div>
        <div
          className={`transition-all duration-300 ease-in-out ${
            isAgentPanelOpen ? 'w-80' : 'w-0'
          } overflow-hidden flex-shrink-0`}
        >
          <div className="w-80 h-full">
            <AgentPanel />
          </div>
        </div>
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
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          event={selectedEvent}
          onSave={handleSaveEvent}
          onDelete={async (eventId: string) => {
            if (selectedEvent?.calendar_id) {
              await deleteEvent({ eventId, calendarId: selectedEvent.calendar_id });
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
