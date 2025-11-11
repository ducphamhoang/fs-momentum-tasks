# Implementation Tasks: Google Tasks Integration MVP

## 1. Project Setup & Dependencies

- [ ] 1.1 Install Google Tasks API client library (`googleapis`)
- [ ] 1.2 Configure Google Cloud Console project with Tasks API enabled
- [ ] 1.3 Create OAuth 2.0 credentials (client ID, client secret)
- [ ] 1.4 Add OAuth credentials to environment variables
- [ ] 1.5 Set up OAuth redirect URI in Google Cloud Console

## 2. Database Schema Updates

- [ ] 2.1 Extend Task entity type with new fields (source, externalId, externalEtag, timeBlock, reminders, lastSyncedAt)
- [ ] 2.2 Create Firestore collection `user_tokens` with schema for OAuth tokens
- [ ] 2.3 Write Firestore security rules for `user_tokens` collection (user-scoped access only)
- [ ] 2.4 Create Firestore indexes for efficient queries (userId+source, userId+externalId, reminder trigger times)
- [ ] 2.5 Write migration script to add `source: 'local'` to existing tasks
- [ ] 2.6 Test migration script with sample data

## 3. Domain Layer - TaskProvider Interface

- [ ] 3.1 Define `TaskProvider` interface in `src/features/tasks/domain/repositories/task-provider.ts`
- [ ] 3.2 Add `getTasks`, `createTask`, `updateTask`, `deleteTask`, `getProviderName` method signatures
- [ ] 3.3 Create mock TaskProvider implementation for testing
- [ ] 3.4 Write unit tests for TaskProvider contract

## 4. Infrastructure Layer - OAuth Implementation

- [ ] 4.1 Create OAuth configuration in `src/features/auth/infrastructure/oauth/oauth-config.ts`
- [ ] 4.2 Implement Google OAuth flow in `src/features/auth/infrastructure/oauth/google-oauth.ts`
- [ ] 4.3 Create OAuth initiation server action (`initiateGoogleOAuth`)
- [ ] 4.4 Create OAuth callback handler server action (`handleGoogleOAuthCallback`)
- [ ] 4.5 Implement token storage service (`TokenStorageService`) with encryption
- [ ] 4.6 Implement token refresh logic (`refreshAccessToken`)
- [ ] 4.7 Implement token revocation logic (`revokeAccessToken`)
- [ ] 4.8 Write unit tests for OAuth flow components
- [ ] 4.9 Write integration tests for OAuth end-to-end flow

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

## 7. Application Layer - Task Service Integration

- [ ] 7.1 Update `TaskService` to use `TaskProvider` for external task operations
- [ ] 7.2 Modify `createTask` to route to provider if task has external source
- [ ] 7.3 Modify `updateTask` to route to provider and trigger sync
- [ ] 7.4 Modify `deleteTask` to route to provider and trigger sync
- [ ] 7.5 Add source filtering logic to task queries
- [ ] 7.6 Update existing tests to account for new provider pattern

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

## 10. Presentation Layer - Time Blocking UI

- [ ] 10.1 Create `TimeBlockPicker` component with start/end time inputs
- [ ] 10.2 Add time block assignment UI in task detail dialog
- [ ] 10.3 Display time block badges on task list items
- [ ] 10.4 Create calendar view component (day/week/month modes)
- [ ] 10.5 Implement calendar day view with time blocks
- [ ] 10.6 Implement calendar week view with time blocks
- [ ] 10.7 Implement calendar month view with time block indicators
- [ ] 10.8 Add time block conflict detection and visual indicators
- [ ] 10.9 Create "Today" view showing current day's time blocks
- [ ] 10.10 Implement timezone conversion for display
- [ ] 10.11 Add time block editing/removal functionality
- [ ] 10.12 Write component tests for time blocking UI

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
- [ ] 13.2 Implement Firestore query for due reminders
- [ ] 13.3 Integrate email notification service (Firebase Extensions or SendGrid)
- [ ] 13.4 Create email templates for reminder notifications
- [ ] 13.5 Implement notification sending logic with retry
- [ ] 13.6 Implement marking reminders as notified
- [ ] 13.7 Configure Cloud Scheduler job (every 1 minute)
- [ ] 13.8 Test reminder function locally with Firebase emulator
- [ ] 13.9 Deploy reminder Cloud Function to staging

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

## 15. Testing & Quality Assurance

- [ ] 15.1 Write end-to-end tests for OAuth flow
- [ ] 15.2 Write end-to-end tests for task sync (create, update, delete, complete)
- [ ] 15.3 Write end-to-end tests for time blocking workflow
- [ ] 15.4 Write end-to-end tests for reminder notifications
- [ ] 15.5 Perform manual testing with real Google Tasks account
- [ ] 15.6 Test sync conflict scenarios manually
- [ ] 15.7 Test OAuth token refresh and revocation
- [ ] 15.8 Test rate limiting and error handling
- [ ] 15.9 Verify Firestore security rules with test users
- [ ] 15.10 Run full test suite and achieve >80% coverage

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

## 17. Post-MVP Considerations (Not in Scope)

- [ ] 17.1 Notion database integration
- [ ] 17.2 Asana integration
- [ ] 17.3 Microsoft To Do integration
- [ ] 17.4 Google Calendar meeting sync
- [ ] 17.5 Push notifications for reminders (in-app)
- [ ] 17.6 AI-powered task scheduling suggestions
- [ ] 17.7 Advanced conflict resolution with user prompt
- [ ] 17.8 Drag-and-drop time block rescheduling
- [ ] 17.9 Multi-account support per user
- [ ] 17.10 Webhook-based sync when platform supports it
