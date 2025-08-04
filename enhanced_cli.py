#!/usr/bin/env python3
"""
Enhanced Job Scraper CLI with Management Integration
Supports both standalone operation and integration with the management system.
"""

import sys
import os
import argparse
import time
import threading
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.main import run_all_parsers, run_single_parser, PARSER_MODULES
from scraper.utils.logger import setup_logger
from scraper.config import SLEEP_BETWEEN_RUNS

logger = setup_logger("EnhancedCLI")

def list_parsers():
    """List all available parsers with detailed information."""
    print("\n" + "="*80)
    print("AVAILABLE JOB SCRAPERS")
    print("="*80)
    print(f"{'Parser':<20} {'Company':<30} {'Status':<10}")
    print("-"*80)
    
    total_parsers = 0
    working_parsers = 0
    
    for module_name in PARSER_MODULES:
        parser_name = module_name.split('.')[-1]
        total_parsers += 1
        
        try:
            module = __import__(module_name, fromlist=[parser_name])
            for attr in dir(module):
                obj = getattr(module, attr)
                if hasattr(obj, 'company') and hasattr(obj, 'url'):
                    company = obj.company
                    print(f"{parser_name:<20} {company:<30} {'✓ Ready':<10}")
                    working_parsers += 1
                    break
        except Exception as e:
            print(f"{parser_name:<20} {'Error loading':<30} {'✗ Error':<10}")
            logger.debug(f"Parser {parser_name} error: {e}")
    
    print("-"*80)
    print(f"Total: {total_parsers} parsers, {working_parsers} working, {total_parsers - working_parsers} with errors")
    print("="*80)

def run_with_management_integration(parser_name=None):
    """Run scraping with management system integration."""
    try:
        from scraper.models.scraper_management import scraper_manager
        
        # Check if scraping is already active
        if scraper_manager.is_scraping_active():
            print("⚠️  Scraping is already in progress.")
            print("   Use the admin dashboard to monitor current jobs.")
            return
        
        print(f"🚀 Starting scraping job...")
        print(f"   Target: {parser_name or 'All parsers'}")
        print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Trigger through management system
        job_id = scraper_manager.trigger_manual_scraping(
            parser_name=parser_name,
            triggered_by="cli"
        )
        
        print(f"✅ Job started successfully!")
        print(f"   Job ID: {job_id}")
        print(f"   Monitor progress in admin dashboard or use: python cli.py --status {job_id}")
        
        return job_id
        
    except ImportError:
        logger.warning("Management system not available, running in standalone mode")
        return run_standalone(parser_name)
    except Exception as e:
        logger.error(f"Error with management integration: {e}")
        print(f"❌ Error: {e}")
        return None

def run_standalone(parser_name=None):
    """Run scraping in standalone mode without management system."""
    print(f"🔧 Running in standalone mode...")
    
    start_time = time.time()
    jobs_found = 0
    
    try:
        if parser_name:
            print(f"🎯 Running single parser: {parser_name}")
            jobs_found = run_single_parser(parser_name)
        else:
            print(f"🌐 Running all parsers...")
            jobs_found = run_all_parsers()
        
        duration = time.time() - start_time
        
        print(f"\n✅ Scraping completed!")
        print(f"   Jobs found: {jobs_found}")
        print(f"   Duration: {duration:.1f} seconds")
        print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return jobs_found
        
    except Exception as e:
        duration = time.time() - start_time
        print(f"\n❌ Scraping failed!")
        print(f"   Error: {e}")
        print(f"   Duration: {duration:.1f} seconds")
        logger.error(f"Standalone scraping failed: {e}")
        return 0

def check_job_status(job_id):
    """Check status of a scraping job."""
    try:
        from scraper.models.scraper_management import scraper_manager
        
        status = scraper_manager.get_job_status(job_id)
        
        if not status:
            print(f"❌ Job {job_id} not found")
            return
        
        print(f"\n📊 Job Status: {job_id}")
        print("="*50)
        print(f"Parser: {status['parser_name'] or 'All parsers'}")
        print(f"Status: {status['status']}")
        print(f"Triggered by: {status['triggered_by']}")
        print(f"Created: {status['created_at']}")
        
        if status['started_at']:
            print(f"Started: {status['started_at']}")
        
        if status['completed_at']:
            print(f"Completed: {status['completed_at']}")
            if status['started_at']:
                start = datetime.fromisoformat(status['started_at'])
                end = datetime.fromisoformat(status['completed_at'])
                duration = (end - start).total_seconds()
                print(f"Duration: {duration:.1f} seconds")
        
        print(f"Jobs found: {status['jobs_found']}")
        
        if status['error_message']:
            print(f"Error: {status['error_message']}")
        
        if status['logs']:
            print(f"\nLogs:")
            for log in status['logs']:
                print(f"  {log}")
        
        print("="*50)
        
    except ImportError:
        print("❌ Management system not available")
    except Exception as e:
        print(f"❌ Error checking status: {e}")

