import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
} from 'react';
import type {
  Message,
  ConversationState,
  UserContext,
  ToolCall,
} from '@/types/agent';
import { AgentService } from '@/services/agentService';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useCalendars } from '@/hooks/useCalendars';

interface AgentContextType {
  state: ConversationState;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  stopStreaming: () => void;
}

type AgentAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | {
      type: 'UPDATE_MESSAGE';
      payload: { id: string; updates: Partial<Message> };
    }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_STREAMING_MESSAGE_ID'; payload: string | undefined }
  | { type: 'APPEND_TO_MESSAGE'; payload: { id: string; content: string } };

const initialState: ConversationState = {
  messages: [],
  isLoading: false,
  error: null,
  streamingMessageId: undefined,
};

function agentReducer(
  state: ConversationState,
  action: AgentAction
): ConversationState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.id
            ? { ...msg, ...action.payload.updates }
            : msg
        ),
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
        error: null,
        streamingMessageId: undefined,
      };
    case 'SET_STREAMING_MESSAGE_ID':
      return {
        ...state,
        streamingMessageId: action.payload,
      };
    case 'APPEND_TO_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.id
            ? { ...msg, content: msg.content + action.payload.content }
            : msg
        ),
      };
    default:
      return state;
  }
}

const AgentContext = createContext<AgentContextType | null>(null);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(agentReducer, initialState);
  const { user } = useAuth();
  const { calendars: allCalendars } = useCalendars(user?.id || '');
  const agentServiceRef = useRef<AgentService | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // AgentService 인스턴스 생성
  if (!agentServiceRef.current) {
    agentServiceRef.current = new AgentService(supabase);
  }

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user) {
        dispatch({
          type: 'SET_ERROR',
          payload: '로그인이 필요합니다.',
        });
        return;
      }

      // 이전 스트리밍 중단
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // 사용자 메시지 추가
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
        status: 'sent',
      };

      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // 어시스턴트 메시지 준비
      const assistantMessageId = `msg-${Date.now() + 1}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        status: 'streaming',
        toolCalls: [],
      };

      dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
      dispatch({
        type: 'SET_STREAMING_MESSAGE_ID',
        payload: assistantMessageId,
      });

      try {
        // 사용자 컨텍스트 생성
        const userContext: UserContext = {
          userId: user.id,
          currentDate: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          activeCalendarId: allCalendars?.[0]?.id,
          calendarIds: allCalendars?.map((cal) => cal.id) || [],
          calendars:
            allCalendars?.map((cal) => ({
              id: cal.id,
              name: cal.name,
              color: cal.color,
            })) || [],
        };

        // 스트리밍 응답 처리
        const agentService = agentServiceRef.current!;

        for await (const response of agentService.sendMessage(
          content,
          state.messages,
          userContext
        )) {
          // 중단 확인
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          switch (response.type) {
            case 'text':
              dispatch({
                type: 'APPEND_TO_MESSAGE',
                payload: {
                  id: assistantMessageId,
                  content: response.content,
                },
              });
              break;

            case 'tool_execution':
              dispatch({
                type: 'UPDATE_MESSAGE',
                payload: {
                  id: assistantMessageId,
                  updates: {
                    isToolExecuting: true,
                    content:
                      assistantMessage.content + '\n\n' + response.content,
                  },
                },
              });

              if (response.toolResult) {
                // 도구 실행 결과를 toolCalls에 추가
                const toolCall: ToolCall = {
                  id: `tool-${Date.now()}`,
                  type: 'function',
                  function: {
                    name: response.toolName!,
                    arguments: JSON.stringify(response.toolResult),
                  },
                  result: {
                    status: 'success',
                    data: response.toolResult,
                  },
                };

                dispatch({
                  type: 'UPDATE_MESSAGE',
                  payload: {
                    id: assistantMessageId,
                    updates: {
                      toolCalls: [
                        ...(assistantMessage.toolCalls || []),
                        toolCall,
                      ],
                      isToolExecuting: false,
                    },
                  },
                });
              }
              break;

            case 'error':
              dispatch({
                type: 'UPDATE_MESSAGE',
                payload: {
                  id: assistantMessageId,
                  updates: {
                    content: response.content,
                    status: 'error',
                  },
                },
              });
              break;
          }
        }

        // 스트리밍 완료
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            id: assistantMessageId,
            updates: {
              status: 'sent',
            },
          },
        });
      } catch (error) {
        console.error('Agent error:', error);
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            id: assistantMessageId,
            updates: {
              content:
                error instanceof Error
                  ? `오류가 발생했습니다: ${error.message}`
                  : '메시지 처리 중 오류가 발생했습니다.',
              status: 'error',
            },
          },
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_STREAMING_MESSAGE_ID', payload: undefined });
      }
    },
    [user, allCalendars, state.messages]
  );

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    dispatch({ type: 'SET_LOADING', payload: false });
    dispatch({ type: 'SET_STREAMING_MESSAGE_ID', payload: undefined });
  }, []);

  return (
    <AgentContext.Provider
      value={{ state, sendMessage, clearMessages, stopStreaming }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within AgentProvider');
  }
  return context;
}
