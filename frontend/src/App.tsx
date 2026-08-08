import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Bot, Sparkles, Code2, Terminal } from 'lucide-react';
import { CandidateHeader } from './components/progress/CandidateHeader';
import { ProgressSidebar } from './components/progress/ProgressSidebar';
import { ChatContainer } from './components/chat/ChatContainer';
import { FeedbackDashboard } from './components/feedback/FeedbackDashboard';
import { useInterviewStore } from './lib/store';

const queryClient = new QueryClient();

const MainLayout: React.FC = () => {
  const { isComplete, feedback, selectedCandidate } = useInterviewStore();

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Application Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center text-indigo-400">
                <Bot className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-slate-100 flex items-center gap-2">
                <span>AI Interview Agent</span>
                <span className="text-[10px] font-extrabold font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Vite + React + LangGraph
                </span>
              </h1>
              <p className="text-xs text-slate-400">Adaptive Enterprise AI Technical Assessment Platform</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card border border-slate-800">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chroma RAG Grounded</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card border border-slate-800">
              <Code2 className="w-3.5 h-3.5 text-purple-400" />
              <span>31-Day Cohort Curriculum</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col h-[calc(100vh-7rem)]">
          <CandidateHeader />

          <div className="flex-1 overflow-hidden">
            {isComplete && feedback ? (
              <div className="h-full overflow-y-auto pr-1">
                <FeedbackDashboard feedback={feedback} candidate={selectedCandidate} />
              </div>
            ) : (
              <ChatContainer />
            )}
          </div>
        </div>

        {/* Right Progress & Reasoning Sidebar */}
        <div className="lg:col-span-4 h-[calc(100vh-7rem)]">
          <ProgressSidebar />
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout />
    </QueryClientProvider>
  );
}
