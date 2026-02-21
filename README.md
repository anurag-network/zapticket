# ZapTicket

Open-source help desk and ticketing platform - a modern alternative to Zendesk and Zammad.

## Features

### Core Features
- **Multi-channel Support** - Email (IMAP/SMTP), Live Chat Widget, Web Forms, Slack, Discord
- **Knowledge Base** - Public FAQ portal with full-text search (Meilisearch)
- **Team Management** - Teams, roles (Owner, Admin, Agent, Member), RBAC
- **Ticket Management** - Status workflows, priorities, assignments, tags
- **Automation** - Workflow rules with triggers and actions
- **Integrations** - Webhooks, Slack, Discord, REST API

### Authentication
- Email/Password login
- OAuth2 (Google, GitHub)
- JWT with refresh tokens
- Password reset

### Dashboard & Reporting
- Real-time metrics
- Ticket statistics
- Agent performance
- SLA tracking

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | NestJS (Modular Monolith) |
| Database | PostgreSQL, Prisma ORM, Redis |
| Search | Meilisearch |
| Queue | BullMQ |
| Storage | MinIO (S3-compatible) |
| Real-time | Socket.io |
| Containers | Docker, Docker Compose |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- pnpm (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/anurag-network/zapticket.git
cd zapticket

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start infrastructure services
docker compose up -d postgres redis meilisearch minio

# Run database migrations
pnpm --filter @zapticket/database prisma migrate dev

# Start development servers
pnpm dev
```

### Access the Application

- **Web App**: http://localhost:3000
- **API**: http://localhost:3001/api/v1
- **API Docs**: http://localhost:3001/api/docs

## Project Structure

```
zapticket/
├── apps/
│   ├── web/          # Next.js frontend application
│   ├── api/          # NestJS backend API
│   └── widget/       # Embeddable chat widget
├── packages/
│   ├── shared/       # Shared types and utilities
│   ├── database/     # Prisma schema and migrations
│   └── ui/           # Shared UI components
└── docs/             # Documentation
```

## API Endpoints

### Auth
- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh tokens
- `GET /auth/google` - Google OAuth
- `GET /auth/github` - GitHub OAuth

### Tickets
- `GET /tickets` - List tickets
- `POST /tickets` - Create ticket
- `GET /tickets/:id` - Get ticket
- `PATCH /tickets/:id` - Update ticket
- `POST /tickets/:id/messages` - Add message

### Knowledge Base
- `GET /knowledge-base/articles` - List articles
- `GET /knowledge-base/search` - Search articles
- `GET /knowledge-base/categories` - List categories

### Integrations
- `GET/POST /integrations/webhooks` - Manage webhooks
- `GET/POST /integrations/api-keys` - Manage API keys

### Reporting
- `GET /reporting/metrics` - Dashboard metrics
- `GET /reporting/ticket-stats` - Ticket statistics
- `GET /reporting/agent-performance` - Agent metrics

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Contributing](./docs/CONTRIBUTING.md)

## Roadmap

| Phase | Status | Features |
|-------|--------|----------|
| 1 | ✅ Complete | Auth, Users, Teams, Tickets, RBAC |
| 2 | ✅ Complete | Email, Chat Widget, Web Forms |
| 3 | ✅ Complete | Knowledge Base, Search, Workflows |
| 4 | ✅ Complete | Webhooks, Slack, Discord, API Keys |
| 5 | ✅ Complete | Reporting, Scheduled Tasks, Metrics |

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

- **GitHub Issues**: https://github.com/anurag-network/zapticket/issues
- **Repository**: https://github.com/anurag-network/zapticket
