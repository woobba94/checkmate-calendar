import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Calendar from '../components/calendar/Calendar';
import CalendarHeader from '../components/calendar/CalendarHeader';
import EventModal from '../components/calendar/EventModal';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../services/eventService';
import { getCalendars, createCalendar } from '../services/calendarService';
import type { CalendarEvent, CalendarViewType, Calendar as CalendarType } from '../types/calendar';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import './CalendarPage.scss';

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<CalendarType | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(undefined);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [view, setView] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  // TODO null 로 처리해서 에러 컨트롤 하는게 나을지 고민
  const userId = user?.id || '';

  // 캘린더 목록 조회
  useEffect(() => {
    const fetchCalendars = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const calendarList = await getCalendars();
        setCalendars(calendarList);

        // 첫 번째 캘린더 선택
        if (calendarList.length > 0) {
          setSelectedCalendar(calendarList[0]);
        }
      } catch (error) {
        console.error('Failed to fetch calendars:', error);
        if (error instanceof Error) {
          setError(`Failed to load calendars: ${error.message}`);
        } else {
          setError('An unknown error occurred while fetching calendars');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendars();
  }, [userId]);

  // 선택한 캘린더의 이벤트 조회
  // TODO 너무 길어지는데 나눌방법 찾기
  useEffect(() => {
    const fetchEvents = async () => {
      if (!userId || !selectedCalendar) {
        setEvents([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const eventsData = await getEvents(selectedCalendar.id);
        setEvents(eventsData);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        if (error instanceof Error) {
          setError(`Failed to load events: ${error.message}`);
        } else {
          setError('An unknown error occurred while fetching events');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [userId, selectedCalendar]);

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

  const handleSaveEvent = async (eventData: CalendarEvent | Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!userId) {
      setError('Please log in to save events');
      return;
    }

    if (!selectedCalendar) {
      setError('Please select a calendar');
      return;
    }

    try {
      setError(null);

      // 새로운 이벤트인 경우 (id 없는 경우임)
      if (!('id' in eventData) || !eventData.id) {
        // calendar_id 확인 및 전처리
        const newEventData = {
          ...eventData,
          calendar_id: selectedCalendar.id,
        } as Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>;

        // 새 이벤트 생성
        const createdEvent = await createEvent(newEventData);
        setEvents([...events, createdEvent]);
      } else {
        // 기존 이벤트 업데이트
        const updatedEvent = await updateEvent(eventData as CalendarEvent);
        setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e));
      }
    } catch (error) {
      console.error('Failed to save event:', error);
      if (error instanceof Error) {
        setError(`Failed to save event: ${error.message}`);
      } else {
        setError('An unknown error occurred while saving event');
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setEvents(events.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Failed to delete event:', error);
      if (error instanceof Error) {
        setError(`Failed to delete event: ${error.message}`);
      } else {
        setError('An unknown error occurred while deleting event');
      }
    }
  };

  const handleCreateCalendar = async () => {
    if (!newCalendarName.trim()) {
      setError('Please enter a calendar name');
      return;
    }

    try {
      const newCalendar = await createCalendar(newCalendarName.trim());
      setCalendars([...calendars, newCalendar]);
      setSelectedCalendar(newCalendar);
      setNewCalendarName('');
      setIsCalendarModalOpen(false);
    } catch (error) {
      console.error('Failed to create calendar:', error);
      if (error instanceof Error) {
        setError(`Failed to create calendar: ${error.message}`);
      } else {
        setError('An unknown error occurred while creating calendar');
      }
    }
  };

  const handlePrev = () => {
    // 이전 달/주/일로 이동하는 로직
    setCurrentDate(prev => {
      const date = new Date(prev);
      if (view === 'month') {
        date.setMonth(date.getMonth() - 1);
      } else if (view === 'week') {
        date.setDate(date.getDate() - 7);
      } else {
        date.setDate(date.getDate() - 1);
      }
      return date;
    });
  };

  const handleNext = () => {
    // 다음 달/주/일로 이동하는 로직
    setCurrentDate(prev => {
      const date = new Date(prev);
      if (view === 'month') {
        date.setMonth(date.getMonth() + 1);
      } else if (view === 'week') {
        date.setDate(date.getDate() + 7);
      } else {
        date.setDate(date.getDate() + 1);
      }
      return date;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getTitle = () => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (view === 'week') {
      // 간단한 주 표시
      // TODO 실제로는 시작일과 종료일을 표시하는 것이 좋을듯함.
      return `Week of ${format(currentDate, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  return (
    <Layout>
      <div className="calendar-page">
        <div className="calendar-selector">
          <select
            value={selectedCalendar?.id || ''}
            onChange={(e) => {
              const calendarId = e.target.value;
              const calendar = calendars.find(c => c.id === calendarId);
              setSelectedCalendar(calendar || null);
            }}
            disabled={calendars.length === 0}
          >
            {calendars.length === 0 && (
              <option value="">No calendars available</option>
            )}
            {calendars.map(calendar => (
              <option key={calendar.id} value={calendar.id}>
                {calendar.name}
              </option>
            ))}
          </select>
          <button
            className="create-calendar-button"
            onClick={() => setIsCalendarModalOpen(true)}
          >
            Create Calendar
          </button>
        </div>

        <CalendarHeader
          view={view}
          onViewChange={setView}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          title={getTitle()}
          onAddEvent={() => {
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
          }}
        />

        {error && (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button
              className="error-dismiss"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="loading">Loading calendar...</div>
        ) : (
          <div className="calendar-container">
            {selectedCalendar ? (
              <Calendar
                events={events}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
                currentView={view}
              />
            ) : (
              <div className="no-calendar-message">
                <p>You don't have any calendars yet.</p>
                <button
                  className="create-calendar-button"
                  onClick={() => setIsCalendarModalOpen(true)}
                >
                  Create Your First Calendar
                </button>
              </div>
            )}
          </div>
        )}

        {/* 이벤트 모달 */}
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          event={selectedEvent}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />

        {/* 캘린더 생성 모달 */}
        {isCalendarModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Create New Calendar</h2>
              <input
                type="text"
                placeholder="Calendar Name"
                value={newCalendarName}
                onChange={(e) => setNewCalendarName(e.target.value)}
              />
              <div className="modal-buttons">
                <button
                  className="cancel-button"
                  onClick={() => setIsCalendarModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="create-button"
                  onClick={handleCreateCalendar}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CalendarPage;