export interface CandidateMember {
  id: str;
  name: str;
  jobRole: str;
  yearsExperience: number;
  education: str;
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

export interface Feedback {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'interviewer' | 'candidate';
  text: string;
  timestamp: Date;
  isFollowup?: boolean;
  day?: number;
  dayTitle?: string;
}

export interface InterviewProgress {
  questionCount: number;
  daysProbedCount: number;
  currentDay: number;
  currentDayTitle: string;
  probedDaysList: number[];
  isFollowup: boolean;
}
