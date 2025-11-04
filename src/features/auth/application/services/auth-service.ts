import type { User } from "../../domain/entities/user";
import { SignInUseCaseImpl, SignUpUseCaseImpl, SignOutUseCaseImpl, PasswordResetUseCaseImpl, CreateUserUseCaseImpl } from "../../domain/use-cases/auth-use-cases";
import type { AuthRepository } from "../../domain/repositories/auth-repository";

export interface AuthApplicationService {
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  createUserProfile: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, userId: string) => Promise<void>;
}

export class AuthApplicationServiceImpl implements AuthApplicationService {
  private signInUseCase: SignInUseCaseImpl;
  private signUpUseCase: SignUpUseCaseImpl;
  private signOutUseCase: SignOutUseCaseImpl;
  private passwordResetUseCase: PasswordResetUseCaseImpl;
  private createUserUseCase: CreateUserUseCaseImpl;

  constructor(authRepository: AuthRepository) {
    this.signInUseCase = new SignInUseCaseImpl(authRepository);
    this.signUpUseCase = new SignUpUseCaseImpl(authRepository);
    this.signOutUseCase = new SignOutUseCaseImpl(authRepository);
    this.passwordResetUseCase = new PasswordResetUseCaseImpl(authRepository);
    this.createUserUseCase = new CreateUserUseCaseImpl(authRepository);
  }

  async signIn(email: string, password: string): Promise<User> {
    return await this.signInUseCase.execute(email, password);
  }

  async signUp(email: string, password: string): Promise<User> {
    return await this.signUpUseCase.execute(email, password);
  }

  async signOut(): Promise<void> {
    return await this.signOutUseCase.execute();
  }

  async sendPasswordReset(email: string): Promise<void> {
    return await this.passwordResetUseCase.execute(email);
  }

  async createUserProfile(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<void> {
    return await this.createUserUseCase.execute(user, userId);
  }
}