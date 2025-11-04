# Feature-First Clean Architecture Implementation

## Overview
This document describes the implementation of a feature-first clean architecture in the Studio application. The architecture follows the principles of clean architecture with a focus on organizing code by features rather than by technical layers.

## Architecture Layers

### 1. Domain Layer (`domain/`)
- Contains business entities, use cases, and repository interfaces
- Pure business logic without external dependencies
- Defines contracts (interfaces) for external dependencies
- Contains business rules and validation logic

#### Auth Feature Domain Structure:
- `entities/user.ts` - User entity with validation schema
- `repositories/auth-repository.ts` - Interface for auth operations
- `use-cases/auth-use-cases.ts` - Auth business logic

#### Tasks Feature Domain Structure:
- `task.ts` - Task entity with validation schema
- `repositories/task-repository.ts` - Interface for task operations
- `use-cases/task-use-cases.ts` - Task business logic

### 2. Application Layer (`application/`)
- Contains application services and DTOs
- Orchestrates business use cases
- Defines application-specific interfaces and ports
- Maps between domain and infrastructure layers

#### Subdirectories:
- `services/` - Application service implementations
- `dtos/` - Data Transfer Objects (not yet fully implemented)
- `mappers/` - Data mappers (not yet fully implemented)
- `ports/` - Application layer interfaces

### 3. Infrastructure Layer (`infrastructure/`)
- Implements domain interfaces using external services
- Handles database, API, and other external integrations
- Technology-specific implementations

#### Subdirectories:
- `persistence/` - Database implementations (FirestoreTaskRepository)
- `auth/` - Authentication implementations (FirebaseAuthRepository)

### 4. Presentation Layer (`presentation/`)
- UI components, pages, and hooks
- React components that interact with application services
- User interface logic

#### Subdirectories:
- `components/` - Feature-specific components
- `pages/` - Feature-specific page components
- `hooks/` - Feature-specific custom hooks
- `providers/` - Feature-specific context providers

## Shared Infrastructure

### `src/shared/`
Code shared across multiple features:

- `domain/` - Shared business entities
- `application/` - Shared application services  
- `infrastructure/`
  - `auth/` - Shared authentication services
  - `database/` - Shared database services
  - `storage/` - Shared storage services
  - `cache/` - Shared caching services
  - `di/` - Dependency injection container
- `presentation/`
  - `components/` - Shared UI components
  - `hooks/` - Shared hooks
  - `providers/` - Shared providers

## Dependency Injection

Dependency injection is implemented through:
- `src/shared/infrastructure/di/container.ts` - DI container that manages service instances
- Services are instantiated and wired up following the dependency rule (outer layers depend on inner layers)
- Presentation layer uses hooks that interact with application services through the DI container

## Feature Organization

### Auth Feature (`src/features/auth/`)
- Complete clean architecture implementation with all layers
- Handles user authentication and profile creation
- Provides LoginForm and SignUpForm components

### Tasks Feature (`src/features/tasks/`)
- Complete clean architecture implementation with all layers
- Handles task management operations
- Provides task dashboard and related components
- Includes AI prioritization service

## Key Principles Implemented

1. **Dependency Rule**: Dependencies only point inward (Presentation → Application → Domain)
2. **Feature-First**: Each feature contains all necessary layers within its directory
3. **Separation of Concerns**: Each layer has a single, well-defined responsibility
4. **Testability**: Each layer can be tested in isolation
5. **Interface Segregation**: Inner layers define interfaces, outer layers implement them

## Benefits

- Improved maintainability through clear separation of concerns
- Better testability with isolated layers
- Feature-focused development allowing teams to work on specific features
- Reduced coupling between features
- Clear boundaries between business logic and infrastructure concerns