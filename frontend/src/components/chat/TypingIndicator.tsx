import React from 'react';
import { Bot } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-3 my-4 animate-fade-in">
      <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/10">
        <Bot className="w-4 h-4 animate-pulse" />
      </div>
      <div className="glass-card rounded-2xl rounded-tl-none px-4 py-3 border border-indigo-500/20 max-w-md">
        <div className="flex items-center gap-1.5 py-1">
          <span className="text-xs text-indigo-300 font-medium mr-2">AI Interviewer is thinking</span>
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};
