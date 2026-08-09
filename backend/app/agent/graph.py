import os
import re
import json
from typing import Dict, Any, List, Optional, Set
from dataclasses import dataclass, field
from collections.abc import AsyncGenerator

from app.models.schemas import CandidateProfile, FeedbackData, InterviewResponse
from app.retrieval.vector_store import vector_store
from app.agent.llm import llm_client
from app.feedback.generator import feedback_engine
from app.memory.breeth import breeth_memory

# High-value curriculum days for initial distribution if candidate profile is default
PRIORITY_CURRICULUM_DAYS = [7, 10, 12, 16, 22, 23, 28, 31]
STOPWORDS = {"a", "an", "the", "and", "or", "to", "in", "of", "is", "can", "you", "how", "what", "why", "we", "do", "does", "let", "lets", "us", "your", "my", "on", "for", "with", "about"}


@dataclass
class RequestRecord:
    request_id: str
    session_id: str
    status: str = "processing"  # "processing" | "completed" | "failed"
    metadata: Optional[Dict[str, Any]] = None
    tokens: List[str] = field(default_factory=list)
    phases: List[Dict[str, Any]] = field(default_factory=list)


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

    # Enhanced state fields for adaptive non-repeating interview engine
    asked_questions: List[str] = field(default_factory=list)
    asked_signatures: Set[str] = field(default_factory=set)
    covered_concepts: Set[str] = field(default_factory=set)
    demonstrated_competencies: List[str] = field(default_factory=list)
    misconceptions_observed: List[str] = field(default_factory=list)
    last_evaluation: Optional[Dict[str, Any]] = None
    current_difficulty: str = "intermediate"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "question_count": self.question_count,
            "days_probed": list(self.days_probed),
            "current_day": self.current_day,
            "current_day_title": self.current_day_title,
            "is_followup": self.is_followup,
            "is_done": self.is_done,
            "turn_count": len(self.history),
            "asked_questions_count": len(self.asked_questions),
            "current_difficulty": self.current_difficulty,
        }


