import React from 'react';
import { Target, Layers, CheckCircle, Sparkles, HelpCircle, BookOpen } from 'lucide-react';
import { useInterviewStore } from '../../lib/store';

export const ProgressSidebar: React.FC = () => {
  const { progress, selectedCandidate } = useInterviewStore();

  const MIN_QUESTIONS = 8;
  const MIN_DAYS = 4;

  const questionProgressPct = Math.min(100, Math.round((progress.questionCount / MIN_QUESTIONS) * 100));
  const dayProgressPct = Math.min(100, Math.round((progress.daysProbedCount / MIN_DAYS) * 100));

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-2xl flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-indigo-400" />
            Interview Progress
          </h3>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {progress.questionCount} / {MIN_QUESTIONS} Questions
          </span>
        </div>

        {/* Questions Progress Bar */}
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-sm shadow-indigo-500/50"
            style={{ width: `${questionProgressPct}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            Curriculum Coverage
          </h3>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {progress.daysProbedCount} / {MIN_DAYS} Days Probed
          </span>
        </div>

        {/* Days Progress Bar */}
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-500 shadow-sm shadow-cyan-500/50"
            style={{ width: `${dayProgressPct}%` }}
          />
        </div>
      </div>

      {/* Currently Probing Topic Box */}
      <div className="glass-card rounded-xl p-4 border border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-bold flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-indigo-400" />
            Active Target Unit
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

        <h4 className="text-sm font-bold text-slate-100">
          Day {progress.currentDay}: {progress.currentDayTitle}
        </h4>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Agent grounding question in Chroma vector database using candidate mission context.
        </p>
      </div>

      {/* Probed Days Pills */}
      <div>
        <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Probed Curriculum Days:
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {progress.probedDaysList.length === 0 ? (
            <span className="text-xs text-slate-500 italic">Interview not started</span>
          ) : (
            progress.probedDaysList.map((dayNum) => (
              <span
                key={dayNum}
                className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg bg-slate-800 text-indigo-300 border border-slate-700 shadow-sm"
              >
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Day {dayNum}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Judge Transparency Box */}
      <div className="mt-auto pt-4 border-t border-slate-800/80">
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-slate-400">
            <strong className="text-slate-300">LangGraph State Machine:</strong> Dynamic adaptive branching probes 
            candidate weak spots first while enforcing <span className="text-indigo-300 font-semibold">min 8 questions across $\ge 4$ curriculum days</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
