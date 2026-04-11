import requests

URL = "https://zexumnlvkrjryvzrlavp.supabase.co/rest/v1"
HEADERS = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

data = {
    "title": "Competitor: Book Bounty",
    "category": "competitor",
    "summary": "Point-based review exchange system. Users complain about AI-written reviews, imbalance favoring low-content books, and lack of transparency. Vulnerability: We can pitch our service as 'Higher Quality, Real Readers, No AI Junk'.",
    "importance": "high"
}

res = requests.post(f"{URL}/intel", headers=HEADERS, json=data)
print(f"Added Book Bounty to Intel: {res.status_code}")
