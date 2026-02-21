# Deployment Guide

This guide covers deploying ZapTicket in production environments.

## Prerequisites

- Docker & Docker Compose
- Domain name (for production)
- SSL certificate (Let's Encrypt recommended)
- Minimum 4GB RAM, 2 CPU cores

## Quick Deploy (Docker Compose)

### 1. Clone and Configure

```bash
git clone https://github.com/yourorg/zapticket.git
cd zapticket
cp .env.example .env
```

### 2. Update Environment Variables

Edit `.env` with production values:

```bash
# Required changes
NODE_ENV=production
JWT_SECRET=your-256-bit-secret-here
DATABASE_URL=postgresql://user:password@postgres:5432/zapticket
REDIS_URL=redis://redis:6379
MEILI_MASTER_KEY=your-master-key

# Email (required for production)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=your-smtp-password
SMTP_FROM="ZapTicket <noreply@example.com>"

# OAuth (optional)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

### 3. Deploy

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  web:
    image: zapticket/web:latest
    restart: always
    environment:
      - NODE_ENV=production
      - API_URL=https://api.yourdomain.com
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.web.tls.certresolver=letsencrypt"

  api:
    image: zapticket/api:latest
    restart: always
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.yourdomain.com`)"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  meilisearch:
    image: getmeili/meilisearch:v1.5
    restart: always
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
      MEILI_ENV: production
    volumes:
      - meilisearch_data:/meili_data

  minio:
    image: minio/minio:latest
    restart: always
    command: server /data
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data

  traefik:
    image: traefik:v3.0
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - traefik_data:/letsencrypt
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"

volumes:
  postgres_data:
  redis_data:
  meilisearch_data:
  minio_data:
  traefik_data:
```

## Kubernetes Deployment

### 1. Create Namespace

```bash
kubectl create namespace zapticket
```

### 2. Create Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: zapticket-secrets
  namespace: zapticket
type: Opaque
stringData:
  DATABASE_URL: "postgresql://..."
  JWT_SECRET: "your-secret"
  REDIS_URL: "redis://redis:6379"
```

### 3. Deploy Components

```bash
kubectl apply -f k8s/
```

## Environment Variables Reference

### Required

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Secret for JWT signing (256-bit) |
| REDIS_URL | Redis connection string |

### Email

| Variable | Description |
|----------|-------------|
| SMTP_HOST | SMTP server hostname |
| SMTP_PORT | SMTP port (usually 587) |
| SMTP_USER | SMTP username |
| SMTP_PASS | SMTP password |
| SMTP_FROM | From email address |

### Storage

| Variable | Description |
|----------|-------------|
| MINIO_ENDPOINT | MinIO endpoint |
| MINIO_ACCESS_KEY | MinIO access key |
| MINIO_SECRET_KEY | MinIO secret key |

### Search

| Variable | Description |
|----------|-------------|
| MEILI_HOST | Meilisearch URL |
| MEILI_MASTER_KEY | Meilisearch master key |

## Scaling

### Horizontal Scaling

The API can be scaled horizontally:

```bash
docker compose up -d --scale api=3
```

For Kubernetes:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
```

### Database

For production, consider:
- Managed PostgreSQL (AWS RDS, Google Cloud SQL)
- Read replicas for scaling
- Connection pooling with PgBouncer

### Redis

For production:
- Use Redis Cluster for HA
- Enable persistence (AOF + RDB)

## Monitoring

### Health Checks

- `/health` - Basic health check
- `/health/ready` - Readiness check (includes DB)

### Metrics

Prometheus metrics available at `/metrics`

### Logging

Structured JSON logs to stdout. Configure your log aggregator:

```json
{
  "level": "info",
  "timestamp": "2024-01-15T10:30:00Z",
  "message": "Ticket created",
  "ticketId": "clx123abc"
}
```

## Backup

### Database Backup

```bash
# Manual backup
docker exec zapticket-db pg_dump -U zapticket zapticket > backup.sql

# Restore
docker exec -i zapticket-db psql -U zapticket zapticket < backup.sql
```

### Automated Backups

Use a cron job or Kubernetes CronJob:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: db-backup
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:16-alpine
            command:
            - /bin/sh
            - -c
            - pg_dump $DATABASE_URL > /backup/backup-$(date +%Y%m%d).sql
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secret (256-bit)
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable firewall rules
- [ ] Regular security updates
- [ ] Database encryption at rest
- [ ] Regular backups tested
