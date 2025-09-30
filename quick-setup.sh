#!/bin/bash

# Public Domain Hunter - Quick Setup Script
# This script helps you get started quickly with the correct configuration

set -e

echo "🚀 Public Domain Hunter - Quick Setup"
echo "====================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Clone repository if not already done
if [ ! -d ".git" ]; then
    echo ""
    echo "📥 Cloning repository..."
    git clone https://github.com/amiddlebrook/PublicDomainHunter.git .
    cd PublicDomainHunter
fi

echo ""
echo "📋 Setting up configuration files..."

# Copy environment templates
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env from template"
else
    echo "✅ .env already exists"
fi

if [ ! -f "frontend/.env.local" ]; then
    cp frontend/.env.local frontend/.env.local
    echo "✅ Created frontend/.env.local from template"
else
    echo "✅ frontend/.env.local already exists"
fi

echo ""
echo "🔑 Next steps for API configuration:"
echo ""
echo "1. 📧 Set up Gmail App Password:"
echo "   - Enable 2FA on your Gmail account"
echo "   - Generate App Password: https://support.google.com/accounts/answer/185833"
echo ""
echo "2. 🔍 Get Google Trends API Key:"
echo "   - Go to: https://console.cloud.google.com/"
echo "   - Enable Google Trends API"
echo "   - Create API Key"
echo ""
echo "3. 🛒 Set up Amazon Associates:"
echo "   - Sign up: https://affiliate-program.amazon.com/"
echo "   - Apply for Product Advertising API"
echo "   - Get API credentials"
echo ""
echo "4. 💳 Configure Stripe:"
echo "   - Sign up: https://stripe.com"
echo "   - Get API keys from dashboard"
echo ""
echo "📝 Edit your .env file with these values:"
echo "   nano .env"
echo ""
echo "🚀 Start development environment:"
echo "   docker-compose up -d"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📖 For detailed instructions, see SETUP.md"
echo ""
echo "Happy coding! 🎉"
