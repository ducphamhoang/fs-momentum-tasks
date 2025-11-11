import { google, tasks_v1 } from "googleapis";
import type { TaskProvider } from "../../domain/repositories/task-provider";
import type { Task, CreateTaskInput } from "../../domain/task";
import {
  ProviderAuthError,
  ProviderConnectionError,
  ProviderRateLimitError,
  TaskNotFoundError,
} from "../../domain/errors/provider-errors";

/**
 * Google Tasks Provider Implementation
 *
 * Implements TaskProvider interface for Google Tasks API.
 * Handles authentication, API calls, field mapping, and error handling.
 */
export class GoogleTasksProvider implements TaskProvider {
  private accessToken: string;
  private tasksClient: tasks_v1.Tasks | null = null;
  private readonly defaultTaskListId = "@default"; // Google Tasks default list
  private retryCount = 0;
  private readonly maxRetries = 3;
  private readonly baseRetryDelay = 1000; // 1 second

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Get Google Tasks API client instance
   */
  private getTasksClient(): tasks_v1.Tasks {
    if (!this.tasksClient) {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({
        access_token: this.accessToken,
      });

      this.tasksClient = google.tasks({ version: "v1", auth });
    }

    return this.tasksClient;
  }

  getProviderName(): string {
    return "google-tasks";
  }

  /**
   * Map Google Tasks API task to domain Task entity
   */
  private mapGoogleTaskToDomain(
    googleTask: tasks_v1.Schema$Task,
    userId: string
  ): Task {
    return {
      id: googleTask.id || "",
      userId,
      title: googleTask.title || "Untitled Task",
      description: googleTask.notes || undefined,
      isCompleted: googleTask.status === "completed",
      importanceLevel: "medium", // Google Tasks doesn't have importance levels
      dueDate: googleTask.due ? new Date(googleTask.due) : undefined,
      source: "google-tasks",
      externalId: googleTask.id || undefined,
      externalEtag: googleTask.etag || undefined,
      lastSyncedAt: new Date(),
      reminders: [], // Google Tasks handles reminders separately
      createdAt: new Date(),
      updatedAt: googleTask.updated ? new Date(googleTask.updated) : new Date(),
    };
  }

  /**
   * Map domain Task to Google Tasks API format
   */
  private mapDomainTaskToGoogle(
    task: CreateTaskInput | Partial<Task>
  ): tasks_v1.Schema$Task {
    const googleTask: tasks_v1.Schema$Task = {};

    if ("title" in task && task.title) {
      googleTask.title = task.title;
    }

    if ("description" in task) {
      googleTask.notes = task.description || undefined;
    }

    if ("dueDate" in task && task.dueDate) {
      googleTask.due = new Date(task.dueDate).toISOString();
    }

    if ("isCompleted" in task) {
      googleTask.status = task.isCompleted ? "completed" : "needsAction";
    }

    return googleTask;
  }

