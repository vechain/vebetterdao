#!/bin/bash
set -e

echo "Zipping Lambda function..."

# Set directories
SRC_DIR="$(pwd)/api/src/vebetterpassport"
DIST_DIR="$(pwd)/dist"

# Create dist directory
mkdir -p "$DIST_DIR"

# Zip the source files directly
echo "Zipping files from $SRC_DIR to $DIST_DIR/vebetterpassport.zip"
cd "$(pwd)/api/src" && zip -r "../../$DIST_DIR/vebetterpassport.zip" vebetterpassport

echo "Zip completed successfully!" 