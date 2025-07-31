from typing import List, Dict
from bs4 import BeautifulSoup
from ..utils.http_client import HttpClient
from .base_parser import BaseJobParser
from ..job_api import post_job
from ..utils.logger import setup_logger

logger = setup_logger("VivasoftParser")

class VivasoftJobParser(BaseJobParser):
    company = "Vivasoft"
    url = "https://vivasoftltd.com/career/"

    def fetch_jobs(self) -> List[Dict]:
        client = HttpClient()
        jobs = []
        try:
            resp = client.get(self.url, timeout=15)
            soup = BeautifulSoup(resp.text, "html.parser")
            
            # Find job titles - they are in h2 tags with specific classes
            job_titles = soup.find_all('h2', class_=['elementor-heading-title', 'elementor-size-default'])
            
            for title_elem in job_titles:
                title = title_elem.get_text(strip=True)
                
                # Skip non-job headings
                if not any(keyword in title.lower() for keyword in ['developer', 'engineer', 'analyst', 'manager', 'designer']):
                    continue
                
                # Extract location from title if present (like "Senior Angular Developer(Nepal)")
                location = "Dhaka"  # Default location
                if "(" in title and ")" in title:
                    location_match = title[title.find("(")+1:title.find(")")]
                    if location_match:
                        location = location_match
                        # Clean title by removing location part
                        title = title[:title.find("(")].strip()
                
                # Look for apply link near this job title
                apply_link = self.url
                parent_section = title_elem.find_parent()
                if parent_section:
                    # Look for apply link in the same section or nearby sections
                    apply_elem = parent_section.find_next('a', string=lambda text: 'Apply' in text if text else False)
                    if apply_elem and apply_elem.get('href'):
                        apply_link = apply_elem['href']
                        if not apply_link.startswith('http'):
                            apply_link = "https://vivasoftltd.com" + apply_link
                
                # Try to find job description nearby
                description = ""
                requirements = ""
                responsibilities = ""
                benefits = ""
                skills = ""
                experience_level = ""
                salary_range = ""
                
                desc_section = title_elem.find_parent()
                if desc_section:
                    # Look for paragraph or div with description
                    desc_elem = desc_section.find_next(['p', 'div'], string=lambda text: len(text.strip()) > 50 if text else False)
                    if desc_elem:
                        description = desc_elem.get_text(strip=True)[:500]  # Limit description length
                
                # Try to extract skills from title
                skill_keywords = ['react', 'angular', 'python', 'javascript', 'php', 'java', 'node', 'vue', '.net', 'laravel']
                title_lower = title.lower()
                found_skills = [skill for skill in skill_keywords if skill in title_lower]
                if found_skills:
                    skills = ', '.join(found_skills).title()
                
                # Extract experience level from title
                if 'senior' in title_lower:
                    experience_level = 'Senior Level (3-5 years)'
                elif 'junior' in title_lower:
                    experience_level = 'Junior Level (0-2 years)'
                elif 'lead' in title_lower or 'manager' in title_lower:
                    experience_level = 'Lead/Manager (5+ years)'
                else:
                    experience_level = 'Mid Level (2-4 years)'

                job = {
                    "title": title,
                    "company": self.company,
                    "location": location,
                    "type": "Full-Time",  # Default type
                    "description": description,
                    "requirements": requirements,
                    "responsibilities": responsibilities,
                    "benefits": benefits,
                    "skills": skills,
                    "experience_level": experience_level,
                    "salary_range": salary_range,
                    "apply_link": apply_link,
                    "source_url": self.url,
                    "posted_date": None  # Will be set to current date by database
                }
                jobs.append(job)
                post_job(job)
                logger.info(f"Found job: {title} in {location}")
                    
        except Exception as e:
            logger.error(f"Error scraping Vivasoft: {e}")
        
        logger.info(f"Found {len(jobs)} jobs from {self.company}")
        return jobs
