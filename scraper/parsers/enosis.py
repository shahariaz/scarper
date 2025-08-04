from typing import List, Dict
from bs4 import BeautifulSoup
from ..utils.http_client import HttpClient
from .base_parser import BaseJobParser
from ..job_api import post_job
from ..utils.logger import setup_logger

logger = setup_logger("EnosisParser")

class EnosisJobParser(BaseJobParser):
    company = "Enosis"
    url = "https://enosisbd.pinpointhq.com/"

    def fetch_jobs(self) -> List[Dict]:
        client = HttpClient()
        jobs = []
        try:
            resp = client.get(self.url, timeout=15)
            soup = BeautifulSoup(resp.text, "html.parser")
            job_cards = soup.select("div[data-qa='job-listing']")
            for card in job_cards:
                title = card.select_one("h3").get_text(strip=True) if card.select_one("h3") else ""
                location = card.select_one(".job-location").get_text(strip=True) if card.select_one(".job-location") else ""
                job_type = card.select_one(".job-type").get_text(strip=True) if card.select_one(".job-type") else ""
                desc = card.select_one(".job-description").get_text(strip=True) if card.select_one(".job-description") else ""
                apply_link = card.select_one("a")
                apply_link = apply_link["href"] if apply_link and apply_link.has_attr("href") else self.url
                job = {
                    "title": title,
                    "company": self.company,
                    "location": location,
                    "type": job_type,
                    "description": desc,
                    "apply_link": apply_link
                }
                jobs.append(job)
                post_job(job, job_source='scraped', created_by='Enosis')
        except Exception as e:
            logger.error(f"Error scraping Enosis: {e}")
        return jobs
