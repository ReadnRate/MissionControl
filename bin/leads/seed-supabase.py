import os
import requests
import json
from datetime import datetime, timezone

URL = "https://zexumnlvkrjryvzrlavp.supabase.co/rest/v1"
HEADERS = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def insert_task(title, description, project, priority, status, assigned_to):
    data = {
        "title": title,
        "description": description,
        "project": project,
        "priority": priority,
        "status": status,
        "assigned_to": assigned_to
    }
    res = requests.post(f"{URL}/tasks", headers=HEADERS, json=data)
    print(f"Task inserted: {title} - {res.status_code}")

def insert_idea(title, details, project):
    data = {
        "title": title,
        "details": details,
        "project": project,
        "status": "idea"
    }
    res = requests.post(f"{URL}/ideas", headers=HEADERS, json=data)
    print(f"Idea inserted: {title} - {res.status_code}")

def insert_intel(title, category, summary, importance):
    data = {
        "title": title,
        "category": category,
        "summary": summary,
        "importance": importance
    }
    res = requests.post(f"{URL}/intel", headers=HEADERS, json=data)
    print(f"Intel inserted: {title} - {res.status_code}")

# --- CLEAR OLD DUMMY DATA ---
requests.delete(f"{URL}/tasks?id=not.is.null", headers=HEADERS)
requests.delete(f"{URL}/ideas?id=not.is.null", headers=HEADERS)
requests.delete(f"{URL}/intel?id=not.is.null", headers=HEADERS)
print("Cleared old data.")

# --- INSERT REAL TASKS ---
insert_task("Launch Viral Campaign (500 Subs)", "Top 5 Tactics: Reddit guerrilla marketing, BookTok challenge, 50 Reviews Guarantee, Free review for 100 authors, Digg.com blitz (2 channels).", "Read & Rate", "critical", "todo", "AURA")
insert_task("Mission Control Redesign", "Complete overhaul of UI/UX. Must look extremely professional, modern, clean (not 1983). Dark mode, glassmorphism, or modern dashboard SaaS look.", "Mission Control", "high", "in_progress", "FORGE")
insert_task("Agent Command Center", "Live agent status board and direct chat messaging interface to send commands directly to Joe, Forge, Aura, Beacon.", "Mission Control", "high", "in_progress", "FORGE")
insert_task("Trym White-label Launch Prep", "Prepare marketing and launch strategy for Trym white-label SaaS.", "Trym", "medium", "backlog", "AURA")
insert_task("GCA Sécurité Incendie Maintenance", "Monitor and manage the fire safety platform (full-time job responsibilities).", "GCA", "medium", "backlog", "JOE")

# --- INSERT REAL IDEAS ---
insert_idea("Read & Rate: 50 Reviews in 30 Days Guarantee", "Offer a bold guarantee to attract the first massive wave of authors. If we fail, money back.", "Read & Rate")
insert_idea("Digg.com Content Blitz", "Use the 2 existing high-DA (90+) Digg channels to push massive traffic and authority to Read & Rate.", "Read & Rate")

# --- INSERT REAL INTEL ---
insert_intel("Read & Rate Competitors", "competitor", "Kirkus, NetGalley, BookSirens dominate the space. Need aggressive guerrilla tactics to breach.", "high")
insert_intel("Amazon KDP Community Size", "industry", "/r/KDP has 16k+ authors. Massive potential for grassroots marketing.", "high")
