"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/shared/infrastructure/firebase-admin";
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp, getDoc } from "firebase/firestore";
import { db } from "@/shared/infrastructure/firebase";
import { CreateTaskSchema, type Task, type CreateTaskInput, type UpdateTaskInput, UpdateTaskSchema } from "../domain/task";
import { prioritizeTasks, type PrioritizeTasksInput } from "@/ai/flows/ai-prioritize-tasks";

async function getAuthenticatedUserId() {
    const idToken = headers().get("Authorization")?.split("Bearer ")[1];
    if (!idToken) {
        throw new Error("You must be logged in to perform this action.");
    }
    try {
        const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying ID token:", error);
        throw new Error("Invalid session. Please log in again.");
    }
}

export async function getTasksAction(): Promise<Task[]> {
  const userId = await getAuthenticatedUserId();
  const tasksRef = collection(db, "users", userId, "tasks");
  const q = query(tasksRef);
  const querySnapshot = await getDocs(q);
  const tasks = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dueDate: data.dueDate?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Task;
  });
  return tasks.sort((a, b) => (a.isCompleted ? 1 : -1) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createTaskAction(input: CreateTaskInput) {
  const userId = await getAuthenticatedUserId();
  const validatedInput = CreateTaskSchema.parse(input);
  
  const taskData = {
      ...validatedInput,
      userId,
      isCompleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      dueDate: validatedInput.dueDate ? Timestamp.fromDate(validatedInput.dueDate) : null,
  };

  await addDoc(collection(db, "users", userId, "tasks"), taskData);
  revalidatePath("/");
}

export async function updateTaskAction(input: UpdateTaskInput) {
    const userId = await getAuthenticatedUserId();
    const { id, ...dataToUpdate } = UpdateTaskSchema.parse(input);

    if(!id) throw new Error("Task ID is required for updates.");
    
    const taskRef = doc(db, "users", userId, "tasks", id);
    
    const updatePayload: Record<string, any> = {
        ...dataToUpdate,
        updatedAt: serverTimestamp(),
    };

    if (dataToUpdate.dueDate) {
        updatePayload.dueDate = Timestamp.fromDate(dataToUpdate.dueDate);
    } else if (dataToUpdate.dueDate === null) {
        updatePayload.dueDate = null;
    }

    await updateDoc(taskRef, updatePayload);
    revalidatePath("/");
}

export async function deleteTaskAction(taskId: string) {
    const userId = await getAuthenticatedUserId();
    if(!taskId) throw new Error("Task ID is required for deletion.");
    await deleteDoc(doc(db, "users", userId, "tasks", taskId));
    revalidatePath("/");
}

export async function toggleTaskCompletionAction(taskId: string, isCompleted: boolean) {
    const userId = await getAuthenticatedUserId();
    if(!taskId) throw new Error("Task ID is required.");
    const taskRef = doc(db, "users", userId, "tasks", taskId);
    await updateDoc(taskRef, {
        isCompleted: isCompleted,
        updatedAt: serverTimestamp(),
    });
    revalidatePath("/");
}


export async function prioritizeTasksAction() {
    const tasks = await getTasksAction();
    const uncompletedTasks = tasks.filter(task => !task.isCompleted);

    if (uncompletedTasks.length === 0) {
        return { prioritizedTasks: [] };
    }

    const aiInput: PrioritizeTasksInput = {
        tasks: uncompletedTasks.map(task => ({
            title: task.title,
            description: task.description,
            dueDate: task.dueDate?.toISOString(),
            startTime: task.startTime,
            endTime: task.endTime,
            importanceLevel: task.importanceLevel,
            timeEstimate: task.timeEstimate,
        }))
    };

    try {
        const result = await prioritizeTasks(aiInput);
        return result;
    } catch (error) {
        console.error("AI Prioritization Error:", error);
        throw new Error("Failed to get prioritization from AI.");
    }
}
