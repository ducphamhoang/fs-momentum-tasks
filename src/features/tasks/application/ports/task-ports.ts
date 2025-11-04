import type { TaskRepository } from "../../domain/repositories/task-repository";

export interface ITaskService {
  taskRepository: TaskRepository;
}