#!/bin/bash

# URL from command line argument
url=$1

# Timeout set for 5 minutes
timeout=300
start_time=$(date +%s)

while [ $(($(date +%s) - start_time)) -lt $timeout ]; do
  status_code=$(curl -o /dev/null -s -w "%{http_code}\n" "$url")
  
  if [ "$status_code" -lt 400 ] && [ "$status_code" -gt 0 ]; then
    echo "Status code is $status_code. Exiting."
    exit 0
  else
    echo "Status code is $status_code. Retrying..."
  fi
  
  # Wait for a bit before retrying
  sleep 5
done

echo "Timeout reached. Exiting."
exit 1