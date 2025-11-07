#!/bin/bash

set -e

echo "🚀 Deploying Public Domain Hunter Backend to Cloudflare..."

cd backend-worker

# Check if wrangler is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npm/npx is required. Please install Node.js"
    exit 1
fi

# Check if database_id is set
if grep -q 'database_id = ""' wrangler.toml; then
    echo ""
    echo "📋 Step 1: Creating D1 database..."
    echo "Run this command and copy the database_id:"
    echo ""
    echo "  cd backend-worker && npx wrangler d1 create publicdomainhunter"
    echo ""
    echo "Then update backend-worker/wrangler.toml with the database_id"
    echo "and run this script again."
    exit 1
fi

echo "✅ Database configured"

# Initialize database
echo ""
echo "📋 Step 2: Initializing database schema..."
npx wrangler d1 execute publicdomainhunter --file=./schema.sql || echo "⚠️  Database may already be initialized"

# Check if SECRET_KEY is set
echo ""
echo "📋 Step 3: Checking secrets..."
echo "Make sure you've set SECRET_KEY:"
echo ""
echo "  cd backend-worker && npx wrangler secret put SECRET_KEY"
echo ""
read -p "Have you set the SECRET_KEY? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please set SECRET_KEY and run this script again."
    exit 1
fi

# Deploy backend worker
echo ""
echo "📋 Step 4: Deploying backend worker..."
npx wrangler deploy

echo ""
echo "✅ Backend deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Copy the worker URL from the output above"
echo "2. Update wrangler.toml (in root directory) BACKEND_URL with this URL"
echo "3. Deploy frontend: cd .. && npx wrangler deploy"
echo ""
