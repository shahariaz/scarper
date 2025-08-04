from typing import List, Dict
from bs4 import BeautifulSoup
from ..utils.http_client import HttpClient
from .base_parser import BaseJobParser
from ..job_api import post_job
from ..utils.logger import setup_logger

logger = setup_logger("DSInnovatorsParser")

class DSInnovatorsJobParser(BaseJobParser):
    company = "Data Soft"
    url = "https://apply.workable.com/dsinnovators/"

    def fetch_jobs(self) -> List[Dict]:
        client = HttpClient()
        jobs = []
        try:
            resp = client.get(self.url, timeout=15)
            soup = BeautifulSoup(resp.text, "html.parser")
            
            # Workable uses specific patterns - look for job links
            job_links = soup.find_all('a', href=lambda x: x and ('/jobs/' in x or '/j/' in x) if x else False)
            
            for link in job_links:
                title = link.get_text(strip=True)
                
                # Skip if no meaningful title
                if not title or len(title) < 5:
                    continue
                
                # Build apply link
                apply_link = link.get('href', self.url)
                if not apply_link.startswith('http'):
                    apply_link = "https://apply.workable.com" + apply_link
                
                # Extract location and type from nearby elements or title
                location = "Dhaka"
                job_type = "Full-Time"
                
                # Look for location in parent or sibling elements
                parent = link.find_parent()
                if parent:
                    location_text = parent.get_text()
                    if any(loc in location_text.lower() for loc in ['dhaka', 'bangladesh', 'chittagong', 'remote']):
                        for loc in ['dhaka', 'bangladesh', 'chittagong', 'remote']:
                            if loc in location_text.lower():
                                location = loc.title()
                                break
                
                job = {
                    "title": title,
                    "company": self.company,
                    "location": location,
                    "type": job_type,
                    "description": "",
                    "apply_link": apply_link
                }
                jobs.append(job)
                post_job(job, job_source='scraped', created_by='DSInnovators')
                logger.info(f"Found job: {title}")
            
            # Alternative: Look for Workable-specific job containers
            if not jobs:
                job_containers = soup.find_all(['li', 'div'], attrs={'data-ui': lambda x: x and 'job' in x if x else False})
                
                for container in job_containers:
                    title_elem = container.find(['h3', 'h4', 'a'])
                    if title_elem:
                        title = title_elem.get_text(strip=True)
                        if title and len(title) > 5:
                            apply_link = self.url
                            if title_elem.name == 'a' and title_elem.get('href'):
                                apply_link = title_elem['href']
                                if not apply_link.startswith('http'):
                                    apply_link = "https://apply.workable.com" + apply_link
                            
                            job = {
                                "title": title,
                                "company": self.company,
                                "location": "Dhaka",
                                "type": "Full-Time",
                                "description": "",
                                "apply_link": apply_link
                            }
                            jobs.append(job)
                            post_job(job, job_source='scraped', created_by='DSInnovators')
                            logger.info(f"Found job: {title}")
                    
        except Exception as e:
            logger.error(f"Error scraping DS Innovators: {e}")
        
        logger.info(f"Found {len(jobs)} jobs from {self.company}")
        return jobs
