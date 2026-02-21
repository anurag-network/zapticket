# API Reference

Base URL: `http://localhost:3001/api/v1`

## Authentication

All authenticated endpoints require a Bearer token:

```
Authorization: Bearer <token>
```

## Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

---

## Authentication

### POST /auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "clx123abc",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /auth/login

Authenticate user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "clx123abc",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "MEMBER"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /auth/refresh

Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /auth/logout

Invalidate current session.

**Response:** `200 OK`

---

## Tickets

### GET /tickets

List tickets with filtering and pagination.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |
| status | string | Filter by status |
| priority | string | Filter by priority |
| assigneeId | string | Filter by assignee |
| search | string | Search in subject/description |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "clx123abc",
      "subject": "Cannot login to account",
      "status": "OPEN",
      "priority": "HIGH",
      "createdAt": "2024-01-15T10:30:00Z",
      "assignee": {
        "id": "clx456def",
        "name": "Jane Smith"
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### POST /tickets

Create a new ticket.

**Request Body:**
```json
{
  "subject": "Cannot login to account",
  "description": "I've been trying to login but keep getting an error",
  "priority": "HIGH",
  "tags": ["login", "authentication"]
}
```

**Response:** `201 Created`
```json
{
  "id": "clx123abc",
  "subject": "Cannot login to account",
  "description": "I've been trying to login but keep getting an error",
  "status": "OPEN",
  "priority": "HIGH",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### GET /tickets/:id

Get ticket details with messages.

**Response:** `200 OK`
```json
{
  "id": "clx123abc",
  "subject": "Cannot login to account",
  "description": "I've been trying to login but keep getting an error",
  "status": "OPEN",
  "priority": "HIGH",
  "createdAt": "2024-01-15T10:30:00Z",
  "assignee": {
    "id": "clx456def",
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "messages": [
    {
      "id": "msg123",
      "content": "Thank you for reporting. Can you share the error message?",
      "type": "REPLY",
      "author": {
        "id": "clx456def",
        "name": "Jane Smith"
      },
      "createdAt": "2024-01-15T10:35:00Z"
    }
  ],
  "tags": [
    { "id": "tag1", "name": "login" }
  ]
}
```

### PATCH /tickets/:id

Update ticket.

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "assigneeId": "clx456def",
  "priority": "URGENT"
}
```

**Response:** `200 OK`

### POST /tickets/:id/messages

Add a message to ticket.

**Request Body:**
```json
{
  "content": "Here is the error message screenshot",
  "type": "REPLY",
  "attachments": [
    {
      "filename": "error.png",
      "mimeType": "image/png",
      "size": 102400,
      "url": "https://storage.example.com/..."
    }
  ]
}
```

**Response:** `201 Created`

---

## Users

### GET /users

List organization users.

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "clx123abc",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "MEMBER",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /users/:id

Get user details.

**Response:** `200 OK`
```json
{
  "id": "clx123abc",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "MEMBER",
  "avatarUrl": "https://...",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### PATCH /users/:id

Update user profile.

**Request Body:**
```json
{
  "name": "John Smith",
  "avatarUrl": "https://..."
}
```

**Response:** `200 OK`

---

## Knowledge Base

### GET /knowledge-base/articles

List published articles.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| tag | string | Filter by tag |
| search | string | Search query |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "art123",
      "title": "How to reset your password",
      "excerpt": "Learn how to reset...",
      "category": {
        "id": "cat1",
        "name": "Account"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /knowledge-base/articles/:id

Get full article.

**Response:** `200 OK`
```json
{
  "id": "art123",
  "title": "How to reset your password",
  "content": "# Reset Password\n\nTo reset...",
  "category": {
    "id": "cat1",
    "name": "Account"
  },
  "tags": [
    { "id": "tag1", "name": "password" }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-10T00:00:00Z"
}
```

### GET /knowledge-base/search

Search articles.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (required) |
| limit | number | Max results (default: 10) |

**Response:** `200 OK`
```json
{
  "query": "password reset",
  "results": [
    {
      "id": "art123",
      "title": "How to reset your password",
      "excerpt": "...reset your <mark>password</mark>...",
      "score": 0.95
    }
  ]
}
```

---

## Webhooks

### GET /webhooks

List webhooks.

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "wh123",
      "url": "https://example.com/webhook",
      "events": ["ticket.created", "ticket.updated"],
      "active": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /webhooks

Create webhook.

**Request Body:**
```json
{
  "url": "https://example.com/webhook",
  "events": ["ticket.created", "ticket.updated", "message.created"],
  "secret": "optional-signing-secret"
}
```

**Response:** `201 Created`

### DELETE /webhooks/:id

Delete webhook.

**Response:** `204 No Content`

---

## Webhook Payloads

### ticket.created
```json
{
  "event": "ticket.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "clx123abc",
    "subject": "Cannot login",
    "status": "OPEN",
    "priority": "HIGH"
  }
}
```

### message.created
```json
{
  "event": "message.created",
  "timestamp": "2024-01-15T10:35:00Z",
  "data": {
    "id": "msg123",
    "ticketId": "clx123abc",
    "content": "Thank you for reporting...",
    "author": {
      "id": "clx456def",
      "name": "Jane Smith"
    }
  }
}
```
