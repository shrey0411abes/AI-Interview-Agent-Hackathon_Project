import { Feedback, TopicScore } from './types';

export type VerdictKey = 'STRONG_HIRE' | 'HIRE' | 'BORDERLINE' | 'NO_HIRE';

export const VERDICT_DISPLAY: Record<
  VerdictKey,
  { label: string; badgeClass: string; iconClass: string }
> = {
  STRONG_HIRE: {
    label: 'Strong Hire',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    iconClass: 'text-emerald-300',
  },
  HIRE: {
    label: 'Hire Recommended',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    iconClass: 'text-emerald-300',
  },
  BORDERLINE: {
    label: 'Needs Improvement',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    iconClass: 'text-amber-300',
  },
  NO_HIRE: {
    label: 'Not Recommended',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
    iconClass: 'text-red-300',
  },
};

export function resolveVerdictDisplay(verdict?: string) {
  const key = (verdict?.toUpperCase().replace(/\s+/g, '_') ?? 'BORDERLINE') as VerdictKey;
  return VERDICT_DISPLAY[key] ?? VERDICT_DISPLAY.BORDERLINE;
}

export function buildRadarData(topicScores?: TopicScore[]) {
  if (!topicScores?.length) return [];
  return topicScores.map((t) => ({
    subject: t.subject,
    score: t.score,
    day: t.day,
  }));
}

export const EMPTY_LIST_MESSAGES: Record<'strengths' | 'gaps' | 'next', string> = {
  strengths: 'No significant strengths demonstrated in this session.',
  gaps: 'No specific knowledge gaps were identified in this session.',
  next: 'No growth plan was generated for this session.',
};

export function hasFeedbackField(feedback: Feedback, field: keyof typeof EMPTY_LIST_MESSAGES) {
  const items = feedback[field];
  return Array.isArray(items) && items.length > 0;
}
