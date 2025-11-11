# Design: Chatbot Integration API

## Context

The application currently uses server actions exclusively for data operations. We need to add API endpoints to enable external chatbot (Telegram) integration while maintaining clean architecture principles and reusing existing domain logic.

**Constraints:**
- Must not duplicate existing task management logic
- Must maintain security equivalent to web app
- Must follow existing feature-first clean architecture
- Must be stateless and scalable
- Target: <500ms p95 latency, <1% error rate

**Stakeholders:**
- End users (Telegram bot users)
- Bot developers (need stable API contract)
- Security team (authentication and authorization requirements)

## Goals / Non-Goals

### Goals
- Enable secure authentication from Telegram bot
- Provide full task CRUD operations via REST API
- Reuse existing domain logic and repositories
- Maintain clean architecture boundaries
- Implement security best practices (rate limiting, input validation, authorization)

### Non-Goals
- Real-time WebSocket/SSE connections (use polling)
- AI prioritization features (basic CRUD only for MVP)
- Multi-platform support beyond Telegram (can add later)
- Task search, filtering, or pagination (return all tasks)
- File uploads or task attachments

## Decisions

### Decision 1: API Routes vs Server Actions Extension

**Options Considered:**

**A) Expose Server Actions Directly**
- Pros: No new code, consistent with existing pattern
- Cons: Server actions are tied to Next.js conventions, hard to version, not REST-ful

**B) Create Traditional REST API Routes**
- Pros: Standard API contract, easy to version, familiar to external developers
- Cons: Introduces new architectural pattern, potential code duplication

**C) Thin API Adapter Layer**
- Pros: Best of both worlds - REST API with server action reuse
- Cons: Small indirection layer, but minimal complexity

**Decision: C - Thin API Adapter Layer**

**Rationale:**
- Adapters are ~20 lines per endpoint: validate JWT, extract userId, call server action, format response
- Maintains single source of truth for business logic
- Provides standard REST API contract for bot developers
- Follows Adapter pattern from clean architecture

**Implementation:**
```typescript
// Example adapter
export async function GET(request: Request) {
  const userId = await validateJWT(request); // Adapter responsibility
  const tasks = await getTasks(userId);      // Existing server action
  return Response.json({ tasks });           // Adapter responsibility
}
```

### Decision 2: Authentication Flow - Verification Code + Session Token

**Options Considered:**

**A) Direct Firebase Token Exchange**
- Pros: Leverages existing Firebase Auth
- Cons: Exposes Firebase tokens to bot backend, complex token lifecycle

**B) OAuth 2.0 Device Flow**
- Pros: Standard protocol, good UX for device-based auth
- Cons: Overkill for single bot integration, complex implementation

**C) Custom Verification Code + JWT Session Token**
- Pros: Simple UX, controlled token lifecycle, familiar to developers
- Cons: Custom implementation, need to maintain token secret

**Decision: C - Custom Verification Code + JWT**

**Rationale:**
- User flow is simple: click link → login → copy code → paste in bot
- 5-minute verification code limits attack window
- 30-day session token balances security and UX
- JWT validation is fast (no database lookup on every request if we include session validation)
- Can revoke sessions by deleting Firestore document

**Flow Diagram:**
```
Web App                  Firestore                   Telegram Bot
   |                        |                             |
   |--generate code-------->|                             |
   |<--return code----------|                             |
   |                        |<--verify code---------------|
   |                        |--validate & create session->|
   |                        |<--return JWT----------------|
   |                        |                             |
   |                        |<--validate JWT on requests--|
   |                        |--update lastUsedAt--------->|
```

### Decision 3: JWT Validation Strategy

**Options Considered:**

**A) Stateless JWT Only**
- Pros: No database lookup on every request, fast
- Cons: Cannot revoke tokens before expiration

**B) Database Lookup on Every Request**
- Pros: Instant revocation, track usage
- Cons: Firestore read on every request, slower, more expensive

