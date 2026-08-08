# AI Usage Log & Architectural Decision Journal

This document records the design decisions, prompts, and architectural rationale used during the development of the **AI Interview Agent**.

---

## 1. System Prompt Design & Retrieval Grounding

### Prompt 1.1: Retrieval Grounding Prompt
- **Intent**: Eliminate hallucinated curriculum content by injecting vector-retrieved context chunks from `curriculum.json` directly into system prompts.
- **Implementation**: [`backend/app/agent/graph.py`](file:///c:/Users/shrey/AI-Interview-Agent-Hackathon_Project/backend/app/agent/graph.py)
- **Prompt Structure**:
  ```text
  You are an expert AI interviewer.
  Formulate an engaging, highly realistic technical interview question grounded in the curriculum.
  Curriculum Grounding:
  {doc_context}
  ```
- **Rationale**: Ensures the agent asks questions strictly aligned with what the candidate learned during their 31-day AI enterprise cohort.

### Prompt 1.2: Deep Dive Follow-up Prompt
- **Intent**: Reference candidate's prior answer explicitly without generic phrasing like "tell me more".
- **Implementation**: [`backend/app/agent/graph.py`](file:///c:/Users/shrey/AI-Interview-Agent-Hackathon_Project/backend/app/agent/graph.py)
- **Prompt Structure**:
  ```text
  You are an expert AI interviewer.
  Formulate a precise follow-up question that directly references the candidate's actual answer.
  DO NOT use generic phrases like 'tell me more'. Probe specific technical mechanisms or trade-offs.
  ```
- **Rationale**: Fulfills non-negotiable functional requirement for candidate answer referencing.

---

## 2. LangGraph State Machine Architecture

- **State Representation**: [`InterviewState`](file:///c:/Users/shrey/AI-Interview-Agent-Hackathon_Project/backend/app/agent/graph.py) tracks `question_count` ($\ge 8$), `days_probed` ($\ge 4$ distinct curriculum days), current day topic, Q&A history, follow-up depth counter, and structured feedback.
- **Adaptive Topic Selection**: Inspects candidate mission signals from `candidates.json` (skipped missions and multi-attempt missions with `attempts > 2`) to prioritize probing candidate weak spots before pivoting to core topics.
- **In-Memory Store**: Uses Python dictionary `sessions: Dict[str, InterviewState]` to meet the out-of-scope constraint (no external production database).

---

## 3. Chroma Vector Database Retrieval & Fallbacks

- **Chroma DB Indexing**: Parses all 31 curriculum days into Chroma in-memory collection on app startup.
- **Graceful Keyword Fallback**: Configured to catch indexing and query vectorizer errors gracefully. If embedding download fails or runs offline, `search_curriculum()` seamlessly falls back to keyword matching without throwing runtime exceptions.

---

## 4. Honest Feedback Evaluator Fallback

- **Implementation**: [`backend/app/feedback/generator.py`](file:///c:/Users/shrey/AI-Interview-Agent-Hackathon_Project/backend/app/feedback/generator.py)
- **Rationale**: When LLM calls return malformed JSON or fail offline, `_fallback_feedback()` inspects turn history heuristics (e.g. word count per answer). It flags answers under 10 words as technical gaps rather than giving unearned praise.

---

## 5. React Frontend & Real-time SSE Streaming UI

- **Framework**: React 18 + Vite + TypeScript + Tailwind CSS.
- **State Management**: Zustand global store (`store.ts`) for single-session UI state.
- **Streaming**: Native fetch stream reader in `api.ts` parses Server-Sent Events (`text/event-stream`) line-by-line, rendering tokens live on screen with animated typing indicators.
- **Dashboard**: End-of-interview feedback dashboard with Recharts radar chart displaying topic scores and prominent readiness badges.
