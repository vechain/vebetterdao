#!/bin/bash

# Script to check that no console.log() statements are present in the current commit
# This script will exit with code 1 if console.log() is found, 0 if clean

echo "🔍 Checking for console.log() statements in staged files..."

# Get list of staged files (only .ts, .tsx files)
staged_files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$')

if [ -z "$staged_files" ]; then
    echo "✅ No TypeScript files staged for commit"
    exit 0
fi

# Check each staged file for console.log statements in the entire file content
found_logs=false
for file in $staged_files; do
    if [ -f "$file" ]; then
        # Search for console.log patterns in the entire file content (including variations like console.warn, console.error, etc.)
        log_lines=$(grep -n -E "console\.(log|warn|error|info|debug)" "$file" | grep -v "// eslint-disable-line no-console" | grep -v "/* eslint-disable.*no-console")
        
        if [ ! -z "$log_lines" ]; then
            echo "❌ Found console statements in: $file"
            echo "$log_lines"
            found_logs=true
        fi
    fi
done

if [ "$found_logs" = true ]; then
    echo ""
    echo "💡 Tip: Remove console statements or add eslint-disable comments if intentional"
    echo "   Example: console.log('debug') // eslint-disable-line no-console"
    exit 1
else
    echo "✅ No console.log() statements found in staged files"
    exit 0
fi
