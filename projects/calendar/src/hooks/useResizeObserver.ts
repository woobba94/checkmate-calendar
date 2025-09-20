import { useEffect, useRef } from 'react';

/**
 * Hook to observe element resize and call a callback
 */
export function useResizeObserver(
  callback: (entry: ResizeObserverEntry) => void,
  options?: { debounce?: number }
) {
  const targetRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        if (options?.debounce) {
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
          }
          debounceRef.current = setTimeout(() => {
            callback(entry);
          }, options.debounce);
        } else {
          callback(entry);
        }
      }
    };

    observerRef.current = new ResizeObserver(handleResize);
    observerRef.current.observe(target);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [callback, options?.debounce]);

  return targetRef;
}
