import os
import json
import asyncio
from typing import AsyncGenerator, Dict, Any, List, Optional

# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()


class LLMWrapper:
    """
    Provider-agnostic LLM interface supporting OpenAI, Gemini,
    and a local intelligent fallback for offline operation
    and automated testing.
    """

    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "mock").lower()

        self.model_name = os.getenv(
            "MODEL_NAME",
            "gemini-3.6-flash"
        )

        self.openai_key = os.getenv(
            "OPENAI_API_KEY",
            ""
        )

        self.gemini_key = os.getenv(
            "GEMINI_API_KEY",
            ""
        )

    # ---------------------------------------------------------
    # Content Normalization
    # ---------------------------------------------------------

    def _extract_text(self, content: Any) -> str:
        """
        Normalize LangChain content into plain text.

        Newer Gemini models may return structured content blocks
        instead of a simple string.
        """

        if isinstance(content, str):
            return content

        if isinstance(content, list):
            parts = []

            for block in content:

                if isinstance(block, str):
                    parts.append(block)

                elif isinstance(block, dict):
                    text = block.get("text")

                    if text:
                        parts.append(str(text))

            return "".join(parts)

        return str(content)

    # ---------------------------------------------------------
    # Full Response Generation
    # ---------------------------------------------------------

    async def generate_response(
        self,
        system_prompt: str,
        user_prompt: str
    ) -> str:

        # =====================================================
        # OPENAI
        # =====================================================

        if (
            self.provider == "openai"
            and self.openai_key
            and "your-openai-api-key" not in self.openai_key
        ):

            try:
                # pyrefly: ignore [missing-import]
                from langchain_openai import ChatOpenAI
                # pyrefly: ignore [missing-import]
                from langchain_core.messages import (
                    SystemMessage,
                    HumanMessage
                )

                llm = ChatOpenAI(
                    model=self.model_name,
                    temperature=0.7,
                    api_key=self.openai_key
                )

                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=user_prompt)
                ]

                response = await llm.ainvoke(messages)

                return self._extract_text(response.content)

            except Exception as e:

                print(
                    f"[LLM Warning] OpenAI API call failed: "
                    f"{e}. Using fallback generator."
                )

                return await self._fallback_generate(
                    system_prompt,
                    user_prompt
                )

        # =====================================================
        # GEMINI
        # =====================================================

        elif (
            self.provider == "gemini"
            and self.gemini_key
            and "your-gemini-api-key" not in self.gemini_key
        ):

            try:
                # pyrefly: ignore [missing-import]
                from langchain_google_genai import (
                    ChatGoogleGenerativeAI
                )

                # pyrefly: ignore [missing-import]
                from langchain_core.messages import (
                    SystemMessage,
                    HumanMessage
                )

                # Gemini configuration intentionally avoids
                # deprecated sampling parameters for newer models.
                llm = ChatGoogleGenerativeAI(
                    model=self.model_name,
                    google_api_key=self.gemini_key
                )

                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=user_prompt)
                ]

                response = await llm.ainvoke(messages)

                return self._extract_text(
                    response.content
                )

            except Exception as e:

                print(
                    f"[LLM Warning] Gemini API call failed: "
                    f"{e}. Using fallback generator."
                )

                return await self._fallback_generate(
                    system_prompt,
                    user_prompt
                )

        # =====================================================
        # FALLBACK
        # =====================================================

        else:

            return await self._fallback_generate(
                system_prompt,
                user_prompt
            )

    # ---------------------------------------------------------
    # Streaming Response
    # ---------------------------------------------------------

    async def stream_response(
        self,
        system_prompt: str,
        user_prompt: str
    ) -> AsyncGenerator[str, None]:

        # =====================================================
        # OPENAI STREAMING
        # =====================================================

        if (
            self.provider == "openai"
            and self.openai_key
            and "your-openai-api-key" not in self.openai_key
        ):

            try:
                # pyrefly: ignore [missing-import]
                from langchain_openai import ChatOpenAI

                # pyrefly: ignore [missing-import]
                from langchain_core.messages import (
                    SystemMessage,
                    HumanMessage
                )

                llm = ChatOpenAI(
                    model=self.model_name,
                    temperature=0.7,
                    api_key=self.openai_key
                )

                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=user_prompt)
                ]

                async for chunk in llm.astream(messages):

                    if chunk.content:

                        text = self._extract_text(
                            chunk.content
                        )

                        if text:
                            yield text

                return

            except Exception as e:

                print(
                    f"[LLM Warning] OpenAI streaming failed: "
                    f"{e}. Falling back to chunked stream."
                )

        # =====================================================
        # GEMINI STREAMING
        # =====================================================

        elif (
            self.provider == "gemini"
            and self.gemini_key
            and "your-gemini-api-key" not in self.gemini_key
        ):

            try:
                # pyrefly: ignore [missing-import]
                from langchain_google_genai import (
                    ChatGoogleGenerativeAI
                )

                # pyrefly: ignore [missing-import]
                from langchain_core.messages import (
                    SystemMessage,
                    HumanMessage
                )

                llm = ChatGoogleGenerativeAI(
                    model=self.model_name,
                    google_api_key=self.gemini_key
                )

                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=user_prompt)
                ]

                async for chunk in llm.astream(messages):

                    if chunk.content:

                        text = self._extract_text(
                            chunk.content
                        )

                        if text:
                            yield text

                return

            except Exception as e:

                print(
                    f"[LLM Warning] Gemini streaming failed: "
                    f"{e}. Falling back to chunked stream."
                )

        # =====================================================
        # LOCAL FALLBACK STREAMING
        # =====================================================

        full_text = await self._fallback_generate(
            system_prompt,
            user_prompt
        )

        words = full_text.split(" ")

        for index, word in enumerate(words):

            chunk = (
                word
                if index == 0
                else " " + word
            )

            yield chunk

            await asyncio.sleep(0.02)

    # ---------------------------------------------------------
    # Local Intelligent Fallback
    # ---------------------------------------------------------

    async def _fallback_generate(
        self,
        system_prompt: str,
        user_prompt: str
    ) -> str:

        """
        Intelligent local fallback generator.

        Provides deterministic interview questions and
        feedback when an external LLM is unavailable.
        """

        prompt_lower = user_prompt.lower()
        system_lower = system_prompt.lower()

        # =====================================================
        # FINAL FEEDBACK
        # =====================================================

        if (
            "generate final end-of-interview evaluation feedback"
            in prompt_lower
            or "feedback format"
            in system_lower
        ):

            feedback_json = {

                "summary": (
                    "The candidate demonstrated strong foundational "
                    "knowledge across key AI enterprise concepts "
                    "including vector embeddings, RAG pipeline "
                    "construction, prompt engineering, and "
                    "agentic orchestration. They effectively "
                    "explained technical trade-offs while "
                    "identifying key areas for optimization."
                ),

                "strengths": [

                    "Solid understanding of vector search "
                    "mechanics and distance metrics "
                    "(cosine vs L2).",

                    "Clear architectural grasp of RAG indexing "
                    "pipelines and chunking strategies.",

                    "Practical knowledge of LangGraph state "
                    "machine node transitions and memory "
                    "persistence."
                ],

                "gaps": [

                    "Could deepen knowledge of production "
                    "hybrid search reranking "
                    "(BM25 + Cross-Encoders).",

                    "Needs further exposure to Model Context "
                    "Protocol (MCP) server-side tool definitions."
                ],

                "next": [

                    "Build a custom MCP server integrating "
                    "external database tools with dynamic "
                    "tool schemas.",

                    "Implement a reciprocal rank fusion "
                    "(RRF) reranker in your Chroma retrieval pipeline.",

                    "Benchmark LLM latency under heavy token "
                    "loads using async streaming."
                ]
            }

            return json.dumps(
                feedback_json,
                indent=2
            )

        # =====================================================
        # FOLLOW-UP QUESTION
        # =====================================================

        if (
            "follow-up" in system_lower
            or "followup" in system_lower
            or "digging deeper" in prompt_lower
        ):

            return (
                "That's a solid explanation. You mentioned "
                "indexing efficiency and context preservation — "
                "specifically, how would you handle chunk "
                "boundary overlap to ensure no semantic context "
                "is lost when embedding large technical documents?"
            )

        # =====================================================
        # EMBEDDINGS / VECTOR SEARCH
        # =====================================================

        if (
            "embeddings" in prompt_lower
            or "vector" in prompt_lower
        ):

            return (
                "Let's dive into Embeddings & Vector Search. "
                "Can you walk me through how vector embeddings "
                "map high-dimensional semantic relationships, "
                "and why cosine similarity is often preferred "
                "over Euclidean distance for dense text vectors?"
            )

        # =====================================================
        # RAG / PROMPT ENGINEERING
        # =====================================================

        elif (
            "prompt engineering" in prompt_lower
            or "rag" in prompt_lower
        ):

            return (
                "Great. Let's move to RAG & Prompt Engineering. "
                "In enterprise RAG systems, how do you mitigate "
                "hallucination risk when the retriever returns "
                "low-relevance chunks? How would you structure "
                "your system prompt to enforce strict context adherence?"
            )

        # =====================================================
        # AGENTIC AI / MCP / LANGGRAPH
        # =====================================================

        elif (
            "agent" in prompt_lower
            or "mcp" in prompt_lower
            or "langgraph" in prompt_lower
        ):

            return (
                "Let's explore Agentic AI & Model Context Protocol. "
                "How do stateful graph abstractions like LangGraph "
                "prevent infinite execution loops during complex "
                "tool calling, and how does MCP standardize "
                "dynamic tool execution for autonomous agents?"
            )

        # =====================================================
        # DOCKER / DEPLOYMENT
        # =====================================================

        elif (
            "docker" in prompt_lower
            or "deployment" in prompt_lower
        ):

            return (
                "Now let's discuss AI Deployment & Observability. "
                "When containerizing a vector search backend and "
                "FastAPI server with Docker, what strategies do "
                "you use to minimize container image size and "
                "optimize inference startup latency?"
            )

        # =====================================================
        # DEFAULT QUESTION
        # =====================================================

        else:

            return (
                "Welcome! To start off our technical assessment, "
                "could you explain how you designed your retrieval "
                "pipeline during your recent AI missions, "
                "highlighting the chunking strategy and embedding "
                "model you selected?"
            )


# =============================================================
# Global Singleton Instance
# =============================================================

llm_client = LLMWrapper()