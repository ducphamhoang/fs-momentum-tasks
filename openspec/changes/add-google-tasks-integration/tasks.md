# Implementation Tasks: Google Tasks Integration MVP

## MVP Scope Decisions

**Architecture Decisions:**
- ✅ Time Blocks: Use existing `startTime/endTime` fields (no new timeBlock object)
- ✅ Functions: Standard `/functions/` directory structure
- ✅ Sync Frequency: Fixed 3-minute intervals (user-configurable deferred to post-MVP)
- ✅ Calendar Views: Day view only for MVP (week/month views deferred)
- ✅ Notifications: In-app notifications (primary) + bot notifications via existing chatbot integration

**Deferred to Post-MVP:**
- Week and month calendar views
- Email and native push notifications
- User-configurable sync intervals
- Additional platform integrations (Notion, Asana, etc.)

---

## 1. Project Setup & Dependencies

- [ ] 1.1 Install Google Tasks API client library (`googleapis`)
- [ ] 1.2 Install Firebase Functions SDK (`firebase-functions`, `firebase-admin`)
- [ ] 1.3 Initialize Firebase Functions in standard `/functions/` directory (`firebase init functions`)
- [ ] 1.4 Configure TypeScript for Functions (tsconfig.json in functions/)
- [ ] 1.5 Set up Functions environment variables using Firebase config
- [ ] 1.6 Configure Google Cloud Console project with Tasks API enabled
- [ ] 1.7 Create OAuth 2.0 credentials (client ID, client secret)
- [ ] 1.8 Add OAuth credentials to environment variables (.env and Functions config)
- [ ] 1.9 Set up OAuth redirect URI in Google Cloud Console
- [ ] 1.10 Test Firebase Functions emulator locally

## 2. Database Schema Updates

- [ ] 2.0 Review existing Task schema (already has startTime/endTime fields and source enum)
- [ ] 2.1 Extend Task entity source enum from ["web", "chatbot"] to ["web", "chatbot", "local", "google-tasks"]
- [ ] 2.2 Add new fields to Task entity: externalId (string), externalEtag (string), lastSyncedAt (Timestamp)
- [ ] 2.3 DECISION: Use existing startTime/endTime fields for time blocks (no new timeBlock object needed)
- [ ] 2.4 Add reminders array field to Task entity: [{ id, triggerTime, notified }]
- [ ] 2.5 Create Firestore collection `user_tokens` with schema for OAuth tokens
- [ ] 2.6 Write Firestore security rules for `user_tokens` collection:
  - [ ] 2.6a Ensure users can only read/write their own tokens
  - [ ] 2.6b Prevent client-side access (server-only via Firebase Admin SDK)
  - [ ] 2.6c Add audit logging for token access
- [ ] 2.7 Create explicit Firestore composite indexes:
  - [ ] 2.7a Index: userId + source (for filtering tasks by source)
  - [ ] 2.7b Index: userId + externalId (for sync lookups)
  - [ ] 2.7c Index: userId + reminders.triggerTime (for reminder queries)
  - [ ] 2.7d Index: userId + startTime (for calendar/time block queries)
- [ ] 2.8 Write migration script to update existing tasks:
  - [ ] 2.8a Add source: 'local' to tasks with source='web' or no source
  - [ ] 2.8b Initialize new fields as null/empty for existing tasks
- [ ] 2.9 Test migration script with sample data in development environment

## 3. Domain Layer - TaskProvider Interface

- [ ] 3.1 Define `TaskProvider` interface in `src/features/tasks/domain/repositories/task-provider.ts`
- [ ] 3.2 Add `getTasks`, `createTask`, `updateTask`, `deleteTask`, `getProviderName` method signatures
- [ ] 3.3 Create mock TaskProvider implementation for testing
- [ ] 3.4 Write unit tests for TaskProvider contract

## 4. Infrastructure Layer - OAuth Implementation

- [ ] 4.0 Review existing auth feature structure at `src/features/auth/`
- [ ] 4.1 Create OAuth subdirectory: `src/features/auth/infrastructure/oauth/`
- [ ] 4.2 Define OAuth domain interfaces in `src/features/auth/domain/repositories/`
- [ ] 4.3 Create OAuth configuration in `src/features/auth/infrastructure/oauth/oauth-config.ts`
- [ ] 4.4 Implement Google OAuth flow in `src/features/auth/infrastructure/oauth/google-oauth.ts`
- [ ] 4.5 Implement TokenStorageService in `src/features/auth/infrastructure/oauth/token-storage-service.ts`:
  - [ ] 4.5a Use Firebase Admin SDK for server-side token encryption
  - [ ] 4.5b Store tokens in Firestore `user_tokens` collection
  - [ ] 4.5c Implement token rotation on every refresh
  - [ ] 4.5d Add token expiration tracking
