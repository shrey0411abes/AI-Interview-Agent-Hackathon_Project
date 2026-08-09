import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bot, Zap, BookOpen, BarChart3, ChevronRight,
  Sparkles, Brain, Target, Shield
} from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import candidateData from '../data/candidates.json';
import { Candidate } from '../lib/types';
import { useInterviewStore } from '../lib/store';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';

// ── Staggered animation helpers ────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

// ── Feature card data ──────────────────────────────────────────────────
const features = [
  {
    icon: <Brain className="w-6 h-6" />,
    color: 'from-primary-500 to-accent-purple',
    title: 'Adaptive Intelligence',
    desc: 'Questions dynamically adjust based on candidate responses, creating a natural interview flow rather than a rigid script.',
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    color: 'from-accent-cyan to-primary-500',
    title: 'Curriculum-Aware',
    desc: 'Retrieves relevant content from the candidate\'s actual learning history via semantic search to probe genuine understanding.',
  },
  {
    icon: <Target className="w-6 h-6" />,
    color: 'from-accent-purple to-accent-rose',
    title: 'Precision Probing',
    desc: 'Uses a LangGraph state machine to navigate between new concepts and follow-up questions with structured intent.',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'from-accent-amber to-accent-rose',
    title: 'Deep Feedback',
    desc: 'Generates structured, heuristic-backed hiring recommendations with per-topic breakdown and confidence scores.',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    color: 'from-accent-emerald to-accent-cyan',
    title: 'Real-Time Streaming',
    desc: 'Responses stream word-by-word via SSE for an authentic conversational feel — no waiting for full answers.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    color: 'from-accent-rose to-accent-amber',
    title: 'Graceful Fallbacks',
    desc: 'Keyword search fallback for ChromaDB, heuristic feedback when LLM is unavailable — robust by design.',
  },
];

// ── Stats ──────────────────────────────────────────────────────────────
const stats = [
  { value: '5–10', label: 'Interview questions' },
  { value: '3+', label: 'Topics covered' },
  { value: '~8 min', label: 'Avg. session time' },
  { value: '100%', label: 'Test pass rate' },
];

// ── Candidate Card ─────────────────────────────────────────────────────
const CandidateCard: React.FC<{
  candidate: Candidate;
  index: number;
  onSelect: () => void;
}> = ({ candidate, index, onSelect }) => {
  const initials = candidate.member.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

  const accuracy =
    candidate.signals.missionsCompleted > 0
      ? Math.round((candidate.signals.missionsFirstTry / candidate.signals.missionsCompleted) * 100)
      : 0;

  const gradients = [
    'from-primary-500 to-accent-purple',
    'from-accent-cyan to-primary-500',
    'from-accent-purple to-accent-rose',
    'from-accent-amber to-accent-rose',
  ];

  return (
    <motion.button
      variants={fadeUp}
      custom={index * 0.5}
      onClick={onSelect}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card rounded-2xl p-5 text-left w-full group hover:border-primary-500/40
                 border border-transparent transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradients[index % gradients.length]}
                        flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{candidate.member.name}</p>
          <p className="text-xs text-[var(--text-muted)] truncate">{candidate.member.jobRole}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { val: candidate.signals.missionsCompleted, label: 'Missions' },
          { val: candidate.signals.commitDays, label: 'Commit days' },
          { val: `${accuracy}%`, label: 'First-try' },
        ].map(({ val, label }) => (
          <div key={label} className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-[var(--text-primary)]">{val}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">{candidate.member.yearsExperience}y exp</span>
        <span className="text-xs text-primary-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Start interview <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </motion.button>
  );
};

// ── Main Component ─────────────────────────────────────────────────────
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCandidate } = useInterviewStore();
  const candidates = (candidateData.candidates as Candidate[]).slice(0, 4);

  const handleCandidateSelect = (candidate: Candidate) => {
    setCandidate(candidate);
    navigate('/dashboard');
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background blobs */}
      <div className="blob blob-1 w-96 h-96 top-0 -left-32" />
      <div className="blob blob-2 w-80 h-80 top-1/3 right-0" />
      <div className="blob blob-3 w-64 h-64 bottom-1/4 left-1/4" />

      {/* Minimal navbar for landing */}
      <header className="fixed top-0 inset-x-0 z-50 glass border-b border-[var(--glass-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-sm text-[var(--text-primary)]">
              AI Interview Agent
            </span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary-500/20 text-primary-300 border border-primary-500/20">
              BETA
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="pt-14">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative px-4 sm:px-6 pt-24 pb-20 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary-500/30
                       text-xs font-medium text-primary-300 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Google Gemini + LangGraph
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6"
          >
            Interviews that
            <br />
            <span className="gradient-text">actually probe</span>
            <br />
            real understanding
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="max-w-2xl mx-auto text-[var(--text-secondary)] text-lg sm:text-xl leading-relaxed mb-10"
          >
            An AI agent that conducts adaptive technical interviews grounded in a candidate's
            actual learning history — not generic questions from a template.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="gradient-brand text-white px-8 py-3.5 rounded-xl font-semibold text-sm
                         shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40
                         hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Start an Interview
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="glass px-8 py-3.5 rounded-xl font-semibold text-sm text-[var(--text-primary)]
                         hover:scale-105 transition-all duration-200"
            >
              View on GitHub
            </a>
            </motion.div>
            </section>
        {/* ── Stats bar ────────────────────────────────────── */}
        <section className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6"
          >
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-heading text-3xl font-bold gradient-text">
                  <AnimatedNumber value={value} />
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── Features ─────────────────────────────────────── */}
        <section className="px-4 sm:px-6 py-16 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3">
              Built for <span className="gradient-text">depth</span>
            </h2>
            <p className="text-[var(--text-muted)] max-w-xl mx-auto">
              Every component designed to surface genuine knowledge, not surface-level recall.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="glass-card rounded-2xl p-6 group hover:border-primary-500/30 border
                           border-transparent transition-colors duration-300"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feat.color}
                                flex items-center justify-center text-white mb-4
                                group-hover:scale-110 transition-transform duration-300`}>
                  {feat.icon}
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{feat.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Candidate Picker ─────────────────────────────── */}
        <section className="px-4 sm:px-6 py-16 max-w-7xl mx-auto" id="candidates">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3">
              Pick a candidate <span className="gradient-text">to interview</span>
            </h2>
            <p className="text-[var(--text-muted)] max-w-xl mx-auto">
              Each candidate has a unique learning history. The AI will adapt its questions accordingly.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {candidates.map((c, i) => (
              <CandidateCard
                key={c.member.id}
                candidate={c}
                index={i}
                onSelect={() => handleCandidateSelect(c)}
              />
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300
                         font-medium transition-colors"
            >
              See all candidates in dashboard
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </section>

        {/* ── CTA Banner ───────────────────────────────────── */}
        <section className="px-4 sm:px-6 py-20 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 gradient-brand opacity-90" />
            <div className="absolute inset-0 backdrop-blur-sm" />
            <div className="relative p-12 text-center text-white">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-90" />
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
                Ready to see it in action?
              </h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">
                Start an interview session in seconds. No setup required.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-white text-indigo-600 px-8 py-3.5 rounded-xl font-bold text-sm
                           hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                Launch Dashboard
              </button>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="glass border-t border-[var(--glass-border)] py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md gradient-brand flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs text-[var(--text-muted)]">AI Interview Agent — Hackathon 2025</span>
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              Built with React + FastAPI + Google Gemini
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LandingPage;
