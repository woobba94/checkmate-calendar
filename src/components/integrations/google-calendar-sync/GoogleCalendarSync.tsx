import { useMutation } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';
import { Button } from '@chakra-ui/react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const syncGoogleCalendar = async () => {
  // current user id
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');
  // 동기화 Edge Function 호출
  const { error } = await supabase.functions.invoke('sync-google-calendar', {
    body: { user_id: user.id },
  });
  if (error) throw error;
  return '동기화 완료';
};

const GoogleCalendarSync: React.FC = () => {
  const [message, setMessage] = useState('');
  const mutation = useMutation({
    mutationFn: syncGoogleCalendar,
    onSuccess: (msg) => setMessage(msg),
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류가 발생..';
      setMessage(`오류: ${errorMessage}`);
    },
    onMutate: () => setMessage(''),
  });

  return (
    <div>
      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        variant="surface"
      >
        {mutation.isPending ? '동기화 중...' : '구글 캘린더 동기화'}
      </Button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default GoogleCalendarSync;
