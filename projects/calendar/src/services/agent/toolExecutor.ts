import * as eventService from '@/services/eventService';
import { addDays, parseISO, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { ToolCall, ToolResult } from '@/types/agent';
import type { CalendarEvent } from '@/types/calendar';

// 타입 안전 유틸리티 함수
const toISOString = (date: string | Date | undefined): string => {
  if (!date) return '';
  return typeof date === 'string' ? date : date.toISOString();
};

const toDate = (date: string | Date): Date => {
  return typeof date === 'string' ? parseISO(date) : date;
};

// 여러 캘린더의 이벤트를 효율적으로 조회하는 헬퍼 함수
const fetchEventsByCalendarsAndDateRange = async (
  calendarIds: string[],
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> => {
  if (calendarIds.length === 0) return [];

  // 한 번의 쿼리로 모든 이벤트 조회 (N+1 쿼리 방지)
  return eventService.getEventsByDateRangeMultiple(
    calendarIds,
    startDate,
    endDate
  );
};

export class ToolExecutor {
  constructor(private userContext?: { calendarIds?: string[] }) {}

  async execute(toolCall: ToolCall): Promise<ToolResult> {
    try {
      const { name, arguments: argsString } = toolCall.function;
      const args = JSON.parse(argsString);

      switch (name) {
        case 'search_events':
          return await this.searchEvents(args);

        case 'create_event':
          return await this.createEvent(args);

        case 'update_event':
          return await this.updateEvent(args);

        case 'delete_event':
          return await this.deleteEvent(args);

        case 'check_conflicts':
          return await this.checkConflicts(args);

        case 'get_available_slots':
          return await this.getAvailableSlots(args);

        default:
          return {
            status: 'error',
            error: `알 수 없는 도구: ${name}`,
          };
      }
    } catch (error) {
      return {
        status: 'error',
        error:
          error instanceof Error
            ? error.message
            : '도구 실행 중 오류가 발생했습니다',
      };
    }
  }

  private async searchEvents(args: {
    query?: string;
    start_date: string;
    end_date: string;
    calendar_ids?: string[];
  }): Promise<ToolResult> {
    const calendarIds =
      args.calendar_ids || this.userContext?.calendarIds || [];
    const startDate = parseISO(args.start_date);
    const endDate = parseISO(args.end_date);

    // 한 번의 쿼리로 모든 이벤트 조회 (N+1 쿼리 방지)
    let events = await fetchEventsByCalendarsAndDateRange(
      calendarIds,
      startDate,
      endDate
    );

    // 검색어가 있으면 필터링
    if (args.query) {
      const query = args.query.toLowerCase();
      events = events.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          (event.description && event.description.toLowerCase().includes(query))
      );
    }

    return {
      status: 'success',
      data: {
        count: events.length,
        events: events.map((event) => ({
          id: event.id,
          title: event.title,
          start: toISOString(event.start),
          end: toISOString(event.end),
          allDay: event.allDay || false,
          description: event.description,
          calendarId: event.calendar_ids?.[0] || '',
        })),
      },
    };
  }

  private async createEvent(args: {
    title: string;
    start: string;
    end?: string;
    all_day?: boolean;
    calendar_id?: string;
    description?: string;
  }): Promise<ToolResult> {
    let startTime = args.start;
    let endTime = args.end;

    // 종일 일정 처리
    if (args.all_day) {
      // 종일 일정은 날짜만 사용 (시간은 00:00:00)
      const startDate = parseISO(args.start);
      // 시간 정보를 00:00:00으로 초기화
      startDate.setHours(0, 0, 0, 0);
      startTime = startDate.toISOString();

      // 종료 시간도 같은 날짜의 23:59:59로 설정
      if (!endTime) {
        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        endTime = endDate.toISOString();
      }
    } else {
      // 시간 지정 일정
      if (!endTime) {
        const startDate = parseISO(args.start);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);
        endTime = endDate.toISOString();
      }
    }

    const event = await eventService.createEvent(
      {
        title: args.title,
        start: startTime,
        end: endTime,
        allDay: args.all_day || false,
        calendar_ids: args.calendar_id
          ? [args.calendar_id]
          : this.userContext?.calendarIds || ['default'],
        description: args.description,
      },
      undefined
    );

    return {
      status: 'success',
      data: {
        event: {
          id: event.id,
          title: event.title,
          start: toISOString(event.start),
          end: toISOString(event.end),
          allDay: event.allDay || false,
        },
        message: `"${event.title}" 일정이 생성되었습니다.`,
      },
    };
  }

  private async updateEvent(args: {
    event_id: string;
    updates: {
      title?: string;
      start?: string;
      end?: string;
      description?: string;
      all_day?: boolean;
    };
  }): Promise<ToolResult> {
    const updatedEvent = await eventService.updateEvent(
      {
        id: args.event_id,
        title: args.updates.title,
        start: args.updates.start,
        end: args.updates.end,
        description: args.updates.description,
        allDay: args.updates.all_day,
      },
      undefined
    );

    return {
      status: 'success',
      data: {
        event: {
          id: updatedEvent.id,
          title: updatedEvent.title,
          start: toISOString(updatedEvent.start),
          end: toISOString(updatedEvent.end),
          allDay: updatedEvent.allDay,
        },
        message: `"${updatedEvent.title}" 일정이 수정되었습니다.`,
      },
    };
  }

  private async deleteEvent(args: {
    event_id: string;
    confirm?: boolean;
  }): Promise<ToolResult> {
    if (args.confirm === false) {
      return {
        status: 'success',
        data: {
          message: '일정 삭제가 취소되었습니다.',
          requiresConfirmation: true,
        },
      };
    }

    await eventService.deleteEvent(args.event_id, undefined);

    return {
      status: 'success',
      data: {
        message: '일정이 삭제되었습니다.',
      },
    };
  }

  private async checkConflicts(args: {
    start: string;
    end: string;
    calendar_ids?: string[];
    exclude_event_id?: string;
  }): Promise<ToolResult> {
    const calendarIds =
      args.calendar_ids || this.userContext?.calendarIds || [];
    const checkStart = parseISO(args.start);
    const checkEnd = parseISO(args.end);

    // 한 번의 쿼리로 모든 이벤트 조회 (N+1 쿼리 방지)
    const allEvents = await fetchEventsByCalendarsAndDateRange(
      calendarIds,
      checkStart,
      checkEnd
    );

    const conflicts = allEvents.filter((event) => {
      if (args.exclude_event_id && event.id === args.exclude_event_id) {
        return false;
      }

      const eventStart = toDate(event.start);
      const eventEnd = toDate(event.end || event.start);

      // 시간이 겹치는지 확인
      return checkStart < eventEnd && checkEnd > eventStart;
    });

    return {
      status: 'success',
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts: conflicts.map((event) => ({
          id: event.id,
          title: event.title,
          start: toISOString(event.start),
          end: toISOString(event.end),
        })),
        message:
          conflicts.length > 0
            ? `${conflicts.length}개의 일정과 시간이 겹칩니다.`
            : '시간이 겹치는 일정이 없습니다.',
      },
    };
  }

  private async getAvailableSlots(args: {
    start_date: string;
    end_date: string;
    duration_minutes: number;
    calendar_ids?: string[];
    working_hours?: {
      start: string;
      end: string;
    };
  }): Promise<ToolResult> {
    const calendarIds =
      args.calendar_ids || this.userContext?.calendarIds || [];
    const startDate = parseISO(args.start_date);
    const endDate = parseISO(args.end_date);

    // 한 번의 쿼리로 모든 이벤트 조회 (N+1 쿼리 방지)
    const allEvents = await fetchEventsByCalendarsAndDateRange(
      calendarIds,
      startDate,
      endDate
    );

    const workStart = args.working_hours?.start || '09:00';
    const workEnd = args.working_hours?.end || '18:00';

    const availableSlots: Array<{
      date: string;
      slots: Array<{ start: string; end: string }>;
    }> = [];

    // 각 날짜별로 가능한 시간대 찾기
    for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
      const daySlots: Array<{ start: string; end: string }> = [];

      // 해당 날짜의 업무 시간 설정
      const dayStart = new Date(date);
      const [startHour, startMin] = workStart.split(':').map(Number);
      dayStart.setHours(startHour, startMin, 0, 0);

      const dayEnd = new Date(date);
      const [endHour, endMin] = workEnd.split(':').map(Number);
      dayEnd.setHours(endHour, endMin, 0, 0);

      // 해당 날짜의 이벤트만 필터링 및 정렬
      const dayEvents = allEvents
        .filter((event) => {
          const eventDate = toDate(event.start);
          return eventDate.toDateString() === date.toDateString();
        })
        .sort((a, b) => toDate(a.start).getTime() - toDate(b.start).getTime());

      let currentTime = dayStart;

      for (const event of dayEvents) {
        const eventStart = toDate(event.start);
        const eventEnd = toDate(event.end || event.start);

        // 현재 시간부터 이벤트 시작까지 여유가 있는지 확인
        const gap = eventStart.getTime() - currentTime.getTime();
        if (gap >= args.duration_minutes * 60 * 1000) {
          daySlots.push({
            start: currentTime.toISOString(),
            end: eventStart.toISOString(),
          });
        }

        // 현재 시간을 이벤트 종료 시간으로 업데이트
        if (eventEnd > currentTime) {
          currentTime = eventEnd;
        }
      }

      // 마지막 이벤트 후 업무 종료까지 확인
      const finalGap = dayEnd.getTime() - currentTime.getTime();
      if (finalGap >= args.duration_minutes * 60 * 1000) {
        daySlots.push({
          start: currentTime.toISOString(),
          end: dayEnd.toISOString(),
        });
      }

      if (daySlots.length > 0) {
        availableSlots.push({
          date: format(date, 'yyyy-MM-dd (EEEE)', { locale: ko }),
          slots: daySlots,
        });
      }
    }

    return {
      status: 'success',
      data: {
        duration: args.duration_minutes,
        availableSlots,
        message: `${args.duration_minutes}분 동안 사용 가능한 시간대를 찾았습니다.`,
      },
    };
  }
}
