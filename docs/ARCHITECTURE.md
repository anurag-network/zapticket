# Architecture Overview

ZapTicket is built as a modular monolith using modern web technologies.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────┬─────────────┬─────────────┬─────────────────────────┤
│  Web App    │  Chat Widget │  Mobile    │  Third-party            │
│  (Next.js)  │  (React)     │  (future)  │  Integrations           │
└──────┬──────┴──────┬───────┴────────────┴───────────────┬─────────┘
       │             │                                     │
       │             │                                     │
       ▼             ▼                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│                    (NestJS + Socket.io)                          │
├─────────────────────────────────────────────────────────────────┤
│                       Application Layer                          │
├─────────┬─────────┬──────────┬──────────┬─────────┬────────────┤
│  Auth   │ Tickets │ Channels │ Knowledge│ Teams   │ Automation │
│ Module  │ Module  │ Module   │ Base     │ Module  │ Module     │
└────┬────┴────┬────┴────┬─────┴────┬─────┴────┬────┴─────┬──────┘
     │         │          │          │          │          │
     ▼         ▼          ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                 │
├─────────────┬──────────────┬──────────────┬────────────────────┤
│  PostgreSQL │    Redis     │ Meilisearch  │       MinIO        │
│  (Primary)  │   (Cache/    │  (Full-text  │    (File Storage)  │
│             │    Queue)    │    Search)   │                    │
└─────────────┴──────────────┴──────────────┴────────────────────┘
```

## Core Modules

### Auth Module
- JWT-based authentication
- OAuth2 providers (Google, GitHub)
- Role-based access control (RBAC)
- Session management

### Tickets Module
- Ticket CRUD operations
- Status workflow management
- Assignment and routing
- SLA tracking

### Channels Module
- Email (IMAP/SMTP)
- Live chat widget
- Web forms
- Slack integration
- Discord integration

### Knowledge Base Module
- Article management
- Categories and tags
- Full-text search
- Version history

### Teams Module
- Organization structure
- Team management
- Role assignments
- Permissions

### Automation Module
- Workflow triggers
- Actions and conditions
- Macros
- Scheduled tasks

## Data Model

### Core Entities

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  teams       Team[]
  members     User[]
  tickets     Ticket[]
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  passwordHash  String?
  avatarUrl     String?
  role          Role     @default(MEMBER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id])
  assignedTickets Ticket[] @relation("AssignedTickets")
  createdTickets  Ticket[] @relation("CreatedTickets")
}

model Ticket {
  id            String        @id @default(cuid())
  subject       String
  description   String        @db.Text
  status        TicketStatus  @default(OPEN)
  priority      Priority      @default(NORMAL)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  assigneeId    String?
  assignee      User?         @relation("AssignedTickets", fields: [assigneeId], references: [id])
  creatorId     String
  creator       User          @relation("CreatedTickets", fields: [creatorId], references: [id])
  
  messages      Message[]
  tags          TicketTag[]
}

model Message {
  id          String      @id @default(cuid())
  content     String      @db.Text
  type        MessageType @default(REPLY)
  createdAt   DateTime    @default(now())
  
  ticketId    String
  ticket      Ticket      @relation(fields: [ticketId], references: [id])
  
  authorId    String
  author      User        @relation(fields: [authorId], references: [id])
  
  attachments Attachment[]
}

model Attachment {
  id          String   @id @default(cuid())
  filename    String
  mimeType    String
  size        Int
  url         String
  
  messageId   String
  message     Message  @relation(fields: [messageId], references: [id])
}
```

## API Design

### REST Endpoints

```
/api/v1/
├── /auth
│   ├── POST /login
│   ├── POST /register
│   ├── POST /logout
│   ├── POST /refresh
│   └── /oauth
│       ├── GET /google
│       └── GET /github
├── /users
│   ├── GET /
│   ├── GET /:id
│   ├── PATCH /:id
│   └── DELETE /:id
├── /organizations
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   └── /teams
│       ├── GET /
│       ├── POST /
│       └── GET /:teamId
├── /tickets
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PATCH /:id
│   └── /:id/messages
│       ├── GET /
│       └── POST /
├── /knowledge-base
│   ├── GET /articles
│   ├── POST /articles
│   ├── GET /articles/:id
│   └── GET /search
└── /webhooks
    ├── GET /
    ├── POST /
    └── DELETE /:id
```

## Real-time Events

Socket.io events for live updates:

```typescript
// Client -> Server
'join:ticket'      // Subscribe to ticket updates
'leave:ticket'     // Unsubscribe from ticket
'typing:start'     // User started typing
'typing:stop'      // User stopped typing

// Server -> Client
'ticket:created'   // New ticket created
'ticket:updated'   // Ticket status changed
'message:created'  // New message received
'user:typing'      // User typing indicator
```

## Queue Jobs (BullMQ)

| Queue | Purpose |
|-------|---------|
| email-incoming | Process incoming emails |
| email-outgoing | Send outgoing emails |
| webhooks | Dispatch webhook events |
| automation | Execute automation rules |
| search-index | Update search index |

## Security

- All passwords hashed with bcrypt
- JWT tokens with short expiration
- Refresh token rotation
- CORS configuration
- Rate limiting on API endpoints
- Input validation with class-validator
- SQL injection protection via Prisma

## Caching Strategy

```
Redis Cache Keys:
- user:{id}              - User session data
- ticket:{id}            - Ticket cache (5 min TTL)
- kb:article:{id}        - Knowledge base articles (1 hour TTL)
- org:{id}:settings      - Organization settings (15 min TTL)
```

## File Upload Flow

```
Client → API Server → MinIO (S3-compatible)
                ↓
         Virus Scan (optional)
                ↓
         Metadata → PostgreSQL
```
