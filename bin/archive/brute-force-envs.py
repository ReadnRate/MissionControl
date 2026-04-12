from agentmail import AgentMail, AgentMailEnvironment
import os

key = os.getenv('AGENTMAIL_API_KEY')
envs = {
    "PROD": AgentMailEnvironment.PROD,
    "EU_PROD": AgentMailEnvironment.EU_PROD,
    "PROD_X_402": AgentMailEnvironment.PROD_X_402,
    "PROD_MPP": AgentMailEnvironment.PROD_MPP
}

for name, env in envs.items():
    print(f"--- Testing {name} ({env.http}) ---")
    try:
        client = AgentMail(api_key=key, environment=env)
        res = client.inboxes.list(limit=1)
        print(f"✅ Success on {name}!")
        print(res)
        break
    except Exception as e:
        print(f"❌ Failed on {name}: {e}")
    print()
