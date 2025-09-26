#!/bin/bash

# Pre-commit script to fix formatting and linting issues
echo "🔧 Running Biome check and fix..."
npm run check:fix

echo "🏗️  Building TypeScript..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ All checks passed! Ready to commit."
    git add .
else
    echo "❌ Build failed. Please fix the errors before committing."
    exit 1
fi