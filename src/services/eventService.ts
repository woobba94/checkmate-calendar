import { supabase } from './supabase';
import type { CalendarEvent } from '../types/calendar';

// 이벤트 목록 조회
export const getEvents = async (userId: string): Promise<CalendarEvent[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('userId', userId);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data || [];
};

// 이벤트 생성
export const createEvent = async (event: CalendarEvent): Promise<CalendarEvent> => {
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single();
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

// 이벤트 업데이트
export const updateEvent = async (event: CalendarEvent): Promise<CalendarEvent> => {
  const { data, error } = await supabase
    .from('events')
    .update(event)
    .eq('id', event.id)
    .select()
    .single();
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

// 이벤트 삭제
export const deleteEvent = async (eventId: string): Promise<void> => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);
    
  if (error) {
    throw new Error(error.message);
  }
};