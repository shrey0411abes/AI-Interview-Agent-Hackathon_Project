\# Antigravity Build Prompt — Final — AI Interview Agent (React.js Full-Stack)



Framework decision locked: \*\*React.js (Vite)\*\* for frontend. This removes a planning round so Antigravity goes straight from architecture confirmation to scaffolding.



\---



\## PROMPT



You are a senior full-stack AI engineer and product designer. Build a production-quality \*\*AI Interview Agent\*\* — a system that conducts realistic, adaptive technical interviews grounded in a candidate's actual learning history. This is a hackathon submission judged on technical depth, UI/UX polish, and code quality. Treat this as a real product, not a prototype.



Plan the full architecture first, show me the plan, then implement it module by module. UI/UX is a first-class requirement — do not default to an unstyled chat box.



Commit your changes to git after completing each module (backend endpoint, state machine, retrieval, frontend chat UI, etc.) with a clear, specific commit message describing what was implemented.



Note: scaffold this structure directly inside the current working directory — do not create a nested "interview-agent" folder.



\### Context

The candidate has completed part of a 31-day enterprise AI cohort (RAG, vector databases, prompt engineering, agentic AI, MCP, AI deployment, production AI systems). Your agent interviews them based on what they actually learned — not a generic question bank.



\### Non-negotiable functional requirements

\- Minimum 8 questions per interview, spanning at least 4 distinct curriculum days.

\- Every follow-up question must reference the candidate's actual prior answer — no generic "tell me more."

\- Full conversation state must persist across all turns of one session.

\- Feedback output must be schema-valid JSON matching technical-specs.md exactly.

\- The exact HTTP endpoint(s) from technical-specs.md must be exposed and match its request/response format precisely.



\### Inputs (place in /backend/data)

\- `curriculum.json` — 31-day curriculum: modules, daily topics, learning objectives, tools

\- `candidates.json` — candidate profiles: completed missions, attempts, skipped topics, learning signals

\- `technical-specs.md` — required API contract, request/response schema



\### Monorepo structure — scaffold exactly this shape

```

/interview-agent

├── frontend/

│   ├── src/

│   │   ├── components/

│   │   │   ├── chat/          # message bubbles, input bar, typing indicator

│   │   │   ├── progress/      # tracker sidebar/header

│   │   │   └── feedback/      # end-of-interview dashboard

│   │   ├── hooks/             # useInterviewStream, useProgress

│   │   ├── lib/                # api client, SSE handler

│   │   └── styles/

│   ├── index.html

│   ├── package.json

│   ├── vite.config.ts

│   ├── tsconfig.json

│   └── .env.example

├── backend/

│   ├── app/

│   │   ├── main.py

│   │   ├── agent/              # state machine, question logic

│   │   ├── retrieval/          # vector store, grounding

│   │   ├── feedback/           # structured feedback generation

│   │   └── models/             # pydantic schemas

│   ├── data/

│   ├── tests/

│   ├── requirements.txt

│   └── .env.example

├── prompts/

│   └── AI\_USAGE\_LOG.md

└── README.md

```



\### Backend stack

\- \*\*Framework:\*\* FastAPI (async), matching the technical-spec endpoint contract exactly

\- \*\*Orchestration:\*\* LangGraph for the interview state machine — track question index, topics covered, answer history, follow-up depth per topic

\- \*\*Retrieval:\*\* Chroma (in-memory) for grounding questions in curriculum.json — no hallucinated content

\- \*\*LLM layer:\*\* Provider-agnostic wrapper (env-var swappable model) — don't hardcode one vendor

\- \*\*Streaming:\*\* `StreamingResponse` / SSE so the frontend renders token-by-token, not spinner-then-dump

\- \*\*Validation:\*\* Pydantic models for every request/response, matching technical-specs.md precisely

\- \*\*Testing:\*\* `pytest` with an end-to-end simulated interview test (8+ questions, 4+ topics, schema-valid feedback)



