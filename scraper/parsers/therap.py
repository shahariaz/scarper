from typing import List, Dict
from bs4 import BeautifulSoup
from ..utils.http_client import HttpClient
from .base_parser import BaseJobParser
from ..job_api import post_job
from ..utils.logger import setup_logger

logger = setup_logger("TherapParser")

class TherapJobParser(BaseJobParser):
    company = "Therap Services"
    url = "https://therap.hire.trakstar.com/"

    def fetch_jobs(self) -> List[Dict]:
        client = HttpClient()
        jobs = []
        try:
            resp = client.get(self.url, timeout=15)
            soup = BeautifulSoup(resp.text, "html.parser")
            
            # Look for job title headings with specific classes from Trakstar
            job_titles = soup.select("h3.js-job-list-opening-name")
            
            for title_elem in job_titles:
                title = title_elem.get_text(strip=True)
                
                # Find the parent container for additional details
                job_container = title_elem.find_parent("div", class_=["col-md-6", "col-xs-6"])
                
                # Look for location info in the container
                location_elem = job_container.select_one(".location, .workplace") if job_container else None
                location = location_elem.get_text(strip=True) if location_elem else "Dhaka, Bangladesh"
                
                # Default job type for Therap
                job_type = "Full-Time"
                
                # Look for description in the container
                desc_elem = job_container.select_one(".description, .summary") if job_container else None
                desc = desc_elem.get_text(strip=True) if desc_elem else f"Join {self.company} as a {title}"
                
                # Try to find apply link
                apply_link_elem = title_elem.find("a") if title_elem.name != "a" else title_elem
                if not apply_link_elem:
                    apply_link_elem = job_container.select_one("a") if job_container else None
                
                if apply_link_elem and apply_link_elem.has_attr("href"):
                    apply_link = apply_link_elem["href"]
                    if not apply_link.startswith("http"):
                        apply_link = "https://therap.hire.trakstar.com" + apply_link
                else:
                    apply_link = self.url
                
                if title:
                    job = {
                        "title": title,
                        "company": self.company,
                        "location": location,
                        "type": job_type,
                        "description": desc,
                        "apply_link": apply_link
                    }
                    jobs.append(job)
                    post_job(job)
                    
        except Exception as e:
            logger.error(f"Error scraping Therap: {e}")
        
        logger.info(f"Found {len(jobs)} jobs from {self.company}")
        return jobs
