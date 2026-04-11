#!/bin/bash
# Description: Free URL searcher using DuckDuckGo to feed n8n lead generation
# Usage: ./free-url-finder.sh "search query"

QUERY=$1
if [ -z "$QUERY" ]; then
  # Default to a random query from a list if none provided
  QUERIES=(
    "\"indie author\" \"about me\" \"contact\" site:*.com"
    "\"welcome to my website\" \"indie author\" email site:*.com"
    "\"official website of\" \"author\" contact site:*.com"
    "\"sign up for my newsletter\" \"my writing\" site:*.com"
    "\"buy my book\" \"contact me\" author site:*.com"
  )
  RANDOM_INDEX=$(( $RANDOM % ${#QUERIES[@]} ))
  QUERY=${QUERIES[$RANDOM_INDEX]}
fi

echo "[*] Searching DuckDuckGo for: $QUERY"

# Use duckduckgo-search to grab 50 results
RESULTS=$(ddgs text -k "$QUERY" -m 20 -d)

# Check if results are empty
if [ -z "$RESULTS" ] || [ "$RESULTS" == "[]" ]; then
    echo "[!] No results found or rate limited by DDG."
    exit 1
fi

# Extract URLs and send them to n8n webhook
echo "$RESULTS" | jq -r '.[].href' | while read url; do
  echo "[*] Sending to n8n: $url"
  curl -s -X POST "https://n8n.readnrate.com/webhook/author-lead-processor" \
       -H "Content-Type: application/json" \
       -d "{\"url\": \"$url\"}" > /dev/null
  # Small delay to not overwhelm the webhook
  sleep 1
done

echo "[*] Batch complete!"
