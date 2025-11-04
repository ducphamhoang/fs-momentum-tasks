'use server';

import { prioritizeTasks, type PrioritizeTasksInput, type PrioritizeTasksOutput } from "@/ai/flows/ai-prioritize-tasks";
import type { Task } from "../../../domain/task";

export interface TaskAIService {
  prioritizeTasks: (tasks: Task[]) => Promise<PrioritizeTasksOutput>;
}

export class TaskAIServiceImpl implements TaskAIService {
  async prioritizeTasks(tasks: Task[]): Promise<PrioritizeTasksOutput> {
    const uncompletedTasks = tasks.filter(task => !task.isCompleted);

    if (uncompletedTasks.length === 0) {
        return { prioritizedTasks: [] };
    }

    const aiInput: PrioritizeTasksInput = {
        tasks: uncompletedTasks.map(task => ({
            title: task.title,
            description: task.description || "",
            dueDate: task.dueDate ? 
              (task.dueDate instanceof Date ? task.dueDate.toISOString() : task.dueDate.toDate().toISOString()) 
              : undefined,
            startTime: task.startTime || "",
            endTime: task.endTime || "",
            importanceLevel: task.importanceLevel,
            timeEstimate: task.timeEstimate || "",
        }))
    };

    try {
        return await prioritizeTasks(aiInput);
    } catch (error) {
        console.error("AI Prioritization Error:", error);
        throw new Error("Failed to get prioritization from AI.");
    }
  }
}