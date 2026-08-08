import React from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { useInterviewStore } from '../../lib/store';
import candidateData from '../../data/candidates.json';
import { Candidate } from '../../lib/types';

export const CandidateHeader: React.FC = () => {
  const { selectedCandidate, setCandidate, resetInterview } = useInterviewStore();
  const candidatesList = candidateData.candidates as Candidate[];

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = candidatesList.find((c) => c.member.id === e.target.value);
    if (found) setCandidate(found);
  };

  const initials = selectedCandidate.member.name.split(' ').map(w => w[0]).join('').slice(0, 2);

  return (
    <div className="glass-card rounded-xl p-4 border border-[var(--glass-card-border)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl gradient-brand flex items-center justify-center text-white
                          font-bold text-sm shadow-lg shadow-indigo-500/20 shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">{selectedCandidate.member.name}</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                               bg-primary-500/15 text-primary-300 border border-primary-500/25">
                {selectedCandidate.member.jobRole}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {selectedCandidate.member.education} · {selectedCandidate.member.yearsExperience}y exp ·{' '}
              <span className="text-emerald-400 font-medium">
                {selectedCandidate.signals?.missionsCompleted ?? 0} missions
              </span>
            </p>
          </div>
        </div>

        {/* Candidate switcher + reset */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedCandidate.member.id}
              onChange={handleSelectChange}
              className="w-full appearance-none glass-card text-[var(--text-primary)] text-xs rounded-lg px-3 py-2 pr-8
                         border border-[var(--glass-card-border)] hover:border-primary-500/50
                         focus:outline-none focus:border-primary-500/60 transition-colors font-medium
                         bg-transparent"
            >
              {candidatesList.map((cand) => (
                <option
                  key={cand.member.id}
                  value={cand.member.id}
                  className="bg-[var(--bg-surface)] text-[var(--text-primary)]"
                >
                  {cand.member.name} ({cand.member.jobRole})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={resetInterview}
            title="Reset Interview"
            className="p-2 glass-card hover:border-primary-500/30 border border-[var(--glass-card-border)]
                       text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
