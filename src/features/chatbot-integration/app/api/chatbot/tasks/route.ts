import { NextRequest, NextResponse } from 'next/server';
import { withAuth, composeMiddleware } from '@/features/chatbot-integration/presentation/middleware';
import { logApiRequest } from '@/features/chatbot-integration/presentation/middleware/logging.middleware';
import { defaultRateLimit } from '@/features/chatbot-integration/presentation/middleware/rate-limit.middleware';
import { TaskApplicationServiceImpl } from '@/features/tasks/application/services/task-service';
import { FirestoreTaskRepository } from '@/features/tasks/infrastructure/persistence/firestore-task-repository';
import { CreateTaskRequestSchema } from '@/features/chatbot-integration/application/dtos/validation-schemas';

const middleware = composeMiddleware(
  async (req) => { logApiRequest(req); return null; },
  defaultRateLimit
);

function sanitizeInput(input: string | undefined): string | undefined {
  if (!input) return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

export const GET = withAuth(
  async (context) => {
    const { userId } = context;

    try {
      const taskRepository = new FirestoreTaskRepository();
      const taskService = new TaskApplicationServiceImpl(taskRepository);
      const tasks = await taskService.getTasks(userId);

      const transformedTasks = tasks.map(task => {
        // Helper to convert Timestamp or Date to ISO string
        const toISOString = (value: any): string => {
          if (!value) return new Date().toISOString();
          if (value.toDate) return value.toDate().toISOString(); // Firestore Timestamp
          return new Date(value).toISOString();
        };

        return {
          id: task.id,
          title: task.title,
          description: task.description,
          isCompleted: task.isCompleted,
          importance: task.importanceLevel,
          dueDate: task.dueDate ? toISOString(task.dueDate) : undefined,
          timeEstimate: task.timeEstimate,
          source: task.source || 'web',
          createdAt: toISOString(task.createdAt),
          updatedAt: toISOString(task.updatedAt),
        };
      });

      return NextResponse.json({ tasks: transformedTasks, total: transformedTasks.length });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
  },
  middleware
);

export const POST = withAuth(
  async (context) => {
    const { userId, request } = context;

    try {
      const body = await request.json();

      const sanitizedBody = {
        ...body,
        title: sanitizeInput(body.title),
        description: sanitizeInput(body.description),
      };

      const validationResult = CreateTaskRequestSchema.safeParse(sanitizedBody);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { title, description, importance, dueDate, timeEstimate } = validationResult.data;

      const transformedTask = {
        title,
        description,
        isCompleted: false,
        importanceLevel: importance || 'medium',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        timeEstimate,
        source: 'chatbot' as const,
      };

      const taskRepository = new FirestoreTaskRepository();
      const taskService = new TaskApplicationServiceImpl(taskRepository);
      const newTask = await taskService.createTask(userId, transformedTask);

      // Helper to convert Timestamp or Date to ISO string
      const toISOString = (value: any): string => {
        if (!value) return new Date().toISOString();
        if (value.toDate) return value.toDate().toISOString(); // Firestore Timestamp
        return new Date(value).toISOString();
      };

      const responseTask = {
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        isCompleted: newTask.isCompleted,
        importance: newTask.importanceLevel,
        dueDate: newTask.dueDate ? toISOString(newTask.dueDate) : undefined,
        timeEstimate: newTask.timeEstimate,
        source: newTask.source || 'chatbot',
        createdAt: toISOString(newTask.createdAt),
        updatedAt: toISOString(newTask.updatedAt),
      };

      return NextResponse.json({ task: responseTask }, { status: 201 });
    } catch (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
  },
  middleware
);