  /**
   * Execute API call with exponential backoff retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      const result = await operation();
      this.retryCount = 0; // Reset on success
      return result;
    } catch (error: any) {
      // Handle rate limiting (429)
      if (error.code === 429 || error.status === 429) {
        if (this.retryCount < this.maxRetries) {
          const retryAfter =
            error.response?.headers["retry-after"] ||
            Math.pow(2, this.retryCount) * this.baseRetryDelay;

          this.retryCount++;

          console.warn(
            `Rate limited. Retrying ${operationName} in ${retryAfter}ms (attempt ${this.retryCount}/${this.maxRetries})`
          );

          await new Promise((resolve) => setTimeout(resolve, retryAfter));
          return this.executeWithRetry(operation, operationName);
        } else {
          throw new ProviderRateLimitError(
            `Rate limit exceeded for ${operationName}`,
            this.getProviderName(),
            error.response?.headers["retry-after"]
          );
        }
      }

      // Handle authentication errors (401, 403)
      if (error.code === 401 || error.code === 403) {
        throw new ProviderAuthError(
          `Authentication failed: ${error.message}`,
          this.getProviderName()
        );
      }

      // Handle network/connection errors
      if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        throw new ProviderConnectionError(
          `Connection failed: ${error.message}`,
          this.getProviderName(),
          error
        );
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get all tasks from Google Tasks
   */
  async getTasks(userId: string): Promise<Task[]> {
    try {
      const client = this.getTasksClient();

      const response = await this.executeWithRetry(
        () =>
          client.tasks.list({
            tasklist: this.defaultTaskListId,
            maxResults: 100, // Adjust as needed
            showCompleted: true,
            showHidden: true,
          }),
        "getTasks"
      );

      const googleTasks = response.data.items || [];

      return googleTasks.map((googleTask) =>
        this.mapGoogleTaskToDomain(googleTask, userId)
      );
    } catch (error) {
      console.error("Error fetching tasks from Google:", error);

      if (
        error instanceof ProviderAuthError ||
        error instanceof ProviderConnectionError ||
        error instanceof ProviderRateLimitError
      ) {
        throw error;
      }

      throw new ProviderConnectionError(
        `Failed to fetch tasks: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        this.getProviderName(),
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create a new task in Google Tasks
   */
  async createTask(userId: string, task: CreateTaskInput): Promise<Task> {
    try {
      const client = this.getTasksClient();
      const googleTask = this.mapDomainTaskToGoogle(task);

      const response = await this.executeWithRetry(
        () =>
          client.tasks.insert({
            tasklist: this.defaultTaskListId,
            requestBody: googleTask,
          }),
        "createTask"
      );

      if (!response.data) {
        throw new Error("No data returned from Google Tasks API");
      }

      return this.mapGoogleTaskToDomain(response.data, userId);
    } catch (error) {
      console.error("Error creating task in Google:", error);

      if (
        error instanceof ProviderAuthError ||
        error instanceof ProviderConnectionError ||
        error instanceof ProviderRateLimitError
      ) {
        throw error;
      }

      throw new ProviderConnectionError(
        `Failed to create task: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        this.getProviderName(),
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Update an existing task in Google Tasks
   */
  async updateTask(
    userId: string,
    taskId: string,
    task: Partial<Task>
  ): Promise<Task> {
    try {
      const client = this.getTasksClient();

      // Use externalId if available, otherwise use taskId
      const googleTaskId = task.externalId || taskId;
      const googleTask = this.mapDomainTaskToGoogle(task);

      const response = await this.executeWithRetry(
        () =>
          client.tasks.update({
            tasklist: this.defaultTaskListId,
            task: googleTaskId,
            requestBody: googleTask,
          }),
        "updateTask"
      );

      if (!response.data) {
        throw new Error("No data returned from Google Tasks API");
      }

      return this.mapGoogleTaskToDomain(response.data, userId);
    } catch (error: any) {
      console.error("Error updating task in Google:", error);

      // Handle not found errors
      if (error.code === 404) {
        throw new TaskNotFoundError(
          `Task not found: ${taskId}`,
          this.getProviderName(),
          taskId
        );
      }

      if (
        error instanceof ProviderAuthError ||
        error instanceof ProviderConnectionError ||
        error instanceof ProviderRateLimitError ||
        error instanceof TaskNotFoundError
      ) {
        throw error;
      }

      throw new ProviderConnectionError(
        `Failed to update task: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        this.getProviderName(),
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Delete a task from Google Tasks
   */
  async deleteTask(userId: string, taskId: string): Promise<void> {
    try {
      const client = this.getTasksClient();

      await this.executeWithRetry(
        () =>
          client.tasks.delete({
            tasklist: this.defaultTaskListId,
            task: taskId,
          }),
        "deleteTask"
      );
    } catch (error: any) {
      console.error("Error deleting task in Google:", error);

      // Silently handle not found errors (task already deleted)
      if (error.code === 404) {
        console.warn(`Task ${taskId} not found in Google Tasks (already deleted)`);
        return;
      }

      if (
        error instanceof ProviderAuthError ||
        error instanceof ProviderConnectionError ||
        error instanceof ProviderRateLimitError
      ) {
        throw error;
      }

      throw new ProviderConnectionError(
        `Failed to delete task: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        this.getProviderName(),
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Mark a task as complete in Google Tasks
   */
  async completeTask(userId: string, taskId: string): Promise<Task> {
    return this.updateTask(userId, taskId, { isCompleted: true });
  }

  /**
   * Update access token (when refreshed)
   */
  updateAccessToken(accessToken: string): void {
    this.accessToken = accessToken;
    this.tasksClient = null; // Force recreation with new token
  }
}
