import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Calendar from '../components/calendar/Calendar';
import CalendarHeader from '../components/calendar/CalendarHeader';
import EventModal from '../components/calendar/EventModal';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../services/eventService';
import type { CalendarEvent, CalendarViewType } from '../types/calendar';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import './CalendarPage.css';

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Auth Context에서 사용자 정보 가져오기
  const { user } = useAuth();
  
  // TODO null?
  const userId = user?.id || ''; 

  useEffect(() => {
    // TODO 동작 테스트 필요. 추가 페이지 등 처리 고려
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const eventsData = await getEvents(userId);
        setEvents(eventsData);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        if (error instanceof Error) {
          if (error.message.includes('does not exist')) {
            setError('Database table "events" does not exist. Please create it in Supabase.');
          } else {
            setError(`Failed to load events: ${error.message}`);
          }
        } else {
          setError('An unknown error occurred while fetching events');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [userId]); // userId 변경감지

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDateClick = (date: Date) => {
    // TODO 동작 테스트 필요. 추가 페이지 등 처리 고려
    if (!userId) {
      setError('Please log in to add events');
      return;
    }
    
    const newEvent: CalendarEvent = {
      id: '',
      title: '',
      start: date,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSelectedEvent(newEvent);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (event: CalendarEvent) => {
    // TODO 동작 테스트 필요. 추가 페이지 등 처리 고려
    if (!userId) {
      setError('Please log in to save events');
      return;
    }
    
    try {
      let savedEvent: any;
      const eventWithUserId = {
        ...event,
        userId,
      };
      
      // 이벤트 업데이트
      if (event.id && events.some(e => e.id === event.id)) {
        savedEvent = await updateEvent(eventWithUserId);
        setEvents(events.map(e => e.id === event.id ? savedEvent : e));
      } else {
        // 이벤트 생성
        savedEvent = await createEvent(eventWithUserId);
        setEvents([...events, savedEvent]);
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

  const handlePrev = () => {
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
      // TODO 일단 간단한 주 표시 (사용성 고려하면 시작일과 종료일을 표시?)
      return `Week of ${format(currentDate, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };
  return (
    <Layout>
      <div className="calendar-page">
      <CalendarHeader
  view={view}
  onViewChange={(newView) => {
    setView(newView);
    // FullCalendar view 업데이트 로직이 필요하면 여기에
  }}
  onPrev={handlePrev}
  onNext={handleNext}
  onToday={handleToday}
  title={getTitle()}
  onAddEvent={() => {
    if (!userId) {
      setError('Please log in to add events');
      return;
    }
    setSelectedEvent(undefined);
    setIsModalOpen(true);
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
<Calendar
  events={events}
  onEventClick={handleEventClick}
  onDateClick={handleDateClick}
  currentView={view} // 현재 뷰 전달
/>
        )}
        
        <EventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          event={selectedEvent}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      </div>
    </Layout>
  );
};

export default CalendarPage;