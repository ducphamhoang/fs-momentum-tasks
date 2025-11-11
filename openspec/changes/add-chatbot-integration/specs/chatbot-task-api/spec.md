# Chatbot Task API

## ADDED Requirements

### Requirement: List User Tasks

The system SHALL provide an API endpoint to retrieve all tasks for an authenticated user.

**Technical Specification:**
- Endpoint: `GET /api/chatbot/tasks`
- Authentication: Required (Bearer token in Authorization header)
- Response: JSON array of task objects with complete task data
- No pagination in MVP (returns all tasks)
- Reuses existing `getTasks` server action

#### Scenario: Authenticated user retrieves all tasks

- **GIVEN** an authenticated user with a valid session token
- **WHEN** the user requests `GET /api/chatbot/tasks`
- **THEN** the system validates the session token
- **AND** retrieves all tasks for the authenticated user
- **AND** returns 200 OK with JSON response containing tasks array
- **AND** each task includes: id, title, description, isCompleted, importance, dueDate, timeEstimate, source, createdAt, updatedAt

#### Scenario: User with no tasks receives empty array

- **GIVEN** an authenticated user with no tasks
- **WHEN** the user requests `GET /api/chatbot/tasks`
- **THEN** the system returns 200 OK
- **AND** returns `{"tasks": [], "total": 0}`

#### Scenario: Unauthorized request is rejected

- **GIVEN** a request without an Authorization header
- **WHEN** the user requests `GET /api/chatbot/tasks`
- **THEN** the system returns 401 Unauthorized
- **AND** returns error `{"error": {"code": "UNAUTHORIZED", "message": "Authorization header missing"}}`

#### Scenario: Response includes all task fields

- **GIVEN** a user has tasks with various properties
- **WHEN** the user requests `GET /api/chatbot/tasks`
- **THEN** each task in the response includes all fields from the domain model
- **AND** dates are formatted as ISO 8601 strings
- **AND** timeEstimate is in minutes as an integer

### Requirement: Create Task

The system SHALL provide an API endpoint to create a new task for an authenticated user.

**Technical Specification:**
- Endpoint: `POST /api/chatbot/tasks`
- Authentication: Required
- Request body: JSON with title (required), description, importance, dueDate, timeEstimate (all optional)
- Validation: Zod schema enforcing field constraints
- Source field auto-set to "chatbot" (read-only)
- Reuses existing `createTask` server action

#### Scenario: Create task with minimal fields

- **GIVEN** an authenticated user
- **WHEN** the user posts `{"title": "New Task"}` to `/api/chatbot/tasks`
- **THEN** the system creates a task with the title
- **AND** sets default values: isCompleted: false, importance: "medium", source: "chatbot"
- **AND** returns 201 Created
- **AND** returns the created task object with generated id and timestamps

#### Scenario: Create task with all fields

- **GIVEN** an authenticated user
- **WHEN** the user posts a complete task object:
  ```json
  {
    "title": "Complete Task",
    "description": "Task description",
    "importance": "high",
    "dueDate": "2025-11-20T00:00:00Z",
    "timeEstimate": 60
  }
  ```
- **THEN** the system creates the task with all provided fields
- **AND** auto-sets source: "chatbot"
- **AND** returns 201 Created with the complete task object

#### Scenario: Missing title returns validation error

