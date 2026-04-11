import sys
import json
import urllib.request
import os

URL = "https://fyiewpchabytergckpqw.supabase.co/functions/v1/mcp-server"
HEADERS = {
    "Content-Type": "application/json",
    "x-mcp-api-key": "OpenClaw2026!"
}

def call_tool(tool_name, arguments):
    req_body = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }
    req = urllib.request.Request(URL, data=json.dumps(req_body).encode('utf-8'), headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode('utf-8'))
            if 'error' in res:
                print(f"Error: {json.dumps(res['error'], indent=2)}")
            else:
                content = res.get('result', {}).get('content', [])
                for item in content:
                    print(item.get('text', ''))
    except Exception as e:
        print(f"HTTP Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 trym-mcp.py <tool_name> [json_args]")
        sys.exit(1)
    tool_name = sys.argv[1]
    arguments = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    call_tool(tool_name, arguments)
