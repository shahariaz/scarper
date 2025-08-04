#!/usr/bin/env python3
"""
Simple test script to verify the feed endpoint works
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scraper.models.feed_models import JobFeedService

def test_feed_service():
    """Test the feed service directly"""
    try:
        feed_service = JobFeedService()
        print("✓ Feed service initialized successfully")
        
        # Test getting personalized feed
        result = feed_service.get_personalized_feed(
            user_id=1,
            page=1,
            per_page=5,
            filters={}
        )
        
        print(f"✓ Feed service returned: {len(result.get('jobs', []))} jobs")
        print(f"✓ Total jobs available: {result.get('total', 0)}")
        
        # Print first job if available
        if result.get('jobs'):
            first_job = result['jobs'][0]
            print(f"✓ First job: {first_job.get('title')} at {first_job.get('company')}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error testing feed service: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing feed service...")
    success = test_feed_service()
    if success:
        print("✓ Feed service test passed!")
    else:
        print("✗ Feed service test failed!")
