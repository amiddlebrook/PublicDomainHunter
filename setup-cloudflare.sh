#!/bin/bash

# Cloudflare Infrastructure Setup Script
# This script helps you set up the required Cloudflare infrastructure for Public Domain Hunter

set -e

echo "🚀 Public Domain Hunter - Cloudflare Infrastructure Setup"
echo "==========================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Error: wrangler CLI is not installed${NC}"
    echo ""
    echo "Please install wrangler first:"
    echo "  npm install -g wrangler"
    echo ""
    echo "Or use npx to run commands:"
    echo "  npx wrangler --version"
    exit 1
fi

echo -e "${GREEN}✅ wrangler CLI found${NC}"
echo ""

# Function to prompt user
prompt_continue() {
    read -p "Press Enter to continue or Ctrl+C to exit..."
    echo ""
}

# Step 1: Create CACHE KV Namespace
echo "📦 Step 1: Create CACHE KV Namespace"
echo "----------------------------------------"
echo "This creates a KV namespace for caching API responses and rate limiting."
echo ""
echo "Commands to run:"
echo "  wrangler kv:namespace create \"CACHE\""
echo "  wrangler kv:namespace create \"CACHE\" --preview"
echo ""
read -p "Do you want to run these commands now? (y/n): " create_cache
if [ "$create_cache" = "y" ]; then
    echo ""
    echo "Creating CACHE namespace..."
    wrangler kv:namespace create "CACHE"
    echo ""
    echo "Creating CACHE preview namespace..."
    wrangler kv:namespace create "CACHE" --preview
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Copy the IDs from above and update wrangler.toml${NC}"
    echo "Update the CACHE binding section in wrangler.toml:"
    echo "  [[kv_namespaces]]"
    echo "  binding = \"CACHE\""
    echo "  id = \"YOUR_CACHE_KV_ID_HERE\"          <- Replace this"
    echo "  preview_id = \"YOUR_CACHE_KV_PREVIEW_ID_HERE\"  <- Replace this"
    echo ""
    prompt_continue
fi

# Step 2: Create R2 Bucket
echo "🗄️  Step 2: Create R2 Bucket"
echo "----------------------------------------"
echo "This creates an R2 bucket for storing uploaded files (EPUB, PDF, etc.)."
echo ""
echo "Commands to run:"
echo "  wrangler r2 bucket create publicdomainhunter-files"
echo ""
read -p "Do you want to run this command now? (y/n): " create_r2
if [ "$create_r2" = "y" ]; then
    echo ""
    echo "Creating R2 bucket..."
    wrangler r2 bucket create publicdomainhunter-files
    echo ""
    echo -e "${GREEN}✅ R2 bucket created${NC}"
    echo ""
    prompt_continue
fi

# Step 3: Create Queue
echo "📮 Step 3: Create Queue"
echo "----------------------------------------"
echo "This creates a queue for background job processing."
echo ""
echo "Commands to run:"
echo "  wrangler queues create publicdomainhunter-jobs"
echo ""
read -p "Do you want to run this command now? (y/n): " create_queue
if [ "$create_queue" = "y" ]; then
    echo ""
    echo "Creating queue..."
    wrangler queues create publicdomainhunter-jobs
    echo ""
    echo -e "${GREEN}✅ Queue created${NC}"
    echo ""
    prompt_continue
fi

# Step 4: Set Secrets
echo "🔐 Step 4: Set Secrets"
echo "----------------------------------------"
echo "Now you need to set the required secrets."
echo ""
echo "Required secret:"
echo "  • JWT_SECRET - A strong random string (min 32 characters)"
echo ""
echo "Optional secrets (for AI features):"
echo "  • OPENAI_API_KEY"
echo "  • CLAUDE_API_KEY"
echo ""

read -p "Do you want to set JWT_SECRET now? (y/n): " set_jwt
if [ "$set_jwt" = "y" ]; then
    echo ""
    echo "You will be prompted to enter the JWT_SECRET."
    echo "Tip: Generate a strong secret with: openssl rand -base64 32"
    echo ""
    wrangler secret put JWT_SECRET
    echo ""
    echo -e "${GREEN}✅ JWT_SECRET set${NC}"
    echo ""
fi

read -p "Do you want to set OPENAI_API_KEY? (y/n): " set_openai
if [ "$set_openai" = "y" ]; then
    echo ""
    wrangler secret put OPENAI_API_KEY
    echo ""
    echo -e "${GREEN}✅ OPENAI_API_KEY set${NC}"
    echo ""
fi

read -p "Do you want to set CLAUDE_API_KEY? (y/n): " set_claude
if [ "$set_claude" = "y" ]; then
    echo ""
    wrangler secret put CLAUDE_API_KEY
    echo ""
    echo -e "${GREEN}✅ CLAUDE_API_KEY set${NC}"
    echo ""
fi

# Step 5: Initialize Database
echo "🗃️  Step 5: Initialize Database"
echo "----------------------------------------"
echo "This will initialize the D1 database with the schema."
echo ""
echo "Command to run:"
echo "  wrangler d1 execute publicdomainhunter_db --file=schema.sql"
echo ""
read -p "Do you want to run this command now? (y/n): " init_db
if [ "$init_db" = "y" ]; then
    echo ""
    echo "Initializing database..."
    wrangler d1 execute publicdomainhunter_db --file=schema.sql
    echo ""
    echo -e "${GREEN}✅ Database initialized${NC}"
    echo ""
    prompt_continue
fi

# Step 6: Deploy
echo "🚀 Step 6: Deploy"
echo "----------------------------------------"
echo "Finally, deploy your application to Cloudflare."
echo ""
echo "Command to run:"
echo "  wrangler deploy"
echo ""
read -p "Do you want to deploy now? (y/n): " deploy_now
if [ "$deploy_now" = "y" ]; then
    echo ""
    echo "Deploying..."
    wrangler deploy
    echo ""
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo ""
fi

# Summary
echo ""
echo "=========================================================="
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "=========================================================="
echo ""
echo "Summary of what was configured:"
echo "  ✓ CACHE KV namespace (for caching)"
echo "  ✓ R2 bucket (for file storage)"
echo "  ✓ Queue (for background jobs)"
echo "  ✓ Secrets (JWT_SECRET and optional AI keys)"
echo "  ✓ Database schema initialized"
echo "  ✓ Application deployed"
echo ""
echo "Next steps:"
echo "  1. If you skipped updating wrangler.toml with KV IDs, do that now"
echo "  2. Visit your Cloudflare dashboard to verify everything is set up"
echo "  3. Test your application endpoints"
echo "  4. Set up monitoring and alerts"
echo ""
echo "For more information, see:"
echo "  • CLOUDFLARE_NATIVE_SETUP.md - Complete setup guide"
echo "  • DEPLOY_QUICKSTART.md - Quick deployment reference"
echo ""
echo "Happy deploying! 🚀"
