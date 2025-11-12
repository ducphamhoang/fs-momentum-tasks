import type { Task, CreateTaskInput } from "../task";
import type { TaskProvider } from "./task-provider";
import {ProviderAuthError, ProviderConnectionError} from "../errors/provider-errors";

/**
 * Mock TaskProvider Implementation
 *
 * Used for testing and development. Simulates external task provider behavior
 * without making actual API calls.
 *
 * Features:
 * - In-memory task storage
 * - Simulated network delays
 * - Configurable error scenarios
 *
 * @example
 * ```typescript
 * const mockProvider = new MockTaskProvider("mock-platform");
 * mockProvider.simulateAuthError = true; // Simulate auth failure
 * await mockProvider.getTasks(userId); // Throws ProviderAuthError
 * ```
 */
export class MockTaskProvider implements TaskProvider {
  private tasks: Map<string, Task[]> = new Map();
  private providerName: string;
  private etagCounter = 0; // Counter for unique etags

  // Simulation flags
  public simulateAuthError = false;
  public simulateConnectionError = false;
  public simulateNetworkDelay = 0; // milliseconds

  constructor(providerName = "mock-provider") {
    this.providerName = providerName;
  }

  getProviderName(): string {
    return this.providerName;
  }

  async getTasks(userId: string): Promise<Task[]> {
    await this.simulateDelay();
    this.checkSimulatedErrors();

    const userTasks = this.tasks.get(userId) || [];
    return [...userTasks]; // Return copy
  }

  async createTask(userId: string, task: CreateTaskInput): Promise<Task> {
    await this.simulateDelay();
    this.checkSimulatedErrors();

    const newTask: Task = {
      ...task,
      id: this.generateId(),
      userId,
      isCompleted: false,
      source: this.providerName as any,
      externalId: this.generateExternalId(),
      externalEtag: this.generateEtag(),
      lastSyncedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userTasks = this.tasks.get(userId) || [];
    userTasks.push(newTask);
    this.tasks.set(userId, userTasks);

    return newTask;
  }

  async updateTask(
    userId: string,
    taskId: string,
    updates: Partial<Task>
  ): Promise<Task> {
    await this.simulateDelay();
    this.checkSimulatedErrors();

    const userTasks = this.tasks.get(userId) || [];
    const taskIndex = userTasks.findIndex(
      (t) => t.id === taskId || t.externalId === taskId
    );

    if (taskIndex === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const updatedTask: Task = {
      ...userTasks[taskIndex],
      ...updates,
      externalEtag: this.generateEtag(),
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    };

    userTasks[taskIndex] = updatedTask;
    this.tasks.set(userId, userTasks);

    return updatedTask;
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    await this.simulateDelay();
    this.checkSimulatedErrors();

    const userTasks = this.tasks.get(userId) || [];
    const filteredTasks = userTasks.filter(
      (t) => t.id !== taskId && t.externalId !== taskId
    );

    this.tasks.set(userId, filteredTasks);
  }

  async completeTask(userId: string, taskId: string): Promise<Task> {
    return this.updateTask(userId, taskId, {isCompleted: true});
  }

  // Helper methods
  private async simulateDelay(): Promise<void> {
    if (this.simulateNetworkDelay > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.simulateNetworkDelay)
      );
    }
  }

  private checkSimulatedErrors(): void {
    if (this.simulateAuthError) {
      throw new ProviderAuthError(
        "Simulated authentication error",
        this.providerName
      );
    }

    if (this.simulateConnectionError) {
      throw new ProviderConnectionError(
        "Simulated connection error",
        this.providerName
      );
    }
  }

  private generateId(): string {
    return `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExternalId(): string {
    return `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEtag(): string {
    return `etag-${this.etagCounter++}-${Date.now()}`;
  }

  // Testing utilities
  public reset(): void {
    this.tasks.clear();
    this.simulateAuthError = false;
    this.simulateConnectionError = false;
    this.simulateNetworkDelay = 0;
  }

  public seedTasks(userId: string, tasks: Task[]): void {
    this.tasks.set(userId, [...tasks]);
  }

  public getStoredTasks(userId: string): Task[] {
    return this.tasks.get(userId) || [];
  }
}
