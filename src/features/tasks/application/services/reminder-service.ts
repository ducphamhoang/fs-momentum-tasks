import { type Reminder } from "../../domain/task";
import { type TaskRepository } from "../../domain/repositories/task-repository";

/**
 * ReminderService Interface
 *
 * Manages reminders for time-blocked tasks
 */
export interface ReminderService {
  addReminder(userId: string, taskId: string, triggerTime: Date): Promise<Reminder>;
  removeReminder(userId: string, taskId: string, reminderId: string): Promise<void>;
  updateRemindersForTimeBlock(
    userId: string,
    taskId: string,
    startTime: string | null,
    endTime: string | null,
    dueDate: Date | null
  ): Promise<void>;
}

/**
 * ReminderService Implementation
 */
export class ReminderServiceImpl implements ReminderService {
  constructor(private taskRepository: TaskRepository) {}

  async addReminder(userId: string, taskId: string, triggerTime: Date): Promise<Reminder> {
    const task = await this.taskRepository.getTaskById(userId, taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const reminder: Reminder = {
      id: this.generateReminderId(),
      triggerTime,
      notified: false,
    };

    const updatedReminders = [...(task.reminders || []), reminder];
    await this.taskRepository.updateTask(userId, taskId, { reminders: updatedReminders });

    return reminder;
  }

  async removeReminder(userId: string, taskId: string, reminderId: string): Promise<void> {
    const task = await this.taskRepository.getTaskById(userId, taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const updatedReminders = (task.reminders || []).filter((r) => r.id !== reminderId);
    await this.taskRepository.updateTask(userId, taskId, { reminders: updatedReminders });
  }

  async updateRemindersForTimeBlock(
    userId: string,
    taskId: string,
    startTime: string | null,
    endTime: string | null,
    dueDate: Date | null
  ): Promise<void> {
    const task = await this.taskRepository.getTaskById(userId, taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // If no time block, clear all reminders
    if (!startTime || !endTime || !dueDate) {
      await this.taskRepository.updateTask(userId, taskId, { reminders: [] });
      return;
    }

    // Calculate reminder times based on start time
    const reminderTimes = this.calculateReminderTimes(startTime, dueDate);

    // Create new reminders
    const newReminders: Reminder[] = reminderTimes.map((time, index) => ({
      id: this.generateReminderId() + `-${index}`,
      triggerTime: time,
      notified: false,
    }));

    await this.taskRepository.updateTask(userId, taskId, { reminders: newReminders });
  }

  /**
   * Calculate reminder trigger times based on task start time
   * For MVP: Set reminders at 15 minutes before and 5 minutes before
   */
  private calculateReminderTimes(startTime: string, dueDate: Date): Date[] {
    const [hours, minutes] = startTime.split(":").map(Number);

    // Create the task start datetime
    const taskStart = new Date(dueDate);
    taskStart.setHours(hours, minutes, 0, 0);

    const reminderTimes: Date[] = [];

    // 15 minutes before
    const fifteenMinBefore = new Date(taskStart.getTime() - 15 * 60 * 1000);
    if (fifteenMinBefore > new Date()) {
      reminderTimes.push(fifteenMinBefore);
    }

    // 5 minutes before
    const fiveMinBefore = new Date(taskStart.getTime() - 5 * 60 * 1000);
    if (fiveMinBefore > new Date()) {
      reminderTimes.push(fiveMinBefore);
    }

    return reminderTimes;
  }

  /**
   * Generate a unique reminder ID
   */
  private generateReminderId(): string {
    return `reminder-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
