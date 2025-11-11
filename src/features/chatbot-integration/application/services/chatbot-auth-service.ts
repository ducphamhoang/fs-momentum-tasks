import { VerificationCode } from '../../domain/entities/verification-code';
import { ChatbotSession } from '../../domain/entities/chatbot-session';
import { VerificationCodeRepository } from '../../domain/repositories/verification-code-repository';
import { ChatbotSessionRepository } from '../../domain/repositories/chatbot-session-repository';
import { JwtServicePort } from '../ports/jwt-service.port';
import { SessionToken } from '../../domain/value-objects/session-token';

/**
 * Dependencies interface for ChatbotAuthService.
 */
export interface ChatbotAuthServiceDeps {
  verificationCodeRepository: VerificationCodeRepository;
  chatbotSessionRepository: ChatbotSessionRepository;
  jwtService: JwtServicePort;
}

/**
 * Service responsible for handling chatbot authentication operations including:
 * - Generating and validating verification codes
 * - Creating and validating JWT tokens
 * - Managing chatbot sessions
 */
export class ChatbotAuthService {
  private readonly verificationCodeRepository: VerificationCodeRepository;
  private readonly chatbotSessionRepository: ChatbotSessionRepository;
  private readonly jwtService: JwtServicePort;

  constructor(deps: ChatbotAuthServiceDeps) {
    this.verificationCodeRepository = deps.verificationCodeRepository;
    this.chatbotSessionRepository = deps.chatbotSessionRepository;
    this.jwtService = deps.jwtService;
  }

  /**
   * Generates a new verification code for the specified user.
   * If an unused code already exists for the user, it will be deleted first.
   * @param userId The ID of the user requesting a verification code
   * @returns The generated VerificationCode entity
   */
  async generateVerificationCode(userId: string): Promise<VerificationCode> {
    // First, delete any existing unused codes for this user
    const existingCode = await this.verificationCodeRepository.findByUserId(userId);
    if (existingCode && !existingCode.isUsed) {
      await this.verificationCodeRepository.delete(existingCode.id);
    }

    // Generate a new verification code
    const verificationCode = VerificationCode.generate(userId);
    await this.verificationCodeRepository.create(verificationCode);
    
    return verificationCode;
  }

  /**
   * Validates a verification code and exchanges it for a JWT token.
   * If the code is valid, it will be marked as used and a new session will be created.
   * @param code The 9-character verification code
   * @param telegramUserId Optional Telegram user ID to associate with the session
   * @returns An object containing the user ID, JWT token, and expiration time
   * @throws Error if the verification code is invalid or expired
   */
  async validateVerificationCode(
    code: string,
    telegramUserId?: string
  ): Promise<{ userId: string; token: string; expiresAt: string }> {
    // Find the verification code
    const verificationCode = await this.verificationCodeRepository.findByCode(code);
    
    if (!verificationCode || !verificationCode.isValid()) {
      throw new Error('Invalid or expired verification code');
    }

    // Mark the code as used
    verificationCode.use();
    await this.verificationCodeRepository.update(verificationCode);

    // Generate a JWT token for the user
    const now = Date.now();
    const payload = {
      userId: verificationCode.userId,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'chatbot',
      platform: 'telegram',
      telegramUserId,
      iat: Math.floor(now / 1000),
      exp: Math.floor((now + 30 * 24 * 60 * 60 * 1000) / 1000), // 30 days
    };

    const token = await this.jwtService.sign(payload);

    // Create a chatbot session
    const sessionExpiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000); // 30 days
    const session = ChatbotSession.create(verificationCode.userId, token, sessionExpiresAt, telegramUserId);
    session.verificationCode = verificationCode;
    
    await this.chatbotSessionRepository.create(session);

    return {
      userId: verificationCode.userId,
      token,
      expiresAt: sessionExpiresAt.toISOString(),
    };
  }

  /**
   * Validates a session token against the database and JWT signature.
   * @param token The JWT token to validate
   * @returns An object containing the user ID and session ID if valid, null otherwise
   */
  async validateSessionToken(token: string): Promise<{ userId: string; sessionId: string } | null> {
    try {
      const payload = await this.jwtService.verify(token);
      
      // Check if the session exists in the database
      const session = await this.chatbotSessionRepository.findByToken(token);
      
      if (!session || !session.isValid()) {
        return null;
      }

      return {
        userId: payload.userId,
        sessionId: payload.sessionId,
      };
    } catch (error) {
      console.error('Error validating session token:', error);
      return null;
    }
  }

  /**
   * Revokes a session or all sessions for a user.
   * @param userId The user ID whose session(s) should be revoked
   * @param tokenId Optional specific token ID to revoke; if omitted, revokes all sessions for the user
   * @returns True if revocation was successful, false otherwise
   */
  async revokeSession(userId: string, tokenId?: string): Promise<boolean> {
    if (tokenId) {
      // Revoke specific session
      const session = await this.chatbotSessionRepository.findByToken(tokenId);
      if (session && session.userId === userId) {
        session.deactivate();
        await this.chatbotSessionRepository.update(session);
        return true;
      }
    } else {
      // Revoke all sessions for the user
      await this.chatbotSessionRepository.deleteByUserId(userId);
      return true;
    }
    
    return false;
  }
}