# Public Domain Hunter

A sophisticated SaaS platform for monitoring newly released public domain works and helping publishers identify monetization opportunities.

## Overview

Public Domain Hunter is a comprehensive SaaS platform designed to help publishers, indie filmmakers, and content creators discover, track, and monetize newly released public domain materials. The platform monitors various sources for new public domain content and provides analytics, trend analysis, and competition insights.

## Features

### 🔍 **Content Discovery**
- **Multi-source Monitoring**: Track newly released public domain content from Project Gutenberg, Internet Archive, HathiTrust, and Europeana
- **Real-time Alerts**: Get notified when new works matching your criteria become available
- **Advanced Search**: Filter by media type, author, publication year, and more

### 📊 **Analytics & Insights**
- **Trend Analysis**: Google Trends integration for demand forecasting
- **Competition Analysis**: Monitor competing works and market saturation
- **Performance Metrics**: Track search volume, interest trends, and market performance

### 🎯 **Business Intelligence**
- **Work Detail Pages**: Comprehensive metadata, trend graphs, and competitive analysis
- **Market Opportunity Scoring**: AI-powered scoring system for monetization potential
- **Export Capabilities**: Export findings in JSON, CSV,

## Frontend Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Quick Start

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.local .env.local
# Edit .env.local with your configuration
```

4. **Run the development server**
```bash
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:3000
- API Documentation: http://localhost:8000/docs

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Start all services**
```bash
docker-compose up -d
```

2. **View logs**
```bash
docker-compose logs -f
```

3. **Stop services**
```bash
docker-compose down
```

### Manual Docker Build

**Backend:**
```bash
docker build -f Dockerfile.backend -t public-domain-hunter-backend .
docker run -p 8000:8000 public-domain-hunter-backend
```

**Frontend:**
```bash
docker build -f Dockerfile.frontend -t public-domain-hunter-frontend .
docker run -p 3000:3000 public-domain-hunter-frontend
```

## Features Overview

### 🔍 **Content Discovery**
- **Advanced Search**: Full-text search with filtering and sorting
- **Multi-source Integration**: Project Gutenberg, Internet Archive, HathiTrust, Europeana
- **Real-time Updates**: Live data from public domain repositories

### 📊 **Analytics Dashboard**
- **Trend Analysis**: Google trends integration for demand forecasting
- **Competition Analysis**: Amazon sales data and market intelligence
- **Performance Metrics**: Search volume, interest trends, monetization potential
- **Interactive Charts**: Visual representation of trend data

### 🎯 **Business Intelligence**
- **Market Opportunity Scoring**: AI-powered scoring algorithm
- **Competitive Analysis**: Market saturation and competitor tracking
- **Monetization Insights**: Revenue potential and market trends
- **Export Capabilities**: JSON, CSV, and PDF export options

### 🚀 **Modern Tech Stack**
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Real-time APIs**: Google trends + Amazon Product Advertising
- **Containerization**: Docker + Docker Compose
- **Authentication**: JWT-based secure authentication

## API Endpoints

### Core Endpoints
- `GET /api/works` - List and filter public domain works
- `GET /api/works/{id}` - Get detailed work information
- `POST /api/works` - Create new work entries
- `GET /api/search` - Advanced search with analytics
- `GET /api/analytics/dashboard` - Platform analytics

### Trend Analysis
- `GET /api/works/{id}/trends` - Trend data for specific work
- `GET /api/trends/analyze` - Custom trend analysis
- `GET /api/competition/search` - Competition analysis

### User Management
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/users/me` - Current user profile

## Development Guidelines

### Code Style
- **Backend**: Follow PEP 8, use type hints, comprehensive docstrings
- **Frontend**: ESLint + Prettier, TypeScript strict mode
- **Database**: SQLAlchemy 2.0 best practices

### Testing
- **Backend**: pytest with async support
- **Frontend**: Jest + React Testing Library
- **Integration**: End-to-end testing with Playwright

### Deployment
- **Development**: Docker Compose with hot reload
- **Production**: Kubernetes or AWS ECS
- **CI/CD**: GitHub Actions with automated testing

## Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards
- Write comprehensive docstrings for all functions
- Add type hints to all Python functions
- Follow RESTful API design principles
- Use meaningful variable and function names
- Keep functions small and focused
- Add error handling for all API calls

## Support & Documentation

### Getting Help
- **Documentation**: Comprehensive API docs at `/docs`
- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Use GitHub Discussions for questions and help

### Resources
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Public Domain Hunter** - Empowering creators with public domain intelligence through cutting-edge technology and comprehensive analytics.
