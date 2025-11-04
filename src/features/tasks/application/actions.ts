"use server";

import { revalidatePath } from "next/cache";
import { prioritizeTasks } from "./ai-task-service";

export async function prioritizeTasksAction() {
    try {
        const result = await prioritizeTasks();
        return result;
    } catch (error) {
        console.error("AI Prioritization Error:", error);
        throw new Error("Failed to get prioritization from AI.");
    }
}

// This function is kept to trigger revalidation from client components
// after they perform a mutation.
export async function revalidateTasks() {
    revalidatePath("/");
}
