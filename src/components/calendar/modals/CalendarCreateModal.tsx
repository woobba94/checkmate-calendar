import React, { useState } from 'react';
import { Button } from "@chakra-ui/react";

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
        } catch (error) {
            // 부모에서 처리됨
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Create New Calendar</h2>
                <input
                    type="text"
                    placeholder="Calendar Name"
                    value={newCalendarName}
                    onChange={(e) => setNewCalendarName(e.target.value)}
                    disabled={isCreating}
                />
                <div className="modal-buttons">
                    <Button onClick={onClose} disabled={isCreating} variant="surface">
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!newCalendarName.trim() || isCreating} variant="surface">
                        {isCreating ? 'Creating...' : 'Create'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CalendarCreateModal;