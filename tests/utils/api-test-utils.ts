// tests/utils/api-test-utils.ts
import { vi } from 'vitest';

// Mock the Firebase services at the module level
export const mockFirebaseServices = () => {
  const mockFirestore = {
    collection: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({ docs: [] })),
      doc: vi.fn(() => ({
        set: vi.fn(() => Promise.resolve()),
        update: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve()),
      })),
    })),
  };

  const mockAuth = {
    verifyIdToken: vi.fn(() => Promise.resolve({ uid: 'test-user-id' })),
  };

  vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal();
    return {
      ...(actual as any),
      getFirestore: vi.fn(() => mockFirestore),
      collection: mockFirestore.collection,
      doc: vi.fn(),
      getDocs: vi.fn(),
      addDoc: vi.fn(),
      updateDoc: vi.fn(),
      deleteDoc: vi.fn(),
      query: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn(),
      serverTimestamp: vi.fn(() => new Date()),
    };
  });

  vi.mock('firebase/auth', async (importOriginal) => {
    const actual = await importOriginal();
    return {
      ...(actual as any),
      getAuth: vi.fn(() => mockAuth),
    };
  });

  return { mockFirestore, mockAuth };
};