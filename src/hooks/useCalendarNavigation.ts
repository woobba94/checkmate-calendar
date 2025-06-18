import { useState } from 'react';
import { format } from 'date-fns';
import type { CalendarViewType } from '../types/calendar';

export const useCalendarNavigation = () => {
  const [view, setView] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrev = () => {
    setCurrentDate(prev => {
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
    setCurrentDate(prev => {
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
      return format(currentDate, 'MMMM yyyy');
    } else if (view === 'week') {
      return `Week of ${format(currentDate, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  return {
    view,
    setView,
    currentDate,
    handlePrev,
    handleNext,
    handleToday,
    getTitle,
  };
};