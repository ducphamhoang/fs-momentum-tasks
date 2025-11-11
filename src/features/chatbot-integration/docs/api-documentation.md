# Chatbot Integration API Documentation

This document provides comprehensive information for external bot developers to integrate with our platform using our chatbot API.

## Base URL
All API endpoints are available at: `https://yourdomain.com/api/chatbot/`

## Authentication

The chatbot integration uses a two-step authentication process:

1. **Verification Code Generation**: User generates a code via the web interface
2. **Token Exchange**: The bot exchanges the verification code for a JWT token
3. **API Access**: The JWT token is used for all subsequent API requests

### Step 1: Generate Verification Code

To begin the authentication process, users must generate a verification code from the web interface:

1. User visits `/chatbot-login` page
2. User enters their User ID
3. System generates a 6-digit verification code
4. User receives the code via notification

### Step 2: Exchange Verification Code for JWT Token

Exchange the verification code for an authentication token:

```
POST /api/chatbot/auth/verify
Content-Type: application/json

{
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "user-12345"
}
```

### Step 3: Use JWT Token for API Requests

Include the JWT token in the Authorization header for all API requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Revocation

To revoke an active session:

```
POST /api/chatbot/auth/revoke
Content-Type: application/json
Authorization: Bearer <valid_token>

{
  "userId": "user-12345",
  "token": "optional_specific_token_to_revoke"
}
```

## Rate Limiting

All API endpoints are rate-limited to 100 requests per hour per user. Exceeding this limit will result in a `429 Too Many Requests` response.

## API Endpoints

### Tasks

#### Get All Tasks

Retrieve all tasks for the authenticated user.

```
GET /api/chatbot/tasks
Authorization: Bearer <valid_token>
```

**Response:**
```json
[
  {
    "id": "task-123",
    "title": "Sample Task",
    "description": "A sample task description",
    "status": "todo",
    "priority": "medium",
    "dueDate": "2023-12-31T23:59:59.000Z",
    "createdAt": "2023-11-01T10:00:00.000Z",
    "updatedAt": "2023-11-01T10:00:00.000Z",
    "userId": "user-12345"
  }
]
```

#### Create a New Task

Create a new task for the authenticated user.

```
POST /api/chatbot/tasks
Content-Type: application/json
Authorization: Bearer <valid_token>

{
  "title": "New Task",
  "description": "Task description (optional)",
  "status": "todo",
  "priority": "medium",
  "dueDate": "2023-12-31T23:59:59.000Z" (optional)
}
```

**Response:**
```json
{
  "id": "task-456",
  "title": "New Task",
  "description": "Task description (optional)",
  "status": "todo",
  "priority": "medium",
  "dueDate": "2023-12-31T23:59:59.000Z",
  "createdAt": "2023-11-01T11:00:00.000Z",
  "updatedAt": "2023-11-01T11:00:00.000Z",
  "userId": "user-12345"
}
```

#### Update a Task

Update an existing task for the authenticated user.

```
PATCH /api/chatbot/tasks/{taskId}
Content-Type: application/json
Authorization: Bearer <valid_token>

{
  "title": "Updated Task Title (optional)",
  "description": "Updated description (optional)",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2023-12-31T23:59:59.000Z" (optional)
}
```

**Response:**
```json
{
  "id": "task-123",
  "title": "Updated Task Title",
  "description": "Updated description",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2023-12-31T23:59:59.000Z",
  "createdAt": "2023-11-01T10:00:00.000Z",
  "updatedAt": "2023-11-01T12:00:00.000Z",
  "userId": "user-12345"
}
```

#### Delete a Task

Delete a task for the authenticated user.

```
DELETE /api/chatbot/tasks/{taskId}
Authorization: Bearer <valid_token>
```

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

## Data Models

### Task Object

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the task |
| title | string | Task title (required) |
| description | string | Task description (optional) |
| status | string | Task status: "todo", "in-progress", or "done" |
| priority | string | Task priority: "low", "medium", or "high" |
| dueDate | string | Due date in ISO 8601 format (optional) |
| createdAt | string | Creation timestamp in ISO 8601 format |
| updatedAt | string | Last update timestamp in ISO 8601 format |
| userId | string | ID of the user who owns the task |

### Verification Code Request

| Field | Type | Description |
|-------|------|-------------|
| code | string | 6-digit verification code |

### Create Task Request

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Task title (1-255 characters) |
| description | string | No | Task description (max 1000 characters) |
| status | string | No | Task status: "todo", "in-progress", "done" (default: "todo") |
| priority | string | No | Task priority: "low", "medium", "high" (default: "medium") |
| dueDate | string | No | Due date in ISO 8601 format |

### Update Task Request

All fields are optional in update requests.

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "details": { ... } // Optional details for validation errors
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Resource created
- `400`: Bad request (validation error)
- `401`: Unauthorized (invalid/expired token)
- `404`: Resource not found
- `429`: Rate limit exceeded
- `500`: Internal server error

## Security Considerations

- JWT tokens are valid for 24 hours from creation
- Verification codes are valid for 10 minutes and can only be used once
- All API endpoints require proper authentication
- Input is sanitized to prevent XSS attacks
- Rate limiting is enforced at 100 requests per hour per user