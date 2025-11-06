import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prioritizeTasksService } from '../../src/features/tasks/application/services/ai/task-ai-service';
import type { Task } from '../../src/features/tasks/domain/task';
import { prioritizeTasks } from '../../src/ai/flows/ai-prioritize-tasks';
import { Timestamp } from 'firebase/firestore';

// Mock the AI flow
vi.mock('../../src/ai/flows/ai-prioritize-tasks', () => ({
  prioritizeTasks: vi.fn(),
}));

describe('AI Prioritization Endpoint - Core Product Feature', () => {
  beforeEach(() => {
    // Setup code before each test
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should prioritize tasks based on due date and importance as per business logic', async () => {
    const mockTasks: Task[] = [
      {
        id: 'task1',
        userId: 'user1',
        title: 'Urgent Task',
        description: 'This task is urgent',
        importanceLevel: 'high',
        dueDate: new Date('2025-11-06'), // Sooner due date
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task2',
        userId: 'user1',
        title: 'Less Urgent Task',
        description: 'This task can wait',
        importanceLevel: 'low',
        dueDate: new Date('2025-11-20'), // Later due date
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Mock the AI response - the core business value of the product
    const mockAiResponse = {
      prioritizedTasks: [
        {
          title: 'Urgent Task',
          suggestedPriority: 1,
          reasoning: 'High importance with earliest due date',
        },
        {
          title: 'Less Urgent Task',
          suggestedPriority: 2,
          reasoning: 'Lower importance with later due date',
        },
      ],
    };

    (prioritizeTasks as any)
      .mockResolvedValue(mockAiResponse);

    const result = await prioritizeTasksService(mockTasks);

    // Verify the correct input is sent to AI - converting Timestamp to ISO string if needed
    expect(prioritizeTasks).toHaveBeenCalledWith({
      tasks: mockTasks.map(task => ({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate instanceof Date ? task.dueDate.toISOString() : (task.dueDate as any)?.toDate?.()?.toISOString() || task.dueDate,
        importanceLevel: task.importanceLevel,
        startTime: task.startTime,
        endTime: task.endTime,
        timeEstimate: task.timeEstimate,
      })),
    });

    // Verify the output structure
    expect(result).toEqual(mockAiResponse);
    expect(result.prioritizedTasks[0].suggestedPriority).toBe(1);
    expect(result.prioritizedTasks[0].title).toBe('Urgent Task');
    expect(result.prioritizedTasks[0].reasoning).toContain('importance');
  });

  it('should handle time-blocked tasks with rescheduling suggestions', async () => {
    const mockTasks: Task[] = [
      {
        id: 'task1',
        userId: 'user1',
        title: 'Meeting',
        description: 'Team sync meeting',
        importanceLevel: 'medium',
        dueDate: new Date('2025-11-06'),
        startTime: '10:00',
        endTime: '11:00',
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task2',
        userId: 'user1',
        title: 'Critical Deadline',
        description: 'Finish important project',
        importanceLevel: 'high',
        dueDate: new Date('2025-11-06'),
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    const mockAiResponse = {
      prioritizedTasks: [
        {
          title: 'Critical Deadline',
          suggestedPriority: 1,
          reasoning: 'High importance task with same due date',
          rescheduleSuggestion: 'Consider rescheduling the meeting to accommodate this critical task',
        },
        {
          title: 'Meeting',
          suggestedPriority: 2,
          reasoning: 'Time-blocked meeting, but critical task has higher priority',
        },
      ],
    };

    (prioritizeTasks as any)
      .mockResolvedValue(mockAiResponse);

    const result = await prioritizeTasksService(mockTasks);

    expect(result).toEqual(mockAiResponse);
    expect(result.prioritizedTasks[0].title).toBe('Critical Deadline');
    expect(result.prioritizedTasks[0]).toHaveProperty('rescheduleSuggestion');
    expect(result.prioritizedTasks[0].rescheduleSuggestion).toContain('meeting');
  });

  it('should handle empty task list gracefully', async () => {
    const mockAiResponse = {
      prioritizedTasks: [],
    };

    (prioritizeTasks as any)
      .mockResolvedValue(mockAiResponse);

    const result = await prioritizeTasksService([]);

    expect(prioritizeTasks).toHaveBeenCalledWith({ tasks: [] });
    expect(result.prioritizedTasks).toHaveLength(0);
  });

  it('should handle AI service errors gracefully', async () => {
    const mockTasks: Task[] = [
      {
        id: 'task1',
        userId: 'user1',
        title: 'Test Task',
        importanceLevel: 'high',
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    (prioritizeTasks as any)
      .mockRejectedValue(new Error('AI Service Error'));

    await expect(prioritizeTasksService(mockTasks))
      .rejects
      .toThrow('AI Service Error');
  });

  it('should properly transform task data for AI input', async () => {
    const mockTask: Task = {
      id: 'task1',
      userId: 'user1',
      title: 'Test Task',
      description: 'Test Description',
      importanceLevel: 'high',
      dueDate: new Date('2025-11-10'),
      startTime: '09:00',
      endTime: '10:00',
      timeEstimate: '1 hour',
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockAiResponse = {
      prioritizedTasks: [{
        title: 'Test Task',
        suggestedPriority: 1,
        reasoning: 'Test reasoning',
      }],
    };

    (prioritizeTasks as any)
      .mockResolvedValue(mockAiResponse);

    await prioritizeTasksService([mockTask]);

    // Verify that the task data is properly formatted for the AI
    expect(prioritizeTasks).toHaveBeenCalledWith({
      tasks: [{
        title: 'Test Task',
        description: 'Test Description',
        dueDate: mockTask.dueDate instanceof Date ? mockTask.dueDate.toISOString() : (mockTask.dueDate as any)?.toDate?.()?.toISOString() || mockTask.dueDate,
        startTime: '09:00',
        endTime: '10:00',
        importanceLevel: 'high',
        timeEstimate: '1 hour',
      }]
    });
  });
});