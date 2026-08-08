import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award, CheckCircle2, AlertTriangle, ArrowRight, RotateCcw,
  BarChart2, Sparkles, Home, LayoutDashboard, TrendingUp,
  Shield, ChevronRight, Printer
} from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip
} from 'recharts';
import { Navbar } from '../components/layout/Navbar';
import { FeedbackListCard } from '../components/feedback/FeedbackListCard';
import { ExpandableTimeline } from '../components/results/ExpandableTimeline';
import { useInterviewStore } from '../lib/store';
import { buildRadarData, resolveVerdictDisplay } from '../lib/feedbackDisplay';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: 'easeOut' },
  }),
};

// ── ResultsPage ───────────────────────────────────────────────────────
export const ResultsPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { completedSessions, resetInterview, selectedCandidate, feedback: currentFeedback, messages } = useInterviewStore();

  // Try completed sessions first, then fall back to in-progress state
  const session = completedSessions.find((s) => s.sessionId === sessionId);
  const candidate = session?.candidate ?? selectedCandidate;
  const feedback = session?.feedback ?? currentFeedback;
  const verdictDisplay = resolveVerdictDisplay(feedback?.verdict);
  const radarData = buildRadarData(feedback?.topic_scores);

  if (!feedback) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="pt-14 flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-12 glass rounded-3xl max-w-md mx-4"
          >
            <Award className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)] opacity-40" />
            <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-2">
              No results yet
            </h2>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              Complete an interview session to see feedback here.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/dashboard" className="gradient-brand text-white px-6 py-3 rounded-xl text-sm font-semibold">
                Go to Dashboard
              </Link>
              <Link to="/" className="glass px-6 py-3 rounded-xl text-sm font-semibold text-[var(--text-primary)]">
                Home
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  const handleNewInterview = () => {
    resetInterview();
    navigate('/dashboard');
  };

  const handleDownloadReport = () => {
    window.print();
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="blob blob-1 w-96 h-96 top-0 -left-32 opacity-10" />
      <div className="blob blob-3 w-64 h-64 bottom-1/4 right-0 opacity-10" />

      <Navbar />

      <main className="pt-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-xs text-[var(--text-muted)] no-print"
          >
            <Link to="/" className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" /> Home
            </Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <Link to="/dashboard" className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className="text-[var(--text-primary)] font-medium">Results</span>
          </motion.nav>

          {/* Hero banner */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/60 to-slate-900 dark:opacity-100" />
            <div className="absolute inset-0 gradient-brand opacity-10" />
            <div className="relative p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600
                                flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 shrink-0">
                  <Award className="w-9 h-9" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h1 className="font-heading text-2xl font-bold text-white">Technical Assessment</h1>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider
                                     px-3 py-1 rounded-full border ${verdictDisplay.badgeClass}`}>
                      <Shield className={`w-3.5 h-3.5 ${verdictDisplay.iconClass}`} />
                      {verdictDisplay.label}
                    </span>
                  </div>
                  <p className="text-sm text-white/70">
                    <span className="font-semibold text-white">{candidate.member.name}</span>
                    {' '}·{' '}
                    {candidate.member.jobRole}
                    {' '}·{' '}
                    <span className="font-mono text-[11px] text-indigo-300 opacity-70">{sessionId?.slice(0, 22)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap no-print">
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 px-4 py-2.5 glass text-white text-xs font-semibold
                             rounded-xl hover:scale-105 transition-all duration-200"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Export
                </button>
                <button
                  onClick={handleNewInterview}
                  className="flex items-center gap-2 px-4 py-2.5 glass text-white text-xs font-semibold
                             rounded-xl hover:scale-105 transition-all duration-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  New Session
                </button>
                <button
                  onClick={() => navigate(`/interview/${candidate.member.id}`)}
                  className="gradient-brand flex items-center gap-2 px-5 py-2.5 text-white text-xs font-semibold
                             rounded-xl shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all duration-200"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Re-interview
                </button>
              </div>
            </div>
          </motion.div>

          {/* Summary box */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="glass-card rounded-2xl p-6 border border-[var(--glass-card-border)]"
          >
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary-400 flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" />
              Executive Evaluation Summary
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feedback.summary}</p>
          </motion.div>

          {/* Radar + Strengths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Radar chart */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="glass-card rounded-2xl p-6 border border-[var(--glass-card-border)]"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary-400" />
                Curriculum Domain Mastery
              </h3>
              <div className="h-60">
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                      <PolarGrid stroke="rgba(148,163,184,0.15)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(148,163,184,0.2)" tick={false} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.35}
                        strokeWidth={2}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--glass-bg)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="h-full flex items-center justify-center text-sm text-[var(--text-muted)] italic">
                    No topic scores available for this session.
                  </p>
                )}
              </div>
            </motion.div>

            {/* Strengths */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
              <FeedbackListCard
                title="Demonstrated Strengths"
                icon={CheckCircle2}
                items={feedback.strengths}
                field="strengths"
                headerClass="text-emerald-400"
                cardClass="border border-emerald-500/20 bg-emerald-500/5"
                bulletClass="bg-emerald-400"
                animationDelay={0.3}
              />
            </motion.div>
          </div>

          {/* Gaps + Next steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
              <FeedbackListCard
                title="Identified Knowledge Gaps"
                icon={AlertTriangle}
                items={feedback.gaps}
                field="gaps"
                headerClass="text-amber-400"
                cardClass="border border-amber-500/20 bg-amber-500/5"
                bulletClass="bg-amber-400"
                animationDelay={0.4}
              />
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}>
              <FeedbackListCard
                title="Actionable Growth Plan"
                icon={ArrowRight}
                items={feedback.next}
                field="next"
                headerClass="text-primary-400"
                cardClass="border border-primary-500/20 bg-primary-500/5"
                bulletClass="bg-primary-400"
                animationDelay={0.5}
              />
            </motion.div>
          </div>

          {/* Q&A Timeline */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5.5}>
            <ExpandableTimeline messages={messages} topicScores={feedback.topic_scores} />
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={6}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pb-12"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-8 py-3.5 glass-card rounded-xl text-sm font-semibold
                         text-[var(--text-primary)] hover:border-primary-500/30 border border-transparent transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Back to Dashboard
            </button>
            <button
              onClick={handleNewInterview}
              className="gradient-brand text-white px-8 py-3.5 rounded-xl font-semibold text-sm
                         shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Start New Interview
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ResultsPage;
