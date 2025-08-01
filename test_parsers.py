#!/usr/bin/env python3
"""
Test script to verify all parsers are working correctly.
Run this to test individual parsers without posting to API.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.main import PARSER_MODULES
from scraper.utils.logger import setup_logger
import importlib

logger = setup_logger("Test")

def test_parser(module_name: str):
    """Test a single parser."""
    try:
        module = importlib.import_module(module_name)
        for attr in dir(module):
            obj = getattr(module, attr)
            if hasattr(obj, 'fetch_jobs') and hasattr(obj, 'company'):
                parser = obj()
                logger.info(f"Testing {parser.company} ({parser.url})")
                
                # Mock the post_job function to avoid API calls during testing
                original_post_job = None
                if hasattr(module, 'post_job'):
                    original_post_job = module.post_job
                    module.post_job = lambda job: logger.info(f"Mock API call: {job.get('title')}")
                
                jobs = parser.fetch_jobs()
                
                # Restore original function
                if original_post_job:
                    module.post_job = original_post_job
                    
                logger.info(f"✓ {parser.company}: Found {len(jobs)} jobs")
                
                # Show sample job if found
                if jobs:
                    sample = jobs[0]
                    logger.info(f"  Sample: {sample.get('title')} - {sample.get('location')}")
                
                return True
                
    except Exception as e:
        logger.error(f"✗ {module_name}: {e}")
        return False
    
    return False

def test_all_parsers():
    """Test all parsers."""
    logger.info("Testing all parsers...")
    logger.info("=" * 60)
    
    successful = 0
    total = len(PARSER_MODULES)
    
    for module_name in PARSER_MODULES:
        parser_name = module_name.split('.')[-1]
        if test_parser(module_name):
            successful += 1
        print()  # Add blank line between tests
    
    logger.info("=" * 60)
    logger.info(f"Test Results: {successful}/{total} parsers working")
    
    if successful < total:
        logger.warning(f"{total - successful} parsers failed - check logs above")
    else:
        logger.info("All parsers are working correctly!")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Test job scrapers')
    parser.add_argument('parser', nargs='?', help='Specific parser to test (e.g., pathao)')
    
    args = parser.parse_args()
    
    if args.parser:
        module_name = f'scraper.parsers.{args.parser}'
        if module_name in PARSER_MODULES:
            test_parser(module_name)
        else:
            logger.error(f"Parser '{args.parser}' not found")
            logger.info(f"Available parsers: {[p.split('.')[-1] for p in PARSER_MODULES]}")
    else:
        test_all_parsers()
