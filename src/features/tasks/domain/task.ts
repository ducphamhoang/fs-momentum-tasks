import { z } from "zod";
import { Timestamp } from "firebase/firestore";

export const TaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  isCompleted: z.boolean(),
  importanceLevel: z.enum(["low", "medium", "high"]),
  dueDate: z.instanceof(Date).or(z.instanceof(Timestamp)).optional().nullable(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  timeEstimate: z.number().optional(), // Changed from string to number for minutes
  source: z.enum(["web", "chatbot"]).optional().default("web"),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskSchema = TaskSchema.omit({ 
    id: true, 
    userId: true, 
    isCompleted: true, 
    createdAt: true, 
    updatedAt: true 
}).extend({
    dueDate: z.instanceof(Date).optional().nullable(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = TaskSchema.omit({
    userId: true,
    createdAt: true,
    updatedAt: true,
}).partial();
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
