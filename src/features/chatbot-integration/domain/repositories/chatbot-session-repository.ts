import { ChatbotSession } from '../entities/chatbot-session';

export interface ChatbotSessionRepository {
  create(session: ChatbotSession): Promise<void>;
  findById(id: string): Promise<ChatbotSession | null>;
  findByUserId(userId: string): Promise<ChatbotSession | null>;
  findByToken(token: string): Promise<ChatbotSession | null>;
  update(session: ChatbotSession): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}