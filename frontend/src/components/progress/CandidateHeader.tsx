import React from 'react';
import { User, RefreshCw, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { useInterviewStore } from '../../lib/store';
import candidateData from '../../data/candidates.json';
import { Candidate } from '../../lib/types';

export const CandidateHeader: React.FC = () => {
  const { selectedCandidate, setCandidate, resetInterview, progress } = useInterviewStore();

  const candidatesList = candidateData.candidates as Candidate[];

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = candidatesList.find((c) => c.member.id === e.target.value);
    if (found) {
      setCandidate(found);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 mb-4 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Candidate Profile Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20 border border-indigo-400/30">
            {selectedCandidate.member.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-100">{selectedCandidate.member.name}</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {selectedCandidate.member.jobRole}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedCandidate.member.education} • {selectedCandidate.member.yearsExperience} yrs exp • 
              <span className="text-emerald-400 font-medium ml-1">
                {selectedCandidate.signals?.missionsCompleted || 30}/31 Missions Completed
              </span>
            </p>
          </div>
        </div>

        {/* Candidate Selector Dropdown & Reset */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedCandidate.member.id}
              onChange={handleSelectChange}
              className="w-full appearance-none bg-slate-900/90 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 pr-8 border border-slate-700 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
            >
              {candidatesList.map((cand) => (
                <option key={cand.member.id} value={cand.member.id}>
                  {cand.member.name} ({cand.member.jobRole})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={resetInterview}
            title="Reset Interview Session"
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
