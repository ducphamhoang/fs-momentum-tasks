import type { AuthRepository } from "../../domain/repositories/auth-repository";
import type { User } from "../../domain/entities/user";
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged as firebaseOnAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { initializeFirebase } from "@/firebase";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

export class FirebaseAuthRepository implements AuthRepository {
  private auth = initializeFirebase().auth;
  private db = initializeFirebase().firestore;

  getCurrentUser(): User | null {
    const firebaseUser = this.auth.currentUser;
    return firebaseUser ? this.mapFirebaseUserToUser(firebaseUser) : null;
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<User> {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    return this.mapFirebaseUserToUser(result.user);
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  async signUpWithEmailAndPassword(email: string, password: string): Promise<User> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    const firebaseUser = result.user;
    
    // Create user profile document in Firestore
    await this.createUserProfile({
      email: firebaseUser.email || "",
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
    }, firebaseUser.uid);
    
    return this.mapFirebaseUserToUser(firebaseUser);
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return firebaseOnAuthStateChanged(this.auth, (firebaseUser: FirebaseUser | null) => {
      callback(firebaseUser ? this.mapFirebaseUserToUser(firebaseUser) : null);
    });
  }

  async createUserProfile(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<void> {
    const userDoc = doc(this.db, "users", userId);
    await setDoc(userDoc, {
      ...user,
      id: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
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