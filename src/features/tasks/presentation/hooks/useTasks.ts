import { useCallback, useState } from 'react';
import { diContainer } from '@/shared/infrastructure/di/container';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../domain/task';

export const useTasks = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTasks = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await diContainer.taskApplicationService.getTasks(userId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTaskById = useCallback(async (userId: string, taskId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await diContainer.taskApplicationService.getTaskById(userId, taskId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (userId: string, task: CreateTaskInput) => {
    setLoading(true);
    setError(null);
    try {
      const result = await diContainer.taskApplicationService.createTask(userId, task);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTask = useCallback(async (userId: string, taskId: string, task: Partial<Task>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await diContainer.taskApplicationService.updateTask(userId, taskId, task);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTask = useCallback(async (userId: string, taskId: string) => {
    setLoading(true);
    setError(null);
    try {
      await diContainer.taskApplicationService.deleteTask(userId, taskId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    loading,
    error,
  };
};