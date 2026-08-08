import json
from typing import Dict, Any, List, Tuple
from app.models.schemas import FeedbackData, TopicScore
from app.agent.llm import llm_client

VALID_VERDICTS = frozenset({"STRONG_HIRE", "HIRE", "BORDERLINE", "NO_HIRE"})


class FeedbackGenerator:
    """
    Generates schema-valid technical evaluation feedback matching technical-specs.md.
    Synthesizes candidate responses, strengths, identified gaps, verdict, and topic scores.
    """

    async def generate(
        self, candidate: Dict[str, Any], history: List[Dict[str, Any]], days_probed: List[int]
    ) -> FeedbackData:
        candidate_name = candidate.get("member", {}).get("name", "Candidate")
        candidate_role = candidate.get("member", {}).get("jobRole", "Engineer")

        system_prompt = (
            "You are a Senior Principal AI Architect conducting an end-of-interview evaluation.\n"
            "Generate final end-of-interview evaluation feedback in JSON format.\n"
            "The JSON output MUST contain exactly these keys:\n"
            "{\n"
            '  "summary": "Concise, honest summary of candidate performance",\n'
            '  "strengths": ["Strength 1"],\n'
            '  "gaps": ["Gap 1", "Gap 2"],\n'
            '  "next": ["Actionable step 1", "Actionable step 2"],\n'
            '  "verdict": "STRONG_HIRE | HIRE | BORDERLINE | NO_HIRE",\n'
            '  "topic_scores": [\n'
            '    {"day": 14, "subject": "RAG & Retrieval", "score": 72}\n'
            "  ]\n"
            "}\n\n"
            "Rules:\n"
            "- verdict criteria: STRONG_HIRE = deep accurate answers across most topics; "
            "HIRE = competent with minor gaps; BORDERLINE = mixed or shallow performance; "
            "NO_HIRE = non-substantive, incorrect, or missing competency.\n"
            "- strengths MUST be an empty array [] if no genuine strengths were demonstrated.\n"
            "- topic_scores MUST include one entry per probed curriculum day with score 0-100 "
            "reflecting actual answer quality on that day. Low scores for weak or dismissive answers.\n"
            "- Scores, verdict, summary, strengths, and gaps MUST tell the same story.\n"
            "DO NOT wrap in markdown code blocks. Output ONLY raw JSON."
        )

        turns_summary = ""
        for turn in history:
            turns_summary += (
                f"\n- Day {turn.get('day')} ({turn.get('day_title')}): "
                f"Question: {turn.get('question')} | Candidate Answer: {turn.get('answer')}"
            )

        user_prompt = (
            f"Candidate: {candidate_name} ({candidate_role})\n"
            f"Curriculum Days Probed: {days_probed}\n"
            f"Interview Q&A Turns:\n{turns_summary}\n\n"
            "Evaluate their responses accurately and provide feedback JSON."
        )

        try:
            raw_response = await llm_client.generate_response(system_prompt, user_prompt)
            parsed = json.loads(self._clean_json(raw_response))
            return self._build_feedback_from_parsed(parsed, candidate_name, days_probed, history)
        except Exception as e:
            print(f"[FeedbackGenerator Note] JSON parsing fallback: {e}")
            return self._fallback_feedback(candidate_name, days_probed, history)

    def _clean_json(self, raw: str) -> str:
        cleaned = raw.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return cleaned.strip()

    def _answer_metrics(self, history: List[Dict[str, Any]]) -> Tuple[float, float, List[str], List[str]]:
        short_answer_turns: List[str] = []
        detailed_answer_turns: List[str] = []
        total_words = 0

        for turn in history:
            ans = (turn.get("answer") or "").strip()
            word_count = len(ans.split())
            total_words += word_count
            day_label = f"Day {turn.get('day')} ({turn.get('day_title', 'Topic')})"
            if word_count < 10:
                short_answer_turns.append(day_label)
            else:
                detailed_answer_turns.append(day_label)

        avg_words = total_words / max(len(history), 1)
        short_ratio = len(short_answer_turns) / max(len(history), 1)
        return avg_words, short_ratio, short_answer_turns, detailed_answer_turns

    def _evaluate_answer_score(self, answer: str) -> int:
        ans = (answer or "").strip()
        if not ans:
            return 5

        words = ans.split()
        word_count = len(words)
        ans_lower = ans.lower()

        # Check for dismissive / low-effort responses
        dismissive_phrases = {
            "idk", "no idea", "pass", "n/a", "dont know", "don't know",
            "maybe", "sure", "ok", "yes", "no", "none", "skip", "idk man"
        }
        if ans_lower in dismissive_phrases or (word_count <= 2 and any(p in ans_lower for p in dismissive_phrases)):
            base = 5 + (len(ans) * 3) + (hash(ans_lower) % 5)
            return max(5, min(18, base))

        # Continuous base score calculation based on word count & character length
        if word_count < 5:
            base_score = 15 + word_count * 3 + len(ans) * 0.2
        elif word_count < 15:
            base_score = 30 + (word_count - 5) * 2.5 + len(ans) * 0.1
        elif word_count < 30:
            base_score = 55 + (word_count - 15) * 1.2 + (len(ans) % 7) * 0.4
        else:
            base_score = 75 + min(15, (word_count - 30) * 0.35 + (len(ans) % 5) * 0.5)

        # Technical keyword substance bonus
        tech_keywords = {
            "vector", "vectors", "embedding", "embeddings", "rag", "retrieval", "chroma", "chromadb",
            "prompt", "prompts", "prompting", "llm", "llms", "fastapi", "langgraph", "agent", "agents",
            "mcp", "protocol", "docker", "kubernetes", "k8s", "latency", "tokens", "token", "cosine",
            "similarity", "chunking", "chunk", "chunks", "splitter", "indexing", "index", "context",
            "schema", "observability", "monitoring", "ollama", "qwen", "fine-tuning", "evaluation",
            "evals", "metadata", "ingestion", "pipeline", "containerized", "cross-encoders", "reranking"
        }

        found_keywords = {w.strip(".,!?;:()[]\"'") for w in words if w.strip(".,!?;:()[]\"'").lower() in tech_keywords}
        keyword_bonus = min(15, len(found_keywords) * 2)

        final_score = int(round(base_score + keyword_bonus))
        return max(5, min(100, final_score))

    def _topic_scores_from_history(self, history: List[Dict[str, Any]]) -> List[TopicScore]:
        day_buckets: Dict[int, Dict[str, Any]] = {}
        for turn in history:
            day = turn.get("day")
            if day is None:
                continue
            ans = (turn.get("answer") or "").strip()
            title = turn.get("day_title") or f"Day {day}"
            turn_score = self._evaluate_answer_score(ans)
            if day not in day_buckets:
                day_buckets[day] = {"title": title, "scores": []}
            day_buckets[day]["scores"].append(turn_score)

        scores: List[TopicScore] = []
        for day in sorted(day_buckets.keys()):
            bucket = day_buckets[day]
            avg_score = sum(bucket["scores"]) / len(bucket["scores"])
            scores.append(
                TopicScore(
                    day=day,
                    subject=bucket["title"],
                    score=int(round(avg_score)),
                )
            )
        return scores

    def _verdict_from_metrics(
        self, avg_words: float, short_ratio: float, topic_scores: List[TopicScore]
    ) -> str:
        avg_score = (
            sum(ts.score for ts in topic_scores) / len(topic_scores) if topic_scores else 0
        )

        if avg_words < 8 or short_ratio >= 0.85 or avg_score <= 22:
            return "NO_HIRE"
        if avg_words < 12 or short_ratio >= 0.6 or avg_score <= 40:
            return "BORDERLINE"
        if avg_words >= 35 and short_ratio <= 0.2 and avg_score >= 70:
            return "STRONG_HIRE"
        if avg_words >= 12 and avg_score >= 50:
            return "HIRE"
        return "BORDERLINE"

    def _parse_topic_scores(
        self, raw_scores: Any, history: List[Dict[str, Any]]
    ) -> List[TopicScore]:
        if not isinstance(raw_scores, list) or not raw_scores:
            return self._topic_scores_from_history(history)

        parsed: List[TopicScore] = []
        for item in raw_scores:
            if not isinstance(item, dict):
                continue
            day = item.get("day")
            subject = item.get("subject") or item.get("title")
            score = item.get("score")
            if day is None or subject is None or score is None:
                continue
            try:
                parsed.append(
                    TopicScore(
                        day=int(day),
                        subject=str(subject),
                        score=max(0, min(100, int(score))),
                    )
                )
            except (TypeError, ValueError):
                continue

        return parsed if parsed else self._topic_scores_from_history(history)

    def _normalize_verdict(self, verdict: Any, history: List[Dict[str, Any]]) -> str:
        if isinstance(verdict, str):
            normalized = verdict.strip().upper().replace(" ", "_")
            if normalized in VALID_VERDICTS:
                return normalized

        avg_words, short_ratio, _, _ = self._answer_metrics(history)
        topic_scores = self._topic_scores_from_history(history)
        return self._verdict_from_metrics(avg_words, short_ratio, topic_scores)

    def _build_feedback_from_parsed(
        self,
        parsed: Dict[str, Any],
        name: str,
        days_probed: List[int],
        history: List[Dict[str, Any]],
    ) -> FeedbackData:
        avg_words, short_ratio, short_answer_turns, detailed_answer_turns = self._answer_metrics(history)
        topic_scores = self._parse_topic_scores(parsed.get("topic_scores"), history)
        verdict = self._normalize_verdict(parsed.get("verdict"), history)

        summary = parsed.get("summary")
        if not summary:
            summary = self._fallback_summary(name, days_probed, avg_words, short_ratio)

        strengths = parsed.get("strengths")
        if not isinstance(strengths, list):
            strengths = []
        strengths = [s for s in strengths if isinstance(s, str) and s.strip()]

        gaps = parsed.get("gaps")
        if not isinstance(gaps, list) or not gaps:
            gaps = self._fallback_gaps(short_answer_turns, avg_words)

        next_steps = parsed.get("next")
        if not isinstance(next_steps, list) or not next_steps:
            next_steps = self._fallback_next(avg_words)

        if avg_words < 12 and verdict in {"STRONG_HIRE", "HIRE"}:
            verdict = self._verdict_from_metrics(avg_words, short_ratio, topic_scores)

        if avg_words < 12 and strengths:
            strengths = []

        return FeedbackData(
            summary=summary,
            strengths=strengths,
            gaps=gaps,
            next=next_steps,
            verdict=verdict,
            topic_scores=topic_scores,
        )

    def _fallback_summary(
        self, name: str, days_probed: List[int], avg_words: float, short_ratio: float
    ) -> str:
        probed_str = ", ".join(map(str, days_probed))
        if avg_words < 12:
            return (
                f"{name} completed the technical interview covering curriculum days [{probed_str}]. "
                f"However, responses were overly brief (average {avg_words:.1f} words per answer), "
                "demonstrating limited depth and incomplete technical justification."
            )
        return (
            f"{name} completed the technical interview spanning {len(days_probed)} curriculum days "
            f"(days {probed_str}). They provided substantive answers (average {avg_words:.1f} words per turn) "
            "addressing core enterprise AI topics."
        )

    def _fallback_gaps(self, short_answer_turns: List[str], avg_words: float) -> List[str]:
        if avg_words < 12:
            return [
                (
                    f"Provided superficial or incomplete answers on: {', '.join(short_answer_turns[:3])}."
                    if short_answer_turns
                    else "Responses lacked detailed architectural explanations."
                ),
                "Failed to articulate practical trade-offs or step-by-step technical implementations.",
            ]
        return ["Could expand further on production edge-case handling and latency optimization."]

    def _fallback_next(self, avg_words: float) -> List[str]:
        if avg_words < 12:
            return [
                "Practice providing structured, detailed answers with code/architecture examples.",
                "Review foundational objectives for RAG indexing, prompt engineering, and agentic workflows.",
            ]
        return [
            "Build hands-on capstone projects integrating LangGraph agents with Chroma DB.",
            "Implement robust error recovery and monitoring for production LLM pipelines.",
        ]

    def _fallback_feedback(self, name: str, days_probed: List[int], history: List[Dict[str, Any]]) -> FeedbackData:
        """
        Honest fallback evaluator based on heuristics from candidate answer history.
        Degrades realistically without giving unearned praise for short/empty answers.
        """
        avg_words, short_ratio, short_answer_turns, detailed_answer_turns = self._answer_metrics(history)
        probed_str = ", ".join(map(str, days_probed))
        topic_scores = self._topic_scores_from_history(history)
        verdict = self._verdict_from_metrics(avg_words, short_ratio, topic_scores)

        if avg_words < 12:
            summary = (
                f"{name} completed the technical interview covering curriculum days [{probed_str}]. "
                f"However, responses were overly brief (average {avg_words:.1f} words per answer), "
                "demonstrating limited depth and incomplete technical justification."
            )
            strengths: List[str] = []
            gaps = [
                (
                    f"Provided superficial or incomplete answers on: {', '.join(short_answer_turns[:3])}."
                    if short_answer_turns
                    else "Responses lacked detailed architectural explanations."
                ),
                "Failed to articulate practical trade-offs or step-by-step technical implementations.",
            ]
            next = [
                "Practice providing structured, detailed answers with code/architecture examples.",
                "Review foundational objectives for RAG indexing, prompt engineering, and agentic workflows.",
            ]
        else:
            summary = (
                f"{name} completed an 8-turn technical interview spanning {len(days_probed)} curriculum days "
                f"(days {probed_str}). They provided substantive answers (average {avg_words:.1f} words per turn) "
                "addressing core enterprise AI topics."
            )
            strengths = [
                f"Demonstrated technical communication on {', '.join(detailed_answer_turns[:3])}.",
                "Articulated system concepts and practical developer workflows.",
            ]
            gaps = (
                [f"Could provide deeper explanations on: {', '.join(short_answer_turns)}."]
                if short_answer_turns
                else ["Could expand further on production edge-case handling and latency optimization."]
            )
            next = [
                "Build hands-on capstone projects integrating LangGraph agents with Chroma DB.",
                "Implement robust error recovery and monitoring for production LLM pipelines.",
            ]

        return FeedbackData(
            summary=summary,
            strengths=strengths,
            gaps=gaps,
            next=next,
            verdict=verdict,
            topic_scores=topic_scores,
        )


feedback_engine = FeedbackGenerator()
