import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Play, Search, Users, ChevronRight,
  Zap, CheckCircle, Clock, BarChart3, Briefcase, GraduationCap
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Candidate } from '../lib/types';
import { useInterviewStore } from '../lib/store';
import candidateData from '../data/candidates.json';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

// ── Candidate Card on Dashboard ───────────────────────────────────────
const DashboardCandidateCard: React.FC<{
  candidate: Candidate;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onStart: () => void;
}> = ({ candidate, index, isSelected, onSelect, onStart }) => {
  const initials = candidate.member.name.split(' ').map(w => w[0]).join('').slice(0, 2);
  const signals = candidate.signals ?? { commitDays: 0, missionsCompleted: 0, missionsFirstTry: 0 };
  const accuracy = signals.missionsCompleted > 0
    ? Math.round((signals.missionsFirstTry / signals.missionsCompleted) * 100)
    : 0;

  const gradients = [
    'from-primary-500 to-accent-purple',
    'from-accent-cyan to-primary-500',
    'from-accent-purple to-accent-rose',
    'from-accent-amber to-accent-rose',
    'from-accent-emerald to-accent-cyan',
    'from-accent-rose to-accent-purple',
  ];

  const scoreColor = accuracy >= 80 ? 'text-emerald-400' : accuracy >= 60 ? 'text-amber-400' : 'text-rose-400';

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -3 }}
      className={`glass-card rounded-2xl p-5 border transition-all duration-300 cursor-pointer
                  ${isSelected
                    ? 'border-primary-500/60 shadow-lg shadow-primary-500/20'
                    : 'border-transparent hover:border-primary-500/20'
                  }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradients[index % gradients.length]}
                          flex items-center justify-center text-white font-bold text-sm shadow-lg shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{candidate.member.name}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{candidate.member.jobRole}</p>
          </div>
        </div>
        {isSelected && (
          <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
            <CheckCircle className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-sm font-bold text-[var(--text-primary)]">{signals.missionsCompleted}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Missions</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className="text-sm font-bold text-[var(--text-primary)]">{signals.commitDays}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Days active</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <p className={`text-sm font-bold ${scoreColor}`}>{accuracy}%</p>
          <p className="text-[10px] text-[var(--text-muted)]">1st-try</p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md
                         bg-primary-500/10 text-primary-300 border border-primary-500/20">
          <Briefcase className="w-2.5 h-2.5" />
          {candidate.member.yearsExperience}y exp
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md
                         bg-white/5 text-[var(--text-muted)] border border-white/10">
          <GraduationCap className="w-2.5 h-2.5" />
          {candidate.member.education.split(' ')[0]}
        </span>
      </div>

      {/* Action button */}
      {isSelected && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => { e.stopPropagation(); onStart(); }}
          className="w-full gradient-brand text-white text-xs font-semibold py-2.5 rounded-xl
                     shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40
                     hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Start Interview
        </motion.button>
      )}
    </motion.div>
  );
};

// ── DashboardPage ─────────────────────────────────────────────────────
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCandidate, setCandidate, completedSessions } = useInterviewStore();
  const [searchQuery, setSearchQuery] = useState('');

  const allCandidates = candidateData.candidates as Candidate[];
  const filtered = allCandidates.filter((c) =>
    c.member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.member.jobRole.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStart = () => {
    navigate(`/interview/${selectedCandidate.member.id}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background blobs */}
      <div className="blob blob-1 w-72 h-72 top-24 -left-20 opacity-20" />
      <div className="blob blob-2 w-64 h-64 bottom-0 right-0 opacity-15" />

      <Navbar />

      <main className="pt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm mb-2">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
            <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)] mb-1">
              Select a Candidate
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Choose a candidate to begin an adaptive AI-powered technical interview.
            </p>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
          >
            {[
              { icon: <Users className="w-4 h-4 text-primary-400" />, value: allCandidates.length, label: 'Candidates' },
              { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, value: completedSessions.length, label: 'Sessions done' },
              { icon: <Clock className="w-4 h-4 text-amber-400" />, value: '~8 min', label: 'Avg. session' },
              { icon: <BarChart3 className="w-4 h-4 text-accent-purple" />, value: '5–10', label: 'Questions asked' },
            ].map(({ icon, value, label }) => (
              <div key={label} className="glass-card rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="font-bold text-[var(--text-primary)] text-lg leading-none">{value}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative mb-6"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search candidates by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 glass-card rounded-xl text-sm
                         text-[var(--text-primary)] placeholder-[var(--text-muted)]
                         border border-transparent focus:border-primary-500/50 outline-none transition-colors"
            />
          </motion.div>

          {/* Candidate grid */}
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Users className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
              <p className="text-[var(--text-muted)]">No candidates match your search.</p>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {filtered.map((candidate, i) => (
                  <DashboardCandidateCard
                    key={candidate.member.id}
                    candidate={candidate}
                    index={i}
                    isSelected={selectedCandidate.member.id === candidate.member.id}
                    onSelect={() => setCandidate(candidate)}
                    onStart={handleStart}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Selected candidate CTA (sticky bottom on mobile) */}
          <AnimatePresence>
            {selectedCandidate && (
              <motion.div
                key="start-cta"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 sm:hidden"
              >
                <button
                  onClick={handleStart}
                  className="gradient-brand text-white px-8 py-3.5 rounded-2xl font-semibold text-sm
                             shadow-2xl shadow-indigo-500/40 flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Interview {selectedCandidate.member.name.split(' ')[0]}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completed sessions */}
          {completedSessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12"
            >
              <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Completed Sessions
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedSessions.map((session) => (
                  <button
                    key={session.sessionId}
                    onClick={() => navigate(`/results/${session.sessionId}`)}
                    className="glass-card rounded-xl p-4 text-left hover:border-emerald-500/30 border border-transparent
                               transition-colors group flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-[var(--text-primary)] text-sm">{session.candidate.member.name}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{session.candidate.member.jobRole}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
