import { describe, it, expect, beforeEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { JsonwebtokenService } from '../../../infrastructure/jwt/jsonwebtoken-service';

// The JWT_SECRET is set in vitest.config.ts
// No need to stub it here unless testing error conditions

// Mock the jsonwebtoken library
vi.mock('jsonwebtoken', async () => {
  const actual = await vi.importActual('jsonwebtoken');
  return {
    ...actual,
    sign: vi.fn(),
    verify: vi.fn(),
    decode: vi.fn(),
  };
});

describe('JsonwebtokenService', () => {
  let jwtService: JsonwebtokenService;

  beforeEach(() => {
    jwtService = new JsonwebtokenService();
  });

  describe('sign', () => {
    it('should sign a payload correctly', async () => {
      const mockToken = 'mock-signed-token';
      const payload = { userId: 'test-user', role: 'user' };
      
      vi.spyOn(jwt, 'sign').mockImplementation((payload, secret, options, callback) => {
        callback(null, mockToken);
      });

      const result = await jwtService.sign(payload);

      expect(result).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'test-secret-key-for-testing-only-min-32-chars-long', // Match vitest.config.ts
        { expiresIn: '24h' },
        expect.any(Function)
      );
    });

    it('should use custom expiration time when provided', async () => {
      const mockToken = 'mock-signed-token';
      const payload = { userId: 'test-user' };
      const options = { expiresIn: '1h' };
      
      vi.spyOn(jwt, 'sign').mockImplementation((payload, secret, options, callback) => {
        callback(null, mockToken);
      });

      await jwtService.sign(payload, options);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'test-secret-key-for-testing-only-min-32-chars-long', // Match vitest.config.ts
        options,
        expect.any(Function)
      );
    });

    it('should reject when signing fails', async () => {
      const payload = { userId: 'test-user' };
      const error = new Error('Signing failed');

      vi.spyOn(jwt, 'sign').mockImplementation((payload, secret, options, callback: any) => {
        callback(error, undefined);
      });

      await expect(jwtService.sign(payload)).rejects.toThrow('Signing failed');
    });

    it('should throw error when JWT_SECRET is not set', async () => {
      const originalEnv = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      const newJwtService = new JsonwebtokenService();

      await expect(newJwtService.sign({ userId: 'test-user' }))
        .rejects.toThrow('JWT_SECRET environment variable is not set');

      process.env.JWT_SECRET = originalEnv;
    });
  });

  describe('verify', () => {
    it('should verify a token correctly', async () => {
      const token = 'valid-token';
      const mockPayload = { userId: 'test-user', iat: 1234567890, exp: 1234567890 };
      
      (vi.spyOn(jwt, 'verify') as any).mockImplementation((token: any, secret: any, callback: any) => {
        callback(null, mockPayload);
      });

      const result = await jwtService.verify(token);

      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        'test-secret-key-for-testing-only-min-32-chars-long', // Match vitest.config.ts
        expect.any(Function)
      );
    });

    it('should reject when verification fails', async () => {
      const token = 'invalid-token';
      const error = new Error('Invalid token');
      
      (vi.spyOn(jwt, 'verify') as any).mockImplementation((token: any, secret: any, callback: any) => {
        callback(error, undefined);
      });

      await expect(jwtService.verify(token)).rejects.toThrow('Invalid token');
    });

    it('should throw error when JWT_SECRET is not set', async () => {
      const originalEnv = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      const newJwtService = new JsonwebtokenService();

      await expect(newJwtService.verify('some-token'))
        .rejects.toThrow('JWT_SECRET environment variable is not set');

      process.env.JWT_SECRET = originalEnv;
    });
  });

  describe('decode', () => {
    it('should decode a token correctly', () => {
      const token = 'some-token';
      const mockPayload = { userId: 'test-user', role: 'user' };
      
      vi.spyOn(jwt, 'decode').mockReturnValue(mockPayload);

      const result = jwtService.decode(token);

      expect(result).toEqual(mockPayload);
      expect(jwt.decode).toHaveBeenCalledWith(token);
    });

    it('should return null when decoding fails', () => {
      const token = 'invalid-token';
      
      vi.spyOn(jwt, 'decode').mockImplementation(() => {
        throw new Error('Decoding failed');
      });

      const result = jwtService.decode(token);

      expect(result).toBeNull();
    });
  });
});