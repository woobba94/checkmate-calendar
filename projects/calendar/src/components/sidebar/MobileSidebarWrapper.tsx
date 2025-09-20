import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';
import './MobileSidebarWrapper.scss';

interface MobileSidebarWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const MobileSidebarWrapper: React.FC<MobileSidebarWrapperProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  const { isMobile } = useResponsive();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isMobile || !isOpen) return;

    // 모바일에서 사이드바가 열릴 때 body 스크롤 방지
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isOpen]);

  // 스와이프 제스처 처리
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    
    currentXRef.current = e.touches[0].clientX;
    const deltaX = startXRef.current - currentXRef.current;
    
    // 왼쪽으로 스와이프 시 사이드바 이동
    if (deltaX > 0 && sidebarRef.current) {
      sidebarRef.current.style.transform = `translateX(-${Math.min(deltaX, 100)}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    
    const deltaX = startXRef.current - currentXRef.current;
    
    // 100px 이상 스와이프하면 닫기
    if (deltaX > 100) {
      onClose();
    }
    
    // 원래 위치로 복구
    if (sidebarRef.current) {
      sidebarRef.current.style.transform = '';
    }
    
    isDraggingRef.current = false;
  };

  // 배경 클릭으로 닫기
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && isMobile) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isMobile, onClose]);

  // 데스크톱에서는 children만 반환
  if (!isMobile) {
    return <>{children}</>;
  }

  // 모바일에서는 포털을 사용하여 오버레이 렌더링
  return createPortal(
    <div
      className={cn('mobile-sidebar-overlay', {
        'mobile-sidebar-overlay--open': isOpen,
      })}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
    >
      <div
        ref={sidebarRef}
        className={cn('mobile-sidebar', {
          'mobile-sidebar--open': isOpen,
        })}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mobile-sidebar__content">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
