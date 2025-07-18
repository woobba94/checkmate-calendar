import React, { useState, useEffect } from 'react';
import type { CalendarEvent, Calendar as CalendarType } from '@/types/calendar';
import './EventModal.scss';
import { useAuth } from '@/contexts/AuthContext';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>;
  onSave: (event: CalendarEvent | Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => void;
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
  defaultCalendarId,
}) => {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0070f3');
  const [calendarId, setCalendarId] = useState(defaultCalendarId || (calendars[0]?.id ?? ''));
  const { user } = useAuth();

  const isSingleCalendar = calendars.length === 1;

  useEffect(() => {
    if (!isOpen) return;
    if (event) {
      setTitle(event.title || '');
      setStart(event.start ? new Date(event.start).toISOString().slice(0, 16) : '');
      setEnd(event.end ? new Date(event.end).toISOString().slice(0, 16) : '');
      setAllDay(!!event.allDay);
      setDescription(event.description || '');
      setColor(event.color || '#0070f3');
      setCalendarId('calendar_id' in event && event.calendar_id ? event.calendar_id : (defaultCalendarId || calendars[0]?.id || ''));
    } else {
      setTitle('');
      setStart('');
      setEnd('');
      setAllDay(true); // 디폴트로 종일
      setDescription('');
      setColor('#0070f3');
      setCalendarId(defaultCalendarId || calendars[0]?.id || '');
    }
  }, [isOpen, event]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !calendarId || !start) return;
    let startDate: Date;
    let endDate: Date;
    if (allDay) {
      // 종일 -> 날짜만 사용, 시간은 00:00:00
      const day = start.slice(0, 10);
      startDate = new Date(day + 'T00:00:00');
      endDate = end ? new Date(end.slice(0, 10) + 'T00:00:00') : startDate;
    } else {
      startDate = new Date(start);
      endDate = end ? new Date(end) : startDate;
    }
    const base = {
      title,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      allDay,
      description,
      color,
      calendar_id: calendarId,
    };
    if (event && 'id' in event && event.id) {
      onSave({ ...event, ...base });
    } else {
      onSave(base);
    }
  };

  const handleDelete = () => {
    if (event && 'id' in event && event.id && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay light">
      <div className="event-modal light">
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>{event && 'id' in event ? '이벤트 수정' : '이벤트 생성'}</h2>
            <button type="button" className="close-button" onClick={onClose}>&times;</button>
          </div>
          <div className="form-group">
            <label>캘린더</label>
            <select value={calendarId} onChange={e => setCalendarId(e.target.value)} required disabled={isSingleCalendar}>
              {calendars.map(cal => (
                <option key={cal.id} value={cal.id}>{cal.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>제목</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} /> 종일
            </label>
          </div>
          <div className="form-group">
            <label>시작</label>
            <input type={allDay ? 'date' : 'datetime-local'} value={start} onChange={e => setStart(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>종료</label>
            <input type={allDay ? 'date' : 'datetime-local'} value={end} onChange={e => setEnd(e.target.value)} disabled={allDay} />
          </div>
          <div className="form-group">
            <label>설명</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="form-group">
            <label>색상</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} />
          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {event && 'id' in event && onDelete && (
              <button type="button" className="delete-button" onClick={handleDelete}>삭제</button>
            )}
            <button type="button" className="cancel-button" onClick={onClose}>취소</button>
            <button type="submit" className="save-button">저장</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;