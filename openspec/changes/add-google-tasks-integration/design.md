# Design: Google Tasks Integration MVP

## Context

The application currently manages tasks only within its own database (Firestore). Users have expressed the need to consolidate tasks from multiple external platforms into a unified view. This design focuses on the MVP implementation for Google Tasks integration, establishing patterns that will enable future platform integrations (Notion, Asana, etc.).

**Constraints**:
- Google Tasks API does not support webhooks; must use polling
- OAuth 2.0 required for accessing user's Google Tasks
- Firebase Firestore as primary database
- Next.js server actions preferred over API routes for web functionality
- Must maintain existing task management functionality

**Stakeholders**:
- End users seeking unified task management
- Future integrations with other platforms (extensibility requirement)

## Goals / Non-Goals

**Goals**:
- Enable bidirectional sync between app and Google Tasks
- Establish extensible architecture for future platform integrations
- Maintain data consistency across platforms
- Support time blocking and reminders for external tasks
- Provide filtering by task source

**Non-Goals**:
- Real-time sync (acceptable to have sync delay of 1-5 minutes)
- Offline conflict resolution (will prioritize source platform as truth)
- Multi-platform task creation (user creates in one platform only)
- Custom field mapping beyond core task properties
- AI-powered scheduling (post-MVP)

## Decisions

### 1. Architecture Pattern: Adapter/Strategy with TaskProvider Interface

**Decision**: Implement `TaskProvider` interface with platform-specific adapters (GoogleTasksProvider, future NotionProvider, etc.)

**Rationale**:
- **Extensibility**: Adding new platforms only requires implementing the interface
- **Testability**: Can mock providers for unit tests
- **Separation of Concerns**: Business logic decoupled from external API details
- **Dependency Injection**: Fits cleanly into existing DI container pattern

**Alternatives Considered**:
- Direct API calls in service layer - rejected (tight coupling, hard to test)
- Plugin system with dynamic loading - rejected (overkill for MVP, adds complexity)

**Interface Design**:
```typescript
export interface TaskProvider {
  getTasks(userId: string): Promise<Task[]>;
  createTask(userId: string, task: Task): Promise<Task>;
  updateTask(userId: string, taskId: string, task: Partial<Task>): Promise<Task>;
  deleteTask(userId: string, taskId: string): Promise<void>;
  getProviderName(): string;
}
```

### 2. Synchronization Strategy: Polling with Etag Optimization

**Decision**: Use Cloud Functions scheduled jobs (or Cloud Scheduler) to poll Google Tasks API every 3-5 minutes, using etag headers to minimize data transfer.

**Rationale**:
- Google Tasks API lacks webhook support
- Etag mechanism reduces redundant data fetching (304 Not Modified responses)
- Background jobs prevent blocking user interactions
- Acceptable sync latency for MVP (users can trigger manual sync if needed)

**Alternatives Considered**:
- Client-side polling - rejected (battery drain, unreliable if app closed)
- Longer polling intervals (15+ min) - rejected (poor user experience)
- Webhooks - not available for Google Tasks API

**Flow**:
1. Cloud Function triggers every 3 minutes
2. For each user with Google Tasks connected:
   - Fetch tasks with last-known etag
   - If 304 response, skip processing
   - If 200 response, compare with Firestore data
   - Apply 3-way merge (Firestore, Google Tasks, last-synced snapshot)
   - Update Firestore with changes
   - Store new etag

### 3. OAuth Token Management

**Decision**: Store OAuth tokens in Firestore `user_tokens` collection with automatic refresh flow.

**Rationale**:
- Firestore provides secure, per-user storage
- Firebase Admin SDK handles encryption at rest
- Token refresh can be triggered on-demand or scheduled
- Centralized token management for all future OAuth providers

**Schema**:
```typescript
interface UserToken {
  userId: string;
  provider: 'google-tasks' | 'notion' | ...;
  accessToken: string; // encrypted
  refreshToken: string; // encrypted
  expiresAt: Timestamp;
  scopes: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Security**:
- Use Firebase Admin SDK's built-in encryption
- Never expose tokens to client-side code
- Implement token rotation on refresh
- Revoke tokens on disconnect

### 4. Data Model Extensions

**Decision**: Extend existing `Task` entity with optional fields for external integration.

**Schema Changes**:
```typescript
interface Task {
  // Existing fields...
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  completed: boolean;

