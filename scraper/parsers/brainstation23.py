from typing import List, Dict
from bs4 import BeautifulSoup
from ..utils.http_client import HttpClient
from .base_parser import BaseJobParser
from ..job_api import post_job
from ..utils.logger import setup_logger

logger = setup_logger("BrainStation23Parser")

class BrainStation23JobParser(BaseJobParser):
    company = "Brain Station 23"
    url = "https://brainstation-23.easy.jobs/"

    def fetch_jobs(self) -> List[Dict]:
        client = HttpClient()
        jobs = []
        try:
            resp = client.get(self.url, timeout=15)
            soup = BeautifulSoup(resp.text, "html.parser")
            
            # Find job titles - they are in h4 tags with class 'job-header__title'
            job_titles = soup.find_all('h4', class_='job-header__title')
            
            for title_elem in job_titles:
                title = title_elem.get_text(strip=True)
                
                # Find the parent container to get additional info
                job_container = title_elem.find_parent()
                
                # Look for apply link in the same container or nearby
                apply_link = self.url
                apply_elem = job_container.find_next('a', string='Apply Now') if job_container else None
                if apply_elem and apply_elem.get('href'):
                    apply_link = apply_elem['href']
                    if not apply_link.startswith('http'):
                        apply_link = "https://brainstation-23.easy.jobs" + apply_link
                
                # Try to extract location and other details from the job container
                location = "Dhaka"  # Default location for Brain Station 23
                job_type = "Full-Time"  # Default type
                
                # Look for additional job details in the container  
                description = ""
                if job_container:
                    # Try to find description or requirements nearby
                    desc_elem = job_container.find_next(['p', 'div'], string=lambda text: len(text.strip()) > 30 if text else False)
                    if desc_elem:
                        description = desc_elem.get_text(strip=True)[:300]  # Limit description
                
                job = {
                    "title": title,
                    "company": self.company,
                    "location": location,
                    "type": job_type,
                    "description": description,
                    "apply_link": apply_link
                }
                jobs.append(job)
                post_job(job)
                logger.info(f"Found job: {title}")
                    
        except Exception as e:
            logger.error(f"Error scraping Brain Station 23: {e}")
        
        logger.info(f"Found {len(jobs)} jobs from {self.company}")
        return jobs
