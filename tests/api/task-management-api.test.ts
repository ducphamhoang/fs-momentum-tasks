import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskApplicationServiceImpl } from '../../src/features/tasks/application/services/task-service';
import type { TaskRepository } from '../../src/features/tasks/domain/repositories/task-repository';
import type { Task, CreateTaskInput } from '../../src/features/tasks/domain/task';
import { Timestamp } from 'firebase/firestore';

// Mock the TaskRepository
const mockTaskRepository = {
  getTasks: vi.fn(),
  getTaskById: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
} as unknown as TaskRepository;

describe('Task Management API Endpoints - CRUD Operations', () => {
  let taskService: TaskApplicationServiceImpl;

  beforeEach(() => {
    taskService = new TaskApplicationServiceImpl(mockTaskRepository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('CREATE operations', () => {
    it('should create a new task successfully', async () => {
      const createTaskInput: CreateTaskInput = {
        title: 'New Task',
        description: 'New Task Description',
        importanceLevel: 'medium',
        dueDate: new Date('2025-12-01'),
        timeEstimate: '2 hours',
      };

      const expectedTask: Task = {
        id: 'new-task-id',
        userId: 'user1',
        ...createTaskInput,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockTaskRepository.createTask as any).mockResolvedValue(expectedTask);

      const task = await taskService.createTask('user1', createTaskInput);
      
      expect(mockTaskRepository.createTask).toHaveBeenCalledWith('user1', createTaskInput);
      expect(task.title).toBe('New Task');
      expect(task.isCompleted).toBe(false);
      expect(task.importanceLevel).toBe('medium');
    });

    it('should handle create task errors', async () => {
      const createTaskInput: CreateTaskInput = {
        title: 'New Task',
        importanceLevel: 'medium',
      };

      (mockTaskRepository.createTask as any).mockRejectedValue(new Error('Database error'));

      await expect(taskService.createTask('user1', createTaskInput))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('READ operations', () => {
    it('should retrieve all tasks for a user', async () => {
      const mockTasks: Task[] = [
        {
          id: 'task1',
          userId: 'user1',
          title: 'Test Task 1',
          description: 'Test Description 1',
          importanceLevel: 'high',
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'task2',
          userId: 'user1',
          title: 'Test Task 2',
          description: 'Test Description 2',
          importanceLevel: 'medium',
          isCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockTaskRepository.getTasks as any).mockResolvedValue(mockTasks);

      const tasks = await taskService.getTasks('user1');
      
      expect(mockTaskRepository.getTasks).toHaveBeenCalledWith('user1');
      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe('Test Task 1');
      expect(tasks[0].importanceLevel).toBe('high');
      expect(tasks[1].isCompleted).toBe(true);
    });

    it('should retrieve a single task by ID', async () => {
      const mockTask: Task = {
        id: 'task1',
        userId: 'user1',
        title: 'Test Task',
        description: 'Test Description',
        importanceLevel: 'high',
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockTaskRepository.getTaskById as any).mockResolvedValue(mockTask);

      const task = await taskService.getTaskById('user1', 'task1');
      
      expect(mockTaskRepository.getTaskById).toHaveBeenCalledWith('user1', 'task1');
      expect(task).toEqual(mockTask);
      if (task) {
        expect(task.title).toBe('Test Task');
      }
    });

    it('should return null when task does not exist', async () => {
      (mockTaskRepository.getTaskById as any).mockResolvedValue(null);

      const task = await taskService.getTaskById('user1', 'non-existent-task');
      
      expect(task).toBeNull();
    });

    it('should handle retrieving non-existent task', async () => {
      (mockTaskRepository.getTaskById as any).mockResolvedValue(null);

      const task = await taskService.getTaskById('user1', 'non-existent-task');
      
      expect(task).toBeNull();
    });

    it('should handle get tasks errors', async () => {
      (mockTaskRepository.getTasks as any).mockRejectedValue(new Error('Database error'));

      await expect(taskService.getTasks('user1'))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('UPDATE operations', () => {
    it('should update an existing task', async () => {
      const existingTask: Task = {
        id: 'task1',
        userId: 'user1',
        title: 'Original Task',
        description: 'Original Description',
        importanceLevel: 'high',
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData: Partial<Task> = {
        title: 'Updated Task',
        isCompleted: true,
        importanceLevel: 'low',
      };

      const updatedTask: Task = {
        ...existingTask,
        ...updateData,
        updatedAt: new Date(),
      };

      (mockTaskRepository.updateTask as any).mockResolvedValue(updatedTask);

      const task = await taskService.updateTask('user1', 'task1', updateData);
      
      expect(mockTaskRepository.updateTask).toHaveBeenCalledWith('user1', 'task1', updateData);
      expect(task.title).toBe('Updated Task');
      expect(task.isCompleted).toBe(true);
      expect(task.importanceLevel).toBe('low');
    });

    it('should handle update task errors', async () => {
      const updateData = { title: 'Updated Task' };
      
      (mockTaskRepository.updateTask as any).mockRejectedValue(new Error('Database error'));

      await expect(taskService.updateTask('user1', 'task1', updateData))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('DELETE operations', () => {
    it('should delete a task', async () => {
      await taskService.deleteTask('user1', 'task1');
      
      expect(mockTaskRepository.deleteTask).toHaveBeenCalledWith('user1', 'task1');
    });

    it('should handle delete task errors', async () => {
      (mockTaskRepository.deleteTask as any).mockRejectedValue(new Error('Database error'));

      await expect(taskService.deleteTask('user1', 'task1'))
        .rejects
        .toThrow('Database error');
    });
  });
});