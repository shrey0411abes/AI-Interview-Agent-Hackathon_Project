import React from 'react';
import { Bot, User, Sparkles, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChatMessage } from '../../lib/types';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming = false }) => {
  const isInterviewer = message.sender === 'interviewer';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex items-start gap-3 my-3 ${isInterviewer ? 'justify-start' : 'justify-end'}`}
    >
      {isInterviewer && (
        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white
                        shrink-0 shadow-lg shadow-indigo-500/20 mt-1">
          <Bot className="w-5 h-5" />
        </div>
      )}

      <div className={`max-w-2xl flex flex-col ${isInterviewer ? 'items-start' : 'items-end'}`}>
        {/* Adaptive label */}
        {isInterviewer && (message.isFollowup !== undefined || message.day !== undefined) && (
          <div className="flex items-center gap-2 mb-1.5 px-1">
            {message.isFollowup ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2.5 py-0.5
                               rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Deep Dive Follow-Up
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase px-2.5 py-0.5
                               rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Layers className="w-3 h-3 text-cyan-400" />
                Day {message.day ?? 'Core'}: {message.dayTitle ?? 'Topic Probe'}
              </span>
            )}
          </div>
        )}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-md ${
            isInterviewer
              ? 'glass-card border border-[var(--glass-card-border)] text-[var(--text-primary)] rounded-tl-sm'
              : 'gradient-brand text-white rounded-tr-sm shadow-indigo-500/25 font-medium'
          }`}
        >
          <div className="whitespace-pre-wrap">{message.text}</div>
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse align-middle rounded-sm" />
          )}
        </div>

        <span className="text-[10px] text-[var(--text-muted)] mt-1 px-1 font-mono">
          {message.timestamp
            ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : ''}
        </span>
      </div>

      {!isInterviewer && (
        <div className="w-9 h-9 rounded-xl glass-card border border-[var(--glass-card-border)]
                        flex items-center justify-center text-[var(--text-muted)] shrink-0 mt-1">
          <User className="w-5 h-5" />
        </div>
      )}
    </motion.div>
  );
};
