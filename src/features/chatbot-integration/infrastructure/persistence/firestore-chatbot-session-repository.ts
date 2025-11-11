import { initializeFirebase } from '@/firebase';
import { ChatbotSession } from '../../domain/entities/chatbot-session';
import { ChatbotSessionRepository } from '../../domain/repositories/chatbot-session-repository';

export class FirestoreChatbotSessionRepository implements ChatbotSessionRepository {
  private readonly collectionName = 'chatbotSessions';
  private readonly db = initializeFirebase().firestore;

  async create(session: ChatbotSession): Promise<void> {
    const ref = this.db.collection(this.collectionName).doc(session.id);
    await ref.set({
      id: session.id,
      userId: session.userId,
      telegramUserId: session.telegramUserId,
      token: session.token,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
    });
  }

  async findById(id: string): Promise<ChatbotSession | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return new ChatbotSession({
      id: data?.id,
      userId: data?.userId,
      telegramUserId: data?.telegramUserId,
      token: data?.token,
      createdAt: (data?.createdAt as any).toDate ? (data?.createdAt as any).toDate() : data?.createdAt,
      expiresAt: (data?.expiresAt as any).toDate ? (data?.expiresAt as any).toDate() : data?.expiresAt,
      isActive: data?.isActive || false,
    });
  }

  async findByUserId(userId: string): Promise<ChatbotSession | null> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return new ChatbotSession({
      id: data?.id,
      userId: data?.userId,
      telegramUserId: data?.telegramUserId,
      token: data?.token,
      createdAt: (data?.createdAt as any).toDate ? (data?.createdAt as any).toDate() : data?.createdAt,
      expiresAt: (data?.expiresAt as any).toDate ? (data?.expiresAt as any).toDate() : data?.expiresAt,
      isActive: data?.isActive || false,
    });
  }

  async findByToken(token: string): Promise<ChatbotSession | null> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('token', '==', token)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return new ChatbotSession({
      id: data?.id,
      userId: data?.userId,
      telegramUserId: data?.telegramUserId,
      token: data?.token,
      createdAt: (data?.createdAt as any).toDate ? (data?.createdAt as any).toDate() : data?.createdAt,
      expiresAt: (data?.expiresAt as any).toDate ? (data?.expiresAt as any).toDate() : data?.expiresAt,
      isActive: data?.isActive || false,
    });
  }

  async update(session: ChatbotSession): Promise<void> {
    const ref = this.db.collection(this.collectionName).doc(session.id);
    await ref.update({
      isActive: session.isActive,
    });
  }

  async delete(id: string): Promise<void> {
    const ref = this.db.collection(this.collectionName).doc(id);
    await ref.delete();
  }

  async deleteByUserId(userId: string): Promise<void> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where('userId', '==', userId)
      .get();

    const batch = this.db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  }
}