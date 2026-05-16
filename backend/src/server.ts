import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

console.log('📝 Loading environment config...');
import { env } from './config/env';
console.log('✅ Environment loaded, PORT:', env.PORT);

import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { verifyEmailConnection } from './config/email';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import logger from './utils/logger';

console.log('📝 Creating Express app...');
const app: Application = express();
console.log('✅ Express app created');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));
}

// Rate limiting
app.use(apiRateLimiter);

// API routes
app.use('/api', routes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use(errorHandler);

// Start server immediately, then connect to services
console.log('📝 Starting HTTP server...');
const PORT = env.PORT;
console.log(`📝 Port: ${PORT}`);

const server = app.listen(PORT, () => {
  console.log(`🚀 NEBULA Server running on port ${PORT}`);
  console.log(`📡 API URL: ${env.API_URL}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
});

console.log('✅ HTTP server started, setting up background services...');

// Connect to services in background
(async () => {
  console.log('🔄 Starting background service connections...');
  
  // Connect to database (non-blocking)
  console.log('⏳ Connecting to database...');
  try {
    await connectDatabase(1, 5000);
    console.log('✅ Database connected');
    
    // Only check email if database is connected
    console.log('⏳ Checking email service...');
    verifyEmailConnection().catch(() => {
      console.warn('⚠️ Email service not available');
    });
  } catch (error) {
    console.warn('⚠️ Database not available, some features disabled');
  }

  // Connect to Redis (non-blocking)
  console.log('⏳ Connecting to Redis...');
  try {
    await connectRedis();
    console.log('✅ Redis connected');
  } catch (error) {
    console.warn('⚠️ Redis not available, continuing without cache');
  }
  
  console.log('✅ All background services initialized');
})();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
