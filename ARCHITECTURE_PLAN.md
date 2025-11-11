# Feature-First Clean Architecture Plan

## Current Architecture Status
- Partially implemented clean architecture in `tasks` feature (has domain/application/presentation)
- `auth` feature only has presentation layer
- Shared components exist but infrastructure layer is empty
- AI flows are separate from features
- App routing is in `src/app/`

## Target Feature-First Clean Architecture Structure

### Each Feature Should Have These Layers:
```
src/features/{feature-name}/
├── domain/                 # Business logic and entities
│   ├── entities/           # Core business entities
│   ├── repositories/       # Repository interfaces
│   ├── use-cases/          # Business logic operations
│   └── value-objects/      # Value objects
├── application/            # Application layer services
│   ├── services/           # Application services
│   ├── dtos/               # Data Transfer Objects
│   ├── mappers/            # Data mappers
│   └── ports/              # Interface abstractions
├── infrastructure/         # External dependencies
│   ├── persistence/        # Database implementations
│   ├── api/                # API clients
│   ├── auth/               # Authentication implementations
│   └── storage/            # File storage implementations
└── presentation/           # UI layer
    ├── components/         # Feature-specific components
    ├── pages/              # Feature-specific pages
    ├── hooks/              # Feature-specific hooks
    └── providers/          # Feature-specific providers
```

### Shared Layers:
```
src/shared/
├── domain/                 # Shared business entities
├── application/            # Shared application services
├── infrastructure/         # Shared infrastructure services
│   ├── auth/               # Authentication service
│   ├── database/           # Database service
│   ├── storage/            # Storage service
│   └── cache/              # Caching service
├── presentation/           # Shared UI components
│   ├── components/         # Shared components
│   ├── hooks/              # Shared hooks
│   ├── providers/          # Shared providers
│   └── styles/             # Shared styles
└── types/                  # Shared types
```

### Key Principles to Follow:
1. **Feature-first**: Each feature is a standalone module with all necessary layers
2. **Dependency Rule**: Dependencies can only point inwards (presentation -> application -> domain)
3. **Interface Segregation**: Define interfaces in the inner layers, implement in outer layers
4. **Separation of Concerns**: Each layer has a single, well-defined responsibility
5. **Testability**: Each layer should be easily testable in isolation

### Migration Steps:
1. Complete the auth feature architecture
2. Standardize the tasks feature architecture
3. Create shared infrastructure services
4. Move AI flows into appropriate features
5. Update dependency injection
6. Refactor imports to follow new architecture
7. Add chatbot-integration feature (See: `openspec/changes/add-chatbot-integration/`)

### API Routes vs Server Actions:
- **Server Actions** (Primary): Used for web application data operations
- **API Routes** (Secondary): Used only for external integrations (e.g., chatbot)
  - Located in: `src/features/{feature}/presentation/api/`
  - Pattern: Thin adapters that validate auth, call server actions, format JSON responses
  - Example: Chatbot integration at `src/features/chatbot-integration/presentation/api/`