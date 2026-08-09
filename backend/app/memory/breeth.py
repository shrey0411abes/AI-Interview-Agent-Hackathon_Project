import json
import os
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field


@dataclass
class CandidateMemoryRecord:
    candidate_id: str
    demonstrated_skills: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    misconceptions: List[str] = field(default_factory=list)
    important_answers: List[Dict[str, Any]] = field(default_factory=list)
    observations: List[Dict[str, Any]] = field(default_factory=list)


class BreethMemoryEngine:
    """
    Breeth persistent memory engine for AI Interview Agent.
    Stores structured candidate observations, demonstrated competencies, technical gaps,
    and historical answer insights across turns and sessions.
    Serves as the memory retrieval layer for Gemini's interviewer reasoning engine.
    """

    def __init__(self):
        # In-memory candidate memory index keyed by candidate_id
        self._memories: Dict[str, CandidateMemoryRecord] = {}

    def get_or_create_memory(self, candidate_id: str) -> CandidateMemoryRecord:
        if candidate_id not in self._memories:
            self._memories[candidate_id] = CandidateMemoryRecord(candidate_id=candidate_id)
        return self._memories[candidate_id]

    def store_observation(
        self,
        candidate_id: str,
        topic: str,
        observation_type: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Store a structured observation into candidate's Breeth memory.
        observation_type: 'skill' | 'weakness' | 'misconception' | 'important_answer' | 'observation'
        """
        memory = self.get_or_create_memory(candidate_id)
        entry = {
            "topic": topic,
            "content": content,
            "metadata": metadata or {},
        }

        if observation_type == "skill" and content not in memory.demonstrated_skills:
            memory.demonstrated_skills.append(content)
        elif observation_type == "weakness" and content not in memory.weaknesses:
            memory.weaknesses.append(content)
        elif observation_type == "misconception" and content not in memory.misconceptions:
            memory.misconceptions.append(content)
        elif observation_type == "important_answer":
            memory.important_answers.append(entry)
        else:
            memory.observations.append(entry)

        print(f"[BREETH_MEMORY_STORED] candidate={candidate_id} type={observation_type} topic='{topic}' content='{content[:60]}...'")

    def retrieve_relevant_memory(self, candidate_id: str, current_topic: str = "", limit: int = 5) -> Dict[str, Any]:
        """
        Retrieve structured candidate context relevant to current topic.
        """
        memory = self.get_or_create_memory(candidate_id)
        
        relevant_answers = [
            ans for ans in memory.important_answers
            if current_topic.lower() in ans.get("topic", "").lower() or not current_topic
        ][:limit]

        relevant_obs = [
            obs for obs in memory.observations
            if current_topic.lower() in obs.get("topic", "").lower() or not current_topic
        ][:limit]

        retrieved = {
            "demonstrated_skills": memory.demonstrated_skills[-limit:],
            "weaknesses": memory.weaknesses[-limit:],
            "misconceptions": memory.misconceptions[-limit:],
            "important_answers": relevant_answers,
            "observations": relevant_obs,
        }

        print(f"[BREETH_MEMORY_RETRIEVED] candidate={candidate_id} topic='{current_topic}' skills={len(retrieved['demonstrated_skills'])} weaknesses={len(retrieved['weaknesses'])}")
        return retrieved


# Global singleton instance of BreethMemoryEngine
breeth_memory = BreethMemoryEngine()
