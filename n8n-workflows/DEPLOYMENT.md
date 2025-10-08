# Public Domain Hunter — n8n Deployment Guide

This document shows how to run the n8n-based Public Domain Hunter locally and in production.

## Quick local setup (development)
1. Copy environment file:
   cp n8n-workflows/env.example .env
   Edit `.env` and fill in credentials.

2. Start services:
   docker-compose -f n8n-workflows/docker-compose.n8n.yml up -d

3. Initialize the DB (run from host with psql available):
   docker exec -i <postgres-container> psql -U $POSTGRES_USER -d $POSTGRES_DB < n8n-workflows/init-db.sql

4. Import workflows:
   cd n8n-workflows
   chmod +x import-workflows.sh
   ./import-workflows.sh

5. Configure credentials inside n8n:
   - Add Postgres credential or set DATABASE_URL
   - Add SMTP credentials if using email alerts
   - Add external API keys as credentials or environment variables

6. Activate workflows in n8n after credentials are configured.

## Recommended import order
1. workflow-5-auth-api.json
2. workflow-6-works-api.json
3. workflow-7-search-api.json
4. workflow-8-analytics-api.json
5. workflow-9-alerts-api.json
6. workflow-10-files-api.json
7. workflow-1-content-discovery.json
8. workflow-2-trend-analysis.json
9. workflow-3-competition-analysis.json
10. workflow-4-report-generation.json
11. workflow-11-web-app.json

## Production notes
- Use a managed Postgres (strong passwords).
- Set N8N_PROTOCOL=https and WEBHOOK_URL to your domain.
- Put n8n behind a reverse proxy (nginx) with SSL termination.
- Use environment secrets manager for sensitive values.
- Periodically back up Postgres and n8n data.

## Troubleshooting
- If workflows fail to import, check n8n REST API is reachable (http://localhost:5678).
- If Postgres connection fails, verify credentials and network.
- For webhook testing, use local tunneling (only in dev) or proper public domain in production.
