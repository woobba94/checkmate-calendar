import React, { useState } from 'react';
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
    setError,
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

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleDateClick = (date: Date) => {
    if (!selectedCalendar) {
      setError('Please select or create a calendar first');
      return;
    }

    if (!userId) {
      setError('Please log in to add events');
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
      setError('Please select or create a calendar first');
      return;
    }

    if (!userId) {
      setError('Please log in to add events');
      return;
    }

    setSelectedEvent(undefined);
    setIsEventModalOpen(true);
  };

  const handleSaveEventWithErrorHandling = async (eventData: CalendarEvent | Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!userId) {
      setError('Please log in to save events');
      return;
    }

    try {
      await handleSaveEvent(eventData);
    } catch (error) {
      // 훅에서 처리됨
    }
  };

  const handleCreateCalendarWithErrorHandling = async (name: string) => {
    if (!name.trim()) {
      setError('Please enter a calendar name');
      return;
    }

    try {
      await handleCreateCalendar(name);
    } catch (error) {
      // 훅에서 처리됨    
    }
  };

  const renderCalendarContent = () => {
    if (isLoading) {
      return <div className="loading">Loading calendar...</div>;
    }

    if (!selectedCalendar) {
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

        <CalendarHeader
          view={view}
          onViewChange={setView}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          title={getTitle()}
          onAddEvent={handleAddEvent}
        />

        <ErrorMessage error={error} onDismiss={() => setError(null)} />

        <div className="calendar-container">
          {renderCalendarContent()}
        </div>

        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          event={selectedEvent}
          onSave={handleSaveEventWithErrorHandling}
          onDelete={handleDeleteEvent}
        />

        <CalendarCreateModal
          isOpen={isCalendarModalOpen}
          onClose={() => setIsCalendarModalOpen(false)}
          onCreateCalendar={handleCreateCalendarWithErrorHandling}
        />
      </div>
    </Layout>
  );
};

export default CalendarPage;