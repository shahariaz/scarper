#!/usr/bin/env python3
"""
Monitoring script to check the health of the job scraper.
Shows statistics and recent activity.
"""

import sys
import os
import json
import time
from datetime import datetime, timedelta
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.main import PARSER_MODULES
from scraper.utils.logger import setup_logger

logger = setup_logger("Monitor")

class ScraperMonitor:
    def __init__(self, log_file="scraper_stats.json"):
        self.log_file = log_file
        self.stats = self.load_stats()
    
    def load_stats(self):
        """Load statistics from file."""
        if os.path.exists(self.log_file):
            try:
                with open(self.log_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        return {
            "total_runs": 0,
            "total_jobs_found": 0,
            "last_run": None,
            "parser_stats": {},
            "daily_stats": {}
        }
    
    def save_stats(self):
        """Save statistics to file."""
        try:
            with open(self.log_file, 'w') as f:
                json.dump(self.stats, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save stats: {e}")
    
    def record_run(self, parser_name, jobs_found):
        """Record a scraper run."""
        now = datetime.now().isoformat()
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Update overall stats
        self.stats["total_runs"] += 1
        self.stats["total_jobs_found"] += jobs_found
        self.stats["last_run"] = now
        
        # Update parser stats
        if parser_name not in self.stats["parser_stats"]:
            self.stats["parser_stats"][parser_name] = {
                "runs": 0,
                "total_jobs": 0,
                "last_run": None,
                "avg_jobs": 0
            }
        
        parser_stats = self.stats["parser_stats"][parser_name]
        parser_stats["runs"] += 1
        parser_stats["total_jobs"] += jobs_found
        parser_stats["last_run"] = now
        parser_stats["avg_jobs"] = parser_stats["total_jobs"] / parser_stats["runs"]
        
        # Update daily stats
        if today not in self.stats["daily_stats"]:
            self.stats["daily_stats"][today] = {
                "runs": 0,
                "jobs_found": 0,
                "parsers_run": set()
            }
        
        daily = self.stats["daily_stats"][today]
        daily["runs"] += 1
        daily["jobs_found"] += jobs_found
        if isinstance(daily["parsers_run"], set):
            daily["parsers_run"] = list(daily["parsers_run"])
        if parser_name not in daily["parsers_run"]:
            daily["parsers_run"].append(parser_name)
        
        self.save_stats()
    
    def get_status_report(self):
        """Generate a status report."""
        report = []
        report.append("Job Scraper Status Report")
        report.append("=" * 50)
        
        # Overall stats
        report.append(f"Total runs: {self.stats['total_runs']}")
        report.append(f"Total jobs found: {self.stats['total_jobs_found']}")
        if self.stats['last_run']:
            last_run = datetime.fromisoformat(self.stats['last_run'])
            report.append(f"Last run: {last_run.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Today's stats
        today = datetime.now().strftime("%Y-%m-%d")
        if today in self.stats["daily_stats"]:
            daily = self.stats["daily_stats"][today]
            report.append(f"\nToday's activity:")
            report.append(f"  Runs: {daily['runs']}")
            report.append(f"  Jobs found: {daily['jobs_found']}")
            report.append(f"  Parsers active: {len(daily['parsers_run'])}")
        
        # Parser performance
        if self.stats["parser_stats"]:
            report.append(f"\nParser Performance:")
            report.append(f"{'Parser':<20} {'Runs':<8} {'Total Jobs':<12} {'Avg Jobs':<10} {'Last Run'}")
            report.append("-" * 70)
            
            for parser, stats in self.stats["parser_stats"].items():
                last_run = "Never"
                if stats["last_run"]:
                    last_run_dt = datetime.fromisoformat(stats["last_run"])
                    last_run = last_run_dt.strftime("%m-%d %H:%M")
                
                report.append(f"{parser:<20} {stats['runs']:<8} {stats['total_jobs']:<12} {stats['avg_jobs']:<10.1f} {last_run}")
        
        # Recent activity (last 7 days)
        report.append(f"\nRecent Activity (Last 7 days):")
        recent_days = []
        for i in range(7):
            day = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            if day in self.stats["daily_stats"]:
                daily = self.stats["daily_stats"][day]
                recent_days.append(f"{day}: {daily['jobs_found']} jobs ({daily['runs']} runs)")
        
        if recent_days:
            for day_info in recent_days:
                report.append(f"  {day_info}")
        else:
            report.append("  No recent activity")
        
        return "\n".join(report)
    
    def check_health(self):
        """Check scraper health and return issues."""
        issues = []
        
        # Check if last run was too long ago
        if self.stats["last_run"]:
            last_run = datetime.fromisoformat(self.stats["last_run"])
            hours_since = (datetime.now() - last_run).total_seconds() / 3600
            if hours_since > 25:  # Allow some buffer over 24 hours
                issues.append(f"Last run was {hours_since:.1f} hours ago")
        else:
            issues.append("No runs recorded")
        
        # Check parser performance
        for parser, stats in self.stats["parser_stats"].items():
            if stats["avg_jobs"] == 0:
                issues.append(f"Parser {parser} never found any jobs")
            elif stats["runs"] > 5 and stats["avg_jobs"] < 0.1:
                issues.append(f"Parser {parser} has very low success rate")
        
        return issues

def main():
    monitor = ScraperMonitor()
    
    import argparse
    parser = argparse.ArgumentParser(description='Monitor job scraper status')
    parser.add_argument('--check', action='store_true', help='Check health and show issues')
    parser.add_argument('--reset', action='store_true', help='Reset statistics')
    
    args = parser.parse_args()
    
    if args.reset:
        if os.path.exists(monitor.log_file):
            os.remove(monitor.log_file)
        print("Statistics reset")
        return
    
    if args.check:
        issues = monitor.check_health()
        if issues:
            print("Health Check - Issues Found:")
            for issue in issues:
                print(f"  ⚠ {issue}")
        else:
            print("Health Check - All systems normal ✓")
        print()
    
    # Show status report
    print(monitor.get_status_report())

if __name__ == "__main__":
    main()
