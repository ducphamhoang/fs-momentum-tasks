import type { TaskProvider } from "../../domain/repositories/task-provider";

/**
 * Task Provider Registry
 *
 * Manages all available task providers (LocalProvider, GoogleTasksProvider, etc.)
 * and provides a way to get the appropriate provider based on task source.
 *
 * This implements the Registry pattern for managing multiple provider implementations.
 */

export class ProviderNotFoundError extends Error {
  constructor(source: string) {
    super(`Provider not found for source: ${source}`);
    this.name = "ProviderNotFoundError";
  }
}

export interface TaskProviderRegistry {
  /**
   * Register a task provider
   * @param source - The source identifier (e.g., "google-tasks", "notion")
   * @param provider - The provider implementation
   */
  registerProvider(source: string, provider: TaskProvider): void;

  /**
   * Get a provider by source
   * @param source - The source identifier
   * @returns The provider for the given source
   * @throws ProviderNotFoundError if provider is not registered
   */
  getProvider(source: string): TaskProvider;

  /**
   * Check if a provider is registered
   * @param source - The source identifier
   * @returns True if provider is registered
   */
  hasProvider(source: string): boolean;

  /**
   * Get all registered provider sources
   * @returns Array of source identifiers
   */
  getRegisteredSources(): string[];

  /**
   * Unregister a provider
   * @param source - The source identifier
   */
  unregisterProvider(source: string): void;
}

/**
 * Implementation of TaskProviderRegistry
 */
export class TaskProviderRegistryImpl implements TaskProviderRegistry {
  private providers: Map<string, TaskProvider> = new Map();

  constructor() {
    console.log("[TaskProviderRegistry] Initialized");
  }

  registerProvider(source: string, provider: TaskProvider): void {
    if (this.providers.has(source)) {
      console.warn(
        `[TaskProviderRegistry] Overwriting existing provider for source: ${source}`
      );
    }

    this.providers.set(source, provider);
    console.log(
      `[TaskProviderRegistry] Registered provider for source: ${source} (${provider.getProviderName()})`
    );
  }

  getProvider(source: string): TaskProvider {
    const provider = this.providers.get(source);

    if (!provider) {
      console.error(
        `[TaskProviderRegistry] Provider not found for source: ${source}`
      );
      throw new ProviderNotFoundError(source);
    }

    return provider;
  }

  hasProvider(source: string): boolean {
    return this.providers.has(source);
  }

  getRegisteredSources(): string[] {
    return Array.from(this.providers.keys());
  }

  unregisterProvider(source: string): void {
    const removed = this.providers.delete(source);
    if (removed) {
      console.log(
        `[TaskProviderRegistry] Unregistered provider for source: ${source}`
      );
    } else {
      console.warn(
        `[TaskProviderRegistry] Attempted to unregister non-existent provider: ${source}`
      );
    }
  }

  /**
   * Get all registered providers
   * Useful for batch operations like syncing all providers
   */
  getAllProviders(): Map<string, TaskProvider> {
    return new Map(this.providers);
  }
}
