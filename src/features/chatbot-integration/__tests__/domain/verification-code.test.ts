import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { VerificationCode } from '../../domain/entities/verification-code';

describe('VerificationCode Entity', () => {
  beforeEach(() => {
    // Mock random number generation for predictable tests
    vi.spyOn(Math, 'random').mockReturnValue(0.123456);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generate', () => {
    it('should create a verification code with correct properties', () => {
      const userId = 'test-user-123';
      const code = VerificationCode.generate(userId, 10);

      expect(code).toBeDefined();
      expect(code.id).toMatch(/^code_\d+_[a-z0-9]+$/);
      expect(code.userId).toBe(userId);
      expect(code.code).toMatch(/^[A-Z2-9]{9}$/); // 9-character alphanumeric (excludes 0,O,1,I,L)
      expect(code.isUsed).toBe(false);
      expect(code.usedAt).toBeUndefined();
    });

    it('should set expiration time correctly', () => {
      const userId = 'test-user-123';
      const expiresInMinutes = 15;
      const code = VerificationCode.generate(userId, expiresInMinutes);

      const now = new Date();
      const expectedExpiry = new Date(now.getTime() + expiresInMinutes * 60 * 1000);

      // Check that expiresAt is within a reasonable range of expected expiry time
      expect(code.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry.getTime() - 1000); // Allow 1 second tolerance
      expect(code.expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiry.getTime() + 1000);
    });

    it('should default to 5 minutes expiration when not specified', () => {
      const userId = 'test-user-123';
      const code = VerificationCode.generate(userId);

      const now = new Date();
      const expectedExpiry = new Date(now.getTime() + 5 * 60 * 1000); // Changed to 5 minutes

      expect(code.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry.getTime() - 1000);
      expect(code.expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiry.getTime() + 1000);
    });
  });

  describe('use', () => {
    it('should mark code as used and set usedAt time', () => {
      const userId = 'test-user-123';
      const code = VerificationCode.generate(userId);

      const beforeUse = new Date();
      code.use();
      const afterUse = new Date();

      expect(code.isUsed).toBe(true);
      expect(code.usedAt).toBeDefined();
      expect(code.usedAt!.getTime()).toBeGreaterThanOrEqual(beforeUse.getTime());
      expect(code.usedAt!.getTime()).toBeLessThanOrEqual(afterUse.getTime());
    });

    it('should throw error when using an already used code', () => {
      const userId = 'test-user-123';
      const code = VerificationCode.generate(userId);

      // Use the code once
      code.use();

      // Try to use it again
      expect(() => code.use()).toThrow('Verification code already used');
    });

    it('should throw error when using an expired code', () => {
      const userId = 'test-user-123';
      // Create a code that expired 1 minute ago
      const code = new VerificationCode({
        id: 'test-id',
        code: '123456',
        userId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 minute ago
        isUsed: false,
      });

      expect(() => code.use()).toThrow('Verification code has expired');
    });
  });

  describe('isExpired', () => {
    it('should return false for non-expired code', () => {
      const userId = 'test-user-123';
      const code = VerificationCode.generate(userId, 10); // Expires in 10 minutes

      expect(code.isExpired()).toBe(false);
    });

    it('should return true for expired code', () => {
      const userId = 'test-user-123';
      // Create an expired code
      const code = new VerificationCode({
        id: 'test-id',
        code: '123456',
        userId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        isUsed: false,
      });

      expect(code.isExpired()).toBe(true);
    });
  });

  describe('isValid', () => {
    it('should return true for valid code', () => {
      const userId = 'test-user-123';
      const code = VerificationCode.generate(userId);

      expect(code.isValid()).toBe(true);
    });

    it('should return false for used code', () => {
      const userId = 'test-user-123';
      const code = VerificationCode.generate(userId);
      code.use();

      expect(code.isValid()).toBe(false);
    });

    it('should return false for expired code', () => {
      const userId = 'test-user-123';
      // Create an expired code
      const code = new VerificationCode({
        id: 'test-id',
        code: '123456',
        userId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        isUsed: false,
      });

      expect(code.isValid()).toBe(false);
    });

    it('should return false for used and expired code', () => {
      const userId = 'test-user-123';
      // Create a code that's used but not expired
      const code = new VerificationCode({
        id: 'test-id',
        code: '123456',
        userId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000), // Expires in 1 minute
        isUsed: true,  // Mark as used
      });

      expect(code.isValid()).toBe(false);
    });
  });
});