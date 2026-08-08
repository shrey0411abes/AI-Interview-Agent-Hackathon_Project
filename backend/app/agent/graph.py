import os
import json
from typing import Dict, Any, List, Optional, Set
from dataclasses import dataclass, field
from app.models.schemas import CandidateProfile, FeedbackData, InterviewResponse
from app.retrieval.vector_store import vector_store
from app.agent.llm import llm_client
from app.feedback.generator import feedback_engine

# High-value curriculum days for initial distribution if candidate profile is default
PRIORITY_CURRICULUM_DAYS = [7, 10, 12, 16, 22, 23, 28, 31]


@dataclass
class InterviewState:
    session_id: str
    candidate: Optional[Dict[str, Any]] = None
    question_count: int = 0
    days_probed: Set[int] = field(default_factory=set)
    history: List[Dict[str, Any]] = field(default_factory=list)
    current_day: int = 7
    current_day_title: str = "Embeddings Explained"
    current_question: str = ""
    is_followup: bool = False
    topic_followup_count: int = 0
    is_done: bool = False
    feedback: Optional[FeedbackData] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "question_count": self.question_count,
            "days_probed": list(self.days_probed),
            "current_day": self.current_day,
            "current_day_title": self.current_day_title,
            "is_followup": self.is_followup,
            "is_done": self.is_done,
            "turn_count": len(self.history)
        }


