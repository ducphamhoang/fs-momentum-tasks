import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedContext {
  userId: string;
  sessionId: string;
  request: NextRequest;
}

export type Middleware = (request: NextRequest) => Promise<NextResponse | null>;

export type AuthenticatedHandler<T = any> = (
  context: AuthenticatedContext,
  ...args: T[]
) => Promise<NextResponse>;

/**
 * Wraps a route handler with authentication and middleware.
 * Extracts userId and sessionId directly from auth service.
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
        // Middleware returned error response
        return result;
      }
    }

    // Extract auth context directly from auth service
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

      // Create authenticated context with guaranteed userId
      const context: AuthenticatedContext = {
        userId: validationResult.userId,
        sessionId: validationResult.sessionId,
        request,
      };

      // Call handler with context
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

export function composeMiddleware(...middlewares: Middleware[]): Middleware[] {
  return middlewares;
}
