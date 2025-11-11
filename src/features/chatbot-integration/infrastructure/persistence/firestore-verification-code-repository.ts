import { initializeFirebase } from '@/firebase';
import { VerificationCode } from '../../domain/entities/verification-code';
import { VerificationCodeRepository } from '../../domain/repositories/verification-code-repository';

export class FirestoreVerificationCodeRepository implements VerificationCodeRepository {
  private readonly collectionName = 'verificationCodes';
  private readonly db = initializeFirebase().firestore;

  async create(code: VerificationCode): Promise<void> {
    const ref = this.db.collection(this.collectionName).doc(code.id);
    await ref.set({
      id: code.id,
      code: code.code,
      userId: code.userId,
      createdAt: code.createdAt,
      expiresAt: code.expiresAt,
      usedAt: code.usedAt || null,
      isUsed: code.isUsed,
    });
  }

  async findById(id: string): Promise<VerificationCode | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return new VerificationCode({
      id: data?.id,
      code: data?.code,
      userId: data?.userId,
      createdAt: (data?.createdAt as any).toDate ? (data?.createdAt as any).toDate() : data?.createdAt,
      expiresAt: (data?.expiresAt as any).toDate ? (data?.expiresAt as any).toDate() : data?.expiresAt,
      usedAt: data?.usedAt ? ((data?.usedAt as any).toDate ? (data?.usedAt as any).toDate() : data?.usedAt) : undefined,
      isUsed: data?.isUsed || false,
    });
  }

  async findByCode(code: string): Promise<VerificationCode | null> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('code', '==', code)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return new VerificationCode({
      id: data?.id,
      code: data?.code,
      userId: data?.userId,
      createdAt: (data?.createdAt as any).toDate ? (data?.createdAt as any).toDate() : data?.createdAt,
      expiresAt: (data?.expiresAt as any).toDate ? (data?.expiresAt as any).toDate() : data?.expiresAt,
      usedAt: data?.usedAt ? ((data?.usedAt as any).toDate ? (data?.usedAt as any).toDate() : data?.usedAt) : undefined,
      isUsed: data?.isUsed || false,
    });
  }

  async findByUserId(userId: string): Promise<VerificationCode | null> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return new VerificationCode({
      id: data?.id,
      code: data?.code,
      userId: data?.userId,
      createdAt: (data?.createdAt as any).toDate ? (data?.createdAt as any).toDate() : data?.createdAt,
      expiresAt: (data?.expiresAt as any).toDate ? (data?.expiresAt as any).toDate() : data?.expiresAt,
      usedAt: data?.usedAt ? ((data?.usedAt as any).toDate ? (data?.usedAt as any).toDate() : data?.usedAt) : undefined,
      isUsed: data?.isUsed || false,
    });
  }

  async update(code: VerificationCode): Promise<void> {
    const ref = this.db.collection(this.collectionName).doc(code.id);
    await ref.update({
      usedAt: code.usedAt,
      isUsed: code.isUsed,
    });
  }

  async delete(id: string): Promise<void> {
    const ref = this.db.collection(this.collectionName).doc(id);
    await ref.delete();
  }
}