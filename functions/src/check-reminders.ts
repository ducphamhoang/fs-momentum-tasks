import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

/**
 * Check Reminders Cloud Function
 *
 * Runs every 1 minute to check for due reminders and send notifications.
 *
 * Architecture:
 * - Triggered by Cloud Scheduler every minute
 * - Queries tasks with reminders that are due (triggerTime <= now)
 * - Creates in-app notifications in Firestore
 * - Marks reminders as notified
 * - Future: Integrates with chatbot API for bot notifications
 */

interface Reminder {
  id: string;
  triggerTime: admin.firestore.Timestamp | Date;
  notified: boolean;
}

interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  dueDate?: admin.firestore.Timestamp | Date;
  reminders?: Reminder[];
}

interface NotificationData {
  userId: string;
  taskId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: admin.firestore.FieldValue;
  reminderId?: string;
}

/**
 * Convert Firestore Timestamp or Date to Date object
 */
function toDate(value: admin.firestore.Timestamp | Date): Date {
  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate();
  }
  return value;
}

/**
 * Format time for display (e.g., "2:30 PM")
 */
function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Create notification message based on task details
 */
function createNotificationMessage(task: Task, minutesUntilStart: number): string {
  const baseMessage = minutesUntilStart === 15
    ? "Reminder: Task starts in 15 minutes"
    : "Reminder: Task starts in 5 minutes";

  if (task.startTime) {
    return `${baseMessage} at ${formatTime(task.startTime)}`;
  }

  return baseMessage;
}

/**
 * Calculate minutes until task start
 */
function calculateMinutesUntilStart(task: Task, reminderTime: Date): number {
  if (!task.startTime || !task.dueDate) {
    return 0;
  }

  const [hours, minutes] = task.startTime.split(":").map(Number);
  const taskStartDate = toDate(task.dueDate);
  taskStartDate.setHours(hours, minutes, 0, 0);

  const diffMs = taskStartDate.getTime() - reminderTime.getTime();
  return Math.round(diffMs / (60 * 1000));
}

/**
 * Scheduled function to check for due reminders
 * Runs every 1 minute
 */
