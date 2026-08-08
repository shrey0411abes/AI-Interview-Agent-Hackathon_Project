import React from 'react';

export const CandidateCardSkeleton: React.FC = () => (
  <div className="glass-card rounded-2xl p-5 border border-transparent animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-11 h-11 rounded-xl bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2 mb-4">
      <div className="h-10 bg-white/5 rounded-lg" />
      <div className="h-10 bg-white/5 rounded-lg" />
      <div className="h-10 bg-white/5 rounded-lg" />
    </div>
    <div className="flex gap-2">
      <div className="h-5 bg-white/5 rounded w-16" />
      <div className="h-5 bg-white/5 rounded w-20" />
    </div>
  </div>
);

export const ResultsSkeleton: React.FC = () => (
  <div className="max-w-5xl mx-auto space-y-6 animate-pulse p-4">
    <div className="h-32 rounded-3xl bg-white/10" />
    <div className="h-24 rounded-2xl bg-white/5" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="h-64 rounded-2xl bg-white/5" />
      <div className="h-64 rounded-2xl bg-white/5" />
    </div>
  </div>
);
