from typing import List, Dict
from bs4 import BeautifulSoup
from ..utils.http_client import HttpClient
from .base_parser import BaseJobParser
from ..job_api import post_job
from ..utils.logger import setup_logger

logger = setup_logger("ShopUpParser")

class ShopUpJobParser(BaseJobParser):
    company = "ShopUp"
    url = "https://careers.smartrecruiters.com/ShopUp"

    def fetch_jobs(self) -> List[Dict]:
        client = HttpClient()
        jobs = []
        try:
            resp = client.get(self.url, timeout=15)
            soup = BeautifulSoup(resp.text, "html.parser")
            
            # SmartRecruiters structure - look for job links and containers
            job_links = soup.find_all('a', href=lambda x: x and '/jobs/' in x if x else False)
            
            for link in job_links:
                title = link.get_text(strip=True)
                
                # Skip empty or very short titles
                if not title or len(title) < 5:
                    continue
                    
                # Build apply link
                apply_link = link.get('href', self.url)
                if not apply_link.startswith('http'):
                    apply_link = "https://careers.smartrecruiters.com" + apply_link
                
                # Try to extract location from nearby elements
                location = "Dhaka"
                location_elem = link.find_next(['span', 'div'], string=lambda text: any(loc in text.lower() if text else False for loc in ['dhaka', 'bangladesh', 'chittagong', 'sylhet', 'remote']))
                if location_elem:
                    location = location_elem.get_text(strip=True)
                
                # Try to extract job type
                job_type = "Full-Time"
                type_elem = link.find_next(['span', 'div'], string=lambda text: any(jtype in text.lower() if text else False for jtype in ['full-time', 'part-time', 'contract', 'internship']))
                if type_elem:
                    job_type = type_elem.get_text(strip=True)
                
                job = {
                    "title": title,
                    "company": self.company,
                    "location": location,
                    "type": job_type,
                    "description": "",
                    "apply_link": apply_link
                }
                jobs.append(job)
                post_job(job, job_source='scraped', created_by='ShopUp')
                logger.info(f"Found job: {title}")
            
            # Alternative: Look for job containers with specific classes
            if not jobs:
                job_containers = soup.find_all(['div', 'li'], class_=lambda x: x and any(keyword in ' '.join(x).lower() for keyword in ['job', 'opening', 'position']) if x else False)
                
                for container in job_containers:
                    title_elem = container.find(['h3', 'h4', 'a'])
                    if title_elem:
                        title = title_elem.get_text(strip=True)
                        if title and len(title) > 5:
                            apply_link = self.url
                            if title_elem.name == 'a' and title_elem.get('href'):
                                apply_link = title_elem['href']
                                if not apply_link.startswith('http'):
                                    apply_link = "https://careers.smartrecruiters.com" + apply_link
                            
                            job = {
                                "title": title,
                                "company": self.company,
                                "location": "Dhaka",
                                "type": "Full-Time",
                                "description": "",
                                "apply_link": apply_link
                            }
                            jobs.append(job)
                            post_job(job, job_source='scraped', created_by='ShopUp')
                            logger.info(f"Found job: {title}")
                    
        except Exception as e:
            logger.error(f"Error scraping ShopUp: {e}")
        
        logger.info(f"Found {len(jobs)} jobs from {self.company}")
        return jobs
