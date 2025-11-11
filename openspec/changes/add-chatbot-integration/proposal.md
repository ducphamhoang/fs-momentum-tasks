# Change: Add Chatbot Integration API

## Why

Users need a way to manage their tasks from Telegram without switching to the web application. Mobile-first users prefer conversational interfaces for quick task management on-the-go. This integration enables users to authenticate securely and perform full CRUD operations on tasks via Telegram bot, increasing accessibility and user engagement.

## What Changes

- Add secure authentication flow for Telegram bot integration
  - Web-based login page that generates verification codes
  - Verification code validation endpoint
  - 30-day session token (JWT) generation and management
  - Token revocation capability
- Add REST API endpoints for task management via chatbot
  - GET /api/chatbot/tasks - List all tasks
  - POST /api/chatbot/tasks - Create new task
  - PATCH /api/chatbot/tasks/:id - Update task
  - DELETE /api/chatbot/tasks/:id - Delete task
- Implement security measures
  - Rate limiting (100 req/hour per user)
  - Input validation with Zod
  - Authorization checks (ownership verification)
  - Security logging and monitoring
- Create new feature: `chatbot-integration` following clean architecture
  - Domain layer: Session and verification code entities
  - Application layer: Auth service, task service (wraps existing)
  - Infrastructure layer: JWT service, Firestore repositories
  - Presentation layer: API routes and login page
- **BREAKING**: Introduces API routes pattern (previously only used server actions)

## Impact

**Affected Specs:**
- New: `chatbot-auth` (authentication and session management)
- New: `chatbot-task-api` (task CRUD operations via API)

**Affected Code:**
- `src/app/api/chatbot/` - New API route handlers
- `src/app/chatbot-login/` - New login page
- `src/features/chatbot-integration/` - New feature directory
- `src/features/tasks/application/actions.ts` - Reused by API adapters
- `openspec/project.md` - Update architecture patterns to include API routes
- `package.json` - Add jsonwebtoken dependency

**Database Changes:**
- New Firestore collections:
  - `users/{userId}/chatbotVerificationCodes/{codeId}` - Temporary verification codes
  - `users/{userId}/chatbotSessions/{sessionId}` - Active chatbot sessions

**Environment Variables:**
- New: `JWT_SECRET` - Secret key for JWT signing
- New: `CHATBOT_LOGIN_URL` - URL for chatbot login page

**Dependencies:**
- Existing users: No breaking changes to web app functionality
- New capability: Chatbot integration is opt-in
- Security: All endpoints are authenticated and rate-limited
