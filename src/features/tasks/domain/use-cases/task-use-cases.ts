import type { TaskRepository } from "../repositories/task-repository";
import type { Task, CreateTaskInput, UpdateTaskInput } from "../task";

export interface GetTasksUseCase {
  execute(userId: string): Promise<Task[]>;
}

export class GetTasksUseCaseImpl implements GetTasksUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(userId: string): Promise<Task[]> {
    return await this.taskRepository.getTasks(userId);
  }
}

export interface GetTaskByIdUseCase {
  execute(userId: string, taskId: string): Promise<Task | null>;
}

export class GetTaskByIdUseCaseImpl implements GetTaskByIdUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(userId: string, taskId: string): Promise<Task | null> {
    return await this.taskRepository.getTaskById(userId, taskId);
  }
}

export interface CreateTaskUseCase {
  execute(userId: string, task: CreateTaskInput): Promise<Task>;
}

export class CreateTaskUseCaseImpl implements CreateTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(userId: string, task: CreateTaskInput): Promise<Task> {
    return await this.taskRepository.createTask(userId, task);
  }
}

export interface UpdateTaskUseCase {
  execute(userId: string, taskId: string, task: UpdateTaskInput): Promise<Task>;
}

export class UpdateTaskUseCaseImpl implements UpdateTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(userId: string, taskId: string, task: UpdateTaskInput): Promise<Task> {
    return await this.taskRepository.updateTask(userId, taskId, task);
  }
}

export interface DeleteTaskUseCase {
  execute(userId: string, taskId: string): Promise<void>;
}

export class DeleteTaskUseCaseImpl implements DeleteTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(userId: string, taskId: string): Promise<void> {
    await this.taskRepository.deleteTask(userId, taskId);
  }
}