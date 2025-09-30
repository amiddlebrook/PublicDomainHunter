# 🚀 Public Domain Hunter - Complete Setup Guide

This comprehensive guide will walk you through setting up Public Domain Hunter for both development and production environments.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker & Docker Compose** (recommended) or **Python 3.11+** and **Node.js 18+**
- **Git** for version control
- **SSL certificates** for production (Let's Encrypt recommended)
- **API keys** for external services

## 🛠️ Development Setup

### Option 1: Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/amiddlebrook/PublicDomainHunter.git
   cd PublicDomainHunter
   ```

2. **Start the development environment:**
   ```bash
   docker-compose up -d
   ```

3. **Verify services are running:**
   ```bash
   docker-compose ps
   # Should show: postgres, redis, backend, frontend all running
   ```

4. **Access your application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Option 2: Local Development

1. **Backend Setup:**
   ```bash
   # Install Python dependencies
   pip install -r requirements.txt

   # Set up environment variables
   cp .env.example .env
   # Edit .env with your local configuration

   # Run database migrations
   python -c "from app.database import create_tables; create_tables()"

   # Start the backend server
   python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend

   # Install dependencies
   npm install

   # Set up environment variables
   cp .env.local .env.local
   # Edit .env.local with your API URL

   # Start development server
   npm run dev
   ```

## 🔑 API Keys & External Services Setup

### Required API Keys

| Service | Purpose | How to Get |
|---------|---------|------------|
| **Google Trends API** | Trend analysis for public domain works | [Google Cloud Console](https://console.cloud.google.com/) |
| **Amazon Product API** | Competition analysis and sales data | [Amazon Associates](https://affiliate-program.amazon.com/) |
| **Stripe** | Payment processing for subscriptions | [Stripe Dashboard](https://stripe.com) |
| **Email Service** | Notifications and alerts | Gmail/other SMTP |

### Step-by-Step API Key Setup

#### 1. Google Trends API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google Trends API"
4. Create credentials (API Key)
5. Add to your `.env` file: `GOOGLE_TRENDS_API_KEY=your_key_here`

#### 2. Amazon Product Advertising API
1. Sign up for [Amazon Associates](https://affiliate-program.amazon.com/)
2. Apply for Product Advertising API access (may take 1-2 days)
3. Create API credentials in your Associates account
4. Add to your `.env` file:
   ```
   AMAZON_API_KEY=your_access_key_id
   AMAZON_SECRET_KEY=your_secret_access_key
   AMAZON_ASSOCIATE_TAG=your_associate_tag
   ```

#### 3. Stripe Setup
1. Create a [Stripe account](https://stripe.com)
2. Go to Developers → API Keys
3. Copy your publishable and secret keys
4. Add webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
5. Add to your `.env` file:
   ```
   STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
   STRIPE_SECRET_KEY=sk_test_your_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

#### 4. Email Configuration
For Gmail (recommended for development):
1. Enable 2-factor authentication on your Gmail account
2. Generate an [App Password](https://support.google.com/accounts/answer/185833)
3. Add to your `.env` file:
   ```
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   ```

## ⚙️ Environment Variables Configuration

### Development (.env)

```bash
# Basic Configuration
ENVIRONMENT=development
DEBUG=True
SECRET_KEY=your-dev-secret-key-minimum-32-characters

# Database (SQLite for development)
DATABASE_URL=sqlite:///./public_domain_hunter.db

# URLs
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:8000

# API Keys (add your keys here)
GOOGLE_TRENDS_API_KEY=your_google_trends_key
AMAZON_API_KEY=your_amazon_key
AMAZON_SECRET_KEY=your_amazon_secret
AMAZON_ASSOCIATE_TAG=your_associate_tag

# Email (Gmail for development)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Stripe (use test keys for development)
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key
STRIPE_SECRET_KEY=sk_test_your_test_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret

# Optional: AWS S3 for file storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
```

### Production (.env.production)

```bash
# Basic Configuration
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=your-production-secret-key-minimum-32-characters-long

# Database (PostgreSQL for production)
DATABASE_URL=postgresql://postgres:your_password@db:5432/public_domain_hunter

# URLs
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com

# Stripe (use live keys for production)
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret

# All other API keys same as development but with production values
```

### Frontend (.env.local)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Application Configuration
NEXT_PUBLIC_APP_NAME="Public Domain Hunter"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_AI_INSIGHTS=true
NEXT_PUBLIC_ENABLE_EXPORTS=true

# Development
NODE_ENV=development
```

## 🚀 Production Deployment

### Step 1: Server Setup

1. **Provision a server** (DigitalOcean, AWS, etc.)
2. **Install Docker and Docker Compose**
3. **Point your domain** to the server IP
4. **Clone the repository** to your server

### Step 2: SSL Certificate Setup

**Option A: Let's Encrypt (Recommended)**
```bash
# Install certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Update nginx.conf with certificate paths:
# ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

**Option B: Custom Certificate**
- Place your certificate files in the `ssl/` directory
- Update `nginx.conf` with correct paths

### Step 3: Deploy Application

```bash
# On your server:
cd PublicDomainHunter

# Copy and configure environment
cp .env.example .env.production
nano .env.production  # Edit with your production values

# Run deployment script
./deploy.sh production
```

### Step 4: Verify Deployment

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Health checks
curl https://yourdomain.com/health
curl https://yourdomain.com/api/health
```

## 🔧 Configuration Files Explained

| File | Purpose | When to Edit |
|------|---------|--------------|
| `.env` | Development environment variables | Local development |
| `.env.production` | Production environment variables | Production deployment |
| `.env.example` | Template for environment setup | Reference only |
| `frontend/.env.local` | Frontend environment variables | Frontend development |
| `docker-compose.yml` | Development Docker setup | Local development |
| `docker-compose.prod.yml` | Production Docker setup | Production deployment |
| `nginx.conf` | Reverse proxy configuration | SSL & domain setup |

## 🧪 Testing Your Setup

### Development Testing
```bash
# Run backend tests
pytest

# Run frontend tests (if implemented)
cd frontend && npm run test

# Check API endpoints
curl http://localhost:8000/health
curl http://localhost:8000/docs
```

### Production Testing
```bash
# Health check endpoints
curl https://yourdomain.com/health
curl https://yourdomain.com/api/health

# Test API functionality
curl https://yourdomain.com/api/works

# Check frontend
curl https://yourdomain.com
```

## 🔍 Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

**2. API Keys Not Working**
- Verify API keys are correctly set in `.env` files
- Check rate limits on external APIs
- Ensure API services are enabled and active

**3. SSL Certificate Issues**
```bash
# Check certificate validity
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL configuration
curl -I https://yourdomain.com
```

**4. Frontend Not Loading**
```bash
# Check if frontend container is running
docker-compose ps frontend

# Check frontend logs
docker-compose logs frontend

# Verify API URL in frontend/.env.local
```

### Logs and Debugging

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Enter container for debugging
docker-compose exec backend bash
docker-compose exec frontend bash
```

## 📞 Support & Next Steps

### After Setup

1. **Test all features** - Create works, run analytics, test payments
2. **Set up monitoring** - Consider adding error tracking (Sentry)
3. **Configure backups** - Set up automated database backups
4. **Performance testing** - Test with realistic data loads

### Getting Help

- Check the `DEPLOYMENT.md` file for detailed deployment info
- Review application logs for error messages
- Open issues on GitHub for bugs or feature requests

---

**🎉 Congratulations! Your Public Domain Hunter SaaS platform is now ready for launch!**

For additional help or custom configurations, refer to the documentation files or reach out to the development team.
