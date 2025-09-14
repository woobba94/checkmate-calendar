import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@chakra-ui/react';

const GoogleCalendarIntegration: React.FC = () => {
  const { user } = useAuth();

  const handleGoogleConnect = () => {
    if (!user) {
      console.error('User not logged in');
      return;
    }

    const googleAuthUrl = new URL(
      'https://accounts.google.com/o/oauth2/v2/auth'
    );
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
      'https://www.googleapis.com/auth/calendar email profile'
    );
    googleAuthUrl.searchParams.append('access_type', 'offline');
    googleAuthUrl.searchParams.append('prompt', 'consent');
    googleAuthUrl.searchParams.append('state', user.id); // user_id를 state로 전달

    window.location.href = googleAuthUrl.toString();
  };

  if (!user) {
    return (
      <div>
        <p>구글 캘린더를 연동하려면 먼저 로그인해주세요.</p>
      </div>
    );
  }

  return (
    <div>
      <Button onClick={handleGoogleConnect} variant="surface">
        구글 캘린더 연동
      </Button>
    </div>
  );
};

export default GoogleCalendarIntegration;
