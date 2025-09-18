import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Info,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
} from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface CalendarHeaderProps {
  onToday: () => void;
  title: string;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  currentDate?: Date;
  isAgentPanelOpen?: boolean;
  onToggleAgentPanel?: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  onToday,
  title,
  onToggleSidebar,
  isSidebarOpen,
  currentDate,
  isAgentPanelOpen,
  onToggleAgentPanel,
}) => {
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
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </Button>
        <h2 className="text-lg font-semibold m-0" aria-live="polite">
          {title}
        </h2>
      </div>

      {/* 중앙 영역 - absolute positioning으로 정확히 중앙 배치 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Tabs value="month" className="w-[200px]" aria-label="캘린더 보기 모드">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="month">월별 보기</TabsTrigger>
            <TabsTrigger value="today-tomorrow" disabled>
              오늘 내일
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 오른쪽 영역 */}
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
    </div>
  );
};

export default CalendarHeader;
