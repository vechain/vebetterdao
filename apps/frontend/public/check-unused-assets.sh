#!/bin/bash

ASSETS_DIR="apps/frontend/public/assets"
SRC_DIR="apps/frontend/src"
REPORT_FILE="unused-assets-report.txt"
FAVICON_MANIFEST="$ASSETS_DIR/favicon/manifest.json"
FAVICON_CONFIG="$ASSETS_DIR/favicon/browserconfig.xml"

# Get changed asset files in the current commit (staged), exclude deletions
changed_assets=$(git diff --cached --name-status | awk '$2 ~ /^public\/assets\// && $1 != "D" { sub(/^public\/assets\//, "", $2); print $2 }' | grep -v ".DS_Store")

# Start fresh report file
echo "🔍 Unused Asset Report - $(date)" > "$REPORT_FILE"
echo "Only checking staged assets..." >> "$REPORT_FILE"
echo "-----------------------------------" >> "$REPORT_FILE"

echo "🔍 Checking for unused changed assets..."
unused_count=0

for asset in $changed_assets; do
  # Escape special characters for grep
  escaped_asset=$(printf '%s\n' "$asset" | sed 's/[][\.*^$/]/\\&/g')

  # Check usage in src and favicon files
  used_in_src=$(grep -r --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git "$escaped_asset" "$SRC_DIR")
  used_in_manifest=$(grep -F "$asset" "$FAVICON_MANIFEST" 2>/dev/null)
  used_in_browserconfig=$(grep -F "$asset" "$FAVICON_CONFIG" 2>/dev/null)

  if [[ -z "$used_in_src" && -z "$used_in_manifest" && -z "$used_in_browserconfig" ]]; then
    echo "$ASSETS_DIR/$asset" >> "$REPORT_FILE"
    echo "🗃️ Unused: $ASSETS_DIR/$asset"
    unused_count=$((unused_count + 1))
  fi
done

# Summary
if [ "$unused_count" -eq 0 ]; then
  echo "✅ All staged assets are used." | tee -a "$REPORT_FILE"
  exit 0
else
  echo "⚠️ $unused_count unused assets found in this commit. See $REPORT_FILE for details." | tee -a "$REPORT_FILE"
  exit 1
fi