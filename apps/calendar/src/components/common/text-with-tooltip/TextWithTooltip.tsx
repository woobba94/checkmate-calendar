import React, { useRef, useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TextWithTooltipProps {
  text: string;
  className?: string;
  tooltipClassName?: string;
  delayDuration?: number;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  asChild?: boolean;
  children?: (props: {
    ref: React.RefObject<HTMLElement>;
    className: string;
    children: React.ReactNode;
  }) => React.ReactElement;
}

const TextWithTooltip: React.FC<TextWithTooltipProps> = ({
  text,
  className = '',
  tooltipClassName = '',
  delayDuration = 200,
  side = 'top',
  align = 'center',
  asChild = false,
  children,
}) => {
  const textRef = useRef<HTMLElement>(null);
  const [isEllipsisActive, setIsEllipsisActive] = useState(false);

  useEffect(() => {
    const checkEllipsis = () => {
      if (textRef.current) {
        setIsEllipsisActive(
          textRef.current.scrollWidth > textRef.current.clientWidth
        );
      }
    };

    checkEllipsis();
    // ResizeObserver\ub97c \uc0ac\uc6a9\ud574 \ucee8\ud14c\uc774\ub108 \ud06c\uae30 \ubcc0\uacbd \uac10\uc9c0
    const resizeObserver = new ResizeObserver(checkEllipsis);
    const element = textRef.current;
    if (element) {
      resizeObserver.observe(element);
    }

    return () => {
      if (element) {
        resizeObserver.unobserve(element);
      }
    };
  }, [text]);

  const defaultClassName = cn('truncate', className);

  // 사용자 정의 컴포넌트를 사용하는 경우
  if (children && asChild) {
    if (isEllipsisActive) {
      return (
        <TooltipProvider delayDuration={delayDuration}>
          <Tooltip>
            <TooltipTrigger asChild>
              {children({
                ref: textRef as React.RefObject<HTMLElement>,
                className: defaultClassName,
                children: text,
              })}
            </TooltipTrigger>
            <TooltipContent
              side={side}
              align={align}
              className={tooltipClassName}
            >
              <p>{text}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return children({
      ref: textRef as React.RefObject<HTMLElement>,
      className: defaultClassName,
      children: text,
    });
  }

  // 기본 p 태그를 사용하는 경우
  if (isEllipsisActive) {
    return (
      <TooltipProvider delayDuration={delayDuration}>
        <Tooltip>
          <TooltipTrigger asChild>
            <p
              ref={textRef as React.RefObject<HTMLParagraphElement>}
              className={defaultClassName}
            >
              {text}
            </p>
          </TooltipTrigger>
          <TooltipContent
            side={side}
            align={align}
            className={tooltipClassName}
          >
            <p>{text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <p
      ref={textRef as React.RefObject<HTMLParagraphElement>}
      className={defaultClassName}
    >
      {text}
    </p>
  );
};

export default TextWithTooltip;
