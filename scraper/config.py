import os
from typing import Dict, Optional

# API Configuration
API_URL = os.getenv("JOB_API_URL", "https://your-domain.com/api/jobs")
API_TOKEN = os.getenv("JOB_API_TOKEN", "")

# Scraping Configuration
REQUEST_TIMEOUT = 15
RETRY_COUNT = 3
SLEEP_BETWEEN_REQUESTS = 1
SLEEP_BETWEEN_RUNS = int(os.getenv("SLEEP_BETWEEN_RUNS", "3600"))  # 1 hour default

# Headers for requests (helps avoid blocking)
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

# Proxy Configuration (if needed)
PROXIES: Optional[Dict[str, str]] = None
# Example proxy configuration:
# PROXIES = {
#     "http": "http://proxy.example.com:8080",
#     "https": "https://proxy.example.com:8080"
# }

# Logging Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "[%(asctime)s] %(levelname)s - %(name)s - %(message)s"

# Dynamic scraping configuration
USE_PLAYWRIGHT = os.getenv("USE_PLAYWRIGHT", "false").lower() == "true"
HEADLESS_BROWSER = os.getenv("HEADLESS_BROWSER", "true").lower() == "true"
BROWSER_TIMEOUT = 30000  # 30 seconds
