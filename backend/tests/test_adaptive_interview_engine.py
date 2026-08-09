# pyrefly: ignore [missing-import]
import pytest
from app.memory.breeth import breeth_memory
from app.agent.graph import agent_graph, InterviewState
from app.agent.llm import llm_client


@pytest.mark.asyncio
async def test_breeth_memory_store_and_retrieve():
    cand_id = "TEST-CAND-001"
    breeth_memory.store_observation(cand_id, "Vector Search", "skill", "Cosine similarity normalization")
    breeth_memory.store_observation(cand_id, "Vector Search", "weakness", "ANN indexing HNSW recall trade-offs")
    breeth_memory.store_observation(cand_id, "Vector Search", "misconception", "Euclidean distance vs Cosine equivalence")

    retrieved = breeth_memory.retrieve_relevant_memory(cand_id, "Vector Search")
    assert "Cosine similarity normalization" in retrieved["demonstrated_skills"]
    assert "ANN indexing HNSW recall trade-offs" in retrieved["weaknesses"]
    assert "Euclidean distance vs Cosine equivalence" in retrieved["misconceptions"]


@pytest.mark.asyncio
async def test_question_deduplication():
    state = InterviewState(session_id="test-dedup-session")
    state.asked_signatures.add(agent_graph._normalize_signature("Why is cosine similarity preferred for dense text vectors?"))

    assert agent_graph._is_duplicate_question("Why is cosine similarity preferred for dense text vectors?", state) is True
    assert agent_graph._is_duplicate_question("Deep Dive Follow-Up: Why is cosine similarity preferred for dense text vectors?", state) is True
    assert agent_graph._is_duplicate_question("How would you implement Reciprocal Rank Fusion in RAG?", state) is False


@pytest.mark.asyncio
async def test_turn_request_idempotency():
    session_id = "test-idempotency-session"
    req_id = "req-test-12345"

    res1 = await agent_graph.process_turn(session_id=session_id, message="Test message", request_id=req_id)
    assert res1 is not None
    assert "reply" in res1

    res2 = await agent_graph.process_turn(session_id=session_id, message="Test message", request_id=req_id)
    assert res2 == res1


@pytest.mark.asyncio
async def test_multi_turn_strict_non_repetition():
    session_id = "test-strict-non-repetition-999"
    
    # Turn 1: Initialization
    res1 = await agent_graph.process_turn(session_id=session_id, request_id=f"req-init-{session_id}")
    q1 = agent_graph.extract_clean_question_text(res1["reply"])
    sig1 = agent_graph._normalize_signature(q1)

    # Turn 2: Strong answer
    res2 = await agent_graph.process_turn(
        session_id=session_id,
        message="Cosine similarity measures vector angle rather than magnitude.",
        request_id=f"req-turn-2-{session_id}"
    )
    q2 = agent_graph.extract_clean_question_text(res2["reply"])
    sig2 = agent_graph._normalize_signature(q2)
    assert sig2 != sig1, f"Turn 2 question duplicate of Turn 1! sig1={sig1} sig2={sig2}"

    # Turn 3: "I don't know" answer
    res3 = await agent_graph.process_turn(
        session_id=session_id,
        message="I don't know",
        request_id=f"req-turn-3-{session_id}"
    )
    q3 = agent_graph.extract_clean_question_text(res3["reply"])
    sig3 = agent_graph._normalize_signature(q3)
    assert sig3 != sig1 and sig3 != sig2, f"Turn 3 question duplicate of previous! sig3={sig3}"

    # Turn 4: Weak answer
    res4 = await agent_graph.process_turn(
        session_id=session_id,
        message="Nope",
        request_id=f"req-turn-4-{session_id}"
    )
    q4 = agent_graph.extract_clean_question_text(res4["reply"])
    sig4 = agent_graph._normalize_signature(q4)
    assert sig4 not in {sig1, sig2, sig3}, f"Turn 4 question duplicate of previous! sig4={sig4}"

    state = agent_graph.sessions[session_id]
    assert len(state.asked_signatures) == 4
