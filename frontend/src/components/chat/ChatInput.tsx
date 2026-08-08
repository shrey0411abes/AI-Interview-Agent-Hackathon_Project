import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isDisabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isDisabled }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isDisabled) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative mt-3">
      <div className="glass-card rounded-2xl border border-[var(--glass-card-border)] p-2
                      focus-within:border-primary-500/50 focus-within:ring-2 focus-within:ring-primary-500/15
                      transition-all">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isDisabled
              ? 'Interviewer is processing your answer…'
              : 'Type your answer… (Enter to send, Shift+Enter for newline)'
          }
          disabled={isDisabled}
          rows={1}
          className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)]
                     text-sm focus:outline-none resize-none px-3 py-2 leading-relaxed disabled:opacity-50"
        />

        <div className="flex items-center justify-between pt-2 px-3 border-t border-[var(--glass-border)] mt-1 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-muted)]">
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            <span>Grounded in 31-day curriculum</span>
          </div>

          <button
            type="submit"
            disabled={!text.trim() || isDisabled}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 gradient-brand text-white
                       rounded-xl font-medium text-xs shadow-md shadow-indigo-500/20
                       disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-all"
          >
            {isDisabled ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating…</span>
              </>
            ) : (
              <>
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
