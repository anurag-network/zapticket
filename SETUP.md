# Getting Started with ZapTicket

## Quick Start (5 minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/anurag-network/zapticket.git
cd zapticket
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

The default values in `.env.example` are configured for local development. You can use them as-is or customize.

### 3. Start ZapTicket

```bash
# Start all services with Docker Compose
docker compose up -d

# Or use make
make up
```

### 4. Access the Application

After startup (may take 2-3 minutes on first run):

| Service | URL |
|---------|-----|
| **Web App** | http://localhost:3000 |
| **API** | http://localhost:3001 |
| **API Docs** | http://localhost:3001/api/docs |
| **MinIO Console** | http://localhost:9001 |

### 5. Create Your Account

1. Open http://localhost:3000
2. Click "Sign Up" 
3. Enter your details:
   - Organization Name
   - Your Name
   - Email
   - Password
4. Start using ZapTicket!

---

## First-Time Setup

### Database Migrations

Migrations run automatically on startup. If you need to run manually:

```bash
# Run migrations
docker compose exec api npx prisma migrate deploy

# Generate Prisma client
docker compose exec api npx prisma generate
```

### Seed Initial Data

To add sample data for testing:

```bash
docker compose exec api npx prisma db seed
```

---

## Common Commands

### Start Services
```bash
docker compose up -d          # Start all services
docker compose up -d --build # Rebuild and start
```

### Stop Services
```bash
docker compose down          # Stop services (keep data)
docker compose down -v       # Stop and remove data
```

### View Logs
```bash
docker compose logs -f       # All logs
docker compose logs -f api    # API logs only
docker compose logs -f web    # Web logs only
```

### Reset Everything
```bash
docker compose down -v --remove-orphans
docker compose up -d --build
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | zapticket | Database user |
| `POSTGRES_PASSWORD` | zapticket_secret | Database password |
| `POSTGRES_DB` | zapticket | Database name |
| `JWT_SECRET` | (random) | JWT signing key |
| `MEILISEARCH_MASTER_KEY` | zapticket_master_key | Search engine key |
| `MINIO_ROOT_USER` | zapticket | S3 storage user |
| `MINIO_ROOT_PASSWORD` | zapticket_secret | S3 storage password |

---

## Troubleshooting

### Services won't start

```bash
# Check service status
docker compose ps

# Check logs
docker compose logs postgres
```

### Database connection errors

```bash
# Wait for PostgreSQL to be ready
docker compose logs postgres | grep "database system is ready"
```

### Port already in use

```bash
# Check what's using the port
lsof -i :3000
lsof -i :3001

# Or change ports in .env
WEB_PORT=3002
API_PORT=3003
```

### First run is slow

- First Docker build takes 3-5 minutes
- Database initialization takes ~30 seconds
- Subsequent runs are faster

---

## Accessing Services from Outside Docker

The services are exposed on these ports:

- **3000**: Web Application
- **3001**: API Server  
- **5432**: PostgreSQL
- **6379**: Redis
- **7700**: Meilisearch
- **9000**: MinIO (API)
- **9001**: MinIO (Console)

---

## Production Deployment

For production, see:
- [Kubernetes Deployment](./k8s/README.md)
- Update all secret values in `.env`
- Use strong passwords
- Enable SSL/TLS
