import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import routes from './routes';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// =============================================
// SECURITY MIDDLEWARE STACK
// =============================================

// Security headers (XSS, Clickjacking, MIME sniffing, etc.)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));

// CORS - restrictive
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
app.use('/api/', apiLimiter);

// Body parsing with size limits
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Logging (in production, use structured logging)
app.use(morgan('combined'));

// Remove X-Powered-By header
app.disable('x-powered-by');

// =============================================
// ROUTES
// =============================================
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
});

// Error handler
app.use(errorHandler);

export default app;
