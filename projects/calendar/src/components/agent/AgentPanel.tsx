import React, { useState, useEffect } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { useAgent } from '@/contexts/AgentContext';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AgentHistory from './AgentHistory';
import AgentInput from './AgentInput';
import './AgentPanel.scss';

interface AgentPanelProps {
  className?: string;
}

const AgentPanel: React.FC<AgentPanelProps> = ({ className }) => {
  const { isMobile } = useResponsive();
  const { state } = useAgent();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // 모바일에서 포커스 상태 관리
  const handleFocus = () => {
    if (isMobile) {
      setIsFocused(true);
      setIsExpanded(true);
    }
  };

  const handleBlur = () => {
    if (isMobile) {
      setIsFocused(false);
      // 약간의 지연 후 축소
      setTimeout(() => {
        if (!isFocused) {
          setIsExpanded(false);
        }
      }, 200);
    }
  };

  // 모바일에서 배경 클릭으로 축소
  const handleBackdropClick = () => {
    if (isMobile && isExpanded) {
      setIsExpanded(false);
      // input blur 처리
      const input = document.querySelector(
        '.agent-input textarea, .agent-input input'
      );
      if (input instanceof HTMLElement) {
        input.blur();
      }
    }
  };

  // ESC 키로 축소
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobile && isExpanded) {
        handleBackdropClick();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobile, isExpanded]);

  if (isMobile) {
    return (
      <>
        {/* 배경 오버레이 */}
        {isExpanded && (
          <div
            className="agent-panel-backdrop"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
        )}

        {/* 모바일 에이전트 패널 */}
        <div
          className={cn(
            'agent-panel-mobile',
            {
              'agent-panel-mobile--expanded': isExpanded,
            },
            className
          )}
        >
          {isExpanded && (
            <div className="agent-panel-mobile__history">
              <AgentHistory />
            </div>
          )}
          <div className="agent-panel-mobile__input">
            <AgentInput
              onFocus={handleFocus}
              onBlur={handleBlur}
              isExpanded={isExpanded}
            />
          </div>
        </div>
      </>
    );
  }

  // 데스크톱 레이아웃
  return (
    <div className={cn('flex flex-col h-full min-h-0 py-2 pr-2', className)}>
      {state.error && (
        <Alert variant="destructive" className="mb-2 flex-shrink-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <AgentHistory />
      <AgentInput />
    </div>
  );
};

export default AgentPanel;
