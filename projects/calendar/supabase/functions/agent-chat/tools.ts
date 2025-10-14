// 도구 타입 정의
export type ToolType =
  | 'search_events'
  | 'create_event'
  | 'update_event'
  | 'delete_event'
  | 'check_conflicts'
  | 'get_available_slots';

interface ToolDefinition {
  type: 'function';
  function: {
    name: ToolType;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'search_events',
      description: '특정 조건으로 일정을 검색합니다',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '검색어 (제목, 설명)',
          },
          start_date: {
            type: 'string',
            description: '시작일 (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: '종료일 (YYYY-MM-DD)',
          },
          calendar_ids: {
            type: 'array',
            items: { type: 'string' },
            description: '검색할 캘린더 ID 목록',
          },
        },
        required: ['start_date', 'end_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_event',
      description: '새로운 일정을 생성합니다',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: '일정 제목',
          },
          start: {
            type: 'string',
            description: '시작 시간 (ISO 8601)',
          },
          end: {
            type: 'string',
            description: '종료 시간 (ISO 8601)',
          },
          all_day: {
            type: 'boolean',
            description: '종일 일정 여부',
          },
          calendar_id: {
            type: 'string',
            description: '캘린더 ID',
          },
          description: {
            type: 'string',
            description: '일정 설명',
          },
        },
        required: ['title', 'start'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_event',
      description: '기존 일정을 수정합니다',
      parameters: {
        type: 'object',
        properties: {
          event_id: {
            type: 'string',
            description: '수정할 일정 ID',
          },
          updates: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              start: { type: 'string' },
              end: { type: 'string' },
              description: { type: 'string' },
              all_day: { type: 'boolean' },
            },
          },
        },
        required: ['event_id', 'updates'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_event',
      description: '일정을 삭제합니다',
      parameters: {
        type: 'object',
        properties: {
          event_id: {
            type: 'string',
            description: '삭제할 일정 ID',
          },
          confirm: {
            type: 'boolean',
            description: '삭제 확인 여부',
          },
        },
        required: ['event_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_conflicts',
      description: '일정 충돌을 확인합니다',
      parameters: {
        type: 'object',
        properties: {
          start: { type: 'string', description: '시작 시간 (ISO 8601)' },
          end: { type: 'string', description: '종료 시간 (ISO 8601)' },
          calendar_ids: {
            type: 'array',
            items: { type: 'string' },
            description: '확인할 캘린더 ID 목록',
          },
          exclude_event_id: {
            type: 'string',
            description: '충돌 검사에서 제외할 일정 ID',
          },
        },
        required: ['start', 'end'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_available_slots',
      description: '특정 기간 내 사용 가능한 시간대를 찾습니다',
      parameters: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            description: '시작일 (YYYY-MM-DD)',
          },
          end_date: {
            type: 'string',
            description: '종료일 (YYYY-MM-DD)',
          },
          duration_minutes: {
            type: 'number',
            description: '필요한 시간 (분 단위)',
          },
          calendar_ids: {
            type: 'array',
            items: { type: 'string' },
            description: '확인할 캘린더 ID 목록',
          },
          working_hours: {
            type: 'object',
            properties: {
              start: { type: 'string', description: '업무 시작 시간 (HH:mm)' },
              end: { type: 'string', description: '업무 종료 시간 (HH:mm)' },
            },
          },
        },
        required: ['start_date', 'end_date', 'duration_minutes'],
      },
    },
  },
];

interface Calendar {
  id: string;
  name: string;
  color?: string;
}

interface SystemPromptContext {
  currentDate: string;
  timezone: string;
  activeCalendarId?: string;
  calendars?: Calendar[];
}

