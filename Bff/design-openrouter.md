# Stock Portfolio BFF Design

## Overview
The Backend-For-Frontend (BFF) layer serves as a REST API middleware between the frontend applications and the PostgreSQL database. It is built using TypeScript and Express.js, providing a clean and type-safe implementation.

## Architecture

### Core Components

1. **Server Setup**
   - Express.js application with TypeScript
   - Environment configuration management
   - CORS configuration
   - Error handling middleware
   - JWT authentication middleware (Keycloak integration)

2. **API Structure**
   ```
   src/
   ├── config/           # Configuration management
   ├── controllers/      # Request handlers
   ├── models/          # TypeScript interfaces/types
   ├── routes/          # API route definitions
   ├── services/        # Business logic
   ├── middleware/      # Custom middleware
   ├── utils/           # Helper functions
   └── types/           # TypeScript type definitions
   ```

### API Endpoints

Based on the database schema, the following REST endpoints will be implemented:

1. **User Management**
   - `POST /api/users` - Create new user
   - `GET /api/users/:id` - Get user details
   - `PUT /api/users/:id` - Update user details
   - `DELETE /api/users/:id` - Delete user

2. **Portfolio Management**
   - `POST /api/portfolios` - Create new portfolio
   - `GET /api/portfolios` - List user's portfolios
   - `GET /api/portfolios/:id` - Get portfolio details
   - `PUT /api/portfolios/:id` - Update portfolio
   - `DELETE /api/portfolios/:id` - Delete portfolio

3. **Holdings Management**
   - `POST /api/portfolios/:id/holdings` - Add holding to portfolio
   - `GET /api/portfolios/:id/holdings` - List portfolio holdings
   - `GET /api/holdings/:id` - Get holding details
   - `PUT /api/holdings/:id` - Update holding
   - `DELETE /api/holdings/:id` - Delete holding

4. **Transaction Management**
   - `POST /api/holdings/:id/transactions` - Record new transaction
   - `GET /api/holdings/:id/transactions` - List holding transactions
   - `GET /api/transactions/:id` - Get transaction details
   - `PUT /api/transactions/:id` - Update transaction
   - `DELETE /api/transactions/:id` - Delete transaction

5. **Stock Management**
   - `GET /api/stocks` - List all stocks
   - `GET /api/stocks/:isin` - Get stock details
   - `GET /api/stocks/search` - Search stocks
   - `GET /api/categories` - List stock categories

6. **Quote Management**
   - `GET /api/stocks/:isin/quotes` - Get stock quotes
   - `GET /api/quotes/latest` - Get latest quotes for multiple stocks

### Data Models

TypeScript interfaces reflecting the database schema:

```typescript
interface User {
    id: string;
    name: string;
    surname: string;
    email: string;
    nickname: string;
    password: string;
    joinDate: Date;
}

interface Portfolio {
    id: string;
    name: string;
    createdAt: Date;
    userId: string;
}

interface Holding {
    id: string;
    portfolioId: string;
    isin: string;
    quantity: number;
    startDate: Date;
    endDate?: Date;
}

interface Transaction {
    id: string;
    holdingId: string;
    buy: boolean;
    transactionTime: Date;
    amount: number;
    price: number;
    commission: number;
    broker: string;
}

interface Stock {
    isin: string;
    categoryId: string;
    name: string;
    wkn: string;
    symbol: string;
}

interface Quote {
    id: string;
    isin: string;
    price: number;
    currency: string;
    marketTime: Date;
    exchange: string;
}

interface Category {
    id: string;
    name: string;
}
```

### Authentication & Authorization

- JWT-based authentication using Keycloak
- Token validation middleware
- Role-based access control for endpoints
- Secure password handling

### External Integrations

1. **Stock Market Data**
   - Integration with Yahoo Finance API
   - Caching layer for market data
   - Rate limiting implementation

2. **Database**
   - PostgreSQL connection pool
   - Transaction management
   - Query builders and type-safe queries

### Error Handling

- Standardized error response format
- HTTP status code mapping
- Validation error handling
- Custom error types for different scenarios

### Performance Considerations

1. **Caching**
   - Response caching for stock data
   - Query result caching
   - Cache invalidation strategies

2. **Query Optimization**
   - Efficient database queries
   - Pagination implementation
   - Field selection/filtering

3. **Security**
   - Input validation
   - SQL injection prevention
   - XSS protection
   - Rate limiting
   - CORS configuration

### Testing Strategy

1. **Unit Tests**
   - Controller tests
   - Service layer tests
   - Utility function tests

2. **Integration Tests**
   - API endpoint tests
   - Database interaction tests
   - External API integration tests

3. **Performance Tests**
   - Load testing
   - Response time benchmarks
   - Concurrent request handling

### Development Tools

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Swagger/OpenAPI for API documentation
- Docker for containerization
- Jest for testing

### Logging & Monitoring

- Request/response logging
- Error logging
- Performance metrics
- Health check endpoints
