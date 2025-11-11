import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { FirestoreChatbotSessionRepository } from '../../../infrastructure/persistence/firestore-chatbot-session-repository';
import { ChatbotSession } from '../../../domain/entities/chatbot-session';
import { initializeFirebase } from '@/firebase';

// Mock Firebase
vi.mock('@/firebase', () => ({
  initializeFirebase: vi.fn(() => ({
    firestore: {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          set: vi.fn(),
          get: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        })),
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: vi.fn(),
            })),
          })),
        })),
        get: vi.fn(),
      })),
      batch: vi.fn(() => ({
        delete: vi.fn(),
        commit: vi.fn(),
      })),
    }
  })),
}));

// Mock the Firebase SDK methods
const mockFirestore = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      set: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
    where: vi.fn(() => ({
      orderBy: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(),
        })),
      })),
    })),
    get: vi.fn(),
  })),
  batch: vi.fn(() => ({
    delete: vi.fn(),
    commit: vi.fn(),
  })),
};

describe('FirestoreChatbotSessionRepository', () => {
  let repository: FirestoreChatbotSessionRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          set: vi.fn(),
          get: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        })),
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: vi.fn(),
            })),
          })),
        })),
        get: vi.fn(),
      })),
      batch: vi.fn(() => ({
        delete: vi.fn(),
        commit: vi.fn(),
      })),
    };

    // Update the mock to return our mockDb
    (initializeFirebase as Mock).mockReturnValue({
      firestore: mockDb
    });

    repository = new FirestoreChatbotSessionRepository();
  });

  describe('create', () => {
    it('should create a new session in Firestore', async () => {
      const mockSession = new ChatbotSession({
        id: 'session-123',
        userId: 'user-123',
        token: 'token-123',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        isActive: true,
      });

      const mockSet = vi.fn();
      const mockDoc = {
        set: mockSet
      };
      const mockCollection = {
        doc: vi.fn(() => mockDoc)
      };
      mockDb.collection = vi.fn(() => mockCollection);

      await repository.create(mockSession);

      expect(mockDb.collection).toHaveBeenCalledWith('chatbotSessions');
      expect(mockCollection.doc).toHaveBeenCalledWith('session-123');
      expect(mockSet).toHaveBeenCalledWith({
        id: 'session-123',
        userId: 'user-123',
        token: 'token-123',
        createdAt: expect.any(Date),
        expiresAt: expect.any(Date),
        isActive: true,
      });
    });
  });

  describe('findById', () => {
    it('should return null when session does not exist', async () => {
      const mockDoc = {
        exists: false,
        data: vi.fn(),
      };
      const mockGet = vi.fn().mockResolvedValue(mockDoc);
      const mockDocRef = {
        get: mockGet
      };
      const mockCollection = {
        doc: vi.fn(() => mockDocRef)
      };
      mockDb.collection = vi.fn(() => mockCollection);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
      expect(mockCollection.doc).toHaveBeenCalledWith('non-existent-id');
    });

    it('should return session when it exists', async () => {
      const mockSessionData = {
        id: 'session-123',
        userId: 'user-123',
        token: 'token-123',
        createdAt: { toDate: () => new Date() },
        expiresAt: { toDate: () => new Date(Date.now() + 3600000) },
        isActive: true,
      };

      const mockDoc = {
        exists: true,
        data: vi.fn(() => mockSessionData),
      };
      const mockGet = vi.fn().mockResolvedValue(mockDoc);
      const mockDocRef = {
        get: mockGet
      };
      const mockCollection = {
        doc: vi.fn(() => mockDocRef)
      };
      mockDb.collection = vi.fn(() => mockCollection);

      const result = await repository.findById('session-123');

      expect(result).toBeDefined();
      expect(result!.id).toBe('session-123');
      expect(result!.userId).toBe('user-123');
    });
  });

  describe('findByToken', () => {
    it('should return null when no session exists with given token', async () => {
      const mockSnapshot = {
        empty: true,
        docs: [],
      };
      const mockGet = vi.fn().mockResolvedValue(mockSnapshot);
      const mockLimit = vi.fn(() => ({ get: mockGet }));
      const mockSecondWhere = vi.fn(() => ({ limit: mockLimit }));
      const mockFirstWhere = vi.fn(() => ({ where: mockSecondWhere }));
      const mockCollection = {
        where: mockFirstWhere,
      };
      mockDb.collection = vi.fn(() => mockCollection);

      const result = await repository.findByToken('non-existent-token');

      expect(result).toBeNull();
      expect(mockFirstWhere).toHaveBeenCalledWith('token', '==', 'non-existent-token');
      expect(mockSecondWhere).toHaveBeenCalledWith('isActive', '==', true);
    });

    it('should return session when it exists with given token', async () => {
      const mockSessionData = {
        id: 'session-123',
        userId: 'user-123',
        token: 'token-123',
        createdAt: { toDate: () => new Date() },
        expiresAt: { toDate: () => new Date(Date.now() + 3600000) },
        isActive: true,
      };

      const mockDoc = {
        data: vi.fn(() => mockSessionData),
      };
      const mockSnapshot = {
        empty: false,
        docs: [mockDoc],
      };
      const mockGet = vi.fn().mockResolvedValue(mockSnapshot);
      const mockWhere = vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: mockGet,
          })),
        })),
      }));
      const mockCollection = {
        where: mockWhere,
      };
      mockDb.collection = vi.fn(() => mockCollection);

      const result = await repository.findByToken('token-123');

      expect(result).toBeDefined();
      expect(result!.id).toBe('session-123');
      expect(result!.token).toBe('token-123');
    });
  });
});