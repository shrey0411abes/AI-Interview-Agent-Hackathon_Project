from typing import List, Optional, Dict, Any
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field


class CandidateMember(BaseModel):
    id: str
    name: str
    jobRole: str
    yearsExperience: int
    education: str
    status: Optional[str] = "COMPLETED"


class Mission(BaseModel):
    day: int
    title: str
    passed: Optional[bool] = True
    skipped: Optional[bool] = False
    attempts: Optional[int] = 1


class CandidateSignals(BaseModel):
    commitDays: int
    missionsCompleted: int
    missionsFirstTry: int


class CandidateProfile(BaseModel):
    member: CandidateMember
    missions: List[Mission] = []
    signals: Optional[CandidateSignals] = None


class InterviewRequest(BaseModel):
    sessionId: str = Field(..., description="Unique session identifier for tracking interview state")
    candidate: Optional[CandidateProfile] = Field(None, description="Candidate profile provided on initial request")
    message: Optional[str] = Field(None, description="Candidate answer provided on subsequent turns")
    requestId: Optional[str] = Field(None, description="Unique client-side request ID for turn idempotency")



class TopicScore(BaseModel):
    day: int = Field(..., description="Curriculum day number probed during the interview")
    subject: str = Field(..., description="Human-readable topic label for the radar chart axis")
    score: int = Field(..., ge=0, le=100, description="Mastery score from 0-100 for this topic")


class FeedbackData(BaseModel):
    summary: str = Field(..., description="Overall summary of the candidate's interview performance")
    strengths: List[str] = Field(..., description="List of technical strengths demonstrated")
    gaps: List[str] = Field(..., description="List of technical gaps or areas needing improvement")
    next: List[str] = Field(..., description="Actionable next steps for technical growth")
    verdict: str = Field(
        ...,
        description="Hiring recommendation: STRONG_HIRE, HIRE, BORDERLINE, or NO_HIRE",
    )
    topic_scores: List[TopicScore] = Field(
        ...,
        description="Per-topic mastery scores aligned with probed curriculum days",
    )


class InterviewResponse(BaseModel):
    reply: str = Field(..., description="Interviewer response or feedback message")
    done: bool = Field(False, description="Whether the interview is complete")
    feedback: Optional[FeedbackData] = Field(None, description="End-of-interview feedback object")
    
    # Progress & visual cue metadata for UI tracking
    currentQuestionIndex: Optional[int] = Field(None, description="Current question index (1..8+)")
    daysProbedCount: Optional[int] = Field(None, description="Number of distinct curriculum days probed so far")
    currentDay: Optional[int] = Field(None, description="Curriculum day topic currently being probed")
    currentDayTitle: Optional[str] = Field(None, description="Title of current curriculum day topic")
    isFollowup: Optional[bool] = Field(False, description="Whether the question is a follow-up digging deeper")


class CurriculumDay(BaseModel):
    day: int
    title: str
    type: str
    tools: List[str]
    objectives: List[str]


class QATurn(BaseModel):
    question_index: int
    day: int
    day_title: str
    question: str
    answer: Optional[str] = None
    is_followup: bool = False
    evaluation: Optional[str] = None
