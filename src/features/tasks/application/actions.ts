"use server";

import { revalidatePath } from "next/cache";
import { getTasksAction, prioritizeTasks as aiPrioritizeTasks } from "./ai-task-service";
import type { PrioritizeTasksInput } from "@/ai/flows/ai-prioritize-tasks";

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
        const result = await aiPrioritizeTasks(aiInput);
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
