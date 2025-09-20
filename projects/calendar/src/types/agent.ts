/**
 * Agent/Assistant message types
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  toolCalls?: ToolCall[];
  status?: 'sending' | 'sent' | 'error';
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

export interface ConversationState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
