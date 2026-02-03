#!/bin/bash

# Push the TypeScript fixes to GitHub
echo "Pushing TypeScript fixes to GitHub..."

# Use gh CLI to push
gh repo sync --force

echo "Creating pull request..."
gh pr create --fill --web

echo "Done! The PR should open in your browser."
