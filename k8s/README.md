# ZapTicket Kubernetes Deployment

This directory contains Kubernetes manifests to deploy ZapTicket to a Kubernetes cluster.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- Docker registry access
- Ingress controller (nginx-ingress or similar)

## Quick Start

### 1. Update Configuration

Edit `02-secrets.yaml` and update all default passwords and keys:

```yaml
stringData:
  DATABASE_PASSWORD: "your-secure-password"
  JWT_SECRET: "your-secure-jwt-secret"
  MEILISEARCH_API_KEY: "your-meilisearch-key"
  MINIO_ACCESS_KEY: "your-minio-user"
  MINIO_SECRET_KEY: "your-minio-password"
```

Edit `30-ingress.yaml` and update the domain:

```yaml
spec:
  rules:
    - host: zapticket.yourdomain.com
```

### 2. Build and Push Images

```bash
# Update REGISTRY in Makefile first
make build
make push
```

Or manually:

```bash
docker build -t your-registry/zapticket-api:latest -f apps/api/Dockerfile .
docker build -t your-registry/zapticket-web:latest -f apps/web/Dockerfile .
docker push your-registry/zapticket-api:latest
docker push your-registry/zapticket-web:latest
```

Update `20-api.yaml` and `21-web.yaml` with your registry URL.

### 3. Deploy

```bash
make deploy
```

Or with kubectl:

```bash
kubectl apply -k ./k8s/
```

### 4. Check Status

```bash
make status
make pods
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Ingress (nginx)                       │
│                   zapticket.yourdomain.com               │
└─────────────────────┬───────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
    ┌─────▼─────┐          ┌─────▼─────┐
    │   Web     │          │    API    │
    │ (Next.js) │          │ (NestJS)  │
    └───────────┘          └─────┬─────┘
                                 │
    ┌────────────┬───────────────┼───────────────┐
    │            │               │               │
┌───▼───┐   ┌───▼───┐    ┌──────▼─────┐  ┌────▼────┐
│Postgres│   │ Redis │    │Meilisearch │  │  MinIO  │
└────────┘   └───────┘    └────────────┘  └─────────┘
```

## Services

| Service       | Internal URL           | External   |
|---------------|-----------------------|------------|
| PostgreSQL   | postgres:5432         | -          |
| Redis        | redis:6379            | -          |
| Meilisearch  | meilisearch:7700      | -          |
| MinIO        | minio:9000            | -          |
| API          | api:3001              | via Ingress|
| Web          | web:80                | via Ingress|

## Scaling

Horizontal Pod Autoscalers are configured for both API and Web:
- Min replicas: 2
- Max replicas: 10
- CPU target: 70%
- Memory target: 80%

## Storage

PersistentVolumeClaims are created for:
- PostgreSQL: 10Gi
- Redis: 1Gi
- Meilisearch: 2Gi
- MinIO: 5Gi

Adjust sizes in respective YAML files based on your needs.

## Troubleshooting

### View logs
```bash
make logs
make logs-web
```

### Restart deployments
```bash
make restart
```

### Check pod status
```bash
kubectl get pods -n zapticket -w
```

### Describe pod
```bash
kubectl describe pod <pod-name> -n zapticket
```

## Production Considerations

1. **Secrets Management**: Consider using external secrets operators (HashiCorp Vault, AWS Secrets Manager)
2. **SSL/TLS**: Update ingress with your SSL certificate
3. **Database**: Use managed PostgreSQL (Cloud SQL, RDS) for production
4. **Redis**: Use managed Redis (Redis Cloud, ElastiCache) for production
5. **Monitoring**: Add Prometheus + Grafana for observability
6. **Logging**: Add ELK stack or Loki for centralized logging
7. **Backup**: Configure regular backups for PostgreSQL and MinIO
