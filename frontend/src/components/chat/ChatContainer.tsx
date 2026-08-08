import React, { useRef, useEffect } from 'react';
import { Bot, Play, ShieldAlert } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { useInterviewStore } from '../../lib/store';
import { useInterviewStream } from '../../hooks/useInterviewStream';

export const ChatContainer: React.FC = () => {
  const { messages, isStreaming, streamingText, selectedCandidate, progress, isComplete } = useInterviewStore();
  const { startInterview, sendCandidateAnswer } = useInterviewStream();
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive or stream updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isStreaming]);

  const hasStarted = messages.length > 0 || isStreaming;

  return (
    <div className="flex flex-col h-full bg-[#0d1322]/80 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Technical Interview Session</span>
              <span className="text-xs font-mono font-normal text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {selectedCandidate.member.jobRole}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Candidate: <strong className="text-slate-200">{selectedCandidate.member.name}</strong> • 
              Probing Day {progress.currentDay}: {progress.currentDayTitle}
            </p>
          </div>
        </div>

        {!hasStarted && (
          <button
            onClick={startInterview}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Begin Interview</span>
          </button>
        )}
      </div>

      {/* Main chat messages container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {!hasStarted ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-xl shadow-indigo-500/10">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Ready to Conduct Interview</h3>
            <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
              The AI Interview Agent will evaluate <span className="text-indigo-300 font-semibold">{selectedCandidate.member.name}</span> across 
              minimum 8 questions spanning at least 4 curriculum days based on their actual course mission history.
            </p>
            <button
              onClick={startInterview}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm rounded-xl shadow-xl shadow-indigo-500/25 transition-all transform hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Assessment Now</span>
            </button>
          </div>
        ) : (
          <>
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
              <div className="my-6 p-4 rounded-xl glass-card border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-center flex items-center justify-center gap-2 text-sm font-medium">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span>Interview Completed! Generating final technical assessment dashboard below...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </>
        )}
      </div>

      {/* Footer input container */}
      <div className="px-6 pb-6 pt-2 bg-slate-900/40 border-t border-slate-800/60">
        <ChatInput onSendMessage={sendCandidateAnswer} isDisabled={!hasStarted || isStreaming || isComplete} />
      </div>
    </div>
  );
};
