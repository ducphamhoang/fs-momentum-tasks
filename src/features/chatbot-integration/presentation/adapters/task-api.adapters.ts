'use server';

import { TaskApplicationServiceImpl } from '@/features/tasks/application/services/task-service';
import { FirestoreTaskRepository } from '@/features/tasks/infrastructure/persistence/firestore-task-repository';
import { CreateTaskRequest } from '../../application/dtos/create-task-request.dto';
import { UpdateTaskRequest } from '../../application/dtos/update-task-request.dto';

export async function getTasks(userId: string) {
  try {
    const taskRepository = new FirestoreTaskRepository();
    const taskService = new TaskApplicationServiceImpl(taskRepository);

    const tasks = await taskService.getTasks(userId);

    // Helper to convert Timestamp or Date to ISO string
    const toISOString = (value: any): string => {
      if (!value) return new Date().toISOString();
      if (value.toDate) return value.toDate().toISOString(); // Firestore Timestamp
      return new Date(value).toISOString();
    };

    // Transform tasks to match the expected response format
    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      isCompleted: task.isCompleted,
      importance: task.importanceLevel,
      dueDate: task.dueDate ? toISOString(task.dueDate) : undefined,
      timeEstimate: task.timeEstimate,
      source: task.source || 'web',
      createdAt: toISOString(task.createdAt),
      updatedAt: toISOString(task.updatedAt),
      userId: task.userId,
    }));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw new Error('Failed to fetch tasks');
  }
}

export async function createTask(userId: string, taskData: CreateTaskRequest) {
  try {
    const { title, description, importance, dueDate, timeEstimate } = taskData;

    // Transform to match the existing task format
    const transformedTask = {
      title,
      description,
      isCompleted: false,
      importanceLevel: importance || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      timeEstimate,
      source: 'web' as const,
    };

    const taskRepository = new FirestoreTaskRepository();
    const taskService = new TaskApplicationServiceImpl(taskRepository);

    const newTask = await taskService.createTask(userId, transformedTask);

    // Helper to convert Timestamp or Date to ISO string
    const toISOString = (value: any): string => {
      if (!value) return new Date().toISOString();
      if (value.toDate) return value.toDate().toISOString(); // Firestore Timestamp
      return new Date(value).toISOString();
    };

    // Transform response to match expected format
    return {
      id: newTask.id,
      title: newTask.title,
      description: newTask.description,
      isCompleted: newTask.isCompleted,
      importance: newTask.importanceLevel,
      dueDate: newTask.dueDate ? toISOString(newTask.dueDate) : undefined,
      timeEstimate: newTask.timeEstimate,
      source: newTask.source || 'web',
      createdAt: toISOString(newTask.createdAt),
      updatedAt: toISOString(newTask.updatedAt),
      userId: newTask.userId,
    };
  } catch (error) {
    console.error('Error creating task:', error);
    throw new Error('Failed to create task');
  }
}

export async function updateTask(userId: string, taskId: string, taskData: UpdateTaskRequest) {
  try {
    // Transform to match the existing task format
    const transformedTask: Partial<any> = {};
    if (taskData.title !== undefined) transformedTask.title = taskData.title;
    if (taskData.description !== undefined) transformedTask.description = taskData.description;
    if (taskData.isCompleted !== undefined) transformedTask.isCompleted = taskData.isCompleted;
    if (taskData.importance !== undefined) transformedTask.importanceLevel = taskData.importance;
    if (taskData.dueDate !== undefined) transformedTask.dueDate = new Date(taskData.dueDate);
    if (taskData.timeEstimate !== undefined) transformedTask.timeEstimate = taskData.timeEstimate;

    const taskRepository = new FirestoreTaskRepository();
    const taskService = new TaskApplicationServiceImpl(taskRepository);

    const updatedTask = await taskService.updateTask(userId, taskId, transformedTask);

    // Helper to convert Timestamp or Date to ISO string
    const toISOString = (value: any): string => {
      if (!value) return new Date().toISOString();
      if (value.toDate) return value.toDate().toISOString(); // Firestore Timestamp
      return new Date(value).toISOString();
    };

    // Transform response to match expected format
    return {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      isCompleted: updatedTask.isCompleted,
      importance: updatedTask.importanceLevel,
      dueDate: updatedTask.dueDate ? toISOString(updatedTask.dueDate) : undefined,
      timeEstimate: updatedTask.timeEstimate,
      source: updatedTask.source || 'web',
      createdAt: toISOString(updatedTask.createdAt),
      updatedAt: toISOString(updatedTask.updatedAt),
      userId: updatedTask.userId,
    };
  } catch (error) {
    console.error('Error updating task:', error);
    throw new Error('Failed to update task');
  }
}

export async function deleteTask(userId: string, taskId: string) {
  try {
    const taskRepository = new FirestoreTaskRepository();
    const taskService = new TaskApplicationServiceImpl(taskRepository);

    await taskService.deleteTask(userId, taskId);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new Error('Failed to delete task');
  }
}