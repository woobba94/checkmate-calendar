import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CalendarCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCalendar: (name: string) => Promise<void>;
}

const CalendarCreateModal: React.FC<CalendarCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateCalendar,
}) => {
  const [newCalendarName, setNewCalendarName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newCalendarName.trim()) return;

    try {
      setIsCreating(true);
      await onCreateCalendar(newCalendarName.trim());
      setNewCalendarName('');
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="calendar-modal-description">
        <form onSubmit={handleSubmit} aria-label="새 캘린더 생성 폼">
          <DialogHeader>
            <DialogTitle>새 캘린더 만들기</DialogTitle>
            <DialogDescription id="calendar-modal-description">
              새 캘린더의 이름을 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">캘린더 이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="Calendar Name"
                value={newCalendarName}
                onChange={(e) => setNewCalendarName(e.target.value)}
                disabled={isCreating}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!newCalendarName.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarCreateModal;
