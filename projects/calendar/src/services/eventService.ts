import { supabase } from './supabase';
import { ensureUserId } from './authService';
import type { CalendarEvent, EventCalendar } from '@/types/calendar';

// Supabase 조인 쿼리 결과 타입
interface EventCalendarJoinResult {
  event_id: string;
  calendar_id: string;
  google_event_id?: string;
  google_updated?: string;
  events: CalendarEvent | null;
}

// 특정 캘린더의 이벤트 조회 (Junction Table 사용)
export const getEvents = async (
  calendarId: string
): Promise<CalendarEvent[]> => {
  // event_calendars와 calendar_id를 한 번에 조회
  const { data, error } = await supabase
    .from('event_calendars')
    .select(
      `
      event_id,
      calendar_id,
      events (*)
    `
    )
    .eq('calendar_id', calendarId);

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  if (!data) return [];

  // 이벤트별로 calendar_ids 그룹화 (N+1 쿼리 해결)
  return buildEventsWithCalendarIds(
    data as unknown as EventCalendarJoinResult[]
  );
};

// 여러 캘린더의 이벤트 조회
export const getEventsByCalendars = async (
  calendarIds: string[]
): Promise<CalendarEvent[]> => {
  if (calendarIds.length === 0) return [];

  // 1. 선택된 캘린더의 이벤트 조회
  const { data, error } = await supabase
    .from('event_calendars')
    .select(
      `
      event_id,
      calendar_id,
      events (*)
    `
    )
    .in('calendar_id', calendarIds);

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  if (!data) return [];

  // 2. 고유한 이벤트 ID 추출
  const uniqueEventIds = Array.from(new Set(data.map((item) => item.event_id)));

  if (uniqueEventIds.length === 0) return [];

  // 3. 모든 이벤트의 전체 calendar_ids 조회 (한 번의 쿼리로)
  const { data: allRelations, error: relationsError } = await supabase
    .from('event_calendars')
    .select('event_id, calendar_id')
    .in('event_id', uniqueEventIds);

  if (relationsError) {
    throw new Error(
      `Failed to fetch event relations: ${relationsError.message}`
    );
  }

  // 4. 이벤트별로 전체 calendar_ids 매핑
  const eventCalendarMap = new Map<string, string[]>();
  allRelations?.forEach((relation) => {
    if (!eventCalendarMap.has(relation.event_id)) {
      eventCalendarMap.set(relation.event_id, []);
    }
    eventCalendarMap.get(relation.event_id)!.push(relation.calendar_id);
  });

  // 5. 이벤트 생성 (전체 calendar_ids 포함)
  const eventMap = new Map<string, CalendarEvent>();
  for (const item of data as unknown as EventCalendarJoinResult[]) {
    if (!item.events || eventMap.has(item.event_id)) continue;

    eventMap.set(item.event_id, {
      ...item.events,
      calendar_ids: eventCalendarMap.get(item.event_id) || [],
    });
  }

  return Array.from(eventMap.values());
};

// 이벤트에 calendar_ids 추가 (N+1 쿼리 방지)
function buildEventsWithCalendarIds(
  joinResults: EventCalendarJoinResult[]
): CalendarEvent[] {
  // 이벤트별로 calendar_ids 수집
  const eventMap = new Map<
    string,
    CalendarEvent & { calendar_ids: string[] }
  >();

  for (const item of joinResults) {
    if (!item.events) continue;

    const eventId = item.event_id;

    if (!eventMap.has(eventId)) {
      eventMap.set(eventId, {
        ...item.events,
        calendar_ids: [item.calendar_id],
      });
    } else {
      // 이미 있는 이벤트면 calendar_id만 추가
      eventMap.get(eventId)!.calendar_ids.push(item.calendar_id);
    }
  }

  return Array.from(eventMap.values());
}

// 특정 이벤트의 캘린더 ID 목록 조회
export const getEventCalendarIds = async (
  eventId: string
): Promise<string[]> => {
  const { data, error } = await supabase
    .from('event_calendars')
    .select('calendar_id')
    .eq('event_id', eventId);

  if (error) {
    throw new Error(`Failed to fetch event calendar IDs: ${error.message}`);
  }

  return data?.map((item) => item.calendar_id) || [];
};

// 특정 이벤트 조회 (calendar_ids 포함)
export const getEventById = async (eventId: string): Promise<CalendarEvent> => {
  // 이벤트와 calendar_ids를 한 번에 조회
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (eventError) {
    throw new Error(`Failed to fetch event: ${eventError.message}`);
  }

  const { data: calendarData, error: calendarError } = await supabase
    .from('event_calendars')
    .select('calendar_id')
    .eq('event_id', eventId);

  if (calendarError) {
    throw new Error(
      `Failed to fetch event calendars: ${calendarError.message}`
    );
  }

  return {
    ...eventData,
    calendar_ids: calendarData?.map((item) => item.calendar_id) || [],
  };
};

