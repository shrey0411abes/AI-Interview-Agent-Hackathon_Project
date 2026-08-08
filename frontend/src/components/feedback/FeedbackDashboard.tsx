import React from 'react';
import { Award, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, BarChart2, Check, Sparkles } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Feedback, Candidate } from '../../lib/types';
import { useInterviewStore } from '../../lib/store';

interface FeedbackDashboardProps {
  feedback: Feedback;
  candidate: Candidate;
}

export const FeedbackDashboard: React.FC<FeedbackDashboardProps> = ({ feedback, candidate }) => {
  const { resetInterview } = useInterviewStore();

  // Mock radar chart data derived from probed domains
  const radarData = [
    { subject: 'Embeddings & Vectors', score: 90 },
    { subject: 'RAG & Retrieval', score: 85 },
    { subject: 'Prompting & LLMs', score: 80 },
    { subject: 'LangGraph Agents', score: 88 },
    { subject: 'MCP Protocols', score: 75 },
    { subject: 'Deployment & Observability', score: 82 },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-8 animate-fade-in my-6">
      {/* Top Banner / Readiness Badge */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 shrink-0 border border-indigo-400/40">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100">Technical Interview Assessment</h2>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                HIRE RECOMMENDED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Candidate: <strong className="text-slate-200">{candidate.member.name}</strong> • Role: {candidate.member.jobRole}
            </p>
          </div>
        </div>

        <button
          onClick={resetInterview}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-105"
        >
          <RefreshCw className="w-4 h-4" />
          <span>New Assessment Session</span>
        </button>
      </div>

      {/* Summary Box */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Executive Evaluation Summary
        </h3>
        <p className="text-sm text-slate-200 leading-relaxed font-normal">
          {feedback.summary}
        </p>
      </div>

      {/* Radar Chart & Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recharts Radar Chart */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col items-center">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5 self-start">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            Curriculum Domain Mastery Radar
          </h4>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                <Radar name="Candidate Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strengths List */}
        <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Key Demonstrated Strengths
          </h4>
          <ul className="space-y-2.5">
            {feedback.strengths.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Gaps and Actionable Next Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Technical Gaps */}
        <div className="glass-card rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Identified Technical Gaps
          </h4>
          <ul className="space-y-2.5">
            {feedback.gaps.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actionable Next Steps */}
        <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 bg-indigo-500/5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-indigo-400" />
            Actionable Growth Plan
          </h4>
          <ul className="space-y-2.5">
            {feedback.next.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
