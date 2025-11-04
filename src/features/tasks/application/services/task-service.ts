import type { Task, CreateTaskInput } from "../../domain/task";
import { GetTasksUseCaseImpl, GetTaskByIdUseCaseImpl, CreateTaskUseCaseImpl, UpdateTaskUseCaseImpl, DeleteTaskUseCaseImpl } from "../../domain/use-cases/task-use-cases";
import type { TaskRepository } from "../../domain/repositories/task-repository";

export interface TaskApplicationService {
  getTasks: (userId: string) => Promise<Task[]>;
  getTaskById: (userId: string, taskId: string) => Promise<Task | null>;
  createTask: (userId: string, task: CreateTaskInput) => Promise<Task>;
  updateTask: (userId: string, taskId: string, task: Partial<Task>) => Promise<Task>;
  deleteTask: (userId: string, taskId: string) => Promise<void>;
}

export class TaskApplicationServiceImpl implements TaskApplicationService {
  private getTasksUseCase: GetTasksUseCaseImpl;
  private getTaskByIdUseCase: GetTaskByIdUseCaseImpl;
  private createTaskUseCase: CreateTaskUseCaseImpl;
  private updateTaskUseCase: UpdateTaskUseCaseImpl;
  private deleteTaskUseCase: DeleteTaskUseCaseImpl;

  constructor(taskRepository: TaskRepository) {
    this.getTasksUseCase = new GetTasksUseCaseImpl(taskRepository);
    this.getTaskByIdUseCase = new GetTaskByIdUseCaseImpl(taskRepository);
    this.createTaskUseCase = new CreateTaskUseCaseImpl(taskRepository);
    this.updateTaskUseCase = new UpdateTaskUseCaseImpl(taskRepository);
    this.deleteTaskUseCase = new DeleteTaskUseCaseImpl(taskRepository);
  }

  async getTasks(userId: string): Promise<Task[]> {
    return await this.getTasksUseCase.execute(userId);
  }

  async getTaskById(userId: string, taskId: string): Promise<Task | null> {
    return await this.getTaskByIdUseCase.execute(userId, taskId);
  }

  async createTask(userId: string, task: CreateTaskInput): Promise<Task> {
    return await this.createTaskUseCase.execute(userId, task);
  }

  async updateTask(userId: string, taskId: string, task: Partial<Task>): Promise<Task> {
    return await this.updateTaskUseCase.execute(userId, taskId, task);
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    return await this.deleteTaskUseCase.execute(userId, taskId);
  }
}