import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  type Firestore,
  Timestamp,
} from "firebase/firestore";
import { type Notification } from "../../domain/notification";
import { type NotificationRepository } from "../../domain/repositories/notification-repository";

export class FirestoreNotificationRepository implements NotificationRepository {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    const q = query(
      collection(this.db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
  }

  async getUnreadCount(userId: string): Promise<number> {
    const q = query(
      collection(this.db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notificationRef = doc(this.db, "notifications", notificationId);
    await updateDoc(notificationRef, { read: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      collection(this.db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(this.db);

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const notificationRef = doc(this.db, "notifications", notificationId);
    await deleteDoc(notificationRef);
  }

  async deleteAll(userId: string): Promise<void> {
    const q = query(
      collection(this.db, "notifications"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(this.db);

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void
  ): () => void {
    const q = query(
      collection(this.db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];

      callback(notifications);
    });
  }
}
