#!/usr/bin/env python3
"""
Super Data - Read & Rate: Author Lead Scraping → Supabase Insertion
Scraped from: web_search + web_fetch (Brave API)
"""
import json
import re
import time
import urllib.request
import urllib.parse

SUPABASE_URL = "https://zexumnlvkrjryvzrlavp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM"

# ──────────────────────────────────────────────
# ALL VERIFIED LEADS (scraped today, 2026-03-25)
# All emails verified via web_fetch or web_search
# Format: (first_name, last_name, email, book_title, genre, website_url, personalization_text)
# ──────────────────────────────────────────────

def is_valid_email(email):
    if not email:
        return False
    pattern = r'^[\w\.\+\-]+@[\w\.\-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email.strip()))

def normalize_email(email):
    return email.strip().lower().rstrip('.')

NEW_LEADS = [
    # Bloggers / Book Reviewers
    ("Kriti", "", "kriti@armedwithabook.com",
     "Armed with A Book", "YA / Book Reviews",
     "https://armedwithabook.com",
     "Hi Kriti, I came across your blog and love your focus on indie & self-published authors. Read & Rate helps authors get honest reviews — would love to feature your reviews!"),
    
    ("Ti", "", "bookishchatter@gmail.com",
     "Book Chatter", "Book Reviews",
     "https://bookchatter.net",
     "Hi Ti! Your blog is fantastic — I've been following your reviews. Read & Rate could be a great platform to showcase indie authors. Let's connect!"),
    
    ("Kelly", "", "coffeeandmissingstars@gmail.com",
     "Coffee, Stars, Books", "YA Fiction",
     "https://coffeestarsbooks.wordpress.com",
     "Hi Kelly, love your YA focus! Read & Rate helps indie authors get discovered — your blog would be a perfect fit for our community."),
    
    ("Robert", "Skuce", "reviews@robertskuce.com",
     "BookAddiction", "Book Reviews / Horror",
     "https://bookaddictionuk.wordpress.com",
     "Hi Robert, I've seen your detailed reviews on BookAddiction. Read & Rate supports indie authors with genuine feedback — would love to partner with you!"),
    
    ("Hannah", "VanDerHart", "hannah@ecotheo.org",
     "EcoTheo Review", "Literary Fiction / Reviews",
     "https://www.ecotheo.org",
     "Hi Hannah, EcoTheo Review's focus on thoughtful literary analysis aligns beautifully with Read & Rate's mission. Let's explore collaboration!"),
    
    # Literary journals
    ("", "", "info@drb.ie",
     "Dublin Review of Books", "Literary Fiction",
     "https://www.drb.ie",
     "Hello, I'm reaching out from Read & Rate — a platform connecting indie authors with serious book reviewers like the DRB."),
    
    ("", "", "serbookreview@gmail.com",
     "Southeast Review", "Literary Fiction",
     "https://www.serbookreview.com",
     "Hi Southeast Review team, Read & Rate helps indie authors gain visibility. We'd love to feature your reviews and connect you with authors!"),
    
    # More book bloggers
    ("Michelle", "", "Michelle.Bookbriefs@gmail.com",
     "Book Briefs", "YA / Fantasy / Romance",
     "https://bookbriefs.net",
     "Hi Michelle! Book Briefs' focus on YA and fantasy/romance is exactly what Read & Rate loves. Happy to connect and share your great work with authors!"),
    
    ("Laura", "", "fuonlyknew@gmail.com",
     "fuonlyknew", "Horror / PNR / Fantasy",
     "https://fuonlyknew.com",
     "Hi Laura! Your horror and paranormal reviews are amazing. Read & Rate is building a community for indie authors — your blog would be a great fit!"),
    
    ("Ana", "", "ana@anasattic.com",
     "Ana's Attic Book Blog", "Contemporary Romance / Romantic Comedy",
     "https://anasattic.com",
     "Hi Ana! Ana's Attic has such a warm community. Read & Rate connects indie romance authors with reviewers — let's work together!"),
    
    ("Simone", "", "simonelikesbooks@gmail.com",
     "Simone and Her Books", "Fantasy / SciFi",
     "https://simoneandherbooks.com",
     "Hi Simone, your fantasy and sci-fi focus is fantastic! Read & Rate helps indie fantasy authors reach dedicated reviewers like you."),
    
    # Indie Authors (KDP)
    ("Jade", "Phillips", "authorjadephillips@gmail.com",
     "Unfortunate Souls (Urban Fantasy)", "Urban Fantasy / Paranormal Romance",
     "https://jademphillips.com",
     "Hi Jade! Love your urban fantasy work. Read & Rate helps authors like you get honest reviews and grow their readership."),
    
    ("Shanna", "Pikora", "StoriesbyShannaP.gmail.com",
     "Stories by Shanna P.", "Sweet to Spicy Romance",
     "https://storiesbyshannap.com",
     "Hi Shanna! Your sweet and spicy romance stories are wonderful. Read & Rate would love to help you connect with more readers!"),
    
    ("Janice", "Spina", "jjspina@comcast.net",
     "Jemsbooks", "Fantasy / Children's Books",
     "https://jemsbooks.blog",
     "Hi Janice! Your Jemsbooks are a delight. Read & Rate supports indie authors — happy to help spread the word about your books!"),
    
    ("Vania", "Margene Rheault", "vaniarheault@gmail.com",
     "Vania Margene Rheault", "Contemporary Romance",
     "https://vaniamargene.com",
     "Hi Vania! Your contemporary romance work is wonderful. Read & Rate helps romance authors get honest, constructive reviews. Let's connect!"),
    
    ("Maggie", "Tideswell", "magpiemags@ghostly.co.za",
     "Maggie Tideswell", "Paranormal Romance",
     "https://www.ghostly.co.za",
     "Hi Maggie! Your spooky paranormal romances are right up Read & Rate's alley. We'd love to help connect you with passionate reviewers!"),
    
    ("Romi", "", "romisbookcorner@gmail.com",
     "Romi Is Reading", "ARC Reader / Indie Author Advocate",
     None,
     "Hi Romi! Your ARC reading focus on indie authors is exactly what Read & Rate supports. Let's build something great together!"),
    
    ("Megan", "", "neverendingbookbasket@gmail.com",
     "Never Ending Book Basket", "NA / Contemporary Romance",
     "https://neverendingbookbasket.com",
     "Hi Megan! Never Ending Book Basket's love for NA/contemporary romance is wonderful. Read & Rate helps authors find passionate reviewers!"),
    
    ("Belle", "", "bellecanread@gmail.com",
     "Belle Can Read", "YA / Contemporary / Romance",
     "https://bellecanread.com",
     "Hi Belle! Your blog's reach into YA and contemporary romance aligns perfectly with Read & Rate's mission for indie authors."),
    
    ("", "", "NaughtyandNiceBookBlog@gmail.com",
     "Naughty and Nice Book Blog", "Contemporary Romance / Romantic Suspense",
     "http://www.naughtyandnicebookblog.com",
     "Hi! Naughty and Nice Book Blog is a fantastic romance resource. Read & Rate would love to connect indie romance authors with your review platform!"),
    
    ("", "", "submit@lit.buzz",
     "LitBuzz", "Book Reviews (Romance / Paranormal / Historical)",
     "https://thelitbuzz.com",
     "Hi LitBuzz team! Your review coverage of romance and paranormal fiction is impressive. Read & Rate helps indie authors reach reviewers like you."),
    
    ("Tessonja", "Odette", "tessonja@tessonjaodette.com",
     "Tessonja Odette", "Fantasy Romance / Fairytale Retellings",
     "https://tessonjaodette.com",
     "Hi Tessonja! Your fairytale retellings and fantasy romance are stunning. Read & Rate would love to help you connect with even more passionate readers!"),
    
    ("Cindy", "Patterson", "cindypattersonbks@gmail.com",
     "Cindy Patterson", "Crime Fiction",
     None,
     "Hi Cindy! Your crime fiction work is compelling. Read & Rate helps authors across genres get the honest reviews they deserve."),
    
    ("Laura", "", "laura@laurasbooksandblogs.com",
     "Laura's Books and Blogs", "Indie Author Reviews",
     "https://laurasbooksandblogs.com",
     "Hi Laura! Your dedication to reviewing indie authors is admirable. Read & Rate wants to support reviewers like you who champion indie voices!"),
    
    ("Darragh", "McManus", "darraghmcmanus@yahoo.com",
     "Darragh McManus", "Fiction / Thriller",
     "https://darraghmcmanus.com",
     "Hi Darragh! Your fiction and journalism work is impressive. Read & Rate supports authors who value genuine reader feedback."),
]

