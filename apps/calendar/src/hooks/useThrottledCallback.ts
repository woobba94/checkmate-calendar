import { useCallback, useRef } from 'react';

/**
 * Hook that throttles a callback using requestAnimationFrame
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList = []
): T {
  const frameRef = useRef<number | null>(null);
  const lastArgsRef = useRef<any[]>();

  const throttledCallback = useCallback((...args: any[]) => {
    lastArgsRef.current = args;

    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(() => {
        callback(...(lastArgsRef.current || []));
        frameRef.current = null;
      });
    }
  }, deps);

  // Cleanup on unmount
  useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }
  }, []);

  return throttledCallback as T;
}