export function buildSystemPrompt(context: SystemPromptContext): string {
  const calendarList = context.calendars?.length
    ? context.calendars.map((cal) => `- ${cal.name} (ID: ${cal.id})`).join('\n')
    : '- 캘린더 없음';

  // 현재 날짜와 시간을 사용자 타임존으로 변환
  const currentDateTime = new Date(context.currentDate);
  const dateStr = currentDateTime.toLocaleDateString('ko-KR', {
    timeZone: context.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeStr = currentDateTime.toLocaleTimeString('ko-KR', {
    timeZone: context.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `당신은 캘린더 관리를 돕는 AI 어시스턴트입니다.

역할:
- 사용자의 일정 관련 요청을 처리합니다
- 일정 조회, 생성, 수정, 삭제를 수행합니다
- 일정 충돌을 확인하고 알려줍니다
- 사용 가능한 시간대를 찾아줍니다

제약사항:
- 일정 관련 요청만 처리합니다
- 일정과 무관한 질문에는 "일정 관련 요청만 처리할 수 있습니다"라고 응답합니다
- 삭제 작업 시 반드시 확인을 받습니다
- 모든 작업 결과를 명확하게 설명합니다

현재 컨텍스트:
- 현재 날짜/시간: ${dateStr} ${timeStr}
- 타임존: ${context.timezone}
- 기준 ISO 시간: ${context.currentDate}
${context.activeCalendarId ? `- 활성 캘린더: ${context.activeCalendarId}` : ''}

사용 가능한 캘린더:
${calendarList}

캘린더 이름 처리:
- 사용자가 특정 캘린더 이름을 언급하면 해당 캘린더 ID를 사용합니다
- 캘린더 이름이 명시되지 않으면 활성 캘린더 또는 첫 번째 캘린더를 사용합니다
- 여러 캘린더에서 조회할 때는 모든 캘린더 ID를 사용합니다

일정 생성 규칙 (매우 중요):
1. **모든 일정은 종일 일정으로 생성**:
   - all_day는 항상 true로 설정
   - start는 해당 날짜의 00:00:00으로 설정
   - end는 설정하지 않음 (자동으로 처리됨)

2. **시간 정보 처리**:
   - 사용자가 시간을 명시하지 않은 경우 (예: "오늘 약국", "내일 회의"): description에 시간 정보 추가하지 않음
   - 사용자가 시간을 명시한 경우 (예: "오늘 오후 3시 약국", "내일 10시 회의"): description에 시간 정보 추가
   - description 형식: 기존 설명이 있으면 "시간: [시간 정보]\n[기존 설명]", 없으면 "시간: [시간 정보]"
   - 시간 정보 예시: "오후 3시", "10:00", "오전 11시 30분" 등 사용자가 입력한 형식 그대로

3. **날짜 해석**:
   - "오늘": 현재 날짜 (${dateStr}) 사용
   - "내일": 현재 날짜의 다음 날 사용
   - "모레": 현재 날짜의 2일 후 사용
   - 특정 날짜가 명시된 경우 해당 날짜 사용

4. **타임존 처리**:
   - 모든 시간은 사용자의 타임존 (${context.timezone})을 기준으로 해석
   - start는 항상 해당 날짜의 00:00:00으로 ISO 8601 형식 사용

예시:
- "오늘 약국" → all_day: true, start: "${currentDateTime.toISOString().split('T')[0]}T00:00:00Z"
- "오늘 오후 2시 약국" → all_day: true, start: "${currentDateTime.toISOString().split('T')[0]}T00:00:00Z", description: "시간: 오후 2시"
- "내일 10시 회의" → all_day: true, start: "[내일 날짜]T00:00:00Z", description: "시간: 10시"
- "오늘 오후 3시 병원, 처방전 받기" → all_day: true, start: "${currentDateTime.toISOString().split('T')[0]}T00:00:00Z", description: "시간: 오후 3시\n처방전 받기"

응답 형식:
- 부드럽고 친절하게 응답
- 작업 완료 시: "[작업 내용]을 완료했습니다"
- 오류 발생 시: 사용자가 이해할 수 있는 메시지로 설명
- 날짜와 시간은 사용자의 타임존에 맞춰 표시`;
}
