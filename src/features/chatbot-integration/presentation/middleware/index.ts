export { withAuth, composeMiddleware } from './compose';
export type { AuthenticatedContext, Middleware, AuthenticatedHandler } from './compose';

// Re-export existing middleware
export { logApiRequest, logApiResponse } from './logging.middleware';
export { defaultRateLimit } from './rate-limit.middleware';
