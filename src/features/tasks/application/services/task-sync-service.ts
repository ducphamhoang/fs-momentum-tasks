import type { Task } from "../../domain/task";
import type { TaskRepository } from "../../domain/repositories/task-repository";
import type { TaskProvider } from "../../domain/repositories/task-provider";
import {
  SyncError,
  ConflictError,
  ProviderAuthError,
  ProviderConnectionError,
} from "../../domain/errors/provider-errors";

/**
 * Task Sync Service
 *
 * Orchestrates bidirectional synchronization between local Firestore tasks
 * and external task providers (Google Tasks, Notion, etc.).
 *
 * Features:
 * - Pull sync: Fetch tasks from external provider and merge with local
 * - Push sync: Push local changes to external provider
 * - 3-way merge conflict resolution (last-write-wins with source priority)
 * - Etag-based conditional fetching for optimization
 * - Comprehensive error handling and logging
 */

export interface SyncResult {
  success: boolean;
  pulled: number; // Number of tasks pulled from provider
  pushed: number; // Number of tasks pushed to provider
  conflicts: number; // Number of conflicts resolved
  errors: string[]; // List of error messages
}

export interface TaskSyncService {
  /**
   * Synchronize all tasks for a user from a specific provider
   * @param userId - The user ID
   * @param provider - The task provider to sync with
   * @returns Sync result summary
   */
  syncUserTasks(userId: string, provider: TaskProvider): Promise<SyncResult>;
}

/**
 * Implementation of TaskSyncService
 */
export class TaskSyncServiceImpl implements TaskSyncService {
  constructor(private taskRepository: TaskRepository) {}

  /**
   * Synchronize tasks for a user
   */
  async syncUserTasks(
    userId: string,
    provider: TaskProvider
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      pulled: 0,
      pushed: 0,
      conflicts: 0,
      errors: [],
    };

    console.log(
      `[TaskSync] Starting sync for user ${userId} with provider ${provider.getProviderName()}`
    );

