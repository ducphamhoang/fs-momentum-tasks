# Testing and Sample Data for Studio App

This document explains how to use the testing setup and populate sample data for development and testing purposes.

## Running Tests

To run all tests:
```bash
npm run test
```

To run tests in watch mode:
```bash
npm run test:watch
```

To run tests once without watch mode:
```bash
npm run test:run
```

To run the test UI:
```bash
npm run test:ui
```

## Test Structure

- `tests/api/ai-tasks-api.test.ts` - Tests for AI task service endpoints
- `tests/api/task-management-api.test.ts` - Tests for task management endpoints
- `tests/api/ai-prioritization-api.test.ts` - Tests for AI prioritization functionality
- `tests/api/integration.test.ts` - Integration tests for end-to-end flows
- `tests/utils/api-test-utils.ts` - Utilities for API testing

## Sample Data

To populate sample data to your Firestore database for development/testing:

```bash
npx tsx scripts/populate-sample-data.ts
```

The sample data script will add sample tasks for a test user. You can modify the `testUserId` variable in the script to match a real user ID if needed.

### Sample Data Included

The sample data includes various tasks with different properties:
- Different importance levels (high, medium, low)
- Different due dates
- Different completion statuses
- Time estimates
- Start and end times for time-blocked tasks

## Testing API Endpoints

The application uses server actions for API functionality instead of traditional API routes. The tests cover:

1. **Task Management**: 
   - Creating, reading, updating, and deleting tasks
   - Retrieving all tasks for a user
   - Retrieving a specific task by ID

2. **AI Prioritization**:
   - AI-based task prioritization based on due dates and importance
   - Handling of time-blocked tasks
   - Providing reasoning for priority suggestions

3. **Authentication**:
   - User authentication for API access
   - Authorization checks for user-specific data

## Running the Application with Sample Data

1. Populate sample data:
```bash
npx tsx scripts/populate-sample-data.ts
```

2. Run the development server:
```bash
npm run dev
```

The application will be available at http://localhost:9002 (as per the dev script configuration).