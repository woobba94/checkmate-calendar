import React, { useState, useEffect, useRef } from 'react';
import type { CalendarEvent, Calendar as CalendarType } from '@/types/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  onSave: (
    event: Omit<
      CalendarEvent,
      'id' | 'created_by' | 'created_at' | 'updated_at'
    >
  ) => Promise<void>;
  calendars: CalendarType[];
  defaultSelectedCalendarIds: string[];
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  date,
  onSave,
  calendars,
  defaultSelectedCalendarIds,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // 상태 초기화
    setTitle('');
    setDescription('');
    setSelectedCalendarIds(defaultSelectedCalendarIds);
  }, [isOpen, defaultSelectedCalendarIds]);

  // 날짜 포맷: "0월 0일 (요일)"
  const formatDate = (targetDate: Date): string => {
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[targetDate.getDay()];
    return `${month}월 ${day}일 (${weekday})`;
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      descriptionTextareaRef.current?.focus();
    }
  };

  const handleCalendarToggle = (calendarId: string) => {
    setSelectedCalendarIds((prev) => {
      const isCurrentlySelected = prev.includes(calendarId);

      // 마지막 1개는 토글할 수 없음
      if (isCurrentlySelected && prev.length === 1) {
        return prev;
      }

      // 선택/해제 토글
      const newIds = isCurrentlySelected
        ? prev.filter((id) => id !== calendarId)
        : [...prev, calendarId];

      return newIds;
    });
  };

  const handleSave = async () => {
    if (!title.trim() || selectedCalendarIds.length === 0) return;

    // 종일 일정으로 저장 (시간은 00:00:00)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);

    await onSave({
      title: title.trim(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      allDay: true,
      description: description.trim(),
      calendar_ids: selectedCalendarIds,
    });

    onClose();
  };

  const handleInteractOutside = async (e: Event) => {
    // 외부 클릭 시 저장
    if (title.trim() && selectedCalendarIds.length > 0) {
      e.preventDefault(); // 기본 닫기 동작 막기
      await handleSave(); // handleSave 내부에서 onClose() 호출됨
    }
    // 제목이 비어있으면 preventDefault 하지 않아 자연스럽게 닫힘
  };

  const handleEscapeKeyDown = (e: KeyboardEvent) => {
    // ESC 키 취소 (저장하지 않음)
    e.preventDefault();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[500px] gap-0 p-0"
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={handleEscapeKeyDown}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          // title input에 포커스
          setTimeout(() => {
            titleInputRef.current?.focus();
          }, 0);
        }}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>{formatDate(date)}</DialogTitle>
          <DialogDescription className="sr-only">
            새로운 일정을 추가할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Title Input */}
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            placeholder="어떤 일정인가요?"
            required
            className={cn(
              'w-full text-lg leading-normal font-medium',
              'placeholder:text-muted-foreground',
              'focus:outline-none'
            )}
          />

          {/* Description Textarea */}
          <Textarea
            ref={descriptionTextareaRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="메모"
            className={cn(
              'border-none shadow-none resize-none',
              'focus-visible:ring-0 focus-visible:ring-offset-0',
              'px-0 py-0'
            )}
            rows={3}
          />

          {/* 캘린더 선택 영역 */}
          <div className="space-y-2">
            <Label>공유할 캘린더</Label>
            <div className="grid grid-cols-2 gap-2">
              {calendars.map((calendar) => {
                const isSelected = selectedCalendarIds.includes(calendar.id);
                const isOnlyOneSelected = selectedCalendarIds.length === 1;
                const isDisabled = isSelected && isOnlyOneSelected;

                return (
                  <div
                    key={calendar.id}
                    onClick={() =>
                      !isDisabled && handleCalendarToggle(calendar.id)
                    }
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-md border-2 transition-colors',
                      isDisabled
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer',
                      isSelected
                        ? 'border-opacity-100'
                        : 'border-border hover:border-opacity-50'
                    )}
                    style={{
                      borderColor: isSelected ? calendar.color : undefined,
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={() =>
                        !isDisabled && handleCalendarToggle(calendar.id)
                      }
                      style={{
                        borderColor: calendar.color,
                        backgroundColor: isSelected
                          ? calendar.color
                          : undefined,
                      }}
                      className="border-2"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm leading-none font-normal flex-1">
                      {calendar.name}
                    </span>
                  </div>
                );
              })}
            </div>
            {selectedCalendarIds.length === 1 && (
              <p className="text-xs text-muted-foreground">
                최소 1개의 캘린더는 선택되어야 합니다.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventModal;
