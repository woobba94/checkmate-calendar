import { SupabaseClient } from '@supabase/supabase-js';
import { isCalendarRelated } from './agent/messageFilter';
import { ToolExecutor } from './agent/toolExecutor';
import type {
  AgentResponse,
  Message,
  StreamChunk,
  ToolCall,
  UserContext,
  ToolResultData,
  SearchEventsResult,
  CreateEventResult,
  UpdateEventResult,
  DeleteEventResult,
  ConflictCheckResult,
  AvailableSlotsResult,
} from '@/types/agent';

export class AgentService {
  private toolExecutor: ToolExecutor | null = null;

  constructor(private supabase: SupabaseClient) {}

  /**
   * 메시지 전송 및 스트리밍 응답 처리
   */
  async *sendMessage(
    message: string,
    conversationHistory: Message[],
    userContext: UserContext
  ): AsyncGenerator<AgentResponse> {
    // ToolExecutor 생성 (userContext 전달)
    if (!this.toolExecutor) {
      this.toolExecutor = new ToolExecutor({
        calendarIds: userContext.calendarIds,
      });
    }

    // 캘린더 관련 메시지인지 사전 필터링
    if (!isCalendarRelated(message)) {
      yield {
        type: 'error',
        content:
          '일정 관련 요청만 처리할 수 있습니다. 일정 추가, 조회, 수정, 삭제 등의 요청을 해주세요.',
      };
      return;
    }

    try {
      // 현재 세션 가져오기
      const {
        data: { session },
      } = await this.supabase.auth.getSession();

      if (!session) {
        throw new Error('세션이 없습니다. 다시 로그인해주세요.');
      }

      // Supabase Edge Function 호출
      const { data, error } = await this.supabase.functions.invoke(
        'agent-chat',
        {
          body: {
            message,
            conversation_history: conversationHistory.slice(-10), // 최근 10개 메시지만
            user_context: userContext,
          },
        }
      );

      if (error) throw error;

      if (!data?.body) {
        throw new Error('응답 본문이 없습니다');
      }

      // 스트리밍 응답 처리
      const reader = data.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const currentToolCalls: Map<number, ToolCall> = new Map();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);

            if (dataStr === '[DONE]') {
              continue;
            }

            try {
              const chunk: StreamChunk = JSON.parse(dataStr);

              for (const response of this.processChunk(
                chunk,
                currentToolCalls
              )) {
                yield response;
              }
            } catch (e) {
              console.error('청크 파싱 오류:', e);
            }
          }
        }
      }

      // 도구 호출이 있으면 실행
      for (const toolCall of currentToolCalls.values()) {
        yield* this.executeToolCall(toolCall);
      }
    } catch (error) {
      yield {
        type: 'error',
        content:
          error instanceof Error
            ? `오류가 발생했습니다: ${error.message}`
            : '알 수 없는 오류가 발생했습니다',
      };
    }
  }

  /**
   * 스트리밍 청크 처리
   */
  private *processChunk(
    chunk: StreamChunk,
    toolCalls: Map<number, ToolCall>
  ): Generator<AgentResponse> {
    const delta = chunk.choices[0]?.delta;

    if (!delta) return;

    // 텍스트 컨텐츠 처리
    if (delta.content) {
      yield {
        type: 'text',
        content: delta.content,
      };
    }

    // 도구 호출 처리
    if (delta.tool_calls) {
      for (const toolCallDelta of delta.tool_calls) {
        const index = toolCallDelta.index;

        if (!toolCalls.has(index)) {
          toolCalls.set(index, {
            id: toolCallDelta.id || '',
            type: 'function',
            function: {
              name: toolCallDelta.function?.name || '',
              arguments: '',
            },
          });
        }

        const toolCall = toolCalls.get(index)!;

        if (toolCallDelta.function?.name) {
          toolCall.function.name = toolCallDelta.function.name;
        }

        if (toolCallDelta.function?.arguments) {
          toolCall.function.arguments += toolCallDelta.function.arguments;
        }
      }
    }
  }

  /**
   * 도구 호출 실행
   */
  private async *executeToolCall(
    toolCall: ToolCall
  ): AsyncGenerator<AgentResponse> {
    yield {
      type: 'tool_execution',
      content: `${this.getToolDisplayName(toolCall.function.name)} 실행 중...`,
      toolName: toolCall.function.name,
    };

    const result = await this.toolExecutor.execute(toolCall);

    if (result.status === 'success') {
      yield {
        type: 'tool_execution',
        content: this.formatToolResult(toolCall.function.name, result.data),
        toolName: toolCall.function.name,
        toolResult: result.data,
      };
    } else {
      yield {
        type: 'error',
        content: `도구 실행 오류: ${result.error}`,
        toolName: toolCall.function.name,
      };
    }
  }

  /**
   * 도구 이름을 사용자 친화적으로 변환
   */
  private getToolDisplayName(toolName: string): string {
    const displayNames: Record<string, string> = {
      search_events: '일정 검색',
      create_event: '일정 생성',
      update_event: '일정 수정',
      delete_event: '일정 삭제',
      check_conflicts: '일정 충돌 확인',
      get_available_slots: '가능한 시간대 찾기',
    };

    return displayNames[toolName] || toolName;
  }

  /**
   * 도구 실행 결과를 사용자 친화적으로 포맷
   */
  private formatToolResult(toolName: string, data: ToolResultData): string {
    switch (toolName) {
      case 'search_events': {
        const searchResult = data as SearchEventsResult;
        if (searchResult.count === 0) {
          return '해당 기간에 일정이 없습니다.';
        }

        let result = `${searchResult.count}개의 일정을 찾았습니다:\n\n`;
        for (const event of searchResult.events) {
          const start = new Date(event.start);
          const dateStr = start.toLocaleDateString('ko-KR');
          const timeStr = event.allDay
            ? '종일'
            : start.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              });

          result += `• ${event.title} - ${dateStr} ${timeStr}\n`;
          if (event.description) {
            result += `  ${event.description}\n`;
          }
        }
        return result;
      }

      case 'create_event':
        return (data as CreateEventResult).message;

      case 'update_event':
        return (data as UpdateEventResult).message;

      case 'delete_event':
        return (data as DeleteEventResult).message;

      case 'check_conflicts': {
        const conflictData = data as ConflictCheckResult;
        if (!conflictData.hasConflicts) {
          return conflictData.message;
        }

        let conflictResult = `${conflictData.message}\n\n겹치는 일정:\n`;
        for (const conflict of conflictData.conflicts) {
          const start = new Date(conflict.start);
          conflictResult += `• ${conflict.title} - ${start.toLocaleString('ko-KR')}\n`;
        }
        return conflictResult;
      }

      case 'get_available_slots': {
        const slotData = data as AvailableSlotsResult;
        let slotResult = `${slotData.message}\n\n`;
        for (const daySlot of slotData.availableSlots) {
          slotResult += `📅 ${daySlot.date}\n`;
          for (const slot of daySlot.slots) {
            const start = new Date(slot.start);
            const end = new Date(slot.end);
            slotResult += `  • ${start.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })} - ${end.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}\n`;
          }
          slotResult += '\n';
        }
        return slotResult;
      }

      default:
        return JSON.stringify(data, null, 2);
    }
  }
}
