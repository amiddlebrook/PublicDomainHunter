#!/bin/bash
# Quick fix script for Cloudflare Workers registration

set -e

echo "🚀 Fixing Registration for Cloudflare Workers"
echo "=============================================="
echo ""

# Step 1: Deploy backend
echo "Step 1: Deploy Backend to Railway"
echo "----------------------------------"
read -p "Do you want to deploy the backend now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! command -v railway &> /dev/null; then
        echo "Installing Railway CLI..."
        npm install -g @railway/cli
    fi

    railway login
    railway init
    railway add --database postgres

    SECRET_KEY=$(openssl rand -hex 32)
    railway variables set SECRET_KEY="$SECRET_KEY"
    railway variables set ENVIRONMENT=production

    railway up
    BACKEND_URL=$(railway domain)

    echo ""
    echo "✅ Backend deployed at: $BACKEND_URL"
else
    echo ""
    read -p "Enter your backend URL (e.g., https://your-api.railway.app): " BACKEND_URL
fi

echo ""
echo "Step 2: Update Cloudflare Workers Configuration"
echo "------------------------------------------------"
echo ""
echo "Your backend URL is: $BACKEND_URL"
echo ""
echo "Choose how to update BACKEND_URL:"
echo "  1) Update wrangler.toml and redeploy via CLI"
echo "  2) Update via Cloudflare Dashboard (manual)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "Updating wrangler.toml..."

    # Update BACKEND_URL in wrangler.toml
    sed -i.bak "s|BACKEND_URL = \".*\"|BACKEND_URL = \"$BACKEND_URL\"|" wrangler.toml

    echo "✅ wrangler.toml updated"
    echo ""

    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        echo "Installing Wrangler CLI..."
        npm install -g wrangler
    fi

    echo "Deploying to Cloudflare Workers..."
    wrangler deploy

    echo ""
    echo "✅ Deployed to Cloudflare Workers!"

elif [ "$choice" = "2" ]; then
    echo ""
    echo "📋 Manual Steps:"
    echo "1. Go to: https://dash.cloudflare.com/"
    echo "2. Navigate to: Workers & Pages → publicdomainhunter"
    echo "3. Click: Settings → Variables and Secrets"
    echo "4. Add/Update variable:"
    echo "   - Name: BACKEND_URL"
    echo "   - Value: $BACKEND_URL"
    echo "5. Click: Save"
    echo "6. Go to: Deployments → Click 'Redeploy'"
    echo ""
fi

echo ""
echo "=================================================="
echo "✅ Setup Complete!"
echo "=================================================="
echo ""
echo "Verify your deployment:"
echo "  1. Test backend: curl $BACKEND_URL/health"
echo "  2. Test worker: curl https://publicdomainhunter.averymiddlebrook2014.workers.dev/auth/health"
echo "  3. Try registration: https://publicdomainhunter.averymiddlebrook2014.workers.dev/register"
echo ""
