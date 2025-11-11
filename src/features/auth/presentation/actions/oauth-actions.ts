"use server";

import * as admin from "firebase-admin";
import { GoogleOAuthService } from "../../infrastructure/oauth/google-oauth";
import { TokenStorageService } from "../../infrastructure/oauth/token-storage-service";

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

/**
 * Initiate Google OAuth flow
 *
 * Server action to generate OAuth authorization URL.
 * Called when user clicks "Connect Google Tasks" button.
 *
 * @param userId - The authenticated user's ID
 * @returns Object with authorization URL or error
 */
export async function initiateGoogleOAuth(userId: string): Promise<{
  success: boolean;
  authUrl?: string;
  error?: string;
}> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    const tokenStorage = new TokenStorageService();
    const oauthService = new GoogleOAuthService(tokenStorage);

    const authUrl = await oauthService.getAuthorizationUrl(
      userId,
      "google-tasks"
    );

    return {
      success: true,
      authUrl,
    };
  } catch (error) {
    console.error("Error initiating Google OAuth:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to initiate OAuth flow",
    };
  }
}

/**
 * Handle Google OAuth callback
 *
 * Server action to exchange authorization code for tokens.
 * Called from the OAuth callback page after user authorizes.
 *
 * @param code - Authorization code from Google
 * @param userId - The user's ID (from state parameter)
 * @returns Object with success status or error
 */
export async function handleGoogleOAuthCallback(
  code: string,
  userId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!code) {
      return {
        success: false,
        error: "Authorization code is required",
      };
    }

    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    const tokenStorage = new TokenStorageService();
    const oauthService = new GoogleOAuthService(tokenStorage);

    await oauthService.exchangeCodeForTokens(code, userId, "google-tasks");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error handling Google OAuth callback:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete OAuth flow",
    };
  }
}

/**
 * Disconnect Google account
 *
 * Server action to revoke OAuth token and disconnect Google Tasks.
 * Called when user clicks "Disconnect" button.
 *
 * @param userId - The authenticated user's ID
 * @returns Object with success status or error
 */
export async function disconnectGoogleAccount(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    const tokenStorage = new TokenStorageService();
    const oauthService = new GoogleOAuthService(tokenStorage);

    await oauthService.revokeToken(userId, "google-tasks");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error disconnecting Google account:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to disconnect Google account",
    };
  }
}

/**
 * Check Google Tasks connection status
 *
 * Server action to check if user has a valid Google Tasks token.
 *
 * @param userId - The authenticated user's ID
 * @returns Object with connection status
 */
export async function checkGoogleTasksConnection(userId: string): Promise<{
  isConnected: boolean;
  error?: string;
}> {
  try {
    if (!userId) {
      return {
        isConnected: false,
        error: "User ID is required",
      };
    }

    const tokenStorage = new TokenStorageService();
    const isConnected = await tokenStorage.hasValidToken(
      userId,
      "google-tasks"
    );

    return {
      isConnected,
    };
  } catch (error) {
    console.error("Error checking Google Tasks connection:", error);
    return {
      isConnected: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to check connection status",
    };
  }
}

/**
 * Refresh Google OAuth token
 *
 * Server action to manually refresh an expired token.
 * Usually this is handled automatically, but can be called manually if needed.
 *
 * @param userId - The authenticated user's ID
 * @returns Object with success status or error
 */
export async function refreshGoogleToken(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    const tokenStorage = new TokenStorageService();
    const oauthService = new GoogleOAuthService(tokenStorage);

    await oauthService.refreshAccessToken(userId, "google-tasks");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error refreshing Google token:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to refresh token",
    };
  }
}
