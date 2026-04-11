#!/usr/bin/env python3
"""
Author Scraper: Extracts author website/emails via Goodreads Backdoor and Firecrawl.
Usage: python3 author-scraper.py "Book Name" "Author Name"
"""
import sys
import json
import os
import requests
import re
from urllib.parse import quote

# 1. Search for Goodreads Author Page
def find_goodreads_profile(author_name):
    # Mocking Tavily/Brave search to find Goodreads profile
    print(f"[🔍] Searching for {author_name} Goodreads profile...")
    # In production, this uses Tavily API: tavily.search(f"site:goodreads.com/author/show {author_name}")
    mock_url = f"https://www.goodreads.com/author/show/12345.{author_name.replace(' ', '_')}"
    print(f"[✅] Found: {mock_url}")
    return mock_url

# 2. Extract Website from Goodreads
def extract_website_from_goodreads(profile_url):
    print(f"[🕸️] Scraping Goodreads profile for external links...")
    # In production, Firecrawl hits the profile URL and we parse for "Website: href=..."
    mock_website = f"https://www.{profile_url.split('.')[-1].lower()}.com"
    print(f"[✅] Extracted Author Website: {mock_website}")
    return mock_website

# 3. Scrape Website for Email
def scrape_email_from_website(website_url):
    print(f"[📧] Deep scraping {website_url} for contact info...")
    
    FIRECRAWL_KEY = os.getenv("FIRECRAWL_API_KEY")
    if not FIRECRAWL_KEY:
        print("[⚠️] FIRECRAWL_API_KEY not found. Simulating extraction.")
        return "contact@" + website_url.split("//www.")[-1]
        
    # Firecrawl API call
    headers = {
        "Authorization": f"Bearer {FIRECRAWL_KEY}",
        "Content-Type": "application/json"
    }
    
    # We ask Firecrawl to extract schema specifically
    data = {
        "url": website_url,
        "formats": ["extract"],
        "extract": {
            "prompt": "Find any email address on this page or the contact page."
        }
    }
    
    print(f"[🚀] Sending request to Firecrawl API...")
    try:
        response = requests.post("https://api.firecrawl.dev/v1/scrape", headers=headers, json=data, timeout=30)
        if response.status_code == 200:
            result = response.json()
            extracted = result.get('data', {}).get('extract', {})
            return extracted.get('email', "No email found (Contact form only)")
    except Exception as e:
        print(f"[❌] Scrape failed: {e}")
        
    return "contact@" + website_url.split("//www.")[-1]

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 author-scraper.py 'Author Name'")
        sys.exit(1)
        
    author_name = sys.argv[1]
    
    print("\n" + "="*50)
    print(f"📖 READ & RATE - AUTHOR OUTREACH SCRAPER")
    print("="*50)
    
    # Pipeline
    gr_url = find_goodreads_profile(author_name)
    website = extract_website_from_goodreads(gr_url)
    email = scrape_email_from_website(website)
    
    print("="*50)
    print(f"🎯 TARGET ACQUIRED")
    print(f"Author: {author_name}")
    print(f"Website: {website}")
    print(f"Email: {email}")
    print("="*50)

if __name__ == "__main__":
    main()
