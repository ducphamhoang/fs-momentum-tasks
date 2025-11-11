# Project Context

## Purpose
A Next.js starter application with Firebase integration, featuring a task management system with AI-powered prioritization capabilities. The application allows users to create, organize, and prioritize tasks with the assistance of Google's Genkit AI framework.

## Tech Stack
- **Frontend**: Next.js 15.3.3, React 18.3.1, TypeScript
- **Backend**: Firebase (Authentication & Firestore)
- **AI**: Genkit AI (@genkit-ai/google-genai) for task prioritization
- **Styling**: Tailwind CSS with shadcn/ui components (Radix UI)
- **Forms**: React Hook Form with Zod validation
- **Testing**: Vitest with @testing-library/react
- **Dev Tools**: Turbopack (Next.js bundler)

## Project Conventions

### Code Style
- TypeScript with strict type checking
- Functional React components with hooks
- Use of shadcn/ui components for consistent UI patterns
- Kebab-case for file names, PascalCase for React components
- Feature-specific naming conventions (e.g., `useTasks`, `TaskItem`)

### Architecture Patterns
- **Feature-First Clean Architecture** with four layers:
  - **Domain**: Business logic, entities, repositories (interfaces), use-cases
  - **Application**: Services, DTOs, mappers, ports (interface abstractions)
  - **Infrastructure**: External dependencies (persistence, API clients, auth implementations)
  - **Presentation**: UI components, pages, hooks, providers, API routes (when needed for external integrations)
- **Dependency Rule**: Dependencies point inwards (presentation → application → domain)
- **Interface Segregation**: Interfaces defined in inner layers, implemented in outer layers
- **Dependency Injection**: Container-based DI pattern in `src/shared/infrastructure/di/container.ts`
- **Data Operations**:
  - Server actions for web app functionality (primary pattern)
  - REST API routes for external integrations (e.g., chatbot) as thin adapters that reuse server actions
  - API routes validate authentication, call server actions, format responses

### Testing Strategy
- **Test Framework**: Vitest with jsdom
- **Test Types**: Unit tests and integration tests
- **Test Location**: `tests/` directory with subdirectories for different test types
- **Coverage**: vitest coverage-v8 for code coverage
- **Sample Data**: Scripts for populating test data (`scripts/populate-sample-data.ts`)
- **Commands**:
  - `npm run test` - Run all tests in watch mode
  - `npm run test:run` - Run tests once
  - `npm run test:ui` - Run tests with UI

### Git Workflow
- Main branch: `main`
- Feature branches recommended for new features
- OpenSpec change proposals required for significant changes
- Commit messages should follow conventional patterns

## Domain Context
- **Task Management**: Core domain focused on personal task organization
- **AI Prioritization**: Tasks can be automatically prioritized based on due dates, importance, and other factors
- **User Authentication**: Firebase Auth with Google Sign-In support
- **Real-time Updates**: Firestore real-time subscriptions for task updates
- **Time Blocking**: Tasks can have specific start/end times for scheduling

## Important Constraints
- Firebase project configuration required (environment variables for Firebase config)
- AI features require Google Genkit API access
- Client-side Firebase SDK used for real-time features
- Non-blocking updates pattern for better UX (see `src/firebase/non-blocking-*.tsx`)
- Port 9002 used for development server (Next.js)
- Port 6000 used for Genkit AI development UI

## External Dependencies
- **Firebase**: Authentication, Firestore database
- **Google Genkit AI**: AI model integration for task prioritization
- **Radix UI**: Component primitives via shadcn/ui
- **Lucide React**: Icon library
- **jsonwebtoken**: JWT generation and validation for chatbot API authentication (when chatbot integration is implemented)
