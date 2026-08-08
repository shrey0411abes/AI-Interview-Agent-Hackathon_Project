import { create } from 'zustand';
import { Candidate, ChatMessage, Feedback, InterviewProgress } from './types';
import candidateData from '../data/candidates.json';

interface InterviewStore {
  selectedCandidate: Candidate;
  sessionId: string;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingText: string;
  progress: InterviewProgress;
  feedback: Feedback | null;
  isComplete: boolean;

  setCandidate: (candidate: Candidate) => void;
  setSessionId: (id: string) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  startStreaming: () => void;
  updateStreamingText: (chunk: string) => void;
  finishStreaming: (metadata?: { isFollowup?: boolean; day?: number; dayTitle?: string }) => void;
  updateProgress: (p: Partial<InterviewProgress>) => void;
  setFeedback: (feedback: Feedback) => void;
  resetInterview: () => void;
}

const defaultCandidate: Candidate = (candidateData.candidates[0] as Candidate) || {
  member: {
    id: "CAND-001",
    name: "Sarah Johnson",
    jobRole: "Senior Data Engineer",
    yearsExperience: 9,
    education: "MS Computer Science"
  },
  missions: [],
  signals: { commitDays: 28, missionsCompleted: 30, missionsFirstTry: 20 }
};

export const useInterviewStore = create<InterviewStore>((set, get) => ({
  selectedCandidate: defaultCandidate,
  sessionId: `session-${Date.now()}`,
  messages: [],
  isStreaming: false,
  streamingText: '',
  progress: {
    questionCount: 0,
    daysProbedCount: 0,
    currentDay: 7,
    currentDayTitle: 'Embeddings Explained',
    probedDaysList: [],
    isFollowup: false,
  },
  feedback: null,
  isComplete: false,

  setCandidate: (candidate: Candidate) => {
    set({
      selectedCandidate: candidate,
      sessionId: `session-${Date.now()}`,
      messages: [],
      isStreaming: false,
      streamingText: '',
      feedback: null,
      isComplete: false,
      progress: {
        questionCount: 0,
        daysProbedCount: 0,
        currentDay: 7,
        currentDayTitle: 'Embeddings Explained',
        probedDaysList: [],
        isFollowup: false,
      }
    });
  },

  setSessionId: (id: string) => set({ sessionId: id }),

  addMessage: (msg) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date(),
      ...msg,
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  startStreaming: () => set({ isStreaming: true, streamingText: '' }),

  updateStreamingText: (chunk: string) => {
    set((state) => ({
      streamingText: state.streamingText + chunk,
    }));
  },

  finishStreaming: (metadata) => {
    const text = get().streamingText;
    if (text.trim()) {
      get().addMessage({
        sender: 'interviewer',
        text: text,
        isFollowup: metadata?.isFollowup,
        day: metadata?.day,
        dayTitle: metadata?.dayTitle,
      });
    }
    set({ isStreaming: false, streamingText: '' });
  },

  updateProgress: (p) => {
    set((state) => {
      const updatedDaysList = new Set(state.progress.probedDaysList);
      if (p.currentDay) {
        updatedDaysList.add(p.currentDay);
      }
      return {
        progress: {
          ...state.progress,
          ...p,
          probedDaysList: Array.from(updatedDaysList),
        },
      };
    });
  },

  setFeedback: (feedback: Feedback) => set({ feedback, isComplete: true }),

  resetInterview: () => {
    set({
      sessionId: `session-${Date.now()}`,
      messages: [],
      isStreaming: false,
      streamingText: '',
      feedback: null,
      isComplete: false,
      progress: {
        questionCount: 0,
        daysProbedCount: 0,
        currentDay: 7,
        currentDayTitle: 'Embeddings Explained',
        probedDaysList: [],
        isFollowup: false,
      }
    });
  }
}));
