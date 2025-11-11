import { VerificationCode } from '../entities/verification-code';

export interface VerificationCodeRepository {
  create(code: VerificationCode): Promise<void>;
  findById(id: string): Promise<VerificationCode | null>;
  findByCode(code: string): Promise<VerificationCode | null>;
  findByUserId(userId: string): Promise<VerificationCode | null>;
  update(code: VerificationCode): Promise<void>;
  delete(id: string): Promise<void>;
}