- [ ] 4.6 Implement token refresh logic (`refreshAccessToken`)
- [ ] 4.7 Implement token revocation logic (`revokeAccessToken`)
- [ ] 4.8 Create OAuth server actions in `src/features/auth/presentation/actions/oauth-actions.ts`:
  - [ ] 4.8a Implement `initiateGoogleOAuth` server action
  - [ ] 4.8b Implement `handleGoogleOAuthCallback` server action
  - [ ] 4.8c Implement `disconnectGoogleAccount` server action
- [ ] 4.9 Create OAuth callback page at `src/app/auth/callback/google/page.tsx`
- [ ] 4.10 Write unit tests for OAuth flow components
- [ ] 4.11 Write integration tests for OAuth end-to-end flow

## 5. Infrastructure Layer - Google Tasks Provider

- [ ] 5.1 Create `GoogleTasksProvider` in `src/features/tasks/infrastructure/providers/google-tasks-provider.ts`
- [ ] 5.2 Implement `getTasks` method with Google Tasks API client
- [ ] 5.3 Implement `createTask` method with API request mapping
- [ ] 5.4 Implement `updateTask` method with API request mapping
- [ ] 5.5 Implement `deleteTask` method with error handling
- [ ] 5.6 Implement field mapping (Google Tasks ↔ domain Task entity)
- [ ] 5.7 Implement etag handling in API requests/responses
- [ ] 5.8 Implement rate limiting and exponential backoff
- [ ] 5.9 Write unit tests for GoogleTasksProvider methods
- [ ] 5.10 Write integration tests with mocked Google Tasks API

## 6. Application Layer - Task Sync Service

- [ ] 6.1 Create `TaskSyncService` in `src/features/tasks/application/services/task-sync-service.ts`
- [ ] 6.2 Implement `syncUserTasks` method orchestrating pull and push sync
- [ ] 6.3 Implement pull sync logic (fetch from provider, merge with Firestore)
- [ ] 6.4 Implement push sync logic (detect local changes, push to provider)
- [ ] 6.5 Implement 3-way merge conflict resolution (last-write-wins with source priority)
- [ ] 6.6 Implement etag-based conditional fetching
- [ ] 6.7 Add logging for sync operations and conflicts
- [ ] 6.8 Write unit tests for sync logic (various conflict scenarios)
- [ ] 6.9 Write integration tests for end-to-end sync

## 6.5. Error Handling & Resilience

- [ ] 6.5.1 Define error types in `src/features/tasks/domain/errors/`:
  - [ ] 6.5.1a SyncError (base class for sync failures)
  - [ ] 6.5.1b ProviderAuthError (OAuth token expired/invalid)
  - [ ] 6.5.1c ProviderRateLimitError (API quota exceeded)
  - [ ] 6.5.1d ProviderConnectionError (network failures)
  - [ ] 6.5.1e ConflictError (merge conflicts during sync)
- [ ] 6.5.2 Implement error mapping in GoogleTasksProvider (API errors → domain errors)
- [ ] 6.5.3 Implement retry logic with exponential backoff in GoogleTasksProvider
- [ ] 6.5.4 Create user-friendly error messages mapping in presentation layer
- [ ] 6.5.5 Add structured logging infrastructure:
  - [ ] 6.5.5a Log all sync operations (start, success, failure)
  - [ ] 6.5.5b Log API errors with context (userId, operation, timestamp)
  - [ ] 6.5.5c Use Firebase Cloud Logging for Functions
- [ ] 6.5.6 Write unit tests for error scenarios:
  - [ ] 6.5.6a Test OAuth token expiration handling
  - [ ] 6.5.6b Test rate limit backoff behavior
  - [ ] 6.5.6c Test network failure retry logic
  - [ ] 6.5.6d Test conflict resolution with errors

## 7. Application Layer - Task Service Integration

- [ ] 7.0 Create TaskProviderRegistry in `src/features/tasks/application/services/task-provider-registry.ts`:
  - [ ] 7.0a Register available providers (LocalProvider, GoogleTasksProvider)
  - [ ] 7.0b Implement getProvider(source) method
  - [ ] 7.0c Handle provider not found errors
- [ ] 7.1 Update DI container in `src/shared/infrastructure/di/` to inject TaskProviderRegistry
- [ ] 7.2 Modify CreateTaskUseCase to route external tasks to appropriate provider
- [ ] 7.3 Modify UpdateTaskUseCase to route external tasks to provider and trigger sync
- [ ] 7.4 Modify DeleteTaskUseCase to route external tasks to provider and trigger sync
- [ ] 7.5 Update GetTasksUseCase to support source filtering parameter
- [ ] 7.6 Update existing unit tests for use-cases to account for provider pattern
- [ ] 7.7 Write integration tests for provider routing logic

