import { randomBytes, createHash } from 'crypto';

export class SessionToken {
  public readonly value: string;
  private readonly hashedValue: string;

  private constructor(token: string, hashedToken: string) {
    this.value = token;
    this.hashedValue = hashedToken;
  }

  public static create(rawToken?: string): SessionToken {
    const token = rawToken || randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(token).digest('hex');
    return new SessionToken(token, hashedToken);
  }

  public static fromHashedValue(hashedValue: string): SessionToken {
    // For validation purposes only - we don't expose the original token
    return new SessionToken('', hashedValue);
  }

  public matches(token: string): boolean {
    const hashedInput = createHash('sha256').update(token).digest('hex');
    return hashedInput === this.hashedValue;
  }

  public getHashedValue(): string {
    return this.hashedValue;
  }

  public static validate(token: string): boolean {
    // Basic validation: token should be a hex string of at least 64 characters (32 bytes)
    return typeof token === 'string' && /^[a-f0-9]{64,}$/.test(token);
  }
}