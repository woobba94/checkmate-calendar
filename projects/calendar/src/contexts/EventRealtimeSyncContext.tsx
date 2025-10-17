import React, { createContext, useContext, useRef, useCallback } from 'react';

const OPTIMISTIC_UPDATE_CLEANUP_MS = 5000;
const OPTIMISTIC_UPDATE_THRESHOLD_MS = 2000;

interface EventRealtimeSyncContextValue {
  recordOptimisticUpdate: (eventId: string) => void;
  isRecentOptimisticUpdate: (eventId: string) => boolean;
}

const EventRealtimeSyncContext = createContext<
  EventRealtimeSyncContextValue | undefined
>(undefined);

export function EventRealtimeSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const optimisticUpdatesRef = useRef<Map<string, number>>(new Map());
  const timeoutIdsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const recordOptimisticUpdate = useCallback((eventId: string) => {
    optimisticUpdatesRef.current.set(eventId, Date.now());

    const existingTimeout = timeoutIdsRef.current.get(eventId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeoutId = setTimeout(() => {
      optimisticUpdatesRef.current.delete(eventId);
      timeoutIdsRef.current.delete(eventId);
    }, OPTIMISTIC_UPDATE_CLEANUP_MS);

    timeoutIdsRef.current.set(eventId, timeoutId);
  }, []);

  const isRecentOptimisticUpdate = useCallback((eventId: string): boolean => {
    const timestamp = optimisticUpdatesRef.current.get(eventId);
    if (!timestamp) return false;
    return Date.now() - timestamp < OPTIMISTIC_UPDATE_THRESHOLD_MS;
  }, []);

  return (
    <EventRealtimeSyncContext.Provider
      value={{ recordOptimisticUpdate, isRecentOptimisticUpdate }}
    >
      {children}
    </EventRealtimeSyncContext.Provider>
  );
}

export const useEventRealtimeSyncContext = () => {
  const context = useContext(EventRealtimeSyncContext);
  if (!context) {
    throw new Error(
      'useEventRealtimeSyncContext must be used within EventRealtimeSyncProvider'
    );
  }
  return context;
};
