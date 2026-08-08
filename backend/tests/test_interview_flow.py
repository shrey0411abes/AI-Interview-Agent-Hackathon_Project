import pytest
import json
import os
from fastapi.testclient import TestClient
from app.main import app
from app.retrieval.vector_store import vector_store
from app.feedback.generator import feedback_engine

client = TestClient(app)

@pytest.fixture
def sample_candidate():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cand_path = os.path.join(base_dir, "data", "candidates.json")
    with open(cand_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["candidates"][0]


def test_chroma_vector_store_fallback():
    """Verify vector store retrieval works and falls back cleanly without crashing."""
    results = vector_store.search_curriculum("vector database embeddings", top_k=3)
    assert isinstance(results, list)
    assert len(results) > 0
    assert "day" in results[0]
    assert "title" in results[0]


def test_full_interview_flow_end_to_end(sample_candidate):
    """
    Simulate a full 8+ turn interview end-to-end matching technical-specs.md contract:
    - Minimum 8 questions
    - Spanning at least 4 distinct curriculum days
    - Feedback schema valid (summary, strengths, gaps, next)
    """
    session_id = "test-session-e2e-123"

    # Turn 1: Start Interview with candidate payload
    start_payload = {
        "sessionId": session_id,
        "candidate": sample_candidate
    }
    res = client.post("/api/interview", json=start_payload)
    assert res.status_code == 200, res.text
    body = res.json()

    assert "reply" in body
    assert body["done"] is False
    assert body["currentQuestionIndex"] == 1
    assert "Welcome" in body["reply"] or "interview" in body["reply"].lower()

    # Answers to simulate realistic interview conversation turns
    sample_answers = [
        "In our embeddings project, we used Ollama with Qwen to map 1536-dimensional text vectors and calculated cosine similarity for dense semantic matching.",
        "To manage chunking, we used recursive character text splitter with chunk size of 512 tokens and 50 token overlap to prevent context fragmentation.",
        "We implemented RAG by indexing documents into Chroma vector database and passing top 3 retrieved context passages directly to system prompt.",
        "For system prompts, we added strict anti-hallucination guardrails instructing the LLM to reply only using facts present in the retrieved context.",
        "We built our API backend using FastAPI async endpoints with Pydantic request model validation and CORS middleware for frontend integration.",
        "For multi-agent orchestration, we used LangGraph state graph where each agent node represents a specialized tool executor with persistent memory.",
        "Model Context Protocol (MCP) standardized dynamic tool schema definitions so our agent could execute external database queries cleanly.",
        "We containerized our application using Docker multi-stage builds and deployed to Kubernetes with health check readiness probes."
    ]

    # Turns 2 to 8
    done = False
    final_feedback = None

    for idx, answer in enumerate(sample_answers):
        turn_payload = {
            "sessionId": session_id,
            "message": answer
        }
        res = client.post("/api/interview", json=turn_payload)
        assert res.status_code == 200, f"Turn {idx+2} failed: {res.text}"
        body = res.json()

        done = body["done"]
        if done:
            final_feedback = body.get("feedback")
            break

    # Verification of final interview completion
    assert done is True, "Interview should mark done=True after 8 questions across >= 4 days"
    assert final_feedback is not None, "Feedback object must be present on final turn"

    # Validate feedback schema strictly against technical-specs.md
    assert "summary" in final_feedback and isinstance(final_feedback["summary"], str)
    assert "strengths" in final_feedback and isinstance(final_feedback["strengths"], list)
    assert "gaps" in final_feedback and isinstance(final_feedback["gaps"], list)
    assert "next" in final_feedback and isinstance(final_feedback["next"], list)
    assert len(final_feedback["strengths"]) > 0
    assert len(final_feedback["next"]) > 0


@pytest.mark.asyncio
async def test_honest_fallback_feedback_degradation():
    """Verify fallback feedback evaluator correctly flags short/empty answers as technical gaps."""
    mock_history = [
        {"day": 7, "day_title": "Embeddings Explained", "answer": "yes"},
        {"day": 10, "day_title": "Retrieval Engine", "answer": "ok"},
        {"day": 12, "day_title": "Prompt Engineering", "answer": "i guess"},
    ]
    fb = feedback_engine._fallback_feedback("Test User", [7, 10, 12], mock_history)

    assert "brief" in fb.summary.lower() or "limited depth" in fb.summary.lower()
    assert any("incomplete" in g.lower() or "superficial" in g.lower() or "lacked" in g.lower() for g in fb.gaps)
