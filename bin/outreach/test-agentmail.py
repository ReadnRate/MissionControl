import os
from agentmail import AgentMail

def test_api():
    api_key = os.getenv("AGENTMAIL_API_KEY")
    client = AgentMail(api_key=api_key)
    
    print(f"Testing API key: {api_key[:10]}...")
    
    try:
        print("1. Testing client.inboxes.list()...")
        inboxes = client.inboxes.list()
        print(f"   Success! Found {len(inboxes.inboxes)} inboxes.")
        for i in inboxes.inboxes:
            print(f"   - {i.inbox_id} ({i.display_name})")
    except Exception as e:
        print(f"   Failed: {e}")

    try:
        print("\n2. Testing client.inboxes.create()...")
        # Don't actually create if we don't need to, but this would verify write access
        # inbox = client.inboxes.create(display_name="Test Joe")
        # print(f"   Success! Created: {inbox.inbox_id}")
        print("   Skipped create to avoid clutter.")
    except Exception as e:
        print(f"   Failed: {e}")

if __name__ == "__main__":
    test_api()
