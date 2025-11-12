import { z } from "zod";
import { Timestamp } from "firebase/firestore";

/**
 * Notification Schema
 *
 * Represents in-app notifications for task reminders
 */
export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  taskId: z.string(),
  title: z.string(),
  message: z.string(),
  read: z.boolean().default(false),
  createdAt: z.instanceof(Date).or(z.instanceof(Timestamp)),
  // Link to the specific reminder that triggered this notification
  reminderId: z.string().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

/**
 * Create Notification Input Schema
 */
export const CreateNotificationSchema = NotificationSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;
