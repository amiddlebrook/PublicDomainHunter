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
- **Monetization Potential**: Amazon API integration for sales data and revenue potential
- **Performance Metrics**: Track search volume, interest trends, and market performance

### 🎯 **Business Intelligence**
- **Work Detail Pages**: Comprehensive metadata, trend graphs, and competitive analysis
- **Market Opportunity Scoring**: AI-powered scoring system for monetization potential
- **Export Capabilities**: Export findings in JSON, CSV, and PDF formats
- **API Integration**: RESTful API for custom integrations

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.9+)
- **Database**: PostgreSQL (production) / SQLite (development)
- **ORM**: SQLAlchemy 2.0
- **Authentication**: JWT tokens with bcrypt hashing
- **API Documentation**: Auto-generated with FastAPI

### Frontend (Coming Soon)
- **Framework**: React/Next.js
- **UI Components**: Modern, responsive design
- **Charts & Visualization**: Interactive trend graphs and analytics

### Infrastructure
- **Containerization**: Docker support
- **Deployment**: AWS/Heroku ready
- **Monitoring**: Comprehensive logging and health checks

## Installation

### Prerequisites
- Python 3.9 or higher
- PostgreSQL (optional, for production)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/amiddlebrook/PublicDomainHunter.git
cd PublicDomainHunter
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables**
```bash
cp .env .env.local
# Edit .env.local with your configuration
```

4. **Run the development server**
```bash
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

5. **Access the API**
- API Documentation: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

## API Usage

### Authentication
The API uses JWT tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer your-jwt-token
```

### Key Endpoints

- `GET /api/v1/works` - List all public domain works
- `GET /api/v1/works/{id}` - Get specific work details
- `POST /api/v1/works` - Create a new work entry
- `GET /api/v1/search?q={query}` - Search for works
- `GET /api/v1/works/{id}/metrics` - Get work analytics

### Example Request

```bash
curl -X GET "http://localhost:8000/api/v1/works?media_type=book&limit=10" \
  -H "accept: application/json"
```

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black .
flake8 .
```

### Database Migrations
```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## Deployment

### Docker Deployment
```bash
docker build -t public-domain-hunter .
docker run -p 8000:8000 public-domain-hunter
```

### Production Deployment
1. Set `ENVIRONMENT=production` in your environment variables
2. Configure PostgreSQL database
3. Set up proper CORS origins
4. Configure SSL/TLS certificates
5. Set up monitoring and logging

## Contributing

Contributions are welcome! Please read our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow PEP 8 style guidelines
- Write comprehensive docstrings
- Add type hints to all functions
- Create tests for new features
- Update documentation as needed

## License

MIT License - see the LICENSE file for details.

## Support

For support, please contact the development team or create an issue in the GitHub repository.

---

**Public Domain Hunter** - Empowering creators with public domain intelligence.