- **GIVEN** an authenticated user
- **WHEN** the user posts `{"description": "No title"}` to `/api/chatbot/tasks`
- **THEN** the system returns 400 Bad Request
- **AND** returns error:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Title is required",
      "field": "title"
    }
  }
  ```

#### Scenario: Title exceeds maximum length

- **GIVEN** an authenticated user
- **WHEN** the user posts a task with title longer than 200 characters
- **THEN** the system returns 400 Bad Request
- **AND** returns error with code "VALIDATION_ERROR" and field "title"

#### Scenario: Invalid importance value

- **GIVEN** an authenticated user
- **WHEN** the user posts `{"title": "Task", "importance": "critical"}`
- **THEN** the system returns 400 Bad Request
- **AND** returns error indicating importance must be "high", "medium", or "low"

#### Scenario: Invalid due date format

- **GIVEN** an authenticated user
- **WHEN** the user posts `{"title": "Task", "dueDate": "invalid-date"}`
- **THEN** the system returns 400 Bad Request
- **AND** returns error indicating dueDate must be ISO 8601 format

#### Scenario: Time estimate out of range

- **GIVEN** an authenticated user
- **WHEN** the user posts `{"title": "Task", "timeEstimate": 500}`
- **THEN** the system returns 400 Bad Request
- **AND** returns error indicating timeEstimate must be between 1 and 480 minutes

### Requirement: Update Task

The system SHALL provide an API endpoint to update an existing task for an authenticated user.

**Technical Specification:**
- Endpoint: `PATCH /api/chatbot/tasks/:id`
- Authentication: Required
- Request body: JSON with any combination of updateable fields
- Partial updates: Only provided fields are updated
- Authorization: User can only update their own tasks
- Reuses existing `updateTask` server action

#### Scenario: Update task title

- **GIVEN** an authenticated user owns a task
- **WHEN** the user sends `PATCH /api/chatbot/tasks/{taskId}` with `{"title": "Updated Title"}`
- **THEN** the system updates only the title
- **AND** preserves all other fields
- **AND** updates the updatedAt timestamp
- **AND** returns 200 OK with the updated task object

#### Scenario: Mark task as completed

- **GIVEN** an authenticated user owns a task
- **WHEN** the user sends `PATCH /api/chatbot/tasks/{taskId}` with `{"isCompleted": true}`
- **THEN** the system marks the task as completed
- **AND** returns 200 OK with the updated task

#### Scenario: Update multiple fields

- **GIVEN** an authenticated user owns a task
- **WHEN** the user sends a PATCH with multiple fields:
  ```json
  {
    "title": "New Title",
    "importance": "high",
    "isCompleted": true
  }
  ```
- **THEN** the system updates all provided fields
- **AND** returns the task with all updated fields

#### Scenario: Update non-existent task

- **GIVEN** an authenticated user
- **WHEN** the user sends `PATCH /api/chatbot/tasks/non-existent-id`
- **THEN** the system returns 404 Not Found
- **AND** returns error "Task not found or you don't have permission to access it"

#### Scenario: Update another user's task

- **GIVEN** an authenticated user
- **WHEN** the user attempts to update a task owned by another user
- **THEN** the system returns 404 Not Found (not 403, to prevent information disclosure)
- **AND** returns error "Task not found or you don't have permission to access it"

#### Scenario: Invalid field in update

- **GIVEN** an authenticated user owns a task
- **WHEN** the user sends `PATCH /api/chatbot/tasks/{taskId}` with `{"title": ""}`
- **THEN** the system returns 400 Bad Request
- **AND** returns validation error for the title field

### Requirement: Delete Task

The system SHALL provide an API endpoint to delete a task for an authenticated user.

**Technical Specification:**
- Endpoint: `DELETE /api/chatbot/tasks/:id`
- Authentication: Required
- Authorization: User can only delete their own tasks
- Response: 204 No Content on success
- Reuses existing `deleteTask` server action

#### Scenario: Delete owned task

- **GIVEN** an authenticated user owns a task
- **WHEN** the user sends `DELETE /api/chatbot/tasks/{taskId}`
- **THEN** the system deletes the task
- **AND** returns 204 No Content
- **AND** the task no longer appears in subsequent GET requests

#### Scenario: Delete non-existent task

- **GIVEN** an authenticated user
- **WHEN** the user sends `DELETE /api/chatbot/tasks/non-existent-id`
- **THEN** the system returns 404 Not Found
- **AND** returns error "Task not found or you don't have permission to delete it"

#### Scenario: Delete another user's task

- **GIVEN** an authenticated user
- **WHEN** the user attempts to delete a task owned by another user
- **THEN** the system returns 404 Not Found
- **AND** returns error "Task not found or you don't have permission to delete it"

### Requirement: Authorization Verification

The system SHALL verify ownership for all task operations to prevent unauthorized access.

**Technical Specification:**
- Every task operation verifies: task.userId === authenticatedUserId
- Return 404 (not 403) for unauthorized access to prevent information disclosure
- Never expose other users' task data in responses or error messages

#### Scenario: All endpoints verify ownership

- **GIVEN** tasks exist for multiple users
- **WHEN** user A attempts to GET/PATCH/DELETE a task owned by user B
- **THEN** the system returns 404 Not Found for all operations
- **AND** never reveals that the task exists
- **AND** logs the authorization failure for security monitoring

#### Scenario: GET tasks only returns owned tasks

- **GIVEN** multiple users have tasks in the system
- **WHEN** user A requests `GET /api/chatbot/tasks`
- **THEN** the system returns only tasks where userId === user A's ID
- **AND** never includes tasks from other users

### Requirement: Rate Limiting

The system SHALL enforce rate limits on chatbot API endpoints to prevent abuse.

**Technical Specification:**
- Limit: 100 requests per hour per user
- Sliding window algorithm
- Response: 429 Too Many Requests with Retry-After header
- Separate limits for auth endpoints (10 req/hour)

#### Scenario: User within rate limit

- **GIVEN** a user has made 50 requests in the past hour
- **WHEN** the user makes another request
- **THEN** the request is processed normally
- **AND** no rate limit error is returned

#### Scenario: User exceeds rate limit

- **GIVEN** a user has made 100 requests in the past hour
- **WHEN** the user makes another request
- **THEN** the system returns 429 Too Many Requests
- **AND** includes Retry-After header with seconds until reset
- **AND** returns error:
  ```json
  {
    "error": {
      "code": "RATE_LIMIT_EXCEEDED",
      "message": "Too many requests. Please try again later.",
      "retryAfter": 3600
    }
  }
  ```

#### Scenario: Rate limit resets after time window

- **GIVEN** a user hit the rate limit 61 minutes ago
- **WHEN** the user makes a new request
- **THEN** the rate limit counter has reset
- **AND** the request is processed normally

#### Scenario: Read vs write operation limits

- **GIVEN** the system enforces different limits for read and write operations
- **WHEN** a user makes 100 GET requests in an hour
- **THEN** the system still allows the user (within 100 req/hour total)
- **WHEN** a user makes 50 POST/PATCH/DELETE requests in an hour
- **THEN** the system enforces the write operation limit (50 req/hour)

### Requirement: Input Validation

The system SHALL validate all input data for task operations using Zod schemas.

**Technical Specification:**
- Reject requests with unknown fields
- Enforce max length limits on all string fields
- Validate data types and enum values
- Sanitize strings to prevent XSS
- Return detailed validation errors with field names

#### Scenario: Unknown field is rejected

- **GIVEN** an authenticated user
- **WHEN** the user posts `{"title": "Task", "unknownField": "value"}`
- **THEN** the system returns 400 Bad Request
- **AND** returns error indicating unknown field is not allowed

#### Scenario: Multiple validation errors

- **GIVEN** an authenticated user
- **WHEN** the user posts invalid data with multiple errors
- **THEN** the system returns 400 Bad Request
- **AND** returns the first validation error encountered
- **AND** includes the field name in the error response

### Requirement: API Response Logging

The system SHALL log all API requests for monitoring and debugging while respecting user privacy.

**Technical Specification:**
- Log: userId, endpoint, HTTP method, status code, latency, error codes
- Do NOT log: task titles, descriptions, or any user content
- Log errors with stack traces (in secure logs, not in responses)
- Log rate limit violations

#### Scenario: Successful request is logged

- **GIVEN** a user makes a successful API request
- **WHEN** the request completes
- **THEN** the system logs userId, endpoint, status 200, and latency
- **AND** does not log task content

#### Scenario: Failed request is logged with error

- **GIVEN** a user makes a request that fails validation
- **WHEN** the request returns 400 Bad Request
- **THEN** the system logs userId, endpoint, status 400, error code
- **AND** logs the validation error type (not the user's invalid data)

#### Scenario: Rate limit violation is logged

- **GIVEN** a user exceeds the rate limit
- **WHEN** the system returns 429
- **THEN** the system logs the violation with userId and timestamp
- **AND** increments a rate limit violation counter for monitoring
