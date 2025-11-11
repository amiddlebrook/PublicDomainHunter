#!/bin/bash
# Quick deployment script for Railway

set -e

echo "🚀 Public Domain Hunter - Railway Deployment Script"
echo "=================================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
else
    echo "✅ Railway CLI found"
fi

echo ""
echo "📝 Logging in to Railway..."
railway login

echo ""
echo "🔧 Initializing Railway project..."
railway init

echo ""
echo "🗄️  Adding PostgreSQL database..."
railway add --database postgres

echo ""
echo "🔐 Setting environment variables..."
SECRET_KEY=$(openssl rand -hex 32)
railway variables set SECRET_KEY="$SECRET_KEY"
railway variables set ENVIRONMENT=production

echo ""
echo "🚀 Deploying backend..."
railway up

echo ""
echo "🌐 Generating public domain..."
RAILWAY_URL=$(railway domain)

echo ""
echo "=================================================="
echo "✅ Deployment Complete!"
echo "=================================================="
echo ""
echo "Your backend is deployed at:"
echo "   $RAILWAY_URL"
echo ""
echo "Next steps:"
echo "1. Copy the URL above"
echo "2. Go to Cloudflare Dashboard:"
echo "   https://dash.cloudflare.com/"
echo "3. Navigate to: Workers & Pages → Your Project → Settings → Environment Variables"
echo "4. Update BACKEND_URL to: $RAILWAY_URL"
echo "5. Redeploy your Cloudflare Pages site"
echo ""
echo "Verify deployment:"
echo "   curl $RAILWAY_URL/health"
echo ""
echo "View logs:"
echo "   railway logs"
echo ""
