import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, MessageSquare, Bot, User, Award } from 'lucide-react';
import { ChatMessage, TopicScore } from '../../lib/types';

interface QATurn {
  day: number;
  dayTitle: string;
  question: string;
  answer: string;
  isFollowup?: boolean;
}

interface ExpandableTimelineProps {
  messages: ChatMessage[];
  topicScores?: TopicScore[];
}

export const ExpandableTimeline: React.FC<ExpandableTimelineProps> = ({ messages, topicScores = [] }) => {
  const [openDay, setOpenDay] = useState<number | null>(null);

  // Group messages into Q&A turns per day
  const turns: QATurn[] = [];
  let currentInterviewerMsg: ChatMessage | null = null;

  messages.forEach((msg) => {
    if (msg.sender === 'interviewer') {
      currentInterviewerMsg = msg;
    } else if (msg.sender === 'candidate' && currentInterviewerMsg) {
      turns.push({
        day: currentInterviewerMsg.day || 7,
        dayTitle: currentInterviewerMsg.dayTitle || 'Curriculum Probe',
        question: currentInterviewerMsg.text,
        answer: msg.text,
        isFollowup: currentInterviewerMsg.isFollowup,
      });
      currentInterviewerMsg = null;
    }
  });

  const getScoreBadge = (day: number) => {
    const ts = topicScores.find((t) => t.day === day);
    if (!ts) return null;

    if (ts.score >= 75) {
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          Strong ({ts.score}%)
        </span>
      );
    } else if (ts.score >= 45) {
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
          Moderate ({ts.score}%)
        </span>
      );
    } else {
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
          Needs Growth ({ts.score}%)
        </span>
      );
    }
  };

  if (turns.length === 0) {
    return null;
  }

  return (
    <div className="glass-card rounded-2xl p-6 border border-[var(--glass-card-border)] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary-400 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Probed Q&A Transcript Timeline ({turns.length} Turns)
        </h3>
        <span className="text-[11px] text-[var(--text-muted)]">Click any topic to expand transcript</span>
      </div>

      <div className="space-y-3">
        {turns.map((turn, index) => {
          const isOpen = openDay === index;
          return (
            <div
              key={index}
              className="border border-[var(--glass-border)] rounded-xl overflow-hidden glass-card transition-all"
            >
              <button
                onClick={() => setOpenDay(isOpen ? null : index)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg gradient-brand text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {turn.day}
                  </span>
                  <div>
                    <span className="font-semibold text-sm text-[var(--text-primary)] block">
                      Day {turn.day}: {turn.dayTitle}
                    </span>
                    {turn.isFollowup && (
                      <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider">
                        Deep Dive Follow-Up
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getScoreBadge(turn.day)}
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="px-4 pb-4 pt-2 border-t border-[var(--glass-border)] space-y-3"
                  >
                    {/* Question */}
                    <div className="flex items-start gap-2.5 bg-white/5 rounded-xl p-3">
                      <Bot className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-primary-400 mb-1">
                          Interviewer Question
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{turn.question}</p>
                      </div>
                    </div>

                    {/* Answer */}
                    <div className="flex items-start gap-2.5 bg-white/5 rounded-xl p-3">
                      <User className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-1">
                          Candidate Answer
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-mono whitespace-pre-wrap">
                          {turn.answer}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