  // NEW fields
  source: 'local' | 'google-tasks' | 'notion' | ...;
  externalId?: string; // ID from source platform
  externalEtag?: string; // For sync optimization
  timeBlock?: {
    startTime: Date;
    endTime: Date;
  };
  reminders?: {
    id: string;
    triggerTime: Date;
    notified: boolean;
  }[];
  lastSyncedAt?: Timestamp;
}
```

**Rationale**:
- Minimizes disruption to existing code
- `source` field enables filtering and UI badges
- `externalId` enables bidirectional sync
- `timeBlock` and `reminders` support new MVP features
- Optional fields maintain backward compatibility

### 5. Time Blocking Implementation

**Decision**: Time blocks stored as nested objects within task documents; calendar view reads from unified task collection.

**Rationale**:
- Simple to implement and query
- Leverages existing task queries
- No separate calendar events collection needed
- Can filter tasks by date range efficiently

**UI Components**:
- Time block picker (start/end time inputs)
- Calendar view (day/week/month grids showing time-blocked tasks)
- Drag-and-drop rescheduling (post-MVP, nice-to-have)

### 6. Reminder System

**Decision**: Use Cloud Functions with Firestore queries + scheduled jobs to check for upcoming reminders.

**Flow**:
1. Cloud Function runs every minute
2. Query tasks where `reminders.triggerTime <= now + 1min` AND `reminders.notified = false`
3. Send notification (email or push)
4. Mark reminder as notified

**Notification Channel (MVP)**:
- Email notifications using Firebase Extensions (Trigger Email) or SendGrid
- Push notifications deferred to post-MVP

## Risks / Trade-offs

### Risk: API Rate Limits
- **Impact**: Google Tasks API has quota limits (requests per day/minute)
- **Mitigation**:
  - Use etag-based conditional requests
  - Implement exponential backoff on 429 responses
  - Cache results in Firestore
  - Batch operations where possible
- **Monitoring**: Track API usage via Cloud Monitoring

### Risk: Sync Conflicts
- **Impact**: User edits task in app while Google Tasks also changes
- **Mitigation**:
  - For MVP, last-write-wins strategy with source platform priority
  - Store `lastSyncedAt` timestamp to detect conflicts
  - Log conflicts for analysis
  - Post-MVP: Implement 3-way merge with user conflict resolution UI
- **Trade-off**: Accepted for MVP simplicity

### Risk: Token Expiration/Revocation
- **Impact**: Sync stops working if tokens expire or user revokes access
- **Mitigation**:
  - Automatic token refresh using refresh tokens
  - User notification on persistent auth failures
  - Graceful degradation (show last-synced data with stale indicator)
  - Re-authentication flow

### Risk: Large Task Lists Performance
- **Impact**: Users with 1000+ tasks may experience slow sync
- **Mitigation**:
  - Implement pagination in sync process
  - Index Firestore on `userId + source + lastSyncedAt`
  - Set sync batch size limit (e.g., 100 tasks per iteration)
  - Use background processing, not blocking user

## Migration Plan

**Phase 1: Database Schema Update**
1. Deploy Firestore schema changes (additive, backward-compatible)
2. Run migration script to add `source: 'local'` to existing tasks
3. Verify data integrity

**Phase 2: Backend Implementation**
1. Deploy TaskProvider interface and GoogleTasksProvider
2. Deploy OAuth flow (API routes or server actions)
3. Deploy sync Cloud Function (disabled initially)
4. Test with internal users

**Phase 3: Frontend Rollout**
1. Deploy UI for Google account connection
2. Deploy time blocking UI components
3. Deploy reminder settings
4. Enable sync Cloud Function
5. Monitor errors and performance

**Rollback Plan**:
- Disable Cloud Function sync job
- Revert frontend to hide new UI elements
- Existing tasks remain functional (source='local')
- OAuth tokens can be revoked manually

## Open Questions

1. **Sync Frequency**: Should we allow users to configure sync intervals (e.g., every 5 min vs. 15 min)? Or is a fixed 3-5 min acceptable?
   - **Recommendation**: Fixed 3-5 min for MVP; add user preferences post-MVP

2. **Offline Edits**: How do we handle task edits made while user is offline?
   - **Recommendation**: Queue sync operations; process when online (Firestore handles this naturally)

3. **Task List Organization**: Google Tasks supports task lists (folders). Should we map these to tags or categories?
   - **Recommendation**: Flatten for MVP; show list name as a tag; full hierarchy post-MVP

4. **Reminder Delivery**: Email only, or also in-app notifications?
   - **Recommendation**: Email for MVP (simpler); in-app bell icon shows recent reminders

5. **Multi-Account Support**: Can a user connect multiple Google accounts?
   - **Recommendation**: Single account for MVP; multi-account post-MVP

## Success Metrics

- **Sync Reliability**: >99% successful sync operations
- **Sync Latency**: Median sync delay <5 minutes
- **API Error Rate**: <1% of API calls result in errors
- **User Adoption**: >30% of active users connect Google Tasks within first month
- **Task Completion Rate**: No decrease in task completion rate after integration (validates unified view UX)
