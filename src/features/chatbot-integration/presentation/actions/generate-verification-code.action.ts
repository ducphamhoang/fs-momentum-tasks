'use server';

import { diContainer } from '@/shared/infrastructure/di/container';

export interface GenerateVerificationCodeResult {
  success: boolean;
  code?: string;
  error?: string;
}

export async function generateVerificationCode(userId: string): Promise<GenerateVerificationCodeResult> {
  try {
    const authService = diContainer.chatbotAuthService;
    const verificationCode = await authService.generateVerificationCode(userId);

    return {
      success: true,
      code: verificationCode.code,
    };
  } catch (error) {
    console.error('Error generating verification code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}