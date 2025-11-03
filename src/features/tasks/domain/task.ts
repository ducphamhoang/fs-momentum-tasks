import { z } from "zod";

export const TaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  isCompleted: z.boolean(),
  importanceLevel: z.enum(["low", "medium", "high"]),
  dueDate: z.date().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  timeEstimate: z.string().optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskSchema = TaskSchema.omit({ 
    id: true, 
    userId: true, 
    isCompleted: true, 
    createdAt: true, 
    updatedAt: true 
});
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = TaskSchema.omit({
    userId: true,
    createdAt: true,
    updatedAt: true,
}).partial();
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