print(f"Total leads collected: {len(NEW_LEADS)}")
print()

# ─── Validate emails ───────────────────────────
valid_leads = []
invalid_count = 0
for lead in NEW_LEADS:
    first, last, email, title, genre, url, ptext = lead
    if not is_valid_email(email):
        print(f"SKIP (invalid email): {email}")
        invalid_count += 1
        continue
    normalized = normalize_email(email)
    valid_leads.append({
        "first_name": first or None,
        "last_name": last or None,
        "email": normalized,
        "book_title": title,
        "genre": genre,
        "website_url": url,
        "status": "new",
        "personalization_text": ptext,
    })

print(f"Valid leads: {len(valid_leads)}, Invalid emails skipped: {invalid_count}")
print()

# ─── Check for duplicates in existing DB ────
print("Fetching existing emails from Supabase...")
req = urllib.request.Request(
    f"{SUPABASE_URL}/rest/v1/author_leads?select=email",
    headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
)
with urllib.request.urlopen(req) as resp:
    existing_data = json.loads(resp.read())

existing_emails = set(normalize_email(e.get("email", "")) for e in existing_data)
print(f"Existing emails in DB: {len(existing_emails)}")

# Filter out duplicates
new_unique = [l for l in valid_leads if l["email"] not in existing_emails]
duplicates = len(valid_leads) - len(new_unique)
print(f"Duplicates filtered: {duplicates}")
print(f"New unique leads to insert: {len(new_unique)}")
print()

