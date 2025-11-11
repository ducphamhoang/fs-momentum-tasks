import { NextRequest, NextResponse } from 'next/server';
import { diContainer } from '@/shared/infrastructure/di/container';
import { logAuthAttempt, logAuthFailure } from '../../../presentation/utils/security-logging.util';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';

  try {
    const { userId, token } = await request.json();

    if (!userId) {
      logAuthFailure(userId, ip, 'User ID is required for session revocation');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Use DI container to get the auth service
    const authService = diContainer.chatbotAuthService;

    const success = await authService.revokeSession(userId, token);

    if (success) {
      logAuthAttempt(userId, ip, true, { action: 'session-revoke', tokenPresent: !!token });
      return NextResponse.json({
        success: true,
        message: 'Session revoked successfully',
      });
    } else {
      logAuthFailure(userId, ip, 'Failed to revoke session', { tokenPresent: !!token });
      return NextResponse.json(
        { error: 'Failed to revoke session' },
        { status: 400 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Revocation failed';
    logAuthFailure(undefined, ip, errorMessage, { action: 'session-revoke' });

    console.error('Revocation error:', error);
    return NextResponse.json(
      {
        error: errorMessage
      },
      { status: 500 }
    );
  }
}