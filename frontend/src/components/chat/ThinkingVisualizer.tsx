import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle2, Loader2, Sparkles, Terminal, Cpu } from 'lucide-react';
import { useInterviewStore } from '../../lib/store';

export const ThinkingVisualizer: React.FC = () => {
  const { thinkingPhases, isStreaming, streamingText } = useInterviewStore();

  // Active when streaming and text hasn't finished loading or phases are executing
  if (!isStreaming || streamingText.length > 50) {
    return null;
  }

  const latestPhase = thinkingPhases[thinkingPhases.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.25 }}
      className="my-3 p-4 rounded-2xl glass border border-primary-500/30 bg-primary-500/5 shadow-xl max-w-xl"
    >
      <div className="flex items-center justify-between mb-3 border-b border-[var(--glass-border)] pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg gradient-brand flex items-center justify-center text-white shadow-md">
            <Brain className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary-300">
            LangGraph Agent Reasoning Engine
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          LIVE BACKEND SSE
        </span>
      </div>

      <div className="space-y-2">
        {thinkingPhases.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-400" />
            <span>Connecting to FastAPI state machine...</span>
          </div>
        ) : (
          thinkingPhases.map((phase, idx) => {
            const isLatest = idx === thinkingPhases.length - 1;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2.5 text-xs"
              >
                {isLatest ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}

                <span
                  className={
                    isLatest
                      ? 'font-medium text-[var(--text-primary)] font-mono text-[11px]'
                      : 'text-[var(--text-muted)] font-mono text-[11px] line-through opacity-70'
                  }
                >
                  {phase.label}
                </span>

                {phase.provider && (
                  <span className="ml-auto text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 text-[var(--text-muted)] border border-white/10 shrink-0">
                    {phase.provider}
                  </span>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
