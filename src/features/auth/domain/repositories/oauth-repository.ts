import type { UserToken } from "../entities/user-token";

/**
 * OAuth Token Repository Interface
 *
 * Defines operations for storing and retrieving OAuth tokens.
 * This interface is implemented by the infrastructure layer.
 */
export interface OAuthTokenRepository {
  /**
   * Store OAuth tokens for a user and provider
   * @param token - The token data to store
   * @returns Promise resolving to the stored token
   */
  storeToken(token: UserToken): Promise<UserToken>;

  /**
   * Get OAuth token for a user and provider
   * @param userId - The user's ID
   * @param provider - The provider name (e.g., "google-tasks")
   * @returns Promise resolving to the token or null if not found
   */
  getToken(userId: string, provider: string): Promise<UserToken | null>;

  /**
   * Update OAuth token (typically after refresh)
   * @param userId - The user's ID
   * @param provider - The provider name
   * @param updates - Partial token data to update
   * @returns Promise resolving to the updated token
   */
  updateToken(
    userId: string,
    provider: string,
    updates: Partial<UserToken>
  ): Promise<UserToken>;

  /**
   * Delete OAuth token (on disconnect)
   * @param userId - The user's ID
   * @param provider - The provider name
   * @returns Promise resolving when deletion is complete
   */
  deleteToken(userId: string, provider: string): Promise<void>;

  /**
   * Check if user has a valid token for a provider
   * @param userId - The user's ID
   * @param provider - The provider name
   * @returns Promise resolving to true if token exists and not expired
   */
  hasValidToken(userId: string, provider: string): Promise<boolean>;
}

/**
 * OAuth Service Interface
 *
 * Defines operations for OAuth authentication flow.
 */
export interface OAuthService {
  /**
   * Get the authorization URL for initiating OAuth flow
   * @param userId - The user's ID
   * @param provider - The provider name
   * @returns Promise resolving to the authorization URL
   */
  getAuthorizationUrl(userId: string, provider: string): Promise<string>;

  /**
   * Exchange authorization code for access tokens
   * @param code - The authorization code from OAuth callback
   * @param userId - The user's ID
   * @param provider - The provider name
   * @returns Promise resolving to the stored token
   */
  exchangeCodeForTokens(
    code: string,
    userId: string,
    provider: string
  ): Promise<UserToken>;

  /**
   * Refresh an expired access token
   * @param userId - The user's ID
   * @param provider - The provider name
   * @returns Promise resolving to the refreshed token
   */
  refreshAccessToken(userId: string, provider: string): Promise<UserToken>;

  /**
   * Revoke OAuth tokens and disconnect provider
   * @param userId - The user's ID
   * @param provider - The provider name
   * @returns Promise resolving when revocation is complete
   */
  revokeToken(userId: string, provider: string): Promise<void>;
}