## 8. Infrastructure Layer - Background Sync Job

- [ ] 8.1 Create Cloud Function for scheduled sync in `functions/src/scheduled-sync.ts`
- [ ] 8.2 Implement user batch processing (fetch users with connected accounts)
- [ ] 8.3 Implement per-user sync invocation using TaskSyncService
- [ ] 8.4 Configure Cloud Scheduler job (every 3 minutes)
- [ ] 8.5 Add error handling and retry logic
- [ ] 8.6 Add monitoring and alerting for sync failures
- [ ] 8.7 Test Cloud Function locally with Firebase emulator
- [ ] 8.8 Deploy Cloud Function to staging environment

## 9. Presentation Layer - OAuth Connection UI

- [ ] 9.1 Create "Integrations" settings page component
- [ ] 9.2 Add "Connect Google Tasks" button with OAuth initiation
- [ ] 9.3 Create OAuth callback page to handle redirect
- [ ] 9.4 Display connection status (connected, disconnected, error)
- [ ] 9.5 Add "Disconnect" button with confirmation dialog
- [ ] 9.6 Display last sync timestamp
- [ ] 9.7 Add manual "Sync Now" button
- [ ] 9.8 Add loading indicators during OAuth and sync operations
- [ ] 9.9 Write component tests for integration settings

## 10. Presentation Layer - Time Blocking UI (MVP: Day View Only)

- [ ] 10.0 Review existing UI components in `src/components/ui/` (calendar, dialog, date-picker)
- [ ] 10.1 Create `TimeBlockPicker` component with start/end time inputs (use existing form components)
- [ ] 10.2 Update task detail dialog (CreateEditTaskDialog) to include time block assignment
- [ ] 10.3 Display time block badges on task list items in TaskList component
- [ ] 10.4 Create "Day View" calendar component showing hourly time blocks:
  - [ ] 10.4a Build day view grid with hourly slots (e.g., 6am-11pm)
  - [ ] 10.4b Display time-blocked tasks in their scheduled slots
  - [ ] 10.4c Add date navigation (previous/next day, jump to date)
- [ ] 10.5 Create "Today" view component showing current day's scheduled tasks
- [ ] 10.6 Add time block conflict detection logic
- [ ] 10.7 Add visual indicators for time block conflicts (overlapping times)
- [ ] 10.8 Implement timezone conversion for display (use date-fns)
- [ ] 10.9 Add time block editing/removal functionality in task dialog
- [ ] 10.10 Write component tests for time blocking UI components
- [ ] 10.11 (Post-MVP) Week and month calendar views deferred to future iteration

## 11. Presentation Layer - Task Filtering & Source Labels

- [ ] 11.1 Add source badge to task list items (show platform icon/label)
- [ ] 11.2 Create source filter dropdown (All, Local, Google Tasks, etc.)
- [ ] 11.3 Implement filter logic in task list query
- [ ] 11.4 Add time-blocked filter option (show only scheduled tasks)
- [ ] 11.5 Add unscheduled filter option (show only tasks without time blocks)
- [ ] 11.6 Update task list to support multiple active filters
- [ ] 11.7 Write component tests for filtering

## 12. Application Layer - Reminder Service

- [ ] 12.1 Create `ReminderService` in `src/features/tasks/application/services/reminder-service.ts`
- [ ] 12.2 Implement `addReminder` method with trigger time calculation
- [ ] 12.3 Implement `removeReminder` method
- [ ] 12.4 Implement `updateRemindersForTimeBlock` (recalculate on time block change)
- [ ] 12.5 Implement `checkPendingReminders` query logic
- [ ] 12.6 Write unit tests for reminder calculations and management

## 13. Infrastructure Layer - Reminder Notification System

- [ ] 13.1 Create Cloud Function for reminder checks in `functions/src/check-reminders.ts`
- [ ] 13.2 Implement Firestore query for due reminders (query tasks with reminders.triggerTime <= now)
- [ ] 13.3 Create in-app notification system:
  - [ ] 13.3a Create Firestore collection `notifications` for storing in-app notifications
  - [ ] 13.3b Define notification schema (userId, taskId, title, message, read, createdAt)
  - [ ] 13.3c Write Firestore security rules for notifications collection
- [ ] 13.4 Implement notification creation logic for due reminders
- [ ] 13.5 Integrate with existing chatbot API for bot notifications:
  - [ ] 13.5a Check if user has connected chatbot (query chatbot sessions)
  - [ ] 13.5b Send reminder notification via chatbot webhook/API
  - [ ] 13.5c Handle bot notification failures gracefully (fallback to in-app only)
