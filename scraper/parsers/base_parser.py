from abc import ABC, abstractmethod
from typing import List, Dict

class BaseJobParser(ABC):
    company: str
    url: str

    @abstractmethod
    def fetch_jobs(self) -> List[Dict]:
        """Fetch and parse job listings from the career page."""
        pass
