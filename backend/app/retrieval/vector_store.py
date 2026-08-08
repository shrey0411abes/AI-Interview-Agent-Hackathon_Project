import json
import os
from typing import List, Dict, Any, Optional
# pyrefly: ignore [missing-import]
import chromadb
# pyrefly: ignore [missing-import]
from chromadb.config import Settings


class CurriculumVectorStore:
    """
    In-memory Chroma vector database wrapper for grounding interview questions in curriculum.json.
    Ensures zero hallucinated course content.
    """
    def __init__(self, data_path: Optional[str] = None):
        if data_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            data_path = os.path.join(base_dir, "data", "curriculum.json")
        
        self.data_path = data_path
        self.indexing_failed = False
        try:
            self.chroma_client = chromadb.Client(Settings(anonymized_telemetry=False, is_persistent=False))
            self.collection = self.chroma_client.get_or_create_collection(name="curriculum_days")
        except Exception as e:
            print(f"[Chroma Vector Store] Client init warning: {e}. Defaulting to keyword search.")
            self.indexing_failed = True
            self.collection = None
        self.days_by_num: Dict[int, Dict[str, Any]] = {}
        self._load_and_index_curriculum()

    def _load_and_index_curriculum(self):
        """Loads curriculum.json and populates Chroma vector store."""
        if not os.path.exists(self.data_path):
            print(f"[Warning] Curriculum data file not found at {self.data_path}")
            return

        with open(self.data_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        days = data.get("days", [])
        documents = []
        metadatas = []
        ids = []

        for item in days:
            day_num = item.get("day")
            title = item.get("title", "")
            day_type = item.get("type", "")
            tools = ", ".join(item.get("tools", []))
            objectives = "; ".join(item.get("objectives", []))

            # Store in lookup dict
            self.days_by_num[day_num] = item

            # Form rich text representation for vector indexing
            content = (
                f"Curriculum Day {day_num}: {title}\n"
                f"Type: {day_type}\n"
                f"Tools & Tech: {tools}\n"
                f"Learning Objectives:\n{objectives}"
            )

            documents.append(content)
            metadatas.append({
                "day": day_num,
                "title": title,
                "type": day_type,
                "tools": tools,
            })
            ids.append(f"day_{day_num}")

        if documents and self.collection is not None:
            try:
                self.collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
                print(f"[Chroma Vector Store] Successfully indexed {len(documents)} curriculum days.")
            except Exception as e:
                print(f"[Chroma Vector Store] Embedding model load/indexing failed: {e}. Gracefully falling back to keyword search.")
                self.indexing_failed = True

    def get_day(self, day_num: int) -> Optional[Dict[str, Any]]:
        """Retrieve exact day data by day number."""
        return self.days_by_num.get(day_num)

    def search_curriculum(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Semantic search against curriculum vector store."""
        if self.indexing_failed or self.collection is None:
            return self._keyword_search(query, top_k)

        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=min(top_k, len(self.days_by_num))
            )
            retrieved = []
            if results and "metadatas" in results and results["metadatas"]:
                for meta, doc in zip(results["metadatas"][0], results["documents"][0]):
                    day_num = meta["day"]
                    full_day_info = self.days_by_num.get(day_num, {})
                    retrieved.append({
                        "day": day_num,
                        "title": meta["title"],
                        "tools": full_day_info.get("tools", []),
                        "objectives": full_day_info.get("objectives", []),
                        "content": doc
                    })
            return retrieved if retrieved else self._keyword_search(query, top_k)
        except Exception as e:
            print(f"[Chroma Vector Store] Search query note: {e}. Falling back to keyword search.")
            return self._keyword_search(query, top_k)
            # Fallback search if query vectorizer is unavailable
            return self._keyword_search(query, top_k)

    def _keyword_search(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        """Fallback keyword-matching search across curriculum topics."""
        query_words = set(query.lower().split())
        scored = []
        for day_num, day_info in self.days_by_num.items():
            text = f"{day_info.get('title', '')} {' '.join(day_info.get('tools', []))} {' '.join(day_info.get('objectives', []))}".lower()
            score = sum(1 for w in query_words if w in text)
            scored.append((score, day_num, day_info))
        
        scored.sort(key=lambda x: x[0], reverse=True)
        return [
            {
                "day": info["day"],
                "title": info["title"],
                "tools": info.get("tools", []),
                "objectives": info.get("objectives", []),
                "content": f"Day {info['day']}: {info['title']}"
            }
            for _, _, info in scored[:top_k]
        ]


# Global singleton instance
vector_store = CurriculumVectorStore()
