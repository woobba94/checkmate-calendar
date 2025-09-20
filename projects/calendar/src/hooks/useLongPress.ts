import { useRef, useCallback } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number;
  preventDefault?: boolean;
}

export const useLongPress = ({
  onLongPress,
  onClick,
  threshold = 500,
  preventDefault = true,
}: UseLongPressOptions) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      if (preventDefault) {
        event.preventDefault();
      }

      isLongPressRef.current = false;
      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress();
      }, threshold);
    },
    [onLongPress, threshold, preventDefault]
  );

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const end = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      if (preventDefault) {
        event.preventDefault();
      }

      cancel();

      // 길게 누르기가 실행되지 않았을 때만 클릭 이벤트 실행
      if (!isLongPressRef.current && onClick) {
        onClick();
      }
    },
    [cancel, onClick, preventDefault]
  );

  return {
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: end,
    onTouchCancel: cancel,
  };
};