export const checkReminders = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async () => {
    const startTime = Date.now();
    const now = new Date();

    functions.logger.info("[CheckReminders] Starting reminder check", {
      timestamp: now.toISOString(),
    });

    try {
      const db = admin.firestore();

      // Query all users to check their tasks
      // Note: This is a simplified approach. In production, you might want to:
      // 1. Index tasks by reminder.triggerTime for better performance
      // 2. Use a separate reminders collection for scalability
      const usersSnapshot = await db.collection("users").get();

      if (usersSnapshot.empty) {
        functions.logger.info("[CheckReminders] No users found");
        return { success: true, remindersProcessed: 0 };
      }

      const stats = {
        usersChecked: 0,
        tasksChecked: 0,
        remindersProcessed: 0,
        notificationsCreated: 0,
        errors: [] as Array<{ userId: string; taskId: string; error: string }>,
      };

      // Process each user
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        stats.usersChecked++;

        try {
          // Get all tasks for this user
          const tasksSnapshot = await db
            .collection("users")
            .doc(userId)
            .collection("tasks")
            .where("isCompleted", "==", false) // Only check incomplete tasks
            .get();

          if (tasksSnapshot.empty) {
            continue;
          }

          // Process each task
          for (const taskDoc of tasksSnapshot.docs) {
            stats.tasksChecked++;
            const taskData = taskDoc.data() as Task;
            const task: Task = {
              ...taskData,
              id: taskDoc.id,
              userId,
            };

            // Skip tasks without reminders
            if (!task.reminders || task.reminders.length === 0) {
              continue;
            }

            // Check each reminder
            const updatedReminders: Reminder[] = [];
            let hasChanges = false;

            for (const reminder of task.reminders) {
              const triggerDate = toDate(reminder.triggerTime);

              // Check if reminder is due and not yet notified
              if (!reminder.notified && triggerDate <= now) {
                functions.logger.info(
                  `[CheckReminders] Processing due reminder for task ${task.id}`,
                  {
                    userId,
                    taskId: task.id,
                    reminderId: reminder.id,
                    triggerTime: triggerDate.toISOString(),
                  }
                );

                try {
                  // Create notification
                  const minutesUntilStart = calculateMinutesUntilStart(task, triggerDate);
                  const notification: NotificationData = {
                    userId,
                    taskId: task.id,
                    title: task.title,
                    message: createNotificationMessage(task, minutesUntilStart),
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    reminderId: reminder.id,
                  };

                  await db.collection("notifications").add(notification);
                  stats.notificationsCreated++;

                  // TODO: Integrate with chatbot API when available
                  // Check if user has active chatbot session
                  // If yes, send notification via chatbot webhook/API
                  // Example:
                  // const chatbotSession = await checkChatbotSession(userId);
                  // if (chatbotSession) {
                  //   await sendChatbotNotification(chatbotSession, notification);
                  // }

                  // Mark reminder as notified
                  updatedReminders.push({
                    ...reminder,
                    notified: true,
                  });
                  hasChanges = true;
                  stats.remindersProcessed++;

                  functions.logger.info(
                    `[CheckReminders] Notification created for task ${task.id}`,
                    {
                      notificationTitle: notification.title,
                      notificationMessage: notification.message,
                    }
                  );
                } catch (error) {
                  functions.logger.error(
                    `[CheckReminders] Error creating notification for reminder ${reminder.id}:`,
                    error
                  );
                  stats.errors.push({
                    userId,
                    taskId: task.id,
                    error: error instanceof Error ? error.message : "Unknown error",
                  });
                  // Keep the original reminder if notification creation failed
                  updatedReminders.push(reminder);
                }
              } else {
                // Keep reminders that aren't due or are already notified
                updatedReminders.push(reminder);
              }
            }

            // Update task with notified reminders
            if (hasChanges) {
              await db
                .collection("users")
                .doc(userId)
                .collection("tasks")
                .doc(task.id)
                .update({ reminders: updatedReminders });

              functions.logger.info(
                `[CheckReminders] Updated task ${task.id} with notified reminders`
              );
            }
          }
        } catch (error) {
          functions.logger.error(
            `[CheckReminders] Error processing user ${userId}:`,
            error
          );
          stats.errors.push({
            userId,
            taskId: "N/A",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const duration = Date.now() - startTime;
      functions.logger.info("[CheckReminders] Reminder check completed", {
        duration: `${duration}ms`,
        ...stats,
      });

      return {
        success: true,
        ...stats,
        duration,
      };
    } catch (error) {
      functions.logger.error("[CheckReminders] Critical error during reminder check:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

/**
 * Manual trigger for testing reminders
 * HTTP callable function to trigger reminder check immediately
 */
export const manualReminderCheck = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated (optional for testing)
  if (!context || !context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to trigger reminder check"
    );
  }

  functions.logger.info("[ManualReminderCheck] Manual reminder check triggered");

  try {
    // Reuse the same logic as the scheduled function
    const now = new Date();
    const db = admin.firestore();

    const usersSnapshot = await db.collection("users").get();

    if (usersSnapshot.empty) {
      return { success: true, remindersProcessed: 0, message: "No users found" };
    }

    let remindersProcessed = 0;
    let notificationsCreated = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const tasksSnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("tasks")
        .where("isCompleted", "==", false)
        .get();

      for (const taskDoc of tasksSnapshot.docs) {
        const taskData = taskDoc.data() as Task;
        const task: Task = {
          ...taskData,
          id: taskDoc.id,
          userId,
        };

        if (!task.reminders || task.reminders.length === 0) {
          continue;
        }

        const updatedReminders: Reminder[] = [];
        let hasChanges = false;

        for (const reminder of task.reminders) {
          const triggerDate = toDate(reminder.triggerTime);

          if (!reminder.notified && triggerDate <= now) {
            const minutesUntilStart = calculateMinutesUntilStart(task, triggerDate);
            const notification: NotificationData = {
              userId,
              taskId: task.id,
              title: task.title,
              message: createNotificationMessage(task, minutesUntilStart),
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              reminderId: reminder.id,
            };

            await db.collection("notifications").add(notification);
            notificationsCreated++;

            updatedReminders.push({
              ...reminder,
              notified: true,
            });
            hasChanges = true;
            remindersProcessed++;
          } else {
            updatedReminders.push(reminder);
          }
        }

        if (hasChanges) {
          await db
            .collection("users")
            .doc(userId)
            .collection("tasks")
            .doc(task.id)
            .update({ reminders: updatedReminders });
        }
      }
    }

    functions.logger.info("[ManualReminderCheck] Manual check completed", {
      remindersProcessed,
      notificationsCreated,
    });

    return {
      success: true,
      remindersProcessed,
      notificationsCreated,
      message: `Processed ${remindersProcessed} reminders and created ${notificationsCreated} notifications`,
    };
  } catch (error) {
    functions.logger.error("[ManualReminderCheck] Error during manual check:", error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});
