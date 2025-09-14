import { supabase } from './supabase';
import type { CalendarEvent } from '@/types/calendar';

// 특정 캘린더의 이벤트 조회
export const getEvents = async (
  calendarId: string
): Promise<CalendarEvent[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('calendar_id', calendarId);

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  return data || [];
};

// 특정 이벤트 조회
export const getEventById = async (eventId: string): Promise<CalendarEvent> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch event: ${error.message}`);
  }

  return data;
};

// 이벤트 생성
export const createEvent = async (
  event: Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>
): Promise<CalendarEvent> => {
  // current user 가져오기
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // calendar_id가 없는 경우
  if (!event.calendar_id) {
    throw new Error('Calendar ID is required');
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      ...event,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create event: ${error.message}`);
  }

  return data;
};

// 이벤트 업데이트
export const updateEvent = async (
  event: Partial<CalendarEvent> & { id: string }
): Promise<CalendarEvent> => {
  // current user 가져오기
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // 이벤트 ID가 없는 경우 에러
  if (!event.id) {
    throw new Error('Event ID is required');
  }

  const { data, error } = await supabase
    .from('events')
    .update({
      ...event,
      updated_at: new Date(),
    })
    .eq('id', event.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update event: ${error.message}`);
  }

  return data;
};

// 이벤트 삭제
export const deleteEvent = async (eventId: string): Promise<void> => {
  // current user 가져오기
  // TODO 계속 이렇게 가져와야하는지? 그냥 매개변수로 받는게 나을지 고민
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase.from('events').delete().eq('id', eventId);

  if (error) {
    throw new Error(`Failed to delete event: ${error.message}`);
  }
};

// 날짜 범위로 이벤트 가져오기
export const getEventsByDateRange = async (
  calendarId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('calendar_id', calendarId)
    .gte('start', startDate.toISOString())
    .lte('start', endDate.toISOString());

  if (error) {
    throw new Error(`Failed to fetch events by date range: ${error.message}`);
  }

  return data || [];
};

// 특정 사용자가 생성한 이벤트 가져오기
export const getEventsByUser = async (
  calendarId: string,
  userId: string
): Promise<CalendarEvent[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('calendar_id', calendarId)
    .eq('created_by', userId);

  if (error) {
    throw new Error(`Failed to fetch events by user: ${error.message}`);
  }

  return data || [];
};
