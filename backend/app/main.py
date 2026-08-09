import json
import os
import asyncio
from typing import AsyncGenerator
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Request, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
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
            event_stream_generator(req.sessionId, req.message, candidate_dict, req.requestId),
            media_type="text/event-stream"
        )

    # Standard JSON turn execution
    result = await agent_graph.process_turn(
        session_id=req.sessionId,
        message=req.message,
        candidate_data=candidate_dict,
        # pyrefly: ignore [unexpected-keyword]
        request_id=req.requestId
    )

    return JSONResponse(content=result)


async def event_stream_generator(session_id: str, message: str | None, candidate_dict: dict | None, request_id: str | None = None) -> AsyncGenerator[str, None]:
    """
    Server-Sent Events (SSE) generator streaming real-time phase transitions,
    tokens, and final metadata.
    """
    async for event in agent_graph.process_turn_stream(session_id, message, candidate_dict, request_id):
        event_type = event.get("type")
        if event_type == "phase":
            payload = json.dumps(event)
            yield f"data: {payload}\n\n"
        elif event_type == "token":
            payload = json.dumps({"token": event.get("token"), "done": False})
            yield f"data: {payload}\n\n"
        elif event_type == "metadata":
            payload = json.dumps(event)
            yield f"data: {payload}\n\n"
            yield "data: [DONE]\n\n"


if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
