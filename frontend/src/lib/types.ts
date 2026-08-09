export interface CandidateMember {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
  status?: string;
}

export interface Mission {
  day: number;
  title: string;
  passed?: boolean;
  skipped?: boolean;
  attempts?: number;
}

export interface CandidateSignals {
  commitDays: number;
  missionsCompleted: number;
  missionsFirstTry: number;
}

export interface Candidate {
  member: CandidateMember;
  missions: Mission[];
  signals?: CandidateSignals;
}

export interface TopicScore {
  day: number;
  subject: string;
  score: number;
}

export interface Feedback {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
  verdict: string;
  topic_scores: TopicScore[];
}

export interface ChatMessage {
  id: string;
  sender: 'interviewer' | 'candidate';
  text: string;
  timestamp: Date;
  isFollowup?: boolean;
  day?: number;
  dayTitle?: string;
  requestId?: string;
}

export interface InterviewProgress {
  questionCount: number;
  daysProbedCount: number;
  currentDay: number;
  currentDayTitle: string;
  probedDaysList: number[];
  isFollowup: boolean;
}
