#!/bin/bash

ASSETS_DIR="apps/frontend/public/assets"
SRC_DIR="apps/frontend/src"
FAVICON_MANIFEST="$ASSETS_DIR/favicon/manifest.json"
FAVICON_CONFIG="$ASSETS_DIR/favicon/browserconfig.xml"

# all assets in the assets directory
# all_assets=$(find "$ASSETS_DIR" -type f -not -name ".DS_Store" | sed "s|$ASSETS_DIR/||")

# changed assets in the current commit
changed_assets=$(git diff --cached --name-status | awk '$2 ~ /^apps\/frontend\/public\/assets\// && $1 != "D" { sub(/^apps\/frontend\/public\/assets\//, "", $2); print $2 }' | grep -v ".DS_Store")

# if no changed assets, exit
if [ -z "$changed_assets" ]; then
  exit 0
fi

echo "🔍 Checking for unused changed assets..."
unused_count=0

# for asset in $all_assets; do
for asset in $changed_assets; do
  # Escape special characters for grep
  escaped_asset=$(printf '%s\n' "$asset" | sed 's/[][\.*^$/]/\\&/g')

  # Check usage in src and favicon files
  used_in_src=$(grep -r --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git "$escaped_asset" "$SRC_DIR")
  used_in_manifest=$(grep -F "$asset" "$FAVICON_MANIFEST" 2>/dev/null)
  used_in_browserconfig=$(grep -F "$asset" "$FAVICON_CONFIG" 2>/dev/null)

  if [[ -z "$used_in_src" && -z "$used_in_manifest" && -z "$used_in_browserconfig" ]]; then
    echo "🗃️ Unused: $ASSETS_DIR/$asset"
    unused_count=$((unused_count + 1))
  fi
done

# Summary
if [ "$unused_count" -eq 0 ]; then
  echo "✅ All staged assets are used."
  exit 0
else
  echo "⚠️ $unused_count unused assets found in this commit."
  exit 1
fi