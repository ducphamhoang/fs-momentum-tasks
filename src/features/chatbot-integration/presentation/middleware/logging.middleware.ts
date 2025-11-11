import { NextRequest } from 'next/server';

export function logApiRequest(request: NextRequest, userId?: string) {
  const logData = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    userId: userId || 'anonymous',
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
  };
  
  console.log('[API-REQUEST]', JSON.stringify(logData));
}

export function logApiResponse(status: number, response: any, userId?: string) {
  const logData = {
    timestamp: new Date().toISOString(),
    status,
    userId: userId || 'anonymous',
    responseSize: JSON.stringify(response).length,
  };
  
  console.log('[API-RESPONSE]', JSON.stringify(logData));
}