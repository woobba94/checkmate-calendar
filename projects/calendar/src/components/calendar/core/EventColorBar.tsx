import React from 'react';
import { cn } from '@/lib/utils';
import './EventColorBar.scss';

interface EventColorBarProps {
  color: string;
  width?: number;
  height?: number;
  className?: string;
  onClick?: () => void;
}

export const EventColorBar: React.FC<EventColorBarProps> = ({
  color,
  width = 32,
  height = 6,
  className,
  onClick,
}) => {
  return (
    <div
      className={cn('event-color-bar', className)}
      style={{
        backgroundColor: color,
        width: `${width}px`,
        height: `${height}px`,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onClick();
              }
            }
          : undefined
      }
      aria-label={onClick ? '일정 보기' : undefined}
    />
  );
};
