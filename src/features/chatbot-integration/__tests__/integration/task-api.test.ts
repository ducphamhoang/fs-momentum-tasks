import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/features/chatbot-integration/app/api/chatbot/tasks/route';

// Mock the task service and repository
const mockGetTasks = vi.fn();
const mockCreateTask = vi.fn();

vi.mock('@/features/tasks/application/services/task-service', () => ({
  TaskApplicationServiceImpl: vi.fn(function(this: any) {
    this.getTasks = mockGetTasks;
    this.createTask = mockCreateTask;
  }),
}));

vi.mock('@/features/tasks/infrastructure/persistence/firestore-task-repository', () => ({
  FirestoreTaskRepository: vi.fn(function() {
    // Empty constructor
  }),
}));

// Mock the DI container's chatbotAuthService
const mockValidateSessionToken = vi.fn();

vi.mock('@/shared/infrastructure/di/container', () => ({
  diContainer: {
    chatbotAuthService: {
      validateSessionToken: mockValidateSessionToken,
    },
  },
}));

// Mock the rate limiter to always allow requests
vi.mock('@/features/chatbot-integration/presentation/middleware/rate-limit.middleware', () => ({
  defaultRateLimit: vi.fn().mockResolvedValue(null),
  createRateLimitMiddleware: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

// Mock the logging middleware to avoid header access issues
vi.mock('@/features/chatbot-integration/presentation/middleware/logging.middleware', () => ({
  logApiRequest: vi.fn(),
  logApiResponse: vi.fn(),
}));

describe('Task API Integration Tests', () => {
  const mockUserId = 'user-123';
  const mockToken = 'test-jwt-token';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/chatbot/tasks', () => {
    it('should return tasks for authenticated user', async () => {
      // Mock tasks to be returned
      const mockTasks = [
        {
          id: 'task-1',
          userId: mockUserId,
          title: 'Test Task',
          description: 'Test Description',
          isCompleted: false,
          importanceLevel: 'medium',
          source: 'web',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      // Mock the auth service to return valid session
      mockValidateSessionToken.mockResolvedValue({
        userId: mockUserId,
        sessionId: 'session-123',
      });

      // Mock the task service to return tasks
      mockGetTasks.mockResolvedValue(mockTasks);

      // Create mock request with proper headers
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'Authorization') return `Bearer ${mockToken}`;
            return null;
          },
        },
        url: 'http://localhost:3000/api/chatbot/tasks',
      } as unknown as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('tasks');
      expect(data).toHaveProperty('total');
      expect(Array.isArray(data.tasks)).toBe(true);
      expect(data.tasks[0]).toHaveProperty('id');
      expect(data.tasks[0]).toHaveProperty('title');
      expect(data.tasks[0]).toHaveProperty('importance');
      expect(data.total).toBe(1);
    });

    it('should return 401 if no authorization header', async () => {
      const mockRequest = {
        headers: {
          get: (name: string) => null,
        },
        url: 'http://localhost:3000/api/chatbot/tasks',
      } as unknown as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authorization header missing');
    });

    it('should return 401 if invalid authorization header format', async () => {
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'Authorization') return 'InvalidFormat';
            return null;
          },
        },
        url: 'http://localhost:3000/api/chatbot/tasks',
      } as unknown as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authorization header missing');
    });
  });

  describe('POST /api/chatbot/tasks', () => {
    it('should create a new task for authenticated user', async () => {
      const newTaskData = {
        title: 'New Task',
        description: 'New Task Description',
        importance: 'medium',
      };

      const createdTask = {
        id: 'new-task-123',
        userId: mockUserId,
        title: 'New Task',
        description: 'New Task Description',
        isCompleted: false,
        importanceLevel: 'medium',
        source: 'chatbot',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the auth service to return valid session
      mockValidateSessionToken.mockResolvedValue({
        userId: mockUserId,
        sessionId: 'session-123',
      });

      // Mock the task service to return the created task
      mockCreateTask.mockResolvedValue(createdTask);

      // Create mock request with proper headers
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'Authorization') return `Bearer ${mockToken}`;
            if (name === 'Content-Type') return 'application/json';
            return null;
          },
        },
        url: 'http://localhost:3000/api/chatbot/tasks',
        json: async () => newTaskData,
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('task');
      expect(data.task).toHaveProperty('id');
      expect(data.task.title).toBe('New Task');
      expect(data.task.importance).toBe('medium');
      expect(data.task.source).toBe('chatbot');
    });

    it('should return 400 if request body validation fails', async () => {
      const invalidTaskData = {
        // Missing required title
        description: 'Task without title',
        importance: 'invalid-importance',
      };

      // Mock the auth service to return valid session
      mockValidateSessionToken.mockResolvedValue({
        userId: mockUserId,
        sessionId: 'session-123',
      });

      // Create mock request with proper headers
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'Authorization') return `Bearer ${mockToken}`;
            if (name === 'Content-Type') return 'application/json';
            return null;
          },
        },
        url: 'http://localhost:3000/api/chatbot/tasks',
        json: async () => invalidTaskData,
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });
});