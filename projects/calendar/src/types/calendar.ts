// 캘린더 타입
export interface Calendar {
  id: string;
  name: string;
  description?: string;
  color: string; // HEX 형식 (예: #ffffff)
  created_by: string; // 캘린더를 생성한 사용자 ID
  created_at: string | Date;
  updated_at: string | Date;
}

// 캘린더 이벤트 타입
export interface CalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  end?: string | Date;
  allDay?: boolean;
  description?: string;
  calendar_ids?: string[]; // 이벤트가 속한 캘린더 ID 목록
  created_by: string; // 이벤트를 생성한 사용자 ID
  created_at: string | Date;
  updated_at: string | Date;
}

// 이벤트-캘린더 관계 (Junction Table)
export interface EventCalendar {
  event_id: string;
  calendar_id: string;
  google_event_id?: string;
  google_updated?: string | Date;
  created_at: string | Date;
}

// 캘린더 멤버 타입
export interface CalendarMember {
  id: string;
  calendar_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member'; // 멤버 역할
  created_at: string | Date;
}

// 사용자 타입
export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  user_metadata?: {
    display_name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
}

// 캘린더 뷰 타입
export type CalendarViewType = 'month' | 'week' | 'day' | 'list';

// 캘린더 이벤트 필터 옵션
export interface EventFilterOptions {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  searchTerm?: string;
}

// 캘린더 공유 초대 타입
export interface CalendarInvitation {
  id: string;
  calendar_id: string;
  inviter_id: string;
  invitee_email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string | Date;
  expires_at?: string | Date;
  calendar_name?: string; // 조인 시 포함될 수 있는 캘린더 이름
}

// 캘린더 권한 타입
export type CalendarPermission = {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canManageMembers: boolean;
};

// 캘린더 설정 타입
export interface CalendarSettings {
  id: string;
  calendar_id: string;
  user_id: string;
  color?: string;
  default_view?: CalendarViewType;
  notification_preferences?: NotificationPreference[];
  is_visible?: boolean;
  updated_at: string | Date;
}

// 추후 개발시 사용
// 알림 설정 타입
export interface NotificationPreference {
  type: 'email' | 'push' | 'in_app';
  enabled: boolean;
  advance_notice?: number; // 분 단위 사전 알림 시간
}

// 이벤트 참석자 타입
export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
  created_at: string | Date;
  updated_at: string | Date;
}

// 반복 이벤트 규칙 타입
export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  ends_on?: Date | null;
  ends_after_occurrences?: number | null;
  days_of_week?: number[]; // 0(일요일)부터 6(토요일)
  day_of_month?: number;
  month_of_year?: number;
  exceptions?: Date[]; // 반복에서 제외할 날짜들
}

// 캘린더 액세스 로그 타입
export interface CalendarAccessLog {
  id: string;
  calendar_id: string;
  user_id: string;
  action: 'view' | 'create' | 'update' | 'delete' | 'share';
  resource_type: 'calendar' | 'event' | 'member';
  resource_id?: string;
  timestamp: string | Date;
  details?: string;
}
