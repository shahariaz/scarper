from scraper.database import JobDatabase

db = JobDatabase()

# Test the search function directly
print("Testing search with company filter...")
result = db.search_jobs(query="", company_filter="Vivasoft", limit=5, offset=0)
print(f"Result: {result}")

print("\nTesting search with query...")
result2 = db.search_jobs(query="Vivasoft", limit=5, offset=0)
print(f"Result2: {result2}")

print("\nTesting search with no filters...")
result3 = db.search_jobs(query="", limit=5, offset=0)
print(f"Result3: {result3}")
