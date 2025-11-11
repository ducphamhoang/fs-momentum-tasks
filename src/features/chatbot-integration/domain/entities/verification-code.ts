export interface VerificationCodeProps {
  id: string;
  code: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  isUsed: boolean;
}

export class VerificationCode {
  public readonly id: string;
  public readonly code: string;
  public readonly userId: string;
  public readonly createdAt: Date;
  public readonly expiresAt: Date;
  public usedAt?: Date;
  public isUsed: boolean;

  constructor(props: VerificationCodeProps) {
    this.id = props.id;
    this.code = props.code;
    this.userId = props.userId;
    this.createdAt = props.createdAt;
    this.expiresAt = props.expiresAt;
    this.usedAt = props.usedAt;
    this.isUsed = props.isUsed;
  }

  public static generate(userId: string, expiresInMinutes: number = 5): VerificationCode {
    // Generate a 9-character alphanumeric code (excluding confusing characters)
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes 0, O, 1, I, L
    let code = '';
    const crypto = require('crypto');
    for (let i = 0; i < 9; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      code += charset[randomIndex];
    }
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);

    return new VerificationCode({
      id: `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code,
      userId,
      createdAt: now,
      expiresAt,
      isUsed: false,
    });
  }

  public use(): void {
    if (this.isUsed) {
      throw new Error('Verification code already used');
    }
    
    if (this.isExpired()) {
      throw new Error('Verification code has expired');
    }

    this.isUsed = true;
    this.usedAt = new Date();
  }

  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  public isValid(): boolean {
    return !this.isUsed && !this.isExpired();
  }
}