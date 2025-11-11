import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// Reminder schema for task reminders
export const ReminderSchema = z.object({
  id: z.string(),
  triggerTime: z.instanceof(Date).or(z.instanceof(Timestamp)),
  notified: z.boolean().default(false),
});

export type Reminder = z.infer<typeof ReminderSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  isCompleted: z.boolean(),
  importanceLevel: z.enum(["low", "medium", "high"]),
  dueDate: z.instanceof(Date).or(z.instanceof(Timestamp)).optional().nullable(),

  // Time blocking fields (using existing startTime/endTime)
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  timeEstimate: z.number().optional(), // Changed from string to number for minutes

  // Source and external integration fields
  source: z.enum(["web", "chatbot", "local", "google-tasks"]).optional().default("local"),
  externalId: z.string().optional().nullable(), // ID from external platform (e.g., Google Tasks)
  externalEtag: z.string().optional().nullable(), // Etag for sync optimization
  lastSyncedAt: z.instanceof(Date).or(z.instanceof(Timestamp)).optional().nullable(),

  // Reminders for time-blocked tasks
  reminders: z.array(ReminderSchema).optional().default([]),

  // Timestamps
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
