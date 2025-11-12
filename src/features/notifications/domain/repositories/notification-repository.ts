import { type Notification } from "../notification";

/**
 * Notification Repository Interface
 *
 * Manages CRUD operations for user notifications
 */
export interface NotificationRepository {
  /**
   * Get all notifications for a user
   */
  getNotifications(userId: string): Promise<Notification[]>;

  /**
   * Get unread notification count for a user
   */
  getUnreadCount(userId: string): Promise<number>;

  /**
   * Mark a notification as read
   */
  markAsRead(userId: string, notificationId: string): Promise<void>;

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: string): Promise<void>;

  /**
   * Delete a notification
   */
  deleteNotification(userId: string, notificationId: string): Promise<void>;

  /**
   * Delete all notifications for a user
   */
  deleteAll(userId: string): Promise<void>;

  /**
   * Subscribe to real-time notification updates
   */
  subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void
  ): () => void;
}
