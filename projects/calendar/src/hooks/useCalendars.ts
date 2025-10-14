import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getCalendars, createCalendar } from '@/services/calendarService';
import type { Calendar } from '@/types/calendar';

/**
 * 캘린더 목록 및 생성 관리를 위한 Hook
 */
export function useCalendars(userId: string) {
  const queryClient = useQueryClient();

  // 캘린더 fetch
  const {
    data: calendars,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['calendars', userId],
    queryFn: getCalendars,
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10분간 fresh로 유지 (캘린더는 자주 변경되지 않음)
    gcTime: 30 * 60 * 1000, // 30분간 캐시 유지
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 방지
    refetchOnMount: false, // 마운트 시 자동 refetch 방지 (stale하지 않으면)
  });

  // 캘린더 생성 mutation
  const createCalendarMutation = useMutation({
    mutationFn: ({
      name,
      color,
      inviteEmails,
      description,
    }: {
      name: string;
      color: string;
      inviteEmails: string[];
      description?: string;
    }) => createCalendar(name, color, inviteEmails, description, userId),
    onSuccess: (newCalendar) => {
      // cache를 optimistic하게 업데이트
      queryClient.setQueryData(
        ['calendars', userId],
        (old: Calendar[] = []) => [...old, newCalendar]
      );
      // 일관성을 보장하기 위해 invalidate
      queryClient.invalidateQueries({ queryKey: ['calendars', userId] });
    },
  });

  // 캘린더를 이름순으로 정렬
  const sortedCalendars = useMemo(() => {
    if (!calendars) return [];
    return [...calendars].sort((a, b) =>
      a.name.localeCompare(b.name, 'ko', { numeric: true })
    );
  }, [calendars]);

  return {
    calendars: sortedCalendars,
    isLoading,
    error,
    createCalendar: createCalendarMutation.mutateAsync,
    isCreating: createCalendarMutation.isPending,
  };
}
