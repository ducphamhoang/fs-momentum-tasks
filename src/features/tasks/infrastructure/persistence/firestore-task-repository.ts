import type { TaskRepository } from "../../domain/repositories/task-repository";
import type { Task, CreateTaskInput, UpdateTaskInput } from "../../domain/task";
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";

export class FirestoreTaskRepository implements TaskRepository {
  private db = initializeFirebase().firestore;

  async getTasks(userId: string): Promise<Task[]> {
    const tasksRef = collection(this.db, "users", userId, "tasks");
    const q = query(tasksRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dueDate: data.dueDate instanceof Date ? data.dueDate : (data.dueDate?.toDate ? data.dueDate.toDate() : data.dueDate),
        createdAt: data.createdAt instanceof Date ? data.createdAt : (data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt),
        updatedAt: data.updatedAt instanceof Date ? data.updatedAt : (data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt),
      } as Task;
    });
  }

  async getTaskById(userId: string, taskId: string): Promise<Task | null> {
    const taskDoc = doc(this.db, "users", userId, "tasks", taskId);
    const docSnapshot = await getDoc(taskDoc);
    
    if (!docSnapshot.exists()) {
      return null;
    }
    
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      ...data,
      dueDate: data?.dueDate instanceof Date ? data.dueDate : (data?.dueDate?.toDate ? data.dueDate.toDate() : data?.dueDate),
      createdAt: data?.createdAt instanceof Date ? data.createdAt : (data?.createdAt?.toDate ? data.createdAt.toDate() : data?.createdAt),
      updatedAt: data?.updatedAt instanceof Date ? data.updatedAt : (data?.updatedAt?.toDate ? data.updatedAt.toDate() : data?.updatedAt),
    } as Task;
  }

  async createTask(userId: string, task: CreateTaskInput): Promise<Task> {
    const tasksRef = collection(this.db, "users", userId, "tasks");
    const docData = {
      ...task,
      userId,
      isCompleted: false, // Default to false when creating a new task
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(tasksRef, docData);
    
    return {
      id: docRef.id,
      ...docData,
      createdAt: new Date(), // Using local date since serverTimestamp will be resolved later
      updatedAt: new Date(),
    } as Task;
  }

  async updateTask(userId: string, taskId: string, task: Partial<Task>): Promise<Task> {
    const taskDoc = doc(this.db, "users", userId, "tasks", taskId);
    const updateData = {
      ...task,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(taskDoc, updateData);
    
    // Get the updated document to return the full task
    const updatedDoc = await getDoc(taskDoc);
    const data = updatedDoc.data();
    
    if (!data) {
      throw new Error(`Task with ID ${taskId} not found after update`);
    }
    
    return {
      id: updatedDoc.id,
      ...data,
      dueDate: data.dueDate instanceof Date ? data.dueDate : (data.dueDate?.toDate ? data.dueDate.toDate() : data.dueDate),
      createdAt: data.createdAt instanceof Date ? data.createdAt : (data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt),
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt : (data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt),
    } as Task;
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const taskDoc = doc(this.db, "users", userId, "tasks", taskId);
    await deleteDoc(taskDoc);
  }
}