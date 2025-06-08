// 캘린더
// 캘린더의 이벤트 타입
export interface CalendarEvent {
    id: string;
    title: string;
    start: string | Date;
    end?: string | Date;
    allDay?: boolean;
    description?: string;
    color?: string;
    userId: string;
    createdAt: string | Date;
    updatedAt: string | Date;
  }
  
  // 캘린더의 뷰 타입
export type CalendarViewType = 'month' | 'week' | 'day' | 'list';
  

// 사용자
  export interface User {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  }