from typing import List, Dict
from bs4 import BeautifulSoup
from ..utils.http_client import HttpClient
from .base_parser import BaseJobParser
from ..job_api import post_job
from ..utils.logger import setup_logger

logger = setup_logger("SeliseParser")

class SeliseJobParser(BaseJobParser):
    company = "Selise Group"
    url = "https://selisegroup.com/about-us/#jobs-main-container"

    def fetch_jobs(self) -> List[Dict]:
        client = HttpClient()
        jobs = []
        try:
            resp = client.get(self.url, timeout=15)
            soup = BeautifulSoup(resp.text, "html.parser")
            
            # Look for job containers
            job_cards = soup.select("div#jobs-main-container .job-card, .job-item, .career-item")
            
            for card in job_cards:
                title_elem = card.select_one("h3, h4, .job-title, .position-title")
                title = title_elem.get_text(strip=True) if title_elem else ""
                
                location_elem = card.select_one(".location, .job-location, .workplace")
                location = location_elem.get_text(strip=True) if location_elem else "Dhaka"
                
                type_elem = card.select_one(".job-type, .employment-type")
                job_type = type_elem.get_text(strip=True) if type_elem else "Full-Time"
                
                desc_elem = card.select_one(".job-description, .description, p")
                desc = desc_elem.get_text(strip=True) if desc_elem else ""
                
                apply_link_elem = card.select_one("a")
                apply_link = apply_link_elem["href"] if apply_link_elem and apply_link_elem.has_attr("href") else self.url
                
                if title:  # Only add if we found a title
                    job = {
                        "title": title,
                        "company": self.company,
                        "location": location,
                        "type": job_type,
                        "description": desc,
                        "apply_link": apply_link
                    }
                    jobs.append(job)
                    post_job(job, job_source='scraped', created_by='Selise')
                    
        except Exception as e:
            logger.error(f"Error scraping Selise: {e}")
        
        logger.info(f"Found {len(jobs)} jobs from {self.company}")
        return jobs
