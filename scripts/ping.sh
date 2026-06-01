#!/usr/bin/env bash
# Simple ping script for local/testing use
URL="$1"
if [ -z "$URL" ]; then
  echo "Usage: $0 <url>"
  exit 1
fi

echo "Pinging $URL ..."
curl -fsS --max-time 15 "$URL" || {
  echo "Ping failed";
  exit 2;
}
echo "OK"
