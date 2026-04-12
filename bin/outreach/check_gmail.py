import os
import google.auth
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

def main():
    creds_path = "/data/.openclaw/credentials/gog/credentials.json"
    if not os.path.exists(creds_path):
        print("No Gmail credentials found at", creds_path)
        return
        
    creds = Credentials.from_authorized_user_file(creds_path, ['https://www.googleapis.com/auth/gmail.readonly'])
    service = build('gmail', 'v1', credentials=creds)
    
    # Get messages from Supabase
    results = service.users().messages().list(userId='me', q="Supabase", maxResults=5).execute()
    messages = results.get('messages', [])
    
    if not messages:
        print("No Supabase emails found.")
        return
        
    for msg in messages:
        txt = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
        headers = txt['payload']['headers']
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
        print(f"Found email: {subject}")
        print(f"ID: {msg['id']}")

if __name__ == '__main__':
    main()
