import json
import os
import asyncio
from typing import AsyncGenerator
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

from app.models.schemas import InterviewRequest, InterviewResponse
from app.agent.graph import agent_graph

app = FastAPI(
    title="AI Interview Agent API",
    description="Production-grade AI Technical Interview Agent powered by FastAPI, LangGraph & ChromaDB",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "AI Interview Agent Backend",
        "endpoint": "/api/interview"
    }


@app.post("/api/interview", response_model=InterviewResponse)
async def interview_endpoint(req: InterviewRequest, request: Request):
    """
    Primary API Endpoint defined in technical-specs.md.
    Maintains session state via sessionId.
    Supports standard JSON responses and SSE streaming token-by-token.
    """
    if not req.sessionId:
        raise HTTPException(status_code=400, detail="sessionId is required")

    candidate_dict = req.candidate.model_dump() if req.candidate else None
    
    # Check if frontend requested Server-Sent Events streaming
    accept_header = request.headers.get("accept", "")
    stream_requested = "text/event-stream" in accept_header or request.query_params.get("stream") == "true"

    if stream_requested:
        return StreamingResponse(
            event_stream_generator(req.sessionId, req.message, candidate_dict),
            media_type="text/event-stream"
        )

    # Standard JSON turn execution
    result = await agent_graph.process_turn(
        session_id=req.sessionId,
        message=req.message,
        candidate_data=candidate_dict
    )

    return JSONResponse(content=result)


async def event_stream_generator(session_id: str, message: str | None, candidate_dict: dict | None) -> AsyncGenerator[str, None]:
    """
    Server-Sent Events (SSE) generator streaming interview reply token-by-token to React UI.
    """
    result = await agent_graph.process_turn(
        session_id=session_id,
        message=message,
        candidate_data=candidate_dict
    )

    reply_text = result.get("reply", "")
    words = reply_text.split(" ")

    # Stream tokens word-by-word
    for i, word in enumerate(words):
        chunk = word if i == 0 else " " + word
        payload = json.dumps({"token": chunk, "done": False})
        yield f"data: {payload}\n\n"
        await asyncio.sleep(0.015)

    # Final event containing full metadata & feedback
    final_payload = json.dumps({
        "token": "",
        "done": result.get("done", False),
        "reply": reply_text,
        "feedback": result.get("feedback"),
        "currentQuestionIndex": result.get("currentQuestionIndex"),
        "daysProbedCount": result.get("daysProbedCount"),
        "currentDay": result.get("currentDay"),
        "currentDayTitle": result.get("currentDayTitle"),
        "isFollowup": result.get("isFollowup")
    })
    yield f"data: {final_payload}\n\n"
    yield "data: [DONE]\n\n"


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
