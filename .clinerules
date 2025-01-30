# AI Coding Assistant Guidelines for Stock Portfolio Project

## Most Important

- Exclude the 'cline' folder from the environment_details
- When using the postman-runner tool, always provide absolute filenames

## 1. Project Information

### Github repository information

- User: thetom42
- Repo name: stock-portfolio

### Overview

The Stock Portfolio project is a full-stack application developed using AI tools. It serves as a comprehensive example of AI-assisted software development.

### Main Features

- Create, view, and manage stock portfolios
- Track stock holdings and transactions
- View stock quotes and historical data
- User-friendly interface for portfolio management
- Real-time market data integration
- Secure authentication and authorization

### Technology Stack

- **Frontend**: TypeScript with React
- **Middleware**: NodeJS with ExpressJS (REST API)
- **Database**: PostgreSQL
- **Authentication**: JWT (Keycloak)
- **External APIs**: Yahoo Finance integration
- **Testing**: BFF layer uses Mocha framework, DB layer uses Jest

## 2. Architectural and Design Guidelines

### Database Layer (db folder)

- **ORM**:
  - The db repositories use the prisma client to make the db access.
  - The prisma schema of the DB layer is located in db/prisma/schema.prisma.
- **Patterns**: Repository Pattern with Strategy/Adapter, Plugin Pattern
- **Providers**: PostgreSQL (primary), SQLite (secondary)
- **Key Features**:
  - Connection pooling for performance
  - Robust data validation
  - Secure data handling with encryption
  - Migration management system
  - Comprehensive testing strategy
- **Error Handling**:
  - Centralized error handling module
  - Custom error types
  - Consistent error responses
- **Transaction Management**:
  - Defined at service layer
  - Appropriate isolation levels
  - Timeout implementation

### BFF (Backend-For-Frontend) Layer (bff folder)

- **Architecture**:
  - Express.js with TypeScript
  - REST API principles
  - JWT authentication with Keycloak
  - Comprehensive middleware stack
- **Key Components**:
  - Controllers for HTTP requests
  - Services for business logic
  - Models for type-safe data handling
  - Middleware for auth, validation, and error handling
- **API Design**:
  - RESTful endpoints for all major operations
  - Versioned API endpoints
  - Consistent response formats
  - Comprehensive error handling
- **Misc**: The BFF layer uses the repositories of the DB layer for db access.
- **Tests**:
  - Test folder is bff/tests
  - Unit tests are located in bff/tests/unit
  - The package.json of the BFF layer defines test runs of different granularity like 'test:unit:services' or 'test:unit:services'
  - Integration tests are located in bff/tests/integration
  - Postman Collections are located in bff/tests/postman and named eg. like 'Categories.postman_collection.json' (note that entity names are plural!)
  - Postman Environment is in bff/tests/postman/Stock_Portfolio_BFF.postman_environment.json
  - Test Data Strategy for Postman Tests is located in docs/test-data-strategies.md
  - The test data that the DB is initialized with can be found in db/sql/test-data.sql.

### UI layer  (ui folder)

- yet to be implemented

### Important

- When asked to fix issues of a certain number, always read the issue with that number from Github. Exclude the cline folder from the context.
- Before suggesting to close an issue in Github, make sure that:
  1. All unit tests pass in case there are changes to the implemenation or test code,
  2. All Postman test assertions pass, if the changes are inside a Postman collection,
  3. All relevant changes are staged,
  4. Staged files are committed with a good commit message, referencing the issue, all of this using the git MCP server.
  5. Then Ask the user to make the push himself.
