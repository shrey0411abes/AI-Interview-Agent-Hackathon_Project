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
    # Structured Answer Evaluation
    # ---------------------------------------------------------
    async def evaluate_answer(
        self,
        question: str,
        answer: str,
        context: str = ""
    ) -> Dict[str, Any]:
        """
        Evaluate candidate answer depth, correctness, misconceptions, and recommend next action.
        """
        if not answer or len(answer.split()) < 3:
            return {
                "quality": "dont_know" if any(w in answer.lower() for w in ["don't know", "dont know", "not sure", "no idea"]) else "weak",
                "correctness": 0.2,
                "technical_depth": 0.2,
                "precision": 0.2,
                "concepts_demonstrated": [],
                "missing_concepts": ["in-depth explanation"],
                "misconceptions": [],
                "recommended_action": "probe",
                "next_focus": "fundamental mechanism"
            }

        system_prompt = (
            "You are a senior AI technical interviewer evaluating a candidate's answer.\n"
            "Analyze the technical depth, correctness, and precision of the candidate's response.\n"
            "Return ONLY a valid JSON object with the following schema:\n"
            "{\n"
            '  "quality": "strong" | "partial" | "weak" | "dont_know" | "off_topic",\n'
            '  "correctness": float 0.0 to 1.0,\n'
            '  "technical_depth": float 0.0 to 1.0,\n'
            '  "precision": float 0.0 to 1.0,\n'
            '  "concepts_demonstrated": [string],\n'
            '  "missing_concepts": [string],\n'
            '  "misconceptions": [string],\n'
            '  "recommended_action": "escalate" | "probe" | "remediate" | "pivot",\n'
            '  "next_focus": string\n'
            "}"
        )

        user_prompt = (
            f"Question: {question}\n"
            f"Candidate Answer: {answer}\n"
            f"Topic Context: {context}\n"
            "Evaluate strictly and output JSON."
        )

        try:
            resp_text = await self.generate_response(system_prompt, user_prompt)
            # Find json substring if wrapped in markdown codeblock
            start_idx = resp_text.find('{')
            end_idx = resp_text.rfind('}')
            if start_idx != -1 and end_idx != -1:
                json_str = resp_text[start_idx:end_idx + 1]
                return json.loads(json_str)
        except Exception as e:
            print(f"[LLM Warning] Answer evaluation parsing failed: {e}. Using rule-based fallback evaluation.")

        # Fallback rule-based evaluation
        ans_lower = answer.lower()
        word_count = len(answer.split())
        is_dont_know = any(kw in ans_lower for kw in ["don't know", "dont know", "not sure", "no idea", "unsure"])

        if is_dont_know:
            return {
                "quality": "dont_know",
                "correctness": 0.1,
                "technical_depth": 0.1,
                "precision": 0.1,
                "concepts_demonstrated": [],
                "missing_concepts": ["concept familiarity"],
                "misconceptions": [],
                "recommended_action": "pivot",
                "next_focus": "foundational concepts"
            }

        if word_count > 25:
            return {
                "quality": "strong",
                "correctness": 0.85,
                "technical_depth": 0.8,
                "precision": 0.8,
                "concepts_demonstrated": ["technical explanation", "domain awareness"],
                "missing_concepts": [],
                "misconceptions": [],
                "recommended_action": "escalate",
                "next_focus": "advanced trade-offs and system design"
            }
        elif word_count > 8:
            return {
                "quality": "partial",
                "correctness": 0.65,
                "technical_depth": 0.5,
                "precision": 0.6,
                "concepts_demonstrated": ["basic principles"],
                "missing_concepts": ["edge-case handling", "production optimization"],
                "misconceptions": [],
                "recommended_action": "probe",
                "next_focus": "specific implementation details"
            }
        else:
            return {
                "quality": "weak",
                "correctness": 0.4,
                "technical_depth": 0.3,
                "precision": 0.3,
                "concepts_demonstrated": [],
                "missing_concepts": ["depth", "mechanisms"],
                "misconceptions": [],
                "recommended_action": "remediate",
                "next_focus": "diagnostic fundamentals"
            }

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
        Provides dynamic, state-aware non-repeating interview questions when LLM is unavailable.
        """
        prompt_lower = user_prompt.lower()
        system_lower = system_prompt.lower()

        # =====================================================
        # FINAL FEEDBACK
        # =====================================================
        if "generate final end-of-interview evaluation feedback" in prompt_lower or "feedback format" in system_lower:
            feedback_json = {
                "summary": "The candidate demonstrated strong foundational knowledge across key AI enterprise concepts including vector embeddings, RAG pipeline construction, prompt engineering, and agentic orchestration.",
                "strengths": [
                    "Solid understanding of vector search mechanics and distance metrics (cosine vs L2).",
                    "Clear architectural grasp of RAG indexing pipelines and chunking strategies.",
                    "Practical knowledge of LangGraph state machine node transitions and memory persistence."
                ],
                "gaps": [
                    "Could deepen knowledge of production hybrid search reranking (BM25 + Cross-Encoders).",
                    "Needs further exposure to Model Context Protocol (MCP) server-side tool definitions."
                ],
                "next": [
                    "Build a custom MCP server integrating external database tools with dynamic tool schemas.",
                    "Implement a reciprocal rank fusion (RRF) reranker in your Chroma retrieval pipeline.",
                    "Benchmark LLM latency under heavy token loads using async streaming."
                ]
            }
            return json.dumps(feedback_json, indent=2)

        # Dynamic fallback selection using prompt context to prevent duplicate outputs
        if "follow-up" in system_lower or "followup" in system_lower or "digging deeper" in prompt_lower:
            if "chunk" in prompt_lower or "overlap" in prompt_lower:
                return "When configuring chunk overlap in document indexing, what performance or accuracy metrics do you monitor to avoid redundant token overhead while preserving semantics?"
            elif "embedding" in prompt_lower or "vector" in prompt_lower:
                return "Given two vectors with a high cosine similarity score, how would you evaluate whether distance metrics alone are sufficient for ranking when metadata constraints are introduced?"
            elif "rag" in prompt_lower or "prompt" in prompt_lower:
                return "When low-relevance chunks are retrieved by your RAG pipeline, how do you dynamically adjust system prompt context to prevent model hallucination?"
            else:
                return "Taking that concept a step further, how would you handle error recovery or fallback strategies if your underlying vector index becomes temporarily unresponsive?"

        # Topic-specific questions with variated angles
        is_retry = "duplicate" in prompt_lower or "different" in prompt_lower

        # Topic-specific questions with variated angles for retries
        if "day 10" in prompt_lower or "rag" in prompt_lower or "retrieval" in prompt_lower:
            if is_retry:
                return "When low-relevance chunks are retrieved by your RAG pipeline, how do you dynamically adjust system prompt context to prevent model hallucination?"
            if "advanced" in prompt_lower or "escalate" in system_lower:
                return "In enterprise RAG architectures, how do you implement Reciprocal Rank Fusion (RRF) to combine keyword BM25 scores with dense vector similarity?"
            return "When building a production RAG pipeline, what strategy do you use for chunking technical documentation, and how do you evaluate chunk size vs retrieval recall?"

        elif "day 12" in prompt_lower or "agent" in prompt_lower or "langgraph" in prompt_lower:
            if is_retry:
                return "When designing multi-agent communication in LangGraph, how do you handle deadlocks or circular delegation between subagents?"
            if "advanced" in prompt_lower or "escalate" in system_lower:
                return "In LangGraph state machines, how do you pass transient state between conditional edge functions without mutating global checkpointed state?"
            return "How do stateful graph abstractions like LangGraph prevent infinite execution loops during multi-step tool execution in autonomous agents?"

        elif "day 16" in prompt_lower or "mcp" in prompt_lower or "protocol" in prompt_lower:
            if is_retry:
                return "What mechanisms do you implement to validate dynamic tool input JSON schemas before dispatching calls to MCP server endpoints?"
            return "Model Context Protocol (MCP) standardizes agent tool integration. How would you design a server-side MCP tool schema for secure database queries?"

        elif "day 22" in prompt_lower or "eval" in prompt_lower or "benchmark" in prompt_lower:
            if is_retry:
                return "What latency optimization techniques like speculative decoding or KV cache reuse do you apply to real-time streaming LLM services?"
            return "How do you systematically benchmark LLM response latency vs accuracy when deploying real-time streaming interfaces in enterprise applications?"

        elif "day 7" in prompt_lower or "embeddings" in prompt_lower or "vector" in prompt_lower:
            if is_retry:
                return "When configuring chunk overlap in document indexing, what performance or accuracy metrics do you monitor to avoid redundant token overhead while preserving semantics?"
            if "advanced" in prompt_lower or "escalate" in system_lower:
                return "When scaling vector search to millions of embeddings, how do approximate nearest neighbor (ANN) indexes like HNSW trade off recall for latency compared to flat index search?"
            return "Let's explore Vector Embeddings. Could you explain how semantic relationships are mapped into high-dimensional space, and when cosine similarity is preferred over Euclidean distance?"

        else:
            if is_retry:
                return "How do you monitor model drift and data distribution shifts in production LLM microservices?"
            return "To begin our technical evaluation, could you walk me through your overall approach to designing AI microservices, focusing on key architectural trade-offs you prioritize?"


# =============================================================
# Global Singleton Instance
# =============================================================

llm_client = LLMWrapper()