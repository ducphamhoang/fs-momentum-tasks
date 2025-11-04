import { useCallback, useState } from 'react';
import { diContainer } from '@/shared/infrastructure/di/container';
import type { User } from '../../domain/entities/user';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await diContainer.authApplicationService.signIn(email, password);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await diContainer.authApplicationService.signUp(email, password);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await diContainer.authApplicationService.signOut();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await diContainer.authApplicationService.sendPasswordReset(email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createUserProfile = useCallback(async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      await diContainer.authApplicationService.createUserProfile(user, userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    createUserProfile,
    loading,
    error,
  };
};