#!/bin/bash

# Cloudflare Workers Deployment Script
# Run this script from your LOCAL machine with Cloudflare CLI installed

set -e  # Exit on error

echo "🚀 Public Domain Hunter - Cloudflare Deployment"
echo "================================================"
echo ""

# Check if wrangler is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if API token is set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "⚠️  CLOUDFLARE_API_TOKEN environment variable not set"
    echo ""
    read -p "Enter your Cloudflare API Token: " CLOUDFLARE_API_TOKEN
    export CLOUDFLARE_API_TOKEN
fi

echo "✅ Environment ready"
echo ""

# Step 1: Create D1 Database
echo "📊 Step 1: Creating D1 Database"
echo "--------------------------------"
echo "Running: npx wrangler d1 create publicdomainhunter_db"
echo ""

DB_OUTPUT=$(npx wrangler d1 create publicdomainhunter_db 2>&1)
echo "$DB_OUTPUT"

# Extract database_id from output
DATABASE_ID=$(echo "$DB_OUTPUT" | grep 'database_id' | sed 's/.*database_id = "\(.*\)"/\1/')

if [ -z "$DATABASE_ID" ]; then
    echo ""
    echo "❌ Failed to extract database_id from output"
    echo "Please check if the database already exists or if there was an error"
    echo ""
    read -p "Enter the database_id manually (or press Enter to skip): " DATABASE_ID

    if [ -z "$DATABASE_ID" ]; then
        echo "⏩ Skipping database creation - will use existing configuration"
    fi
fi

# Step 2: Update wrangler.toml
if [ ! -z "$DATABASE_ID" ]; then
    echo ""
    echo "📝 Step 2: Updating wrangler.toml with database_id"
    echo "---------------------------------------------------"

    # Check if d1_databases section exists
    if grep -q "d1_databases" wrangler.toml; then
        echo "✅ d1_databases section found in wrangler.toml"
    else
        echo "➕ Adding d1_databases section to wrangler.toml"
        cat >> wrangler.toml << EOF

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "publicdomainhunter_db"
database_id = "$DATABASE_ID"
EOF
    fi

    # Update the database_id if it exists
    sed -i.bak "s/database_id = \".*\"/database_id = \"$DATABASE_ID\"/" wrangler.toml
    echo "✅ Updated wrangler.toml with database_id: $DATABASE_ID"
else
    echo "⏩ Step 2: Skipped (database already configured)"
fi

# Step 3: Initialize Database Schema
echo ""
echo "🗄️  Step 3: Creating Database Tables"
echo "------------------------------------"

if [ -f "schema.sql" ]; then
    echo "Running: npx wrangler d1 execute publicdomainhunter_db --file=./schema.sql"
    npx wrangler d1 execute publicdomainhunter_db --file=./schema.sql
    echo "✅ Database schema created successfully"
else
    echo "⚠️  schema.sql not found - skipping schema creation"
    echo "You'll need to create the database tables manually"
fi

# Step 4: Build Frontend
echo ""
echo "🎨 Step 4: Building Frontend"
echo "----------------------------"
echo "Running: npm --prefix frontend install && npm --prefix frontend run cf:build"
cd frontend
npm install
npm run cf:build
cd ..
echo "✅ Frontend built successfully"

# Step 5: Deploy to Cloudflare
echo ""
echo "☁️  Step 5: Deploying to Cloudflare Workers"
echo "-------------------------------------------"
echo "Running: npx wrangler deploy"
npx wrangler deploy

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "Your application should now be live at:"
echo "https://publicdomainhunter.averymiddlebrook2014.workers.dev/"
echo ""
echo "📋 Next Steps:"
echo "1. Test the homepage: https://publicdomainhunter.averymiddlebrook2014.workers.dev/"
echo "2. Check health: https://publicdomainhunter.averymiddlebrook2014.workers.dev/auth/health"
echo "3. Test registration: https://publicdomainhunter.averymiddlebrook2014.workers.dev/register"
echo ""
echo "⚙️  Post-Deployment Configuration:"
echo ""
echo "If using a separate backend, set BACKEND_URL:"
echo "  1. Go to Cloudflare Dashboard → Workers & Pages → publicdomainhunter"
echo "  2. Settings → Variables → Add variable"
echo "  3. Name: BACKEND_URL, Value: https://your-backend-url.com"
echo ""
echo "If using OAuth (Google/GitHub login), configure in Dashboard:"
echo "  - GOOGLE_CLIENT_ID"
echo "  - GOOGLE_CLIENT_SECRET (encrypted)"
echo "  - GITHUB_CLIENT_ID"
echo "  - GITHUB_CLIENT_SECRET (encrypted)"
echo ""
echo "Done! 🚀"
