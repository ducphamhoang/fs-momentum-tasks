/**
 * Port interface for JWT service implementations.
 * Defines the contract for JWT operations including signing, verification, and decoding.
 */
export interface JwtServicePort {
  /**
   * Signs a payload with the configured secret and returns a JWT token.
   * @param payload The data to be included in the token
   * @param options Optional parameters like token expiration time
   * @returns A signed JWT token as a string
   */
  sign(payload: any, options?: { expiresIn?: string | number }): Promise<string>;
  
  /**
   * Verifies a JWT token and returns the decoded payload.
   * @param token The JWT token to verify
   * @returns The decoded payload of type T, or throws an error if verification fails
   */
  verify<T = any>(token: string): Promise<T>;
  
  /**
   * Decodes a JWT token without verifying its signature.
   * @param token The JWT token to decode
   * @returns The decoded payload of type T, or null if decoding fails
   */
  decode<T = any>(token: string): T | null;
}