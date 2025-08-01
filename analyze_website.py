#!/usr/bin/env python3
"""
Website analyzer to understand job page structures.
"""

import requests
from bs4 import BeautifulSoup
import sys

def analyze_website(url):
    try:
        print(f"Analyzing: {url}")
        resp = requests.get(url, timeout=15)
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        print("\n=== Job-related headings ===")
        headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        for h in headings:
            text = h.get_text().strip()
            if any(word in text.lower() for word in ['developer', 'engineer', 'position', 'job', 'career', 'angular']):
                print(f"{h.name}: {text}")
                print(f"  Classes: {h.get('class')}")
                if h.parent:
                    print(f"  Parent: {h.parent.name} - {h.parent.get('class')}")
                print()
        
        print("\n=== Apply/Career links ===")
        links = soup.find_all('a')
        for link in links:
            text = link.get_text().strip()
            href = link.get('href', '')
            if any(word in text.lower() for word in ['apply', 'career', 'job']) and href:
                print(f"Text: {text}")
                print(f"Href: {href}")
                print()
        
        print("\n=== Potential job containers ===")
        # Look for divs/sections that might contain jobs
        job_keywords = ['job', 'career', 'position', 'opening', 'vacancy']
        for keyword in job_keywords:
            containers = soup.find_all(['div', 'section'], class_=lambda x: x and keyword in ' '.join(x).lower() if x else False)
            if containers:
                print(f"Found {len(containers)} containers with '{keyword}' in class")
                for container in containers[:3]:  # Show first 3
                    print(f"  Classes: {container.get('class')}")
                    print(f"  Content preview: {container.get_text()[:100]}...")
                    print()
                    
    except Exception as e:
        print(f"Error analyzing {url}: {e}")

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "https://vivasoftltd.com/career/"
    analyze_website(url)
