from typing import List, Dict
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
from .base_parser import BaseJobParser
from ..job_api import post_job
from ..utils.logger import setup_logger
from ..config import HEADLESS_BROWSER, BROWSER_TIMEOUT

logger = setup_logger("DynamicParser")

class DynamicJobParser(BaseJobParser):
    """
    Template for parsing JavaScript-rendered job sites using Playwright.
    Copy this template and modify for specific dynamic sites.
    """
    company = "Dynamic Company"
    url = "https://example.com/careers"

    def fetch_jobs(self) -> List[Dict]:
        jobs = []
        try:
            with sync_playwright() as p:
                # Launch browser
                browser = p.chromium.launch(headless=HEADLESS_BROWSER)
                page = browser.new_page()
                
                # Set user agent to avoid detection
                page.set_extra_http_headers({
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                })
                
                # Navigate to the page
                page.goto(self.url, timeout=BROWSER_TIMEOUT)
                
                # Wait for content to load (adjust selector based on actual site)
                try:
                    page.wait_for_selector(".job-listing, .job-card, .career-item", timeout=10000)
                except:
                    logger.warning(f"Timeout waiting for job listings on {self.url}")
                
                # Additional wait for JavaScript to finish
                page.wait_for_timeout(3000)
                
                # Get page content
                content = page.content()
                browser.close()
                
                # Parse with BeautifulSoup
                soup = BeautifulSoup(content, "html.parser")
                job_cards = soup.select(".job-listing .job-card, .career-item")
                
                for card in job_cards:
                    # Extract job details (modify selectors based on site structure)
                    title_elem = card.select_one("h3, h4, .job-title, .position-title")
                    title = title_elem.get_text(strip=True) if title_elem else ""
                    
                    location_elem = card.select_one(".location, .job-location")
                    location = location_elem.get_text(strip=True) if location_elem else "Dhaka"
                    
                    type_elem = card.select_one(".job-type, .employment-type")
                    job_type = type_elem.get_text(strip=True) if type_elem else "Full-Time"
                    
                    desc_elem = card.select_one(".job-description, .description, p")
                    desc = desc_elem.get_text(strip=True) if desc_elem else ""
                    
                    apply_link_elem = card.select_one("a")
                    if apply_link_elem and apply_link_elem.has_attr("href"):
                        apply_link = apply_link_elem["href"]
                        if not apply_link.startswith("http"):
                            # Make relative URLs absolute
                            base_url = "/".join(self.url.split("/")[:3])
                            apply_link = base_url + apply_link
                    else:
                        apply_link = self.url
                    
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
                        post_job(job)
                
        except Exception as e:
            logger.error(f"Error scraping {self.company} with Playwright: {e}")
        
        logger.info(f"Found {len(jobs)} jobs from {self.company}")
        return jobs


# Example implementation for a specific site that requires JavaScript
class BrainStation23DynamicParser(DynamicJobParser):
    """Example of using the dynamic parser for Brain Station 23 if their site were JS-heavy."""
    company = "Brain Station 23 (Dynamic)"
    url = "https://brainstation-23.easy.jobs/"
    
    def fetch_jobs(self) -> List[Dict]:
        jobs = []
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=HEADLESS_BROWSER)
                page = browser.new_page()
                
                page.goto(self.url, timeout=BROWSER_TIMEOUT)
                
                # Wait for Easy Jobs to load
                try:
                    page.wait_for_selector(".easy-jobs-list, .job-item", timeout=15000)
                except:
                    logger.warning(f"Timeout waiting for Easy Jobs to load on {self.url}")
                
                # Sometimes need to click "Load More" buttons
                load_more_button = page.locator("button:has-text('Load More'), .load-more")
                if load_more_button.count() > 0:
                    try:
                        load_more_button.click()
                        page.wait_for_timeout(2000)
                    except:
                        pass
                
                content = page.content()
                browser.close()
                
                soup = BeautifulSoup(content, "html.parser")
                job_cards = soup.select(".job-item, .easy-job-item")
                
                for card in job_cards:
                    title_elem = card.select_one(".job-title, h3, h4")
                    title = title_elem.get_text(strip=True) if title_elem else ""
                    
                    if title:
                        job = {
                            "title": title,
                            "company": self.company,
                            "location": "Dhaka",
                            "type": "Full-Time",
                            "description": "",
                            "apply_link": self.url
                        }
                        jobs.append(job)
                        post_job(job)
                
        except Exception as e:
            logger.error(f"Error scraping {self.company}: {e}")
        
        return jobs
