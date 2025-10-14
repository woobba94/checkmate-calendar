import React, { useState } from 'react';
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

interface CalendarCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCalendar: (
    name: string,
    color: string,
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

const CalendarCreateModal: React.FC<CalendarCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateCalendar,
}) => {
  const [newCalendarName, setNewCalendarName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#02B1F0');
  const [customColor, setCustomColor] = useState('#000000');
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleAddEmail = () => {
    if (!currentEmail.trim()) return;

    if (!validateEmail(currentEmail)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    if (inviteEmails.includes(currentEmail)) {
      setEmailError('이미 추가된 이메일입니다.');
      return;
    }

    setInviteEmails([...inviteEmails, currentEmail]);
    setCurrentEmail('');
    setEmailError('');
  };

  const handleRemoveEmail = (email: string) => {
    setInviteEmails(inviteEmails.filter((e) => e !== email));
  };

  const handleCreate = async () => {
    if (!newCalendarName.trim()) return;

    try {
      setIsCreating(true);
      const finalColor = isCustomColor ? customColor : selectedColor;
      await onCreateCalendar(newCalendarName.trim(), finalColor, inviteEmails);

      // 초기화
      setNewCalendarName('');
      setSelectedColor('#02B1F0');
      setCustomColor('#000000');
      setIsCustomColor(false);
      setInviteEmails([]);
      setCurrentEmail('');
      setEmailError('');

      onClose();
    } catch {
      // 부모에서 처리됨
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreate();
  };

  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[500px]"
        aria-describedby="calendar-modal-description"
      >
        <form onSubmit={handleSubmit} aria-label="새 캘린더 생성 폼">
          <DialogHeader>
            <DialogTitle>새 캘린더 만들기</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-6 my-4">
            {/* 캘린더 이름 */}
            <div className="grid gap-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="캘린더의 이름을 입력하세요"
                value={newCalendarName}
                onChange={(e) => setNewCalendarName(e.target.value)}
                disabled={isCreating}
                required
              />
            </div>

            {/* 멤버 초대 */}
            <div className="grid gap-2">
              <Label htmlFor="invite-email">멤버 추가</Label>
              <div className="flex gap-2">
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={currentEmail}
                  onChange={(e) => {
                    setCurrentEmail(e.target.value);
                    setEmailError('');
                  }}
                  onKeyPress={handleEmailKeyPress}
                  disabled={isCreating}
                />
                <Button
                  type="button"
                  onClick={handleAddEmail}
                  disabled={!currentEmail.trim() || isCreating}
                  variant="outline"
                >
                  추가
                </Button>
              </div>

              {emailError ? (
                <p className="text-sm text-red-500">{emailError}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  입력한 이메일 주소로 초대장이 발송돼요.
                </p>
              )}

              {/* 추가된 이메일 목록 */}
              {inviteEmails.length > 0 && (
                <div className="mt-2 space-y-1">
                  {inviteEmails.map((email) => (
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
              <Label>캘린더 색상</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-all ${
                      !isCustomColor && selectedColor === color
                        ? 'shadow-lg ring-2 ring-gray-900 ring-offset-2'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setSelectedColor(color);
                      setIsCustomColor(false);
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
                        isCustomColor
                          ? 'shadow-lg ring-2 ring-gray-900 ring-offset-2'
                          : ''
                      }`}
                      style={{
                        background: isCustomColor
                          ? customColor
                          : 'radial-gradient(55.5% 56.05% at 50% 50%, #FFF 0%, rgba(255, 255, 255, 0.00) 100%), conic-gradient(from 180deg at 50% 50%, #B600FF 5.768228620290756deg, #7C0CFF 22.96677678823471deg, #391AFF 38.5244420170784deg, #264FFE 53.29166293144226deg, #00B4FD 75.50628662109375deg, #00DFC9 102.35596060752869deg, #00FBA7 131.3704240322113deg, #00FA00 160.19450426101685deg, #E2F700 184.59715604782104deg, #F2F600 212.5272560119629deg, #FF8600 246.09018802642822deg, #FF4600 276.0505700111389deg, #FF2900 304.4519019126892deg, #FF0F8F 321.8369936943054deg, #FF00E5 345.4424500465393deg)',
                      }}
                    ></button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="custom-color">사용자 정의</Label>
                      <input
                        id="custom-color"
                        type="color"
                        defaultValue={customColor}
                        onChange={(e) => {
                          // 드래그 완료 시에만 반영 (성능 최적화)
                          setCustomColor(e.target.value);
                          setIsCustomColor(true);
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
            <Button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              variant="outline"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!newCalendarName.trim() || isCreating}
            >
              {isCreating ? '생성 중...' : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarCreateModal;
