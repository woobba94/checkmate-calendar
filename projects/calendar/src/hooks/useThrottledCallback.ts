import { useCallback, useRef } from 'react';

/**
 * requestAnimationFrame을 사용하여 callback을 throttle하는 Hook
 * @template Args - 콜백 함수의 매개변수 타입들
 * @template Return - 콜백 함수의 반환 타입
 */
export function useThrottledCallback<Args extends unknown[], Return = void>(
  callback: (...args: Args) => Return,
  deps: React.DependencyList = []
): (...args: Args) => void {
  const frameRef = useRef<number | null>(null);
  const lastArgsRef = useRef<Args | null>(null);

  const throttledCallback = useCallback((...args: Args) => {
    lastArgsRef.current = args;

    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(() => {
        if (lastArgsRef.current) {
          callback(...lastArgsRef.current);
        }
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

  return throttledCallback;
}
