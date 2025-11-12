import { google } from "googleapis";
import type { OAuthService } from "../../domain/repositories/oauth-repository";
import type { UserToken } from "../../domain/entities/user-token";
import { getOAuthConfig } from "./oauth-config";
import { TokenStorageService } from "./token-storage-service";

/**
 * Google OAuth Service Implementation
 *
 * Implements OAuth 2.0 flow for Google Tasks integration.
 * Uses the official Google APIs client library.
 */
export class GoogleOAuthService implements OAuthService {
  private tokenStorage: TokenStorageService;
  private readonly provider = "google-tasks";

  constructor(tokenStorage: TokenStorageService) {
    this.tokenStorage = tokenStorage;
  }

  /**
   * Get the OAuth2 client instance
   */
  private getOAuth2Client() {
    const config = getOAuthConfig(this.provider);

    return new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }

  /**
   * Generate authorization URL for Google OAuth flow
   */
  async getAuthorizationUrl(userId: string, provider: string): Promise<string> {
    const oauth2Client = this.getOAuth2Client();
    const config = getOAuthConfig(provider);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline", // Request refresh token
      scope: config.scopes,
      state: userId, // Pass userId in state to retrieve in callback
      prompt: "consent", // Force consent screen to get refresh token
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  async exchangeCodeForTokens(
    code: string,
    userId: string,
    provider: string
  ): Promise<UserToken> {
    const oauth2Client = this.getOAuth2Client();

    try {
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.access_token) {
        throw new Error("No access token received from Google");
      }

      // Calculate expiration time
      const expiresAt = new Date();
      if (tokens.expiry_date) {
        expiresAt.setTime(tokens.expiry_date);
      } else {
        // Default to 1 hour if not provided
        expiresAt.setTime(Date.now() + 3600 * 1000);
      }

      // Create UserToken entity
      const userToken: UserToken = {
        userId,
        provider: provider as any,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scopes: tokens.scope ? tokens.scope.split(" ") : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store the token
      await this.tokenStorage.storeToken(userToken);

      return userToken;
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      throw new Error(
        `Failed to exchange authorization code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Refresh an expired access token using refresh token
   */
  async refreshAccessToken(userId: string, provider: string): Promise<UserToken> {
    try {
      // Get existing token
      const existingToken = await this.tokenStorage.getToken(userId, provider);

      if (!existingToken) {
        throw new Error("No token found for user");
      }

      if (!existingToken.refreshToken) {
        throw new Error("No refresh token available");
      }

      const oauth2Client = this.getOAuth2Client();

      // Set refresh token
      oauth2Client.setCredentials({
        refresh_token: existingToken.refreshToken,
      });

      // Refresh access token
      const { credentials } = await oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error("No access token received from refresh");
      }

      // Calculate new expiration time
      const expiresAt = new Date();
      if (credentials.expiry_date) {
        expiresAt.setTime(credentials.expiry_date);
      } else {
        expiresAt.setTime(Date.now() + 3600 * 1000);
      }

      // Update token in storage
      const updatedToken = await this.tokenStorage.updateToken(userId, provider, {
        accessToken: credentials.access_token,
        expiresAt,
        updatedAt: new Date(),
      });

      return updatedToken;
    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw new Error(
        `Failed to refresh access token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Revoke OAuth token and delete from storage
   */
  async revokeToken(userId: string, provider: string): Promise<void> {
    try {
      // Get existing token
      const existingToken = await this.tokenStorage.getToken(userId, provider);

      if (!existingToken) {
        // Token doesn't exist, nothing to revoke
        return;
      }

      const oauth2Client = this.getOAuth2Client();

      // Revoke the access token with Google
      if (existingToken.accessToken) {
        try {
          await oauth2Client.revokeToken(existingToken.accessToken);
        } catch (error) {
          console.warn("Error revoking token with Google:", error);
          // Continue to delete from our storage even if revocation fails
        }
      }

      // Delete token from storage
      await this.tokenStorage.deleteToken(userId, provider);
    } catch (error) {
      console.error("Error revoking token:", error);
      throw new Error(
        `Failed to revoke token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const token = await this.tokenStorage.getToken(userId, this.provider);

    if (!token) {
      throw new Error("User is not authenticated with Google Tasks");
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const now = new Date();
    const expiresAt = new Date(token.expiresAt);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt < fiveMinutesFromNow) {
      // Token is expired or about to expire, refresh it
      const refreshedToken = await this.refreshAccessToken(userId, this.provider);
      return refreshedToken.accessToken;
    }

    return token.accessToken;
  }
}
