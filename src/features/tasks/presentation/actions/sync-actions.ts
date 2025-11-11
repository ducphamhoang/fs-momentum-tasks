"use server";

import { diContainer } from "@/shared/infrastructure/di/container";
import { GoogleTasksProvider } from "../../infrastructure/providers/google-tasks-provider";
import { TokenStorageService } from "@/features/auth/infrastructure/oauth/token-storage-service";
import type { SyncResult } from "../../application/services/task-sync-service";

/**
 * Sync Actions
 *
 * Server actions for triggering manual sync operations with external task providers.
 * These actions are useful for testing and for providing "Sync Now" buttons in the UI.
 */

/**
 * Manually trigger sync with Google Tasks
 * @param userId - The user ID to sync tasks for
 * @returns Sync result summary
 */
export async function syncGoogleTasks(
  userId: string
): Promise<{
  success: boolean;
  result?: SyncResult;
  error?: string;
}> {
  try {
    console.log(`[SyncActions] Triggering Google Tasks sync for user ${userId}`);

    // Get services from DI container
    const syncService = diContainer.taskSyncService;
    const tokenStorage = new TokenStorageService();

    // Check if user has connected Google Tasks
    const token = await tokenStorage.getToken(userId, "google-tasks");
    if (!token) {
      console.warn(`[SyncActions] User ${userId} has not connected Google Tasks`);
      return {
        success: false,
        error: "Google Tasks is not connected. Please connect your account first.",
      };
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = token.expiresAt instanceof Date
      ? token.expiresAt
      : new Date(token.expiresAt);

    if (expiresAt <= now) {
      console.warn(`[SyncActions] Token expired for user ${userId}`);
      return {
        success: false,
        error: "Your Google Tasks connection has expired. Please reconnect your account.",
      };
    }

    // Create Google Tasks provider with user's access token
    const googleProvider = new GoogleTasksProvider(token.accessToken);

    // Perform sync
    const result = await syncService.syncUserTasks(userId, googleProvider);

    console.log(`[SyncActions] Sync completed for user ${userId}:`, result);

    if (result.success) {
      return {
        success: true,
        result,
      };
    } else {
      return {
        success: false,
        error: result.errors.join(", "),
        result,
      };
    }
  } catch (error) {
    console.error(`[SyncActions] Error syncing tasks for user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during sync",
    };
  }
}

/**
 * Get last sync status for a user
 * This is a placeholder - in a real implementation, you'd store sync history
 */
export async function getLastSyncStatus(
  userId: string
): Promise<{
  lastSyncedAt?: Date;
  status?: "success" | "error";
  message?: string;
}> {
  // TODO: Implement sync history tracking
  // For now, we can check if token exists
  try {
    const tokenStorage = new TokenStorageService();
    const token = await tokenStorage.getToken(userId, "google-tasks");

    if (!token) {
      return {
        message: "Google Tasks not connected",
      };
    }

    return {
      status: "success",
      message: "Ready to sync",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
