import { useCallback, useRef } from 'react';

/**
 * requestAnimationFrame을 사용하여 callback을 throttle하는 Hook
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList = []
): T {
  const frameRef = useRef<number | null>(null);
  const lastArgsRef = useRef<any[]>([]);

  const throttledCallback = useCallback((...args: any[]) => {
    lastArgsRef.current = args;

    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(() => {
        callback(...(lastArgsRef.current || []));
        frameRef.current = null;
      });
    }
  }, deps);

  // 언마운트 시 클린업
  useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }
  }, []);

  return throttledCallback as T;
}
