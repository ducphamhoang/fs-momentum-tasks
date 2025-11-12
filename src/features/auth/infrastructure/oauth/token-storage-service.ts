import * as admin from "firebase-admin";
import type { OAuthTokenRepository } from "../../domain/repositories/oauth-repository";
import type { UserToken } from "../../domain/entities/user-token";

/**
 * Token Storage Service
 *
 * Implements secure storage of OAuth tokens using Firebase Admin SDK.
 * Tokens are stored in Firestore and are only accessible server-side.
 *
 * Security:
 * - Uses Firebase Admin SDK (bypasses security rules)
 * - Firestore security rules prevent client-side access
 * - Tokens are encrypted at rest by Firebase
 * - Token rotation on every refresh
 */
export class TokenStorageService implements OAuthTokenRepository {
  private db: admin.firestore.Firestore;
  private readonly collectionName = "user_tokens";

  constructor(firestoreDb?: admin.firestore.Firestore) {
    // Allow dependency injection for testing, otherwise use default admin instance
    this.db = firestoreDb || admin.firestore();
  }

  /**
   * Generate a unique token document ID
   */
  private getTokenDocId(userId: string, provider: string): string {
    return `${userId}_${provider}`;
  }

  /**
   * Convert UserToken to Firestore document data
   */
  private toFirestoreData(token: UserToken): admin.firestore.DocumentData {
    return {
      userId: token.userId,
      provider: token.provider,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken || null,
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(token.expiresAt)),
      scopes: token.scopes,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(token.createdAt)),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date(token.updatedAt)),
    };
  }

  /**
   * Convert Firestore document to UserToken
   */
  private fromFirestoreData(data: admin.firestore.DocumentData): UserToken {
    return {
      userId: data.userId,
      provider: data.provider,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || undefined,
      expiresAt: data.expiresAt.toDate(),
      scopes: data.scopes,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  }

  /**
   * Store OAuth tokens for a user and provider
   */
  async storeToken(token: UserToken): Promise<UserToken> {
    try {
      const docId = this.getTokenDocId(token.userId, token.provider);
      const docRef = this.db.collection(this.collectionName).doc(docId);

      const now = admin.firestore.Timestamp.now();
      const tokenData = {
        ...this.toFirestoreData(token),
        createdAt: now,
        updatedAt: now,
      };

      await docRef.set(tokenData);

      return {
        ...token,
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
      };
    } catch (error) {
      console.error("Error storing token:", error);
      throw new Error(
        `Failed to store token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get OAuth token for a user and provider
   */
  async getToken(userId: string, provider: string): Promise<UserToken | null> {
    try {
      const docId = this.getTokenDocId(userId, provider);
      const docRef = this.db.collection(this.collectionName).doc(docId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      if (!data) {
        return null;
      }

      return this.fromFirestoreData(data);
    } catch (error) {
      console.error("Error getting token:", error);
      throw new Error(
        `Failed to get token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Update OAuth token (typically after refresh)
   */
  async updateToken(
    userId: string,
    provider: string,
    updates: Partial<UserToken>
  ): Promise<UserToken> {
    try {
      const docId = this.getTokenDocId(userId, provider);
      const docRef = this.db.collection(this.collectionName).doc(docId);

      // Get existing token
      const existingDoc = await docRef.get();
      if (!existingDoc.exists) {
        throw new Error("Token not found");
      }

      const existingData = existingDoc.data();
      if (!existingData) {
        throw new Error("Token data is empty");
      }

      // Prepare update data
      const updateData: Partial<admin.firestore.DocumentData> = {
        updatedAt: admin.firestore.Timestamp.now(),
      };

      if (updates.accessToken) {
        updateData.accessToken = updates.accessToken;
      }
      if (updates.refreshToken) {
        updateData.refreshToken = updates.refreshToken;
      }
      if (updates.expiresAt) {
        updateData.expiresAt = admin.firestore.Timestamp.fromDate(
          new Date(updates.expiresAt)
        );
      }
      if (updates.scopes) {
        updateData.scopes = updates.scopes;
      }

      // Update the document
      await docRef.update(updateData);

      // Get and return updated token
      const updatedDoc = await docRef.get();
      const updatedData = updatedDoc.data();

      if (!updatedData) {
        throw new Error("Failed to retrieve updated token");
      }

      return this.fromFirestoreData(updatedData);
    } catch (error) {
      console.error("Error updating token:", error);
      throw new Error(
        `Failed to update token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Delete OAuth token (on disconnect)
   */
  async deleteToken(userId: string, provider: string): Promise<void> {
    try {
      const docId = this.getTokenDocId(userId, provider);
      const docRef = this.db.collection(this.collectionName).doc(docId);

      await docRef.delete();
    } catch (error) {
      console.error("Error deleting token:", error);
      throw new Error(
        `Failed to delete token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Check if user has a valid token for a provider
   */
  async hasValidToken(userId: string, provider: string): Promise<boolean> {
    try {
      const token = await this.getToken(userId, provider);

      if (!token) {
        return false;
      }

      // Check if token is not expired
      const now = new Date();
      const expiresAt = new Date(token.expiresAt);

      return expiresAt > now;
    } catch (error) {
      console.error("Error checking token validity:", error);
      return false;
    }
  }

  /**
   * Get all tokens for a user (for listing connected providers)
   */
  async getUserTokens(userId: string): Promise<UserToken[]> {
    try {
      const snapshot = await this.db
        .collection(this.collectionName)
        .where("userId", "==", userId)
        .get();

      const tokens: UserToken[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          tokens.push(this.fromFirestoreData(data));
        }
      });

      return tokens;
    } catch (error) {
      console.error("Error getting user tokens:", error);
      throw new Error(
        `Failed to get user tokens: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
