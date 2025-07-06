import React, { useState, useEffect } from 'react';
import type { CalendarEvent } from '@/types/calendar';
import './EventModal.scss';
import { useAuth } from '@/contexts/AuthContext';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>;
  onSave: (event: CalendarEvent | Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => void;
  onDelete?: (eventId: string) => void;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  event,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0070f3');
  const { user } = useAuth();

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setStart(formatDateForInput(event.start));
      setEnd(event.end ? formatDateForInput(event.end) : '');
      setAllDay(event.allDay || false);
      setDescription(event.description || '');
      setColor(event.color || '#0070f3');
    } else {
      // 새 이벤트 생성 시 디폴트값 세팅
      setTitle('');
      setStart(formatDateForInput(new Date()));
      setEnd('');
      setAllDay(false);
      setDescription('');
      setColor('#0070f3');
    }
  }, [event, isOpen]);

  const formatDateForInput = (date: Date | string): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return allDay
      ? `${year}-${month}-${day}`
      : `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('You must be logged in to save events');
      return;
    }

    // 기존 이벤트인지 확인 (id가 있는지)
    const isExistingEvent = event && 'id' in event && event.id;
    if (isExistingEvent) {
      // 기존 이벤트 업데이트
      const updatedEvent: CalendarEvent = {
        id: event.id as string,
        title,
        start: new Date(start),
        end: end ? new Date(end) : undefined,
        allDay,
        description,
        color,
        calendar_id: (event as CalendarEvent).calendar_id,
        created_by: (event as CalendarEvent).created_by,
        created_at: (event as CalendarEvent).created_at,
        updated_at: new Date(),
      };
      onSave(updatedEvent);
    } else {
      // 새 이벤트 생성
      const newEvent: Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'> = {
        title,
        start: new Date(start),
        end: end ? new Date(end) : undefined,
        allDay,
        description,
        color,
        // TODO calendar_id 무결하게 만들어야함. 방법 검토
        calendar_id: (event as any)?.calendar_id || '', // 선택된 캘린더 ID
      };
      onSave(newEvent);
    }

    onClose();
  };

  const handleDelete = () => {
    if (event && 'id' in event && event.id && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="event-modal">
        <div className="modal-header">
          <h2>{event && 'id' in event && event.id ? 'Edit Event' : 'Create Event'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="allDay">
              <input
                id="allDay"
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
              />
              All Day
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="start">Start</label>
            <input
              id="start"
              type={allDay ? "date" : "datetime-local"}
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="end">End</label>
            <input
              id="end"
              type={allDay ? "date" : "datetime-local"}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="color">Color</label>
            <input
              id="color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            {event && 'id' in event && event.id && onDelete && (
              <button
                type="button"
                className="delete-button"
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-button">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;