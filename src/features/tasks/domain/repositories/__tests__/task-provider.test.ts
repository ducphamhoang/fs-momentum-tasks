import {describe, it, expect, beforeEach} from "vitest";
import {MockTaskProvider} from "../mock-task-provider";
import type {TaskProvider} from "../task-provider";
import type {CreateTaskInput} from "../../task";
import {ProviderAuthError, ProviderConnectionError} from "../../errors/provider-errors";

/**
 * TaskProvider Contract Tests
 *
 * These tests verify that TaskProvider implementations adhere to the interface contract.
 * Any new TaskProvider implementation (Google Tasks, Notion, etc.) should pass these tests.
 */
describe("TaskProvider Interface Contract", () => {
  let provider: TaskProvider;
  const testUserId = "test-user-123";

  beforeEach(() => {
    provider = new MockTaskProvider("test-provider");
  });

  describe("getProviderName", () => {
    it("should return provider name", () => {
      const name = provider.getProviderName();
      expect(name).toBe("test-provider");
    });
  });

  describe("getTasks", () => {
    it("should return empty array when user has no tasks", async () => {
      const tasks = await provider.getTasks(testUserId);
      expect(tasks).toEqual([]);
    });

    it("should return all tasks for a user", async () => {
      // Create some tasks first
      const task1 = await provider.createTask(testUserId, {
        title: "Task 1",
        description: "Description 1",
        importanceLevel: "medium",
      });

      const task2 = await provider.createTask(testUserId, {
        title: "Task 2",
        description: "Description 2",
        importanceLevel: "high",
      });

      const tasks = await provider.getTasks(testUserId);

      expect(tasks).toHaveLength(2);
      expect(tasks.some((t) => t.id === task1.id)).toBe(true);
      expect(tasks.some((t) => t.id === task2.id)).toBe(true);
    });

    it("should throw ProviderAuthError when authentication fails", async () => {
      (provider as MockTaskProvider).simulateAuthError = true;

      await expect(provider.getTasks(testUserId)).rejects.toThrow(
        ProviderAuthError
      );
    });

    it("should throw ProviderConnectionError when network fails", async () => {
      (provider as MockTaskProvider).simulateConnectionError = true;

      await expect(provider.getTasks(testUserId)).rejects.toThrow(
        ProviderConnectionError
      );
    });
  });

  describe("createTask", () => {
    it("should create a task and return it with external ID", async () => {
      const input: CreateTaskInput = {
        title: "New Task",
        description: "Task description",
        importanceLevel: "high",
        dueDate: new Date("2025-12-31"),
      };

      const createdTask = await provider.createTask(testUserId, input);

      expect(createdTask).toMatchObject({
        title: input.title,
        description: input.description,
        importanceLevel: input.importanceLevel,
        userId: testUserId,
        isCompleted: false,
      });

      expect(createdTask.id).toBeDefined();
      expect(createdTask.externalId).toBeDefined();
      expect(createdTask.externalEtag).toBeDefined();
      expect(createdTask.source).toBe("test-provider");
    });

    it("should make created task retrievable via getTasks", async () => {
      const input: CreateTaskInput = {
        title: "Retrievable Task",
        importanceLevel: "low",
      };

      const createdTask = await provider.createTask(testUserId, input);
      const allTasks = await provider.getTasks(testUserId);

      expect(allTasks.some((t) => t.id === createdTask.id)).toBe(true);
    });

    it("should throw ProviderAuthError when authentication fails", async () => {
      (provider as MockTaskProvider).simulateAuthError = true;

      const input: CreateTaskInput = {
        title: "Task",
        importanceLevel: "medium",
      };

      await expect(provider.createTask(testUserId, input)).rejects.toThrow(
        ProviderAuthError
      );
    });
  });

  describe("updateTask", () => {
    it("should update task and return updated version with new etag", async () => {
      const createdTask = await provider.createTask(testUserId, {
        title: "Original Title",
        importanceLevel: "low",
      });

      const originalEtag = createdTask.externalEtag;

      const updatedTask = await provider.updateTask(
        testUserId,
        createdTask.id,
        {
          title: "Updated Title",
          description: "New description",
        }
      );

      expect(updatedTask.id).toBe(createdTask.id);
      expect(updatedTask.title).toBe("Updated Title");
      expect(updatedTask.description).toBe("New description");
      expect(updatedTask.externalEtag).not.toBe(originalEtag);
    });

    it("should throw error when task not found", async () => {
      await expect(
        provider.updateTask(testUserId, "non-existent-id", {
          title: "Updated",
        })
      ).rejects.toThrow();
    });
  });

  describe("deleteTask", () => {
    it("should delete task and make it no longer retrievable", async () => {
      const createdTask = await provider.createTask(testUserId, {
        title: "Task to Delete",
        importanceLevel: "medium",
      });

      await provider.deleteTask(testUserId, createdTask.id);

      const allTasks = await provider.getTasks(testUserId);
      expect(allTasks.some((t) => t.id === createdTask.id)).toBe(false);
    });

    it("should not throw error when deleting non-existent task", async () => {
      await expect(
        provider.deleteTask(testUserId, "non-existent-id")
      ).resolves.not.toThrow();
    });
  });

  describe("completeTask", () => {
    it("should mark task as completed", async () => {
      const createdTask = await provider.createTask(testUserId, {
        title: "Task to Complete",
        importanceLevel: "high",
      });

      expect(createdTask.isCompleted).toBe(false);

      const completedTask = await provider.completeTask(
        testUserId,
        createdTask.id
      );

      expect(completedTask.isCompleted).toBe(true);
      expect(completedTask.id).toBe(createdTask.id);
    });

    it("should throw error when task not found", async () => {
      await expect(
        provider.completeTask(testUserId, "non-existent-id")
      ).rejects.toThrow();
    });
  });

  describe("Cross-user isolation", () => {
    it("should not return tasks from other users", async () => {
      const user1 = "user-1";
      const user2 = "user-2";

      await provider.createTask(user1, {
        title: "User 1 Task",
        importanceLevel: "low",
      });

      await provider.createTask(user2, {
        title: "User 2 Task",
        importanceLevel: "medium",
      });

      const user1Tasks = await provider.getTasks(user1);
      const user2Tasks = await provider.getTasks(user2);

      expect(user1Tasks).toHaveLength(1);
      expect(user2Tasks).toHaveLength(1);
      expect(user1Tasks[0].title).toBe("User 1 Task");
      expect(user2Tasks[0].title).toBe("User 2 Task");
    });
  });
});
