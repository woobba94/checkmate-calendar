import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

/**
 * Hook for Google Calendar integration
 */
export function useGoogleCalendarAuth() {
  const { user } = useAuth();

  const initiateGoogleAuth = () => {
    if (!user) {
      throw new Error('로그인이 필요합니다');
    }

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    
    // OAuth parameters
    googleAuthUrl.searchParams.append('client_id', import.meta.env.VITE_GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.append('redirect_uri', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-auth`);
    googleAuthUrl.searchParams.append('response_type', 'code');
    googleAuthUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/calendar.readonly email profile');
    googleAuthUrl.searchParams.append('access_type', 'offline');
    googleAuthUrl.searchParams.append('prompt', 'consent');
    
    // Security: Add state parameter with user ID and timestamp
    const state = btoa(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
    }));
    googleAuthUrl.searchParams.append('state', state);

    window.location.href = googleAuthUrl.toString();
  };

  return {
    initiateAuth: initiateGoogleAuth,
    isAuthenticated: false, // TODO: Check if user has Google tokens stored
  };
}

/**
 * Hook for Google Calendar sync with retry and cache invalidation
 */
export function useGoogleCalendarSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('로그인이 필요합니다');

      const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
        body: { user_id: user.id },
      });

      if (error) throw error;
      return data;
    },
    onMutate: () => {
      toast({
        title: '동기화 시작',
        description: '구글 캘린더와 동기화를 시작합니다...',
      });
    },
    onSuccess: (data) => {
      toast({
        title: '동기화 완료',
        description: '구글 캘린더 동기화가 완료되었습니다.',
      });

      // Invalidate all event caches to reflect synced events
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
    },
    onError: (error) => {
      toast({
        title: '동기화 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  return {
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    error: syncMutation.error,
  };
}
