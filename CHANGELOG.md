# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.2.0-alpha] - 2024-03-10

### Added
- Complete Backend-for-Frontend (BFF) layer implementation
- Comprehensive unit tests for all BFF components
- Integration tests for critical system paths
- Complete Postman collection for API testing
- REST API specification
- Enhanced database design with plugin pattern
- Comprehensive project documentation
- Improved test helpers and mock implementations

### Enhanced
- Portfolio and holding services with robust business logic
- Stock quote handling optimization
- Transaction processing improvements
- Database query optimization
- Data validation and error handling
- Type safety across the data layer

## [v0.1.0-alpha] - 2024-02-20

### Added
- Initial backend-for-frontend (BFF) implementation with Express.js and TypeScript
- User management system with Keycloak authentication
- Portfolio management features:
  - Portfolio creation and management
  - Holdings tracking
  - Transaction recording (buy/sell)
- Stock information system:
  - Stock database with ISIN/WKN/Symbol support
  - Real-time quotes via Yahoo Finance
  - Historical price data
  - Stock categorization
- Security features:
  - JWT authentication
  - Input validation
  - SQL injection protection
  - Rate limiting
- PostgreSQL database implementation with:
  - Users table
  - Portfolios table
  - Holdings table
  - Transactions table
  - Stocks table
  - Quotes table
  - Categories table
- Comprehensive test suite for backend components
- API documentation
- Type-safe implementations across the codebase
- Performance optimizations:
  - Connection pooling
  - Response caching
  - Query optimization