- [ ] 13.6 Implement marking reminders as notified (update reminder.notified = true)
- [ ] 13.7 Add retry logic for failed notification delivery
- [ ] 13.8 Configure Cloud Scheduler job (every 1 minute)
- [ ] 13.9 Test reminder function locally with Firebase emulator
- [ ] 13.10 Deploy reminder Cloud Function to staging

## 14. Presentation Layer - Reminder Management UI

- [ ] 14.1 Create `ReminderPicker` component with preset and custom time options
- [ ] 14.2 Add reminder management section in task detail dialog
- [ ] 14.3 Display list of configured reminders with trigger times
- [ ] 14.4 Add "Add Reminder" button and picker UI
- [ ] 14.5 Add delete reminder functionality with confirmation
- [ ] 14.6 Show reminder status (pending vs. notified)
- [ ] 14.7 Create user settings for default reminder preferences
- [ ] 14.8 Implement auto-adding default reminders to new time blocks
- [ ] 14.9 Write component tests for reminder UI

## 14.5. Presentation Layer - In-App Notification UI

- [ ] 14.5.1 Create notification bell icon component in header/navbar
- [ ] 14.5.2 Display unread notification count badge on bell icon
- [ ] 14.5.3 Create notifications dropdown panel showing recent notifications
- [ ] 14.5.4 Implement notification list with task titles and reminder times
- [ ] 14.5.5 Add "Mark as Read" functionality for notifications
- [ ] 14.5.6 Add "Clear All" functionality for notifications
- [ ] 14.5.7 Add click handler to navigate to task when notification is clicked
- [ ] 14.5.8 Implement real-time notification updates using Firestore listeners
- [ ] 14.5.9 Add notification sound/toast for new reminders (optional)
- [ ] 14.5.10 Write component tests for notification UI

## 15. Testing & Quality Assurance

- [ ] 15.0 Define testing strategy and coverage targets:
  - [ ] 15.0a Domain layer (entities, use-cases): Target 100% coverage
  - [ ] 15.0b Application layer (services): Target >90% coverage
  - [ ] 15.0c Infrastructure layer (providers, repositories): Target >80% with mocked APIs
  - [ ] 15.0d Presentation layer (components): Target >70% for critical user flows
  - [ ] 15.0e Use Vitest for unit/integration tests
- [ ] 15.1 Write end-to-end tests for OAuth flow (using Vitest)
- [ ] 15.2 Write end-to-end tests for task sync (create, update, delete, complete)
- [ ] 15.3 Write end-to-end tests for time blocking workflow
- [ ] 15.4 Write end-to-end tests for reminder notifications
- [ ] 15.5 Perform manual testing with real Google Tasks account:
  - [ ] 15.5a Test OAuth connection and disconnection
  - [ ] 15.5b Test bidirectional sync (app → Google, Google → app)
  - [ ] 15.5c Test task operations (CRUD) with sync
- [ ] 15.6 Test sync conflict scenarios manually:
  - [ ] 15.6a Concurrent edits on different devices
  - [ ] 15.6b Offline edits with delayed sync
  - [ ] 15.6c Task deletion conflicts
- [ ] 15.7 Test OAuth token refresh and revocation flows
- [ ] 15.8 Test rate limiting and error handling (simulate API errors)
- [ ] 15.9 Verify Firestore security rules with test users (non-admin accounts)
- [ ] 15.10 Run full Vitest test suite and verify coverage targets met

## 16. Documentation & Deployment

- [ ] 16.1 Update user documentation with Google Tasks integration instructions
- [ ] 16.2 Document OAuth setup steps for other developers
- [ ] 16.3 Update README with new environment variables
- [ ] 16.4 Create runbook for troubleshooting sync issues
- [ ] 16.5 Set up monitoring dashboards for sync and reminder jobs
- [ ] 16.6 Deploy to staging environment
- [ ] 16.7 Perform staging smoke tests
- [ ] 16.8 Deploy to production
- [ ] 16.9 Monitor production logs for errors
- [ ] 16.10 Announce feature to users

## 17. Post-MVP Considerations (Deferred to Future Iterations)

- [ ] 17.1 Calendar week and month views for time blocking
- [ ] 17.2 Email notifications for reminders
- [ ] 17.3 Native push notifications (iOS/Android)
- [ ] 17.4 User-configurable sync intervals (currently fixed at 3 minutes)
- [ ] 17.5 Notion database integration
- [ ] 17.6 Asana integration
- [ ] 17.7 Microsoft To Do integration
- [ ] 17.8 Google Calendar meeting sync
- [ ] 17.9 AI-powered task scheduling suggestions
- [ ] 17.10 Advanced conflict resolution with user prompt
- [ ] 17.11 Drag-and-drop time block rescheduling
- [ ] 17.12 Multi-account support per user
- [ ] 17.13 Webhook-based sync when platform supports it
