# CRUSH - Coding Reference for Stock Portfolio Project

## Build Commands
```bash
# Build entire project
npm run build

# Build database layer
cd db && npm run build

# Build BFF layer
cd bff && npm run build
```

## Lint/Format Commands
```bash
# Lint BFF layer
cd bff && npm run lint

# Format BFF layer
cd bff && npm run format
```

## Test Commands
```bash
# Run all tests
npm run test

# Run database tests
cd db && npm test

# Run BFF tests
cd bff && npm test

# Run specific BFF test categories
cd bff && npm run test:unit:services
cd bff && npm run test:unit:controller
cd bff && npm run test:unit:middleware
cd bff && npm run test:unit:utils
cd bff && npm run test:unit:config
cd bff && npm run test:integration

# Run single test file in BFF (example)
cd bff && cd tests/unit/services && mocha categoryService.test.ts --config .mocharc.js

# Watch mode for database tests
cd db && npm run test:watch

# Run single database test file
cd db && npx jest tests/unit/repositories/CategoryRepository.test.ts
```

## Code Style Guidelines

### Imports
- Use absolute imports where possible
- Group imports: node_modules first, then local imports
- Use type-only imports for types: `import type { Type } from './file'`
- Import interfaces/types separately from implementations

### Formatting
- TypeScript with strict typing
- 4 spaces for indentation
- Semicolons required
- Single quotes for strings
- Trailing commas in objects and arrays

### Types
- Use TypeScript interfaces for data structures
- Define DTOs for API requests/responses
- Use proper typing for function parameters and return values
- Leverage type inference where appropriate

### Naming Conventions
- camelCase for variables and functions
- PascalCase for classes, interfaces, and types
- UPPER_SNAKE_CASE for constants
- Descriptive names for variables and functions
- Boolean variables prefixed with is/has/can

### Error Handling
- Use try/catch blocks appropriately
- Throw meaningful error messages
- Handle specific error cases with proper HTTP status codes
- Use next() for Express middleware error propagation
- Log errors appropriately but don't expose internal details

### Architecture Patterns
- Repository pattern for database access
- Service layer for business logic
- Controller layer for HTTP request handling
- DTOs for data transfer between layers
- Singleton pattern for services

### Database Layer (db/)
- Uses Prisma ORM
- Repository pattern with DB-specific implementations
- Jest for testing

### BFF Layer (bff/)
- Express.js with TypeScript
- Mocha for testing
- RESTful API design
- Keycloak JWT authentication