import pytest
from app.agent.graph import agent_graph, InterviewState, RequestRecord
from app.memory.breeth import breeth_memory


@pytest.mark.asyncio
async def test_session_init_request_replay():
    session_id = "test-replay-session-999"
    init_req_id = f"req-init-{session_id}"

    # First initialization turn
    events1 = []
    async for event in agent_graph.process_turn_stream(session_id, request_id=init_req_id):
        events1.append(event)

    assert len(events1) > 0
    # Check that request record was created and completed
    record = agent_graph._get_request_record(session_id, init_req_id)
    assert record is not None
    assert record.status == "completed"

    # Second initialization turn (remount / retry replay)
    events2 = []
    async for event in agent_graph.process_turn_stream(session_id, request_id=init_req_id):
        events2.append(event)

    # Verify that events match exactly without duplicate Gemini execution
    assert len(events2) == len(events1)
    meta1 = [e for e in events1 if e.get("type") == "metadata"][0]
    meta2 = [e for e in events2 if e.get("type") == "metadata"][0]
    assert meta1["reply"] == meta2["reply"]


@pytest.mark.asyncio
async def test_duplicate_breeth_write_prevention():
    cand_id = "TEST-CAND-REPLAY"
    breeth_memory.store_observation(cand_id, "Vector Search", "skill", "Cosine distance")
    
    mem1 = breeth_memory.retrieve_relevant_memory(cand_id, "Vector Search")
    assert len([s for s in mem1["demonstrated_skills"] if s == "Cosine distance"]) == 1

    # Repeat store observation with same content
    breeth_memory.store_observation(cand_id, "Vector Search", "skill", "Cosine distance")
    mem2 = breeth_memory.retrieve_relevant_memory(cand_id, "Vector Search")
    assert len([s for s in mem2["demonstrated_skills"] if s == "Cosine distance"]) == 1
