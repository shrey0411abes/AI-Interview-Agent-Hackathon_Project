# AI Interview Agent — Enterprise Technical Assessment Simulator

An enterprise-grade, realistic, adaptive technical interview simulator that conducts grounded technical interviews based on a candidate's actual learning history from a 31-day AI enterprise cohort.

Built as a hackathon submission prioritizing technical depth, UI/UX polish, and robust code quality.

---

## 🏛️ System Architecture

```
                       +-----------------------------------+
                       |          React.js Frontend        |
                       |    (Vite + TypeScript + Tailwind) |
                       +-----------------+-----------------+
                                         |
                                  SSE / REST HTTP
                                         |
                                         v
                       +-----------------------------------+
                       |          FastAPI Backend          |
                       |      (app/main.py API Server)     |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------------------------+
                       |      LangGraph State Machine      |
                       |  (Interview Flow & Memory Graph)  |
                       +--------+-----------------+--------+
                                |                 |
                                v                 v
               +------------------+     +------------------+
               |  Chroma DB RAG   |     | Structured JSON  |
               | (curriculum.json)|     | Feedback Engine  |
               +------------------+     +------------------+
```

---

## 💡 Major Stack Justifications

### 1. FastAPI (Async Python Backend)
FastAPI provides native asynchronous standard request handling, high-throughput ASGI execution, Pydantic type validation matching `technical-specs.md`, and built-in support for `StreamingResponse` Server-Sent Events (SSE).

### 2. LangGraph (Orchestration & State Machine)
LangGraph provides a clean, stateful graph abstraction for managing multi-turn interview conversations. It tracks question counts, distinct curriculum days probed, follow-up depth per topic, and candidate mission signals without requiring external database state.

### 3. Chroma DB (In-Memory Vector Store Grounding)
Chroma indexes all 31 days of the enterprise AI curriculum on startup. Vector search ensures that interview questions and follow-ups are strictly grounded in candidate learning objectives with zero hallucinated course material, while gracefully falling back to keyword search if offline.

### 4. React.js 18 + Vite + TypeScript (Frontend)
React 18 paired with Vite provides lightning-fast hot module reloading, strict static typing, and modular component composition. Combined with Tailwind CSS, Zustand state management, and Framer Motion, it delivers a responsive, token-by-token streaming chat interface and polished feedback dashboard.

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env

# Run FastAPI development server
python -m uvicorn app.main:app --reload --port 8000
```
Backend API will run at `http://localhost:8000`.

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Copy environment config
cp .env.example .env

# Run Vite development server
npm run dev
```
Frontend UI will run at `http://localhost:3000`.

---

## 🗺️ API Route Map & Contracts

### `POST /api/interview`
Exposes the single HTTP endpoint contract defined in `technical-specs.md`.

#### Initial Turn (Start Interview)
```json
POST /api/interview

{
  "sessionId": "session-101",
  "candidate": {
    "member": {
      "id": "CAND-001",
      "name": "Sarah Johnson",
      "jobRole": "Senior Data Engineer",
      "yearsExperience": 9,
      "education": "MS Computer Science"
    },
    "missions": [...],
    "signals": { "commitDays": 28, "missionsCompleted": 30, "missionsFirstTry": 20 }
  }
}
```
**Response:**
```json
{
  "reply": "Welcome Sarah Johnson. Let's begin your technical interview...",
  "done": false,
  "currentQuestionIndex": 1,
  "daysProbedCount": 1,
  "currentDay": 7,
  "currentDayTitle": "Embeddings Explained"
}
```

#### Conversation Turn
```json
POST /api/interview

{
  "sessionId": "session-101",
  "message": "We calculated cosine similarity across 1536-dimensional vectors using Chroma DB..."
}
```

#### Final Turn (Completion Response)
When $\ge 8$ questions across $\ge 4$ distinct curriculum days are answered:
```json
{
  "reply": "Thank you for completing all interview rounds!",
  "done": true,
  "feedback": {
    "summary": "Candidate demonstrated strong understanding of vector search mechanics and RAG pipelines.",
    "strengths": ["Solid grasp of embedding distance metrics", "Clear architecture for chunking"],
    "gaps": ["Could deepen knowledge of production hybrid search reranking"],
    "next": ["Build custom MCP server with dynamic tool schemas"]
  }
}
```

---

## 🧪 Running Automated Tests

Run the end-to-end simulated interview test suite:

```bash
pytest backend/tests/test_interview_flow.py -v
```

Tests verify:
1. End-to-end 8+ question interview execution across $\ge 4$ distinct curriculum days.
2. Output JSON validation against `technical-specs.md` schema.
3. Honest heuristic feedback fallback for short/empty candidate responses.
4. In-memory Chroma vector store search and graceful keyword fallback.
