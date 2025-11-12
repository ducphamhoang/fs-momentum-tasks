# Momentum Tasks Developer Guide

This guide is for developers who want to understand, maintain, or extend the Momentum Tasks application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Core Concepts](#core-concepts)
4. [Domain Layer](#domain-layer)
5. [Application Layer](#application-layer)
6. [Infrastructure Layer](#infrastructure-layer)
7. [Presentation Layer](#presentation-layer)
8. [Adding New Task Providers](#adding-new-task-providers)
9. [Cloud Functions](#cloud-functions)
10. [Testing](#testing)
11. [Code Patterns & Conventions](#code-patterns--conventions)
12. [API Reference](#api-reference)

---

## Architecture Overview

Momentum Tasks follows **Clean Architecture** principles with clear separation of concerns.

### Architectural Layers

```
┌─────────────────────────────────────────────────┐
│           Presentation Layer (UI)               │
│   Components, Pages, Actions, Hooks             │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│          Application Layer (Use Cases)          │
│   Services, DTOs, Orchestration                 │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           Domain Layer (Business Logic)         │
│   Entities, Repositories, Domain Services       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│       Infrastructure Layer (External I/O)       │
│   Firestore, Google Tasks API, OAuth            │
└─────────────────────────────────────────────────┘
```

### Key Design Patterns

1. **Repository Pattern**: Abstracts data access (Firestore, Google Tasks API)
2. **Service Layer**: Orchestrates business logic and coordinates use cases
3. **Provider Pattern**: Pluggable task providers (Google Tasks, Notion, etc.)
4. **Dependency Injection**: Services are injected via DI container
5. **Server Actions**: Next.js server actions for API routes

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- date-fns for date manipulation
- Zod for schema validation

**Backend:**
- Firebase Firestore (database)
- Firebase Authentication
- Firebase Cloud Functions (background jobs)
- Google Tasks API
- Firebase Admin SDK

**Development:**
- Vitest (unit testing)
- ESLint + Prettier (code quality)
- Git + GitHub (version control)

---

## Project Structure

```
fs-momentum-tasks/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (authenticated)/      # Protected routes
│   │   │   ├── tasks/            # Task dashboard
│   │   │   └── settings/         # Settings pages
│   │   ├── auth/                 # Auth pages (login, callback)
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   │
│   ├── features/                 # Feature modules (Clean Architecture)
│   │   ├── tasks/
│   │   │   ├── domain/           # Task entities, repositories
│   │   │   ├── application/      # Task services, use cases
│   │   │   ├── infrastructure/   # Firestore, providers
│   │   │   └── presentation/     # Task UI components
│   │   │
│   │   ├── auth/
│   │   │   ├── domain/           # Auth entities, OAuth interfaces
│   │   │   ├── application/      # Auth services
│   │   │   ├── infrastructure/   # OAuth implementation, token storage
│   │   │   └── presentation/     # Auth UI, server actions
│   │   │
│   │   └── notifications/
│   │       ├── domain/           # Notification entities
│   │       ├── infrastructure/   # Notification repository
│   │       └── presentation/     # NotificationBell component
│   │
│   ├── components/               # Shared UI components
│   │   └── ui/                   # shadcn/ui components
│   │
│   ├── lib/                      # Shared utilities
│   │   └── utils.ts              # Helper functions
│   │
│   └── firebase/                 # Firebase client config
│       ├── client-app.ts         # Firebase app initialization
│       └── FirebaseClientProvider.tsx
│
├── functions/                    # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts              # Function exports
│   │   ├── scheduled-sync.ts     # Background task sync
│   │   └── check-reminders.ts    # Reminder notifications
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                         # Documentation
│   ├── USER_GUIDE.md             # User-facing guide
│   ├── DEVELOPER.md              # This file
│   └── DEPLOYMENT.md             # Deployment instructions
│
├── openspec/                     # OpenSpec change proposals
│   └── changes/
│       └── add-google-tasks-integration/
│
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Firestore composite indexes
├── package.json
├── tsconfig.json
└── README.md
```

### Feature Module Structure

Each feature follows this structure:

```
features/<feature-name>/
├── domain/                       # Pure business logic, no dependencies
│   ├── entities/                 # Domain entities (Zod schemas)
│   ├── repositories/             # Repository interfaces
│   └── errors/                   # Domain-specific errors
│
├── application/                  # Use cases and services
│   ├── services/                 # Application services
│   └── dto/                      # Data transfer objects
│
├── infrastructure/               # External integrations
│   ├── persistence/              # Database repositories
│   ├── providers/                # External API providers
│   └── oauth/                    # OAuth implementations
│
└── presentation/                 # UI layer
    ├── components/               # React components
    ├── actions/                  # Server actions
    └── hooks/                    # Custom React hooks
```

---

## Core Concepts

### 1. Task Entity

The central domain entity representing a task.

**File:** `src/features/tasks/domain/task.ts`

**Schema:**
```typescript
const TaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  isCompleted: z.boolean().default(false),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  category: z.string().optional(),
  dueDate: z.instanceof(Date).nullable().optional(),
  startTime: z.string().optional(),    // Time block start (HH:MM format)
  endTime: z.string().optional(),      // Time block end (HH:MM format)
  source: z.enum(["local", "web", "chatbot", "google-tasks"]).default("local"),
  externalId: z.string().optional(),   // ID in external system (e.g., Google Tasks)
  externalEtag: z.string().optional(), // ETag for optimistic locking
  lastSyncedAt: z.instanceof(Timestamp).optional(),
  reminders: z.array(ReminderSchema).default([]),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
});
```

**Key Fields:**
- `source`: Where the task originated (local, google-tasks, etc.)
- `externalId`: Enables bidirectional sync with external systems
- `externalEtag`: Prevents overwriting newer changes during sync
- `startTime`/`endTime`: Time blocking (uses existing fields, not a separate object)
- `reminders`: Array of reminder objects with trigger times

### 2. Task Provider Pattern

Abstraction for external task systems (Google Tasks, Notion, Asana, etc.)

**File:** `src/features/tasks/domain/repositories/task-provider.ts`

**Interface:**
```typescript
export interface TaskProvider {
  getProviderName(): string;
  getTasks(accessToken: string): Promise<Task[]>;
  createTask(accessToken: string, task: Task): Promise<Task>;
  updateTask(accessToken: string, task: Task): Promise<Task>;
  deleteTask(accessToken: string, taskId: string): Promise<void>;
}
```

**Benefits:**
- Decouples business logic from specific APIs
- Makes it easy to add new providers
- Enables testing with mock providers
- Supports multi-provider sync

### 3. Task Sync Algorithm

**File:** `src/features/tasks/application/services/task-sync-service.ts`

**Sync Strategy:**

1. **Pull Phase** (External → Local):
   - Fetch tasks from provider (Google Tasks)
   - For each external task:
     - If no local match (by `externalId`): Create new local task
     - If local match exists:
       - Compare `externalEtag` and `lastSyncedAt`
       - If external is newer: Update local task
       - If local is newer: Skip (will push in push phase)

2. **Push Phase** (Local → External):
   - Query local tasks with `source = provider` and `updatedAt > lastSyncedAt`
   - For each modified local task:
     - Push update to provider
     - Update `externalEtag` and `lastSyncedAt`

3. **Conflict Resolution**:
   - Uses **last-write-wins** with timestamp comparison
   - External changes take precedence during pull (user may be on mobile)
   - Local changes are pushed if more recent

**Key Methods:**
```typescript
class TaskSyncService {
  async syncUserTasks(userId: string, provider: TaskProvider): Promise<void>;
  private async pullTasks(userId: string, provider: TaskProvider): Promise<void>;
  private async pushTasks(userId: string, provider: TaskProvider): Promise<void>;
  private shouldUpdateLocal(localTask: Task, externalTask: Task): boolean;
}
```

### 4. Reminder System

**Components:**

1. **Reminder Entity** (`src/features/tasks/domain/task.ts`)
   ```typescript
   const ReminderSchema = z.object({
     id: z.string(),
     triggerTime: z.instanceof(Date).or(z.instanceof(Timestamp)),
     notified: z.boolean().default(false),
   });
   ```

2. **Reminder Service** (`src/features/tasks/application/services/reminder-service.ts`)
   - Auto-generates reminders from time blocks (15min & 5min before)
   - Updates reminders when time blocks change
   - Removes reminders when time blocks are cleared

3. **Reminder Cloud Function** (`functions/src/check-reminders.ts`)
   - Runs every 1 minute (Cloud Scheduler)
   - Queries all users' incomplete tasks
   - Checks for due reminders (`triggerTime <= now` and `notified = false`)
   - Creates in-app notifications in Firestore
   - Marks reminders as notified

4. **Notification Repository** (`src/features/notifications/infrastructure/persistence/`)
   - Stores notifications in Firestore `/notifications` collection
   - Provides real-time updates via `onSnapshot` listener
   - Supports mark as read, delete, and clear all operations

---

## Domain Layer

The domain layer contains pure business logic with no external dependencies.

### Entities

**Location:** `src/features/<feature>/domain/`

**Pattern:** Use Zod schemas for runtime validation and type inference

**Example:**
```typescript
import { z } from "zod";
import { Timestamp } from "firebase/firestore";

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  isCompleted: z.boolean().default(false),
  // ... more fields
});

export type Task = z.infer<typeof TaskSchema>;
```

**Benefits:**
- Runtime validation
- Type safety
- Self-documenting schemas
- Easy to extend

### Repository Interfaces

**Location:** `src/features/<feature>/domain/repositories/`

**Pattern:** Define interfaces for data access, implement in infrastructure layer

**Example:**
```typescript
export interface TaskRepository {
  getById(userId: string, taskId: string): Promise<Task | null>;
  list(userId: string): Promise<Task[]>;
  create(userId: string, task: Task): Promise<Task>;
  update(userId: string, task: Task): Promise<Task>;
  delete(userId: string, taskId: string): Promise<void>;
}
```

**Benefits:**
- Decouples domain from database
- Enables mock implementations for testing
- Makes it easy to swap data sources

### Domain Services

**Location:** `src/features/<feature>/domain/services/`

**When to use:** For complex business logic that doesn't fit in entities

**Example:**
```typescript
export class TaskPriorityCalculator {
  calculateScore(task: Task): number {
    let score = 0;

    if (task.priority === "high") score += 100;
    if (task.priority === "medium") score += 50;

    if (task.dueDate) {
      const daysUntilDue = differenceInDays(task.dueDate, new Date());
      if (daysUntilDue < 0) score += 200; // Overdue
      else if (daysUntilDue < 1) score += 150; // Due today
      else if (daysUntilDue < 3) score += 100; // Due soon
    }

    return score;
  }
}
```

---

## Application Layer

The application layer orchestrates business logic and coordinates use cases.

### Services

**Location:** `src/features/<feature>/application/services/`

**Responsibilities:**
- Orchestrate complex workflows
- Coordinate multiple repositories
- Implement use cases
- Transform data between layers

**Example: TaskSyncService**

**File:** `src/features/tasks/application/services/task-sync-service.ts`

```typescript
export class TaskSyncService {
  constructor(
    private taskRepository: TaskRepository,
    private taskProviderRegistry: TaskProviderRegistry
  ) {}

  async syncUserTasks(userId: string, providerName: string): Promise<void> {
    const provider = this.taskProviderRegistry.getProvider(providerName);
    const accessToken = await this.getAccessToken(userId, providerName);

    await this.pullTasks(userId, provider, accessToken);
    await this.pushTasks(userId, provider, accessToken);
  }

  private async pullTasks(...) { /* implementation */ }
  private async pushTasks(...) { /* implementation */ }
}
```

**Key Services:**

1. **TaskSyncService**: Bidirectional task synchronization
2. **ReminderService**: Reminder generation and management
3. **TaskProviderRegistry**: Registry of available providers
4. **TokenStorageService**: OAuth token encryption and storage

---

## Infrastructure Layer

The infrastructure layer handles external integrations and I/O.

### Firestore Repository Implementation

**Location:** `src/features/<feature>/infrastructure/persistence/`

**Example: FirestoreTaskRepository**

**File:** `src/features/tasks/infrastructure/persistence/firestore-task-repository.ts`

```typescript
export class FirestoreTaskRepository implements TaskRepository {
  constructor(private db: Firestore) {}

  async create(userId: string, task: Task): Promise<Task> {
    const tasksRef = collection(this.db, "users", userId, "tasks");
    const docRef = await addDoc(tasksRef, {
      ...task,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { ...task, id: docRef.id };
  }

  async list(userId: string): Promise<Task[]> {
    const q = query(
      collection(this.db, "users", userId, "tasks"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));
  }

  // ... more methods
}
```

**Patterns:**
- Use `serverTimestamp()` for `createdAt`/`updatedAt`
- Handle Firestore-specific types (Timestamp)
- Implement query optimization (composite indexes)
- Use batched writes for bulk operations

### Provider Implementation

**Location:** `src/features/tasks/infrastructure/providers/`

**Example: GoogleTasksProvider**

**File:** `src/features/tasks/infrastructure/providers/google-tasks-provider.ts`

```typescript
export class GoogleTasksProvider implements TaskProvider {
  private client: tasks_v1.Tasks;

  constructor() {
    this.client = google.tasks({ version: "v1" });
  }

  getProviderName(): string {
    return "google-tasks";
  }

  async getTasks(accessToken: string): Promise<Task[]> {
    const auth = this.createOAuth2Client(accessToken);

    // Fetch all task lists
    const listsResponse = await this.client.tasklists.list({ auth });
    const taskLists = listsResponse.data.items || [];

    // Fetch tasks from each list
    const allTasks: Task[] = [];
    for (const list of taskLists) {
      const tasksResponse = await this.client.tasks.list({
        auth,
        tasklist: list.id!,
      });

      const tasks = (tasksResponse.data.items || []).map(gtask =>
        this.mapGoogleTaskToTask(gtask, list)
      );

      allTasks.push(...tasks);
    }

    return allTasks;
  }

  private mapGoogleTaskToTask(gtask: tasks_v1.Schema$Task, list: any): Task {
    return {
      id: crypto.randomUUID(),
      userId: "", // Set by caller
      title: gtask.title || "Untitled",
      description: gtask.notes,
      isCompleted: gtask.status === "completed",
      dueDate: gtask.due ? new Date(gtask.due) : null,
      category: list.title,
      source: "google-tasks",
      externalId: gtask.id!,
      externalEtag: gtask.etag,
      // ... more fields
    };
  }

  // ... more methods
}
```

**Best Practices:**
- Handle API rate limits with exponential backoff
- Use ETags for optimistic locking
- Map external data to domain entities
- Implement comprehensive error handling
- Log all API calls for debugging

---

## Presentation Layer

The presentation layer contains React components and UI logic.

### Server Actions

**Location:** `src/features/<feature>/presentation/actions/`

**Pattern:** Use Next.js server actions for API routes

**Example:**

**File:** `src/features/auth/presentation/actions/oauth-actions.ts`

```typescript
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function initiateGoogleOAuth(): Promise<string> {
  const oauthService = new GoogleOAuthService();

  // Generate auth URL
  const authUrl = await oauthService.getAuthorizationUrl();

  return authUrl;
}

export async function handleGoogleOAuthCallback(code: string): Promise<void> {
  const userId = await getCurrentUserId();

  // Exchange code for tokens
  const oauthService = new GoogleOAuthService();
  const tokens = await oauthService.exchangeCodeForTokens(code);

  // Store tokens
  const tokenService = new TokenStorageService();
  await tokenService.storeTokens(userId, "google-tasks", tokens);

  redirect("/settings/integrations");
}
```

**Benefits:**
- Type-safe API calls
- No need for separate API routes
- Automatic serialization
- Server-side execution

### Components

**Location:** `src/features/<feature>/presentation/components/`

**Pattern:** Use functional components with hooks

**Example: NotificationBell**

**File:** `src/features/notifications/presentation/NotificationBell.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { useFirestore, useUser } from "@/firebase";

export function NotificationBell() {
  const user = useUser();
  const db = useFirestore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !db) return;

    const repository = new FirestoreNotificationRepository(db);

    // Real-time subscription
    const unsubscribe = repository.subscribeToNotifications(
      user.uid,
      (notifs) => {
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      }
    );

    return () => unsubscribe();
  }, [user, db]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user || !db) return;
    const repository = new FirestoreNotificationRepository(db);
    await repository.markAsRead(user.uid, notificationId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount}</Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      {/* Dropdown content */}
    </DropdownMenu>
  );
}
```

**Best Practices:**
- Use `"use client"` directive for client components
- Implement real-time updates with Firestore listeners
- Clean up subscriptions in `useEffect` return
- Handle loading and error states
- Use shadcn/ui components for consistency

---

## Adding New Task Providers

To add support for a new task provider (e.g., Notion, Asana, Todoist):

### Step 1: Implement the TaskProvider Interface

**File:** `src/features/tasks/infrastructure/providers/<provider>-provider.ts`

```typescript
import { TaskProvider } from "../../domain/repositories/task-provider";
import { Task } from "../../domain/task";

export class NotionTasksProvider implements TaskProvider {
  getProviderName(): string {
    return "notion";
  }

  async getTasks(accessToken: string): Promise<Task[]> {
    // 1. Initialize Notion API client
    // 2. Fetch databases/pages
    // 3. Map to Task entities
    // 4. Return tasks
  }

  async createTask(accessToken: string, task: Task): Promise<Task> {
    // 1. Map Task to Notion page properties
    // 2. Create page via API
    // 3. Return task with externalId
  }

  async updateTask(accessToken: string, task: Task): Promise<Task> {
    // 1. Map Task to Notion page properties
    // 2. Update page via API
    // 3. Return updated task
  }

  async deleteTask(accessToken: string, taskId: string): Promise<void> {
    // 1. Archive/delete page via API
  }
}
```

### Step 2: Implement OAuth Flow

**File:** `src/features/auth/infrastructure/oauth/<provider>-oauth.ts`

```typescript
export class NotionOAuthService implements OAuthService {
  async getAuthorizationUrl(): Promise<string> {
    // Build OAuth URL with client ID, redirect URI, scopes
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    // Exchange authorization code for access token
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    // Refresh expired access token
  }

  async revokeAccessToken(accessToken: string): Promise<void> {
    // Revoke token
  }
}
```

### Step 3: Register the Provider

**File:** `src/features/tasks/application/services/task-provider-registry.ts`

```typescript
export class TaskProviderRegistry {
  private providers: Map<string, TaskProvider> = new Map();

  constructor() {
    this.registerProvider(new LocalTaskProvider());
    this.registerProvider(new GoogleTasksProvider());
    this.registerProvider(new NotionTasksProvider()); // Add here
  }

  registerProvider(provider: TaskProvider): void {
    this.providers.set(provider.getProviderName(), provider);
  }

  getProvider(name: string): TaskProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider not found: ${name}`);
    }
    return provider;
  }
}
```

### Step 4: Create UI for Connection

**File:** `src/app/settings/integrations/page.tsx`

Add a new connection card:

```typescript
<Card>
  <CardHeader>
    <CardTitle>Notion</CardTitle>
    <CardDescription>Sync tasks with your Notion workspace</CardDescription>
  </CardHeader>
  <CardContent>
    {notionConnection ? (
      <>
        <Badge variant="default">Connected</Badge>
        <p>Workspace: {notionConnection.workspaceName}</p>
        <Button onClick={() => handleDisconnect("notion")}>Disconnect</Button>
      </>
    ) : (
      <Button onClick={() => handleConnect("notion")}>Connect Notion</Button>
    )}
  </CardContent>
</Card>
```

### Step 5: Update Task Schema (if needed)

If the provider requires additional fields:

```typescript
const TaskSchema = z.object({
  // ... existing fields
  notionDatabaseId: z.string().optional(), // Notion-specific
});
```

### Step 6: Add Provider-Specific Mapping

Handle provider-specific features in your provider implementation:

```typescript
private mapNotionTaskToTask(notionPage: any): Task {
  return {
    id: crypto.randomUUID(),
    title: notionPage.properties.Name.title[0].plain_text,
    description: notionPage.properties.Description?.rich_text[0]?.plain_text,
    isCompleted: notionPage.properties.Status.select.name === "Done",
    dueDate: notionPage.properties.Due?.date?.start
      ? new Date(notionPage.properties.Due.date.start)
      : null,
    source: "notion",
    externalId: notionPage.id,
    notionDatabaseId: notionPage.parent.database_id,
    // ... more mappings
  };
}
```

### Step 7: Test the Integration

1. Write unit tests for the provider
2. Write integration tests for OAuth flow
3. Test sync with real Notion account
4. Test conflict resolution
5. Test error handling (rate limits, network failures, etc.)

---

## Cloud Functions

Cloud Functions handle background tasks and scheduled jobs.

### Directory Structure

```
functions/
├── src/
│   ├── index.ts              # Export all functions
│   ├── scheduled-sync.ts     # Background task sync (every 3 min)
│   └── check-reminders.ts    # Reminder notifications (every 1 min)
├── package.json
├── tsconfig.json
└── .gitignore
```

### Scheduled Functions

**Pattern:** Use `functions.pubsub.schedule()` from `firebase-functions/v1`

**Example: Scheduled Task Sync**

**File:** `functions/src/scheduled-sync.ts`

```typescript
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

export const scheduledTaskSync = functions.pubsub
  .schedule("every 3 minutes")
  .onRun(async () => {
    const db = admin.firestore();

    // Get all users with connected providers
    const usersSnapshot = await db.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Check if user has Google Tasks connected
      const tokenDoc = await db
        .collection("user_tokens")
        .doc(userId)
        .get();

      if (!tokenDoc.exists) continue;

      const tokenData = tokenDoc.data();
      if (!tokenData?.["google-tasks"]) continue;

      // Perform sync
      try {
        await syncUserTasks(userId, "google-tasks");
        console.log(`Synced tasks for user ${userId}`);
      } catch (error) {
        console.error(`Sync failed for user ${userId}:`, error);
      }
    }
  });
```

**Key Points:**
- Use `firebase-functions/v1` for compatibility
- Handle errors gracefully (don't fail entire batch)
- Log all operations for debugging
- Use exponential backoff for retries

### Callable Functions

**Pattern:** Use `functions.https.onCall()` for client-callable functions

**Example: Manual Sync**

```typescript
export const manualTaskSync = functions.https.onCall(async (data, context) => {
  if (!context || !context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const userId = context.auth.uid;
  const providerName = data.provider || "google-tasks";

  try {
    await syncUserTasks(userId, providerName);
    return { success: true, message: "Sync completed" };
  } catch (error) {
    console.error("Manual sync failed:", error);
    throw new functions.https.HttpsError("internal", "Sync failed");
  }
});
```

### Deploying Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

**Important:**
- Set environment variables in Firebase Console
- Configure Cloud Scheduler for scheduled functions
- Monitor function logs in Firebase Console
- Set memory and timeout limits appropriately

---

## Testing

### Test Structure

```
src/features/<feature>/
├── domain/
│   └── __tests__/
│       └── task.test.ts
├── application/
│   └── __tests__/
│       └── task-sync-service.test.ts
├── infrastructure/
│   └── __tests__/
│       └── firestore-task-repository.test.ts
└── presentation/
    └── __tests__/
        └── NotificationBell.test.tsx
```

### Unit Tests

**Tool:** Vitest

**Example:**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskSyncService } from "../task-sync-service";
import { MockTaskRepository } from "../../__mocks__/mock-task-repository";
import { MockTaskProvider } from "../../__mocks__/mock-task-provider";

describe("TaskSyncService", () => {
  let service: TaskSyncService;
  let mockRepository: MockTaskRepository;
  let mockProvider: MockTaskProvider;

  beforeEach(() => {
    mockRepository = new MockTaskRepository();
    mockProvider = new MockTaskProvider();
    service = new TaskSyncService(mockRepository, mockProvider);
  });

  it("should pull tasks from provider and create locally", async () => {
    const externalTasks = [
      { id: "ext-1", title: "Task from Google", source: "google-tasks" }
    ];
    mockProvider.getTasks.mockResolvedValue(externalTasks);

    await service.syncUserTasks("user-123", "google-tasks");

    expect(mockRepository.create).toHaveBeenCalledWith("user-123", expect.objectContaining({
      title: "Task from Google",
      externalId: "ext-1"
    }));
  });

  it("should handle sync errors gracefully", async () => {
    mockProvider.getTasks.mockRejectedValue(new Error("API error"));

    await expect(
      service.syncUserTasks("user-123", "google-tasks")
    ).rejects.toThrow("API error");
  });
});
```

### Integration Tests

Test real interactions between layers:

```typescript
describe("OAuth Integration", () => {
  it("should complete full OAuth flow", async () => {
    // 1. Initiate OAuth
    const authUrl = await initiateGoogleOAuth();
    expect(authUrl).toContain("accounts.google.com");

    // 2. Simulate callback with code
    const mockCode = "mock-auth-code";
    await handleGoogleOAuthCallback(mockCode);

    // 3. Verify tokens stored
    const tokens = await getStoredTokens("user-123", "google-tasks");
    expect(tokens).toBeDefined();
    expect(tokens.accessToken).toBeTruthy();
  });
});
```

### Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific test file
npm test src/features/tasks/application/__tests__/task-sync-service.test.ts

# Run with coverage
npm test -- --coverage
```

---

## Code Patterns & Conventions

### Naming Conventions

- **Components:** PascalCase (`NotificationBell`, `TaskList`)
- **Files:** kebab-case (`task-sync-service.ts`, `notification-bell.tsx`)
- **Functions:** camelCase (`syncUserTasks`, `handleMarkAsRead`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`, `DEFAULT_PRIORITY`)
- **Interfaces:** PascalCase with "I" prefix optional (`TaskRepository` or `ITaskRepository`)

### File Naming

- **Components:** `ComponentName.tsx`
- **Server Actions:** `*-actions.ts`
- **Services:** `*-service.ts`
- **Repositories:** `*-repository.ts`
- **Providers:** `*-provider.ts`
- **Types:** `types.ts` or inline in entity files

### Import Order

```typescript
// 1. External libraries
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 2. Internal absolute imports
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase";

// 3. Relative imports
import { TaskRepository } from "../../domain/repositories/task-repository";
import { type Task } from "../../domain/task";
```

### Error Handling

**Pattern:** Use custom error classes for domain errors

```typescript
// Define custom errors
export class SyncError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = "SyncError";
  }
}

export class ProviderAuthError extends SyncError {
  constructor(provider: string, cause?: Error) {
    super(`Authentication failed for provider: ${provider}`, cause);
    this.name = "ProviderAuthError";
  }
}

// Use in code
try {
  await provider.getTasks(accessToken);
} catch (error) {
  if (error.response?.status === 401) {
    throw new ProviderAuthError("google-tasks", error);
  }
  throw new SyncError("Failed to fetch tasks", error);
}

// Handle in UI
try {
  await syncTasks();
} catch (error) {
  if (error instanceof ProviderAuthError) {
    toast.error("Please reconnect your Google account");
  } else if (error instanceof SyncError) {
    toast.error("Sync failed. Please try again.");
  } else {
    toast.error("An unexpected error occurred");
  }
}
```

### Async/Await

Always use async/await (not `.then()` chains):

```typescript
// Good
async function createTask(task: Task): Promise<Task> {
  const createdTask = await repository.create(task);
  await notifyUser(createdTask);
  return createdTask;
}

// Avoid
function createTask(task: Task): Promise<Task> {
  return repository.create(task)
    .then(createdTask => notifyUser(createdTask))
    .then(() => createdTask);
}
```

### TypeScript Best Practices

1. **Always define types** (avoid `any`)
2. **Use Zod for runtime validation**
3. **Prefer interfaces for object shapes**
4. **Use type for unions and intersections**
5. **Enable strict mode** in `tsconfig.json`

### React Best Practices

1. **Use functional components** (not class components)
2. **Extract complex logic into custom hooks**
3. **Memoize expensive calculations** with `useMemo`
4. **Memoize callbacks** with `useCallback` when passed to children
5. **Clean up side effects** in `useEffect` return functions

---

## API Reference

### Task Repository

```typescript
interface TaskRepository {
  getById(userId: string, taskId: string): Promise<Task | null>;
  list(userId: string, filters?: TaskFilters): Promise<Task[]>;
  create(userId: string, task: Task): Promise<Task>;
  update(userId: string, task: Task): Promise<Task>;
  delete(userId: string, taskId: string): Promise<void>;
  listBySource(userId: string, source: TaskSource): Promise<Task[]>;
  listWithReminders(userId: string): Promise<Task[]>;
}
```

### Task Provider

```typescript
interface TaskProvider {
  getProviderName(): string;
  getTasks(accessToken: string): Promise<Task[]>;
  createTask(accessToken: string, task: Task): Promise<Task>;
  updateTask(accessToken: string, task: Task): Promise<Task>;
  deleteTask(accessToken: string, taskId: string): Promise<void>;
}
```

### Task Sync Service

```typescript
class TaskSyncService {
  async syncUserTasks(userId: string, providerName: string): Promise<void>;
  async pullTasks(userId: string, provider: TaskProvider, accessToken: string): Promise<void>;
  async pushTasks(userId: string, provider: TaskProvider, accessToken: string): Promise<void>;
}
```

### Reminder Service

```typescript
class ReminderService {
  addReminder(task: Task, triggerTime: Date): Task;
  removeReminder(task: Task, reminderId: string): Task;
  updateRemindersForTimeBlock(task: Task): Task;
  checkPendingReminders(tasks: Task[]): Reminder[];
}
```

### Notification Repository

```typescript
interface NotificationRepository {
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(userId: string, notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(userId: string, notificationId: string): Promise<void>;
  deleteAll(userId: string): Promise<void>;
  subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void
  ): () => void;
}
```

### OAuth Service

```typescript
interface OAuthService {
  getAuthorizationUrl(): Promise<string>;
  exchangeCodeForTokens(code: string): Promise<OAuthTokens>;
  refreshAccessToken(refreshToken: string): Promise<OAuthTokens>;
  revokeAccessToken(accessToken: string): Promise<void>;
}
```

---

## Additional Resources

- **Firebase Documentation:** https://firebase.google.com/docs
- **Next.js Documentation:** https://nextjs.org/docs
- **Google Tasks API:** https://developers.google.com/tasks
- **Firestore Security Rules:** https://firebase.google.com/docs/firestore/security/get-started
- **Clean Architecture:** https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html

---

**Version:** 1.0 (MVP)
**Last Updated:** 2025-11-12
**For User Documentation:** See USER_GUIDE.md
**For Deployment Guide:** See DEPLOYMENT.md
