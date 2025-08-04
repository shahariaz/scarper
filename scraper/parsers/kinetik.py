from typing import List, Dict
from bs4 import BeautifulSoup
from ..utils.http_client import HttpClient
from .base_parser import BaseJobParser
from ..job_api import post_job
from ..utils.logger import setup_logger

logger = setup_logger("KinetikParser")

class KinetikJobParser(BaseJobParser):
    company = "Kinetik"
    url = "https://job-boards.greenhouse.io/kinetik"

    def fetch_jobs(self) -> List[Dict]:
        client = HttpClient()
        jobs = []
        try:
            resp = client.get(self.url, timeout=15)
            soup = BeautifulSoup(resp.text, "html.parser")
            
            # Greenhouse typically uses specific patterns
            # Look for job links - they usually contain job titles
            job_links = soup.find_all('a', href=lambda x: x and '/jobs/' in x if x else False)
            
            for link in job_links:
                title = link.get_text(strip=True)
                
                # Skip if no meaningful title
                if not title or len(title) < 3:
                    continue
                
                # Extract job URL
                apply_link = link.get('href', self.url)
                if not apply_link.startswith('http'):
                    apply_link = "https://job-boards.greenhouse.io" + apply_link
                
                # Try to find location info nearby
                location = "Remote"  # Default for many Greenhouse jobs
                location_elem = link.find_next(['span', 'div'], string=lambda text: any(loc in text.lower() if text else False for loc in ['dhaka', 'bangladesh', 'remote', 'hybrid']))
                if location_elem:
                    location = location_elem.get_text(strip=True)
                
                job = {
                    "title": title,
                    "company": self.company,
                    "location": location,
                    "type": "Full-Time",
                    "description": "",
                    "apply_link": apply_link
                }
                jobs.append(job)
                post_job(job, job_source='scraped', created_by='Kinetik')
                logger.info(f"Found job: {title}")
            
            # If no job links found, try alternative Greenhouse patterns
            if not jobs:
                # Look for div elements with opening classes
                openings = soup.find_all(['div', 'section'], class_=lambda x: x and 'opening' in ' '.join(x).lower() if x else False)
                for opening in openings:
                    title_elem = opening.find(['h3', 'h4', 'a'])
                    if title_elem:
                        title = title_elem.get_text(strip=True)
                        if title and len(title) > 3:
                            apply_link = self.url
                            if title_elem.name == 'a' and title_elem.get('href'):
                                apply_link = title_elem['href']
                                if not apply_link.startswith('http'):
                                    apply_link = "https://job-boards.greenhouse.io" + apply_link
                            
                            job = {
                                "title": title,
                                "company": self.company,
                                "location": "Remote",
                                "type": "Full-Time",
                                "description": "",
                                "apply_link": apply_link
                            }
                            jobs.append(job)
                            post_job(job, job_source='scraped', created_by='Kinetik')
                            logger.info(f"Found job: {title}")
                    
        except Exception as e:
            logger.error(f"Error scraping Kinetik: {e}")
        
        logger.info(f"Found {len(jobs)} jobs from {self.company}")
        return jobs
