# Middleware Composition Pattern - Critical Fix

## Problem Analysis

**Severity:** CRITICAL BUG
**Impact:** Authentication may not be working correctly
**Current State:** Middleware returns user data in response headers, but route handlers read from request headers (which are immutable)

## Current Implementation Issues

1. **Broken Data Flow:**
   - Middleware sets `x-user-id` on response headers
   - Route handler tries to read from request headers
   - Result: `userId` and `sessionId` are always `null`

2. **Code Duplication:**
   - 7 route handlers × 40 lines = ~280 lines of duplicated middleware calls
   - Every handler manually calls: logging → rate limit → JWT validation → user extraction

3. **Maintenance Burden:**
   - Adding new middleware requires updating 7+ files
   - Easy to forget middleware in new routes
   - Inconsistent error handling across routes

## Recommended Solution: Higher-Order Function Pattern

### Implementation

**File:** `src/features/chatbot-integration/presentation/middleware/compose.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

// Authenticated context passed to route handlers
export interface AuthenticatedContext {
  userId: string;
  sessionId: string;
  request: NextRequest;
}

// Middleware function type
export type Middleware = (
  request: NextRequest
) => Promise<NextResponse | null>;

// Authenticated route handler type
export type AuthenticatedHandler<T = any> = (
  context: AuthenticatedContext,
  ...args: T[]
) => Promise<NextResponse>;

/**
 * Composes multiple middlewares into a single authentication wrapper.
 *
 * Usage:
 *   export const GET = withAuth(async (context) => {
 *     const { userId } = context;
 *     // ... business logic
 *   });
 */
export function withAuth(
  handler: AuthenticatedHandler,
  middlewares: Middleware[] = []
): (request: NextRequest, ...args: any[]) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: any[]) => {
    // Run all middlewares in sequence
    for (const middleware of middlewares) {
      const result = await middleware(request);
      if (result) {
        // Middleware returned an error response
        return result;
      }
    }

    // Extract auth context directly from the auth service
    // (avoiding the broken header-passing pattern)
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or malformed' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    try {
      const { diContainer } = await import('@/shared/infrastructure/di/container');
      const authService = diContainer.chatbotAuthService;
      const validationResult = await authService.validateSessionToken(token);

      if (!validationResult) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      // Create authenticated context
      const context: AuthenticatedContext = {
        userId: validationResult.userId,
        sessionId: validationResult.sessionId,
        request,
      };

      // Call the actual route handler with context
      return await handler(context, ...args);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

/**
 * Chains multiple middleware functions together.
 */
export function composeMiddleware(...middlewares: Middleware[]): Middleware[] {
  return middlewares;
}
```

**File:** `src/features/chatbot-integration/presentation/middleware/index.ts`

```typescript
export { withAuth, composeMiddleware } from './compose';
export type { AuthenticatedContext, Middleware, AuthenticatedHandler } from './compose';

// Re-export middleware as standalone functions
export { logApiRequest, logApiResponse } from './logging.middleware';
export { defaultRateLimit } from './rate-limit.middleware';
export { applySecurityHeaders } from './security-headers.middleware';
```

### Usage Example

**Before (Broken & Duplicated):**

```typescript
// src/features/chatbot-integration/app/api/chatbot/tasks/route.ts

export async function GET(request: NextRequest) {
  // 🔴 40 lines of middleware boilerplate
  logApiRequest(request);

  const rateLimitResult = await defaultRateLimit(request);
  if (rateLimitResult) {
    logApiResponse(rateLimitResult.status, await rateLimitResult.json(), 'anonymous');
    return rateLimitResult;
  }

  const middlewareResult = await jwtValidationMiddleware(request);
  if (middlewareResult) {
    logApiResponse(middlewareResult.status, middlewareResult, 'anonymous');
    return middlewareResult;
  }

  try {
    const userId = request.headers.get('x-user-id');      // ❌ ALWAYS NULL
    const sessionId = request.headers.get('x-session-id'); // ❌ ALWAYS NULL

    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Finally, business logic...
    const taskRepository = new FirestoreTaskRepository();
    const taskService = new TaskApplicationServiceImpl(taskRepository);
    const tasks = await taskService.getTasks(userId);

    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
```

