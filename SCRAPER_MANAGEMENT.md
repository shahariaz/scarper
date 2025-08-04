# Job Scraper Management System

This enhanced job scraper management system provides comprehensive control over automated job scraping operations with both manual triggers and scheduled automation.

## 🌟 Features

### ✨ Core Features
- **Manual Scraping Control**: Trigger scraping jobs instantly via admin dashboard
- **Automated Scheduling**: Run scraping 2 times daily automatically
- **Real-time Monitoring**: Track job progress and view statistics
- **Parser Management**: Control individual company parsers
- **Job History**: View recent scraping jobs and their results
- **Error Handling**: Comprehensive error tracking and reporting

### 🎯 Admin Dashboard Features
- **Live Status Monitoring**: Real-time scraper status and progress
- **One-Click Triggers**: Start scraping instantly with parser selection
- **Schedule Management**: Enable/disable automated scheduling
- **Performance Analytics**: View parser performance metrics
- **Job History**: Browse recent scraping jobs with detailed logs

### 🤖 Automation Features
- **Daily Scheduling**: Automatically runs 2 times per day (9 AM & 9 PM)
- **Smart Conflict Detection**: Prevents overlapping scraping jobs
- **Background Processing**: Non-blocking scraping operations
- **Comprehensive Logging**: Detailed logs for monitoring and debugging

## 🚀 Quick Start

### 1. Admin Dashboard Access

Navigate to the Admin Dashboard in your application:
```
/admin/scraper
```

**Features Available:**
- View current scraper status
- Trigger manual scraping (all parsers or specific parser)
- Monitor job progress in real-time
- View performance statistics
- Enable/disable automatic scheduling

### 2. Command Line Interface

Use the enhanced CLI for advanced operations:

```bash
# List all available parsers
python enhanced_cli.py --list

# Run all parsers once
python enhanced_cli.py --once

# Run specific parser
python enhanced_cli.py --single pathao

# Run in continuous mode
python enhanced_cli.py --continuous

# Check job status
python enhanced_cli.py --status JOB_ID

# View statistics
python enhanced_cli.py --stats
```

### 3. Setup Automated Scheduling

```bash
# Setup system-level scheduling (Windows/Linux)
python scheduler.py --setup

# Setup with custom times
python scheduler.py --setup --times 08:00 20:00

# View current schedules
python scheduler.py --show

# Remove existing schedules
python scheduler.py --remove
```

## 📊 API Endpoints

### Admin Scraper Management APIs

#### Get Scraper Status
```http
GET /api/admin/scraper/status
Authorization: Bearer <admin_token>
```

#### Trigger Manual Scraping
```http
POST /api/admin/scraper/trigger
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "parser_name": "pathao"  // Optional: null for all parsers
}
```

#### Get Scraping Jobs
```http
GET /api/admin/scraper/jobs?limit=20
Authorization: Bearer <admin_token>
```

#### Get Job Status
```http
GET /api/admin/scraper/jobs/{job_id}
Authorization: Bearer <admin_token>
```

#### Get Available Parsers
```http
GET /api/admin/scraper/parsers
Authorization: Bearer <admin_token>
```

#### Get/Update Schedule Configuration
```http
GET /api/admin/scraper/schedule
PUT /api/admin/scraper/schedule
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "enabled": true,
  "config": {
    "daily_runs": 2,
    "run_times": ["09:00", "21:00"],
    "timezone": "UTC"
  }
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Scraper timing configuration
SLEEP_BETWEEN_RUNS=3600          # Seconds between runs in continuous mode

# Database configuration
DATABASE_PATH=jobs.db            # Path to SQLite database

# Scheduling configuration
SCRAPER_SCHEDULE_ENABLED=true    # Enable automatic scheduling
SCRAPER_DAILY_RUNS=2            # Number of runs per day
SCRAPER_RUN_TIMES=09:00,21:00   # Times to run (comma-separated)
```

### Schedule Configuration

The scheduler can be configured to run at different times:

```python
# Default configuration
schedule_config = {
    "daily_runs": 2,
    "run_times": ["09:00", "21:00"],  # 9 AM and 9 PM
    "timezone": "UTC"
}
```

## 📈 Monitoring & Statistics

### Real-time Monitoring

