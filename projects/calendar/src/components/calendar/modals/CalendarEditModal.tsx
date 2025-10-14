import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type {
  Calendar as CalendarType,
  CalendarMember,
} from '@/types/calendar';
import { getCalendarMembers } from '@/services/calendarService';
import { useThrottledCallback } from '@/hooks/useThrottledCallback';

interface CalendarEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendar: CalendarType | null;
  onSave: (
    calendarId: string,
    updates: { name: string; description?: string; color: string },
    inviteEmails: string[]
  ) => Promise<void>;
}

// 프리셋 색상 목록
const PRESET_COLORS = [
  '#02B1F0', // 파란색
  '#05AA5B', // 초록색
  '#97D045', // 연두색
  '#FFC828', // 노란색
  '#FF562C', // 주황색
  '#FF4E9D', // 분홍색
  '#50419C', // 보라색
];

const CalendarEditModal: React.FC<CalendarEditModalProps> = ({
  isOpen,
  onClose,
  calendar,
  onSave,
}) => {
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('#02B1F0');
  const [editCustomColor, setEditCustomColor] = useState('#000000');
  const [isEditCustomColor, setIsEditCustomColor] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editInviteEmails, setEditInviteEmails] = useState<string[]>([]);
  const [editCurrentEmail, setEditCurrentEmail] = useState('');
  const [editEmailError, setEditEmailError] = useState('');
  const [calendarMembers, setCalendarMembers] = useState<
    (CalendarMember & { email?: string })[]
  >([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // 색상 변경 throttle 핸들러 (성능 최적화)
  const handleCustomColorChange = useThrottledCallback((color: string) => {
    setEditCustomColor(color);
    setEditColor(color);
    setIsEditCustomColor(true);
  }, []);

  // 변경사항이 있는지 확인
  const hasChanges = useMemo(() => {
    if (!calendar) return false;

    // 이름 변경 확인
    const nameChanged = editName !== calendar.name;

    // 색상 변경 확인
    const finalColor = isEditCustomColor ? editCustomColor : editColor;
    const colorChanged = finalColor !== (calendar.color || '#02B1F0');

    // 새로 초대할 멤버가 있는지 확인
    const hasNewInvites = editInviteEmails.length > 0;

    return nameChanged || colorChanged || hasNewInvites;
  }, [
    calendar,
    editName,
    editColor,
    editCustomColor,
    isEditCustomColor,
    editInviteEmails,
  ]);

  // 캘린더가 변경되면 상태 업데이트
  useEffect(() => {
    if (calendar && isOpen) {
      setEditName(calendar.name);
      setEditDesc(calendar.description || '');

      const currentColor = calendar.color || '#02B1F0';
      setEditColor(currentColor);

      // 프리셋 색상에 없으면 커스텀 색상으로 처리
      if (!PRESET_COLORS.includes(currentColor)) {
        setIsEditCustomColor(true);
        setEditCustomColor(currentColor);
      } else {
        setIsEditCustomColor(false);
        setEditCustomColor('#000000');
      }

      // 이메일 초대 상태 초기화
      setEditInviteEmails([]);
      setEditCurrentEmail('');
      setEditEmailError('');

      // 현재 멤버 리스트 가져오기
      setIsLoadingMembers(true);
      getCalendarMembers(calendar.id)
        .then((members) => {
          setCalendarMembers(members);
        })
        .catch((error) => {
          console.error('Failed to fetch calendar members:', error);
          setCalendarMembers([]);
        })
        .finally(() => {
          setIsLoadingMembers(false);
        });
    }
  }, [calendar, isOpen]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleAddEmail = () => {
    if (!editCurrentEmail.trim()) return;

    if (!validateEmail(editCurrentEmail)) {
      setEditEmailError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    if (editInviteEmails.includes(editCurrentEmail)) {
      setEditEmailError('이미 추가된 이메일입니다.');
      return;
    }

    setEditInviteEmails([...editInviteEmails, editCurrentEmail]);
    setEditCurrentEmail('');
    setEditEmailError('');
  };

  const handleRemoveEmail = (email: string) => {
    setEditInviteEmails(editInviteEmails.filter((e) => e !== email));
  };

  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleSave = async () => {
    if (!calendar) return;
    setEditLoading(true);
    try {
      const finalColor = isEditCustomColor ? editCustomColor : editColor;
      await onSave(
        calendar.id,
        {
          name: editName,
          description: editDesc,
          color: finalColor,
        },
        editInviteEmails
      );
      onClose();
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>캘린더 수정하기</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-5 my-4">
            <div className="grid gap-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            {/* 현재 멤버 리스트 */}
            <div>
              <Label className="text-sm font-medium">
                현재 멤버 ({calendarMembers.length})
              </Label>
              {isLoadingMembers ? (
                <div className="mt-2 text-sm text-gray-500">
                  멤버 정보를 불러오는 중...
                </div>
              ) : calendarMembers.length > 0 ? (
                <div className="mt-2 space-y-1 max-h-[200px] overflow-y-auto">
                  {calendarMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-md"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {member.email}
                        </span>
                        <span className="text-xs text-gray-500">
                          {member.role === 'owner'
                            ? '소유자'
                            : member.role === 'admin'
                              ? '관리자'
                              : '멤버'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-sm text-gray-500">
                  멤버가 없습니다.
                </div>
              )}
            </div>

            {/* 멤버 초대 */}
            <div className="grid gap-2">
              <Label htmlFor="edit-invite-email">멤버 초대 (선택사항)</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-invite-email"
                  type="email"
                  placeholder="이메일 주소 입력"
                  value={editCurrentEmail}
                  onChange={(e) => {
                    setEditCurrentEmail(e.target.value);
                    setEditEmailError('');
                  }}
                  onKeyPress={handleEmailKeyPress}
                  disabled={editLoading}
                />
                <Button
                  type="button"
                  onClick={handleAddEmail}
                  disabled={!editCurrentEmail.trim() || editLoading}
                  variant="outline"
                >
                  추가
                </Button>
              </div>
              {editEmailError && (
                <p className="text-sm text-red-500 mt-1">{editEmailError}</p>
              )}

              {/* 추가된 이메일 목록 */}
              {editInviteEmails.length > 0 && (
                <div className="mt-2 space-y-1">
                  {editInviteEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                    >
                      <span className="text-sm">{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-2">
                    초대된 멤버들에게 이메일이 발송됩니다.
                  </p>
                </div>
              )}
            </div>
            {/* 색상 선택 */}
            <div className="grid gap-2">
              <Label>색상</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-all ${
                      !isEditCustomColor && editColor === color
                        ? 'shadow-lg ring-2 ring-gray-900 ring-offset-2'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setEditColor(color);
                      setIsEditCustomColor(false);
                    }}
                    aria-label={`색상 ${color} 선택`}
                  />
                ))}

                {/* 커스텀 색상 선택 */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`w-8 h-8 rounded-full transition-all flex items-center justify-center ${
                        isEditCustomColor
                          ? 'shadow-lg ring-2 ring-gray-900 ring-offset-2'
                          : ''
                      }`}
                      style={{
                        background: isEditCustomColor
                          ? editCustomColor
                          : 'radial-gradient(55.5% 56.05% at 50% 50%, #FFF 0%, rgba(255, 255, 255, 0.00) 100%), conic-gradient(from 180deg at 50% 50%, #B600FF 5.768228620290756deg, #7C0CFF 22.96677678823471deg, #391AFF 38.5244420170784deg, #264FFE 53.29166293144226deg, #00B4FD 75.50628662109375deg, #00DFC9 102.35596060752869deg, #00FBA7 131.3704240322113deg, #00FA00 160.19450426101685deg, #E2F700 184.59715604782104deg, #F2F600 212.5272560119629deg, #FF8600 246.09018802642822deg, #FF4600 276.0505700111389deg, #FF2900 304.4519019126892deg, #FF0F8F 321.8369936943054deg, #FF00E5 345.4424500465393deg)',
                      }}
                    ></button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="edit-custom-color">사용자 정의</Label>
                      <input
                        id="edit-custom-color"
                        type="color"
                        defaultValue={editCustomColor}
                        onChange={(e) => {
                          // Throttle로 성능 최적화 (60fps로 제한)
                          handleCustomColorChange(e.target.value);
                        }}
                        className="w-20 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleCancel} variant="outline">
              취소
            </Button>
            <Button type="submit" disabled={editLoading || !hasChanges}>
              {editLoading ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarEditModal;
