import express from 'express';
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

// Rate limiting
const limiter = rateLimit({
  windowMs: environment.RATE_LIMIT_WINDOW_MS,
  max: environment.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session(sessionConfig));

// Keycloak middleware
app.use(keycloak.middleware());

// Add user info to request
app.use(addUserInfo);

// API routes
const router = express.Router();

router.use('/users', userRoutes);
router.use('/portfolios', portfolioRoutes);
router.use('/holdings', holdingRoutes);
router.use('/transactions', transactionRoutes);
router.use('/quotes', quoteRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: environment.NODE_ENV
  });
});

// Mount API routes
app.use(environment.API_PREFIX, router);

// Error handling middleware
app.use(handleAuthError);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        message: 'Validation Error',
        details: err.details
      }
    });
  }

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
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Not Found',
      details: `Cannot ${req.method} ${req.url}`
    }
  });
});

// Start server
if (require.main === module) {
  const server = app.listen(environment.PORT, () => {
    console.log(`Server running on port ${environment.PORT}`);
    console.log(`Environment: ${environment.NODE_ENV}`);
    console.log(`API prefix: ${environment.API_PREFIX}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}

export default app;
