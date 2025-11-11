# Task Reminders Specification

## ADDED Requirements

### Requirement: Reminder Creation for Time-Blocked Tasks
The system SHALL allow users to set reminders for time-blocked tasks to receive notifications before the task is scheduled to begin.

#### Scenario: Add reminder to time-blocked task
- **WHEN** a user assigns a time block to a task
- **THEN** the system SHALL prompt the user to optionally add a reminder
- **AND** SHALL allow the user to specify the reminder time (e.g., 15 minutes before, 30 minutes before)

#### Scenario: Multiple reminders per task
- **WHEN** a user wants multiple reminders for a single task
- **THEN** the system SHALL allow adding up to 3 reminders per task
- **AND** SHALL store each reminder with a unique ID, trigger time, and notified status

#### Scenario: Reminder for non-time-blocked task
- **WHEN** a user attempts to add a reminder to a task without a time block
- **THEN** the system SHALL display an error message
- **AND** SHALL require the user to assign a time block first

### Requirement: Reminder Time Calculation
The system SHALL calculate reminder trigger times relative to the task's time block start time.

#### Scenario: Calculate reminder trigger time
- **WHEN** a user sets a reminder for "15 minutes before"
- **THEN** the system SHALL calculate the trigger time as timeBlock.startTime minus 15 minutes
- **AND** SHALL store the absolute trigger time in the reminder object

#### Scenario: Update reminder when time block changes
- **WHEN** a user modifies a task's time block start time
- **THEN** the system SHALL recalculate all reminder trigger times for that task
- **AND** SHALL reset the notified status to false for reminders not yet triggered

### Requirement: Reminder Notification Delivery
The system SHALL send email notifications to users when reminder trigger times are reached.

#### Scenario: Send email notification at trigger time
- **WHEN** the current time reaches or passes a reminder's trigger time
- **THEN** the system SHALL send an email notification to the user
- **AND** SHALL include the task title, description, and scheduled time in the email
- **AND** SHALL mark the reminder as notified

#### Scenario: Handle notification failures
- **WHEN** an email notification fails to send
- **THEN** the system SHALL log the failure
- **AND** SHALL retry up to 3 times with exponential backoff
- **AND** SHALL mark as notified after max retries to prevent infinite loops

#### Scenario: Do not send duplicate notifications
- **WHEN** a reminder has already been notified (notified=true)
- **THEN** the system SHALL skip sending another notification for that reminder
- **AND** SHALL not reset the notified status unless the time block is modified

### Requirement: Scheduled Reminder Checking
The system SHALL run a background job to periodically check for reminders that need to be triggered.

#### Scenario: Check for pending reminders every minute
- **WHEN** the reminder check Cloud Function executes
- **THEN** the system SHALL query Firestore for tasks where reminders.triggerTime <= now + 1 minute AND reminders.notified = false
- **AND** SHALL process each matching reminder

#### Scenario: Batch process reminders
- **WHEN** multiple reminders are due within the same minute
- **THEN** the system SHALL batch process up to 100 reminders per execution
- **AND** SHALL continue processing remaining reminders in the next execution

### Requirement: Reminder Management UI
The system SHALL provide a user interface for managing reminders within the task detail view.

#### Scenario: Display reminders in task details
- **WHEN** a user opens a time-blocked task's details
- **THEN** the system SHALL display all configured reminders with their trigger times
- **AND** SHALL indicate whether each reminder has been notified

#### Scenario: Add reminder via UI
- **WHEN** a user clicks "Add Reminder" in the task details
- **THEN** the system SHALL display a reminder picker with preset options (5 min, 15 min, 30 min, 1 hour before) and custom time input
- **AND** SHALL add the reminder to the task's reminders array

#### Scenario: Remove reminder via UI
- **WHEN** a user deletes a reminder from the task details
- **THEN** the system SHALL remove the reminder from the reminders array
- **AND** SHALL confirm the deletion with the user

### Requirement: Reminder Default Preferences
The system SHALL allow users to set default reminder preferences that apply to new time-blocked tasks.

#### Scenario: Set default reminder in user settings
- **WHEN** a user configures a default reminder time in settings (e.g., always 15 minutes before)
- **THEN** the system SHALL store this preference in the user's profile
- **AND** SHALL automatically apply this reminder to newly time-blocked tasks

#### Scenario: Override default for specific task
- **WHEN** a user assigns a time block to a task with default reminders enabled
- **THEN** the system SHALL add the default reminder automatically
- **AND** SHALL allow the user to remove or modify the auto-added reminder

### Requirement: Reminder Notification Content
The system SHALL include relevant task information in reminder notifications to help users prepare for the scheduled task.

#### Scenario: Email notification contains task details
- **WHEN** a reminder email is sent
- **THEN** the email SHALL include the task title as the subject
- **AND** SHALL include the task description, scheduled start time, and duration in the body
- **AND** SHALL include a deep link to the task in the application

#### Scenario: Notification for completed tasks
- **WHEN** a task is marked as completed before the reminder triggers
- **THEN** the system SHALL cancel all pending reminders for that task
- **AND** SHALL not send notifications for completed tasks

### Requirement: Reminder Timezone Awareness
The system SHALL handle reminders correctly across different timezones, ensuring notifications are sent at the correct local time.

#### Scenario: Store reminder trigger times in UTC
- **WHEN** a reminder is created
- **THEN** the system SHALL convert the trigger time to UTC before storage
- **AND** SHALL calculate based on the task's time block start time in UTC

#### Scenario: Trigger reminders in correct timezone
- **WHEN** the background job checks for due reminders
- **THEN** the system SHALL compare the current UTC time against reminder trigger times in UTC
- **AND** SHALL send notifications regardless of the user's current timezone

### Requirement: Reminder History Tracking
The system SHALL maintain a record of sent reminders to support auditing and user visibility.

#### Scenario: Mark reminder as notified
- **WHEN** a reminder notification is successfully sent
- **THEN** the system SHALL update the reminder object's notified field to true
- **AND** SHALL optionally store the notification timestamp

#### Scenario: View reminder history
- **WHEN** a user views a task's reminder section
- **THEN** the system SHALL display which reminders have been sent (notified=true)
- **AND** SHALL differentiate between pending and sent reminders visually

### Requirement: Reminder Snooze Functionality
The system SHALL allow users to snooze reminders for a specified duration, re-triggering the notification later.

#### Scenario: Snooze reminder from notification
- **WHEN** a user receives a reminder notification and chooses to snooze
- **THEN** the system SHALL create a new reminder with a trigger time of now + snooze duration (e.g., 10 minutes)
- **AND** SHALL mark the original reminder as notified

#### Scenario: Snooze options
- **WHEN** snoozing a reminder
- **THEN** the system SHALL offer preset snooze durations (5 min, 10 min, 15 min)
- **AND** SHALL allow custom snooze time input

#### Scenario: Limit snooze iterations
- **WHEN** a reminder has been snoozed multiple times
- **THEN** the system SHALL limit snoozing to a maximum of 3 times per original reminder
- **AND** SHALL not allow further snoozes after the limit is reached
