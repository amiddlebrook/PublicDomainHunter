#!/bin/bash

# Public Domain Hunter Deployment Script
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Deploying Public Domain Hunter to $ENVIRONMENT..."

# Check if required environment variables are set
if [ "$ENVIRONMENT" = "production" ]; then
    # Required environment variables for production
    REQUIRED_VARS=(
        "SECRET_KEY"
        "DB_PASSWORD"
        "STRIPE_SECRET_KEY"
        "AWS_ACCESS_KEY_ID"
        "DOMAIN_NAME"
    )

    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            echo "❌ Error: $var environment variable is not set"
            echo "Please set all required environment variables before deploying"
            exit 1
        fi
    done
fi

echo "✅ Environment variables check passed"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs ssl

# Generate SSL certificates if they don't exist
if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
    echo "🔐 Generating self-signed SSL certificate..."
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
        -subj "/CN=$DOMAIN_NAME" 2>/dev/null || echo "⚠️  SSL certificate generation failed - you'll need to provide your own certificates"
fi

# Pull latest images
echo "🐳 Pulling Docker images..."
docker-compose -f docker-compose.$ENVIRONMENT.yml pull

# Build application images
echo "🔨 Building application images..."
docker-compose -f docker-compose.$ENVIRONMENT.yml build

# Start services
echo "🎯 Starting services..."
docker-compose -f docker-compose.$ENVIRONMENT.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run database migrations if needed
echo "🗄️  Running database setup..."
docker-compose -f docker-compose.$ENVIRONMENT.yml exec -T backend python -c "
from app.database import create_tables
create_tables()
print('✅ Database setup completed')
"

# Run health checks
echo "🏥 Running health checks..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
    exit 1
fi

if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend health check passed"
else
    echo "❌ Frontend health check failed"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "🌐 Your application is now running:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost/api"
echo "   API Documentation: http://localhost/docs"
echo ""
echo "📊 To view logs:"
echo "   docker-compose -f docker-compose.$ENVIRONMENT.yml logs -f"
echo ""
echo "🛑 To stop the application:"
echo "   docker-compose -f docker-compose.$ENVIRONMENT.yml down"
