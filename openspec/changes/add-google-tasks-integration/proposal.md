# Change: Google Tasks Integration MVP

## Why

Users currently manage tasks across multiple platforms (Google Tasks, Notion, Asana, etc.), leading to fragmented workflows and reduced productivity. This change creates a unified task management hub, starting with Google Tasks integration as the MVP, to consolidate all tasks in one place with enhanced time blocking and reminder capabilities.

## What Changes

- **NEW**: OAuth 2.0 authentication flow for Google account integration with secure token storage
- **NEW**: TaskProvider interface pattern to support multiple task management platforms (extensible architecture)
- **NEW**: GoogleTasksProvider implementation for syncing tasks from Google Tasks API
- **NEW**: Bidirectional synchronization mechanism (polling-based) using etag optimization
- **NEW**: Task source labeling system to distinguish tasks by origin platform
- **NEW**: Time blocking feature allowing users to assign start/end times to tasks
- **NEW**: Calendar view for visualizing time-blocked tasks
- **NEW**: Reminder notification system for upcoming time-blocked tasks
- **NEW**: Unified task list with filtering capabilities by source platform
- **NEW**: Full CRUD operations with sync-back to source platform (Google Tasks)

## Impact

- **Affected specs**:
  - `task-sync` (new) - Task synchronization and provider pattern
  - `external-auth` (new) - OAuth authentication for external platforms
  - `time-blocking` (new) - Time block assignment and calendar view
  - `task-reminders` (new) - Notification system for task reminders

- **Affected code**:
  - `src/features/tasks/domain/repositories/task-provider.ts` (new) - TaskProvider interface
  - `src/features/tasks/infrastructure/providers/google-tasks-provider.ts` (new) - Google Tasks adapter
  - `src/features/auth/infrastructure/oauth/google-oauth.ts` (new) - OAuth implementation
  - `src/features/tasks/domain/entities/task.ts` - Add source, timeBlock fields
  - `src/features/tasks/application/services/task-service.ts` - Integrate TaskProvider pattern
  - `src/features/tasks/application/services/task-sync-service.ts` (new) - Sync orchestration
  - `src/features/tasks/presentation/components/` - UI for time blocks, filters, calendar
  - Firebase Functions or Cloud Scheduler - Background sync polling jobs
  - Database schema - Extend tasks collection with new fields (source, externalId, etag, timeBlock, reminders)

- **Dependencies**:
  - `googleapis` - Google Tasks API client library
  - `@google-cloud/scheduler` (optional) - For Cloud Scheduler jobs

## Breaking Changes

None. This is a purely additive change that extends existing task management functionality.

## Risks and Mitigation

- **Risk**: Polling Google Tasks API may hit rate limits
  - **Mitigation**: Implement etag-based conditional fetching and exponential backoff

- **Risk**: OAuth token expiration may cause sync failures
  - **Mitigation**: Implement automatic token refresh flow with user notification on failure

- **Risk**: Sync conflicts between local and remote task changes
  - **Mitigation**: Use last-modified timestamps and etags; prioritize source platform as source of truth for MVP

## Post-MVP Extensions

- Notion database integration
- Asana, Trello, Microsoft To Do integrations
- Google Calendar meeting sync
- AI-powered task scheduling and categorization
- Webhook-based sync (when platform supports it)
