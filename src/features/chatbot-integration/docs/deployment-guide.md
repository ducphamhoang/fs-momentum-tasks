# Deployment Guide for Chatbot Integration

This document outlines the deployment process for the chatbot integration feature.

## Environment Variables

Before deploying, ensure the following environment variables are set in your production environment:

```env
JWT_SECRET=your-production-jwt-secret-here-make-it-long-and-random
CHATBOT_LOGIN_URL=https://yourdomain.com/chatbot-login
```

## Production Deployment Steps

### 1. Environment Configuration
- Set `NODE_ENV` to `production`
- Configure the JWT_SECRET with a strong, randomly generated key
- Set CHATBOT_LOGIN_URL to your production domain

### 2. Firebase Configuration
The chatbot integration relies on Firebase for:
- Authentication
- Firestore for storing verification codes and sessions
- Make sure your Firebase project is properly configured in production

### 3. API Rate Limiting
The system implements rate limiting at 100 requests per hour per user. In production:
- Monitor rate limit metrics
- Consider adjusting limits based on usage patterns
- Set up alerts for when users consistently hit rate limits

### 4. Security Considerations
- JWT tokens expire after 24 hours
- Verification codes expire after 10 minutes
- Implement server-side monitoring for:
  - Authentication attempts
  - Rate limit violations
  - Security incidents

### 5. Performance Monitoring
For production deployment, monitor:
- API response times (should stay under 500ms for 95th percentile)
- Error rates
- Authentication success/failure rates
- Task API usage patterns

### 6. Deployment Process
1. Deploy to staging environment first
2. Perform security audit and penetration testing
3. Run performance tests to verify p95 latency < 500ms
4. Deploy to production
5. Monitor error rates and latency for the first 24 hours

## Staging vs Production Differences

| Environment | Rate Limit | Token Expiry | Verification Code Expiry |
|-------------|------------|--------------|--------------------------|
| Staging     | 100 req/hour/user | 24 hours | 10 minutes |
| Production  | 100 req/hour/user | 24 hours | 10 minutes |

## Monitoring and Observability

The deployed system includes:

1. **Request Logging** - All API requests are logged with timestamp, user ID, IP, and response size
2. **Security Logging** - Authentication attempts, rate limit violations, and security incidents
3. **Error Tracking** - All API errors with stack traces in development

## Rollback Plan

If issues arise after deployment:
1. Monitor error rates and user impact
2. Have a rollback plan ready if critical issues are detected
3. Gradually roll out to larger user segments after initial validation

## Post-Deployment Verification

After deployment, verify:

1. ✅ Users can generate verification codes on `/chatbot-login`
2. ✅ Verification codes can be exchanged for JWT tokens
3. ✅ JWT tokens work for task API endpoints
4. ✅ Rate limiting functions correctly
5. ✅ Security headers are properly set
6. ✅ Error responses are formatted correctly
7. ✅ Logging is working as expected