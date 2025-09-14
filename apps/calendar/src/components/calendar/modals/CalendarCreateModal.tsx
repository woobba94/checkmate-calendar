import React, { useState } from 'react';
import { Button, Dialog, Portal, CloseButton, Theme } from '@chakra-ui/react';
import { useColorModeToggle } from '@/components/ui/provider';

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
  const { colorMode } = useColorModeToggle();

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

  if (!isOpen) return null;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(v) => {
        if (!v.open) onClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Theme appearance={colorMode}>
              <Dialog.Header>
                <Dialog.Title>새 캘린더 만들기</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" aria-label="닫기" />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body>
                <input
                  type="text"
                  placeholder="Calendar Name"
                  value={newCalendarName}
                  onChange={(e) => setNewCalendarName(e.target.value)}
                  disabled={isCreating}
                  style={{ width: '100%', marginBottom: 16 }}
                />
              </Dialog.Body>
              <Dialog.Footer
                style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}
              >
                <Dialog.ActionTrigger asChild>
                  <Button
                    onClick={onClose}
                    disabled={isCreating}
                    variant="surface"
                  >
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  onClick={handleCreate}
                  disabled={!newCalendarName.trim() || isCreating}
                  variant="surface"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
              </Dialog.Footer>
            </Theme>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default CalendarCreateModal;
