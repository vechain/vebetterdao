#!/bin/bash
set -e

# Print script banner
echo "Building Lambda function..."

# Validate environment parameter
ENVIRONMENT="${1:-testnet}"  # Default to testnet if not specified
if [[ "$ENVIRONMENT" != "testnet" && "$ENVIRONMENT" != "mainnet" ]]; then
    echo "Error: Invalid environment: $ENVIRONMENT. Must be 'testnet' or 'mainnet'"
    exit 1
fi
echo "Building for environment: $ENVIRONMENT"

# Get root directory path (already in root)
ROOT_DIR="$(pwd)"
LAMBDA_DIR="${ROOT_DIR}/packages/lambda"
DIST_DIR="${ROOT_DIR}/dist"

# Check if lambda directory exists
if [[ ! -d "$LAMBDA_DIR" ]]; then
    echo "Error: Lambda directory not found at $LAMBDA_DIR"
    exit 1
fi

# Navigate to the lambda package directory
cd "$LAMBDA_DIR"

# Run yarn build
echo "Running yarn build..."
yarn build || { echo "Error: Failed to build lambda package"; exit 1; }

# Create the dist directory for Terraform
mkdir -p "$DIST_DIR" || { echo "Error: Failed to create dist directory"; exit 1; }

# Set source and destination zip paths based on environment
if [[ "$ENVIRONMENT" == "testnet" ]]; then
    # For testnet, use the staging directory
    SOURCE_ZIP="${LAMBDA_DIR}/dist/staging/resetSignalCounter/index.zip"
else
    # For mainnet, use the mainnet directory
    SOURCE_ZIP="${LAMBDA_DIR}/dist/mainnet/resetSignalCounter/index.zip"
fi

# Verify source zip exists
if [[ ! -f "$SOURCE_ZIP" ]]; then
    echo "Error: Source ZIP file not found at $SOURCE_ZIP"
    exit 1
fi

# Copy to the destination with the expected name
DEST_ZIP="${DIST_DIR}/vebetterpassport.zip"
echo "Copying $SOURCE_ZIP to $DEST_ZIP"
cp "$SOURCE_ZIP" "$DEST_ZIP" || { echo "Error: Failed to copy ZIP file"; exit 1; }

echo "Build completed successfully!" 