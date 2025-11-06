import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getTasksAction, prioritizeTasks } from '../../src/features/tasks/application/ai-task-service';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Mock firebase and next/headers
vi.mock('next/headers', () => ({
  headers: () => ({
    get: (name: string) => {
      if (name === 'Authorization') return 'Bearer test-token';
      return null;
    },
  }),
}));

vi.mock('firebase-admin/auth', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    getAuth: vi.fn(() => ({
      verifyIdToken: vi.fn(() => Promise.resolve({ uid: 'test-user-id' })),
    })),
  };
});

vi.mock('firebase-admin/app', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    initializeApp: vi.fn(),
    getApps: vi.fn(() => []),
  };
});

vi.mock('firebase-admin/firestore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    getFirestore: vi.fn(() => ({
      collection: vi.fn(() => ({
        get: vi.fn(() => ({
          docs: [],
        })),
      })),
    })),
    Timestamp: class {},
  };
});

describe('AI Task Service API Endpoints', () => {
  beforeEach(() => {
    // Setup code before each test
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should get tasks for authenticated user', async () => {
    // Mock the Firestore response
    const mockTasks = [
      {
        id: 'task1',
        title: 'Test Task',
        description: 'Test Description',
        importanceLevel: 'high',
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    const mockFirestore = {
      collection: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({
          docs: mockTasks.map(task => ({
            id: task.id,
            data: () => task,
          })),
        })),
      })),
    };

    // Override the getFirestore mock
    (getFirestore as any).mockReturnValue(mockFirestore);

    const tasks = await getTasksAction();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Test Task');
  });

  it('should prioritize tasks using AI', async () => {
    // Mock getTasksAction to return sample tasks
    vi.mock('../../src/features/tasks/application/ai-task-service', async () => {
      const actual = await vi.importActual('../../src/features/tasks/application/ai-task-service');
      return {
        ...actual,
        getTasksAction: vi.fn(() => Promise.resolve([
          {
            id: 'task1',
            title: 'Urgent Task',
            importanceLevel: 'high',
            dueDate: new Date('2025-11-06'),
          },
          {
            id: 'task2',
            title: 'Less Urgent Task',
            importanceLevel: 'low',
            dueDate: new Date('2025-11-20'),
          }
        ])),
      };
    });

    // Since prioritizeTasks is complex, we'll just test that it returns a valid response structure
    const result = await prioritizeTasks();
    
    expect(result).toHaveProperty('prioritizedTasks');
    expect(Array.isArray(result.prioritizedTasks)).toBe(true);
  });
});