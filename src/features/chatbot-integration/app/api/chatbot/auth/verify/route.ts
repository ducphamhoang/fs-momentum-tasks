import { NextRequest, NextResponse } from 'next/server';
import { diContainer } from '@/shared/infrastructure/di/container';
import { logAuthAttempt, logAuthFailure } from '../../../presentation/utils/security-logging.util';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';

  try {
    const { code, telegramUserId } = await request.json();

    if (!code) {
      logAuthFailure(undefined, ip, 'Verification code missing');
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    // Use DI container to get the auth service
    const authService = diContainer.chatbotAuthService;

    const result = await authService.validateVerificationCode(code, telegramUserId);

    logAuthAttempt(result.userId, ip, true, { 
      action: 'chatbot-verification',
      telegramUserId
    });

    return NextResponse.json({
      sessionToken: result.token,
      expiresAt: result.expiresAt,
      userId: result.userId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Verification failed';
    logAuthFailure(undefined, ip, errorMessage, { action: 'chatbot-verification' });

    console.error('Verification error:', error);
    return NextResponse.json(
      {
        error: errorMessage
      },
      { status: 400 }
    );
  }
}