// 이벤트 생성 (Junction Table 사용)
export const createEvent = async (
  event: Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>,
  userId?: string
): Promise<CalendarEvent> => {
  // userId 확인 및 획득
  const validUserId = await ensureUserId(userId);

  // calendar_ids가 없는 경우 에러
  if (!event.calendar_ids || event.calendar_ids.length === 0) {
    throw new Error('At least one calendar ID is required');
  }

  // 1. 이벤트 생성 - 전체 데이터를 한 번에 조회
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .insert({
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay ?? true,
      description: event.description,
      created_by: validUserId,
    })
    .select()
    .single();

  if (eventError || !eventData) {
    throw new Error(
      `Failed to create event: ${eventError?.message || 'No data returned'}`
    );
  }

  // 2. Junction Table에 관계 추가
  const eventCalendarRelations = event.calendar_ids.map((calendarId) => ({
    event_id: eventData.id,
    calendar_id: calendarId,
  }));

  const { error: junctionError } = await supabase
    .from('event_calendars')
    .insert(eventCalendarRelations);

  if (junctionError) {
    // 이벤트 생성 실패 시 롤백 (이벤트 삭제)
    await supabase.from('events').delete().eq('id', eventData.id);
    throw new Error(
      `Failed to create event-calendar relations: ${junctionError.message}`
    );
  }

  // 생성된 이벤트 반환 (불필요한 추가 조회 제거)
  return {
    ...eventData,
    calendar_ids: event.calendar_ids,
  };
};

// 이벤트 업데이트
export const updateEvent = async (
  event: Partial<CalendarEvent> & { id: string },
  userId?: string
): Promise<CalendarEvent> => {
  // userId 확인 - 인증 확인만 하고 RLS에 의존
  await ensureUserId(userId);

  // 이벤트 ID가 없는 경우 에러
  if (!event.id) {
    throw new Error('Event ID is required');
  }

  // 1. 먼저 기존 calendar_ids와 이벤트 정보 조회 (RLS 정책 만족 확인)
  const { data: existingEvent, error: fetchEventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', event.id)
    .single();

  if (fetchEventError) {
    throw new Error(`Failed to fetch event: ${fetchEventError.message}`);
  }

  const { data: existingRelations, error: fetchRelError } = await supabase
    .from('event_calendars')
    .select('calendar_id')
    .eq('event_id', event.id);

  if (fetchRelError) {
    throw new Error(
      `Failed to fetch existing relations: ${fetchRelError.message}`
    );
  }

  const existingCalendarIds =
    existingRelations?.map((r) => r.calendar_id) || [];

  // 2. 이벤트 기본 정보 업데이트
  const updateData: Partial<{
    title: string;
    start: string | Date;
    end: string | Date;
    allDay: boolean;
    description: string;
  }> = {};

  if (event.title !== undefined) updateData.title = event.title;
  if (event.start !== undefined) updateData.start = event.start;
  if (event.end !== undefined) updateData.end = event.end;
  if (event.allDay !== undefined) updateData.allDay = event.allDay;
  if (event.description !== undefined)
    updateData.description = event.description;

  // 업데이트할 데이터가 있을 때만 실행
  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', event.id);

    if (error) {
      throw new Error(`Failed to update event: ${error.message}`);
    }
  }

  // 3. calendar_ids가 제공된 경우 효율적으로 Junction Table 업데이트
  let finalCalendarIds: string[];

  if (event.calendar_ids && event.calendar_ids.length > 0) {
    const existingIds = new Set(existingCalendarIds);
    const newIds = new Set(event.calendar_ids);

    // 삭제할 ID (기존에 있지만 새로운 목록에 없는 것)
    const idsToDelete = [...existingIds].filter((id) => !newIds.has(id));

    // 추가할 ID (새로운 목록에 있지만 기존에 없는 것)
    const idsToAdd = [...newIds].filter((id) => !existingIds.has(id));

    // 변경사항이 있을 때만 쿼리 실행
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('event_calendars')
        .delete()
        .eq('event_id', event.id)
        .in('calendar_id', idsToDelete);

      if (deleteError) {
        throw new Error(`Failed to delete relations: ${deleteError.message}`);
      }
    }

    if (idsToAdd.length > 0) {
      const newRelations = idsToAdd.map((calendarId) => ({
        event_id: event.id,
        calendar_id: calendarId,
      }));

      const { error: insertError } = await supabase
        .from('event_calendars')
        .insert(newRelations);

      if (insertError) {
        throw new Error(`Failed to add relations: ${insertError.message}`);
      }
    }

    finalCalendarIds = event.calendar_ids;
  } else {
    // calendar_ids가 제공되지 않은 경우 기존 값 유지
    finalCalendarIds = existingCalendarIds;
  }

  // 4. 업데이트된 이벤트 데이터 반환
  return {
    ...existingEvent,
    ...updateData, // 업데이트된 필드만 덮어쓰기
    calendar_ids: finalCalendarIds,
  };
};

