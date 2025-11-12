import type { Task, CreateTaskInput } from "../task";

/**
 * TaskProvider Interface
 *
 * Abstract interface for task management platform providers.
 * This follows the Adapter/Strategy pattern to support multiple external platforms
 * (Google Tasks, Notion, Asana, etc.) with a unified interface.
 *
 * Each platform-specific implementation (e.g., GoogleTasksProvider) implements this interface.
 *
 * @example
 * ```typescript
 * const provider = new GoogleTasksProvider(accessToken);
 * const tasks = await provider.getTasks(userId);
 * ```
 */
export interface TaskProvider {
  /**
   * Get the name of this provider
   * @returns Provider name (e.g., "google-tasks", "notion", "asana")
   */
  getProviderName(): string;

  /**
   * Fetch all tasks for a user from the external platform
   * @param userId - The user's ID
   * @returns Promise resolving to an array of tasks
   * @throws ProviderAuthError if authentication fails
   * @throws ProviderConnectionError if network request fails
   * @throws ProviderRateLimitError if rate limit is exceeded
   */
  getTasks(userId: string): Promise<Task[]>;

  /**
   * Create a new task on the external platform
   * @param userId - The user's ID
   * @param task - The task data to create
   * @returns Promise resolving to the created task with external ID and etag
   * @throws ProviderAuthError if authentication fails
   * @throws ProviderConnectionError if network request fails
   */
  createTask(userId: string, task: CreateTaskInput): Promise<Task>;

  /**
   * Update an existing task on the external platform
   * @param userId - The user's ID
   * @param taskId - The task's ID (local or external ID)
   * @param task - Partial task data to update
   * @returns Promise resolving to the updated task with new etag
   * @throws ProviderAuthError if authentication fails
   * @throws ProviderConnectionError if network request fails
   * @throws ConflictError if etag mismatch (concurrent modification)
   */
  updateTask(userId: string, taskId: string, task: Partial<Task>): Promise<Task>;

  /**
   * Delete a task from the external platform
   * @param userId - The user's ID
   * @param taskId - The task's ID (local or external ID)
   * @returns Promise resolving when deletion is complete
   * @throws ProviderAuthError if authentication fails
   * @throws ProviderConnectionError if network request fails
   */
  deleteTask(userId: string, taskId: string): Promise<void>;

  /**
   * Mark a task as complete on the external platform
   * @param userId - The user's ID
   * @param taskId - The task's ID (local or external ID)
   * @returns Promise resolving to the updated task
   * @throws ProviderAuthError if authentication fails
   * @throws ProviderConnectionError if network request fails
   */
  completeTask(userId: string, taskId: string): Promise<Task>;
}

/**
 * Local TaskProvider
 *
 * Provider for tasks created within the app (source: 'local').
 * This provider interacts directly with Firestore and doesn't sync with external platforms.
 */
export interface LocalTaskProvider extends TaskProvider {
  // Local provider has no additional methods
  // It simply implements TaskProvider using the existing TaskRepository
}