The admin dashboard provides real-time monitoring:
- **System Status**: Current scraper state (Running/Idle)
- **Active Jobs**: Number of currently running jobs
- **Recent Activity**: Latest scraping results
- **Performance Metrics**: Success rates and timing data

### Performance Analytics

Track scraper performance over time:
- **Total Jobs Found**: Cumulative job discoveries
- **Average Per Run**: Jobs found per scraping session
- **Parser Performance**: Individual parser success rates
- **Execution Time**: Duration tracking for optimization

### Job History

View detailed history of scraping operations:
- **Job Status**: Success/failure tracking
- **Trigger Source**: Manual vs. scheduled vs. automated
- **Detailed Logs**: Step-by-step execution logs
- **Error Messages**: Comprehensive error reporting

## 🛡️ Security & Access Control

### Admin-Only Access

All scraper management features require admin privileges:
- **Authentication**: JWT token-based authentication
- **Authorization**: Admin user type verification
- **API Security**: Protected endpoints with proper error handling

### Safe Operations

Built-in safety mechanisms:
- **Conflict Prevention**: Blocks simultaneous scraping jobs
- **Resource Management**: Proper cleanup and resource allocation
- **Error Recovery**: Graceful handling of parser failures

## 🔍 Troubleshooting

### Common Issues

#### 1. Scraper Not Starting
```bash
# Check management system status
python enhanced_cli.py --stats

# Try standalone mode
python enhanced_cli.py --once --standalone
```

#### 2. Jobs Stuck in Running State
```bash
# Check specific job status
python enhanced_cli.py --status JOB_ID

# Restart backend server to reset job states
```

#### 3. Scheduling Not Working
```bash
# Check current schedules
python scheduler.py --show

# Recreate schedules
python scheduler.py --remove
python scheduler.py --setup
```

### Debug Mode

Enable detailed logging:
```bash
export LOG_LEVEL=DEBUG
python enhanced_cli.py --once
```

### Database Issues

Reset scraper management tables:
```python
from scraper.models.scraper_management import ScraperManager
manager = ScraperManager()
manager.init_database()  # Recreates tables
```

## 🚦 System Requirements

### Python Dependencies
```
schedule>=1.2.0          # For Python-based scheduling
requests>=2.28.0         # HTTP requests
sqlite3                  # Database (built-in)
threading                # Background processing (built-in)
```

### System Dependencies

**Windows:**
- Task Scheduler (for system-level scheduling)
- PowerShell (for task management)

**Linux:**
- cron OR systemd (for system-level scheduling)
- systemctl (for systemd services)

### Browser Support
- Modern browsers with JavaScript enabled
- WebSocket support for real-time updates

## 📝 Development

### Adding New Parsers

1. Create parser in `scraper/parsers/`
2. Add to `PARSER_MODULES` in `scraper/main.py`
3. Parser will automatically appear in admin dashboard

### Extending Management Features

The management system is modular and extensible:
- `ScraperManager`: Core management logic
- API endpoints: Backend integration
- Admin dashboard: Frontend interface

### Testing

```bash
# Test individual components
python -m pytest tests/test_scraper_management.py

# Test API endpoints
python -m pytest tests/test_scraper_api.py

# Test CLI functionality
python enhanced_cli.py --list
```

## 📊 Performance Optimization

### Recommended Settings

For optimal performance:
- **Daily Runs**: 2-3 times (avoid overloading target sites)
- **Timeout Settings**: 15-30 seconds per request
- **Concurrent Jobs**: 1 (prevent resource conflicts)
- **Error Retry**: 3 attempts with exponential backoff

### Monitoring Resource Usage

Monitor system resources:
- **CPU Usage**: During scraping operations
- **Memory Usage**: For large job results
- **Network Usage**: Bandwidth consumption
- **Disk Usage**: Database and log file growth

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review application logs for error details
3. Use debug mode for detailed diagnostics
4. Check system requirements and dependencies

---

## 🎉 Success! Your Job Scraper Management System is Ready

You now have a complete job scraping management system with:
- ✅ Admin dashboard for manual control
- ✅ Automated daily scheduling (2x per day)
- ✅ Real-time monitoring and statistics
- ✅ Comprehensive job history and logging
- ✅ Individual parser management
- ✅ API endpoints for integration
- ✅ Enhanced CLI tools
- ✅ System-level scheduling options

The system will automatically scrape jobs twice daily and allow admins to trigger additional scraping as needed through the dashboard!
