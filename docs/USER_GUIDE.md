# Momentum Tasks User Guide

Welcome to Momentum Tasks! This guide will help you get started with the app and make the most of its features.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Managing Tasks](#managing-tasks)
3. [Google Tasks Integration](#google-tasks-integration)
4. [Time Blocking](#time-blocking)
5. [Reminders & Notifications](#reminders--notifications)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Creating Your Account

1. Visit the Momentum Tasks web app
2. Sign up using your email and password, or sign in with Google
3. Once logged in, you'll see your task dashboard

### Your Dashboard

The dashboard is your central hub for managing tasks. It includes:

- **Task List**: All your tasks organized by status
- **Notification Bell**: View and manage reminder notifications
- **New Task Button**: Create new tasks quickly
- **AI Prioritize**: Let AI help organize your task order

---

## Managing Tasks

### Creating a Task

1. Click the **"New Task"** button in the dashboard
2. Fill in task details:
   - **Title**: What needs to be done? (required)
   - **Description**: Additional details about the task
   - **Priority**: Set as High, Medium, or Low
   - **Category**: Choose from Work, Personal, Fitness, etc.
   - **Due Date**: When should this be completed?
   - **Time Block**: Schedule a specific time to work on this task
   - **Reminders**: Automatically generated when you set a time block

3. Click **"Create Task"** to save

### Editing a Task

1. Click on any task in your list
2. The task dialog will open with all current details
3. Make your changes
4. Click **"Save Changes"**

### Completing Tasks

- Click the checkbox next to any task to mark it complete
- Completed tasks are automatically archived
- You can view completed tasks by filtering your task list

### Deleting Tasks

1. Click on a task to open the details dialog
2. Click the **"Delete"** button at the bottom
3. Confirm the deletion in the popup dialog

---

## Google Tasks Integration

Momentum Tasks can sync with your Google Tasks account, keeping everything in one place.

### Connecting Your Google Account

1. Navigate to **Settings → Integrations**
2. Click **"Connect Google Tasks"**
3. You'll be redirected to Google's authorization page
4. Sign in to your Google account (if not already signed in)
5. Click **"Allow"** to grant Momentum Tasks access to your Google Tasks
6. You'll be redirected back to Momentum Tasks
7. Your connection status will show as **"Connected"**

**What Gets Synced:**
- Task titles and descriptions
- Completion status
- Due dates
- Task lists (as categories)

**Sync Frequency:**
- Automatic sync runs every 3 minutes in the background
- Manual sync: Click **"Sync Now"** on the Integrations page

### Managing Your Connection

**View Connection Status:**
- Go to **Settings → Integrations**
- You'll see your connection status, last sync time, and connected account email

**Manual Sync:**
1. Go to **Settings → Integrations**
2. Click **"Sync Now"**
3. Wait for the sync to complete (typically 5-10 seconds)

**Disconnecting:**
1. Go to **Settings → Integrations**
2. Click **"Disconnect"**
3. Confirm in the dialog
4. Your Google Tasks access will be revoked
5. Existing synced tasks remain in Momentum Tasks

**Important Notes:**
- Disconnecting does NOT delete tasks from either platform
- Tasks created in Momentum Tasks after disconnecting stay local only
- You can reconnect anytime to resume syncing

---

## Time Blocking

Time blocking helps you schedule focused work time for specific tasks.

### What is Time Blocking?

Time blocking is the practice of assigning specific time slots to tasks. Instead of a vague to-do list, you know exactly when you'll work on each item.

**Benefits:**
- Better time management
- Reduced procrastination
- Automatic reminders before scheduled tasks
- Visual overview of your day

### Setting a Time Block

1. Create or edit a task
2. Set a **Due Date** for when the task should be completed
3. In the **Time Block** section, set:
   - **Start Time**: When you'll begin working on this task
   - **End Time**: When you expect to finish
4. Save the task

**Example:**
- Task: "Write project proposal"
- Due Date: Today
- Time Block: 2:00 PM - 4:00 PM

### Viewing Your Schedule

**Today View:**
1. Navigate to the **"Today"** tab in your dashboard
2. See all tasks scheduled for today
3. Tasks are displayed in chronological order
4. Conflict warnings appear if time blocks overlap

**Day View:**
1. Navigate to the **"Day View"** tab
2. See a visual calendar with hourly time slots
3. Tasks appear in their scheduled time blocks
4. Use the date picker to view any day
5. Navigate with Previous/Next day arrows

### Managing Time Conflicts

If you schedule overlapping time blocks, the app will warn you:

- **Red border** around conflicting tasks
- **"Conflict"** badge displayed on the task
- You can still save the task, but consider rescheduling

**Tips to Avoid Conflicts:**
- Check Day View before scheduling
- Leave buffer time between tasks
- Be realistic about task duration

### Removing Time Blocks

1. Edit the task
2. Clear the Start Time and/or End Time fields
3. Save the task
4. The task becomes unscheduled but remains in your list

---

## Reminders & Notifications

Momentum Tasks helps you stay on track with automatic reminders.

### How Reminders Work

When you set a time block for a task, reminders are **automatically created**:

- **15 minutes before** the task starts
- **5 minutes before** the task starts

**Example:**
- Task: "Team meeting preparation"
- Time Block: 3:00 PM - 4:00 PM
- Reminders: 2:45 PM and 2:55 PM

### Viewing Your Reminders

1. Create or edit a task with a time block
2. Scroll to the **"Reminders"** section
3. See all scheduled reminders with:
   - Trigger time (when the reminder will fire)
   - Status badge (Pending, Notified, or Past)

**Reminder Status:**
- **Pending** (Blue bell icon): Reminder is scheduled and hasn't fired yet
- **Notified** (Gray bell icon): Reminder already sent
- **Past** (Gray outline): Reminder time has passed but wasn't sent (task may have been modified)

### Managing Reminders

**Deleting a Reminder:**
1. Open the task dialog
2. Find the reminder in the Reminders section
3. Click the trash icon
4. Confirm deletion

**Updating Reminders:**
- When you change a task's time block, reminders are automatically updated
- Old reminders are replaced with new ones based on the updated time

**No Custom Reminders (MVP):**
- Currently, reminders are auto-generated from time blocks
- You cannot set custom reminder times (e.g., "1 hour before")
- This feature may be added in future updates

### Notification Bell

The notification bell in the dashboard header shows your reminder notifications.

**Features:**
- **Unread count badge**: Red badge shows number of unread notifications
- **Notification list**: Click the bell to see all notifications
- **Timestamps**: See when each notification was created (e.g., "5 minutes ago")
- **Mark as read**: Click the check icon on individual notifications
- **Mark all read**: Click "Mark all read" button at the top
- **Clear all**: Remove all notifications with "Clear all" button

**Using Notifications:**
1. When a reminder fires, a notification appears in your bell
2. The unread count increases
3. Click the notification bell to view details
4. Click individual notifications to mark them as read
5. Or click "Mark all read" to clear the unread count

**Notification Details:**
Each notification shows:
- Task title
- Reminder message (e.g., "Starts in 15 minutes")
- Time the notification was created
- Unread indicator (blue dot for unread)

---

## Troubleshooting

### Google Tasks Sync Issues

**Problem: Sync is not working**

Possible causes and solutions:

1. **Check Connection Status**
   - Go to Settings → Integrations
   - Verify status shows "Connected"
   - If disconnected, reconnect your account

2. **Try Manual Sync**
   - Click "Sync Now" on Integrations page
   - Wait for completion message
   - Check if tasks appear after sync

3. **Check OAuth Token**
   - Google access tokens expire after a period
   - Try disconnecting and reconnecting
   - This refreshes your authentication

4. **Verify Google Tasks API Access**
   - Ensure you granted permissions during OAuth flow
   - Check your Google Account → Security → Third-party apps
   - Verify "Momentum Tasks" has access

**Problem: Tasks not appearing after sync**

1. Check if tasks exist in Google Tasks web/mobile app
2. Ensure tasks are in a list (not orphaned)
3. Try creating a new task in Google Tasks and sync again
4. Check browser console for errors (press F12)

**Problem: Duplicate tasks after sync**

This may occur if:
- You connected and disconnected multiple times
- Background sync ran during disconnection
- To fix: Manually delete duplicates, then ensure stable connection

**Problem: OAuth redirect not working**

1. Check your browser allows redirects
2. Disable browser extensions (especially ad blockers)
3. Try a different browser or incognito mode
4. Verify the OAuth redirect URI is configured correctly (for developers)

### Notification Issues

**Problem: Not receiving reminder notifications**

1. **Check Time Block**
   - Ensure the task has a valid time block set
   - Verify the time is in the future

2. **Check Reminders List**
   - Open the task dialog
   - See if reminders appear with "Pending" status
   - If no reminders, try re-saving the task

3. **Check Notification Bell**
   - Click the bell icon in the dashboard
   - Notifications may be there but marked as read

4. **Browser Notifications (if applicable)**
   - Some browsers block notifications
   - Check browser notification settings
   - Grant permission to Momentum Tasks

**Problem: Reminder notifications are delayed**

- Reminder checks run every 1 minute
- Notifications may arrive up to 1 minute after trigger time
- This is normal behavior for the MVP

**Problem: Old reminders showing as "Past"**

- This happens if a task's time block was changed after reminders were created
- These reminders can be safely deleted
- The task should have new "Pending" reminders

### General Issues

**Problem: Task dialog not opening**

1. Refresh the page (Ctrl+R or Cmd+R)
2. Clear browser cache
3. Try a different browser
4. Check browser console for JavaScript errors

**Problem: Changes not saving**

1. Check your internet connection
2. Verify you're still logged in (session may have expired)
3. Try logging out and back in
4. Check if Firestore rules are blocking the operation

**Problem: AI Prioritize not working**

1. Ensure you have at least 2 tasks to prioritize
2. Check your internet connection
3. Verify you have API access enabled (for developers)
4. This feature may require additional configuration

### Getting Help

If you continue to experience issues:

1. **Check Documentation**: Review this guide and DEVELOPER.md
2. **Contact Support**: Reach out via the support email or form
3. **Report Bugs**: Submit issues via GitHub (if open source)
4. **Community Forum**: Ask questions in the user community

---

## Tips for Maximum Productivity

1. **Start Your Day with Time Blocking**
   - Review your task list each morning
   - Assign time blocks to your top 3-5 tasks
   - Leave buffer time for unexpected items

2. **Use Categories Effectively**
   - Create meaningful categories (Work, Personal, Urgent, etc.)
   - Filter your task list by category
   - Focus on one category at a time

3. **Set Realistic Time Blocks**
   - Don't over-schedule your day
   - Include breaks between tasks
   - Allow extra time for complex tasks

4. **Leverage Google Tasks Sync**
   - Use Google Tasks on mobile for quick capture
   - Use Momentum Tasks on desktop for planning and time blocking
   - Let automatic sync keep everything in sync

5. **Review Notifications Regularly**
   - Check the notification bell frequently
   - Act on reminders promptly
   - Clear old notifications to stay organized

6. **Weekly Planning**
   - Set aside time each week to plan ahead
   - Add due dates to important tasks
   - Schedule time blocks for the upcoming week

---

## Keyboard Shortcuts (Future Feature)

Keyboard shortcuts are planned for a future release. Stay tuned!

---

## Privacy & Data

**What Data We Store:**
- Your tasks (title, description, dates, time blocks, reminders)
- Google Tasks OAuth tokens (encrypted)
- Notification records
- Account information (email, name)

**Data Security:**
- OAuth tokens are encrypted and stored securely
- All data is transmitted over HTTPS
- Firestore security rules prevent unauthorized access

**Data Deletion:**
- Disconnecting Google Tasks does NOT delete your tasks
- To delete all data, contact support
- Deleting your account removes all associated data

---

## What's Next?

We're constantly improving Momentum Tasks. Upcoming features:

- Week and month calendar views
- Email notifications for reminders
- Custom reminder times
- Integration with Notion, Asana, and more
- Native mobile apps (iOS/Android)
- AI-powered task scheduling suggestions

Have feedback or feature requests? We'd love to hear from you!

---

**Version:** 1.0 (MVP)
**Last Updated:** 2025-11-12
**For Developer Documentation:** See DEVELOPER.md
**For Deployment Guide:** See DEPLOYMENT.md
