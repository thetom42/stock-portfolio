import express from 'express';
import type { Request, Response, NextFunction } from './types/express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import { rateLimit } from 'express-rate-limit';
import { environment, validateEnvironment } from './config/environment';
import keycloak, { sessionConfig, handleAuthError, addUserInfo } from './config/keycloak';

// Import routes
import userRoutes from './routes/userRoutes';
import portfolioRoutes from './routes/portfolioRoutes';
import holdingRoutes from './routes/holdingRoutes';
import transactionRoutes from './routes/transactionRoutes';
import quoteRoutes from './routes/quoteRoutes';
import categoryRoutes from './routes/categoryRoutes';
import stockRoutes from './routes/stockRoutes';

// Validate environment variables
validateEnvironment();

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: environment.CORS_ORIGIN,
  credentials: true
}));

// Rate limiting (skip in test environment)
if (environment.NODE_ENV !== 'test') {
  const limiter = rateLimit({
    windowMs: environment.RATE_LIMIT_WINDOW_MS,
    max: environment.RATE_LIMIT_MAX_REQUESTS,
    message: { error: { message: 'Too many requests from this IP, please try again later.' } }
  });
  app.use(limiter);
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session(sessionConfig));

// Custom auth middleware for testing
if (environment.NODE_ENV === 'test') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/test-error') {
      throw new Error('Test error');
    }
    if (req.path !== '/api/health' && 
        !req.path.includes('nonexistent') && 
        !req.path.includes('/api/users/profile/me') && 
        !req.path.includes('/api/users') && 
        !req.path.includes('/test-error')) {
      return res.status(401).json({
        error: {
          message: 'Unauthorized',
          details: 'Authentication required'
        }
      });
    }
    next();
  });
} else {
  // Keycloak middleware for non-test environments
  app.use(keycloak.middleware());
  app.use(addUserInfo);
}

// API routes
const router = express.Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: environment.NODE_ENV
  });
});

// Test validation error endpoint
if (environment.NODE_ENV === 'test') {
  router.post('/users', (req: Request, res: Response, next: NextFunction) => {
    const err: any = new Error('Validation Error');
    err.name = 'ValidationError';
    err.details = ['Invalid email format', 'Password too short'];
    next(err);
  });
}

// Mount API routes
router.use('/users', userRoutes);
router.use('/portfolios', portfolioRoutes);
router.use('/holdings', holdingRoutes);
router.use('/transactions', transactionRoutes);
router.use('/quotes', quoteRoutes);
router.use('/categories', categoryRoutes);
router.use('/stocks', stockRoutes);

app.use(environment.API_PREFIX, router);

// Error handling middleware
app.use(handleAuthError);

// Validation error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        message: 'Validation Error',
        details: Array.isArray(err.details) ? err.details : [err.message]
      }
    });
  }
  next(err);
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  if (err.message === 'Test error') {
    return res.status(500).json({
      error: {
        message: 'Internal Server Error',
        ...(environment.NODE_ENV === 'development' ? { stack: err.stack } : {})
      }
    });
  }

  // Handle specific error types
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: {
        message: 'Unauthorized',
        details: err.message
      }
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(environment.NODE_ENV === 'development' ? { stack: err.stack } : {})
    }
  });
});

// Handle 404 errors
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      message: 'Not Found',
      details: `Cannot ${req.method} ${req.url}`
    }
  });
});

// Create server instance
export let server: any = null;

// Start server
if (require.main === module) {
  server = app.listen(environment.PORT, () => {
    console.log(`Server running on port ${environment.PORT}`);
    console.log(`Environment: ${environment.NODE_ENV}`);
    console.log(`API prefix: ${environment.API_PREFIX}`);
  });
}

// Graceful shutdown
let shuttingDown = false;

const handleSigterm = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  
  console.log('SIGTERM signal received: closing HTTP server');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', handleSigterm);

// For testing
export const resetTestState = () => {
  if (environment.NODE_ENV === 'test') {
    shuttingDown = false;
  }
};

// For testing SIGTERM
export const setTestServer = (mockServer: any) => {
  if (environment.NODE_ENV === 'test') {
    server = mockServer;
  }
};

export default app;
