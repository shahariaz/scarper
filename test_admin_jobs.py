from scraper.models.job_models import JobService

job_service = JobService()
jobs = job_service.search_job_postings(filters={'show_unapproved': True}, per_page=5)
print('Sample jobs for testing:')
for job in jobs.get('jobs', []):
    print(f"ID: {job.get('id')}, Title: {job.get('title')}, Status: {job.get('status')}, Approved: {job.get('approved_by_admin')}")

print(f"Total jobs: {len(jobs.get('jobs', []))}")

# Test statistics
stats = job_service.get_job_statistics()
print(f"Statistics: {stats}")
