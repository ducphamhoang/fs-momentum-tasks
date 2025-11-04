import type { AuthRepository } from "../../domain/repositories/auth-repository";

export interface IAuthService {
  authRepository: AuthRepository;
}