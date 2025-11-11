# Time Blocking Specification

## ADDED Requirements

### Requirement: Time Block Assignment
The system SHALL allow users to assign a specific time block (start time and end time) to any task.

#### Scenario: Assign time block to a task
- **WHEN** a user selects a task and assigns a start time and end time
- **THEN** the system SHALL store the time block in the task's timeBlock field
- **AND** SHALL validate that the end time is after the start time
- **AND** SHALL display the time block on the task item

#### Scenario: Assign time block to external task
- **WHEN** a user assigns a time block to a Google Tasks-sourced task
- **THEN** the system SHALL store the time block locally in Firestore
- **AND** SHALL not attempt to sync the time block to Google Tasks (not supported by Google Tasks API)

#### Scenario: Invalid time block
- **WHEN** a user enters an end time before the start time
- **THEN** the system SHALL display a validation error
- **AND** SHALL not save the time block

### Requirement: Time Block Editing
The system SHALL allow users to modify or remove existing time blocks from tasks.

#### Scenario: Edit time block
- **WHEN** a user updates the start or end time of a time-blocked task
- **THEN** the system SHALL update the timeBlock field with the new values
- **AND** SHALL re-validate that the end time is after the start time

#### Scenario: Remove time block
- **WHEN** a user clears the time block from a task
- **THEN** the system SHALL set the timeBlock field to undefined
- **AND** SHALL remove the task from the calendar view

### Requirement: Calendar View
The system SHALL provide a calendar interface that displays time-blocked tasks visually across days, weeks, or months.

#### Scenario: Display time-blocked tasks in day view
- **WHEN** a user views the calendar in day mode
- **THEN** the system SHALL display tasks with time blocks as blocks spanning their scheduled duration
- **AND** SHALL position blocks according to their start and end times
- **AND** SHALL show task title within the block

#### Scenario: Display time-blocked tasks in week view
- **WHEN** a user views the calendar in week mode
- **THEN** the system SHALL display all time-blocked tasks across the week
- **AND** SHALL organize tasks by day and time
- **AND** SHALL allow horizontal scrolling if needed

#### Scenario: Display time-blocked tasks in month view
- **WHEN** a user views the calendar in month mode
- **THEN** the system SHALL display time-blocked tasks as markers or mini-blocks within each day cell
- **AND** SHALL support clicking a day to view detailed tasks

#### Scenario: Calendar view excludes non-time-blocked tasks
- **WHEN** viewing the calendar
- **THEN** the system SHALL only display tasks that have a timeBlock defined
- **AND** SHALL not display tasks without time blocks

### Requirement: Time Block Conflict Detection
The system SHALL detect when multiple tasks have overlapping time blocks and visually indicate conflicts.

#### Scenario: Detect overlapping time blocks
- **WHEN** two or more tasks have time blocks that overlap
- **THEN** the system SHALL identify the conflict
- **AND** SHALL visually indicate the overlap in the calendar view (e.g., stacked blocks or warning icon)

#### Scenario: Warn user on overlap creation
- **WHEN** a user assigns a time block that overlaps with an existing task's time block
- **THEN** the system SHALL display a warning message
- **AND** SHALL still allow the user to save the time block (soft warning, not blocking)

### Requirement: Time Block Filtering
The system SHALL allow users to filter tasks based on whether they have time blocks assigned.

#### Scenario: Filter by time-blocked tasks
- **WHEN** a user applies the "Time-blocked only" filter
- **THEN** the system SHALL display only tasks with a defined timeBlock
- **AND** SHALL hide tasks without time blocks

#### Scenario: Filter by unscheduled tasks
- **WHEN** a user applies the "Unscheduled only" filter
- **THEN** the system SHALL display only tasks without a timeBlock
- **AND** SHALL hide time-blocked tasks

### Requirement: Time Block Quick Assignment
The system SHALL provide a quick time block picker to streamline the assignment process.

#### Scenario: Quick time block picker
- **WHEN** a user clicks "Add Time Block" on a task
- **THEN** the system SHALL display a time picker UI with start and end time inputs
- **AND** SHALL pre-populate with suggested times (e.g., next available hour)

#### Scenario: Default time block duration
- **WHEN** a user selects only a start time
- **THEN** the system SHALL suggest a default end time (e.g., 1 hour later)
- **AND** SHALL allow the user to accept or modify the suggestion

### Requirement: Time Block Today View
The system SHALL provide a focused view of tasks time-blocked for the current day.

#### Scenario: Display today's time-blocked tasks
- **WHEN** a user navigates to the "Today" view
- **THEN** the system SHALL display all tasks with time blocks scheduled for the current day
- **AND** SHALL sort tasks chronologically by start time

#### Scenario: Highlight current time block
- **WHEN** viewing today's time-blocked tasks during an active time block
- **THEN** the system SHALL visually highlight the task currently in progress
- **AND** SHALL display remaining time until the block ends

### Requirement: Time Block Timezone Handling
The system SHALL handle time blocks in the user's local timezone and adjust for timezone changes.

#### Scenario: Store time blocks in UTC
- **WHEN** a user assigns a time block
- **THEN** the system SHALL convert the local time to UTC before storing in Firestore
- **AND** SHALL store the user's timezone for reference

#### Scenario: Display time blocks in local timezone
- **WHEN** displaying a time block to the user
- **THEN** the system SHALL convert the UTC time to the user's current local timezone
- **AND** SHALL display the time in a human-readable format (e.g., "9:00 AM - 10:00 AM")

#### Scenario: Handle timezone changes
- **WHEN** a user travels to a different timezone
- **THEN** the system SHALL detect the timezone change
- **AND** SHALL display time blocks in the new local timezone
- **AND** SHALL preserve the absolute UTC time of the blocks

### Requirement: Time Block Integration with Task Completion
The system SHALL update the visual state of time-blocked tasks when they are marked as completed.

#### Scenario: Completed task in calendar view
- **WHEN** a user marks a time-blocked task as completed
- **THEN** the system SHALL visually indicate completion in the calendar view (e.g., strikethrough or checkmark)
- **AND** SHALL still display the task in its scheduled time slot

#### Scenario: Hide completed tasks option
- **WHEN** a user enables the "Hide completed tasks" filter in calendar view
- **THEN** the system SHALL hide time-blocked tasks that are marked as completed
- **AND** SHALL show only incomplete time-blocked tasks
