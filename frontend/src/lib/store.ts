import { create } from 'zustand';
import { Candidate, ChatMessage, Feedback, InterviewProgress } from './types';
import candidateData from '../data/candidates.json';

// ── Theme Store ──────────────────────────────────────────────
type Theme = 'dark' | 'light';

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const systemPreference: Theme =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: systemPreference,
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setTheme: (t) => set({ theme: t }),
}));

import { SSEPayload } from './api';

// ── Interview Store ──────────────────────────────────────────
interface InterviewStore {
  selectedCandidate: Candidate;
  sessionId: string;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingText: string;
  thinkingPhases: SSEPayload[];
  progress: InterviewProgress;
  feedback: Feedback | null;
  isComplete: boolean;
  completedSessions: Array<{ sessionId: string; candidate: Candidate; feedback: Feedback }>;

  setCandidate: (candidate: Candidate) => void;
  setSessionId: (id: string) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  startStreaming: () => void;
  addThinkingPhase: (phase: SSEPayload) => void;
  updateStreamingText: (chunk: string) => void;
  finishStreaming: (metadata?: { isFollowup?: boolean; day?: number; dayTitle?: string }) => void;
  updateProgress: (p: Partial<InterviewProgress>) => void;
  setFeedback: (feedback: Feedback) => void;
  resetInterview: () => void;
}

const defaultCandidate: Candidate = (candidateData.candidates[0] as Candidate) || {
  member: { id: 'CAND-001', name: 'Sarah Johnson', jobRole: 'Senior Data Engineer', yearsExperience: 9, education: 'MS Computer Science' },
  missions: [],
  signals: { commitDays: 28, missionsCompleted: 30, missionsFirstTry: 20 },
};

const freshProgress = (): InterviewProgress => ({
  questionCount: 0,
  daysProbedCount: 0,
  currentDay: 7,
  currentDayTitle: 'Embeddings Explained',
  probedDaysList: [],
  isFollowup: false,
});

export const useInterviewStore = create<InterviewStore>((set, get) => ({
  selectedCandidate: defaultCandidate,
  sessionId: `session-${Date.now()}`,
  messages: [],
  isStreaming: false,
  streamingText: '',
  thinkingPhases: [],
  progress: freshProgress(),
  feedback: null,
  isComplete: false,
  completedSessions: [],

  setCandidate: (candidate) =>
    set({
      selectedCandidate: candidate,
      sessionId: `session-${Date.now()}`,
      messages: [],
      isStreaming: false,
      streamingText: '',
      thinkingPhases: [],
      feedback: null,
      isComplete: false,
      progress: freshProgress(),
    }),

  setSessionId: (id) => set({ sessionId: id }),

  addMessage: (msg) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date(),
      ...msg,
    };
    set((s) => ({ messages: [...s.messages, newMessage] }));
  },

  startStreaming: () => set({ isStreaming: true, streamingText: '', thinkingPhases: [] }),

  addThinkingPhase: (phase) =>
    set((s) => ({ thinkingPhases: [...s.thinkingPhases, phase] })),

  updateStreamingText: (chunk) =>
    set((s) => ({ streamingText: s.streamingText + chunk })),

  finishStreaming: (metadata) => {
    const text = get().streamingText;
    if (text.trim()) {
      get().addMessage({
        sender: 'interviewer',
        text,
        isFollowup: metadata?.isFollowup,
        day: metadata?.day,
        dayTitle: metadata?.dayTitle,
      });
    }
    set({ isStreaming: false, streamingText: '', thinkingPhases: [] });
  },

  updateProgress: (p) =>
    set((s) => {
      const days = new Set(s.progress.probedDaysList);
      if (p.currentDay) days.add(p.currentDay);
      return { progress: { ...s.progress, ...p, probedDaysList: Array.from(days) } };
    }),

  setFeedback: (feedback) => {
    const { selectedCandidate, sessionId, completedSessions } = get();
    const already = completedSessions.find((cs) => cs.sessionId === sessionId);
    const updated = already
      ? completedSessions
      : [...completedSessions, { sessionId, candidate: selectedCandidate, feedback }];
    set({ feedback, isComplete: true, completedSessions: updated });
  },

  resetInterview: () =>
    set({
      sessionId: `session-${Date.now()}`,
      messages: [],
      isStreaming: false,
      streamingText: '',
      feedback: null,
      isComplete: false,
      progress: freshProgress(),
    }),
}));
