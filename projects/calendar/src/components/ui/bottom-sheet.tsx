import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import './bottom-sheet.scss';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  height?: '70%' | '90%' | 'full';
  swipeToClose?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  height = '70%',
  swipeToClose = true,
  children,
  className,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  // 열기/닫기 애니메이션 처리
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsClosing(false);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 닫기 애니메이션 처리
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  // 스와이프 시작
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!swipeToClose) return;
    
    const touch = e.touches[0];
    setStartY(touch.clientY);
    setCurrentY(touch.clientY);
    setIsDragging(true);
  };

  // 스와이프 중
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !swipeToClose) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY;
    
    // 아래로만 스와이프 가능
    if (deltaY > 0 && sheetRef.current) {
      setCurrentY(touch.clientY);
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  // 스와이프 종료
  const handleTouchEnd = () => {
    if (!isDragging || !swipeToClose) return;
    
    const deltaY = currentY - startY;
    const threshold = 100; // 100px 이상 스와이프하면 닫기
    
    if (deltaY > threshold) {
      handleClose();
    } else if (sheetRef.current) {
      // 원래 위치로 복구
      sheetRef.current.style.transform = '';
    }
    
    setIsDragging(false);
  };

  // 배경 클릭으로 닫기
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // 키보드가 열릴 때 시트 위치 조정
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      // 모바일 키보드가 열렸을 때 처리
      if (window.visualViewport && contentRef.current) {
        const keyboardHeight = window.innerHeight - window.visualViewport.height;
        if (keyboardHeight > 0) {
          contentRef.current.style.paddingBottom = `${keyboardHeight}px`;
        } else {
          contentRef.current.style.paddingBottom = '';
        }
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  return createPortal(
    <div
      className={cn('bottom-sheet-overlay', {
        'bottom-sheet-overlay--open': isOpen && !isClosing,
        'bottom-sheet-overlay--closing': isClosing,
      })}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'bottom-sheet-title' : undefined}
    >
      <div
        ref={sheetRef}
        className={cn(
          'bottom-sheet',
          {
            'bottom-sheet--open': isOpen && !isClosing,
            'bottom-sheet--closing': isClosing,
          },
          className
        )}
        style={{ height }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 스와이프 인디케이터 */}
        {swipeToClose && (
          <div className="bottom-sheet__handle">
            <div className="bottom-sheet__handle-bar" />
          </div>
        )}
        
        {/* 헤더 */}
        {title && (
          <div className="bottom-sheet__header">
            <h2 id="bottom-sheet-title" className="bottom-sheet__title">
              {title}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="bottom-sheet__close"
              onClick={handleClose}
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* 콘텐츠 */}
        <div ref={contentRef} className="bottom-sheet__content">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