**C) JWT with Session Validation**
- Pros: Fast validation (verify signature), revocation support (check session exists)
- Cons: One Firestore read per request

**Decision: C - JWT with Session Validation**

**Rationale:**
- Validate JWT signature first (fast, no I/O)
- If valid, check session exists in Firestore with `isActive: true`
- Cache session validation for 5 minutes to reduce reads
- Enables revocation while maintaining performance
- Track `lastUsedAt` for security audits

**Implementation:**
```typescript
async function validateSessionToken(token: string): Promise<string> {
  // 1. Verify JWT signature and expiration (fast)
  const payload = jwt.verify(token, JWT_SECRET);

  // 2. Check session exists and is active (one Firestore read, cached)
  const session = await sessionRepo.findById(payload.sessionId);
  if (!session || !session.isActive) {
    throw new Error('Invalid session');
  }

  // 3. Update lastUsedAt (async, don't await)
  sessionRepo.updateLastUsedAt(payload.sessionId).catch(console.error);

  return payload.userId;
}
```

### Decision 4: Rate Limiting Implementation

**Options Considered:**

**A) In-Memory Counter**
- Pros: Fast, simple
- Cons: Doesn't work across multiple servers, lost on restart

**B) Redis Counter**
- Pros: Fast, distributed, persistent
- Cons: New infrastructure dependency

**C) Firestore Counter with Sliding Window**
- Pros: No new infrastructure, persistent, distributed
- Cons: Slower than Redis (but acceptable for 100 req/hour limit)

**Decision: C - Firestore Counter (for MVP)**

**Rationale:**
- MVP targets 10+ users, not high scale yet
- Firestore can handle the load (<1 QPS per user for rate limit checks)
- Sliding window algorithm provides fair limiting
- Can migrate to Redis later if needed
- Firestore counter can be cached locally for 1 minute

**Future Migration Path:**
- If API scales to >100 active users, migrate to Redis
- Code will be abstracted behind `RateLimiter` interface, easy to swap

### Decision 5: Error Handling and Response Format

**Decision: Standard JSON Error Structure**

**Rationale:**
- Consistent error format makes bot development easier
- Include error code for programmatic handling
- Include human-readable message for debugging
- Optional field name for validation errors

**Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must be between 1 and 200 characters",
    "field": "title"
  }
}
```

**HTTP Status Codes:**
- 200 OK - Success (GET, PATCH)
- 201 Created - Success (POST)
- 204 No Content - Success (DELETE)
- 400 Bad Request - Validation error
- 401 Unauthorized - Invalid/expired token
- 404 Not Found - Resource not found or unauthorized access
- 429 Too Many Requests - Rate limit exceeded
- 500 Internal Server Error - Unexpected error

## Risks / Trade-offs

### Risk 1: JWT Secret Compromise
**Impact:** Attacker can forge tokens and access any user's tasks

**Mitigation:**
- Store JWT_SECRET in secure environment variables (not in code)
- Use 256-bit cryptographically random secret
- Rotate secret periodically (quarterly)
- Monitor for unusual token usage patterns
- Session validation provides second layer (delete sessions to revoke)

### Risk 2: Rate Limit Bypass
**Impact:** Attacker overwhelms API with requests

**Mitigation:**
- Implement rate limiting at multiple levels:
  - Per user (100 req/hour)
  - Per endpoint (auth endpoints: 10 req/hour)
  - Global limit (can add later if needed)
- Use Firestore transaction to ensure atomic counter updates
- Add monitoring alerts for rate limit violations

### Risk 3: Performance Degradation
**Impact:** API endpoints slow down web application

**Mitigation:**
- API routes run in separate Next.js API runtime
- API adapters reuse existing optimized server actions
- Firestore queries use same indexes as web app
- Monitor p95 latency separately for API vs web
- Set timeout on API routes (10 seconds max)

### Trade-off 1: Firestore Reads for Session Validation
**Cost:** 1 Firestore read per API request

**Benefit:** Instant token revocation

**Analysis:**
- 10 users × 100 requests/hour × 24 hours = 24,000 reads/day
- Firestore free tier: 50,000 reads/day
- Cost at scale: $0.06 per 100,000 reads = negligible
- Can optimize with 5-minute cache (reduces reads by 99%)

**Verdict:** Acceptable trade-off for security benefit

### Trade-off 2: No Pagination in MVP
**Cost:** Returning 100+ tasks may be slow

**Benefit:** Simpler implementation, faster MVP delivery

**Analysis:**
- Average user has ~20 tasks
- Most users won't hit 100+ tasks in MVP period
- Can add pagination in v2 without breaking changes (add `?page=1&limit=20`)
- Monitor task count distribution to prioritize pagination

**Verdict:** Acceptable for MVP, add pagination if >10% users have >50 tasks

## Migration Plan

### Phase 1: Authentication Infrastructure
1. Add JWT secret to environment variables
2. Implement JWT service with tests
3. Implement verification code service with tests
4. Create Firestore repositories for sessions and codes
5. Build chatbot-login page
6. Deploy auth endpoints to staging

**Rollback:** Remove new environment variables, delete new code

### Phase 2: Task API Endpoints
1. Implement API adapters for task operations
2. Add input validation with Zod
3. Implement rate limiting middleware
4. Deploy to staging
5. Test with mock Telegram bot

**Rollback:** Remove API routes, keep auth infrastructure for reuse

### Phase 3: Security Hardening
1. Add security headers (HSTS)
2. Implement comprehensive logging
3. Add monitoring dashboards
4. Perform security audit
5. Deploy to production with feature flag

**Rollback:** Disable feature flag, all endpoints return 503

### Phase 4: Telegram Bot Integration
1. Develop Telegram bot (separate repository)
2. Test end-to-end with staging API
3. Beta test with 5 internal users
4. Production launch with monitoring

**Rollback:** Shut down Telegram bot, API remains available for future use

### Backwards Compatibility
- Web application: No breaking changes
- Existing APIs: None exist, no compatibility concerns
- Database schema: New collections only, no changes to existing `tasks` collection

## Open Questions

### Q1: Should we support multiple concurrent chatbot sessions per user?
**Status:** To be decided

**Options:**
- A) Single session: New login invalidates previous session
- B) Multiple sessions: User can be logged in on multiple bots/devices

**Recommendation:** Support multiple sessions (Option B)
- Better UX if user uses multiple Telegram accounts
- Firestore collection structure already supports this (`chatbotSessions/{sessionId}`)
- Add `DELETE /api/chatbot/auth/sessions` to revoke all sessions

### Q2: Should verification codes be tied to a specific Telegram user ID?
**Status:** To be decided

**Options:**
- A) Code is generic: Anyone with code can authenticate
- B) Code is bound to Telegram user ID from `/login` command

**Recommendation:** Generic code (Option A) for MVP
- Simpler implementation
- User must be logged into web app to generate code (already secure)
- Can add user ID binding in v2 if needed

### Q3: What happens when JWT_SECRET is rotated?
**Status:** To be decided

**Options:**
- A) All sessions invalidated immediately
- B) Support old and new secret for grace period (dual signing)

**Recommendation:** Immediate invalidation (Option A) for MVP
- Simpler implementation
- Communicate rotation schedule to users (e.g., monthly on 1st)
- Users just re-authenticate (30-day tokens, so max once per month)

### Q4: Should we log task data in API requests?
**Status:** To be decided

**Privacy Concern:** Task titles/descriptions may contain sensitive info

**Recommendation:** Log metadata only
- Log: userId, endpoint, status code, latency, error codes
- Do not log: task titles, descriptions, or any user content
- Add flag to enable full logging for debugging (disabled by default)
