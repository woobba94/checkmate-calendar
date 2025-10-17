import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import type { CalendarEvent } from '@/types/calendar';
import { useEventRealtimeSyncContext } from '@/contexts/EventRealtimeSyncContext';

const DEFAULT_DEBOUNCE_MS = 300;

interface UseEventRealtimeSyncOptions {
  selectedCalendarIds: string[];
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Supabase Realtime을 사용한 이벤트 실시간 동기화 Hook
 *
 * 최적화 기능:
 * 1. 선택적 구독: 현재 선택된 캘린더의 이벤트만 필터링
 * 2. 중복 업데이트 방지: Optimistic Update와 충돌 방지
 * 3. 오프라인 처리: 온라인 복귀 시 자동 재동기화
 * 4. 배터리 최적화: 백그라운드 시 구독 일시중지
 */
export function useEventRealtimeSync({
  selectedCalendarIds,
  enabled = true,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseEventRealtimeSyncOptions) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { isRecentOptimisticUpdate } = useEventRealtimeSyncContext();

  const invalidateQueries = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      debounceTimerRef.current = null;
    }, debounceMs);
  }, [queryClient, debounceMs]);

  const isEventInSelectedCalendars = useCallback(
    async (eventId: string): Promise<boolean> => {
      if (selectedCalendarIds.length === 0) return false;

      const { data } = await supabase
        .from('event_calendars')
        .select('calendar_id')
        .eq('event_id', eventId)
        .in('calendar_id', selectedCalendarIds);

      return (data?.length ?? 0) > 0;
    },
    [selectedCalendarIds]
  );

  const handleEventChange = useCallback(
    async (payload: RealtimePostgresChangesPayload<CalendarEvent>) => {
      const newRecord = payload.new as CalendarEvent | undefined;
      const oldRecord = payload.old as CalendarEvent | undefined;
      const eventId = newRecord?.id || oldRecord?.id;

      if (!eventId) return;

      if (isRecentOptimisticUpdate(eventId)) return;

      const isRelevant = await isEventInSelectedCalendars(eventId);
      if (!isRelevant) return;

      invalidateQueries();
    },
    [isRecentOptimisticUpdate, isEventInSelectedCalendars, invalidateQueries]
  );

  const handleEventCalendarChange = useCallback(
    async (
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>
    ) => {
      const newRecord = payload.new as
        | { calendar_id: string; event_id: string }
        | undefined;
      const oldRecord = payload.old as
        | { calendar_id: string; event_id: string }
        | undefined;
      const calendarId = newRecord?.calendar_id || oldRecord?.calendar_id;
      const eventId = newRecord?.event_id || oldRecord?.event_id;

      if (!calendarId || !eventId) return;
      if (!selectedCalendarIds.includes(calendarId)) return;

      invalidateQueries();
    },
    [selectedCalendarIds, invalidateQueries]
  );

  const setupRealtimeSubscription = useCallback(() => {
    if (!enabled || selectedCalendarIds.length === 0) return null;

    const channelId = `events-${[...selectedCalendarIds].sort().join('-')}`;
    const channel = supabase.channel(channelId);

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events',
      },
      handleEventChange
    );

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'event_calendars',
      },
      handleEventCalendarChange
    );

    channel.subscribe();

    return channel;
  }, [
    enabled,
    selectedCalendarIds,
    handleEventChange,
    handleEventCalendarChange,
  ]);

  useEffect(() => {
    const handleOnline = () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [queryClient]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ['events'] });
        channelRef.current = setupRealtimeSubscription();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [queryClient, setupRealtimeSubscription]);

  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!document.hidden) {
      channelRef.current = setupRealtimeSubscription();
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [setupRealtimeSubscription]);

  return {
    isSubscribed: !!channelRef.current,
  };
}
