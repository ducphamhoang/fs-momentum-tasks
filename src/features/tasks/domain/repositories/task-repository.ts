import type { Task, CreateTaskInput } from "../task";

export interface TaskRepository {
  getTasks(userId: string): Promise<Task[]>;
  getTaskById(userId: string, taskId: string): Promise<Task | null>;
  createTask(userId: string, task: CreateTaskInput): Promise<Task>;
  updateTask(userId: string, taskId: string, task: Partial<Task>): Promise<Task>;
  deleteTask(userId: string, taskId: string): Promise<void>;
}