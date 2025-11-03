'use server';
/**
 * @fileOverview This file defines a Genkit flow for prioritizing tasks based on deadlines, time estimates, and importance levels.
 *
 * - prioritizeTasks - A function that accepts task details and suggests a prioritization.
 * - PrioritizeTasksInput - The input type for the prioritizeTasks function.
 * - PrioritizeTasksOutput - The return type for the prioritizeTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrioritizeTasksInputSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string().describe('The title of the task.'),
      description: z.string().optional().describe('A detailed description of the task.'),
      dueDate: z.string().optional().describe('The due date of the task (ISO format).'),
      startTime: z.string().optional().describe('The start time of the task (ISO format).'),
      endTime: z.string().optional().describe('The end time of the task (ISO format).'),
      importanceLevel: z
        .enum(['high', 'medium', 'low'])
        .describe('The importance level of the task.'),
      timeEstimate: z
        .string()
        .optional()
        .describe('Estimated time to complete the task (e.g., 1 hour, 30 minutes).'),
    })
  ).describe('An array of task objects to be prioritized.'),
});
export type PrioritizeTasksInput = z.infer<typeof PrioritizeTasksInputSchema>;

const PrioritizeTasksOutputSchema = z.object({
  prioritizedTasks: z.array(
    z.object({
      title: z.string().describe('The title of the task.'),
      suggestedPriority: z.number().describe('The suggested priority of the task (lower is higher priority).'),
      reasoning: z.string().describe('The reasoning behind the suggested priority.'),
      rescheduleSuggestion: z
        .string()
        .optional()
        .describe('A suggestion to reschedule the task, if applicable.'),
    })
  ).describe('An array of tasks with suggested priorities and reasoning.'),
});
export type PrioritizeTasksOutput = z.infer<typeof PrioritizeTasksOutputSchema>;

export async function prioritizeTasks(input: PrioritizeTasksInput): Promise<PrioritizeTasksOutput> {
  return prioritizeTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'prioritizeTasksPrompt',
  input: {schema: PrioritizeTasksInputSchema},
  output: {schema: PrioritizeTasksOutputSchema},
  prompt: `You are an AI task prioritization assistant. You will be given a list of tasks with their titles, descriptions, due dates, start and end times (if applicable), importance levels, and time estimates.

  Your goal is to suggest a priority for each task, taking into account all available information. Tasks with earlier due dates and higher importance levels should generally be prioritized higher (lower number indicates higher priority).

  If a task has both a start and end time, it is considered a time-blocked meeting. If a new urgent task emerges and conflicts with a time-blocked meeting, you should suggest rescheduling the meeting to accommodate the new task. Prioritize the time-blocked task lower and provide a rescheduleSuggestion.

  Here are the tasks:
  {{#each tasks}}
  - Title: {{title}}
    Description: {{description}}
    Due Date: {{dueDate}}
    Start Time: {{startTime}}
    End Time: {{endTime}}
    Importance Level: {{importanceLevel}}
    Time Estimate: {{timeEstimate}}
  {{/each}}

  Prioritize the tasks and provide a brief reasoning for each suggested priority. Respond in JSON format.
  {
    "prioritizedTasks": [
      {{#each tasks}}
      {
        "title": "{{title}}",
        "suggestedPriority": , // Provide a number
        "reasoning": "", // Explain the priority.
        "rescheduleSuggestion": "" // Suggest reschedule if applicable.
      },
      {{/each}}
    ]
  }
  `,
});

const prioritizeTasksFlow = ai.defineFlow(
  {
    name: 'prioritizeTasksFlow',
    inputSchema: PrioritizeTasksInputSchema,
    outputSchema: PrioritizeTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
