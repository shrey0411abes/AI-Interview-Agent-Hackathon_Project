import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Play, Search, Users, ChevronRight,
  Zap, CheckCircle, Clock, BarChart3, Briefcase, GraduationCap,
  Filter, ArrowUpDown, History, Shield
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
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

type SortKey = 'missions' | 'experience' | 'accuracy';

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
      whileHover={{ y: -4, scale: 1.01 }}
      className={`glass-card rounded-2xl p-5 border transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl
                  ${isSelected
                    ? 'border-primary-500/60 shadow-lg shadow-primary-500/20'
                    : 'border-[var(--glass-card-border)] hover:border-primary-500/30'
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
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('missions');

  const allCandidates = candidateData.candidates as Candidate[];

  // Roles list
  const roles = useMemo(() => {
    const set = new Set<string>();
    allCandidates.forEach((c) => set.add(c.member.jobRole));
    return ['ALL', ...Array.from(set)];
  }, [allCandidates]);

  // Filter & Sort logic
  const filteredAndSorted = useMemo(() => {
    return allCandidates
      .filter((c) => {
        const matchesSearch =
          c.member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.member.jobRole.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || c.member.jobRole === roleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        const aSignals = a.signals ?? { missionsCompleted: 0, missionsFirstTry: 0 };
        const bSignals = b.signals ?? { missionsCompleted: 0, missionsFirstTry: 0 };
        const aAcc = aSignals.missionsCompleted > 0 ? aSignals.missionsFirstTry / aSignals.missionsCompleted : 0;
        const bAcc = bSignals.missionsCompleted > 0 ? bSignals.missionsFirstTry / bSignals.missionsCompleted : 0;

        if (sortBy === 'missions') return bSignals.missionsCompleted - aSignals.missionsCompleted;
        if (sortBy === 'experience') return b.member.yearsExperience - a.member.yearsExperience;
        if (sortBy === 'accuracy') return bAcc - aAcc;
        return 0;
      });
  }, [allCandidates, searchQuery, roleFilter, sortBy]);

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
              Candidate Selection
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Select a candidate co-pilot to trigger an adaptive curriculum-grounded interview.
            </p>
          </motion.div>

          {/* Animated Stat Banner */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
          >
            {[
              { icon: <Users className="w-4 h-4 text-primary-400" />, value: allCandidates.length, label: 'Candidates' },
              { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, value: completedSessions.length, label: 'Sessions done' },
              { icon: <Clock className="w-4 h-4 text-amber-400" />, value: '~8 min', label: 'Avg. session' },
              { icon: <BarChart3 className="w-4 h-4 text-accent-purple" />, value: '5–10', label: 'Questions asked' },
            ].map(({ icon, value, label }, i) => (
              <motion.div
                key={label}
                variants={fadeUp}
                custom={i}
                className="glass-card rounded-xl p-4 flex items-center gap-3 border border-[var(--glass-card-border)] hover:scale-[1.02] transition-transform"
              >
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="font-bold text-[var(--text-primary)] text-lg leading-none">
                    <AnimatedNumber value={value} />
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Controls strip: Search, Role Filter, Sort By */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6"
          >
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search candidate by name or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 glass-card rounded-xl text-xs
                           text-[var(--text-primary)] placeholder-[var(--text-muted)]
                           border border-[var(--glass-card-border)] focus:border-primary-500/50 outline-none transition-colors"
              />
            </div>

            {/* Filter & Sort Dropdowns */}
            <div className="flex items-center gap-3">
              {/* Role filter */}
              <div className="flex items-center gap-1.5 glass-card rounded-xl px-3 py-1.5 border border-[var(--glass-card-border)]">
                <Filter className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent text-[var(--text-primary)] text-xs focus:outline-none cursor-pointer"
                >
                  {roles.map((role) => (
                    <option key={role} value={role} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                      {role === 'ALL' ? 'All Roles' : role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort by */}
              <div className="flex items-center gap-1.5 glass-card rounded-xl px-3 py-1.5 border border-[var(--glass-card-border)]">
                <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="bg-transparent text-[var(--text-primary)] text-xs focus:outline-none cursor-pointer"
                >
                  <option value="missions" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Sort: Missions</option>
                  <option value="experience" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Sort: Experience</option>
                  <option value="accuracy" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Sort: 1st-Try Rate</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Candidate grid */}
          {filteredAndSorted.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 glass rounded-2xl">
              <Users className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
              <p className="text-[var(--text-muted)] text-sm">No candidates match your search or filter criteria.</p>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {filteredAndSorted.map((candidate, i) => (
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

          {/* Recent Sessions History Panel */}
          {completedSessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 glass-card rounded-2xl p-6 border border-[var(--glass-card-border)]"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-400" />
                  Recent Session History ({completedSessions.length})
                </h2>
                <span className="text-xs text-[var(--text-muted)]">In-memory active browser session history</span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {completedSessions.map((session) => (
                  <button
                    key={session.sessionId}
                    onClick={() => navigate(`/results/${session.sessionId}`)}
                    className="glass-card rounded-xl p-3.5 text-left hover:border-emerald-500/40 border border-transparent
                               transition-all group flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[var(--text-primary)] text-xs truncate">
                          {session.candidate.member.name}
                        </p>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {session.feedback.verdict || 'EVAL'}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                        {session.candidate.member.jobRole}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0 transition-colors" />
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
