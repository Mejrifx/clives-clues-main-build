#!/bin/bash

# Auto-commit script for Clive's Blog App
# Usage: ./auto-commit.sh "Your commit message"

if [ -z "$1" ]; then
    echo "❌ Please provide a commit message"
    echo "Usage: ./auto-commit.sh \"Your commit message\""
    exit 1
fi

echo "🚀 Starting auto-commit process..."

# Add all changes
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "✅ No changes to commit - everything is up to date!"
    exit 0
fi

# Commit with the provided message
git commit -m "$1"

# Push to GitHub
git push origin main

echo "🎉 Successfully pushed changes to GitHub!"
echo "💫 Your changes will automatically deploy to Netlify!" 