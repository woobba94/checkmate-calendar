import React, { useState, useEffect } from 'react';
import type { CalendarEvent, Calendar as CalendarType } from '@/types/calendar';
import './EventModal.scss';
import { useAuth } from '@/contexts/AuthContext';
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
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTheme } from '@/hooks/useTheme';

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
  ) => void;
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
  const [calendarId, setCalendarId] = useState(
    defaultCalendarId || (calendars[0]?.id ?? '')
  );
  const { user: _user } = useAuth();
  const { theme } = useTheme();

  const isSingleCalendar = calendars.length === 1;

  useEffect(() => {
    if (!isOpen) return;
    if (event) {
      setTitle(event.title || '');
      setStart(
        event.start ? new Date(event.start).toISOString().slice(0, 16) : ''
      );
      setEnd(event.end ? new Date(event.end).toISOString().slice(0, 16) : '');
      setAllDay(!!event.allDay);
      setDescription(event.description || '');
      setColor(event.color || '#0070f3');
      setCalendarId(
        'calendar_id' in event && event.calendar_id
          ? event.calendar_id
          : defaultCalendarId || calendars[0]?.id || ''
      );
    } else {
      setTitle('');
      setStart('');
      setEnd('');
      setAllDay(true); // 디폴트로 종일
      setDescription('');
      setColor('#0070f3');
      setCalendarId(defaultCalendarId || calendars[0]?.id || '');
    }
  }, [isOpen, event, defaultCalendarId, calendars]);

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {event && 'id' in event ? '이벤트 수정' : '이벤트 생성'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="calendar">캘린더</Label>
              <Select
                id="calendar"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                required
                disabled={isSingleCalendar}
              >
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allDay"
                checked={allDay}
                onCheckedChange={(checked) => setAllDay(Boolean(checked))}
              />
              <Label htmlFor="allDay" className="cursor-pointer">
                종일
              </Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start">시작</Label>
              <Input
                id="start"
                type={allDay ? 'date' : 'datetime-local'}
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end">종료</Label>
              <Input
                id="end"
                type={allDay ? 'date' : 'datetime-local'}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                disabled={allDay}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color">색상</Label>
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-full"
              />
            </div>
          </div>
          <DialogFooter>
            {event && 'id' in event && onDelete && (
              <Button
                type="button"
                onClick={handleDelete}
                variant="destructive"
              >
                삭제
              </Button>
            )}
            <Button type="button" onClick={onClose} variant="outline">
              취소
            </Button>
            <Button type="submit">저장</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;