    try {
      // Phase 1: Pull sync (fetch from provider and merge with local)
      const pullResult = await this.pullSync(userId, provider);
      result.pulled = pullResult.pulled;
      result.conflicts += pullResult.conflicts;
      result.errors.push(...pullResult.errors);

      // Phase 2: Push sync (push local changes to provider)
      const pushResult = await this.pushSync(userId, provider);
      result.pushed = pushResult.pushed;
      result.errors.push(...pushResult.errors);

      result.success = result.errors.length === 0;

      console.log(
        `[TaskSync] Sync completed for user ${userId}:`,
        JSON.stringify(result)
      );

      return result;
    } catch (error) {
      console.error(`[TaskSync] Sync failed for user ${userId}:`, error);

      if (error instanceof ProviderAuthError) {
        result.errors.push(
          "Authentication failed. Please reconnect your account."
        );
      } else if (error instanceof ProviderConnectionError) {
        result.errors.push(
          "Connection failed. Please check your internet connection."
        );
      } else if (error instanceof SyncError) {
        result.errors.push(`Sync error: ${error.message}`);
      } else {
        result.errors.push(
          `Unexpected error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      return result;
    }
  }

  /**
   * Pull sync: Fetch tasks from provider and merge with local
   */
  private async pullSync(
    userId: string,
    provider: TaskProvider
  ): Promise<{ pulled: number; conflicts: number; errors: string[] }> {
    const result = { pulled: 0, conflicts: 0, errors: [] as string[] };

    try {
      console.log(
        `[TaskSync] Pull sync: Fetching tasks from ${provider.getProviderName()}`
      );

      // Fetch all tasks from the provider
      const externalTasks = await provider.getTasks(userId);
      console.log(
        `[TaskSync] Fetched ${externalTasks.length} tasks from provider`
      );

      // Get all local tasks for this user from the same source
      const localTasks = await this.getLocalTasksBySource(
        userId,
        provider.getProviderName()
      );
      console.log(
        `[TaskSync] Found ${localTasks.length} local tasks from ${provider.getProviderName()}`
      );

      // Build a map of local tasks by externalId for fast lookup
      const localTaskMap = new Map<string, Task>();
      localTasks.forEach((task) => {
        if (task.externalId) {
          localTaskMap.set(task.externalId, task);
        }
      });

      // Process each external task
      for (const externalTask of externalTasks) {
        try {
          const localTask = externalTask.externalId
            ? localTaskMap.get(externalTask.externalId)
            : undefined;

          if (!localTask) {
            // New task from provider - create locally
            await this.taskRepository.createTask(userId, externalTask);
            result.pulled++;
            console.log(
              `[TaskSync] Created new local task from external: ${externalTask.id}`
            );
          } else {
            // Existing task - check if update needed
            const shouldUpdate = this.shouldUpdateLocalTask(
              localTask,
              externalTask
            );

            if (shouldUpdate) {
              // Resolve conflicts and update
              const conflictResolution = this.resolveConflict(
                localTask,
                externalTask
              );

              // Count as conflict only if external was chosen (significant fields changed)
              if (conflictResolution.isConflict) {
                result.conflicts++;
                console.log(
                  `[TaskSync] Conflict resolved for task ${localTask.id} - ${conflictResolution.resolution}`
                );
              }

              await this.taskRepository.updateTask(
                userId,
                localTask.id,
                conflictResolution.mergedTask
              );
              result.pulled++;
              console.log(`[TaskSync] Updated local task: ${localTask.id}`);
            } else {
              console.log(
                `[TaskSync] Task ${localTask.id} is up to date (etag match)`
              );
            }

            // Remove from map (so we can detect deletions later)
            localTaskMap.delete(externalTask.externalId!);
          }
        } catch (error) {
          console.error(
            `[TaskSync] Error processing external task ${externalTask.id}:`,
            error
          );
          result.errors.push(
            `Failed to sync task ${externalTask.title}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      // Handle deletions: Tasks remaining in localTaskMap were deleted from provider
      for (const [externalId, localTask] of localTaskMap.entries()) {
        try {
          console.log(
            `[TaskSync] Task ${localTask.id} was deleted from provider, deleting locally`
          );
          await this.taskRepository.deleteTask(userId, localTask.id);
        } catch (error) {
          console.error(
            `[TaskSync] Error deleting local task ${localTask.id}:`,
            error
          );
          result.errors.push(
            `Failed to delete task ${localTask.title}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      return result;
    } catch (error) {
      console.error(`[TaskSync] Pull sync failed:`, error);
      throw error;
    }
  }

  /**
   * Push sync: Push local changes to provider
   */
  private async pushSync(
    userId: string,
    provider: TaskProvider
  ): Promise<{ pushed: number; errors: string[] }> {
    const result = { pushed: 0, errors: [] as string[] };

    try {
      console.log(
        `[TaskSync] Push sync: Pushing local changes to ${provider.getProviderName()}`
      );

      // Get all local tasks that need to be pushed
      // For MVP, we only sync tasks that already exist in the provider
      // Future: Support creating new tasks in provider from local tasks
      const localTasks = await this.getLocalTasksBySource(
        userId,
        provider.getProviderName()
      );

      // Filter tasks that have been modified locally after last sync
      const tasksToPush = localTasks.filter((task) => {
        if (!task.externalId) return false; // Can't push without external ID
        if (!task.lastSyncedAt) return true; // Never synced, should push

        // Check if task was modified after last sync
        const lastModified = task.updatedAt;
        const lastSynced = task.lastSyncedAt;

        return (
          lastModified instanceof Date &&
          lastSynced instanceof Date &&
          lastModified > lastSynced
        );
      });

      console.log(
        `[TaskSync] Found ${tasksToPush.length} tasks to push to provider`
      );

      for (const localTask of tasksToPush) {
        try {
          // Push update to provider
          const updatedTask = await provider.updateTask(
            userId,
            localTask.externalId!,
            localTask
          );

          // Update local task with new etag and sync timestamp
          await this.taskRepository.updateTask(userId, localTask.id, {
            externalEtag: updatedTask.externalEtag,
            lastSyncedAt: new Date(),
          });

          result.pushed++;
          console.log(
            `[TaskSync] Pushed local task ${localTask.id} to provider`
          );
        } catch (error) {
          console.error(
            `[TaskSync] Error pushing task ${localTask.id}:`,
            error
          );
          result.errors.push(
            `Failed to push task ${localTask.title}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      return result;
    } catch (error) {
      console.error(`[TaskSync] Push sync failed:`, error);
      throw error;
    }
  }

  /**
   * Get local tasks by source (e.g., "google-tasks")
   */
  private async getLocalTasksBySource(
    userId: string,
    source: string
  ): Promise<Task[]> {
    const allTasks = await this.taskRepository.getTasks(userId);
    return allTasks.filter((task) => task.source === source);
  }

  /**
   * Check if local task should be updated based on etag
   * If etags match, no update needed (optimization)
   */
  private shouldUpdateLocalTask(
    localTask: Task,
    externalTask: Task
  ): boolean {
    // If etags match, tasks are identical - no update needed
    if (
      localTask.externalEtag &&
      externalTask.externalEtag &&
      localTask.externalEtag === externalTask.externalEtag
    ) {
      return false;
    }

    // Otherwise, update is needed
    return true;
  }

  /**
   * Resolve conflict between local and external task
   * Strategy: Last-write-wins with source priority
   *
   * Rules:
   * 1. If external task is newer (based on updatedAt), use external - this is a CONFLICT
   * 2. If local task is newer, keep local but update etag - this is NOT a conflict
   * 3. If timestamps are equal, prefer external (source of truth) - this is a CONFLICT
   */
  private resolveConflict(
    localTask: Task,
    externalTask: Task
  ): {
    mergedTask: Partial<Task>;
    isConflict: boolean;
    resolution: string;
  } {
    console.log(
      `[TaskSync] Resolving conflict for task ${localTask.id}`,
      {
        localUpdatedAt: localTask.updatedAt,
        externalUpdatedAt: externalTask.updatedAt,
      }
    );

    // Convert to Date objects for comparison
    const localUpdatedAt =
      localTask.updatedAt instanceof Date
        ? localTask.updatedAt
        : new Date(localTask.updatedAt);
    const externalUpdatedAt =
      externalTask.updatedAt instanceof Date
        ? externalTask.updatedAt
        : new Date(externalTask.updatedAt);

    // If external is newer or equal, take all external changes - this is a conflict
    if (externalUpdatedAt >= localUpdatedAt) {
      console.log(
        `[TaskSync] External task is newer or equal, using external version`
      );
      return {
        mergedTask: {
          ...externalTask,
          id: localTask.id, // Keep local ID
          userId: localTask.userId, // Keep local userId
          lastSyncedAt: new Date(),
        },
        isConflict: true,
        resolution: "external-wins",
      };
    }

    // Local is newer - keep local but update sync metadata - NOT a conflict
    console.log(`[TaskSync] Local task is newer, keeping local version`);
    return {
      mergedTask: {
        externalEtag: externalTask.externalEtag,
        lastSyncedAt: new Date(),
      },
      isConflict: false,
      resolution: "local-kept",
    };
  }
}
