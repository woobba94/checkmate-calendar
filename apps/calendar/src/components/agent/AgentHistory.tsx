import React from 'react';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'agent';
  timestamp: Date;
}

const AgentHistory: React.FC = () => {
  // 임시 메시지 데이터 - 실제로는 상태 관리에서 가져올 예정
  const messages: Message[] = [];

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-sm text-[var(--base-muted-foreground)]">
          {/* 메시지가 없을 때 표시될 영역 */}
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-gray-100 ml-auto max-w-[80%]'
                  : 'bg-blue-50 mr-auto max-w-[80%]'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs text-gray-500 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentHistory;
