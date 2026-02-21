# ZapTicket

Open-source help desk and ticketing platform - a modern alternative to Zendesk and Zammad.

## Features

- **Omnichannel Support** - Email, Live Chat, Web Forms, Slack, Discord
- **Knowledge Base** - Public FAQ portal with full-text search
- **Multi-tenant** - Teams, roles, and permissions
- **Automation** - Workflows, triggers, and macros
- **Hybrid Deployment** - Self-hosted (Docker) or Cloud SaaS
- **Open Source** - MIT License

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
git clone https://github.com/yourorg/zapticket.git
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
- **API**: http://localhost:3001/api
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
├── docs/             # Documentation
└── docker/           # Docker configurations
```

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Contributing](./docs/CONTRIBUTING.md)

## Roadmap

| Phase | Timeline | Features |
|-------|----------|----------|
| 1 | Weeks 1-6 | Auth, Users, Teams, Basic Tickets |
| 2 | Weeks 7-12 | Email, Chat Widget, Web Forms |
| 3 | Weeks 13-18 | Knowledge Base, Search, Workflows |
| 4 | Weeks 19-22 | Slack, Discord, Webhooks, REST API |
| 5 | Weeks 23-26 | Reporting, Automation, Polish |

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

- **Documentation**: https://docs.zapticket.io
- **GitHub Issues**: https://github.com/yourorg/zapticket/issues
- **Discord**: https://discord.gg/zapticket
