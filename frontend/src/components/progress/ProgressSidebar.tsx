import React from 'react';
import { Target, Layers, CheckCircle, Sparkles, HelpCircle, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInterviewStore } from '../../lib/store';

const ProgressBar: React.FC<{ pct: number; color: string }> = ({ pct, color }) => (
  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${pct}%` }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`h-full rounded-full ${color} shadow-sm`}
    />
  </div>
);

export const ProgressSidebar: React.FC = () => {
  const { progress } = useInterviewStore();

  const MIN_QUESTIONS = 8;
  const MIN_DAYS = 4;

  const questionPct = Math.min(100, Math.round((progress.questionCount / MIN_QUESTIONS) * 100));
  const dayPct      = Math.min(100, Math.round((progress.daysProbedCount / MIN_DAYS) * 100));

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-5 h-full">
      {/* Questions progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Interview Progress
          </h3>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-lg
                           bg-white/5 text-[var(--text-muted)] border border-white/10">
            {progress.questionCount}/{MIN_QUESTIONS}
          </span>
        </div>
        <ProgressBar pct={questionPct} color="bg-gradient-to-r from-indigo-500 to-purple-500 shadow-indigo-500/30" />
      </div>

      {/* Days progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Curriculum Coverage
          </h3>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-lg
                           bg-white/5 text-[var(--text-muted)] border border-white/10">
            {progress.daysProbedCount}/{MIN_DAYS} days
          </span>
        </div>
        <ProgressBar pct={dayPct} color="bg-gradient-to-r from-cyan-500 to-teal-500 shadow-cyan-500/30" />
      </div>

      {/* Active topic box */}
      <div className="glass-card rounded-xl p-4 border border-primary-500/25 bg-primary-500/5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary-300 font-bold flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-primary-400" />
            Active Topic
          </span>
          {progress.isFollowup ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse">
              Deep Dive
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              New Topic
            </span>
          )}
        </div>
        <h4 className="text-sm font-bold text-[var(--text-primary)]">
          Day {progress.currentDay}: {progress.currentDayTitle}
        </h4>
        <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
          Grounded via ChromaDB vector search from candidate's mission history.
        </p>
      </div>

      {/* Probed days pills */}
      <div>
        <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent-purple" />
          Probed Days
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {progress.probedDaysList.length === 0 ? (
            <span className="text-xs text-[var(--text-muted)] italic">Not started yet</span>
          ) : (
            progress.probedDaysList.map((dayNum) => (
              <motion.span
                key={dayNum}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg
                           bg-white/5 text-primary-300 border border-white/10"
              >
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Day {dayNum}
              </motion.span>
            ))
          )}
        </div>
      </div>

      {/* Technical info box */}
      <div className="mt-auto pt-4 border-t border-[var(--glass-border)]">
        <div className="flex items-start gap-2.5 p-3 rounded-xl glass-card text-xs">
          <HelpCircle className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
            <strong className="text-[var(--text-secondary)]">LangGraph State Machine:</strong>{' '}
            Adaptive branching probes weak spots while enforcing{' '}
            <span className="text-primary-400 font-semibold">min 8 questions across ≥4 curriculum days</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
