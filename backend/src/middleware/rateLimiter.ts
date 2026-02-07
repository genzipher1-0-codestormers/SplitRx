// =============================================
// SCENARIO #2: Rate Limiting (from "Still Spinnin")
// "Doors stayed open, never slowed the rush"
// We CLOSE the doors.
// =============================================

import rateLimit from 'express-rate-limit';
import { SECURITY_CONFIG } from '../config/security';

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: SECURITY_CONFIG.rateLimit.windowMs,
    max: SECURITY_CONFIG.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfter: Math.ceil(SECURITY_CONFIG.rateLimit.windowMs / 1000),
    },
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: SECURITY_CONFIG.rateLimit.windowMs,
    max: SECURITY_CONFIG.rateLimit.authMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many login attempts. Account temporarily locked.',
        code: 'AUTH_RATE_LIMITED',
    },
    skipSuccessfulRequests: true, // Only count failed attempts
});

// Prescription creation limiter (prevent abuse)
export const prescriptionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 prescriptions per hour per doctor
    message: {
        error: 'Prescription rate limit exceeded.',
        code: 'PRESCRIPTION_RATE_LIMITED',
    },
});
