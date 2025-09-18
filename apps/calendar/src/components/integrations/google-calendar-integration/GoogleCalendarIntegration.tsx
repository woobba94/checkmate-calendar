import React from 'react';
import { Button } from '@/components/ui/button';
import { useGoogleCalendarAuth } from '@/hooks/useGoogleCalendar';
import { useAuth } from '@/contexts/AuthContext';

const GoogleCalendarIntegration: React.FC = () => {
  const { user } = useAuth();
  const { initiateAuth } = useGoogleCalendarAuth();

  const handleGoogleConnect = () => {
    try {
      initiateAuth();
    } catch (error) {
      console.error('Failed to initiate Google auth:', error);
    }
  };

  if (!user) {
    return (
      <div className="text-sm text-muted-foreground">
        <p>구글 캘린더를 연동하려면 먼저 로그인해주세요.</p>
      </div>
    );
  }

  return (
    <div>
      <Button
        onClick={handleGoogleConnect}
        variant="outline"
        className="w-full whitespace-nowrap"
      >
        구글 캘린더 연동
      </Button>
    </div>
  );
};

export default GoogleCalendarIntegration;
