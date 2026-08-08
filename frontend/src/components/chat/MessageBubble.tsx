import React from 'react';
import { Bot, User, Sparkles, Layers } from 'lucide-react';
import { ChatMessage } from '../../lib/types';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming = false }) => {
  const isInterviewer = message.sender === 'interviewer';

  return (
    <div className={`flex items-start gap-3 my-4 ${isInterviewer ? 'justify-start' : 'justify-end'}`}>
      {isInterviewer && (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20 mt-1 border border-indigo-400/30">
          <Bot className="w-5 h-5" />
        </div>
      )}

      <div className={`max-w-2xl flex flex-col ${isInterviewer ? 'items-start' : 'items-end'}`}>
        {/* Adaptive Visual Cue Tag (Deep Dive vs New Topic) */}
        {isInterviewer && (message.isFollowup !== undefined || message.day !== undefined) && (
          <div className="flex items-center gap-2 mb-1.5 px-1">
            {message.isFollowup ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Deep Dive Follow-Up
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm">
                <Layers className="w-3 h-3 text-cyan-400" />
                Curriculum Day {message.day || 'Core'}: {message.dayTitle || 'Topic Probe'}
              </span>
            )}
          </div>
        )}

        <div
          className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-md transition-all ${
            isInterviewer
              ? 'glass-card border border-slate-700/60 text-slate-100 rounded-tl-sm'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-sm shadow-indigo-500/20 font-medium'
          }`}
        >
          <div className="whitespace-pre-wrap">{message.text}</div>
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse align-middle" />
          )}
        </div>

        <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono">
          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
      </div>

      {!isInterviewer && (
        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1 shadow-md">
          <User className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};
