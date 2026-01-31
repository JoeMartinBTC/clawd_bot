#!/usr/bin/env python3
import os
import sys
import json
import urllib.request
import urllib.error

# Config
API_KEY = os.environ.get("MOONSHOT_API_KEY")
BASE_URL = "https://api.moonshot.ai/v1/chat/completions"
MODEL = "kimi-k2-0905-preview"

def main():
    if not API_KEY:
        print("ERROR: MOONSHOT_API_KEY environment variable not set.")
        print("Please enable Kimi in moltbot.json and restart container.")
        sys.exit(1)

    if len(sys.argv) < 2:
        print("Usage: kimi <prompt>")
        sys.exit(1)

    prompt = " ".join(sys.argv[1:])

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }

    try:
        req = urllib.request.Request(
            BASE_URL,
            data=json.dumps(payload).encode('utf-8'),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req) as response:
            data = json.load(response)
            # moonshot/kimi response format matches OpenAI
            content = data['choices'][0]['message']['content']
            print(content)

    except urllib.error.HTTPError as e:
        print(f"API Error: {e.code} - {e.read().decode('utf-8')}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
