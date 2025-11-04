import type { AuthRepository } from "../repositories/auth-repository";
import type { User } from "../entities/user";

export interface SignInUseCase {
  execute(email: string, password: string): Promise<User>;
}

export class SignInUseCaseImpl implements SignInUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(email: string, password: string): Promise<User> {
    return await this.authRepository.signInWithEmailAndPassword(email, password);
  }
}

export interface SignUpUseCase {
  execute(email: string, password: string): Promise<User>;
}

export class SignUpUseCaseImpl implements SignUpUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(email: string, password: string): Promise<User> {
    return await this.authRepository.signUpWithEmailAndPassword(email, password);
  }
}

export interface SignOutUseCase {
  execute(): Promise<void>;
}

export class SignOutUseCaseImpl implements SignOutUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(): Promise<void> {
    await this.authRepository.signOut();
  }
}

export interface PasswordResetUseCase {
  execute(email: string): Promise<void>;
}

export class PasswordResetUseCaseImpl implements PasswordResetUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(email: string): Promise<void> {
    await this.authRepository.sendPasswordResetEmail(email);
  }
}

export interface CreateUserUseCase {
  execute(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<void>;
}

export class CreateUserUseCaseImpl implements CreateUserUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<void> {
    await this.authRepository.createUserProfile(user, userId);
  }
}