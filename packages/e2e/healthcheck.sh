#!/bin/bash

# URL from command line argument
url=$1

# Timeout set for 2 minutes
timeout=120
start_time=$(date +%s)

while [ $(($(date +%s) - start_time)) -lt $timeout ]; do
  status_code=$(curl -o /dev/null -s -w "%{http_code}\n" "$url")
  
  if [ "$status_code" -lt 400 ]; then
    echo "Status code is $status_code, which is less than 400. Exiting."
    exit 0
  else
    echo "Status code is $status_code, which is not less than 400. Retrying..."
  fi
  
  # Wait for a bit before retrying
  sleep 5
done

echo "Timeout reached. Exiting."
exit 1