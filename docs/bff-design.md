# Stock Portfolio BFF Design Document

## Overview
The Backend-For-Frontend (BFF) layer serves as a REST API middleware between the frontend application and the database/external services. It is built using Express.js with TypeScript, providing type safety and better developer experience.

## Architecture

### Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT (Keycloak integration)
- **Database Access**: PostgreSQL client (pg with types)
- **External APIs**: Yahoo Finance integration
- **Testing**: Mocha

### Project Structure
```
bff/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── database.ts        # Database configuration
│   │   ├── keycloak.ts        # Keycloak configuration
│   │   └── environment.ts     # Environment variables
│   ├── controllers/           # Request handlers
│   │   ├── userController.ts
│   │   ├── portfolioController.ts
│   │   ├── stockController.ts
│   │   ├── holdingController.ts
│   │   ├── transactionController.ts
│   │   └── quoteController.ts
│   ├── models/                # Data models/interfaces
│   │   ├── User.ts
│   │   ├── Portfolio.ts
│   │   ├── Stock.ts
│   │   ├── Holding.ts
│   │   ├── Transaction.ts
│   │   └── Quote.ts
│   ├── services/              # Business logic
│   │   ├── userService.ts
│   │   ├── portfolioService.ts
│   │   ├── stockService.ts
│   │   ├── holdingService.ts
│   │   ├── transactionService.ts
│   │   ├── quoteService.ts
│   │   └── yahooFinanceService.ts
│   ├── middleware/            # Custom middleware
│   │   ├── auth.ts           # Authentication middleware
│   │   ├── validation.ts     # Request validation
│   │   └── error.ts          # Error handling
│   ├── routes/               # API route definitions
│   │   ├── userRoutes.ts
│   │   ├── portfolioRoutes.ts
│   │   ├── stockRoutes.ts
│   │   ├── holdingRoutes.ts
│   │   ├── transactionRoutes.ts
│   │   └── quoteRoutes.ts
│   ├── utils/                # Utility functions
│   │   ├── database.ts      # Database utilities
│   │   └── validation.ts    # Validation helpers
│   └── app.ts               # Express application setup
└── tests/                   # Test files
    ├── integration/
    └── unit/

```

## API Endpoints

### User Management
- `POST /api/users` - Register new user
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user account

### Portfolio Management
- `POST /api/portfolios` - Create new portfolio
- `GET /api/portfolios` - List user's portfolios
- `GET /api/portfolios/:id` - Get portfolio details
- `PUT /api/portfolios/:id` - Update portfolio
- `DELETE /api/portfolios/:id` - Delete portfolio

### Stock Management
- `GET /api/stocks` - List available stocks
- `GET /api/stocks/:isin` - Get stock details
- `GET /api/stocks/search` - Search stocks
- `GET /api/stocks/categories` - List stock categories

### Holdings Management
- `POST /api/portfolios/:id/holdings` - Add holding to portfolio
- `GET /api/portfolios/:id/holdings` - List portfolio holdings
- `GET /api/holdings/:id` - Get holding details
- `PUT /api/holdings/:id` - Update holding
- `DELETE /api/holdings/:id` - Remove holding

### Transaction Management
- `POST /api/holdings/:id/transactions` - Record new transaction
- `GET /api/holdings/:id/transactions` - List holding transactions
- `GET /api/transactions/:id` - Get transaction details

### Stock Quotes
- `GET /api/quotes/:isin` - Get latest stock quote
- `GET /api/quotes/:isin/history` - Get historical quotes

## Authentication & Authorization

- JWT-based authentication using Keycloak
- Token validation middleware for protected routes
- Role-based access control for different operations
- Refresh token handling

## Data Layer

### Database Interaction
- Type-safe database access using pg with TypeScript
- Repository pattern for database operations
- Connection pooling for optimal performance
- Transaction support for complex operations

### External API Integration
- Yahoo Finance API integration for real-time stock data
- Caching layer for frequently accessed data
- Rate limiting for external API calls
- Error handling and retry mechanisms

## Error Handling

- Centralized error handling middleware
- Standardized error response format
- HTTP status codes mapping
- Validation error handling
- External service error handling

## Validation

- Request payload validation using JSON Schema
- Input sanitization
- Type validation using TypeScript
- Business rule validation in service layer

## Logging & Monitoring

- Request/Response logging
- Error logging
- Performance metrics
- External service call monitoring
- Database query monitoring

## Security Considerations

- JWT token validation
- CORS configuration
- Rate limiting
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Secure headers

## Testing Strategy

- Unit tests for services and utilities
- Integration tests for API endpoints
- Database interaction tests
- External API mocking
- Authentication/Authorization tests
- Performance tests

## Performance Optimization

- Connection pooling
- Response caching
- Query optimization
- Pagination for large datasets
- Efficient error handling
- Resource cleanup

## Development Practices

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Git hooks for pre-commit checks
- Swagger/OpenAPI documentation
- Environment-based configuration
