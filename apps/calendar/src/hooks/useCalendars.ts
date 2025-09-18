import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCalendars, createCalendar } from '@/services/calendarService';
import type { Calendar } from '@/types/calendar';

/**
 * Hook for managing calendar list and creation
 */
export function useCalendars(userId: string) {
  const queryClient = useQueryClient();

  // Fetch calendars
  const {
    data: calendars,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['calendars', userId],
    queryFn: getCalendars,
    enabled: !!userId,
  });

  // Create calendar mutation
  const createCalendarMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      createCalendar(name, description, userId),
    onSuccess: (newCalendar) => {
      // Optimistically update the cache
      queryClient.setQueryData(['calendars', userId], (old: Calendar[] = []) => [
        ...old,
        newCalendar,
      ]);
      // Then invalidate to ensure consistency
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
