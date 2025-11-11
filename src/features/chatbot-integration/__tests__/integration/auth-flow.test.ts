import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatbotAuthService } from '../../application/services/chatbot-auth-service';
import { VerificationCode } from '../../domain/entities/verification-code';
import { ChatbotSession } from '../../domain/entities/chatbot-session';
import { JsonwebtokenService } from '../../infrastructure/jwt/jsonwebtoken-service';

// Mock repositories
const mockVerificationCodeRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByCode: vi.fn(),
  findByUserId: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockChatbotSessionRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByUserId: vi.fn(),
  findByToken: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteByUserId: vi.fn(),
};

// Mock JWT service
const mockJwtService = {
  sign: vi.fn(),
  verify: vi.fn(),
  decode: vi.fn(),
};

describe('ChatbotAuthService Integration', () => {
  let authService: ChatbotAuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    authService = new ChatbotAuthService({
      verificationCodeRepository: mockVerificationCodeRepository,
      chatbotSessionRepository: mockChatbotSessionRepository,
      jwtService: mockJwtService,
    });
  });

  describe('auth flow: generate code -> validate code -> create session', () => {
    it('should generate verification code, validate it, and create session', async () => {
      const userId = 'test-user-123';
      const mockCode = '123456';
      const mockToken = 'mock-jwt-token';
      
      // Mock JWT service to return a token
      mockJwtService.sign.mockResolvedValue(mockToken);
      
      // Step 1: Generate verification code
      const verificationCode = await authService.generateVerificationCode(userId);
      
      // Verify the code was created and stored
      expect(mockVerificationCodeRepository.create).toHaveBeenCalledWith(verificationCode);
      expect(verificationCode.userId).toBe(userId);
      expect(verificationCode.code).toMatch(/^[A-Z2-9]{9}$/); // 9-character alphanumeric

      // Step 2: Validate the verification code to get token
      // First, set up the mock to return the verification code when findByCode is called
      mockVerificationCodeRepository.findByCode.mockResolvedValue(verificationCode);
      // Also mock the update after using the code
      mockVerificationCodeRepository.update.mockResolvedValue(undefined);
      // Mock the session creation
      mockChatbotSessionRepository.create.mockResolvedValue(undefined);

      const telegramUserId = '123456789';
      const result = await authService.validateVerificationCode(verificationCode.code, telegramUserId);
      
      // Verify the results
      expect(result.userId).toBe(userId);
      expect(result.token).toBe(mockToken);
      
      // Verify repository calls
      expect(mockVerificationCodeRepository.findByCode).toHaveBeenCalledWith(verificationCode.code);
      expect(mockVerificationCodeRepository.update).toHaveBeenCalledWith(verificationCode);
      expect(mockChatbotSessionRepository.create).toHaveBeenCalled();
      
      // Verify the code was marked as used
      expect(verificationCode.isUsed).toBe(true);
    });

    it('should fail to validate an invalid verification code', async () => {
      const invalidCode = 'invalid-code';
      
      mockVerificationCodeRepository.findByCode.mockResolvedValue(null);
      
      await expect(authService.validateVerificationCode(invalidCode))
        .rejects.toThrow('Invalid or expired verification code');
      
      expect(mockVerificationCodeRepository.findByCode).toHaveBeenCalledWith(invalidCode);
      expect(mockVerificationCodeRepository.update).not.toHaveBeenCalled();
    });

    it('should fail to validate an already used verification code', async () => {
      const userId = 'test-user-123';
      const verificationCode = VerificationCode.generate(userId);
      // Mark as used
      verificationCode.use();
      
      mockVerificationCodeRepository.findByCode.mockResolvedValue(verificationCode);
      
      await expect(authService.validateVerificationCode(verificationCode.code))
        .rejects.toThrow('Invalid or expired verification code');
    });
  });

  describe('session validation', () => {
    it('should validate a valid session token', async () => {
      const userId = 'test-user-123';
      const sessionId = 'session-123';
      const token = 'valid-jwt-token';
      const mockPayload = { userId, sessionId, iat: Date.now(), exp: Date.now() + 3600 };
      
      mockJwtService.verify.mockResolvedValue(mockPayload);
      
      const mockSession = new ChatbotSession({
        id: sessionId,
        userId,
        token,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        isActive: true,
      });
      
      mockChatbotSessionRepository.findByToken.mockResolvedValue(mockSession);
      
      const result = await authService.validateSessionToken(token);
      
      expect(result).toEqual({ userId, sessionId });
      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
      expect(mockChatbotSessionRepository.findByToken).toHaveBeenCalledWith(token);
    });

    it('should return null for invalid token', async () => {
      const invalidToken = 'invalid-token';
      
      mockJwtService.verify.mockRejectedValue(new Error('Invalid token'));
      
      const result = await authService.validateSessionToken(invalidToken);
      
      expect(result).toBeNull();
    });

    it('should return null for non-existent session', async () => {
      const token = 'valid-but-unused-token';
      const mockPayload = { userId: 'user-123', sessionId: 'session-123' };
      
      mockJwtService.verify.mockResolvedValue(mockPayload);
      mockChatbotSessionRepository.findByToken.mockResolvedValue(null);
      
      const result = await authService.validateSessionToken(token);
      
      expect(result).toBeNull();
    });
  });

  describe('session revocation', () => {
    it('should revoke all sessions for a user', async () => {
      const userId = 'test-user-123';
      
      mockChatbotSessionRepository.deleteByUserId.mockResolvedValue(undefined);
      
      const result = await authService.revokeSession(userId);
      
      expect(result).toBe(true);
      expect(mockChatbotSessionRepository.deleteByUserId).toHaveBeenCalledWith(userId);
    });

    it('should revoke a specific session by token', async () => {
      const userId = 'test-user-123';
      const sessionId = 'session-123';
      const token = 'token-to-revoke';
      
      const mockSession = new ChatbotSession({
        id: sessionId,
        userId,
        token,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        isActive: true,
      });
      
      mockChatbotSessionRepository.findByToken.mockResolvedValue(mockSession);
      mockChatbotSessionRepository.update.mockResolvedValue(undefined);
      
      const result = await authService.revokeSession(userId, token);
      
      expect(result).toBe(true);
      expect(mockChatbotSessionRepository.findByToken).toHaveBeenCalledWith(token);
      expect(mockChatbotSessionRepository.update).toHaveBeenCalledWith(mockSession);
      expect(mockSession.isActive).toBe(false);
    });

    it('should return false when trying to revoke non-existent session', async () => {
      const userId = 'test-user-123';
      const token = 'non-existent-token';
      
      mockChatbotSessionRepository.findByToken.mockResolvedValue(null);
      
      const result = await authService.revokeSession(userId, token);
      
      expect(result).toBe(false);
    });
  });
});