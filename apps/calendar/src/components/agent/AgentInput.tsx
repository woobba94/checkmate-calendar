import React, { useState } from 'react';
import { Paperclip, Mic, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AgentInput: React.FC = () => {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim()) {
      // TODO: 메시지 전송 로직
      console.log('Sending:', inputValue);
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
      className="p-3 border bg-white rounded-md border-gray-200"
      style={{
        display: 'flex',
        height: '130px',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 'var(--spacing-2-5, 10px)',
      }}
    >
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="추가하고 싶은 일정을 입력하세요."
        className="w-full flex-1 resize-none border-0 outline-none bg-transparent text-sm leading-normal placeholder:text-[var(--base-muted-foreground,#6B7280)]"
        style={{
          color: 'var(--base-foreground)',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />

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
          disabled={!inputValue.trim()}
        >
          <ArrowUp size={18} />
        </Button>
      </div>
    </div>
  );
};

export default AgentInput;
