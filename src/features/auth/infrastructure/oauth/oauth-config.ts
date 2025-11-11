/**
 * OAuth Configuration
 *
 * Configuration for OAuth 2.0 providers.
 * Credentials should be stored in environment variables.
 */

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revokeEndpoint?: string;
}

/**
 * Google OAuth Configuration
 */
export const GoogleOAuthConfig: OAuthProviderConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  redirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:9002/auth/callback/google",
  scopes: [
    "https://www.googleapis.com/auth/tasks",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revokeEndpoint: "https://oauth2.googleapis.com/revoke",
};

/**
 * Validate OAuth configuration
 * @param config - The OAuth configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateOAuthConfig(config: OAuthProviderConfig): void {
  if (!config.clientId) {
    throw new Error("OAuth client ID is not configured");
  }
  if (!config.clientSecret) {
    throw new Error("OAuth client secret is not configured");
  }
  if (!config.redirectUri) {
    throw new Error("OAuth redirect URI is not configured");
  }
  if (!config.scopes || config.scopes.length === 0) {
    throw new Error("OAuth scopes are not configured");
  }
}

/**
 * Get OAuth configuration for a provider
 * @param provider - The provider name
 * @returns The OAuth configuration
 * @throws Error if provider is not supported
 */
export function getOAuthConfig(provider: string): OAuthProviderConfig {
  switch (provider) {
    case "google-tasks":
      validateOAuthConfig(GoogleOAuthConfig);
      return GoogleOAuthConfig;
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
}
