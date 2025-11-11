import { describe, it, expect, beforeEach } from "vitest";
import {
  TaskProviderRegistryImpl,
  ProviderNotFoundError,
} from "../task-provider-registry";
import { MockTaskProvider } from "../../../domain/repositories/mock-task-provider";

/**
 * Task Provider Registry Tests
 *
 * Tests the registry pattern for managing multiple task providers
 */
describe("TaskProviderRegistry", () => {
  let registry: TaskProviderRegistryImpl;
  let googleProvider: MockTaskProvider;
  let notionProvider: MockTaskProvider;

  beforeEach(() => {
    registry = new TaskProviderRegistryImpl();
    googleProvider = new MockTaskProvider("google-tasks");
    notionProvider = new MockTaskProvider("notion");
  });

  describe("registerProvider", () => {
    it("should register a provider", () => {
      registry.registerProvider("google-tasks", googleProvider);

      expect(registry.hasProvider("google-tasks")).toBe(true);
    });

    it("should allow registering multiple providers", () => {
      registry.registerProvider("google-tasks", googleProvider);
      registry.registerProvider("notion", notionProvider);

      expect(registry.hasProvider("google-tasks")).toBe(true);
      expect(registry.hasProvider("notion")).toBe(true);
    });

    it("should overwrite existing provider with same source", () => {
      const newGoogleProvider = new MockTaskProvider("google-tasks-v2");

      registry.registerProvider("google-tasks", googleProvider);
      registry.registerProvider("google-tasks", newGoogleProvider);

      const provider = registry.getProvider("google-tasks");
      expect(provider.getProviderName()).toBe("google-tasks-v2");
    });
  });

  describe("getProvider", () => {
    it("should return registered provider", () => {
      registry.registerProvider("google-tasks", googleProvider);

      const provider = registry.getProvider("google-tasks");

      expect(provider).toBe(googleProvider);
      expect(provider.getProviderName()).toBe("google-tasks");
    });

    it("should throw ProviderNotFoundError if provider not registered", () => {
      expect(() => registry.getProvider("non-existent")).toThrow(
        ProviderNotFoundError
      );
      expect(() => registry.getProvider("non-existent")).toThrow(
        "Provider not found for source: non-existent"
      );
    });
  });

  describe("hasProvider", () => {
    it("should return true for registered provider", () => {
      registry.registerProvider("google-tasks", googleProvider);

      expect(registry.hasProvider("google-tasks")).toBe(true);
    });

    it("should return false for unregistered provider", () => {
      expect(registry.hasProvider("google-tasks")).toBe(false);
    });
  });

  describe("getRegisteredSources", () => {
    it("should return empty array when no providers registered", () => {
      const sources = registry.getRegisteredSources();

      expect(sources).toEqual([]);
    });

    it("should return all registered source identifiers", () => {
      registry.registerProvider("google-tasks", googleProvider);
      registry.registerProvider("notion", notionProvider);

      const sources = registry.getRegisteredSources();

      expect(sources).toHaveLength(2);
      expect(sources).toContain("google-tasks");
      expect(sources).toContain("notion");
    });
  });

  describe("unregisterProvider", () => {
    it("should remove registered provider", () => {
      registry.registerProvider("google-tasks", googleProvider);
      expect(registry.hasProvider("google-tasks")).toBe(true);

      registry.unregisterProvider("google-tasks");

      expect(registry.hasProvider("google-tasks")).toBe(false);
    });

    it("should not throw error when unregistering non-existent provider", () => {
      expect(() => registry.unregisterProvider("non-existent")).not.toThrow();
    });
  });

  describe("getAllProviders", () => {
    it("should return empty map when no providers registered", () => {
      const providers = registry.getAllProviders();

      expect(providers.size).toBe(0);
    });

    it("should return all registered providers", () => {
      registry.registerProvider("google-tasks", googleProvider);
      registry.registerProvider("notion", notionProvider);

      const providers = registry.getAllProviders();

      expect(providers.size).toBe(2);
      expect(providers.get("google-tasks")).toBe(googleProvider);
      expect(providers.get("notion")).toBe(notionProvider);
    });

    it("should return a copy of the providers map", () => {
      registry.registerProvider("google-tasks", googleProvider);

      const providers = registry.getAllProviders();
      providers.clear(); // Modify the copy

      // Original registry should be unaffected
      expect(registry.hasProvider("google-tasks")).toBe(true);
    });
  });

  describe("integration scenarios", () => {
    it("should support typical provider lifecycle", () => {
      // Register providers
      registry.registerProvider("google-tasks", googleProvider);
      registry.registerProvider("notion", notionProvider);

      // Get and use provider
      const provider = registry.getProvider("google-tasks");
      expect(provider.getProviderName()).toBe("google-tasks");

      // Check available sources
      const sources = registry.getRegisteredSources();
      expect(sources).toHaveLength(2);

      // Unregister one provider
      registry.unregisterProvider("notion");
      expect(registry.hasProvider("notion")).toBe(false);
      expect(registry.hasProvider("google-tasks")).toBe(true);
    });

    it("should handle replacing provider implementation", () => {
      // Register initial provider
      registry.registerProvider("google-tasks", googleProvider);

      const firstProvider = registry.getProvider("google-tasks");
      expect(firstProvider.getProviderName()).toBe("google-tasks");

      // Replace with upgraded version
      const upgradedProvider = new MockTaskProvider("google-tasks-upgraded");
      registry.registerProvider("google-tasks", upgradedProvider);

      const secondProvider = registry.getProvider("google-tasks");
      expect(secondProvider.getProviderName()).toBe("google-tasks-upgraded");
      expect(secondProvider).not.toBe(firstProvider);
    });
  });
});
