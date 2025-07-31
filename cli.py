#!/usr/bin/env python3
"""
CLI interface for the job scraper.
Usage examples:
    python cli.py --list                    # List all available parsers
    python cli.py --single pathao           # Run single parser
    python cli.py --once                    # Run all parsers once
    python cli.py                          # Run continuously
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.main import run_all_parsers, run_single_parser, PARSER_MODULES
from scraper.utils.logger import setup_logger
import argparse

logger = setup_logger("CLI")

def list_parsers():
    """List all available parsers."""
    print("\nAvailable parsers:")
    print("=" * 50)
    for module_name in PARSER_MODULES:
        parser_name = module_name.split('.')[-1]
        try:
            module = __import__(module_name, fromlist=[parser_name])
            for attr in dir(module):
                obj = getattr(module, attr)
                if hasattr(obj, 'company') and hasattr(obj, 'url'):
                    company = obj.company
                    url = obj.url
                    print(f"  {parser_name:<20} - {company:<25} - {url}")
                    break
        except Exception as e:
            print(f"  {parser_name:<20} - Error loading parser: {e}")
    print()

def main():
    parser = argparse.ArgumentParser(
        description='Web Scraper for Bangladeshi Software Companies',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python cli.py --list                    List all available parsers
  python cli.py --single pathao           Run single parser for Pathao
  python cli.py --once                    Run all parsers once and exit
  python cli.py                          Run continuously (default)
        """
    )
    
    parser.add_argument('--single', type=str, metavar='PARSER', 
                       help='Run a single parser by name (e.g., pathao, welldev)')
    parser.add_argument('--once', action='store_true', 
                       help='Run all parsers once and exit')
    parser.add_argument('--list', action='store_true', 
                       help='List all available parsers')
    
    args = parser.parse_args()
    
    if args.list:
        list_parsers()
    elif args.single:
        logger.info(f"Running single parser: {args.single}")
        run_single_parser(args.single)
    elif args.once:
        logger.info("Running all parsers once")
        run_all_parsers()
    else:
        logger.info("Starting continuous scraping mode (use Ctrl+C to stop)")
        try:
            import time
            from scraper.config import SLEEP_BETWEEN_RUNS
            while True:
                run_all_parsers()
                logger.info(f"Sleeping for {SLEEP_BETWEEN_RUNS} seconds before next run...")
                time.sleep(SLEEP_BETWEEN_RUNS)
        except KeyboardInterrupt:
            logger.info("Scraping stopped by user")

if __name__ == "__main__":
    main()
