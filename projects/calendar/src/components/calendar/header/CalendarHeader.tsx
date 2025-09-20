import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Info,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
  Menu,
  X,
} from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface CalendarHeaderProps {
  onToday: () => void;
  title: string;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  currentDate?: Date;
  isAgentPanelOpen?: boolean;
  onToggleAgentPanel?: () => void;
  viewMode?: 'month' | 'today-tomorrow';
  onViewModeChange?: (mode: 'month' | 'today-tomorrow') => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  onToday,
  title,
  onToggleSidebar,
  isSidebarOpen,
  currentDate,
  isAgentPanelOpen,
  onToggleAgentPanel,
  viewMode = 'month',
  onViewModeChange,
}) => {
  const { isMobile } = useResponsive();
  // 현재 월에 오늘이 포함되어 있는지 확인
  const isTodayInCurrentMonth = () => {
    if (!currentDate) return false;
    const today = new Date();
    return (
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };
  return (
    <div className="relative flex h-[56px] px-[10px] items-center">
      {/* 좌측 영역 */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onToggleSidebar}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={isSidebarOpen ? '사이드바 닫기' : '사이드바 열기'}
        >
          {isMobile ? (
            // 모바일: 햄버거 메뉴 아이콘
            isSidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )
          ) : (
            // 데스크톱: 패널 아이콘
            isSidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )
          )}
        </Button>
        {!isMobile && (
          <h2 className="text-lg font-semibold m-0" aria-live="polite">
            {title}
          </h2>
        )}
      </div>

      {/* 중앙 영역 */}
      {isMobile ? (
        // 모바일: 동적 타이틀 표시 (fit-content 중앙 정렬)
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[90vw]">
          <h2
            className="text-base font-semibold m-0 mx-auto truncate"
            style={{ width: 'fit-content' }}
            aria-live="polite"
          >
            {isSidebarOpen ? '캘린더 목록' : title}
          </h2>
        </div>
      ) : (
        // 데스크톱: 캘린더 뷰 토글
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Tabs 
            value={viewMode} 
            onValueChange={(value) => onViewModeChange?.(value as 'month' | 'today-tomorrow')}
            className="w-[200px]" 
            aria-label="캘린더 보기 모드"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="month">월별 보기</TabsTrigger>
              <TabsTrigger value="today-tomorrow">
                오늘 내일
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* 오른쪽 영역 */}
      {isMobile ? (
        // 모바일: 뷰 토글 버튼 (사이드바 열림 시 숨김)
        !isSidebarOpen && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onViewModeChange?.(viewMode === 'month' ? 'today-tomorrow' : 'month')}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {viewMode === 'month' ? '오늘 내일' : '월별 보기'}
            </Button>
          </div>
        )
      ) : (
        // 데스크톱: 기존 버튼들
        <div className="flex items-center gap-2 ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="사용 팁 보기"
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>스크롤로 월을 이동할 수 있습니다</p>
              <p className="text-xs text-muted-foreground mt-1">
                ↑ 이전 월 | ↓ 다음 월
              </p>
            </TooltipContent>
          </Tooltip>
          <Button
            onClick={onToday}
            variant="outline"
            disabled={isTodayInCurrentMonth()}
          >
            오늘
          </Button>
          <Button
            onClick={onToggleAgentPanel}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={
              isAgentPanelOpen ? '에이전트 패널 닫기' : '에이전트 패널 열기'
            }
          >
            {isAgentPanelOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CalendarHeader;
