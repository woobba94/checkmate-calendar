import React, { useState, useEffect, useRef } from 'react';
import type { CalendarEvent, Calendar as CalendarType } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?:
    | CalendarEvent
    | Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>;
  onSave: (
    event:
      | CalendarEvent
      | Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  onDelete?: (eventId: string) => void;
  calendars: CalendarType[];
  defaultCalendarId?: string;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  event,
  onSave,
  onDelete,
  calendars,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState<Date>(new Date());

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 현재 사용자가 일정 작성자인지 확인
  const isCreatedByCurrentUser =
    event && 'created_by' in event ? event.created_by === user?.id : true;

  // 작성자 정보 가져오기 (수정 모달일 경우)
  // TODO: 향후 개선 필요
  // - 각 이벤트에 작성자 이름을 저장하거나
  // - 별도 유저 조회 API를 통해 user_id로 이름을 가져와야 함
  // 현재는 임시로 user_id만 표시
  const createdByUser =
    event && 'created_by' in event && !isCreatedByCurrentUser
      ? { id: event.created_by, name: event.created_by }
      : null;

  useEffect(() => {
    if (!isOpen) return;

    if (event) {
      // 수정 모드
      setTitle(event.title || '');
      setDescription(event.description || '');
      setEventDate(event.start ? new Date(event.start) : new Date());

      // 기존 일정의 캘린더 IDs 설정
      if (
        'calendar_ids' in event &&
        event.calendar_ids &&
        event.calendar_ids.length > 0
      ) {
        setSelectedCalendarIds(event.calendar_ids);
      }
    } else {
      // 생성 모드
      setTitle('');
      setDescription('');
      setEventDate(new Date());

      // 모든 캘린더 선택
      setSelectedCalendarIds(calendars.map((cal) => cal.id));
    }

    // 모달이 열리면 title input에 포커스
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  }, [isOpen, event, calendars]);

  if (!isOpen) return null;

  // 날짜 포맷: "0월 0일 (요일)"
  const formatDate = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
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
    const startDate = new Date(eventDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);

    const baseEvent = {
      title: title.trim(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      allDay: true,
      description: description.trim(),
      calendar_ids: selectedCalendarIds,
    };

    if (event && 'id' in event && event.id) {
      // 수정 모드 - 변경사항 확인
      const hasChanges = hasEventChanges(event, baseEvent);

      if (hasChanges) {
        await onSave({ ...event, ...baseEvent });
      }
    } else {
      // 생성 모드
      await onSave(baseEvent);
    }

    onClose();
  };

  // 이벤트 변경사항 확인
  const hasEventChanges = (
    originalEvent:
      | CalendarEvent
      | Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>,
    newEvent: {
      title: string;
      start: string;
      end: string;
      allDay: boolean;
      description: string;
      calendar_ids: string[];
    }
  ): boolean => {
    // 제목 변경 확인
    if ((originalEvent.title || '').trim() !== newEvent.title) {
      return true;
    }

    // 설명 변경 확인
    if ((originalEvent.description || '').trim() !== newEvent.description) {
      return true;
    }

    // 날짜 변경 확인 (날짜만 비교)
    const originalDate = new Date(originalEvent.start);
    originalDate.setHours(0, 0, 0, 0);
    const newDate = new Date(newEvent.start);
    newDate.setHours(0, 0, 0, 0);

    if (originalDate.getTime() !== newDate.getTime()) {
      return true;
    }

    // calendar_ids 변경 확인
    const originalCalendarIds = (originalEvent.calendar_ids || [])
      .slice()
      .sort();
    const newCalendarIds = newEvent.calendar_ids.slice().sort();

    if (originalCalendarIds.length !== newCalendarIds.length) {
      return true;
    }

    for (let i = 0; i < originalCalendarIds.length; i++) {
      if (originalCalendarIds[i] !== newCalendarIds[i]) {
        return true;
      }
    }

    return false;
  };

  const handleDelete = () => {
    if (event && 'id' in event && event.id && onDelete) {
      onDelete(event.id);
      onClose();
    }
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
    // ESC 키 또는 X 버튼 클릭 시 취소 (저장하지 않음)
    e.preventDefault();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[500px] gap-0 p-0"
        aria-describedby="event-modal-description"
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={handleEscapeKeyDown}
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>{formatDate(eventDate)}</DialogTitle>
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
            disabled={!isCreatedByCurrentUser}
            className={cn(
              'w-full text-lg leading-normal font-medium',
              'placeholder:text-muted-foreground',
              'focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />

          {/* Description Textarea */}
          <Textarea
            ref={descriptionTextareaRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="메모"
            disabled={!isCreatedByCurrentUser}
            className={cn(
              'border-none shadow-none resize-none',
              'focus-visible:ring-0 focus-visible:ring-offset-0',
              'px-0 py-0',
              'disabled:opacity-50'
            )}
            rows={3}
          />

          {/* 캘린더 선택 영역 - 본인이 만든 일정이거나 새 일정일 때만 표시 */}
          {isCreatedByCurrentUser && (
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
          )}

          {/* 작성자 영역 - 수정 모드이고 다른 사람이 만든 일정일 때만 표시 */}
          {event && 'id' in event && createdByUser && (
            <div className="space-y-2 pt-4 border-t">
              <Label>작성자</Label>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {createdByUser.name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{createdByUser.name}</span>
              </div>
            </div>
          )}

          {/* 삭제 버튼 - 수정 모드일 때만 표시 */}
          {event && 'id' in event && isCreatedByCurrentUser && onDelete && (
            <div className="pt-4 border-t">
              <Button
                type="button"
                onClick={handleDelete}
                variant="destructive"
                className="w-full"
              >
                삭제
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;
