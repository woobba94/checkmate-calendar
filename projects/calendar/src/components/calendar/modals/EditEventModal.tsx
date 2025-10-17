import React, { useState, useEffect, useRef } from 'react';
import type { CalendarEvent, Calendar as CalendarType } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { getUserById, type UserProfile } from '@/services/authService';
import { getUserInitials } from '@/lib/user-utils';
import { formatDateKorean, formatDateTimeKorean } from '@/lib/date-utils';
import { hasChanges } from '@/lib/form-utils';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent;
  onSave: (event: CalendarEvent) => Promise<void>;
  onDelete?: (eventId: string) => void;
  calendars: CalendarType[];
}

const EditEventModal: React.FC<EditEventModalProps> = ({
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [createdByUser, setCreatedByUser] = useState<UserProfile | null>(null);
  const [updatedByUser, setUpdatedByUser] = useState<UserProfile | null>(null);
  const [isLoadingCreator, setIsLoadingCreator] = useState(false);
  const [isLoadingUpdater, setIsLoadingUpdater] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 현재 사용자가 일정 작성자인지 확인
  const isCreatedByCurrentUser = event.created_by === user?.id;

  // 수정 이력이 있는지 확인
  const hasUpdateHistory = event.updated_by;

  // 파일명에 이미 타임스탬프가 포함되어 있어서 별도 처리 불필요
  const creatorAvatarUrl = createdByUser?.avatar_url;
  const updaterAvatarUrl = updatedByUser?.avatar_url;

  useEffect(() => {
    if (!isOpen) return;

    // 이벤트 데이터로 초기화
    setTitle(event.title || '');
    setDescription(event.description || '');
    setEventDate(event.start ? new Date(event.start) : new Date());

    // 기존 일정의 캘린더 IDs 설정
    if (event.calendar_ids && event.calendar_ids.length > 0) {
      setSelectedCalendarIds(event.calendar_ids);
    }

    // 생성자 정보 가져오기
    if (event.created_by) {
      setIsLoadingCreator(true);
      getUserById(event.created_by)
        .then((userData) => {
          if (userData) {
            setCreatedByUser(userData);
          }
        })
        .catch((error) => {
          console.error('Failed to fetch creator info:', error);
        })
        .finally(() => {
          setIsLoadingCreator(false);
        });
    } else {
      setCreatedByUser(null);
    }

    // 마지막 수정자 정보 가져오기 (수정 이력이 있는 경우)
    if (hasUpdateHistory && event.updated_by) {
      setIsLoadingUpdater(true);
      getUserById(event.updated_by)
        .then((userData) => {
          if (userData) {
            setUpdatedByUser(userData);
          }
        })
        .catch((error) => {
          console.error('Failed to fetch updater info:', error);
        })
        .finally(() => {
          setIsLoadingUpdater(false);
        });
    } else {
      setUpdatedByUser(null);
    }
  }, [isOpen, event, hasUpdateHistory]);

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

    const updatedEvent = {
      ...event,
      title: title.trim(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      allDay: true,
      description: description.trim(),
      calendar_ids: selectedCalendarIds,
    };

    // 변경사항 확인
    if (
      hasChanges(event, updatedEvent, [
        'title',
        'description',
        'start',
        'calendar_ids',
      ])
    ) {
      await onSave(updatedEvent);
    }

    onClose();
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (event.id && onDelete) {
      onDelete(event.id);
      setIsDeleteDialogOpen(false);
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
    // ESC 키 취소 (저장하지 않음)
    e.preventDefault();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="sm:max-w-[500px] gap-0 p-0"
          onInteractOutside={handleInteractOutside}
          onEscapeKeyDown={handleEscapeKeyDown}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            // 포커스를 Dialog 자체로 이동하여 aria-hidden 경고 방지
            const dialogContent = e.currentTarget as HTMLElement;
            dialogContent?.focus();
          }}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>{formatDateKorean(eventDate)}</DialogTitle>
            <DialogDescription className="sr-only">
              일정을 수정할 수 있습니다.
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

            {/* 캘린더 선택 영역 - 본인이 만든 일정일 때만 표시 */}
            {isCreatedByCurrentUser && (
              <div className="space-y-2">
                <Label>공유할 캘린더</Label>
                <div className="grid grid-cols-2 gap-2">
                  {calendars.map((calendar) => {
                    const isSelected = selectedCalendarIds.includes(
                      calendar.id
                    );
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

            {/* 생성자 & 마지막 수정 영역 */}
            <div
              className={cn(
                'pt-4 border-t',
                hasUpdateHistory ? 'grid grid-cols-2 gap-4' : ''
              )}
            >
              {/* 생성자 */}
              <div className="space-y-2">
                <div className="flex items-center h-[20px]">
                  <Label>생성자</Label>
                </div>
                {isLoadingCreator ? (
                  <div className="text-sm text-gray-500">
                    생성자 정보를 불러오는 중...
                  </div>
                ) : createdByUser ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={creatorAvatarUrl}
                        className="object-contain"
                      />
                      <AvatarFallback className="text-xs">
                        {getUserInitials(
                          createdByUser.display_name,
                          createdByUser.email
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {isCreatedByCurrentUser ? (
                      <span className="text-sm font-medium">나</span>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {createdByUser.display_name ||
                            createdByUser.email?.split('@')[0] ||
                            '사용자'}
                        </span>
                        {createdByUser.display_name && (
                          <span className="text-[10px] text-gray-500">
                            {createdByUser.email}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    생성자 정보를 찾을 수 없습니다.
                  </div>
                )}
              </div>

              {/* 마지막 수정 영역 - 수정 이력이 있을 때만 표시 */}
              {hasUpdateHistory && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between h-[20px]">
                    <Label>마지막 수정</Label>
                    <span className="text-xs text-gray-500">
                      {formatDateTimeKorean(event.updated_at)}
                    </span>
                  </div>
                  {isLoadingUpdater ? (
                    <div className="text-sm text-gray-500">
                      수정자 정보를 불러오는 중...
                    </div>
                  ) : updatedByUser ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={updaterAvatarUrl}
                          className="object-contain"
                        />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(
                            updatedByUser.display_name,
                            updatedByUser.email
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {event.updated_by === user?.id ? (
                        <span className="text-sm font-medium">나</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {updatedByUser.display_name ||
                              updatedByUser.email?.split('@')[0] ||
                              '사용자'}
                          </span>
                          {updatedByUser.display_name && (
                            <span className="text-[10px] text-gray-500">
                              {updatedByUser.email}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      수정자 정보를 찾을 수 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 삭제 버튼 - 본인이 만든 일정일 때만 표시 */}
            {isCreatedByCurrentUser && onDelete && (
              <div className="pt-4 border-t flex justify-end">
                <Button
                  type="button"
                  onClick={handleDelete}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  삭제
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogPortal>
          <DialogOverlay className="z-[60]" />
          <DialogPrimitive.Content
            className={cn(
              'fixed left-[50%] top-[50%] z-[70] grid w-full max-w-[425px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg'
            )}
          >
            <DialogHeader>
              <DialogTitle>정말 일정을 삭제할까요?</DialogTitle>
              <DialogDescription>
                모든 캘린더에서 이 일정이 삭제돼요.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                variant="outline"
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={confirmDelete}
                variant="destructive"
              >
                삭제
              </Button>
            </DialogFooter>
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
};

export default EditEventModal;
