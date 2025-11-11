import { NextRequest } from 'next/server';

export interface SecurityLogData {
  timestamp: string;
  eventType: 'auth-attempt' | 'rate-limit' | 'auth-failure' | 'security-violation' | 'data-access';
  userId?: string;
  ip: string;
  userAgent?: string;
  details?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function logSecurityEvent(logData: SecurityLogData) {
  // In production, you'd send this to a security monitoring system
  console.log('[SECURITY-LOG]', JSON.stringify(logData));
}

export function logAuthAttempt(userId: string, ip: string, success: boolean, details?: any) {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    eventType: 'auth-attempt',
    userId,
    ip,
    details: {
      success,
      ...details
    },
    severity: success ? 'low' : 'medium'
  });
}

export function logRateLimit(ip: string, endpoint: string, details?: any) {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    eventType: 'rate-limit',
    ip,
    details: {
      endpoint,
      ...details
    },
    severity: 'low'
  });
}

export function logAuthFailure(userId: string | undefined, ip: string, reason: string, details?: any) {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    eventType: 'auth-failure',
    userId,
    ip,
    details: {
      reason,
      ...details
    },
    severity: 'high'
  });
}

export function logSecurityViolation(userId: string | undefined, ip: string, violation: string, details?: any) {
  logSecurityEvent({
    timestamp: new Date().toISOString(),
    eventType: 'security-violation',
    userId,
    ip,
    details: {
      violation,
      ...details
    },
    severity: 'critical'
  });
}