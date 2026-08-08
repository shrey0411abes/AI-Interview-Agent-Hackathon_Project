import json
from typing import Dict, Any, List
from app.models.schemas import FeedbackData
from app.agent.llm import llm_client


class FeedbackGenerator:
    """
    Generates schema-valid technical evaluation feedback matching technical-specs.md.
    Synthesizes candidate responses, strengths, and identified gaps across probed curriculum days.
    """

    async def generate(
        self, candidate: Dict[str, Any], history: List[Dict[str, Any]], days_probed: List[int]
    ) -> FeedbackData:
        candidate_name = candidate.get("member", {}).get("name", "Candidate")
        candidate_role = candidate.get("member", {}).get("jobRole", "Engineer")

        # Construct summary prompt for LLM evaluation
        system_prompt = (
            "You are a Senior Principal AI Architect conducting an end-of-interview evaluation.\n"
            "Generate final end-of-interview evaluation feedback in JSON format matching technical-specs.md.\n"
            "The JSON output MUST have exactly these four key string arrays / strings:\n"
            "{\n"
            '  "summary": "Concise summary of candidate performance",\n'
            '  "strengths": ["Strength 1", "Strength 2", "Strength 3"],\n'
            '  "gaps": ["Gap 1", "Gap 2"],\n'
            '  "next": ["Actionable step 1", "Actionable step 2"]\n'
            "}\n"
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
            cleaned = raw_response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            parsed = json.loads(cleaned)
            return FeedbackData(
                summary=parsed.get("summary", f"{candidate_name} demonstrated good domain knowledge across probed modules."),
                strengths=parsed.get("strengths", ["Solid understanding of foundational concepts."]),
                gaps=parsed.get("gaps", ["Can improve depth on advanced tool configurations."]),
                next=parsed.get("next", ["Build hands-on production capstone projects."])
            )
        except Exception as e:
            print(f"[FeedbackGenerator Note] JSON parsing fallback: {e}")
            return self._fallback_feedback(candidate_name, days_probed, history)

    def _fallback_feedback(self, name: str, days_probed: List[int], history: List[Dict[str, Any]]) -> FeedbackData:
        """
        Honest fallback evaluator based on heuristics from candidate answer history.
        Degrades realistically without giving unearned praise for short/empty answers.
        """
        short_answer_turns = []
        detailed_answer_turns = []
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
        probed_str = ", ".join(map(str, days_probed))

        # Heuristic classification
        if avg_words < 12:
            summary = (
                f"{name} completed the technical interview covering curriculum days [{probed_str}]. "
                f"However, responses were overly brief (average {avg_words:.1f} words per answer), "
                "demonstrating limited depth and incomplete technical justification."
            )
            strengths = [
                f"Completed all required interview rounds across curriculum days [{probed_str}].",
                "Showed basic awareness of core AI course terms."
            ]
            gaps = [
                f"Provided superficial or incomplete answers on: {', '.join(short_answer_turns[:3])}." if short_answer_turns else "Responses lacked detailed architectural explanations.",
                "Failed to articulate practical trade-offs or step-by-step technical implementations."
            ]
            next = [
                "Practice providing structured, detailed answers with code/architecture examples.",
                "Review foundational objectives for RAG indexing, prompt engineering, and agentic workflows."
            ]
        else:
            summary = (
                f"{name} completed an 8-turn technical interview spanning {len(days_probed)} curriculum days "
                f"(days {probed_str}). They provided substantive answers (average {avg_words:.1f} words per turn) "
                "addressing core enterprise AI topics."
            )
            strengths = [
                f"Demonstrated technical communication on {', '.join(detailed_answer_turns[:3])}.",
                "Articulated system concepts and practical developer workflows."
            ]
            gaps = (
                [f"Could provide deeper explanations on: {', '.join(short_answer_turns)}."] if short_answer_turns else
                ["Could expand further on production edge-case handling and latency optimization."]
            )
            next = [
                "Build hands-on capstone projects integrating LangGraph agents with Chroma DB.",
                "Implement robust error recovery and monitoring for production LLM pipelines."
            ]

        return FeedbackData(
            summary=summary,
            strengths=strengths,
            gaps=gaps,
            next=next
        )


feedback_engine = FeedbackGenerator()
