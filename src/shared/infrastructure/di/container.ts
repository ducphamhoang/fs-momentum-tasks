import { FirebaseAuthRepository } from "@/features/auth/infrastructure/auth/firebase-auth-repository";
import { FirestoreTaskRepository } from "@/features/tasks/infrastructure/persistence/firestore-task-repository";
import { AuthApplicationServiceImpl } from "@/features/auth/application/services/auth-service";
import { TaskApplicationServiceImpl } from "@/features/tasks/application/services/task-service";

// Container for application services
class DIContainer {
  // Auth services
  private _authRepository: FirebaseAuthRepository | null = null;
  private _authApplicationService: AuthApplicationServiceImpl | null = null;

  // Task services
  private _taskRepository: FirestoreTaskRepository | null = null;
  private _taskApplicationService: TaskApplicationServiceImpl | null = null;

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
}

export const diContainer = new DIContainer();