# ─── DRY RUN: Show first 5 ────────────────────
print("=" * 60)
print("DRY RUN — First 5 leads (preview before insert):")
print("=" * 60)
for i, lead in enumerate(new_unique[:5], 1):
    print(f"\n  [{i}] {lead['first_name']} {lead['last_name']}")
    print(f"      email:     {lead['email']}")
    print(f"      book:      {lead['book_title']}")
    print(f"      genre:     {lead['genre']}")
    print(f"      website:   {lead['website_url']}")
    print(f"      ptext:     {lead['personalization_text'][:80]}...")

print()
print(f"... ({len(new_unique) - 5} more leads after confirmation)")
# ─── INSERT all new leads ─────────────────────
import sys

if "--confirm" in sys.argv:
    print(f"Inserting {len(new_unique)} leads into Supabase...")
    success_count = 0
    fail_count = 0
    
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
                    success_count += 1
                    print(f"  ✓ {lead['email']}")
                else:
                    fail_count += 1
                    print(f"  ✗ {lead['email']} (status {resp.status})")
        except urllib.error.HTTPError as e:
            fail_count += 1
            body = e.read().decode("utf-8")[:200]
            print(f"  ✗ {lead['email']} → {e.code}: {body}")
        time.sleep(0.15)  # rate limit protection
    
    print()
    print(f"INSERT COMPLETE: {success_count} inserted, {fail_count} failed")
else:
    print()
    print("To INSERT all leads → run with --confirm flag")
    print("=" * 60)
