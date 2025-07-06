import { useState, useEffect } from 'react';
import { getEvents, createEvent, updateEvent, deleteEvent } from '@/services/eventService';
import { getCalendars, createCalendar } from '@/services/calendarService';
import type { CalendarEvent, Calendar as CalendarType } from '@/types/calendar';

export const useCalendarData = (userId: string) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<CalendarType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        if (calendarList.length > 0) {
          setSelectedCalendar(calendarList[0]);
        }
      } catch (error) {
        console.error('Failed to fetch calendars:', error);
        setError(error instanceof Error ? `Failed to load calendars: ${error.message}` : 'Failed to load calendars');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendars();
  }, [userId]);

  // 이벤트 조회
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
        setError(error instanceof Error ? `Failed to load events: ${error.message}` : 'Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [userId, selectedCalendar]);

  const handleCreateCalendar = async (name: string) => {
    try {
      const newCalendar = await createCalendar(name);
      setCalendars(prev => [...prev, newCalendar]);
      setSelectedCalendar(newCalendar);
      return newCalendar;
    } catch (error) {
      console.error('Failed to create calendar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create calendar';
      setError(errorMessage);
      throw error;
    }
  };

  const handleSaveEvent = async (eventData: CalendarEvent | Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!selectedCalendar) throw new Error('No calendar selected');

    try {
      if (!('id' in eventData) || !eventData.id) {
        const newEventData = { ...eventData, calendar_id: selectedCalendar.id };
        const createdEvent = await createEvent(newEventData as Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>);
        setEvents(prev => [...prev, createdEvent]);
      } else {
        const updatedEvent = await updateEvent(eventData as CalendarEvent);
        setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
      }
    } catch (error) {
      console.error('Failed to save event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save event';
      setError(errorMessage);
      throw error;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Failed to delete event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete event';
      setError(errorMessage);
      throw error;
    }
  };

  return {
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
  };
};