// Shared auth service to be used across features
import { getAuth, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { initializeFirebase } from "@/firebase";
import type { User } from "@/features/auth/domain/entities/user";

class SharedAuthService {
  private auth = initializeFirebase().auth;

  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(this.auth, (firebaseUser: FirebaseUser | null) => {
      callback(firebaseUser ? this.mapFirebaseUserToUser(firebaseUser) : null);
    });
  }

  private mapFirebaseUserToUser(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || "",
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime) : undefined,
      updatedAt: firebaseUser.metadata.lastSignInTime ? new Date(firebaseUser.metadata.lastSignInTime) : undefined,
    };
  }
}

export const sharedAuthService = new SharedAuthService();