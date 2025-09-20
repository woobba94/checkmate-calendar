import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { CalendarViewType } from '@/types/calendar';

export const useCalendarNavigation = () => {
  const [view, setView] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrev = () => {
    setCurrentDate((prev) => {
      const date = new Date(prev);
      if (view === 'month') {
        date.setMonth(date.getMonth() - 1);
      } else if (view === 'week') {
        date.setDate(date.getDate() - 7);
      } else {
        date.setDate(date.getDate() - 1);
      }
      return date;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const date = new Date(prev);
      if (view === 'month') {
        date.setMonth(date.getMonth() + 1);
      } else if (view === 'week') {
        date.setDate(date.getDate() + 7);
      } else {
        date.setDate(date.getDate() + 1);
      }
      return date;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getTitle = () => {
    if (view === 'month') {
      return format(currentDate, 'yyyy년 M월', { locale: ko });
    } else if (view === 'week') {
      return `${format(currentDate, 'yyyy년 M월 d일', { locale: ko })} 주`;
    } else {
      return format(currentDate, 'yyyy년 M월 d일 EEEE', { locale: ko });
    }
  };

  return {
    view,
    setView,
    currentDate,
    setCurrentDate,
    handlePrev,
    handleNext,
    handleToday,
    getTitle,
  };
};
