// =============================================
// SCENARIO #4: Input Validation
// "Everything is poisoned until verified"
// =============================================

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// ---- Validation Schemas ----

export const registerSchema = z.object({
    email: z.string().email().max(255),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128)
        .regex(/[A-Z]/, 'Must contain uppercase letter')
        .regex(/[a-z]/, 'Must contain lowercase letter')
        .regex(/[0-9]/, 'Must contain number')
        .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
    full_name: z.string()
        .min(1).max(100)
        .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in name'),
    role: z.enum(['doctor', 'patient', 'pharmacist']),
});

export const loginSchema = z.object({
    email: z.string().email().max(255),
    password: z.string().min(1).max(128),
});

export const prescriptionSchema = z.object({
    patient_id: z.string().uuid(),
    medication_name: z.string().min(1).max(200)
        .regex(/^[a-zA-Z0-9\s\-().,%/]+$/, 'Invalid characters in medication name'),
    dosage: z.string().min(1).max(100),
    frequency: z.string().min(1).max(100),
    duration: z.string().min(1).max(100),
    notes: z.string().max(1000).optional(),
    expires_in_days: z.number().int().min(1).max(365),
});

export const consentSchema = z.object({
    granted_to: z.string().uuid(),
    purpose: z.string().min(1).max(255),
    data_categories: z.array(z.string()).min(1),
    expires_in_days: z.number().int().min(1).max(365),
});

// ---- Validation Middleware Factory ----

export const validate = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = schema.safeParse(req.body);
            if (!result.success) {
                const zodError = result.error as any;
                return res.status(400).json({
                    error: 'Validation failed',
                    code: 'INVALID_INPUT',
                    details: zodError.errors.map((e: any) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
            }
            // Replace body with parsed (sanitized) data
            req.body = result.data;
            next();
        } catch (error) {
            return res.status(400).json({
                error: 'Invalid request body',
                code: 'PARSE_ERROR',
            });
        }
    };
};
