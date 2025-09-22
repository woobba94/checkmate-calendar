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
  const hasMoveRef = useRef<boolean>(false);

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
    hasMoveRef.current = false; // 터치 시작시 이동 상태 초기화
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;

    currentXRef.current = e.touches[0].clientX;
    const deltaX = startXRef.current - currentXRef.current;

    // 10px 이상 움직였을 때만 실제 스와이프로 간주
    if (Math.abs(deltaX) > 10) {
      hasMoveRef.current = true;
    }

    // 왼쪽으로 스와이프 시 사이드바 이동
    if (deltaX > 0 && sidebarRef.current) {
      sidebarRef.current.style.transform = `translateX(-${Math.min(deltaX, 100)}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;

    const deltaX = startXRef.current - currentXRef.current;

    // 실제 스와이프 동작이 있었고 100px 이상 왼쪽으로 스와이프하면 닫기
    if (hasMoveRef.current && deltaX > 100) {
      onClose();
    }

    // 원래 위치로 복구
    if (sidebarRef.current) {
      sidebarRef.current.style.transform = '';
    }

    isDraggingRef.current = false;
    hasMoveRef.current = false; // 상태 초기화
  };

  // 배경 클릭으로 닫기 (오버레이만)
  const handleOverlayClick = () => {
    onClose();
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

  // 모바일에서는 포털을 사용하여 오버레이와 사이드바를 따로 렌더링
  return createPortal(
    <>
      {/* 배경 오버레이 */}
      <div
        className={cn('mobile-sidebar-overlay', {
          'mobile-sidebar-overlay--open': isOpen,
        })}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      />
      {/* 사이드바 */}
      <div
        ref={sidebarRef}
        className={cn('mobile-sidebar', {
          'mobile-sidebar--open': isOpen,
        })}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mobile-sidebar__content">{children}</div>
      </div>
    </>,
    document.body
  );
};