class InterviewAgentGraph:
    """
    Production-grade LangGraph state machine orchestrating adaptive candidate probing,
    answer evaluation, Breeth candidate memory integration, Chroma vector search grounding,
    strict question deduplication, and application-level session request replay caching.
    """

    def __init__(self):
        self.sessions: Dict[str, InterviewState] = {}
        # Application-level session request registry: session_id -> { request_id -> RequestRecord }
        self.session_request_registry: Dict[str, Dict[str, RequestRecord]] = {}

    def get_or_create_session(self, session_id: str, candidate_data: Optional[Dict[str, Any]] = None) -> InterviewState:
        if session_id not in self.sessions:
            state = InterviewState(session_id=session_id)
            if candidate_data:
                state.candidate = candidate_data
            self.sessions[session_id] = state
        elif candidate_data and not self.sessions[session_id].candidate:
            self.sessions[session_id].candidate = candidate_data
        
        return self.sessions[session_id]

    def _get_request_record(self, session_id: str, request_id: str) -> Optional[RequestRecord]:
        if session_id in self.session_request_registry:
            return self.session_request_registry[session_id].get(request_id)
        return None

    def _save_request_record(self, session_id: str, record: RequestRecord) -> None:
        if session_id not in self.session_request_registry:
            self.session_request_registry[session_id] = {}
        self.session_request_registry[session_id][record.request_id] = record

    def extract_clean_question_text(self, text: str) -> str:
        """Strips UI prefix labels (e.g. 'Deep Dive Follow-Up:', 'Day 7:', 'Welcome Sarah...') to isolate core question text."""
        clean = text.strip()
        clean = re.sub(r'^Welcome\s+[^.]+\.\s+Let\'s\s+begin\s+your\s+technical\s+interview\.\s*', '', clean, flags=re.IGNORECASE)
        clean = re.sub(r'^(Deep\s+Dive\s+Follow-Up|Day\s+\d+[^:]*|Follow-Up|Question):\s*', '', clean, flags=re.IGNORECASE)
        return clean.strip()

    def _normalize_signature(self, text: str) -> str:
        """Normalized string signature for Level 1 exact duplicate matching."""
        core = self.extract_clean_question_text(text)
        return re.sub(r'[^a-z0-9]', '', core.lower())

    def _is_duplicate_question(self, question: str, state: InterviewState) -> bool:
        """Check if question is exact or semantic duplicate of previously asked questions."""
        sig = self._normalize_signature(question)
        if not sig:
            return False
            
        if sig in state.asked_signatures:
            return True

        core_q = self.extract_clean_question_text(question)
        q_words = set(re.findall(r'\w+', core_q.lower())) - STOPWORDS

        for prev in state.asked_questions:
            prev_sig = self._normalize_signature(prev)
            if sig == prev_sig:
                return True

            prev_core = self.extract_clean_question_text(prev)
            prev_words = set(re.findall(r'\w+', prev_core.lower())) - STOPWORDS

            if len(q_words) > 3 and len(prev_words) > 3:
                jaccard = len(q_words & prev_words) / float(len(q_words | prev_words))
                if jaccard >= 0.55:
                    return True

        return False

    def _generate_deterministic_fallback_question(self, state: InterviewState) -> str:
        """Generates a guaranteed non-duplicate question from curriculum topics if LLM produces duplicates."""
        fallback_pool = [
            ("Embeddings & Geometry", "How do high-dimensional vector embeddings map semantic distance, and why does magnitude skew Euclidean metrics?"),
            ("Vector Search & ANN", "In approximate nearest neighbor search, how does HNSW trade off graph memory footprint for query recall?"),
            ("RAG & Chunking", "When segmenting technical documents for RAG indexing, how do you determine optimal chunk size and overlap?"),
            ("Hybrid Retrieval", "How do you combine sparse BM25 keyword scores with dense vector similarities using Reciprocal Rank Fusion?"),
            ("Prompt Engineering", "What strategies do you use to enforce structured JSON schema outputs from non-deterministic LLM calls?"),
            ("Agentic Workflows", "In stateful multi-agent systems, how do you handle tool execution failures without corrupting persistent state?"),
            ("Model Context Protocol", "How does Model Context Protocol (MCP) isolate tool execution parameters from LLM system prompts?"),
            ("System Evaluation", "What latency and accuracy metrics do you monitor when benchmarking real-time streaming LLM services?"),
        ]
        for topic, q in fallback_pool:
            if not self._is_duplicate_question(q, state):
                return q
        return f"How do you approach error handling and system resilience in AI microservices for round {state.question_count}?"

    def _select_next_curriculum_day(self, state: InterviewState) -> int:
        """Selects target curriculum day based on candidate's weak/skipped missions and probed history."""
        if state.question_count <= 1:
            return state.current_day

        cand_missions = []
        if state.candidate and "missions" in state.candidate:
            cand_missions = state.candidate["missions"]

        priority_targets = []
        for m in cand_missions:
            day = m.get("day")
            if day and day not in state.days_probed:
                if m.get("skipped") or m.get("attempts", 1) > 2:
                    priority_targets.append(day)

        if priority_targets:
            return priority_targets[0]

        for day in PRIORITY_CURRICULUM_DAYS:
            if day not in state.days_probed:
                return day

        for day in range(1, 32):
            if day not in state.days_probed:
                return day

        return (state.current_day % 31) + 1

    async def process_turn(
        self,
        session_id: str,
        message: Optional[str] = None,
        candidate_data: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a single turn of the interview state machine synchronously (JSON response).
        """
        state = self.get_or_create_session(session_id, candidate_data)

        # Application-level request registry idempotency check
        if request_id:
            record = self._get_request_record(session_id, request_id)
            if record and record.status == "completed" and record.metadata:
                print(f"[TURN_REPLAY] request_id={request_id} session={session_id} Replaying cached JSON response (0 Gemini calls).")
                return record.metadata
            elif record and record.status == "processing" and record.metadata:
                print(f"[TURN_DUPLICATE_PROCESSING] request_id={request_id} session={session_id} Duplicate request in-progress.")
                return record.metadata

        if state.is_done:
            res = {
                "reply": "The interview has already concluded. Thank you!",
                "done": True,
                "feedback": state.feedback.model_dump() if state.feedback else None,
                "currentQuestionIndex": state.question_count,
                "daysProbedCount": len(state.days_probed),
                "currentDay": state.current_day,
                "currentDayTitle": state.current_day_title,
                "isFollowup": state.is_followup
            }
            if request_id:
                self._save_request_record(session_id, RequestRecord(request_id=request_id, session_id=session_id, status="completed", metadata=res))
            return res

        req_record = RequestRecord(request_id=request_id, session_id=session_id, status="processing") if request_id else None
        if request_id and req_record:
            self._save_request_record(session_id, req_record)

        try:
            cand_id = state.candidate.get("member", {}).get("id", "CAND-DEFAULT") if state.candidate else "CAND-DEFAULT"

            # Step 1: Real Answer Evaluation & Breeth Memory Store
            if message and state.current_question:
                evaluation = await llm_client.evaluate_answer(
                    question=state.current_question,
                    answer=message,
                    context=state.current_day_title
                )
                state.last_evaluation = evaluation
                print(f"[ANSWER_EVALUATED] quality={evaluation.get('quality')} action={evaluation.get('recommended_action')}")

                breeth_memory.store_observation(
                    candidate_id=cand_id,
                    topic=state.current_day_title,
                    observation_type="important_answer",
                    content=f"Q: {state.current_question} | A: {message[:120]}",
                    metadata=evaluation
                )

                for concept in evaluation.get("concepts_demonstrated", []):
                    state.covered_concepts.add(concept)
                    breeth_memory.store_observation(cand_id, state.current_day_title, "skill", concept)

                for misc in evaluation.get("misconceptions", []):
                    state.misconceptions_observed.append(misc)
                    breeth_memory.store_observation(cand_id, state.current_day_title, "misconception", misc)

                state.history.append({
                    "question_index": state.question_count,
                    "day": state.current_day,
                    "day_title": state.current_day_title,
                    "question": state.current_question,
                    "answer": message,
                    "is_followup": state.is_followup,
                    "evaluation": evaluation
                })

                if state.question_count >= 8 and len(state.days_probed) >= 4:
                    state.is_done = True
                    feedback = await feedback_engine.generate(
                        candidate=state.candidate or {"member": {"name": "Candidate", "jobRole": "Software Engineer"}},
                        history=state.history,
                        days_probed=list(state.days_probed)
                    )
                    state.feedback = feedback
                    res = {
                        "reply": "Thank you for completing all interview rounds! Here is your detailed technical evaluation.",
                        "done": True,
                        "feedback": feedback.model_dump(),
                        "currentQuestionIndex": state.question_count,
                        "daysProbedCount": len(state.days_probed),
                        "currentDay": state.current_day,
                        "currentDayTitle": state.current_day_title,
                        "isFollowup": False
                    }
                    if req_record:
                        req_record.status = "completed"
                        req_record.metadata = res
                    return res

            # Step 2: Generate Next Question with Breeth Memory + Deduplication
            state.question_count += 1
            
            should_followup = (
                message is not None and
                len(state.history) > 0 and
                not state.is_followup and
                state.topic_followup_count < 1 and
                len(message.split()) > 2
            )

            retrieved_memory = breeth_memory.retrieve_relevant_memory(cand_id, state.current_day_title)

            if should_followup:
                state.is_followup = True
                state.topic_followup_count += 1
                last_turn = state.history[-1]

                grounding_docs = vector_store.search_curriculum(f"Day {state.current_day} {state.current_day_title}")
                doc_context = grounding_docs[0]["content"] if grounding_docs else ""

                system_prompt = (
                    "You are a Senior AI Technical Interviewer conducting a live adaptive engineering interview.\n"
                    "CRITICAL CONVERSATIONAL RULES:\n"
                    "1. Ask EXACTLY ONE technical question at a time.\n"
                    "2. React directly and specifically to the candidate's actual answer content without filler praise (NEVER say 'Great answer!', 'That's a solid explanation!', or 'Good question!').\n"
                    "3. Ground your reaction in what the candidate explicitly stated, missing concepts, or misconceptions.\n"
                    "4. Maintain technical topic continuity. Deepen the current subject before switching topics.\n"
                    "5. NEVER repeat an already asked question or near-duplicate paraphrase.\n"
                    "6. Do NOT mention internal systems (LangGraph, Breeth, ChromaDB, Gemini, curriculum day numbers) in candidate-facing dialogue.\n"
                    f"Curriculum Grounding:\n{doc_context}\n"
                    f"Candidate Breeth Memory: {json.dumps(retrieved_memory)}"
                )

                user_prompt = (
                    f"Current Topic: Day {state.current_day} ({state.current_day_title})\n"
                    f"Previous Question: {last_turn['question']}\n"
                    f"Candidate Answer: {last_turn['answer']}\n"
                    f"Evaluation: {json.dumps(state.last_evaluation)}\n"
                    f"Previously Asked Questions: {json.dumps(state.asked_questions)}\n"
                    "Formulate a probing, adaptive technical follow-up question."
                )
            else:
                state.is_followup = False
                state.topic_followup_count = 0
                
                next_day_num = self._select_next_curriculum_day(state)
                day_info = vector_store.get_day(next_day_num) or {"day": next_day_num, "title": f"Day {next_day_num} Topic"}
                
                state.current_day = next_day_num
                state.current_day_title = day_info.get("title", f"Day {next_day_num} Topic")
                state.days_probed.add(next_day_num)

                grounding_docs = vector_store.search_curriculum(f"Day {next_day_num} {state.current_day_title}")
                doc_context = grounding_docs[0]["content"] if grounding_docs else ""

                cand_name = state.candidate.get("member", {}).get("name", "Candidate") if state.candidate else "Candidate"
                
                system_prompt = (
                    "You are a Senior AI Technical Interviewer conducting a live adaptive engineering interview.\n"
                    "CRITICAL CONVERSATIONAL RULES:\n"
                    "1. Ask EXACTLY ONE technical question at a time.\n"
                    "2. React directly and specifically to the candidate's actual answer content without filler praise (NEVER say 'Great answer!', 'That's a solid explanation!', or 'Good question!').\n"
                    "3. Ground your reaction in what the candidate explicitly stated, missing concepts, or misconceptions.\n"
                    "4. Maintain technical topic continuity. Deepen the current subject before switching topics.\n"
                    "5. NEVER repeat an already asked question or near-duplicate paraphrase.\n"
                    "6. Do NOT mention internal systems (LangGraph, Breeth, ChromaDB, Gemini, curriculum day numbers) in candidate-facing dialogue.\n"
                    f"Curriculum Grounding:\n{doc_context}\n"
                    f"Candidate Breeth Memory: {json.dumps(retrieved_memory)}"
                )

                user_prompt = (
                    f"Candidate Name: {cand_name}\n"
                    f"Target Topic: Day {state.current_day} ({state.current_day_title})\n"
                    f"Difficulty: {state.current_difficulty}\n"
                    f"Previously Asked Questions: {json.dumps(state.asked_questions)}\n"
                    "Ask a clear, practical technical interview question."
                )

            question_text = ""
            attempts = 0
            while attempts < 3:
                candidate_q = await llm_client.generate_response(system_prompt, user_prompt)
                clean_cand = self.extract_clean_question_text(candidate_q)
                cand_sig = self._normalize_signature(clean_cand)
                
                print(f"[QUESTION_CANDIDATE] session={session_id} day={state.current_day} turn={state.question_count} attempt={attempts+1} sig={cand_sig[:30]}")

                if not self._is_duplicate_question(clean_cand, state):
                    question_text = clean_cand
                    print(f"[QUESTION_ACCEPTED] session={session_id} turn={state.question_count} text='{question_text[:60]}...'")
                    break

                print(f"[QUESTION_DUPLICATE_REJECTED] session={session_id} day={state.current_day} turn={state.question_count} attempt={attempts+1} sig={cand_sig[:30]} text='{clean_cand[:60]}...'")
                user_prompt += f"\nCRITICAL: Question '{clean_cand[:50]}' was a DUPLICATE. Do NOT ask this or previous questions: {list(state.asked_signatures)}. Generate a DIFFERENT question!"
                attempts += 1

            if not question_text:
                question_text = self._generate_deterministic_fallback_question(state)
                print(f"[QUESTION_FALLBACK_USED] session={session_id} turn={state.question_count} text='{question_text[:60]}...'")

            state.current_question = question_text.strip()
            final_sig = self._normalize_signature(state.current_question)
            state.asked_questions.append(state.current_question)
            state.asked_signatures.add(final_sig)

            print(f"[QUESTION_EMITTED] session={session_id} day={state.current_day} turn={state.question_count} sig={final_sig[:30]} text='{state.current_question[:60]}...'")

            reply_text = state.current_question
            if state.question_count == 1:
                cand_name = state.candidate.get("member", {}).get("name", "there") if state.candidate else "there"
                reply_text = f"Welcome {cand_name}. Let's begin your technical interview.\n\n{state.current_question}"

            res = {
                "reply": reply_text,
                "done": False,
                "currentQuestionIndex": state.question_count,
                "daysProbedCount": len(state.days_probed),
                "currentDay": state.current_day,
                "currentDayTitle": state.current_day_title,
                "isFollowup": state.is_followup
            }

            if req_record:
                req_record.status = "completed"
                req_record.metadata = res

            return res
        except Exception as e:
            if req_record:
                req_record.status = "failed"
            raise e

    async def process_turn_stream(
        self,
        session_id: str,
        message: Optional[str] = None,
        candidate_data: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Process a single turn of the interview state machine streaming via SSE.
        Includes application-level request registry replay caching.
        """
        state = self.get_or_create_session(session_id, candidate_data)

        # Application-level request registry idempotency check
        if request_id:
            record = self._get_request_record(session_id, request_id)
            if record and record.status == "completed" and record.metadata:
                print(f"[TURN_REPLAY] request_id={request_id} session={session_id} Replaying cached SSE response (0 extra Gemini calls / 0 Breeth writes).")
                for phase in record.phases:
                    yield phase
                for tok in record.tokens:
                    yield {"type": "token", "token": tok}
                yield {"type": "metadata", **record.metadata}
                return
            elif record and record.status == "processing":
                print(f"[TURN_DUPLICATE_PROCESSING] request_id={request_id} session={session_id} Duplicate streaming request in-progress.")
                if record.metadata:
                    yield {"type": "metadata", **record.metadata}
                return

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

        req_record = RequestRecord(request_id=request_id, session_id=session_id, status="processing") if request_id else None
        if request_id and req_record:
            self._save_request_record(session_id, req_record)

        try:
            cand_id = state.candidate.get("member", {}).get("id", "CAND-DEFAULT") if state.candidate else "CAND-DEFAULT"

            # Phase 1: Answer Evaluation
            if message and state.current_question:
                phase_eval = {
                    "type": "phase",
                    "stage": "evaluate_answer",
                    "label": f"Evaluating technical accuracy & answer depth ({len(message.split())} words)",
                }
                if req_record:
                    req_record.phases.append(phase_eval)
                yield phase_eval

                evaluation = await llm_client.evaluate_answer(
                    question=state.current_question,
                    answer=message,
                    context=state.current_day_title
                )
                state.last_evaluation = evaluation
                print(f"[ANSWER_EVALUATED] quality={evaluation.get('quality')} action={evaluation.get('recommended_action')}")

                breeth_memory.store_observation(
                    candidate_id=cand_id,
                    topic=state.current_day_title,
                    observation_type="important_answer",
                    content=f"Q: {state.current_question} | A: {message[:120]}",
                    metadata=evaluation
                )

                for concept in evaluation.get("concepts_demonstrated", []):
                    state.covered_concepts.add(concept)
                    breeth_memory.store_observation(cand_id, state.current_day_title, "skill", concept)

                for misc in evaluation.get("misconceptions", []):
                    state.misconceptions_observed.append(misc)
                    breeth_memory.store_observation(cand_id, state.current_day_title, "misconception", misc)

                state.history.append({
                    "question_index": state.question_count,
                    "day": state.current_day,
                    "day_title": state.current_day_title,
                    "question": state.current_question,
                    "answer": message,
                    "is_followup": state.is_followup,
                    "evaluation": evaluation
                })

                if state.question_count >= 8 and len(state.days_probed) >= 4:
                    state.is_done = True
                    phase_fb = {
                        "type": "phase",
                        "stage": "feedback_eval",
                        "label": "Synthesizing end-of-interview evaluation & topic scores",
                    }
                    if req_record:
                        req_record.phases.append(phase_fb)
                    yield phase_fb

                    feedback = await feedback_engine.generate(
                        candidate=state.candidate or {"member": {"name": "Candidate", "jobRole": "Software Engineer"}},
                        history=state.history,
                        days_probed=list(state.days_probed)
                    )
                    state.feedback = feedback

                    res_meta = {
                        "reply": "Thank you for completing all interview rounds! Here is your detailed technical evaluation.",
                        "done": True,
                        "feedback": feedback.model_dump(),
                        "currentQuestionIndex": state.question_count,
                        "daysProbedCount": len(state.days_probed),
                        "currentDay": state.current_day,
                        "currentDayTitle": state.current_day_title,
                        "isFollowup": False,
                    }
                    if req_record:
                        req_record.status = "completed"
                        req_record.metadata = res_meta

                    yield {
                        "type": "metadata",
                        **res_meta
                    }
                    return

            state.question_count += 1

            should_followup = (
                message is not None and
                len(state.history) > 0 and
                not state.is_followup and
                state.topic_followup_count < 1 and
                len(message.split()) > 2
            )

            phase_trans = {
                "type": "phase",
                "stage": "graph_transition",
                "is_followup": should_followup,
                "label": f"LangGraph transition: {'Deep-Dive Follow-Up' if should_followup else 'New Curriculum Topic'} + Breeth Memory Sync",
            }
            if req_record:
                req_record.phases.append(phase_trans)
            yield phase_trans

            retrieved_memory = breeth_memory.retrieve_relevant_memory(cand_id, state.current_day_title)

            if should_followup:
                state.is_followup = True
                state.topic_followup_count += 1
                last_turn = state.history[-1]

                phase_vec = {
                    "type": "phase",
                    "stage": "vector_search",
                    "label": f"ChromaDB search for Day {state.current_day}: {state.current_day_title}",
                }
                if req_record:
                    req_record.phases.append(phase_vec)
                yield phase_vec

                grounding_docs = vector_store.search_curriculum(f"Day {state.current_day} {state.current_day_title}")
                doc_context = grounding_docs[0]["content"] if grounding_docs else ""

                system_prompt = (
                    "You are a Senior AI Technical Interviewer conducting a live adaptive engineering interview.\n"
                    "CRITICAL CONVERSATIONAL RULES:\n"
                    "1. Ask EXACTLY ONE technical question at a time.\n"
                    "2. React directly and specifically to the candidate's actual answer content without filler praise (NEVER say 'Great answer!', 'That's a solid explanation!', or 'Good question!').\n"
                    "3. Ground your reaction in what the candidate explicitly stated, missing concepts, or misconceptions.\n"
                    "4. Maintain technical topic continuity. Deepen the current subject before switching topics.\n"
                    "5. NEVER repeat an already asked question or near-duplicate paraphrase.\n"
                    "6. Do NOT mention internal systems (LangGraph, Breeth, ChromaDB, Gemini, curriculum day numbers) in candidate-facing dialogue.\n"
                    f"Curriculum Grounding:\n{doc_context}\n"
                    f"Candidate Breeth Memory: {json.dumps(retrieved_memory)}"
                )

                user_prompt = (
                    f"Current Topic: Day {state.current_day} ({state.current_day_title})\n"
                    f"Previous Question: {last_turn['question']}\n"
                    f"Candidate Answer: {last_turn['answer']}\n"
                    f"Evaluation: {json.dumps(state.last_evaluation)}\n"
                    f"Previously Asked Questions: {json.dumps(state.asked_questions)}\n"
                    "Formulate a probing, adaptive technical follow-up question."
                )
            else:
                state.is_followup = False
                state.topic_followup_count = 0

                next_day_num = self._select_next_curriculum_day(state)
                day_info = vector_store.get_day(next_day_num) or {"day": next_day_num, "title": f"Day {next_day_num} Topic"}

                state.current_day = next_day_num
                state.current_day_title = day_info.get("title", f"Day {next_day_num} Topic")
                state.days_probed.add(next_day_num)

                phase_vec = {
                    "type": "phase",
                    "stage": "vector_search",
                    "label": f"ChromaDB search for Day {state.current_day}: {state.current_day_title}",
                }
                if req_record:
                    req_record.phases.append(phase_vec)
                yield phase_vec

                grounding_docs = vector_store.search_curriculum(f"Day {next_day_num} {state.current_day_title}")
                doc_context = grounding_docs[0]["content"] if grounding_docs else ""

                cand_name = state.candidate.get("member", {}).get("name", "Candidate") if state.candidate else "Candidate"

                system_prompt = (
                    "You are a Senior AI Technical Interviewer conducting a live adaptive engineering interview.\n"
                    "CRITICAL CONVERSATIONAL RULES:\n"
                    "1. Ask EXACTLY ONE technical question at a time.\n"
                    "2. React directly and specifically to the candidate's actual answer content without filler praise (NEVER say 'Great answer!', 'That's a solid explanation!', or 'Good question!').\n"
                    "3. Ground your reaction in what the candidate explicitly stated, missing concepts, or misconceptions.\n"
                    "4. Maintain technical topic continuity. Deepen the current subject before switching topics.\n"
                    "5. NEVER repeat an already asked question or near-duplicate paraphrase.\n"
                    "6. Do NOT mention internal systems (LangGraph, Breeth, ChromaDB, Gemini, curriculum day numbers) in candidate-facing dialogue.\n"
                    f"Curriculum Grounding:\n{doc_context}\n"
                    f"Candidate Breeth Memory: {json.dumps(retrieved_memory)}"
                )

                user_prompt = (
                    f"Candidate Name: {cand_name}\n"
                    f"Target Topic: Day {state.current_day} ({state.current_day_title})\n"
                    f"Difficulty: {state.current_difficulty}\n"
                    f"Previously Asked Questions: {json.dumps(state.asked_questions)}\n"
                    "Ask a clear, practical technical interview question."
                )

            provider = llm_client.provider
            is_real_llm = provider in {"gemini", "openai"} and bool(llm_client.gemini_key if provider == "gemini" else llm_client.openai_key)
            synth_label = (
                f"Synthesizing adaptive question via {provider.upper()} LLM"
                if is_real_llm
                else "Using local intelligent fallback generator"
            )
            phase_synth = {
                "type": "phase",
                "stage": "llm_synthesis",
                "provider": provider if is_real_llm else "fallback",
                "label": synth_label,
            }
            if req_record:
                req_record.phases.append(phase_synth)
            yield phase_synth

            question_text = ""
            attempts = 0
            while attempts < 3:
                candidate_q = await llm_client.generate_response(system_prompt, user_prompt)
                clean_cand = self.extract_clean_question_text(candidate_q)
                cand_sig = self._normalize_signature(clean_cand)

                print(f"[QUESTION_CANDIDATE] session={session_id} day={state.current_day} turn={state.question_count} attempt={attempts+1} sig={cand_sig[:30]}")

                if not self._is_duplicate_question(clean_cand, state):
                    question_text = clean_cand
                    print(f"[QUESTION_ACCEPTED] session={session_id} turn={state.question_count} text='{question_text[:60]}...'")
                    break

                print(f"[QUESTION_DUPLICATE_REJECTED] session={session_id} day={state.current_day} turn={state.question_count} attempt={attempts+1} sig={cand_sig[:30]} text='{clean_cand[:60]}...'")
                user_prompt += f"\nCRITICAL: Question '{clean_cand[:50]}' was a DUPLICATE. Do NOT ask this or previous questions: {list(state.asked_signatures)}. Generate a DIFFERENT question!"
                attempts += 1

            if not question_text:
                question_text = self._generate_deterministic_fallback_question(state)
                print(f"[QUESTION_FALLBACK_USED] session={session_id} turn={state.question_count} text='{question_text[:60]}...'")

            state.current_question = question_text.strip()
            final_sig = self._normalize_signature(state.current_question)
            state.asked_questions.append(state.current_question)
            state.asked_signatures.add(final_sig)

            print(f"[QUESTION_EMITTED] session={session_id} day={state.current_day} turn={state.question_count} sig={final_sig[:30]} text='{state.current_question[:60]}...'")

            reply_text = state.current_question
            if state.question_count == 1:
                cand_name = state.candidate.get("member", {}).get("name", "there") if state.candidate else "there"
                reply_text = f"Welcome {cand_name}. Let's begin your technical interview.\n\n{state.current_question}"

            words = reply_text.split(" ")
            for i, word in enumerate(words):
                chunk = word if i == 0 else " " + word
                if req_record:
                    req_record.tokens.append(chunk)
                yield {"type": "token", "token": chunk}

            res_meta = {
                "reply": reply_text,
                "done": False,
                "currentQuestionIndex": state.question_count,
                "daysProbedCount": len(state.days_probed),
                "currentDay": state.current_day,
                "currentDayTitle": state.current_day_title,
                "isFollowup": state.is_followup,
            }

            if req_record:
                req_record.status = "completed"
                req_record.metadata = res_meta

            yield {
                "type": "metadata",
                **res_meta
            }
        except Exception as e:
            if req_record:
                req_record.status = "failed"
            raise e


# Global singleton instance
agent_graph = InterviewAgentGraph()
