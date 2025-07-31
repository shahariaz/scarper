import importlib
import time
import argparse
import sys
import os

# Add parent directory to path so we can import scraper modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.utils.logger import setup_logger
from scraper.database import JobDatabase
from scraper.job_api import get_recent_jobs

logger = setup_logger("Main")
db = JobDatabase()

# All available parser modules
PARSER_MODULES = [
    'scraper.parsers.pathao',
    'scraper.parsers.welldev', 
    'scraper.parsers.enosis',
    'scraper.parsers.brainstation23',
    'scraper.parsers.selise',
    'scraper.parsers.vivasoft',
    'scraper.parsers.therap',
    'scraper.parsers.fiftytwodigital',
    'scraper.parsers.bitmascot',
    'scraper.parsers.inverseai',
    'scraper.parsers.konasl',
    'scraper.parsers.shellbeehaken',
    'scraper.parsers.kinetik',
    'scraper.parsers.brotecs',
    'scraper.parsers.wpxpo',
    'scraper.parsers.bracits',
    'scraper.parsers.ibos',
    'scraper.parsers.dsinnovators',
    'scraper.parsers.relisource',
    'scraper.parsers.shopup',
]

SLEEP_BETWEEN_RUNS = 3600  # 1 hour


def run_all_parsers():
    """Run all available parsers with enhanced monitoring."""
    total_jobs_found = 0
    total_new_jobs = 0
    successful_parsers = 0
    failed_parsers = []
    
    logger.info("Starting scraping run for all parsers...")
    
    for module_name in PARSER_MODULES:
        parser_name = module_name.split('.')[-1]
        jobs_found = 0
        jobs_new = 0
        success = True
        error_msg = None
        
        try:
            module = importlib.import_module(module_name)
            parser_class = None
            
            # Find the parser class
            for attr in dir(module):
                obj = getattr(module, attr)
                if hasattr(obj, 'fetch_jobs') and hasattr(obj, 'company') and callable(obj):
                    parser_class = obj
                    break
            
            if parser_class:
                parser = parser_class()
                logger.info(f"Running parser: {parser.company}")
                
                # Count jobs before parsing (for new job calculation)
                before_count = len(get_recent_jobs(parser.company, days=1))
                
                jobs = parser.fetch_jobs()
                jobs_found = len(jobs)
                
                # Count new jobs added today
                after_count = len(get_recent_jobs(parser.company, days=1))
                jobs_new = after_count - before_count
                
                total_jobs_found += jobs_found
                total_new_jobs += jobs_new
                successful_parsers += 1
                
                logger.info(f"✓ {parser.company}: {jobs_found} jobs found, {jobs_new} new")
            else:
                raise Exception(f"No valid parser class found in {module_name}")
                
        except Exception as e:
            success = False
            error_msg = str(e)
            logger.error(f"✗ Failed to run parser {parser_name}: {e}")
            failed_parsers.append(parser_name)
        
        # Record the run in database
        try:
            company_name = parser.company if 'parser' in locals() and parser else parser_name.title()
            db.record_scraping_run(company_name, jobs_found, jobs_new, success, error_msg)
        except Exception as db_error:
            logger.error(f"Failed to record run for {parser_name}: {db_error}")
    
    # Summary
    logger.info("=" * 60)
    logger.info(f"Scraping run completed:")
    logger.info(f"  ✓ Successful parsers: {successful_parsers}/{len(PARSER_MODULES)}")
    logger.info(f"  📊 Total jobs found: {total_jobs_found}")
    logger.info(f"  🆕 New jobs: {total_new_jobs}")
    
    if failed_parsers:
        logger.warning(f"  ❌ Failed parsers: {', '.join(failed_parsers)}")
    
    # Database maintenance
    try:
        db.cleanup_old_jobs(days=90)  # Keep 90 days of data
    except Exception as e:
        logger.error(f"Database cleanup failed: {e}")
    
    return {
        'total_jobs': total_jobs_found,
        'new_jobs': total_new_jobs,
        'successful': successful_parsers,
        'failed': failed_parsers
    }


def run_single_parser(parser_name: str):
    """Run a single parser by name with enhanced monitoring."""
    module_name = f'scraper.parsers.{parser_name}'
    if module_name not in PARSER_MODULES:
        logger.error(f"Parser '{parser_name}' not found. Available parsers: {[p.split('.')[-1] for p in PARSER_MODULES]}")
        return None
    
    try:
        module = importlib.import_module(module_name)
        parser_class = None
        
        # Find the parser class
        for attr in dir(module):
            obj = getattr(module, attr)
            if hasattr(obj, 'fetch_jobs') and hasattr(obj, 'company') and callable(obj):
                parser_class = obj
                break
        
        if parser_class:
            parser = parser_class()
            logger.info(f"Running parser: {parser.company}")
            
            before_count = len(get_recent_jobs(parser.company, days=1))
            jobs = parser.fetch_jobs()
            after_count = len(get_recent_jobs(parser.company, days=1))
            
            jobs_found = len(jobs)
            jobs_new = after_count - before_count
            
            logger.info(f"✓ {parser.company}: {jobs_found} jobs found, {jobs_new} new")
            
            # Record the run
            db.record_scraping_run(parser.company, jobs_found, jobs_new, True, None)
            
            return {'jobs_found': jobs_found, 'jobs_new': jobs_new}
        else:
            raise Exception(f"No valid parser class found in {module_name}")
            
    except Exception as e:
        logger.error(f"Failed to run parser {module_name}: {e}")
        # Record the failed run
        try:
            db.record_scraping_run(parser_name.title(), 0, 0, False, str(e))
        except:
            pass
        return None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Web Scraper for Bangladeshi Software Companies')
    parser.add_argument('--single', type=str, help='Run a single parser by name (e.g., pathao)')
    parser.add_argument('--once', action='store_true', help='Run all parsers once and exit')
    parser.add_argument('--list', action='store_true', help='List all available parsers')
    parser.add_argument('--stats', action='store_true', help='Show database statistics')
    
    args = parser.parse_args()
    
    if args.list:
        logger.info("Available parsers:")
        for module_name in PARSER_MODULES:
            parser_name = module_name.split('.')[-1]
            logger.info(f"  - {parser_name}")
    elif args.stats:
        from scraper.job_api import get_job_statistics
        stats = get_job_statistics()
        logger.info("Database Statistics:")
        logger.info(f"  Total jobs: {stats['total_jobs']}")
        logger.info("  Jobs by company:")
        for company, count in list(stats['jobs_by_company'].items())[:10]:
            logger.info(f"    {company}: {count}")
    elif args.single:
        run_single_parser(args.single)
    elif args.once:
        run_all_parsers()
    else:
        logger.info("Starting continuous scraping mode...")
        try:
            while True:
                result = run_all_parsers()
                logger.info(f"Sleeping for {SLEEP_BETWEEN_RUNS} seconds before next run...")
                time.sleep(SLEEP_BETWEEN_RUNS)
        except KeyboardInterrupt:
            logger.info("Scraping stopped by user")
