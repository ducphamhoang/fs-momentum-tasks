"use server";

import { revalidatePath } from "next/cache";
import { auth, db } from "@/shared/infrastructure/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { CreateTaskInput, CreateTaskSchema, Task, UpdateTaskInput, UpdateTaskSchema } from "../domain/task";
import { prioritizeTasks, type PrioritizeTasksInput } from "@/ai/flows/ai-prioritize-tasks";

function getAuthenticatedUserId() {
    const user = auth.currentUser;
    if (!user) throw new Error("You must be logged in to perform this action.");
    return user.uid;
}

export async function getTasksAction(): Promise<Task[]> {
  const userId = getAuthenticatedUserId();
  const q = query(collection(db, "tasks"), where("userId", "==", userId));
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
  const userId = getAuthenticatedUserId();
  const validatedInput = CreateTaskSchema.parse(input);
  
  const taskData = {
      ...validatedInput,
      userId,
      isCompleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      dueDate: validatedInput.dueDate ? Timestamp.fromDate(validatedInput.dueDate) : null,
  };

  await addDoc(collection(db, "tasks"), taskData);
  revalidatePath("/");
}

export async function updateTaskAction(input: UpdateTaskInput) {
    const userId = getAuthenticatedUserId();
    const { id, ...dataToUpdate } = UpdateTaskSchema.parse(input);

    if(!id) throw new Error("Task ID is required for updates.");
    
    const taskRef = doc(db, "tasks", id);
    // You might want to add a security check here to ensure the user owns the task
    
    const updatePayload: Record<string, any> = {
        ...dataToUpdate,
        updatedAt: serverTimestamp(),
    };

    if (dataToUpdate.dueDate) {
        updatePayload.dueDate = Timestamp.fromDate(dataToUpdate.dueDate);
    }

    await updateDoc(taskRef, updatePayload);
    revalidatePath("/");
}

export async function deleteTaskAction(taskId: string) {
    getAuthenticatedUserId();
    if(!taskId) throw new Error("Task ID is required for deletion.");
    // You might want to add a security check here to ensure the user owns the task
    await deleteDoc(doc(db, "tasks", taskId));
    revalidatePath("/");
}

export async function toggleTaskCompletionAction(taskId: string, isCompleted: boolean) {
    getAuthenticatedUserId();
    if(!taskId) throw new Error("Task ID is required.");
    const taskRef = doc(db, "tasks", taskId);
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