\### Frontend stack (React.js — locked)

\- \*\*Framework:\*\* React 18 + Vite + TypeScript

\- \*\*Styling:\*\* Tailwind CSS + shadcn/ui for accessible, consistent components

\- \*\*Server/streaming state:\*\* React Query for request lifecycle, native `EventSource`/fetch-stream handling for SSE

\- \*\*Local UI state:\*\* Zustand — lightweight, avoids Redux overhead for a single-session interview

\- \*\*Animation:\*\* Framer Motion — message transitions, typing indicator, progress reveals

\- \*\*Charts (feedback dashboard):\*\* Recharts — radar or bar chart for per-topic scores

\- \*\*Icons:\*\* lucide-react



\### UI/UX requirements — the differentiator, not an afterthought

1\. \*\*Chat-native interview interface\*\* — distinct interviewer/candidate bubbles, visible "AI is thinking" state during generation, never a blank pause.

2\. \*\*Streaming responses\*\* — the interviewer's question appears token-by-token via SSE, mirroring a real typed conversation.

3\. \*\*Live progress tracker\*\* — persistent panel showing: questions asked / 8 minimum, topics covered vs. remaining, current curriculum day being probed. Makes the agent's reasoning visible — doubles as a judge-facing transparency feature.

4\. \*\*Adaptive visual cues\*\* — small tag distinguishing a follow-up ("digging deeper") from a new-topic question, so the flow doesn't read as a flat list.

5\. \*\*Input experience\*\* — auto-resizing textarea, Enter to send / Shift+Enter for newline, disabled + "listening" state while the agent processes.

6\. \*\*End-of-interview feedback screen\*\* — rendered as a dashboard, not a JSON dump: strengths, gaps, per-topic scores as a Recharts radar/bar chart, overall readiness signal displayed prominently.

7\. \*\*Designed empty/loading/error states\*\* — a candidate with no prior progress data still gets a coherent baseline interview; nothing should ever look broken or default-browser-ugly.

8\. \*\*Responsiveness\*\* — clean on desktop (primary demo surface) and a reasonably sized tablet/mobile viewport.

9\. \*\*Motion restraint\*\* — 200-300ms transitions, calm and professional, never distracting from interview content.



\### Explicitly out of scope — do not build

\- Voice interaction

\- User authentication / persistent accounts

\- Long-term cross-session conversation history

\- Native mobile app

\- A production database (in-memory or lightweight local store only)



\### Build process — follow this order

1\. Read all three input files and summarize the data shape back to me before writing any code.

2\. Propose the architecture plan (backend state machine + React component tree) and confirm before scaffolding.

3\. Scaffold both `frontend/` and `backend/` with their config files (package.json, requirements.txt, tsconfig.json, .env.example).

4\. Implement the backend: FastAPI endpoint → state machine → retrieval grounding → follow-up logic → structured feedback module.

5\. Implement the frontend: chat interface → SSE streaming hook → progress tracker → feedback dashboard.

6\. Wire frontend to backend end-to-end; confirm streaming actually streams, not a static request/response.

7\. Write `backend/tests/test\_interview\_flow.py` simulating a full interview; run it and fix failures before declaring done.

8\. Write `prompts/AI\_USAGE\_LOG.md` documenting each real prompt/decision as you build — must correspond to actual implemented features.

9\. Write root `README.md`: setup steps for both frontend and backend, route map, ASCII architecture diagram, one-paragraph justification of each major stack choice.



\### Constraints

\- Every design decision that deviates from the obvious default gets a one-line comment explaining why.

\- Keep both codebases clean enough to walk through live in a demo — no black-box logic.

\- Self-verify: run backend tests and manually confirm the frontend renders a full interview flow before declaring the build complete.



Begin by summarizing the three input files, then propose your full-stack architecture plan — backend and frontend — before writing any code.



\---







