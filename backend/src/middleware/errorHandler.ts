import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('Unhandled error:', err);

    // Never leak stack traces in production
    const isDev = process.env.NODE_ENV === 'development';

    res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        ...(isDev && { stack: err.stack, message: err.message }),
    });
};
