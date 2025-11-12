import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleTasksProvider } from "../../src/features/tasks/infrastructure/providers/google-tasks-provider";
import { TaskSyncServiceImpl } from "../../src/features/tasks/application/services/task-sync-service";
import { FirestoreTaskRepository } from "../../src/features/tasks/infrastructure/persistence/firestore-task-repository";

/**
 * Scheduled Sync Cloud Function
 *
 * Runs every 3 minutes to sync tasks for all users with connected Google Tasks accounts.
 *
 * Architecture:
 * - Triggered by Cloud Scheduler
 * - Batch processes all users with active OAuth tokens
 * - Uses TaskSyncService for each user
 * - Comprehensive error handling and logging
 */

interface UserToken {
  userId: string;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: admin.firestore.Timestamp;
  scopes: string[];
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

/**
 * Scheduled function to sync tasks for all users
 * Runs every 3 minutes
 */
export const scheduledTaskSync = functions.pubsub
  .schedule("every 3 minutes")
  .onRun(async (context) => {
    const startTime = Date.now();
    functions.logger.info("[ScheduledSync] Starting scheduled sync", {
      timestamp: new Date().toISOString(),
    });

    try {
      // Get all users with connected Google Tasks accounts
      const db = admin.firestore();
      const tokensSnapshot = await db
        .collection("user_tokens")
        .where("provider", "==", "google-tasks")
        .get();

      if (tokensSnapshot.empty) {
        functions.logger.info("[ScheduledSync] No users with connected accounts found");
        return { success: true, usersSynced: 0, message: "No users to sync" };
      }

      functions.logger.info(`[ScheduledSync] Found ${tokensSnapshot.size} users to sync`);

      // Initialize services (reused for all users)
      const taskRepository = new FirestoreTaskRepository();
      const syncService = new TaskSyncServiceImpl(taskRepository);

      // Track sync results
      const results = {
        total: tokensSnapshot.size,
        successful: 0,
        failed: 0,
        skipped: 0,
        errors: [] as Array<{ userId: string; error: string }>,
      };

      // Process each user
      const syncPromises = tokensSnapshot.docs.map(async (doc) => {
        const tokenData = doc.data() as UserToken;
        const userId = tokenData.userId;

        try {
          // Check if token is expired
          const now = new Date();
          const expiresAt = tokenData.expiresAt.toDate();

          if (expiresAt <= now) {
            functions.logger.warn(`[ScheduledSync] Token expired for user ${userId}`);
            results.skipped++;
            results.errors.push({
              userId,
              error: "Token expired - user needs to reconnect",
            });
            return;
          }

          // Create provider with user's access token
          const googleProvider = new GoogleTasksProvider(tokenData.accessToken);

          // Perform sync
          const syncResult = await syncService.syncUserTasks(userId, googleProvider);

          if (syncResult.success) {
            functions.logger.info(`[ScheduledSync] Successfully synced user ${userId}`, {
              pulled: syncResult.pulled,
              pushed: syncResult.pushed,
              conflicts: syncResult.conflicts,
            });
            results.successful++;
          } else {
            functions.logger.error(`[ScheduledSync] Sync failed for user ${userId}`, {
              errors: syncResult.errors,
            });
            results.failed++;
            results.errors.push({
              userId,
              error: syncResult.errors.join(", "),
            });
          }
        } catch (error) {
          functions.logger.error(`[ScheduledSync] Error syncing user ${userId}:`, error);
          results.failed++;
          results.errors.push({
            userId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });

      // Wait for all syncs to complete
      await Promise.all(syncPromises);

      const duration = Date.now() - startTime;
      functions.logger.info("[ScheduledSync] Sync completed", {
        duration: `${duration}ms`,
        ...results,
      });

      return {
        success: true,
        ...results,
        duration,
      };
    } catch (error) {
      functions.logger.error("[ScheduledSync] Critical error during sync:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

/**
 * Manual trigger for testing
 * HTTP callable function to trigger sync for a specific user
 */
export const manualTaskSync = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to trigger sync"
    );
  }

  const userId = context.auth.uid;
  functions.logger.info(`[ManualSync] Manual sync triggered by user ${userId}`);

  try {
    const db = admin.firestore();

    // Get user's token
    const tokenDoc = await db
      .collection("user_tokens")
      .doc(`${userId}_google-tasks`)
      .get();

    if (!tokenDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Google Tasks account not connected"
      );
    }

    const tokenData = tokenDoc.data() as UserToken;

    // Check if token is expired
    const now = new Date();
    const expiresAt = tokenData.expiresAt.toDate();

    if (expiresAt <= now) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Token expired - please reconnect your account"
      );
    }

    // Initialize services
    const taskRepository = new FirestoreTaskRepository();
    const syncService = new TaskSyncServiceImpl(taskRepository);
    const googleProvider = new GoogleTasksProvider(tokenData.accessToken);

    // Perform sync
    const syncResult = await syncService.syncUserTasks(userId, googleProvider);

    if (syncResult.success) {
      functions.logger.info(`[ManualSync] Successfully synced user ${userId}`, syncResult);
      return {
        success: true,
        result: syncResult,
      };
    } else {
      functions.logger.error(`[ManualSync] Sync failed for user ${userId}`, syncResult);
      throw new functions.https.HttpsError(
        "internal",
        syncResult.errors.join(", ")
      );
    }
  } catch (error) {
    functions.logger.error(`[ManualSync] Error during manual sync:`, error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});
