import jwt from 'jsonwebtoken';
import { JwtServicePort } from '../../application/ports/jwt-service.port';

export class JsonwebtokenService implements JwtServicePort {
  async sign(payload: any, options?: { expiresIn?: string | number }): Promise<string> {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        secret,
        { expiresIn: options?.expiresIn || '24h' },
        (err, token) => {
          if (err) {
            reject(err);
          } else if (token) {
            resolve(token);
          } else {
            reject(new Error('Failed to generate token'));
          }
        }
      );
    });
  }

  async verify<T = any>(token: string): Promise<T> {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, (err, decoded) => {
        if (err) {
          reject(err);
        } else if (decoded) {
          resolve(decoded as T);
        } else {
          reject(new Error('Failed to verify token'));
        }
      });
    });
  }

  decode<T = any>(token: string): T | null {
    try {
      // Using jwt.decode without verification to just get the payload
      const decoded = jwt.decode(token);
      return decoded as T | null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}