import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  TaskSyncServiceImpl,
  type SyncResult,
} from "../task-sync-service";
import type { TaskRepository } from "../../../domain/repositories/task-repository";
import { MockTaskProvider } from "../../../domain/repositories/mock-task-provider";
import type { Task, CreateTaskInput } from "../../../domain/task";
import {
  ProviderAuthError,
  ProviderConnectionError,
} from "../../../domain/errors/provider-errors";

/**
 * Task Sync Service Tests
 *
 * Tests the bidirectional sync logic including:
 * - Pull sync (fetch from provider and merge)
 * - Push sync (push local changes to provider)
 * - Conflict resolution (last-write-wins)
 * - Etag optimization
 * - Error handling
 */
describe("TaskSyncService", () => {
  let syncService: TaskSyncServiceImpl;
  let mockRepository: TaskRepository;
  let mockProvider: MockTaskProvider;
  const testUserId = "test-user-123";

  // Helper to create a test task
  const createTestTask = (
    overrides: Partial<Task> = {}
  ): Task => {
    return {
      id: `task-${Date.now()}`,
      userId: testUserId,
      title: "Test Task",
      description: "Test description",
      isCompleted: false,
      importanceLevel: "medium",
      source: "google-tasks",
      externalId: `external-${Date.now()}`,
      externalEtag: `etag-${Date.now()}`,
      lastSyncedAt: new Date(),
      reminders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  };

  beforeEach(() => {
    // Create mock repository with shared tasks array
    const tasks: Task[] = [];

    mockRepository = {
      getTasks: vi.fn(async (userId: string) => [...tasks]), // Return copy
      getTaskById: vi.fn(),
      createTask: vi.fn(async (userId: string, input: CreateTaskInput) => {
        const newTask = createTestTask({
          ...input,
          id: `local-${Date.now()}-${Math.random()}`,
        });
        tasks.push(newTask);
        return newTask;
      }),
      updateTask: vi.fn(
        async (userId: string, taskId: string, updates: Partial<Task>) => {
          const taskIndex = tasks.findIndex((t) => t.id === taskId);
          if (taskIndex >= 0) {
            tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
            return tasks[taskIndex];
          }
          // If not found in array, create a new updated task for test purposes
          const updatedTask = createTestTask({ id: taskId, ...updates });
          tasks.push(updatedTask);
          return updatedTask;
        }
      ),
      deleteTask: vi.fn(async (userId: string, taskId: string) => {
        const taskIndex = tasks.findIndex((t) => t.id === taskId);
        if (taskIndex >= 0) {
          tasks.splice(taskIndex, 1);
        }
      }),
    };

    mockProvider = new MockTaskProvider("google-tasks");
    syncService = new TaskSyncServiceImpl(mockRepository);
  });

  describe("Pull sync - New tasks from provider", () => {
    it("should create local tasks for new external tasks", async () => {
      // Setup: Provider has 2 tasks, local has none
      await mockProvider.createTask(testUserId, {
        title: "External Task 1",
        importanceLevel: "high",
      });
      await mockProvider.createTask(testUserId, {
        title: "External Task 2",
        importanceLevel: "medium",
      });

      const result = await syncService.syncUserTasks(testUserId, mockProvider);

      expect(result.success).toBe(true);
      expect(result.pulled).toBe(2);
      expect(result.pushed).toBe(0);
      expect(result.conflicts).toBe(0);
      expect(result.errors).toEqual([]);

      expect(mockRepository.createTask).toHaveBeenCalledTimes(2);
    });
  });

  describe("Pull sync - Updated tasks from provider", () => {
    it("should update local task when external task is newer", async () => {
      const now = new Date();
      const pastTime = new Date(now.getTime() - 1000 * 60); // 1 minute ago

      // Create task in provider
      const externalTask = await mockProvider.createTask(testUserId, {
        title: "Original Title",
        importanceLevel: "medium",
      });

      // Create matching local task (older) - add it to repository first
      const localTask = await mockRepository.createTask(testUserId, {
        title: "Local Title",
        importanceLevel: "medium",
      });

      // Update the local task to have matching externalId and older updatedAt
      await mockRepository.updateTask(testUserId, localTask.id, {
        externalId: externalTask.externalId,
        externalEtag: "old-etag",
        updatedAt: pastTime,
        source: "google-tasks",
      });

      // Update external task (newer)
      await mockProvider.updateTask(testUserId, externalTask.externalId!, {
        title: "Updated External Title",
      });

      const result = await syncService.syncUserTasks(testUserId, mockProvider);

      expect(result.success).toBe(true);
      expect(result.pulled).toBe(1);
      expect(result.conflicts).toBe(1); // Conflict was resolved
      expect(mockRepository.updateTask).toHaveBeenCalledWith(
        testUserId,
        localTask.id,
        expect.objectContaining({
          title: "Updated External Title",
        })
      );
    });

    it("should not update local task when etags match", async () => {
      // Create task in provider
      const externalTask = await mockProvider.createTask(testUserId, {
        title: "Matching Task",
        importanceLevel: "medium",
      });

      // Create matching local task with same etag - add to repository first
      const localTask = await mockRepository.createTask(testUserId, {
        title: "Matching Task",
        importanceLevel: "medium",
      });

      await mockRepository.updateTask(testUserId, localTask.id, {
        externalId: externalTask.externalId,
        externalEtag: externalTask.externalEtag, // Same etag
        source: "google-tasks",
      });

      const result = await syncService.syncUserTasks(testUserId, mockProvider);

      expect(result.success).toBe(true);
      expect(result.pulled).toBe(0); // No update needed
    });

    it("should keep local changes when local task is newer", async () => {
      const now = new Date();
      const pastTime = new Date(now.getTime() - 1000 * 60); // 1 minute ago

      // Create task in provider (older)
      const externalTask = await mockProvider.createTask(testUserId, {
        title: "External Title",
        importanceLevel: "medium",
      });

      // Manually set older updatedAt
      const externalTasks = await mockProvider.getTasks(testUserId);
      externalTasks[0].updatedAt = pastTime;

      // Create matching local task (newer) - add to repository first
      const localTask = await mockRepository.createTask(testUserId, {
        title: "Newer Local Title",
        importanceLevel: "medium",
      });

      await mockRepository.updateTask(testUserId, localTask.id, {
        externalId: externalTask.externalId,
        externalEtag: "different-etag",
        updatedAt: now,
        source: "google-tasks",
      });

      const result = await syncService.syncUserTasks(testUserId, mockProvider);

      expect(result.success).toBe(true);
      expect(result.pulled).toBe(1);
      expect(result.conflicts).toBe(0); // Local was kept, no conflict

      // Should only update sync metadata, not the task content
      expect(mockRepository.updateTask).toHaveBeenCalledWith(
        testUserId,
        localTask.id,
        expect.objectContaining({
          externalEtag: expect.any(String),
          lastSyncedAt: expect.any(Date),
        })
      );
    });
  });

  describe("Pull sync - Deleted tasks from provider", () => {
    it("should delete local tasks that no longer exist in provider", async () => {
      // Local has task, but provider doesn't
      const localTask = createTestTask({
        id: "local-123",
        title: "Deleted Task",
        externalId: "external-deleted",
      });
      (mockRepository.getTasks as any).mockResolvedValue([localTask]);

      const result = await syncService.syncUserTasks(testUserId, mockProvider);

      expect(result.success).toBe(true);
      expect(mockRepository.deleteTask).toHaveBeenCalledWith(
        testUserId,
        localTask.id
      );
    });
  });

  describe("Push sync - Local changes to provider", () => {
    it("should push locally modified tasks to provider", async () => {
      const pastTime = new Date(Date.now() - 1000 * 60); // 1 minute ago
      const now = new Date();

      // Create task in provider first
      const externalTask = await mockProvider.createTask(testUserId, {
        title: "Original Title",
        importanceLevel: "medium",
      });

      // Set external task to have older updatedAt
      const externalTasks = await mockProvider.getTasks(testUserId);
      externalTasks[0].updatedAt = pastTime;

      // Create local task that was modified after last sync - add to repository
      const localTask = await mockRepository.createTask(testUserId, {
        title: "Modified Local Title",
        importanceLevel: "medium",
      });

      await mockRepository.updateTask(testUserId, localTask.id, {
        externalId: externalTask.externalId,
        externalEtag: externalTask.externalEtag,
        lastSyncedAt: pastTime,
        updatedAt: now, // Modified after last sync AND after external
        source: "google-tasks",
      });

      const result = await syncService.syncUserTasks(testUserId, mockProvider);

      expect(result.success).toBe(true);
      expect(result.pushed).toBe(1);

      // Verify task was updated in provider
      const providerTasks = await mockProvider.getTasks(testUserId);
      expect(providerTasks[0].title).toBe("Modified Local Title");
    });

    it("should not push tasks that haven't been modified since last sync", async () => {
      const syncTime = new Date();

      // Create task in provider
      const externalTask = await mockProvider.createTask(testUserId, {
        title: "Synced Task",
        importanceLevel: "medium",
      });

      // Create local task that hasn't been modified since last sync - add to repository
      const localTask = await mockRepository.createTask(testUserId, {
        title: "Synced Task",
        importanceLevel: "medium",
      });

      await mockRepository.updateTask(testUserId, localTask.id, {
        externalId: externalTask.externalId,
        lastSyncedAt: syncTime,
        updatedAt: syncTime, // Not modified after sync
        source: "google-tasks",
      });

      const result = await syncService.syncUserTasks(testUserId, mockProvider);

      expect(result.success).toBe(true);
      expect(result.pushed).toBe(0); // Nothing to push
    });

    it("should push tasks that have never been synced", async () => {
      const pastTime = new Date(Date.now() - 1000 * 60);
      const now = new Date();

      // Create task in provider
      const externalTask = await mockProvider.createTask(testUserId, {
        title: "Original Title",
        importanceLevel: "medium",
      });

      // Set external task to have older updatedAt
      const externalTasks = await mockProvider.getTasks(testUserId);
      externalTasks[0].updatedAt = pastTime;

      // Create local task that has never been synced (lastSyncedAt is null) - add to repository
      const localTask = await mockRepository.createTask(testUserId, {
        title: "Never Synced",
        importanceLevel: "medium",
      });

      await mockRepository.updateTask(testUserId, localTask.id, {
        externalId: externalTask.externalId,
        externalEtag: externalTask.externalEtag,
        lastSyncedAt: undefined, // Never synced
        updatedAt: now, // Newer than external
        source: "google-tasks",
      });

      const result = await syncService.syncUserTasks(testUserId, mockProvider);

      expect(result.success).toBe(true);
      expect(result.pushed).toBe(1);
    });
  });

  describe("Error handling", () => {
    it("should handle authentication errors gracefully", async () => {
      mockProvider.simulateAuthError = true;

      const result = await syncService.syncUserTasks(testUserId, mockProvider);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("Authentication failed");
    });

    it("should handle connection errors gracefully", async () => {
      mockProvider.simulateConnectionError = true;

      const result = await syncService.syncUserTasks(testUserId, mockProvider);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("Connection failed");
    });

    it("should continue sync if individual task fails", async () => {
      // Create 2 tasks in provider
      await mockProvider.createTask(testUserId, {
        title: "Task 1",
        importanceLevel: "medium",
      });
      await mockProvider.createTask(testUserId, {
        title: "Task 2",
        importanceLevel: "medium",
      });

      // Make repository fail on first create
      let callCount = 0;
      (mockRepository.createTask as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error("Simulated error");
        }
        return createTestTask();
      });

      const result = await syncService.syncUserTasks(testUserId, mockProvider);

      // Should have partial success
      expect(result.pulled).toBe(1); // One succeeded
      expect(result.errors.length).toBe(1); // One failed
      expect(result.errors[0]).toContain("Simulated error");
    });
  });

  describe("Bidirectional sync", () => {
    it("should handle both pull and push in single sync", async () => {
      const pastTime = new Date(Date.now() - 1000 * 60);
      const now = new Date();

      // Create 2 tasks in provider
      const externalTask1 = await mockProvider.createTask(testUserId, {
        title: "External Task 1",
        importanceLevel: "medium",
      });
      const externalTask2 = await mockProvider.createTask(testUserId, {
        title: "External Task 2",
        importanceLevel: "medium",
      });

      // Set external tasks to have older updatedAt
      const externalTasks = await mockProvider.getTasks(testUserId);
      externalTasks.forEach((t) => (t.updatedAt = pastTime));

      // Create 1 local task that matches externalTask1 but is modified - add to repository
      const localTask1 = await mockRepository.createTask(testUserId, {
        title: "Modified Task 1",
        importanceLevel: "medium",
      });

      await mockRepository.updateTask(testUserId, localTask1.id, {
        externalId: externalTask1.externalId,
        externalEtag: externalTask1.externalEtag,
        lastSyncedAt: pastTime,
        updatedAt: now, // Newer than external
        source: "google-tasks",
      });

      const result = await syncService.syncUserTasks(testUserId, mockProvider);

      expect(result.success).toBe(true);
      expect(result.pulled).toBeGreaterThan(0); // Pulled externalTask2
      expect(result.pushed).toBe(1); // Pushed localTask1 changes
    });
  });

  describe("Source filtering", () => {
    it("should only sync tasks from the specific provider", async () => {
      // Create task in google-tasks provider
      await mockProvider.createTask(testUserId, {
        title: "Google Task",
        importanceLevel: "medium",
      });

      // Create local tasks from different sources
      const googleTask = createTestTask({
        id: "local-google",
        source: "google-tasks",
        externalId: "google-123",
      });
      const notionTask = createTestTask({
        id: "local-notion",
        source: "notion",
        externalId: "notion-123",
      });
      const localTask = createTestTask({
        id: "local-local",
        source: "local",
      });

      (mockRepository.getTasks as any).mockResolvedValue([
        googleTask,
        notionTask,
        localTask,
      ]);

      const result = await syncService.syncUserTasks(testUserId, mockProvider);

      expect(result.success).toBe(true);
      // Should only interact with google-tasks source tasks
      expect(result.pulled).toBeGreaterThan(0);
    });
  });

  describe("Sync metadata", () => {
    it("should update lastSyncedAt timestamp after successful sync", async () => {
      // Create task in provider
      const externalTask = await mockProvider.createTask(testUserId, {
        title: "Test Task",
        importanceLevel: "medium",
      });

      const result = await syncService.syncUserTasks(testUserId, mockProvider);

      expect(result.success).toBe(true);
      expect(mockRepository.createTask).toHaveBeenCalledWith(
        testUserId,
        expect.objectContaining({
          lastSyncedAt: expect.any(Date),
        })
      );
    });
  });
});
