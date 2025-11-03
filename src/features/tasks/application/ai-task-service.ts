"use server";

import { headers } from "next/headers";
import { getAuth } from "firebase-admin";
import { initializeApp, getApps, App } from "firebase-admin/app";
import { getFirestore, collection, getDocs, query, Timestamp } from "firebase-admin/firestore";
import { prioritizeTasks as aiPrioritizeTasks } from "@/ai/flows/ai-prioritize-tasks";
import type { Task } from "../domain/task";

function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0]!;
    }
    
    if (process.env.NODE_ENV === 'development') {
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||= './.firebase/service-account.json';
    }

    return initializeApp();
}


async function getAuthenticatedUserId() {
    const idToken = headers().get("Authorization")?.split("Bearer ")[1];
    if (!idToken) {
        throw new Error("You must be logged in to perform this action.");
    }
    try {
        const adminApp = getAdminApp();
        const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying ID token:", error);
        throw new Error("Invalid session. Please log in again.");
    }
}

export async function getTasksAction(): Promise<Task[]> {
  const userId = await getAuthenticatedUserId();
  const adminApp = getAdminApp();
  const db = getFirestore(adminApp);
  const tasksRef = collection(db, "users", userId, "tasks");
  const q = query(tasksRef);
  const querySnapshot = await getDocs(q);
  
  const tasks = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Convert Firestore Timestamps to JS Dates
      dueDate: (data.dueDate as Timestamp | undefined)?.toDate(),
      createdAt: (data.createdAt as Timestamp | undefined)?.toDate(),
      updatedAt: (data.updatedAt as Timestamp | undefined)?.toDate(),
    } as Task;
  });

  return tasks;
}

export const prioritizeTasks = aiPrioritizeTasks;
