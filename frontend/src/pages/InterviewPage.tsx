import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bot } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { ChatContainer } from '../components/chat/ChatContainer';
import { ProgressSidebar } from '../components/progress/ProgressSidebar';
import { FeedbackDashboard } from '../components/feedback/FeedbackDashboard';
import { CandidateHeader } from '../components/progress/CandidateHeader';
import { useInterviewStore } from '../lib/store';
import candidateData from '../data/candidates.json';
import { Candidate } from '../lib/types';

export const InterviewPage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const { isComplete, feedback, selectedCandidate, setCandidate, sessionId } = useInterviewStore();

  // Sync candidate from URL param on first load / direct navigation
  useEffect(() => {
    if (!candidateId) return;
    const found = (candidateData.candidates as Candidate[]).find(
      (c) => c.member.id === candidateId
    );
    if (found && found.member.id !== selectedCandidate.member.id) {
      setCandidate(found);
    }
  }, [candidateId]); // eslint-disable-line

  // Redirect to results page when interview completes
  useEffect(() => {
    if (isComplete && feedback) {
      // Small delay so the user sees the completion message
      const timer = setTimeout(() => {
        navigate(`/results/${sessionId}`);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [isComplete, feedback, navigate, sessionId]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Subtle background blobs */}
      <div className="blob blob-1 w-80 h-80 top-1/4 -left-32 opacity-10" />
      <div className="blob blob-2 w-64 h-64 bottom-0 right-0 opacity-10" />

      <Navbar />

      <main className="pt-14 h-[100dvh]">
        <div className="h-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-4 shrink-0"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]
                         transition-colors glass-card px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </button>

            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <div className="w-1 h-1 rounded-full bg-[var(--text-muted)] opacity-50" />
              <Bot className="w-3.5 h-3.5 text-primary-400" />
              <span className="text-[var(--text-primary)] font-medium">
                {selectedCandidate.member.name}
              </span>
            </div>

            {/* Live indicator */}
            <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:block font-medium">Session Live</span>
            </div>
          </motion.div>

          {/* Main content grid — fills remaining height */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0"
          >
            {/* Chat column */}
            <div className="lg:col-span-8 flex flex-col min-h-0">
              <CandidateHeader />
              <div className="flex-1 min-h-0 mt-3">
                <AnimatePresence mode="wait">
                  {isComplete && feedback ? (
                    <motion.div
                      key="feedback"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-full overflow-y-auto pr-1"
                    >
                      <FeedbackDashboard feedback={feedback} candidate={selectedCandidate} />
                    </motion.div>
                  ) : (
                    <motion.div key="chat" className="h-full">
                      <ChatContainer />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Sidebar */}
            <div className="hidden lg:flex lg:col-span-4 flex-col">
              <ProgressSidebar />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default InterviewPage;
