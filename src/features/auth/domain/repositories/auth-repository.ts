import type { User } from "../entities/user";

export interface AuthRepository {
  getCurrentUser(): User | null;
  signInWithEmailAndPassword(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  signUpWithEmailAndPassword(email: string, password: string): Promise<User>;
  sendPasswordResetEmail(email: string): Promise<void>;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
  createUserProfile(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<void>;
}