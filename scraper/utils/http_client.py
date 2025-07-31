import requests
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
from typing import Optional, Dict, Any
import time
from ..config import DEFAULT_HEADERS, REQUEST_TIMEOUT, RETRY_COUNT, SLEEP_BETWEEN_REQUESTS

class HttpClient:
    def __init__(self, proxies: Optional[Dict[str, str]] = None, headers: Optional[Dict[str, str]] = None):
        self.session = requests.Session()
        
        # Setup retry strategy
        retries = Retry(
            total=RETRY_COUNT,
            backoff_factor=0.3,
            status_forcelist=[500, 502, 503, 504, 429]
        )
        
        self.session.mount('http://', HTTPAdapter(max_retries=retries))
        self.session.mount('https://', HTTPAdapter(max_retries=retries))
        
        # Set proxies if provided
        self.session.proxies = proxies or {}
        
        # Set headers
        combined_headers = DEFAULT_HEADERS.copy()
        if headers:
            combined_headers.update(headers)
        self.session.headers.update(combined_headers)
        
        self.last_request_time = 0

    def _rate_limit(self):
        """Simple rate limiting to avoid overwhelming servers."""
        elapsed = time.time() - self.last_request_time
        if elapsed < SLEEP_BETWEEN_REQUESTS:
            time.sleep(SLEEP_BETWEEN_REQUESTS - elapsed)
        self.last_request_time = time.time()

    def get(self, url: str, **kwargs) -> requests.Response:
        self._rate_limit()
        kwargs.setdefault('timeout', REQUEST_TIMEOUT)
        return self.session.get(url, **kwargs)

    def post(self, url: str, data: Any = None, json: Any = None, **kwargs) -> requests.Response:
        self._rate_limit()
        kwargs.setdefault('timeout', REQUEST_TIMEOUT)
        return self.session.post(url, data=data, json=json, **kwargs)
