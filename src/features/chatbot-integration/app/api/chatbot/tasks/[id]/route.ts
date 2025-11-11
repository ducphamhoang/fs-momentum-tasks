import { NextRequest, NextResponse } from 'next/server';
import { withAuth, composeMiddleware } from '@/features/chatbot-integration/presentation/middleware';
import { logApiRequest } from '@/features/chatbot-integration/presentation/middleware/logging.middleware';
import { defaultRateLimit } from '@/features/chatbot-integration/presentation/middleware/rate-limit.middleware';
import { TaskApplicationServiceImpl } from '@/features/tasks/application/services/task-service';
import { FirestoreTaskRepository } from '@/features/tasks/infrastructure/persistence/firestore-task-repository';
import { UpdateTaskRequestSchema } from '@/features/chatbot-integration/application/dtos/validation-schemas';

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

export const PATCH = withAuth(
  async (context, { params }: { params: { id: string } }) => {
    const { userId, request } = context;
    const taskId = params.id;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    try {
      const body = await request.json();

      const sanitizedBody = {
        ...body,
        title: sanitizeInput(body.title),
        description: sanitizeInput(body.description),
      };

      const validationResult = UpdateTaskRequestSchema.safeParse(sanitizedBody);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { title, description, isCompleted, importance, dueDate, timeEstimate } = validationResult.data;

      const transformedTask: Partial<any> = {};
      if (title !== undefined) transformedTask.title = title;
      if (description !== undefined) transformedTask.description = description;
      if (isCompleted !== undefined) transformedTask.isCompleted = isCompleted;
      if (importance !== undefined) transformedTask.importanceLevel = importance;
      if (dueDate !== undefined) transformedTask.dueDate = new Date(dueDate);
      if (timeEstimate !== undefined) transformedTask.timeEstimate = timeEstimate;

      const taskRepository = new FirestoreTaskRepository();
      const taskService = new TaskApplicationServiceImpl(taskRepository);

      const existingTask = await taskService.getTaskById(userId, taskId);
      if (!existingTask) {
        return NextResponse.json(
          { error: 'Task not found or you do not have permission to update it' },
          { status: 404 }
        );
      }

      const updatedTask = await taskService.updateTask(userId, taskId, transformedTask);

      // Helper to convert Timestamp or Date to ISO string
      const toISOString = (value: any): string => {
        if (!value) return new Date().toISOString();
        if (value.toDate) return value.toDate().toISOString(); // Firestore Timestamp
        return new Date(value).toISOString();
      };

      const responseTask = {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        isCompleted: updatedTask.isCompleted,
        importance: updatedTask.importanceLevel,
        dueDate: updatedTask.dueDate ? toISOString(updatedTask.dueDate) : undefined,
        timeEstimate: updatedTask.timeEstimate,
        source: updatedTask.source || 'web',
        createdAt: toISOString(updatedTask.createdAt),
        updatedAt: toISOString(updatedTask.updatedAt),
      };

      return NextResponse.json({ task: responseTask });
    } catch (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
  },
  middleware
);

export const DELETE = withAuth(
  async (context, { params }: { params: { id: string } }) => {
    const { userId } = context;
    const taskId = params.id;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    try {
      const taskRepository = new FirestoreTaskRepository();
      const taskService = new TaskApplicationServiceImpl(taskRepository);

      const existingTask = await taskService.getTaskById(userId, taskId);
      if (!existingTask) {
        return NextResponse.json(
          { error: 'Task not found or you do not have permission to delete it' },
          { status: 404 }
        );
      }

      await taskService.deleteTask(userId, taskId);

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
  },
  middleware
);