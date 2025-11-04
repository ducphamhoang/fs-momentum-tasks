// Shared database service
import { getFirestore, type Firestore } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";

class SharedDatabaseService {
  private _db: Firestore | null = null;

  get db(): Firestore {
    if (!this._db) {
      this._db = initializeFirebase().firestore;
    }
    return this._db;
  }
}

export const sharedDatabaseService = new SharedDatabaseService();