class InterviewAgentGraph:
    """
    LangGraph-inspired interview state machine orchestrating adaptive candidate probing,
    grounding via Chroma vector store, answer evaluation, and structured feedback generation.
    Stores session state in an in-memory dictionary.
    """

    def __init__(self):
        # In-memory session store (no external database required)
        self.sessions: Dict[str, InterviewState] = {}

    def get_or_create_session(self, session_id: str, candidate_data: Optional[Dict[str, Any]] = None) -> InterviewState:
        if session_id not in self.sessions:
            state = InterviewState(session_id=session_id)
            if candidate_data:
                state.candidate = candidate_data
            self.sessions[session_id] = state
        elif candidate_data and not self.sessions[session_id].candidate:
            self.sessions[session_id].candidate = candidate_data
        
        return self.sessions[session_id]

    def _select_next_curriculum_day(self, state: InterviewState) -> int:
        """Selects target curriculum day based on candidate's weak/skipped missions and probed history."""
        cand_missions = []
        if state.candidate and "missions" in state.candidate:
            cand_missions = state.candidate["missions"]

        # Find skipped or multi-attempt missions not yet probed
        priority_targets = []
        for m in cand_missions:
            day = m.get("day")
            if day and day not in state.days_probed:
                if m.get("skipped") or m.get("attempts", 1) > 2:
                    priority_targets.append(day)

        if priority_targets:
            return priority_targets[0]

        # Fallback to predefined priority days not yet probed
        for day in PRIORITY_CURRICULUM_DAYS:
            if day not in state.days_probed:
                return day

        # Final fallback: pick next day 1..31 not probed
        for day in range(1, 32):
            if day not in state.days_probed:
                return day

        return (state.current_day % 31) + 1

    async def process_turn(self, session_id: str, message: Optional[str] = None, candidate_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process a single turn of the interview state machine.
        Returns payload containing reply text, done flag, progress state, and optional feedback.
        """
        state = self.get_or_create_session(session_id, candidate_data)

        if state.is_done:
            return {
                "reply": "The interview has already concluded. Thank you!",
                "done": True,
                "feedback": state.feedback.model_dump() if state.feedback else None,
                "currentQuestionIndex": state.question_count,
                "daysProbedCount": len(state.days_probed),
                "currentDay": state.current_day,
                "currentDayTitle": state.current_day_title,
                "isFollowup": state.is_followup
            }

        # -----------------------------------------------------------------
        # STEP 1: If user provided an answer to the previous question
        # -----------------------------------------------------------------
        if message and state.current_question:
            # Record candidate's answer into history
            state.history.append({
                "question_index": state.question_count,
                "day": state.current_day,
                "day_title": state.current_day_title,
                "question": state.current_question,
                "answer": message,
                "is_followup": state.is_followup
            })

            # Check if end condition is reached (at least 8 questions AND at least 4 distinct days)
            if state.question_count >= 8 and len(state.days_probed) >= 4:
                state.is_done = True
                feedback = await feedback_engine.generate(
                    candidate=state.candidate or {"member": {"name": "Candidate", "jobRole": "Software Engineer"}},
                    history=state.history,
                    days_probed=list(state.days_probed)
                )
                state.feedback = feedback

                return {
                    "reply": "Thank you for completing all interview rounds! Here is your detailed technical evaluation.",
                    "done": True,
                    "feedback": feedback.model_dump(),
                    "currentQuestionIndex": state.question_count,
                    "daysProbedCount": len(state.days_probed),
                    "currentDay": state.current_day,
                    "currentDayTitle": state.current_day_title,
                    "isFollowup": False
                }

        # -----------------------------------------------------------------
        # STEP 2: Generate next question (Follow-up vs New Topic)
        # -----------------------------------------------------------------
        state.question_count += 1
        
        # Decide if this should be a follow-up digging deeper into the candidate's last answer
        should_followup = (
            message is not None and
            len(state.history) > 0 and
            not state.is_followup and
            state.topic_followup_count < 1 and
            len(message.split()) > 4  # Meaningful answer provided
        )

        if should_followup:
            state.is_followup = True
            state.topic_followup_count += 1
            last_turn = state.history[-1]
            
            # Grounding context from Chroma for current day
            grounding_docs = vector_store.search_curriculum(f"Day {state.current_day} {state.current_day_title}")
            doc_context = grounding_docs[0]["content"] if grounding_docs else ""

            system_prompt = (
                "You are an expert AI interviewer.\n"
                "Formulate a precise follow-up question that directly references the candidate's actual answer.\n"
                "DO NOT use generic phrases like 'tell me more'. Probe specific technical mechanisms or trade-offs.\n"
                f"Curriculum Grounding:\n{doc_context}"
            )
            user_prompt = (
                f"Current Topic: Day {state.current_day} ({state.current_day_title})\n"
                f"Previous Question: {last_turn['question']}\n"
                f"Candidate's Answer: {last_turn['answer']}\n"
                "Ask a probing technical follow-up question."
            )

            question_text = await llm_client.generate_response(system_prompt, user_prompt)
        else:
            # Pivot to a new curriculum topic
            state.is_followup = False
            state.topic_followup_count = 0
            
            next_day_num = self._select_next_curriculum_day(state)
            day_info = vector_store.get_day(next_day_num) or {"day": next_day_num, "title": f"Day {next_day_num} Topic"}
            
            state.current_day = next_day_num
            state.current_day_title = day_info.get("title", f"Day {next_day_num} Topic")
            state.days_probed.add(next_day_num)

            # Grounding context from Chroma
            grounding_docs = vector_store.search_curriculum(f"Day {next_day_num} {state.current_day_title}")
            doc_context = grounding_docs[0]["content"] if grounding_docs else ""

            cand_name = state.candidate.get("member", {}).get("name", "candidate") if state.candidate else "candidate"
            
            system_prompt = (
                "You are an expert AI interviewer.\n"
                "Formulate an engaging, highly realistic technical interview question grounded in the curriculum.\n"
                f"Curriculum Grounding:\n{doc_context}"
            )
            user_prompt = (
                f"Candidate Name: {cand_name}\n"
                f"Target Topic: Day {state.current_day} ({state.current_day_title})\n"
                f"Tools: {', '.join(day_info.get('tools', []))}\n"
                f"Learning Objectives: {'; '.join(day_info.get('objectives', []))}\n"
                "Ask a clear, practical technical interview question."
            )

            question_text = await llm_client.generate_response(system_prompt, user_prompt)

        state.current_question = question_text.strip()

        # Prefix initial turn with a polite welcome message
        reply_text = state.current_question
        if state.question_count == 1:
            cand_name = state.candidate.get("member", {}).get("name", "there") if state.candidate else "there"
            reply_text = f"Welcome {cand_name}. Let's begin your technical interview.\n\n{state.current_question}"

        return {
            "reply": reply_text,
            "done": False,
            "currentQuestionIndex": state.question_count,
            "daysProbedCount": len(state.days_probed),
            "currentDay": state.current_day,
            "currentDayTitle": state.current_day_title,
            "isFollowup": state.is_followup
        }

    async def process_turn_stream(
        self, session_id: str, message: Optional[str] = None, candidate_data: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        state = self.get_or_create_session(session_id, candidate_data)

        if state.is_done:
            yield {
                "type": "metadata",
                "reply": "The interview has already concluded. Thank you!",
                "done": True,
                "feedback": state.feedback.model_dump() if state.feedback else None,
                "currentQuestionIndex": state.question_count,
                "daysProbedCount": len(state.days_probed),
                "currentDay": state.current_day,
                "currentDayTitle": state.current_day_title,
                "isFollowup": state.is_followup,
            }
            return

        # Phase 1: Evaluating candidate answer (if answer was provided)
        if message and state.current_question:
            yield {
                "type": "phase",
                "stage": "evaluate_answer",
                "label": f"Evaluating response depth & technical keywords ({len(message.split())} words)",
            }

            state.history.append({
                "question_index": state.question_count,
                "day": state.current_day,
                "day_title": state.current_day_title,
                "question": state.current_question,
                "answer": message,
                "is_followup": state.is_followup
            })

            # Check if end condition is reached
            if state.question_count >= 8 and len(state.days_probed) >= 4:
                state.is_done = True
                yield {
                    "type": "phase",
                    "stage": "feedback_eval",
                    "label": "Synthesizing end-of-interview evaluation & topic scores",
                }
                feedback = await feedback_engine.generate(
                    candidate=state.candidate or {"member": {"name": "Candidate", "jobRole": "Software Engineer"}},
                    history=state.history,
                    days_probed=list(state.days_probed)
                )
                state.feedback = feedback

                yield {
                    "type": "metadata",
                    "reply": "Thank you for completing all interview rounds! Here is your detailed technical evaluation.",
                    "done": True,
                    "feedback": feedback.model_dump(),
                    "currentQuestionIndex": state.question_count,
                    "daysProbedCount": len(state.days_probed),
                    "currentDay": state.current_day,
                    "currentDayTitle": state.current_day_title,
                    "isFollowup": False,
                }
                return

        state.question_count += 1

        should_followup = (
            message is not None and
            len(state.history) > 0 and
            not state.is_followup and
            state.topic_followup_count < 1 and
            len(message.split()) > 4
        )

        # Phase 2: LangGraph node transition
        yield {
            "type": "phase",
            "stage": "graph_transition",
            "is_followup": should_followup,
            "label": f"LangGraph transition: {'Deep-Dive Follow-Up' if should_followup else 'New Curriculum Topic'}",
        }

        if should_followup:
            state.is_followup = True
            state.topic_followup_count += 1
            last_turn = state.history[-1]

            # Phase 3: Chroma DB search
            yield {
                "type": "phase",
                "stage": "vector_search",
                "label": f"ChromaDB search for Day {state.current_day}: {state.current_day_title}",
            }
            grounding_docs = vector_store.search_curriculum(f"Day {state.current_day} {state.current_day_title}")
            doc_context = grounding_docs[0]["content"] if grounding_docs else ""

            system_prompt = (
                "You are an expert AI interviewer.\n"
                "Formulate a precise follow-up question that directly references the candidate's actual answer.\n"
                "DO NOT use generic phrases like 'tell me more'. Probe specific technical mechanisms or trade-offs.\n"
                f"Curriculum Grounding:\n{doc_context}"
            )
            user_prompt = (
                f"Current Topic: Day {state.current_day} ({state.current_day_title})\n"
                f"Previous Question: {last_turn['question']}\n"
                f"Candidate's Answer: {last_turn['answer']}\n"
                "Ask a probing technical follow-up question."
            )
        else:
            state.is_followup = False
            state.topic_followup_count = 0

            next_day_num = self._select_next_curriculum_day(state)
            day_info = vector_store.get_day(next_day_num) or {"day": next_day_num, "title": f"Day {next_day_num} Topic"}

            state.current_day = next_day_num
            state.current_day_title = day_info.get("title", f"Day {next_day_num} Topic")
            state.days_probed.add(next_day_num)

            # Phase 3: Chroma DB search
            yield {
                "type": "phase",
                "stage": "vector_search",
                "label": f"ChromaDB search for Day {state.current_day}: {state.current_day_title}",
            }
            grounding_docs = vector_store.search_curriculum(f"Day {next_day_num} {state.current_day_title}")
            doc_context = grounding_docs[0]["content"] if grounding_docs else ""

            cand_name = state.candidate.get("member", {}).get("name", "candidate") if state.candidate else "candidate"

            system_prompt = (
                "You are an expert AI interviewer.\n"
                "Formulate an engaging, highly realistic technical interview question grounded in the curriculum.\n"
                f"Curriculum Grounding:\n{doc_context}"
            )
            user_prompt = (
                f"Candidate Name: {cand_name}\n"
                f"Target Topic: Day {state.current_day} ({state.current_day_title})\n"
                f"Tools: {', '.join(day_info.get('tools', []))}\n"
                f"Learning Objectives: {'; '.join(day_info.get('objectives', []))}\n"
                "Ask a clear, practical technical interview question."
            )

        # Phase 4: Question synthesis
        provider = llm_client.provider
        is_real_llm = provider in {"gemini", "openai"} and bool(llm_client.gemini_key if provider == "gemini" else llm_client.openai_key)
        synth_label = (
            f"Synthesizing scenario question via {provider.upper()} LLM"
            if is_real_llm
            else "Using local intelligent fallback generator"
        )
        yield {
            "type": "phase",
            "stage": "llm_synthesis",
            "provider": provider if is_real_llm else "fallback",
            "label": synth_label,
        }

        question_text = await llm_client.generate_response(system_prompt, user_prompt)
        state.current_question = question_text.strip()

        reply_text = state.current_question
        if state.question_count == 1:
            cand_name = state.candidate.get("member", {}).get("name", "there") if state.candidate else "there"
            reply_text = f"Welcome {cand_name}. Let's begin your technical interview.\n\n{state.current_question}"

        # Yield streaming token chunks
        words = reply_text.split(" ")
        for i, word in enumerate(words):
            chunk = word if i == 0 else " " + word
            yield {"type": "token", "token": chunk}

        yield {
            "type": "metadata",
            "reply": reply_text,
            "done": False,
            "currentQuestionIndex": state.question_count,
            "daysProbedCount": len(state.days_probed),
            "currentDay": state.current_day,
            "currentDayTitle": state.current_day_title,
            "isFollowup": state.is_followup,
        }


# Global singleton instance
agent_graph = InterviewAgentGraph()
