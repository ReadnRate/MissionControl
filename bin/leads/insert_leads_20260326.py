#!/usr/bin/env python3
"""
Super Data - Read & Rate: Author Lead Scraping — 2026-03-26
Scraped via: web_search (Brave) + web_fetch
"""
import json, re, time, urllib.request, urllib.error

SUPABASE_URL = "https://zexumnlvkrjryvzrlavp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM"

def is_valid_email(email):
    if not email: return False
    return bool(re.match(r'^[\w\.\+\-]+@[\w\.\-]+\.[a-zA-Z]{2,}$', email.strip()))

def normalize(email): return email.strip().lower().rstrip('.')

NEW_LEADS = [
    # Reviewer/Bloggers — verified via web_fetch
    ("", "", "submissions@independentbookreview.com",
     "Independent Book Review", "Book Reviews (Multi-Genre)",
     "https://independentbookreview.com",
     "Hi! Read & Rate helps indie authors connect with passionate reviewers. We'd love to feature Independent Book Review as a trusted review platform for our author community!"),

    ("Jane", "", "jane@dearauthor.com",
     "Dear Author", "Book Reviews (Literary/Romance)",
     "https://dearauthor.com",
     "Hi Jane! Dear Author is a trusted voice in book reviews. Read & Rate helps indie authors reach reviewers like you — let's collaborate!"),

    ("", "", "contact@booksmugglersden.com",
     "The Book Smuggler's Den", "YA / Kids Lit / Book Reviews",
     "https://booksmugglersden.com",
     "Hi! The Book Smuggler's Den's focus on YA and children's lit is wonderful. Read & Rate helps indie authors find dedicated reviewers — let's connect!"),

    ("Laura", "", "laura@laurasbooksandblogs.com",
     "Laura's Books and Blogs", "Indie Author Reviews",
     "https://laurasbooksandblogs.com",
     "Hi Laura! Your dedication to indie author reviews is admirable. Read & Rate wants to support reviewers who champion indie voices — would love to partner with you!"),

    ("Bonnie", "", "bonniereadsandwrites@gmail.com",
     "Bonnie Reads and Writes", "Book Reviews (Multi-Genre)",
     "https://bonniereadsandwrites.com",
     "Hi Bonnie! Love your emotional, detailed reviews. Read & Rate helps indie authors reach reviewers who truly connect with their work — let's work together!"),

    ("Yecheilyah", "", "yecheilyah@yecheilyahysrayl.com",
     "Yecheilyah's Book Reviews (The PBS Blog)", "Book Reviews (Indie-Friendly)",
     "https://thepbsblog.com",
     "Hi Yecheilyah! Your Book Review Registry for 2026 is impressive. Read & Rate would love to connect indie authors with your 3,300+ subscribers — let's partner!"),

    ("", "", "booksinblankets@gmail.com",
     "Books in Blankets", "Book Reviews (Sci-Fi/Fantasy/YA)",
     "https://booksinblankets.blogspot.com",
     "Hi! Books in Blankets' sci-fi, fantasy, and YA coverage is fantastic. Read & Rate helps indie authors reach dedicated reviewers — would love to collaborate!"),

    ("Kriti", "", "kriti@armedwithabook.com",
     "Armed with A Book", "YA / Indie & Self-Published Author Reviews",
     "https://armedwithabook.com",
     "Hi Kriti! Love your focus on indie & self-published authors. Read & Rate helps authors get honest reviews — would love to feature your platform!"),

    ("", "", "request@thestorysanctuary.com",
     "The Story Sanctuary", "Book Reviews (Contemporary/Fantasy)",
     "https://thestorysanctuary.com",
     "Hi! The Story Sanctuary's focus on family relationships and mental health in fiction is unique. Read & Rate would love to connect indie authors with your review platform!"),

    ("", "", "fantasybookcriticblog@gmail.com",
     "Fantasy Book Critic", "Book Reviews (Fantasy/Sci-Fi/Horror/YA)",
     "https://fantasybookcritic.blogspot.com",
     "Hi! Fantasy Book Critic's devotion to speculative fiction is impressive. Read & Rate helps indie authors reach dedicated genre reviewers — let's connect!"),

    ("Juliet", "Butler", "bookliterati@gmail.com",
     "Bookliterati", "Book Reviews (Historical/Thriller/Romance)",
     "https://bookliterati.com",
     "Hi Juliet! Your honest, constructive reviews across historical fiction, thrillers, and romance are exactly what indie authors need. Read & Rate would love to connect!"),

    ("Brittani", "", "brittani@untitledthoughts.com",
     "Untitled Thoughts (Book Shop)", "Indie Author Support / Book Shop",
     "https://untitledthoughts.com",
     "Hi Brittani! Your book shop supports indie authors beautifully. Read & Rate helps indie authors get discovered — let's explore how we can work together!"),

    ("Issac", "Robledo", "issac.robledo@gmail.com",
     "Issac Robledo (Indie Author)", "Indie Fiction",
     None,
     "Hi Issac! Read & Rate is a platform helping indie authors gain visibility and get honest reviews. Would love to connect and learn about your work!"),

    ("Anne", "", "anne@annejanzer.com",
     "Anne Janzer (Indie Author)", "Nonfiction / Indie Publishing",
     "https://annejanzer.com",
     "Hi Anne! Your work on nonfiction writing and indie publishing is inspiring. Read & Rate supports indie authors — would love to feature your perspective!"),
]

print(f"Total leads collected: {len(NEW_LEADS)}")

valid_leads = []
for lead in NEW_LEADS:
    first, last, email, title, genre, url, ptext = lead
    if not is_valid_email(email):
        print(f"SKIP (invalid email): {email}")
        continue
    valid_leads.append({
        "first_name": first or None,
        "last_name": last or None,
        "email": normalize(email),
        "book_title": title,
        "genre": genre,
        "website_url": url,
        "status": "new",
        "personalization_text": ptext,
    })

print(f"Valid leads: {len(valid_leads)}")

# Fetch existing emails from DB
req = urllib.request.Request(
    f"{SUPABASE_URL}/rest/v1/author_leads?select=email",
    headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
)
with urllib.request.urlopen(req) as resp:
    existing_data = json.loads(resp.read())
existing_emails = set(normalize(e.get("email","")) for e in existing_data if e.get("email"))
print(f"Existing emails in DB: {len(existing_emails)}")

new_unique = [l for l in valid_leads if l["email"] not in existing_emails]
print(f"New unique leads to insert: {len(new_unique)}")

# DRY RUN preview
print("=" * 60)
print("DRY RUN — Preview (first 5):")
print("=" * 60)
for i, l in enumerate(new_unique[:5], 1):
    print(f"  [{i}] {l['first_name']} {l['last_name']} | {l['email']} | {l['book_title']} | {l['genre']} | {l['website_url']}")

# INSERT
print()
print(f"Inserting {len(new_unique)} leads...")
success, fail = 0, 0
for lead in new_unique:
    payload = json.dumps([lead]).encode("utf-8")
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/author_leads",
        data=payload,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status in (200, 201):
                success += 1
                print(f"  ✓ {lead['email']}")
            else:
                fail += 1
                print(f"  ✗ {lead['email']} ({resp.status})")
    except urllib.error.HTTPError as e:
        fail += 1
        body = e.read().decode("utf-8")[:200]
        print(f"  ✗ {lead['email']} → {e.code}: {body}")
    time.sleep(0.2)

print(f"\nDONE: {success} inserted, {fail} failed")
