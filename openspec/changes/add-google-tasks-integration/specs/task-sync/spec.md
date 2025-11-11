# Task Sync Specification

## ADDED Requirements

### Requirement: TaskProvider Interface
The system SHALL define a `TaskProvider` interface that abstracts task operations across different external platforms.

#### Scenario: Interface defines CRUD operations
- **WHEN** implementing a new task platform adapter
- **THEN** the adapter MUST implement getTasks, createTask, updateTask, deleteTask, and getProviderName methods

#### Scenario: Interface accepts standard task entities
- **WHEN** calling TaskProvider methods
- **THEN** the methods SHALL accept and return domain Task entities, not platform-specific DTOs

### Requirement: Google Tasks Provider Implementation
The system SHALL provide a `GoogleTasksProvider` implementation of the TaskProvider interface for syncing with Google Tasks API.

#### Scenario: Fetch tasks from Google Tasks
- **WHEN** getTasks is called with a valid userId
- **THEN** the provider SHALL fetch all tasks from all task lists via Google Tasks API
- **AND** SHALL map Google Tasks fields (title, notes, due, status) to domain Task entities
- **AND** SHALL populate externalId with the Google Task ID
- **AND** SHALL populate source with 'google-tasks'

#### Scenario: Create task in Google Tasks
- **WHEN** createTask is called with a valid Task entity
- **THEN** the provider SHALL create a new task in the user's default Google Tasks list
- **AND** SHALL return the created task with externalId populated

#### Scenario: Update task in Google Tasks
- **WHEN** updateTask is called with a valid taskId and partial Task data
- **THEN** the provider SHALL update the corresponding task in Google Tasks API
- **AND** SHALL sync changes to title, description, dueDate, and completed status
- **AND** SHALL return the updated task

#### Scenario: Delete task in Google Tasks
- **WHEN** deleteTask is called with a valid taskId
- **THEN** the provider SHALL delete the corresponding task from Google Tasks API
- **AND** SHALL return successfully even if the task was already deleted (idempotent)

### Requirement: Task Source Labeling
The system SHALL label each task with its originating platform to enable filtering and display differentiation.

#### Scenario: Local tasks have 'local' source
- **WHEN** a task is created directly in the application
- **THEN** the task SHALL have source field set to 'local'

#### Scenario: External tasks have platform source
- **WHEN** a task is synced from Google Tasks
- **THEN** the task SHALL have source field set to 'google-tasks'

#### Scenario: UI displays source indicator
- **WHEN** rendering a task in the task list
- **THEN** the UI SHALL display a badge or label indicating the task's source platform

### Requirement: Bidirectional Synchronization
The system SHALL synchronize tasks bidirectionally between the application and Google Tasks, ensuring consistency across platforms.

#### Scenario: Pull sync from Google Tasks
- **WHEN** a scheduled sync job runs
- **THEN** the system SHALL fetch all tasks from Google Tasks for each connected user
- **AND** SHALL create new tasks in Firestore for tasks not yet synced
- **AND** SHALL update existing tasks in Firestore if the externalEtag differs

#### Scenario: Push sync to Google Tasks
- **WHEN** a user modifies a Google Tasks-sourced task in the application
- **THEN** the system SHALL immediately push the changes to Google Tasks API
- **AND** SHALL update the local task's externalEtag with the response etag
- **AND** SHALL update lastSyncedAt timestamp

#### Scenario: Handle sync conflicts with last-write-wins
- **WHEN** a task is modified both locally and remotely between sync intervals
- **THEN** the system SHALL apply the change from the source platform (Google Tasks) as the authoritative version
- **AND** SHALL log the conflict for monitoring

### Requirement: Etag-Based Sync Optimization
The system SHALL use etag headers to minimize unnecessary data transfer during synchronization.

#### Scenario: Fetch tasks with etag
- **WHEN** syncing tasks from Google Tasks
- **THEN** the system SHALL include the last-known externalEtag in the request headers
- **AND** SHALL skip processing if the API returns 304 Not Modified

#### Scenario: Store updated etag
- **WHEN** receiving a successful response from Google Tasks API
- **THEN** the system SHALL store the response etag in the task's externalEtag field for future sync operations

### Requirement: Scheduled Background Sync
The system SHALL execute automated background synchronization jobs to keep tasks up-to-date without user intervention.

#### Scenario: Sync job runs periodically
- **WHEN** the scheduled sync interval elapses (every 3-5 minutes)
- **THEN** a Cloud Function SHALL trigger to sync tasks for all users with connected Google accounts

#### Scenario: Sync job processes users in batches
- **WHEN** the sync job runs
- **THEN** the system SHALL process users in batches to avoid timeouts
- **AND** SHALL limit task fetching to 100 tasks per user per iteration

#### Scenario: Handle API rate limits
- **WHEN** Google Tasks API returns a 429 rate limit error
- **THEN** the system SHALL implement exponential backoff
- **AND** SHALL retry the request after the calculated delay

### Requirement: Manual Sync Trigger
The system SHALL allow users to manually trigger a synchronization to fetch the latest tasks immediately.

#### Scenario: User initiates manual sync
- **WHEN** a user clicks the "Sync Now" button
- **THEN** the system SHALL immediately fetch tasks from Google Tasks for that user
- **AND** SHALL display a loading indicator during sync
- **AND** SHALL show a success message upon completion

#### Scenario: Prevent concurrent syncs
- **WHEN** a manual sync is triggered while a sync is already in progress
- **THEN** the system SHALL not start a new sync
- **AND** SHALL inform the user that a sync is already in progress

### Requirement: Unified Task List
The system SHALL display tasks from all sources (local and external platforms) in a single unified task list.

#### Scenario: Display all tasks regardless of source
- **WHEN** a user views the task list
- **THEN** the system SHALL retrieve and display tasks from all sources (local, google-tasks, etc.)
- **AND** SHALL sort tasks by due date and priority

#### Scenario: Filter tasks by source
- **WHEN** a user applies a source filter (e.g., "Show only Google Tasks")
- **THEN** the system SHALL display only tasks matching the selected source
- **AND** SHALL update the filter UI to reflect the active filter

### Requirement: External Task Identifier Tracking
The system SHALL track the external platform's unique identifier for each synced task to enable bidirectional updates.

#### Scenario: Store external ID on sync
- **WHEN** a task is fetched from Google Tasks
- **THEN** the system SHALL store the Google Task ID in the task's externalId field

#### Scenario: Lookup task by external ID
- **WHEN** syncing updates from Google Tasks
- **THEN** the system SHALL query Firestore for tasks with matching externalId and source fields
- **AND** SHALL update the found task rather than creating a duplicate
