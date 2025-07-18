import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Calendar from '@/components/calendar/core/Calendar';
import CalendarHeader from '@/components/calendar/header/CalendarHeader';
import EventModal from '@/components/calendar/modals/EventModal';
import type { CalendarEvent, Calendar as CalendarType } from '@/types/calendar';
import { useAuth } from '@/contexts/AuthContext';
import './CalendarPage.scss';
import CalendarSelector from '@/components/calendar/selector/CalendarSelector';
import ErrorMessage from '@/components/common/error-message/ErrorMessage';
import CalendarCreateModal from '@/components/calendar/modals/CalendarCreateModal';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useCalendarNavigation } from '@/hooks/useCalendarNavigation';

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';

  // 캘린더 및 이벤트 데이터
  const {
    calendars,
    isLoading,
    error,
    handleCreateCalendar,
    handleSaveEvent,
    handleDeleteEvent,
  } = useCalendarData(userId);

  // 초기 진입 시 모든 캘린더 정보 한 번에 fetch
  // TODO 진입 초반에 로딩화면 필요할듯
  const [eventsByCalendar, setEventsByCalendar] = useState<{ [calendarId: string]: CalendarEvent[] }>({});
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllEvents = async () => {
      if (!calendars.length) return;
      setEventsLoading(true);
      setEventsError(null);
      try {
        const results = await Promise.all(
          calendars.map(async (calendar) => {
            try {
              const res = await import('@/services/eventService').then(m => m.getEvents(calendar.id));
              return [calendar.id, res] as [string, CalendarEvent[]];
            } catch (e) {
              return [calendar.id, []] as [string, CalendarEvent[]];
            }
          })
        );
        setEventsByCalendar(Object.fromEntries(results));
      } catch (e) {
        setEventsError('이벤트 데이터를 불러오지 못했습니다.');
      } finally {
        setEventsLoading(false);
      }
    };
    fetchAllEvents();
  }, [calendars]);

  // 복수 선택된 캘린더 id
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);

  const handleCalendarToggle = (calendarId: string, checked: boolean) => {
    setSelectedCalendarIds((prev) =>
      checked ? [...prev, calendarId] : prev.filter(id => id !== calendarId)
    );
  };

  // 병합된 이벤트
  const mergedEvents: CalendarEvent[] = selectedCalendarIds.flatMap(
    id => eventsByCalendar[id] || []
  );

  const {
    view,
    setView,
    handlePrev,
    handleNext,
    handleToday,
    getTitle,
  } = useCalendarNavigation();

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(undefined);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      setLocalError(error.message);
    }
  }, [error]);

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

    const newEvent: Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'> = {
      title: '',
      start: date,
      calendar_id: selectedCalendarIds[0], // TODO 일단 첫 번째 선택된 캘린더로 이벤트 생성 -> 기획 결정 필요
    };

    setSelectedEvent(newEvent as CalendarEvent);
    setIsEventModalOpen(true);
  };

  const handleAddEvent = () => {
    if (!selectedCalendarIds.length) {
      setLocalError('Please select or create a calendar first');
      return;
    }

    if (!userId) {
      setLocalError('Please log in to add events');
      return;
    }

    setSelectedEvent(undefined);
    setIsEventModalOpen(true);
  };

  // 모든 캘린더 이벤트 refetch 함수
  const refetchEvents = async () => {
    setEventsLoading(true);
    try {
      const results = await Promise.all(
        calendars.map(async (calendar) => {
          try {
            const res = await import('@/services/eventService').then(m => m.getEvents(calendar.id));
            return [calendar.id, res] as [string, CalendarEvent[]];
          } catch (e) {
            return [calendar.id, []] as [string, CalendarEvent[]];
          }
        })
      );
      setEventsByCalendar(Object.fromEntries(results));
    } finally {
      setEventsLoading(false);
    }
  };

  const handleSaveEventWrapper = async (eventData: CalendarEvent | Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!userId) {
      setLocalError('Please log in to save events');
      return;
    }

    try {
      await handleSaveEvent(eventData);
      await refetchEvents();
      setIsEventModalOpen(false);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Failed to save event');
    }
  };

  const handleDeleteEventWrapper = async (eventId: string) => {
    try {
      await handleDeleteEvent(eventId);
      await refetchEvents();
      setIsEventModalOpen(false);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Failed to delete event');
    }
  };

  const handleCreateCalendarWrapper = async (name: string) => {
    if (!name.trim()) {
      setLocalError('Please enter a calendar name');
      return;
    }

    try {
      await handleCreateCalendar(name);
      setIsCalendarModalOpen(false);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Failed to create calendar');
    }
  };

  // renderCalendarContent도 병합된 이벤트로 변경
  const renderCalendarContent = () => {
    if (isLoading || eventsLoading) {
      return <div className="loading">Loading calendar...</div>;
    }
    if (eventsError) {
      return <div className="error-message">{eventsError}</div>;
    }
    if (!selectedCalendarIds.length) {
      return (
        <div className="no-calendar-message">
          <p>좌측에서 하나 이상의 캘린더를 선택하세요.</p>
        </div>
      );
    }
    return (
      <Calendar
        events={mergedEvents}
        onEventClick={() => {}}
        onDateClick={() => {}}
        currentView={view}
      />
    );
  };

  return (
    <Layout>
      <div className="calendar-page">
        <CalendarSelector
          calendars={calendars}
          selectedCalendarIds={selectedCalendarIds}
          onCalendarChange={handleCalendarToggle}
          onCreateCalendarClick={() => setIsCalendarModalOpen(true)}
        />
        <div className="calendar-main-content">
          <CalendarHeader
            view={view}
            onViewChange={setView}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleToday}
            title={getTitle()}
            onAddEvent={handleAddEvent}
          />
          <ErrorMessage error={localError} onDismiss={() => setLocalError(null)} />
          <div className="calendar-container">
            {renderCalendarContent()}
          </div>
        </div>
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          event={selectedEvent}
          onSave={handleSaveEventWrapper}
          onDelete={handleDeleteEventWrapper}
        />

        <CalendarCreateModal
          isOpen={isCalendarModalOpen}
          onClose={() => setIsCalendarModalOpen(false)}
          onCreateCalendar={handleCreateCalendarWrapper}
        />
      </div>
    </Layout>
  );
};

export default CalendarPage;