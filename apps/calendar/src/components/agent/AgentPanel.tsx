import React from 'react';
import AgentHistory from './AgentHistory';
import AgentInput from './AgentInput';

const AgentPanel: React.FC = () => {
  return (
    <div className="flex flex-col h-full py-2 pr-2">
      <AgentHistory />
      <AgentInput />
    </div>
  );
};

export default AgentPanel;
