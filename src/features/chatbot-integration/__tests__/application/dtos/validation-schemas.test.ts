import { describe, it, expect } from 'vitest';
import { 
  CreateTaskRequestSchema, 
  UpdateTaskRequestSchema, 
  TaskResponseSchema,
  CreateTaskRequestDto,
  UpdateTaskRequestDto,
  TaskResponseDto 
} from '../../../application/dtos/validation-schemas';

describe('DTO Validation Schemas', () => {
  describe('CreateTaskRequestSchema', () => {
    it('should validate a valid create task request', () => {
      const validData: CreateTaskRequestDto = {
        title: 'Test Task',
        description: 'Test Description',
        importance: 'medium',
        dueDate: new Date().toISOString(),
      };

      const result = CreateTaskRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require a title', () => {
      const invalidData = {
        description: 'Test Description',
        importance: 'medium',
      };

      const result = CreateTaskRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message.toLowerCase()).toContain('required');
      }
    });

    it('should not allow empty title', () => {
      const invalidData = {
        title: '',
        description: 'Test Description',
        importance: 'medium',
      };

      const result = CreateTaskRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate importance enum', () => {
      const invalidData = {
        title: 'Test Task',
        importance: 'invalid-importance' as any,
      };

      const result = CreateTaskRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate dueDate format', () => {
      const invalidData = {
        title: 'Test Task',
        dueDate: 'invalid-date-format',
      };

      const result = CreateTaskRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateTaskRequestSchema', () => {
    it('should validate a valid update task request', () => {
      const validData: UpdateTaskRequestDto = {
        title: 'Updated Task',
        description: 'Updated Description',
        isCompleted: true,
        importance: 'high',
        dueDate: new Date().toISOString(),
      };

      const result = UpdateTaskRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const partialData = {
        title: 'Updated Task',
        // Only updating title, other fields are optional
      };

      const result = UpdateTaskRequestSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it('should validate dueDate format when provided', () => {
      const invalidData = {
        title: 'Test Task',
        dueDate: 'invalid-date-format',
      };

      const result = UpdateTaskRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('TaskResponseSchema', () => {
    it('should validate a valid task response', () => {
      const validData: TaskResponseDto = {
        id: 'task-123',
        title: 'Test Task',
        description: 'Test Description',
        isCompleted: false,  // Changed from status
        importance: 'medium',  // Changed from priority
        dueDate: new Date().toISOString(),
        timeEstimate: 60,  // Added
        source: 'web',  // Added
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = TaskResponseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require all required fields', () => {
      const incompleteData = {
        id: 'task-123',
        title: 'Test Task',
        // Missing other required fields
      };

      const result = TaskResponseSchema.safeParse(incompleteData);
      expect(result.success).toBe(false);
    });

    it('should validate source enum', () => {
      const invalidData = {
        id: 'task-123',
        title: 'Test Task',
        isCompleted: false,
        importance: 'medium',
        source: 'invalid-source' as any,  // Changed to test source
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = TaskResponseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate importance enum', () => {
      const invalidData = {
        id: 'task-123',
        title: 'Test Task',
        isCompleted: false,
        importance: 'invalid-importance' as any,  // Changed from priority
        source: 'web',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = TaskResponseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate date formats', () => {
      const invalidData = {
        id: 'task-123',
        title: 'Test Task',
        isCompleted: false,
        importance: 'medium',
        source: 'web',
        createdAt: 'invalid-date',
        updatedAt: 'invalid-date',
      };

      const result = TaskResponseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});