# Contributing to ZapTicket

Thank you for your interest in contributing to ZapTicket!

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- Git

### Getting Started

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/zapticket.git
cd zapticket

# Install dependencies
pnpm install

# Start infrastructure
docker compose up -d postgres redis meilisearch minio

# Copy environment
cp .env.example .env

# Run migrations
pnpm --filter @zapticket/database prisma migrate dev

# Start development
pnpm dev
```

## Project Structure

```
zapticket/
├── apps/
│   ├── web/           # Next.js frontend
│   ├── api/           # NestJS backend
│   └── widget/        # Chat widget
├── packages/
│   ├── shared/        # Shared utilities
│   ├── database/      # Prisma schema
│   └── ui/            # UI components
└── docs/              # Documentation
```

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow existing code patterns
- Use ESLint and Prettier configurations

```bash
# Check linting
pnpm lint

# Format code
pnpm format
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add ticket priority filter
fix: resolve email parsing issue
docs: update API documentation
chore: upgrade dependencies
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commits
3. Add/update tests
4. Update documentation if needed
5. Submit PR with description

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] New code has tests
- [ ] Documentation updated
- [ ] PR description is clear

## Testing

### Run Tests

```bash
# All tests
pnpm test

# Specific package
pnpm --filter @zapticket/api test

# With coverage
pnpm --filter @zapticket/api test:cov
```

### Writing Tests

- Unit tests for services and utilities
- Integration tests for API endpoints
- E2E tests for critical flows

## Database Changes

1. Modify `packages/database/prisma/schema.prisma`
2. Create migration: `pnpm --filter @zapticket/database prisma migrate dev --name description`
3. Update relevant code
4. Test migration up and down

## Adding New Features

### Backend (NestJS)

1. Create module: `nest g module feature`
2. Create service: `nest g service feature`
3. Create controller: `nest g controller feature`
4. Add DTOs with validation
5. Write tests

### Frontend (Next.js)

1. Create page/component in appropriate directory
2. Use shared UI components from `@zapticket/ui`
3. Connect to API using shared client
4. Add loading and error states

## Debugging

### Backend

```bash
# Enable debug logs
LOG_LEVEL=debug pnpm --filter @zapticket/api dev
```

### Database

```bash
# Open Prisma Studio
pnpm --filter @zapticket/database studio
```

### Docker

```bash
# View logs
docker compose logs -f api

# Execute in container
docker compose exec api sh
```

## Getting Help

- Open a GitHub Discussion for questions
- Join our Discord for real-time chat
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
