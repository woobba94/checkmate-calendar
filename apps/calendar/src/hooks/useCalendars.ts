import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  });

  // 캘린더 생성 mutation
  const createCalendarMutation = useMutation({
    mutationFn: ({
      name,
      description,
    }: {
      name: string;
      description?: string;
    }) => createCalendar(name, description, userId),
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

  return {
    calendars: calendars ?? [],
    isLoading,
    error,
    createCalendar: createCalendarMutation.mutateAsync,
    isCreating: createCalendarMutation.isPending,
  };
}