def show_statistics():
    """Show scraping statistics."""
    try:
        from scraper.models.scraper_management import scraper_manager
        
        stats = scraper_manager.get_scraping_statistics(days=7)
        
        print(f"\n📈 SCRAPING STATISTICS (Last 7 days)")
        print("="*60)
        
        overview = stats['overview']
        print(f"Total runs: {overview['total_runs']}")
        print(f"Total jobs found: {overview['total_jobs_found']}")
        print(f"Average jobs per run: {overview['avg_jobs_per_run']:.1f}")
        print(f"Average duration: {overview['avg_duration_seconds']:.1f} seconds")
        
        if overview['last_run']:
            print(f"Last run: {overview['last_run']}")
        
        # Current status
        current = stats['current_status']
        status_text = "🟢 Running" if current['is_scraping_active'] else "🔴 Idle"
        print(f"Current status: {status_text}")
        
        if current['active_jobs'] > 0:
            print(f"Active jobs: {current['active_jobs']}")
        if current['scheduled_jobs'] > 0:
            print(f"Scheduled jobs: {current['scheduled_jobs']}")
        
        # Parser performance
        if stats['parser_performance']:
            print(f"\n🎯 PARSER PERFORMANCE:")
            print("-"*60)
            print(f"{'Parser':<20} {'Runs':<8} {'Jobs':<8} {'Avg Duration':<12}")
            print("-"*60)
            
            for parser in stats['parser_performance'][:10]:  # Top 10
                duration_str = f"{parser['avg_duration']:.1f}s"
                print(f"{parser['parser_name']:<20} {parser['runs']:<8} {parser['jobs_found']:<8} {duration_str:<12}")
        
        print("="*60)
        
    except ImportError:
        print("❌ Management system not available for statistics")
    except Exception as e:
        print(f"❌ Error getting statistics: {e}")

def continuous_mode():
    """Run scraping in continuous mode with scheduling."""
    print(f"🔄 Starting continuous scraping mode")
    print(f"   Sleep between runs: {SLEEP_BETWEEN_RUNS} seconds ({SLEEP_BETWEEN_RUNS/3600:.1f} hours)")
    print(f"   Press Ctrl+C to stop")
    print("-"*60)
    
    run_count = 0
    
    try:
        while True:
            run_count += 1
            print(f"\n🔄 Run #{run_count} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            try:
                jobs_found = run_with_management_integration()
                if jobs_found is not None:
                    print(f"✅ Run #{run_count} completed - {jobs_found} jobs found")
                else:
                    print(f"❌ Run #{run_count} failed")
            except Exception as e:
                print(f"❌ Run #{run_count} error: {e}")
                logger.error(f"Continuous mode run {run_count} failed: {e}")
            
            print(f"😴 Sleeping for {SLEEP_BETWEEN_RUNS} seconds...")
            time.sleep(SLEEP_BETWEEN_RUNS)
            
    except KeyboardInterrupt:
        print(f"\n\n⏹️  Continuous mode stopped by user")
        print(f"   Total runs completed: {run_count}")

def main():
    parser = argparse.ArgumentParser(
        description='Enhanced Job Scraper CLI',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python enhanced_cli.py --list                    List all available parsers
  python enhanced_cli.py --single pathao           Run single parser for Pathao
  python enhanced_cli.py --once                    Run all parsers once and exit
  python enhanced_cli.py --continuous              Run continuously with scheduling
  python enhanced_cli.py --status JOB_ID           Check status of a job
  python enhanced_cli.py --stats                   Show scraping statistics
  python enhanced_cli.py                          Run all parsers once (default)
        """
    )
    
    parser.add_argument('--single', type=str, metavar='PARSER', 
                       help='Run a single parser by name (e.g., pathao, welldev)')
    parser.add_argument('--once', action='store_true', 
                       help='Run all parsers once and exit')
    parser.add_argument('--continuous', action='store_true',
                       help='Run continuously with scheduling')
    parser.add_argument('--list', action='store_true', 
                       help='List all available parsers')
    parser.add_argument('--stats', action='store_true',
                       help='Show scraping statistics')
    parser.add_argument('--status', type=str, metavar='JOB_ID',
                       help='Check status of a specific job')
    parser.add_argument('--standalone', action='store_true',
                       help='Force standalone mode (bypass management system)')
    
    args = parser.parse_args()
    
    # Print header
    print("\n" + "="*80)
    print("🚀 ENHANCED JOB SCRAPER CLI")
    print("="*80)
    
    if args.list:
        list_parsers()
    elif args.stats:
        show_statistics()
    elif args.status:
        check_job_status(args.status)
    elif args.continuous:
        continuous_mode()
    elif args.single:
        logger.info(f"Running single parser: {args.single}")
        if args.standalone:
            run_standalone(args.single)
        else:
            run_with_management_integration(args.single)
    elif args.once:
        logger.info("Running all parsers once")
        if args.standalone:
            run_standalone()
        else:
            run_with_management_integration()
    else:
        # Default: run all parsers once
        logger.info("Running all parsers once (default)")
        if args.standalone:
            run_standalone()
        else:
            run_with_management_integration()
    
    print("\n" + "="*80)

if __name__ == "__main__":
    main()
