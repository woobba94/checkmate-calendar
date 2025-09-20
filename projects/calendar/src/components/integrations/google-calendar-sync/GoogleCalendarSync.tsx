import React from 'react';
import { Button } from '@/components/ui/button';
import { useGoogleCalendarSync } from '@/hooks/useGoogleCalendar';
import { Loader2 } from 'lucide-react';

const GoogleCalendarSync: React.FC = () => {
  const { sync, isSyncing } = useGoogleCalendarSync();

  return (
    <div className="space-y-2">
      <Button
        onClick={() => sync()}
        disabled={isSyncing}
        variant="outline"
        className="w-full whitespace-nowrap"
      >
        {isSyncing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            동기화 중...
          </>
        ) : (
          '구글 캘린더 동기화'
        )}
      </Button>
    </div>
  );
};

export default GoogleCalendarSync;
