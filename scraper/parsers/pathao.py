from typing import List, Dict
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from .base_parser import BaseJobParser
from ..job_api import post_job
from ..utils.logger import setup_logger
from ..config import HEADLESS_BROWSER, BROWSER_TIMEOUT

logger = setup_logger("PathaoParser")

class PathaoJobParser(BaseJobParser):
    company = "Pathao"
    url = "https://career.pathao.com/"

    def fetch_jobs(self) -> List[Dict]:
        jobs = []
        try:
            # Pathao's career page is likely JavaScript-heavy, use Playwright
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=HEADLESS_BROWSER)
                page = browser.new_page()
                
                # Set user agent to avoid detection
                page.set_extra_http_headers({
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                })
                
                page.goto(self.url, timeout=BROWSER_TIMEOUT)
                
                # Wait for content to load
                try:
                    page.wait_for_selector("h1, h2, h3, .job, .career, .position", timeout=15000)
                except:
                    logger.warning(f"Timeout waiting for content on {self.url}")
                
                # Additional wait for JavaScript
                page.wait_for_timeout(5000)
                
                content = page.content()
                browser.close()
                
                # Parse with BeautifulSoup
                soup = BeautifulSoup(content, "html.parser")
                
                # Look for job-related headings
                headings = soup.find_all(['h1', 'h2', 'h3', 'h4'])
                for heading in headings:
                    text = heading.get_text(strip=True)
                    if any(keyword in text.lower() for keyword in ['developer', 'engineer', 'manager', 'analyst', 'designer', 'specialist']):
                        # Look for apply link near this heading
                        apply_link = self.url
                        apply_elem = heading.find_next('a', string=lambda x: 'apply' in x.lower() if x else False)
                        if not apply_elem:
                            apply_elem = heading.find_parent().find('a') if heading.find_parent() else None
                        
                        if apply_elem and apply_elem.get('href'):
                            apply_link = apply_elem['href']
                            if not apply_link.startswith('http'):
                                apply_link = "https://career.pathao.com" + apply_link
                        
                        job = {
                            "title": text,
                            "company": self.company,
                            "location": "Dhaka",
                            "type": "Full-Time",
                            "description": "",
                            "apply_link": apply_link
                        }
                        jobs.append(job)
                        post_job(job, job_source='scraped', created_by='Pathao')
                        logger.info(f"Found job: {text}")
                
                # If no jobs found with headings, try looking for links or buttons
                if not jobs:
                    job_elements = soup.find_all(['a', 'button', 'div'], string=lambda x: any(keyword in x.lower() if x else False for keyword in ['developer', 'engineer', 'manager', 'position', 'job', 'career']))
                    
                    for element in job_elements[:10]:  # Limit to 10 to avoid spam
                        text = element.get_text(strip=True)
                        if len(text) > 5 and len(text) < 50:  # Reasonable title length
                            apply_link = self.url
                            if element.name == 'a' and element.get('href'):
                                apply_link = element['href']
                                if not apply_link.startswith('http'):
                                    apply_link = "https://career.pathao.com" + apply_link
                            
                            job = {
                                "title": text,
                                "company": self.company,
                                "location": "Dhaka",
                                "type": "Full-Time",
                                "description": "",
                                "apply_link": apply_link
                            }
                            jobs.append(job)
                            post_job(job, job_source='scraped', created_by='Pathao')
                            logger.info(f"Found job: {text}")
                
        except Exception as e:
            logger.error(f"Error scraping Pathao with Playwright: {e}")
            
            # Fallback to regular HTTP request
            try:
                from ..utils.http_client import HttpClient
                client = HttpClient()
                resp = client.get(self.url, timeout=15)
                soup = BeautifulSoup(resp.text, "html.parser")
                
                # Simple fallback parsing
                headings = soup.find_all(['h1', 'h2', 'h3'])
                for h in headings:
                    text = h.get_text(strip=True)
                    if any(keyword in text.lower() for keyword in ['developer', 'engineer', 'job']):
                        job = {
                            "title": text,
                            "company": self.company,
                            "location": "Dhaka",
                            "type": "Full-Time",
                            "description": "",
                            "apply_link": self.url
                        }
                        jobs.append(job)
                        post_job(job, job_source='scraped', created_by='Pathao')
                        logger.info(f"Found job (fallback): {text}")
                        
            except Exception as fallback_e:
                logger.error(f"Fallback parsing also failed: {fallback_e}")
        
        logger.info(f"Found {len(jobs)} jobs from {self.company}")
        return jobs
