# 🚀 Public Domain Hunter - SaaS Platform

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://github.com/amiddlebrook/PublicDomainHunter)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://docker.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)](https://postgresql.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **A sophisticated SaaS platform for monitoring newly released public domain works and helping publishers identify monetization opportunities through AI-powered analytics and multi-source content discovery.**

---

## 🌟 Overview

Public Domain Hunter is a **comprehensive SaaS platform** designed to help publishers, indie filmmakers, and content creators discover, track, and monetize newly released public domain materials. The platform aggregates content from **12+ major public domain sources** providing **200+ million works** with advanced analytics, trend analysis, and competition insights.

**🔗 Live Demo**: [Coming Soon] | **📖 Documentation**: [View All Docs](#-documentation)

---

## 🔥 Key Features

### 🔍 **Multi-Source Content Discovery**
- **12+ Content Sources**: Project Gutenberg, Internet Archive, Europeana, HathiTrust, British Library, DPLA, and more
- **200+ Million Works**: Books, manuscripts, audio, video, images from global cultural institutions
- **Real-time Monitoring**: Automated discovery of newly released public domain content
- **Advanced Filtering**: By media type, author, publication year, language, and rights status

### 📊 **AI-Powered Analytics & Insights**
- **Google Trends Integration**: Demand forecasting and market analysis
- **Competition Intelligence**: Monitor competing works and market saturation
- **Performance Metrics**: Search volume, interest trends, and monetization potential
- **Interactive Dashboards**: Visual representation of trend data and analytics

### 🎯 **Business Intelligence**
- **Market Opportunity Scoring**: AI-powered algorithm for monetization potential
- **Competitive Analysis**: Market saturation and competitor tracking
- **Monetization Insights**: Revenue potential and market trend analysis
- **Export Capabilities**: JSON, CSV, and PDF export for reports and presentations

### 🚀 **Enterprise-Ready Architecture**
- **Modern Tech Stack**: FastAPI + Next.js + TypeScript + PostgreSQL + Redis
- **Containerized Deployment**: Docker + Docker Compose for easy scaling
- **Production Security**: SSL/TLS, rate limiting, JWT authentication
- **CI/CD Pipeline**: GitHub Actions for automated testing and deployment

---

## 🏗️ Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Backend** | FastAPI + SQLAlchemy | REST API with async support |
| **Frontend** | Next.js + TypeScript | Modern React application |
| **Database** | PostgreSQL | Primary data storage |
| **Cache** | Redis | Session storage & performance |
| **Deployment** | Docker + Nginx | Containerized production setup |
| **Analytics** | Google Trends API | Market intelligence |
| **Content APIs** | 12+ Sources | Multi-source content aggregation |
| **Payments** | Stripe | Subscription management |

---

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone and run automated setup
curl -fsSL https://raw.githubusercontent.com/amiddlebrook/PublicDomainHunter/main/quick-setup.sh | bash

# Or manually:
git clone https://github.com/amiddlebrook/PublicDomainHunter.git
cd PublicDomainHunter
./quick-setup.sh
```

### Option 2: Docker Compose

```bash
# Start all services (recommended for development)
docker-compose up -d

# Access your application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

### Option 3: Local Development

```bash
# Backend
cd backend && pip install -r requirements.txt
python -m uvicorn app:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

---

## 📚 Content Sources Integration

| Source | Content Volume | Update Frequency | API Access |
|--------|----------------|------------------|------------|
| **Project Gutenberg** | 70,000+ books | Daily | ✅ Free |
| **Internet Archive** | 35M+ items | Hourly | ✅ Free |
| **Europeana** | 50M+ cultural items | Daily | ✅ Free* |
| **HathiTrust** | 17M+ volumes | Weekly | ⚠️ Limited |
| **British Library** | 170M+ items | Weekly | ✅ Free |
| **DPLA** | 40M+ items | Daily | ✅ Free* |
| **Biodiversity Heritage** | 55M+ pages | Monthly | ✅ Free |

*API key required

---

## 💰 Pricing & Costs

### Startup Costs
- **Domain**: $10-20/year
- **SSL Certificate**: Free (Let's Encrypt)
- **Server**: $6-25/month (DigitalOcean)
- **API Keys**: Free (Google, Amazon, Stripe)

### Operational Costs
- **Small Scale** (100 users): $50-150/month
- **Medium Scale** (1,000 users): $200-500/month
- **Enterprise** (10,000+ users): $500-2,000+/month

**💡 Cost Calculator**: Run `./cost-calculator.sh` for personalized estimates

---

## 📖 Documentation

| Guide | Purpose | Audience |
|-------|---------|----------|
| **[SETUP.md](SETUP.md)** | Complete installation guide | Developers |
| **[CLOUDFLARE_PAGES_SETUP.md](CLOUDFLARE_PAGES_SETUP.md)** | Cloudflare Pages deployment | DevOps |
| **[CLOUDFLARE_AUTH_SETUP.md](CLOUDFLARE_AUTH_SETUP.md)** | OAuth setup for Cloudflare | Developers |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Production deployment | DevOps |
| **[API_SOURCES.md](API_SOURCES.md)** | Content source integration | Developers |
| **[COST_GUIDE.md](COST_GUIDE.md)** | Cost analysis & planning | Business |
| **[API Documentation](http://localhost:8000/docs)** | Interactive API reference | Developers |

---

## 🔧 API Endpoints

### Core Content Endpoints
```http
GET    /api/works           # List and filter public domain works
GET    /api/works/{id}      # Get detailed work information
POST   /api/works           # Create new work entries
GET    /api/search          # Advanced search with analytics
```

### Analytics & Intelligence
```http
GET    /api/analytics/dashboard    # Platform analytics
GET    /api/works/{id}/trends     # Trend data for specific work
GET    /api/trends/analyze        # Custom trend analysis
GET    /api/competition/search    # Competition analysis
```

### User Management
```http
POST   /api/auth/login      # User authentication
POST   /api/auth/register   # User registration
GET    /api/users/me        # Current user profile
```

---

## 🚢 Deployment Options

### ☁️ Cloudflare Pages (Recommended for Frontend)
```bash
# Deploy frontend to Cloudflare Pages with edge authentication
# See CLOUDFLARE_PAGES_SETUP.md for step-by-step instructions

# Configure KV namespace and environment variables in Cloudflare Dashboard
# Push to GitHub - automatic deployment via Cloudflare Pages
```
**Features**: Free tier, global CDN, edge authentication, auto-scaling
**Cost**: $0-20/month (includes Workers, KV storage)
**Setup Guide**: [CLOUDFLARE_PAGES_SETUP.md](CLOUDFLARE_PAGES_SETUP.md)

### 🐳 Docker Compose (Development & Production)
```bash
# Development
docker-compose up -d

# Production
./deploy.sh production
```

### ☁️ Cloud Platforms (Backend Deployment)
- **DigitalOcean**: $6-25/month (great for startups)
- **AWS/GCP**: $50-500+/month (enterprise scale)
- **Railway/Render**: $5-25/month (managed platforms)
- **Cloudflare + Backend Host**: Frontend on Cloudflare Pages (free) + Backend on any platform

### 🛠️ Infrastructure as Code
- **Terraform**: Infrastructure provisioning
- **Kubernetes**: Container orchestration
- **GitHub Actions**: CI/CD pipeline included

---

## 🧪 Testing & Quality

```bash
# Run test suite
pytest

# Check code coverage
pytest --cov=app

# Frontend testing
cd frontend && npm run test

# Integration testing
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

**Coverage Targets**: Backend >80%, Frontend >70%

---

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes with tests
4. **Test** thoroughly: `pytest && npm test`
5. **Update** documentation as needed
6. **Commit** with clear messages: `git commit -m 'Add amazing feature'`
7. **Push** and create Pull Request

### Contribution Areas
- 🔍 **Content Sources**: Add new public domain APIs
- 📊 **Analytics**: Improve trend analysis algorithms
- 🎨 **UI/UX**: Enhance the frontend experience
- 📚 **Documentation**: Improve guides and examples
- 🧪 **Testing**: Add test coverage

### Code Standards
- **Backend**: PEP 8, type hints, comprehensive docstrings
- **Frontend**: ESLint + Prettier, TypeScript strict mode
- **Tests**: Minimum 80% coverage, descriptive test names
- **Commits**: Clear, concise messages following conventional commits

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Project Gutenberg** for public domain content
- **Internet Archive** for comprehensive collections
- **Europeana** for cultural heritage data
- **FastAPI** and **Next.js** communities for excellent frameworks
- **Open Source Community** for tools and libraries

---

## 📞 Support & Contact

### Getting Help
- **📖 Documentation**: [Complete Documentation](./docs/)
- **🐛 Issues**: [GitHub Issues](https://github.com/amiddlebrook/PublicDomainHunter/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/amiddlebrook/PublicDomainHunter/discussions)
- **📧 Email**: [Contact](mailto:support@publicdomainhunter.com)

### Resources
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://postgresql.org/docs/)

---

## 🎯 Roadmap

### Phase 1 (Current) ✅
- [x] Multi-source content aggregation
- [x] Basic analytics and trend analysis
- [x] Production-ready deployment
- [x] Comprehensive documentation

### Phase 2 (Next)
- [ ] Advanced AI-powered recommendations
- [ ] Mobile application
- [ ] Real-time collaboration features
- [ ] Advanced reporting and insights

### Phase 3 (Future)
- [ ] Blockchain-based rights verification
- [ ] International copyright law integration
- [ ] Advanced machine learning models
- [ ] API marketplace for third-party integrations

---

**🌟 Public Domain Hunter** - *Empowering creators with public domain intelligence through cutting-edge technology and comprehensive analytics.*

[![Made with ❤️](https://img.shields.io/badge/Made%20with%20%E2%9D%A4%EF%B8%8F%20by%20AI-red)](https://github.com/amiddlebrook)

---

> **⭐ Star this repository if you find it helpful!**
