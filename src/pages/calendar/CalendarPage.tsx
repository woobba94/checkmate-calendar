import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Calendar from '@/components/calendar/core/Calendar';
import CalendarHeader from '@/components/calendar/header/CalendarHeader';
import EventModal from '@/components/calendar/modals/EventModal';
import type { CalendarEvent } from '@/types/calendar';
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

  const {
    events,
    calendars,
    selectedCalendar,
    setSelectedCalendar,
    isLoading,
    error,
    handleCreateCalendar,
    handleSaveEvent,
    handleDeleteEvent,
  } = useCalendarData(userId);

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
    if (!selectedCalendar) {
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
      calendar_id: selectedCalendar.id,
    };

    setSelectedEvent(newEvent as CalendarEvent);
    setIsEventModalOpen(true);
  };

  const handleAddEvent = () => {
    if (!selectedCalendar) {
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

  const handleSaveEventWrapper = async (eventData: CalendarEvent | Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!userId) {
      setLocalError('Please log in to save events');
      return;
    }

    try {
      await handleSaveEvent(eventData);
      setIsEventModalOpen(false);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Failed to save event');
    }
  };

  const handleDeleteEventWrapper = async (eventId: string) => {
    try {
      await handleDeleteEvent(eventId);
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

  const renderCalendarContent = () => {
    if (isLoading && !selectedCalendar) { // 초기 캘린더 로딩
      return <div className="loading">Loading calendar...</div>;
    }

    if (!selectedCalendar && calendars.length === 0) {
      return (
        <div className="no-calendar-message">
          <p>You don't have any calendars yet.</p>
          <button
            className="create-calendar-button"
            onClick={() => setIsCalendarModalOpen(true)}
          >
            Create Your First Calendar
          </button>
        </div>
      );
    }

    return (
      <Calendar
        events={events}
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
        currentView={view}
      />
    );
  };

  return (
    <Layout>
      <div className="calendar-page">
        <CalendarSelector
          calendars={calendars}
          selectedCalendar={selectedCalendar}
          onCalendarChange={setSelectedCalendar}
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