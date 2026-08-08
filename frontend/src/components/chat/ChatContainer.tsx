import React, { useRef, useEffect } from 'react';
import { Bot, Play, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { useInterviewStore } from '../../lib/store';
import { useInterviewStream } from '../../hooks/useInterviewStream';

export const ChatContainer: React.FC = () => {
  const { messages, isStreaming, streamingText, selectedCandidate, progress, isComplete } = useInterviewStore();
  const { startInterview, sendCandidateAnswer } = useInterviewStream();
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isStreaming]);

  const hasStarted = messages.length > 0 || isStreaming;

  return (
    <div className="flex flex-col h-full glass rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              Technical Interview Session
              <span className="text-[10px] font-mono text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">
                {selectedCandidate.member.jobRole}
              </span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Probing Day {progress.currentDay}: {progress.currentDayTitle}
            </p>
          </div>
        </div>

        {!hasStarted && (
          <button
            onClick={startInterview}
            className="inline-flex items-center gap-1.5 px-3 py-2 gradient-brand text-white
                       font-medium text-xs rounded-lg shadow-lg hover:scale-105 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Begin
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {!hasStarted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col items-center justify-center text-center p-8"
          >
            <div className="w-16 h-16 rounded-2xl gradient-brand/20 border border-primary-500/30
                            flex items-center justify-center text-primary-400 mb-4 shadow-xl">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Ready to Conduct Interview</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mb-6 leading-relaxed">
              The AI Interview Agent will evaluate{' '}
              <span className="text-primary-400 font-semibold">{selectedCandidate.member.name}</span>{' '}
              across minimum 8 questions spanning at least 4 curriculum days.
            </p>
            <button
              onClick={startInterview}
              className="inline-flex items-center gap-2 px-6 py-3 gradient-brand text-white
                         font-semibold text-sm rounded-xl shadow-xl shadow-indigo-500/25 hover:scale-105 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Assessment
            </button>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isStreaming && streamingText && (
              <MessageBubble
                message={{
                  id: 'streaming-msg',
                  sender: 'interviewer',
                  text: streamingText,
                  timestamp: new Date(),
                  isFollowup: progress.isFollowup,
                  day: progress.currentDay,
                  dayTitle: progress.currentDayTitle,
                }}
                isStreaming={true}
              />
            )}

            {isStreaming && !streamingText && <TypingIndicator />}

            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="my-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10
                           text-emerald-300 text-center flex items-center justify-center gap-2 text-sm font-medium"
              >
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                Interview complete — redirecting to results…
              </motion.div>
            )}

            <div ref={chatBottomRef} />
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="px-5 pb-5 pt-2 border-t border-[var(--glass-border)]">
        <ChatInput onSendMessage={sendCandidateAnswer} isDisabled={!hasStarted || isStreaming || isComplete} />
      </div>
    </div>
  );
};
