# Deployment Guide

## Local Development Setup

1. **Clone and Setup**:
```bash
git clone <repository-url>
cd Scarpper
python setup.py
```

2. **Configure Environment**:
```bash
cp .env.example .env
# Edit .env with your API details
```

3. **Test Installation**:
```bash
python test_parsers.py
```

## Production Deployment

### Option 1: Systemd Service (Linux)

1. **Create service file** `/etc/systemd/system/job-scraper.service`:
```ini
[Unit]
Description=Job Scraper Service
After=network.target

[Service]
Type=simple
User=scraper
WorkingDirectory=/opt/job-scraper
Environment=PATH=/opt/job-scraper/.venv/bin
ExecStart=/opt/job-scraper/.venv/bin/python cli.py
Restart=always
RestartSec=60

[Install]
WantedBy=multi-user.target
```

2. **Enable and start**:
```bash
sudo systemctl enable job-scraper
sudo systemctl start job-scraper
```

### Option 2: Docker Container

1. **Create Dockerfile**:
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN playwright install chromium

COPY . .
CMD ["python", "cli.py"]
```

2. **Build and run**:
```bash
docker build -t job-scraper .
docker run -d --env-file .env --name job-scraper job-scraper
```

### Option 3: Cron Job

1. **Add to crontab**:
```bash
# Run every hour
0 * * * * cd /path/to/scraper && .venv/bin/python cli.py --once
```

## Monitoring

### Health Checks
```bash
# Check status
python monitor.py --check

# View statistics
python monitor.py
```

### Log Monitoring
- Logs go to stdout by default
- Use `journalctl -u job-scraper` for systemd
- Use `docker logs job-scraper` for Docker

### Alerts
Set up alerts based on:
- No successful runs in 25+ hours
- High error rates
- API posting failures

## Scaling

### Multiple Instances
- Run different parsers on different instances
- Use `--single parser_name` to distribute load

### Rate Limiting
- Adjust `SLEEP_BETWEEN_REQUESTS` in config
- Use proxies for higher throughput
- Implement distributed rate limiting

## Troubleshooting

### Common Issues

1. **Import Errors**:
```bash
pip install -r requirements.txt
playwright install chromium
```

2. **Parser Not Finding Jobs**:
- Test individual parser: `python test_parsers.py pathao`
- Check website structure changes
- Update CSS selectors

3. **API Posting Failures**:
- Verify API URL and token in .env
- Check API logs for errors
- Test API endpoint manually

4. **Playwright Issues**:
```bash
playwright install
# or
playwright install chromium
```

### Debug Mode
```bash
export LOG_LEVEL=DEBUG
python cli.py --single parser_name
```

### Performance Optimization

1. **Reduce Timeouts**:
```python
REQUEST_TIMEOUT = 10  # Reduce from 15
```

2. **Parallel Processing**:
- Run multiple parser instances
- Use different processes for different companies

3. **Caching**:
- Cache HTTP responses for development
- Skip recently scraped jobs

## Security

### Best Practices
- Use environment variables for secrets
- Rotate API tokens regularly
- Use HTTPS for API endpoints
- Monitor for suspicious activity

### Rate Limiting Respect
- Follow robots.txt guidelines
- Implement reasonable delays
- Monitor server responses for rate limiting

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Check for website structure changes
- Monitor parser success rates
- Review and rotate logs

### Updates
1. Test in development environment
2. Update one parser at a time
3. Monitor for regressions
4. Rollback if issues occur