// 이벤트 삭제 (CASCADE로 자동으로 event_calendars도 삭제됨)
export const deleteEvent = async (
  eventId: string,
  userId?: string
): Promise<void> => {
  // userId 확인 - 인증 확인만 하고 RLS에 의존
  await ensureUserId(userId);

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
  // event_calendars와 calendar_id를 한 번에 조회
  const { data, error } = await supabase
    .from('event_calendars')
    .select(
      `
      event_id,
      calendar_id,
      events!inner (*)
    `
    )
    .eq('calendar_id', calendarId)
    .gte('events.start', startDate.toISOString())
    .lte('events.start', endDate.toISOString());

  if (error) {
    throw new Error(`Failed to fetch events by date range: ${error.message}`);
  }

  if (!data) return [];

  // 이벤트별로 calendar_ids 그룹화 (N+1 쿼리 해결)
  return buildEventsWithCalendarIds(
    data as unknown as EventCalendarJoinResult[]
  );
};

// 여러 캘린더의 날짜 범위로 이벤트 가져오기 (성능 최적화)
export const getEventsByDateRangeMultiple = async (
  calendarIds: string[],
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> => {
  if (calendarIds.length === 0) return [];

  // 1. 선택된 캘린더의 날짜 범위 이벤트 조회
  const { data, error } = await supabase
    .from('event_calendars')
    .select(
      `
      event_id,
      calendar_id,
      events!inner (*)
    `
    )
    .in('calendar_id', calendarIds)
    .gte('events.start', startDate.toISOString())
    .lte('events.start', endDate.toISOString());

  if (error) {
    throw new Error(`Failed to fetch events by date range: ${error.message}`);
  }

  if (!data) return [];

  // 2. 고유한 이벤트 ID 추출
  const uniqueEventIds = Array.from(new Set(data.map((item) => item.event_id)));

  if (uniqueEventIds.length === 0) return [];

  // 3. 모든 이벤트의 전체 calendar_ids 조회 (한 번의 쿼리로)
  const { data: allRelations, error: relationsError } = await supabase
    .from('event_calendars')
    .select('event_id, calendar_id')
    .in('event_id', uniqueEventIds);

  if (relationsError) {
    throw new Error(
      `Failed to fetch event relations: ${relationsError.message}`
    );
  }

  // 4. 이벤트별로 전체 calendar_ids 매핑
  const eventCalendarMap = new Map<string, string[]>();
  allRelations?.forEach((relation) => {
    if (!eventCalendarMap.has(relation.event_id)) {
      eventCalendarMap.set(relation.event_id, []);
    }
    eventCalendarMap.get(relation.event_id)!.push(relation.calendar_id);
  });

  // 5. 이벤트 생성 (전체 calendar_ids 포함)
  const eventMap = new Map<string, CalendarEvent>();
  for (const item of data as unknown as EventCalendarJoinResult[]) {
    if (!item.events || eventMap.has(item.event_id)) continue;

    eventMap.set(item.event_id, {
      ...item.events,
      calendar_ids: eventCalendarMap.get(item.event_id) || [],
    });
  }

  return Array.from(eventMap.values());
};

// 특정 사용자가 생성한 이벤트 가져오기
export const getEventsByUser = async (
  calendarId: string,
  userId: string
): Promise<CalendarEvent[]> => {
  // event_calendars와 calendar_id를 한 번에 조회
  const { data, error } = await supabase
    .from('event_calendars')
    .select(
      `
      event_id,
      calendar_id,
      events!inner (*)
    `
    )
    .eq('calendar_id', calendarId)
    .eq('events.created_by', userId);

  if (error) {
    throw new Error(`Failed to fetch events by user: ${error.message}`);
  }

  if (!data) return [];

  // 이벤트별로 calendar_ids 그룹화 (N+1 쿼리 해결)
  return buildEventsWithCalendarIds(
    data as unknown as EventCalendarJoinResult[]
  );
};

// EventCalendar 관계 조회
export const getEventCalendars = async (
  eventId: string
): Promise<EventCalendar[]> => {
  const { data, error } = await supabase
    .from('event_calendars')
    .select('*')
    .eq('event_id', eventId);

  if (error) {
    throw new Error(`Failed to fetch event calendars: ${error.message}`);
  }

  return data || [];
};

// EventCalendar 관계 추가
export const addEventToCalendar = async (
  eventId: string,
  calendarId: string
): Promise<void> => {
  const { error } = await supabase.from('event_calendars').insert({
    event_id: eventId,
    calendar_id: calendarId,
  });

  if (error) {
    throw new Error(`Failed to add event to calendar: ${error.message}`);
  }
};

// EventCalendar 관계 제거
export const removeEventFromCalendar = async (
  eventId: string,
  calendarId: string
): Promise<void> => {
  const { error } = await supabase
    .from('event_calendars')
    .delete()
    .eq('event_id', eventId)
    .eq('calendar_id', calendarId);

  if (error) {
    throw new Error(`Failed to remove event from calendar: ${error.message}`);
  }
};
