import type { Calendar as CalendarType } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CalendarPlus, MoreHorizontal, Edit, Trash } from 'lucide-react';
import React from 'react';

interface CalendarSelectorProps {
  calendars: CalendarType[];
  selectedCalendarIds: string[];
  onCalendarChange: (calendarId: string, checked: boolean) => void;
  onCreateCalendarClick: () => void;
  onEditCalendar: (calendar: CalendarType) => void;
}

const CalendarSelector: React.FC<CalendarSelectorProps> = ({
  calendars,
  selectedCalendarIds,
  onCalendarChange,
  onCreateCalendarClick,
  onEditCalendar,
}) => {
  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={onCreateCalendarClick}
        variant="outline"
        size="default"
        className="w-full py-3"
      >
        <CalendarPlus className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="whitespace-nowrap">새 캘린더</span>
      </Button>
      <div className="flex flex-col">
        <p className="h-8 flex items-center px-2 text-sm font-medium text-muted-foreground whitespace-nowrap">
          캘린더 목록
        </p>
        {calendars.length === 0 && (
          <div className="text-[var(--text-muted)] text-sm text-center p-4">
            캘린더가 없습니다
          </div>
        )}
        <div className="flex flex-col gap-2">
          {calendars.map((calendar) => (
            <div key={calendar.id} className="relative">
              <Label
                htmlFor={calendar.id}
                className="hover:bg-white transition-colors flex items-center gap-2 rounded-md p-3 cursor-pointer h-16"
              >
                <div className="flex items-center">
                  <Checkbox
                    id={calendar.id}
                    checked={selectedCalendarIds.includes(calendar.id)}
                    onCheckedChange={(checked) =>
                      onCalendarChange(calendar.id, Boolean(checked))
                    }
                    className="border-gray-300 data-[state=checked]:border-primary"
                  />
                </div>
                <div className="grid gap-1.5 font-normal flex-1 min-w-0">
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm leading-none font-medium truncate">
                          {calendar.name}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{calendar.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 p-0 rounded-[6px] border border-[#E5E7EB] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:bg-gray-50"
                      aria-label="더보기"
                    >
                      <MoreHorizontal className="h-4 w-4 text-gray-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[120px]">
                    <DropdownMenuItem onClick={() => onEditCalendar(calendar)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>수정</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Trash className="mr-2 h-4 w-4" />
                      <span>삭제</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarSelector;
