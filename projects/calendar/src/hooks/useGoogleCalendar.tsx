import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from './use-toast';
import { ToastAction } from '@/components/ui/toast';

/**
 * Google Calendar 통합을 위한 Hook
 */
export function useGoogleCalendarAuth() {
  const { user } = useAuth();

  const initiateGoogleAuth = () => {
    if (!user) {
      throw new Error('로그인이 필요합니다');
    }

    const googleAuthUrl = new URL(
      'https://accounts.google.com/o/oauth2/v2/auth'
    );

    // OAuth 파라미터
    googleAuthUrl.searchParams.append(
      'client_id',
      import.meta.env.VITE_GOOGLE_CLIENT_ID
    );
    googleAuthUrl.searchParams.append(
      'redirect_uri',
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-auth`
    );
    googleAuthUrl.searchParams.append('response_type', 'code');
    googleAuthUrl.searchParams.append(
      'scope',
      'https://www.googleapis.com/auth/calendar.readonly email profile'
    );
    googleAuthUrl.searchParams.append('access_type', 'offline');
    googleAuthUrl.searchParams.append('prompt', 'consent');

    // 보안: user ID를 state 파라미터로 전달 (백엔드에서 UUID 검증)
    googleAuthUrl.searchParams.append('state', user.id);

    window.location.href = googleAuthUrl.toString();
  };

  return {
    initiateAuth: initiateGoogleAuth,
    isAuthenticated: false, // TODO: 사용자가 Google 토큰을 저장했는지 확인
  };
}

/**
 * 재시도 및 cache invalidation이 포함된 Google Calendar 동기화 Hook
 */
export function useGoogleCalendarSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { initiateAuth } = useGoogleCalendarAuth();

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('로그인이 필요합니다');

      const response = await supabase.functions.invoke('sync-google-calendar', {
        body: { user_id: user.id },
      });

      const { data, error } = response;

      // 401 에러 시 응답 본문 확인
      if (error) {
        // response 객체에서 본문을 읽어옴
        const errorResponse =
          (error as any).context?.response || (response as any).response;

        if (errorResponse) {
          let errorBody = null;
          try {
            errorBody = await errorResponse.json();
          } catch {
            // JSON 파싱 실패 시 무시
          }

          // 재인증 필요 확인
          if (errorBody?.reauth_required) {
            const reAuthError = new Error(
              errorBody.error ||
                '구글 인증이 만료되었습니다. 다시 연동해주세요.'
            );
            (reAuthError as any).reauth_required = true;
            throw reAuthError;
          }
        }

        throw error;
      }

      // 일반 에러 응답 처리
      if (data?.error) {
        if (data?.reauth_required) {
          const reAuthError = new Error(data.error);
          (reAuthError as any).reauth_required = true;
          throw reAuthError;
        }
        throw new Error(data.error);
      }

      return data;
    },
    onMutate: () => {
      toast({
        title: '동기화 시작',
        description: '구글 캘린더와 동기화를 시작합니다...',
      });
    },
    onSuccess: (data) => {
      let description = '구글 캘린더 동기화가 완료되었습니다.';

      // syncToken이 무효화된 경우 전체 동기화 메시지 표시
      if (data?.sync_token_invalidated) {
        description = '이전 동기화 토큰이 만료되어 전체 동기화를 수행했습니다.';
      }

      toast({
        title: '동기화 완료',
        description,
      });

      // 동기화된 이벤트를 반영하기 위해 모든 이벤트 cache invalidate
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
    },
    onError: (error: any) => {
      // 재인증 필요 에러인 경우 특별 처리
      if (error.reauth_required) {
        toast({
          title: '재인증 필요',
          description: error.message,
          variant: 'destructive',
          duration: 10000, // 10초 동안 표시
          action: (
            <ToastAction
              altText="재연동하기"
              onClick={() => {
                initiateAuth();
              }}
            >
              재연동하기
            </ToastAction>
          ),
        });
        return;
      }

      toast({
        title: '동기화 실패',
        description:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
    retry: false, // 동기화 실패 시 재시도하지 않음
  });

  return {
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    error: syncMutation.error,
  };
}
