import { describe, it, expect, beforeEach, vi } from "vitest";
import { TokenStorageService } from "../token-storage-service";
import type { UserToken } from "../../../domain/entities/user-token";

/**
 * Token Storage Service Tests
 *
 * Tests for secure OAuth token storage using Firebase Admin SDK.
 */
describe("TokenStorageService", () => {
  let service: TokenStorageService;
  let mockFirestore: any;

  const mockUserToken: UserToken = {
    userId: "test-user-123",
    provider: "google-tasks",
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
    scopes: ["https://www.googleapis.com/auth/tasks"],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Create mock Firestore instance
    mockFirestore = {
      collection: vi.fn().mockReturnThis(),
      doc: vi.fn().mockReturnThis(),
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      where: vi.fn().mockReturnThis(),
    };

    service = new TokenStorageService(mockFirestore as any);
  });

  describe("storeToken", () => {
    it("should store token in Firestore", async () => {
      mockFirestore.set.mockResolvedValue(undefined);

      const result = await service.storeToken(mockUserToken);

      expect(mockFirestore.collection).toHaveBeenCalledWith("user_tokens");
      expect(mockFirestore.doc).toHaveBeenCalledWith(
        "test-user-123_google-tasks"
      );
      expect(mockFirestore.set).toHaveBeenCalled();
      expect(result.userId).toBe(mockUserToken.userId);
      expect(result.provider).toBe(mockUserToken.provider);
    });

    it("should throw error if storage fails", async () => {
      mockFirestore.set.mockRejectedValue(new Error("Storage failed"));

      await expect(service.storeToken(mockUserToken)).rejects.toThrow(
        "Failed to store token"
      );
    });
  });

  describe("getToken", () => {
    it("should retrieve token from Firestore", async () => {
      const mockDoc = {
        exists: true,
        data: () => ({
          userId: mockUserToken.userId,
          provider: mockUserToken.provider,
          accessToken: mockUserToken.accessToken,
          refreshToken: mockUserToken.refreshToken,
          expiresAt: { toDate: () => mockUserToken.expiresAt },
          scopes: mockUserToken.scopes,
          createdAt: { toDate: () => mockUserToken.createdAt },
          updatedAt: { toDate: () => mockUserToken.updatedAt },
        }),
      };

      mockFirestore.get.mockResolvedValue(mockDoc);

      const result = await service.getToken(
        mockUserToken.userId,
        mockUserToken.provider
      );

      expect(result).toBeTruthy();
      expect(result?.userId).toBe(mockUserToken.userId);
      expect(result?.accessToken).toBe(mockUserToken.accessToken);
    });

    it("should return null if token does not exist", async () => {
      mockFirestore.get.mockResolvedValue({ exists: false });

      const result = await service.getToken("non-existent", "google-tasks");

      expect(result).toBeNull();
    });

    it("should throw error if retrieval fails", async () => {
      mockFirestore.get.mockRejectedValue(new Error("Retrieval failed"));

      await expect(
        service.getToken("test-user", "google-tasks")
      ).rejects.toThrow("Failed to get token");
    });
  });

  describe("updateToken", () => {
    it("should update token in Firestore", async () => {
      const mockExistingDoc = {
        exists: true,
        data: () => ({
          userId: mockUserToken.userId,
          provider: mockUserToken.provider,
          accessToken: "old-access-token",
          refreshToken: mockUserToken.refreshToken,
          expiresAt: { toDate: () => mockUserToken.expiresAt },
          scopes: mockUserToken.scopes,
          createdAt: { toDate: () => mockUserToken.createdAt },
          updatedAt: { toDate: () => mockUserToken.updatedAt },
        }),
      };

      const mockUpdatedDoc = {
        data: () => ({
          ...mockExistingDoc.data(),
          accessToken: "new-access-token",
        }),
      };

      mockFirestore.get
        .mockResolvedValueOnce(mockExistingDoc)
        .mockResolvedValueOnce(mockUpdatedDoc);
      mockFirestore.update.mockResolvedValue(undefined);

      const result = await service.updateToken(
        mockUserToken.userId,
        mockUserToken.provider,
        { accessToken: "new-access-token" }
      );

      expect(mockFirestore.update).toHaveBeenCalled();
      expect(result.accessToken).toBe("new-access-token");
    });

    it("should throw error if token not found", async () => {
      mockFirestore.get.mockResolvedValue({ exists: false });

      await expect(
        service.updateToken("test-user", "google-tasks", {
          accessToken: "new-token",
        })
      ).rejects.toThrow("Token not found");
    });
  });

  describe("deleteToken", () => {
    it("should delete token from Firestore", async () => {
      mockFirestore.delete.mockResolvedValue(undefined);

      await service.deleteToken(mockUserToken.userId, mockUserToken.provider);

      expect(mockFirestore.collection).toHaveBeenCalledWith("user_tokens");
      expect(mockFirestore.doc).toHaveBeenCalledWith(
        "test-user-123_google-tasks"
      );
      expect(mockFirestore.delete).toHaveBeenCalled();
    });

    it("should throw error if deletion fails", async () => {
      mockFirestore.delete.mockRejectedValue(new Error("Deletion failed"));

      await expect(
        service.deleteToken("test-user", "google-tasks")
      ).rejects.toThrow("Failed to delete token");
    });
  });

  describe("hasValidToken", () => {
    it("should return true for valid non-expired token", async () => {
      const futureExpiry = new Date(Date.now() + 3600 * 1000);

      const mockDoc = {
        exists: true,
        data: () => ({
          userId: mockUserToken.userId,
          provider: mockUserToken.provider,
          accessToken: mockUserToken.accessToken,
          refreshToken: mockUserToken.refreshToken,
          expiresAt: { toDate: () => futureExpiry },
          scopes: mockUserToken.scopes,
          createdAt: { toDate: () => mockUserToken.createdAt },
          updatedAt: { toDate: () => mockUserToken.updatedAt },
        }),
      };

      mockFirestore.get.mockResolvedValue(mockDoc);

      const result = await service.hasValidToken(
        mockUserToken.userId,
        mockUserToken.provider
      );

      expect(result).toBe(true);
    });

    it("should return false for expired token", async () => {
      const pastExpiry = new Date(Date.now() - 3600 * 1000);

      const mockDoc = {
        exists: true,
        data: () => ({
          userId: mockUserToken.userId,
          provider: mockUserToken.provider,
          accessToken: mockUserToken.accessToken,
          refreshToken: mockUserToken.refreshToken,
          expiresAt: { toDate: () => pastExpiry },
          scopes: mockUserToken.scopes,
          createdAt: { toDate: () => mockUserToken.createdAt },
          updatedAt: { toDate: () => mockUserToken.updatedAt },
        }),
      };

      mockFirestore.get.mockResolvedValue(mockDoc);

      const result = await service.hasValidToken(
        mockUserToken.userId,
        mockUserToken.provider
      );

      expect(result).toBe(false);
    });

    it("should return false if token does not exist", async () => {
      mockFirestore.get.mockResolvedValue({ exists: false });

      const result = await service.hasValidToken("test-user", "google-tasks");

      expect(result).toBe(false);
    });
  });

  describe("Token document ID generation", () => {
    it("should generate correct document ID", async () => {
      mockFirestore.set.mockResolvedValue(undefined);

      await service.storeToken(mockUserToken);

      expect(mockFirestore.doc).toHaveBeenCalledWith(
        "test-user-123_google-tasks"
      );
    });
  });
});
