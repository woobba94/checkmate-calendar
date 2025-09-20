import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import './floating-button.scss';

interface FloatingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  position?: 'bottom-center' | 'bottom-right' | 'bottom-left';
  show?: boolean;
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'lg';
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  position = 'bottom-right',
  show = true,
  children,
  className,
  size = 'default',
  ...props
}) => {
  if (!show) return null;

  return (
    <Button
      className={cn(
        'floating-button',
        `floating-button--${position}`,
        `floating-button--${size}`,
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};