**After (Clean & Functional):**

```typescript
// src/features/chatbot-integration/app/api/chatbot/tasks/route.ts

import { withAuth, composeMiddleware } from '../../presentation/middleware';
import { logApiRequest } from '../../presentation/middleware/logging.middleware';
import { defaultRateLimit } from '../../presentation/middleware/rate-limit.middleware';

const middleware = composeMiddleware(
  logApiRequest,
  defaultRateLimit
);

export const GET = withAuth(
  async (context) => {
    const { userId, request } = context; // ✅ userId is ALWAYS available

    try {
      const taskRepository = new FirestoreTaskRepository();
      const taskService = new TaskApplicationServiceImpl(taskRepository);
      const tasks = await taskService.getTasks(userId);

      return NextResponse.json({ tasks, total: tasks.length });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }
  },
  middleware
);

export const POST = withAuth(
  async (context) => {
    const { userId, request } = context;

    try {
      const body = await request.json();
      // ... validation and business logic

      const taskRepository = new FirestoreTaskRepository();
      const taskService = new TaskApplicationServiceImpl(taskRepository);
      const task = await taskService.createTask(userId, body);

      return NextResponse.json({ task }, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
  },
  middleware
);
```

## Benefits

### 1. **Fixes the Critical Bug**
- User data is extracted directly from auth service
- No reliance on immutable request headers
- Context is type-safe and guaranteed to exist

### 2. **Eliminates Duplication**
- Reduces ~280 lines of duplicated code to ~40 lines total
- Single source of truth for middleware chain
- DRY principle applied

### 3. **Better Type Safety**
```typescript
// TypeScript knows userId ALWAYS exists in AuthenticatedContext
export const GET = withAuth(async (context) => {
  context.userId // ✅ string, not string | null
});
```

### 4. **Easier to Maintain**
```typescript
// Add new middleware globally in one place
const middleware = composeMiddleware(
  logApiRequest,
  defaultRateLimit,
  checkApiVersion,     // ✅ Add new middleware
  validateContentType  // ✅ Add another one
);
```

### 5. **Testability**
```typescript
// Easy to test handlers in isolation
const mockContext = {
  userId: 'test-user-123',
  sessionId: 'test-session',
  request: mockRequest,
};

await GET(mockContext);
```

## Migration Path

### Phase 1: Create compose.ts (30 min)
- Implement `withAuth` function
- Implement `composeMiddleware` helper

### Phase 2: Migrate Route Handlers (2 hours)
1. `GET /api/chatbot/tasks`
2. `POST /api/chatbot/tasks`
3. `PATCH /api/chatbot/tasks/:id`
4. `DELETE /api/chatbot/tasks/:id`
5. `POST /api/chatbot/auth/verify`
6. `DELETE /api/chatbot/auth/revoke`

### Phase 3: Update Tests (1 hour)
- Update test mocks to use AuthenticatedContext
- Remove header-passing test assertions

### Phase 4: Cleanup (30 min)
- Remove old `jwtValidationMiddleware.ts` (broken version)
- Update documentation

**Total Estimated Time:** 4 hours

## Priority Justification

**Should be CRITICAL, not LOW:**

1. **Current implementation is broken** - userId/sessionId are always null
2. **Security implications** - Authentication might not be working
3. **280 lines of duplicated code** - High maintenance burden
4. **Blocks future development** - Any new route requires 40 lines of boilerplate
5. **Simple to fix** - 4 hours total, high impact

## Risk Assessment

**Low Risk:**
- Changes are localized to route handlers
- No database schema changes
- No API contract changes
- Backward compatible (fixes a bug)

**High Impact:**
- Fixes critical authentication bug
- Improves code quality dramatically
- Makes future development faster
- Reduces test complexity

## Recommendation

**Change priority from LOW to CRITICAL** and implement immediately after Phase 1 fixes (verification code format, JWT expiration, etc.).

This should be **Phase 1.5** in the implementation plan, executed before response format changes.
