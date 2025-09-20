import React, { useState } from 'react';
import { Paperclip, Mic, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgent } from '@/contexts/AgentContext';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface AgentInputProps {
  onFocus?: () => void;
  onBlur?: () => void;
  isExpanded?: boolean;
}

const AgentInput: React.FC<AgentInputProps> = ({ onFocus, onBlur, isExpanded = false }) => {
  const { isMobile } = useResponsive();
  const [inputValue, setInputValue] = useState('');
  const { sendMessage, state } = useAgent();
  const { isLoading } = state;

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleAttachment = () => {
    // TODO: 파일 첨부 로직
    console.log('Attach file');
  };

  const handleRecord = () => {
    // TODO: 녹음 로직
    console.log('Start recording');
  };

  return (
    <div
      className={cn(
        "p-3 border bg-white rounded-md border-gray-200",
        isMobile && "border-0 rounded-none bg-transparent"
      )}
      style={{
        display: 'flex',
        height: isMobile && !isExpanded ? 'auto' : '130px',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 'var(--spacing-2-5, 10px)',
      }}
    >
      {isMobile && !isExpanded ? (
        // 모바일 기본 상태: input
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="추가하고 싶은 일정을 입력하세요."
          className="w-full border-0 outline-none bg-transparent text-sm leading-normal placeholder:text-[var(--base-muted-foreground,#6B7280)]"
          style={{
            color: 'var(--base-foreground)',
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
        />
      ) : (
        // 데스크톱 또는 모바일 확장 상태: textarea
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="추가하고 싶은 일정을 입력하세요."
          className="w-full flex-1 resize-none border-0 outline-none bg-transparent text-sm leading-normal placeholder:text-[var(--base-muted-foreground,#6B7280)]"
          style={{
            color: 'var(--base-foreground)',
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          autoFocus={isMobile && isExpanded}
        />
      )}

      <div
        className="w-full"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div className="flex gap-2">
          <Button
            onClick={handleAttachment}
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8"
            aria-label="파일 첨부"
          >
            <Paperclip size={18} />
          </Button>
          <Button
            onClick={handleRecord}
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8"
            aria-label="녹음"
          >
            <Mic size={18} />
          </Button>
        </div>

        <Button
          onClick={handleSend}
          variant={inputValue.trim() ? 'default' : 'ghost'}
          size="icon"
          className="rounded-full h-8 w-8"
          aria-label="전송"
          disabled={!inputValue.trim() || isLoading}
        >
          <ArrowUp size={18} />
        </Button>
      </div>
    </div>
  );
};

export default AgentInput;
