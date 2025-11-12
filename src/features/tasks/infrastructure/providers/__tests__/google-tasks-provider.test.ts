import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import { GoogleTasksProvider } from "../google-tasks-provider";
import type { CreateTaskInput } from "../../../domain/task";
import {
  ProviderAuthError,
  ProviderConnectionError,
  ProviderRateLimitError,
  TaskNotFoundError,
} from "../../../domain/errors/provider-errors";

// Create mock functions
const mockSetCredentials = vi.fn();
const mockTasksList = vi.fn();
const mockTasksInsert = vi.fn();
const mockTasksUpdate = vi.fn();
const mockTasksDelete = vi.fn();

const mockTasksClient = {
  tasks: {
    list: mockTasksList,
    insert: mockTasksInsert,
    update: mockTasksUpdate,
    delete: mockTasksDelete,
  },
};

// Mock googleapis module
vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: class {
        setCredentials = mockSetCredentials;
      },
    },
    tasks: vi.fn(() => mockTasksClient),
  },
}));

/**
 * Google Tasks Provider Tests
 *
 * Tests GoogleTasksProvider implementation with mocked API calls.
 * No real API keys required.
 */
describe("GoogleTasksProvider", () => {
  let provider: GoogleTasksProvider;
  const mockAccessToken = "mock-access-token";
  const testUserId = "test-user-123";

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockSetCredentials.mockClear();
    mockTasksList.mockClear();
    mockTasksInsert.mockClear();
    mockTasksUpdate.mockClear();
    mockTasksDelete.mockClear();

    provider = new GoogleTasksProvider(mockAccessToken);
  });

  describe("getProviderName", () => {
    it("should return google-tasks", () => {
      expect(provider.getProviderName()).toBe("google-tasks");
    });
  });

  describe("getTasks", () => {
    it("should fetch and map tasks from Google Tasks API", async () => {
      const mockGoogleTasks = [
        {
          id: "task-1",
          title: "Test Task 1",
          notes: "Description 1",
          status: "needsAction",
          due: "2025-12-31T00:00:00.000Z",
          etag: "etag-1",
          updated: "2025-11-11T00:00:00.000Z",
        },
        {
          id: "task-2",
          title: "Test Task 2",
          status: "completed",
          etag: "etag-2",
          updated: "2025-11-11T00:00:00.000Z",
        },
      ];

      mockTasksClient.tasks.list.mockResolvedValue({
        data: { items: mockGoogleTasks },
      });

      const tasks = await provider.getTasks(testUserId);

      expect(tasks).toHaveLength(2);
      expect(tasks[0]).toMatchObject({
        id: "task-1",
        userId: testUserId,
        title: "Test Task 1",
        description: "Description 1",
        isCompleted: false,
        source: "google-tasks",
        externalId: "task-1",
        externalEtag: "etag-1",
      });
      expect(tasks[1]).toMatchObject({
        id: "task-2",
        isCompleted: true,
        source: "google-tasks",
      });
    });

    it("should return empty array when no tasks exist", async () => {
      mockTasksClient.tasks.list.mockResolvedValue({
        data: { items: [] },
      });

      const tasks = await provider.getTasks(testUserId);

      expect(tasks).toEqual([]);
    });

    it("should throw ProviderAuthError on 401 error", async () => {
      mockTasksClient.tasks.list.mockRejectedValue({
        code: 401,
        message: "Unauthorized",
      });

      await expect(provider.getTasks(testUserId)).rejects.toThrow(
        ProviderAuthError
      );
    });

    it("should throw ProviderConnectionError on network error", async () => {
      mockTasksClient.tasks.list.mockRejectedValue({
        code: "ECONNREFUSED",
        message: "Connection refused",
      });

      await expect(provider.getTasks(testUserId)).rejects.toThrow(
        ProviderConnectionError
      );
    });
  });

  describe("createTask", () => {
    it("should create task in Google Tasks API", async () => {
      const taskInput: CreateTaskInput = {
        title: "New Task",
        description: "Task description",
        importanceLevel: "high",
        dueDate: new Date("2025-12-31"),
      };

      const mockCreatedTask = {
        id: "new-task-id",
        title: "New Task",
        notes: "Task description",
        status: "needsAction",
        due: "2025-12-31T00:00:00.000Z",
        etag: "etag-new",
        updated: "2025-11-11T00:00:00.000Z",
      };

      mockTasksClient.tasks.insert.mockResolvedValue({
        data: mockCreatedTask,
      });

      const createdTask = await provider.createTask(testUserId, taskInput);

      expect(mockTasksClient.tasks.insert).toHaveBeenCalledWith({
        tasklist: "@default",
        requestBody: {
          title: "New Task",
          notes: "Task description",
          due: expect.any(String),
        },
      });

      expect(createdTask).toMatchObject({
        id: "new-task-id",
        userId: testUserId,
        title: "New Task",
        description: "Task description",
        source: "google-tasks",
        externalId: "new-task-id",
      });
    });

    it("should throw ProviderAuthError on 403 error", async () => {
      mockTasksClient.tasks.insert.mockRejectedValue({
        code: 403,
        message: "Forbidden",
      });

      const taskInput: CreateTaskInput = {
        title: "New Task",
        importanceLevel: "medium",
      };

      await expect(provider.createTask(testUserId, taskInput)).rejects.toThrow(
        ProviderAuthError
      );
    });
  });

  describe("updateTask", () => {
    it("should update task in Google Tasks API", async () => {
      const updates = {
        title: "Updated Title",
        description: "Updated description",
        externalId: "task-123",
      };

      const mockUpdatedTask = {
        id: "task-123",
        title: "Updated Title",
        notes: "Updated description",
        status: "needsAction",
        etag: "etag-updated",
        updated: "2025-11-11T00:00:00.000Z",
      };

      mockTasksClient.tasks.update.mockResolvedValue({
        data: mockUpdatedTask,
      });

      const updatedTask = await provider.updateTask(
        testUserId,
        "task-123",
        updates
      );

      expect(mockTasksClient.tasks.update).toHaveBeenCalledWith({
        tasklist: "@default",
        task: "task-123",
        requestBody: {
          title: "Updated Title",
          notes: "Updated description",
        },
      });

      expect(updatedTask.title).toBe("Updated Title");
      expect(updatedTask.description).toBe("Updated description");
    });

    it("should throw TaskNotFoundError on 404 error", async () => {
      mockTasksClient.tasks.update.mockRejectedValue({
        code: 404,
        message: "Not found",
      });

      await expect(
        provider.updateTask(testUserId, "non-existent", { title: "Updated" })
      ).rejects.toThrow(TaskNotFoundError);
    });
  });

  describe("deleteTask", () => {
    it("should delete task from Google Tasks API", async () => {
      mockTasksClient.tasks.delete.mockResolvedValue({});

      await provider.deleteTask(testUserId, "task-123");

      expect(mockTasksClient.tasks.delete).toHaveBeenCalledWith({
        tasklist: "@default",
        task: "task-123",
      });
    });

    it("should not throw error when task not found (already deleted)", async () => {
      mockTasksClient.tasks.delete.mockRejectedValue({
        code: 404,
        message: "Not found",
      });

      await expect(
        provider.deleteTask(testUserId, "non-existent")
      ).resolves.not.toThrow();
    });
  });

  describe("completeTask", () => {
    it("should mark task as completed", async () => {
      const mockCompletedTask = {
        id: "task-123",
        title: "Test Task",
        status: "completed",
        etag: "etag-completed",
        updated: "2025-11-11T00:00:00.000Z",
      };

      mockTasksClient.tasks.update.mockResolvedValue({
        data: mockCompletedTask,
      });

      const completedTask = await provider.completeTask(testUserId, "task-123");

      expect(mockTasksClient.tasks.update).toHaveBeenCalledWith({
        tasklist: "@default",
        task: "task-123",
        requestBody: {
          status: "completed",
        },
      });

      expect(completedTask.isCompleted).toBe(true);
    });
  });

  describe("Rate limiting and retry logic", () => {
    it("should retry on 429 rate limit error", async () => {
      // First call fails with 429, second succeeds
      mockTasksClient.tasks.list
        .mockRejectedValueOnce({
          code: 429,
          status: 429,
          message: "Rate limit exceeded",
        })
        .mockResolvedValueOnce({
          data: { items: [] },
        });

      const tasks = await provider.getTasks(testUserId);

      expect(mockTasksClient.tasks.list).toHaveBeenCalledTimes(2);
      expect(tasks).toEqual([]);
    });

    it("should throw ProviderRateLimitError after max retries", async () => {
      // Fail all attempts
      mockTasksClient.tasks.list.mockRejectedValue({
        code: 429,
        status: 429,
        message: "Rate limit exceeded",
      });

      await expect(provider.getTasks(testUserId)).rejects.toThrow(
        ProviderRateLimitError
      );

      // Should have tried 4 times (1 initial + 3 retries)
      expect(mockTasksClient.tasks.list).toHaveBeenCalledTimes(4);
    }, 10000); // 10 second timeout for retry logic
  });

  describe("Field mapping", () => {
    it("should handle tasks with missing optional fields", async () => {
      const mockMinimalTask = {
        id: "task-minimal",
        title: "Minimal Task",
        status: "needsAction",
      };

      mockTasksClient.tasks.list.mockResolvedValue({
        data: { items: [mockMinimalTask] },
      });

      const tasks = await provider.getTasks(testUserId);

      expect(tasks[0]).toMatchObject({
        id: "task-minimal",
        title: "Minimal Task",
        isCompleted: false,
        description: undefined,
      });
    });

    it("should handle tasks without title", async () => {
      const mockNoTitle = {
        id: "task-no-title",
        status: "needsAction",
      };

      mockTasksClient.tasks.list.mockResolvedValue({
        data: { items: [mockNoTitle] },
      });

      const tasks = await provider.getTasks(testUserId);

      expect(tasks[0].title).toBe("Untitled Task");
    });
  });

  describe("updateAccessToken", () => {
    it("should update access token and reset client", async () => {
      const newToken = "new-access-token";

      provider.updateAccessToken(newToken);

      // Verify client is recreated with new token by making a call
      mockTasksClient.tasks.list.mockResolvedValue({
        data: { items: [] },
      });

      await provider.getTasks(testUserId);

      expect(mockTasksClient.tasks.list).toHaveBeenCalled();
    });
  });
});
