# Implementation Tasks

## 1. Setup & Dependencies
- [x] 1.1 Install `jsonwebtoken` and `@types/jsonwebtoken` packages
- [x] 1.2 Add `JWT_SECRET` and `CHATBOT_LOGIN_URL` to environment variables
- [x] 1.3 Create feature directory structure: `src/features/chatbot-integration/`

## 2. Domain Layer
- [x] 2.1 Create `domain/entities/chatbot-session.ts` entity
- [x] 2.2 Create `domain/entities/verification-code.ts` entity
- [x] 2.3 Create `domain/repositories/chatbot-session-repository.ts` interface
- [x] 2.4 Create `domain/repositories/verification-code-repository.ts` interface
- [x] 2.5 Create `domain/value-objects/session-token.ts` value object

## 3. Application Layer
- [x] 3.1 Create `application/ports/jwt-service.port.ts` interface
- [x] 3.2 Create `application/services/chatbot-auth-service.ts`
- [x] 3.3 Implement verification code generation in auth service
- [x] 3.4 Implement session token generation in auth service
- [x] 3.5 Implement session token validation in auth service
- [x] 3.6 Create `application/dtos/create-task-request.dto.ts`
- [x] 3.7 Create `application/dtos/update-task-request.dto.ts`
- [x] 3.8 Create `application/dtos/task-response.dto.ts`
- [x] 3.9 Create Zod validation schemas for all DTOs

## 4. Infrastructure Layer
- [x] 4.1 Implement `infrastructure/jwt/jsonwebtoken-service.ts`
- [x] 4.2 Implement `infrastructure/persistence/firestore-verification-code-repository.ts`
- [x] 4.3 Implement `infrastructure/persistence/firestore-chatbot-session-repository.ts`
- [x] 4.4 Add repositories to DI container

## 5. Presentation Layer - Authentication
- [x] 5.1 Create `presentation/pages/chatbot-login-page.tsx` UI component
- [x] 5.2 Create server action for verification code generation
- [x] 5.3 Create `app/chatbot-login/page.tsx` route
- [x] 5.4 Create `app/api/chatbot/auth/verify/route.ts` endpoint
- [x] 5.5 Create `app/api/chatbot/auth/revoke/route.ts` endpoint
- [x] 5.6 Implement JWT validation middleware

## 6. Presentation Layer - Task API
- [x] 6.1 Create `app/api/chatbot/tasks/route.ts` for GET and POST
- [x] 6.2 Create `app/api/chatbot/tasks/[id]/route.ts` for PATCH and DELETE
- [x] 6.3 Implement API adapter for `getTasks` server action
- [x] 6.4 Implement API adapter for `createTask` server action
- [x] 6.5 Implement API adapter for `updateTask` server action
- [x] 6.6 Implement API adapter for `deleteTask` server action
- [x] 6.7 Implement error response formatting utility
- [x] 6.8 Add request/response logging

## 7. Security
- [x] 7.1 Implement rate limiting middleware (100 req/hour per user)
- [x] 7.2 Add HSTS security headers
- [x] 7.3 Implement ownership verification in all task endpoints
- [x] 7.4 Add input sanitization in all endpoints
- [x] 7.5 Implement security logging (auth attempts, rate limits, failures)

## 8. Testing
- [x] 8.1 Write unit tests for verification code generation
- [x] 8.2 Write unit tests for JWT service
- [x] 8.3 Write unit tests for session repository
- [x] 8.4 Write unit tests for DTO validation schemas
- [x] 8.5 Write integration tests for auth flow (code → token)
- [x] 8.6 Write integration tests for GET /api/chatbot/tasks
- [x] 8.7 Write integration tests for POST /api/chatbot/tasks
- [x] 8.8 Write integration tests for PATCH /api/chatbot/tasks/:id
- [x] 8.9 Write integration tests for DELETE /api/chatbot/tasks/:id
- [x] 8.10 Write integration tests for rate limiting
- [x] 8.11 Write integration tests for authorization checks
- [x] 8.12 Write security tests (JWT tampering, expired tokens, etc.)

## 9. Documentation
- [x] 9.1 Update `openspec/project.md` with API routes architecture pattern
- [x] 9.2 Create API documentation for external bot developers
- [x] 9.3 Add inline code documentation for public interfaces
- [x] 9.4 Update README with chatbot integration setup instructions

## 10. Deployment
- [x] 10.1 Set environment variables in production
- [x] 10.2 Deploy to staging environment
- [x] 10.3 Perform security audit and penetration testing
- [x] 10.4 Run performance tests (verify p95 latency < 500ms)
- [x] 10.5 Deploy to production
- [x] 10.6 Monitor error rates and latency for first 24 hours