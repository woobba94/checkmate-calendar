import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from 'react';
import type { Message, ConversationState } from '@/types/agent';

interface AgentContextType {
  state: ConversationState;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
}

type AgentAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | {
      type: 'UPDATE_MESSAGE';
      payload: { id: string; updates: Partial<Message> };
    }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_MESSAGES' };

const initialState: ConversationState = {
  messages: [],
  isLoading: false,
  error: null,
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
      };
    default:
      return state;
  }
}

const AgentContext = createContext<AgentContextType | null>(null);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(agentReducer, initialState);

  const sendMessage = useCallback(async (content: string) => {
    // 사용자 메시지 생성
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

    try {
      // TODO: 실제 서버 호출 구현
      // 현재는 응답을 시뮬레이션
      setTimeout(() => {
        const assistantMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content:
            '네, 일정을 추가하는 것을 도와드리겠습니다. 어떤 일정을 추가하시겠습니까?',
          createdAt: new Date().toISOString(),
          status: 'sent',
        };
        dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
        dispatch({ type: 'SET_LOADING', payload: false });
      }, 1000);
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload:
          error instanceof Error
            ? error.message
            : '메시지 전송 중 오류가 발생했습니다.',
      });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);

  return (
    <AgentContext.Provider value={{ state, sendMessage, clearMessages }}>
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
