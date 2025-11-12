import { FirebaseAuthRepository } from "@/features/auth/infrastructure/auth/firebase-auth-repository";
import { FirestoreTaskRepository } from "@/features/tasks/infrastructure/persistence/firestore-task-repository";
import { AuthApplicationServiceImpl } from "@/features/auth/application/services/auth-service";
import { TaskApplicationServiceImpl } from "@/features/tasks/application/services/task-service";
import { TaskProviderRegistryImpl } from "@/features/tasks/application/services/task-provider-registry";
import { TaskSyncServiceImpl } from "@/features/tasks/application/services/task-sync-service";
import { ReminderServiceImpl } from "@/features/tasks/application/services/reminder-service";
import { FirestoreVerificationCodeRepository } from "@/features/chatbot-integration/infrastructure/persistence/firestore-verification-code-repository";
import { FirestoreChatbotSessionRepository } from "@/features/chatbot-integration/infrastructure/persistence/firestore-chatbot-session-repository";
import { JsonwebtokenService } from "@/features/chatbot-integration/infrastructure/jwt/jsonwebtoken-service";
import { ChatbotAuthService } from "@/features/chatbot-integration/application/services/chatbot-auth-service";

// Container for application services
class DIContainer {
  // Auth services
  private _authRepository: FirebaseAuthRepository | null = null;
  private _authApplicationService: AuthApplicationServiceImpl | null = null;

  // Task services
  private _taskRepository: FirestoreTaskRepository | null = null;
  private _taskApplicationService: TaskApplicationServiceImpl | null = null;
  private _taskProviderRegistry: TaskProviderRegistryImpl | null = null;
  private _taskSyncService: TaskSyncServiceImpl | null = null;
  private _reminderService: ReminderServiceImpl | null = null;

  // Chatbot integration services
  private _verificationCodeRepository: FirestoreVerificationCodeRepository | null = null;
  private _chatbotSessionRepository: FirestoreChatbotSessionRepository | null = null;
  private _jsonwebtokenService: JsonwebtokenService | null = null;
  private _chatbotAuthService: ChatbotAuthService | null = null;

  // Auth services
  get authRepository(): FirebaseAuthRepository {
    if (!this._authRepository) {
      this._authRepository = new FirebaseAuthRepository();
    }
    return this._authRepository;
  }

  get authApplicationService(): AuthApplicationServiceImpl {
    if (!this._authApplicationService) {
      this._authApplicationService = new AuthApplicationServiceImpl(this.authRepository);
    }
    return this._authApplicationService;
  }

  // Task services
  get taskRepository(): FirestoreTaskRepository {
    if (!this._taskRepository) {
      this._taskRepository = new FirestoreTaskRepository();
    }
    return this._taskRepository;
  }

  get taskApplicationService(): TaskApplicationServiceImpl {
    if (!this._taskApplicationService) {
      this._taskApplicationService = new TaskApplicationServiceImpl(this.taskRepository);
    }
    return this._taskApplicationService;
  }

  get taskProviderRegistry(): TaskProviderRegistryImpl {
    if (!this._taskProviderRegistry) {
      this._taskProviderRegistry = new TaskProviderRegistryImpl();
      // Note: Providers should be registered externally (e.g., in bootstrap/initialization)
      // The registry starts empty and providers are added as needed
    }
    return this._taskProviderRegistry;
  }

  get taskSyncService(): TaskSyncServiceImpl {
    if (!this._taskSyncService) {
      this._taskSyncService = new TaskSyncServiceImpl(this.taskRepository);
    }
    return this._taskSyncService;
  }

  get reminderService(): ReminderServiceImpl {
    if (!this._reminderService) {
      this._reminderService = new ReminderServiceImpl(this.taskRepository);
    }
    return this._reminderService;
  }

  // Chatbot integration services
  get verificationCodeRepository(): FirestoreVerificationCodeRepository {
    if (!this._verificationCodeRepository) {
      this._verificationCodeRepository = new FirestoreVerificationCodeRepository();
    }
    return this._verificationCodeRepository;
  }

  get chatbotSessionRepository(): FirestoreChatbotSessionRepository {
    if (!this._chatbotSessionRepository) {
      this._chatbotSessionRepository = new FirestoreChatbotSessionRepository();
    }
    return this._chatbotSessionRepository;
  }

  get jsonwebtokenService(): JsonwebtokenService {
    if (!this._jsonwebtokenService) {
      this._jsonwebtokenService = new JsonwebtokenService();
    }
    return this._jsonwebtokenService;
  }

  get chatbotAuthService(): ChatbotAuthService {
    if (!this._chatbotAuthService) {
      this._chatbotAuthService = new ChatbotAuthService({
        verificationCodeRepository: this.verificationCodeRepository,
        chatbotSessionRepository: this.chatbotSessionRepository,
        jwtService: this.jsonwebtokenService,
      });
    }
    return this._chatbotAuthService;
  }
}

export const diContainer = new DIContainer();