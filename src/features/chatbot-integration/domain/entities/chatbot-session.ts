import { VerificationCode } from './verification-code';

export interface ChatbotSessionProps {
  id: string;
  userId: string;
  telegramUserId?: string;
  verificationCode?: VerificationCode;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export class ChatbotSession {
  public readonly id: string;
  public readonly userId: string;
  public readonly telegramUserId?: string;
  public verificationCode?: VerificationCode;
  public readonly token: string;
  public readonly createdAt: Date;
  public readonly expiresAt: Date;
  public isActive: boolean;

  constructor(props: ChatbotSessionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.telegramUserId = props.telegramUserId;
    this.verificationCode = props.verificationCode;
    this.token = props.token;
    this.createdAt = props.createdAt;
    this.expiresAt = props.expiresAt;
    this.isActive = props.isActive;
  }

  public static create(userId: string, token: string, expiresAt: Date, telegramUserId?: string): ChatbotSession {
    return new ChatbotSession({
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      telegramUserId,
      token,
      createdAt: new Date(),
      expiresAt,
      isActive: true,
    });
  }

  public deactivate(): void {
    this.isActive = false;
  }

  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  public isValid(): boolean {
    return this.isActive && !this.isExpired();
  }
}