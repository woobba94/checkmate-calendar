import React, { useRef, useEffect } from 'react';
import { useAgent } from '@/contexts/AgentContext';
import {
  Loader2,
  Calendar,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolCall, SearchEventsResult } from '@/types/agent';

const AgentHistory: React.FC = () => {
  const { state } = useAgent();
  const { messages, isLoading, streamingMessageId } = state;
  const scrollRef = useRef<HTMLDivElement>(null);

  // 새 메시지가 도착하면 하단으로 자동 스크롤
  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, [messages]);

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'search_events':
        return <Search className="h-3 w-3" />;
      case 'create_event':
        return <Calendar className="h-3 w-3" />;
      case 'update_event':
        return <Edit className="h-3 w-3" />;
      case 'delete_event':
        return <Trash2 className="h-3 w-3" />;
      default:
        return <CheckCircle className="h-3 w-3" />;
    }
  };

  const formatToolResult = (toolCall: ToolCall) => {
    if (!toolCall.result) return null;

    const { name } = toolCall.function;
    const result = toolCall.result;

    if (result.status === 'error') {
      return (
        <div className="flex items-center gap-2 text-xs text-destructive mt-2">
          <AlertCircle className="h-3 w-3" />
          <span>오류: {result.error}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
        {getToolIcon(name)}
        <span>
          {name === 'search_events' && result.data
            ? `${(result.data as SearchEventsResult).count}개 결과`
            : '완료'}
        </span>
      </div>
    );
  };

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          <p>일정 관련 요청을 입력해주세요. 예: "내일 회의 일정 추가해줘"</p>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={cn(
                  'max-w-[80%] p-3 rounded-lg transition-all',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted',
                  message.status === 'error' && 'border border-destructive',
                  message.status === 'streaming' && 'animate-pulse'
                )}
              >
                {message.isToolExecuting && (
                  <div className="flex items-center gap-2 text-xs mb-2 opacity-70">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>도구 실행 중...</span>
                  </div>
                )}

                <p className="text-sm whitespace-pre-wrap">
                  {message.content ||
                    (message.id === streamingMessageId && '...')}
                </p>

                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.toolCalls.map((toolCall, idx) => (
                      <div key={idx}>{formatToolResult(toolCall)}</div>
                    ))}
                  </div>
                )}

                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(message.createdAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && !streamingMessageId && (
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AgentHistory;
