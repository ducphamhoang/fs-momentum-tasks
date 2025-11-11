import { z } from 'zod';

// Common validation schemas to match PRD
const ImportanceLevelSchema = z.enum(['low', 'medium', 'high']);

// Create Task Request Schema - matches PRD field names
export const CreateTaskRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  importance: ImportanceLevelSchema.optional().default('medium'),
  dueDate: z.string().datetime({ message: 'Invalid datetime format' }).optional(),
  timeEstimate: z.number().int().min(1).max(480).optional(),
});

// Update Task Request Schema - matches PRD field names
export const UpdateTaskRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  isCompleted: z.boolean().optional(),
  importance: ImportanceLevelSchema.optional(),
  dueDate: z.string().datetime().optional(),
  timeEstimate: z.number().int().min(1).max(480).optional(),
});

// Task Response Schema - matches PRD field names
export const TaskResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  isCompleted: z.boolean(),
  importance: ImportanceLevelSchema,
  dueDate: z.string().datetime().optional(),
  timeEstimate: z.number().int().optional(),
  source: z.enum(['web', 'chatbot']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Type inference
export type CreateTaskRequestDto = z.infer<typeof CreateTaskRequestSchema>;
export type UpdateTaskRequestDto = z.infer<typeof UpdateTaskRequestSchema>;
export type TaskResponseDto = z.infer<typeof TaskResponseSchema>;