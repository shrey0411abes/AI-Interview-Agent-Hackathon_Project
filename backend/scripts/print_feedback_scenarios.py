"""Print weak vs strong fallback feedback scenarios for Part 1 verification."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.feedback.generator import feedback_engine

WEAK_HISTORY = [
    {"day": 7, "day_title": "Embeddings Explained", "question": "Explain embeddings.", "answer": "idk"},
    {"day": 10, "day_title": "Retrieval Engine", "question": "How does RAG work?", "answer": "no idea"},
    {"day": 12, "day_title": "Prompt Engineering", "question": "Describe prompt design.", "answer": "maybe"},
    {"day": 14, "day_title": "RAG Pipelines", "question": "Walk through indexing.", "answer": "pass"},
    {"day": 16, "day_title": "ChromaDB", "question": "Explain vector stores.", "answer": "sure"},
    {"day": 18, "day_title": "Deployment", "question": "How do you deploy?", "answer": "ok"},
    {"day": 20, "day_title": "MCP Protocols", "question": "What is MCP?", "answer": "yes"},
    {"day": 22, "day_title": "Observability", "question": "How do you monitor?", "answer": "n/a"},
]

STRONG_HISTORY = [
    {
        "day": 7,
        "day_title": "Embeddings Explained",
        "question": "Explain embeddings.",
        "answer": (
            "We used Ollama with Qwen to produce 1536-dimensional dense vectors and compared "
            "candidate passages with cosine similarity to rank semantic relevance for retrieval."
        ),
    },
    {
        "day": 10,
        "day_title": "Retrieval Engine",
        "question": "How does RAG work?",
        "answer": (
            "Documents are chunked with a recursive splitter, embedded into Chroma, and at query time "
            "the top-k passages are injected into the system prompt to ground the LLM response."
        ),
    },
    {
        "day": 12,
        "day_title": "Prompt Engineering",
        "question": "Describe prompt design.",
        "answer": (
            "We used role-specific system prompts with explicit grounding rules, few-shot examples for "
            "tool selection, and temperature tuning to reduce hallucinations in enterprise workflows."
        ),
    },
    {
        "day": 14,
        "day_title": "RAG Pipelines",
        "question": "Walk through indexing.",
        "answer": (
            "Ingestion normalizes PDFs to text, chunks at 512 tokens with overlap, embeds each chunk, "
            "stores metadata in Chroma, and reindexes incrementally when source documents change."
        ),
    },
    {
        "day": 16,
        "day_title": "ChromaDB",
        "question": "Explain vector stores.",
        "answer": (
            "Chroma stores embedding vectors with document metadata and supports filtered similarity "
            "search so agents can retrieve only approved knowledge-base partitions."
        ),
    },
    {
        "day": 18,
        "day_title": "Deployment",
        "question": "How do you deploy?",
        "answer": (
            "We containerized FastAPI and the worker pipeline with Docker multi-stage builds and deployed "
            "to Kubernetes with readiness probes, autoscaling, and environment-specific secrets."
        ),
    },
    {
        "day": 20,
        "day_title": "MCP Protocols",
        "question": "What is MCP?",
        "answer": (
            "Model Context Protocol standardizes tool schemas and execution contracts so agents can "
            "discover and invoke external systems safely with typed inputs and outputs."
        ),
    },
    {
        "day": 22,
        "day_title": "Observability",
        "question": "How do you monitor?",
        "answer": (
            "We track latency, token usage, retrieval hit rate, and failure modes with structured logs "
            "and dashboards, plus alerting when grounding quality drops in production."
        ),
    },
]


def print_scenario(title: str, name: str, history):
    days = sorted({turn["day"] for turn in history})
    fb = feedback_engine._fallback_feedback(name, days, history)

    print("=" * 72)
    print(title)
    print("=" * 72)
    print(f"Verdict: {fb.verdict}")
    print(f"Summary: {fb.summary}")
    print(f"Strengths ({len(fb.strengths)}): {fb.strengths or ['<empty>']}")
    print("Topic scores:")
    for ts in fb.topic_scores:
        print(f"  - Day {ts.day} | {ts.subject}: {ts.score}/100")
    avg_score = sum(ts.score for ts in fb.topic_scores) / max(len(fb.topic_scores), 1)
    print(f"Average topic score: {avg_score:.1f}")
    print()


if __name__ == "__main__":
    print_scenario("WEAK ANSWER SCENARIO (dismissive one-word answers)", "Weak Candidate", WEAK_HISTORY)
    print_scenario("STRONG ANSWER SCENARIO (detailed technical answers)", "Strong Candidate", STRONG_HISTORY)
