/**
 * Agent/Assistant message types
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  toolCalls?: ToolCall[];
  status?: 'sending' | 'sent' | 'error' | 'streaming';
  isToolExecuting?: boolean;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
  result?: ToolResult;
}

// 도구별 결과 타입 정의
export interface SearchEventsResult {
  count: number;
  events: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    description?: string;
    calendarId: string;
  }>;
}

export interface CreateEventResult {
  event: {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
  };
  message: string;
}

export interface UpdateEventResult {
  event: {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay?: boolean;
  };
  message: string;
}

export interface DeleteEventResult {
  message: string;
  requiresConfirmation?: boolean;
}

export interface ConflictCheckResult {
  hasConflicts: boolean;
  conflicts: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
  }>;
  message: string;
}

export interface AvailableSlotsResult {
  duration: number;
  availableSlots: Array<{
    date: string;
    slots: Array<{ start: string; end: string }>;
  }>;
  message: string;
}

export type ToolResultData =
  | SearchEventsResult
  | CreateEventResult
  | UpdateEventResult
  | DeleteEventResult
  | ConflictCheckResult
  | AvailableSlotsResult;

export interface ToolResult {
  status: 'success' | 'error';
  data?: ToolResultData;
  error?: string;
}

export interface ConversationState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  streamingMessageId?: string;
}

export interface UserContext {
  userId: string;
  currentDate: string;
  timezone: string;
  activeCalendarId?: string;
  calendarIds: string[];
  calendars?: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
}

export interface AgentResponse {
  type: 'text' | 'tool_execution' | 'error';
  content: string;
  toolName?: string;
  toolResult?: ToolResultData;
}

export interface StreamChunk {
  id: string;
  choices: Array<{
    delta: {
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: 'function';
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason?: string;
  }>;
}
