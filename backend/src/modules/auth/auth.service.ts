import { v4 as uuid } from 'uuid';
import jwt from 'jsonwebtoken';
import pool from '../../config/database';
import { HashingService } from '../../crypto/hashing';
import { SigningService } from '../../crypto/signing';
import { auditService } from '../audit/audit.service';
import { SECURITY_CONFIG } from '../../config/security';

interface RegisterInput {
    email: string;
    password: string;
    full_name: string;
    role: 'doctor' | 'patient' | 'pharmacist';
}

interface LoginInput {
    email: string;
    password: string;
}

class AuthService {

    async register(input: RegisterInput) {
        // Check if email exists
        const existing = await pool.query(
            'SELECT id, is_active FROM users WHERE email = $1',
            [input.email]
        );

        // If email exists and is active, reject
        if (existing.rows.length > 0 && existing.rows[0].is_active) {
            throw new Error('Email already registered');
        }

        // Hash password
        const passwordHash = await HashingService.hashPassword(input.password);

        // Generate RSA key pair for digital signatures
        const { publicKey, privateKey } = SigningService.generateKeyPair();

        // Encrypt private key with user's password-derived key
        const { encryptionService } = require('../../crypto/encryption');
        const encryptedPrivateKey = encryptionService.encrypt(privateKey);

        // If email exists but is deactivated (erased account), reactivate it
        if (existing.rows.length > 0 && !existing.rows[0].is_active) {
            const userId = existing.rows[0].id;
            await pool.query(
                `UPDATE users SET 
                    password_hash = $1, 
                    full_name = $2, 
                    role = $3, 
                    public_key = $4, 
                    private_key_encrypted = $5, 
                    is_active = true,
                    failed_login_attempts = 0,
                    locked_until = NULL
                 WHERE id = $6`,
                [passwordHash, input.full_name, input.role, publicKey, JSON.stringify(encryptedPrivateKey), userId]
            );

            await auditService.log({
                actorId: userId,
                actorRole: input.role,
                action: 'USER_REACTIVATED',
                resourceType: 'user',
                resourceId: userId,
                metadata: { previouslyErased: true },
            });

            return { id: userId, email: input.email, role: input.role };
        }

        // New user registration
        const userId = uuid();

        await pool.query(
            `INSERT INTO users (id, email, password_hash, full_name, role, public_key, private_key_encrypted)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                userId,
                input.email,
                passwordHash,
                input.full_name,
                input.role,
                publicKey,
                JSON.stringify(encryptedPrivateKey),
            ]
        );

        await auditService.log({
            actorId: userId,
            actorRole: input.role,
            action: 'USER_REGISTERED',
            resourceType: 'user',
            resourceId: userId,
        });

        return { id: userId, email: input.email, role: input.role };
    }

    async login(input: LoginInput, ipAddress: string, userAgent: string) {
        // Find user
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND is_active = true',
            [input.email]
        );

        if (result.rows.length === 0) {
            // Don't reveal whether email exists
            throw new Error('Invalid credentials');
        }

        const user = result.rows[0];

        // Check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            throw new Error('Account temporarily locked. Try again later.');
        }

        // Verify password
        const validPassword = await HashingService.verifyPassword(
            input.password,
            user.password_hash
        );

        if (!validPassword) {
            // Increment failed attempts
            const newAttempts = (user.failed_login_attempts || 0) + 1;
            const lockUntil = newAttempts >= SECURITY_CONFIG.session.maxFailedAttempts
                ? new Date(Date.now() + SECURITY_CONFIG.session.lockoutDuration)
                : null;

            await pool.query(
                `UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3`,
                [newAttempts, lockUntil, user.id]
            );

            await auditService.log({
                actorId: user.id,
                actorRole: user.role,
                action: 'LOGIN_FAILED',
                resourceType: 'auth',
                metadata: { attempt: newAttempts, locked: !!lockUntil },
                ipAddress,
                userAgent,
            });

            throw new Error('Invalid credentials');
        }

        // Check if user has keys (might be missing after password reset)
        if (!user.public_key || !user.private_key_encrypted) {
            // Generate new RSA key pair
            const { publicKey, privateKey } = SigningService.generateKeyPair();

            // Encrypt private key with user's NEW password (the one they just logged in with)
            const { encryptionService } = require('../../crypto/encryption');
            const encryptedPrivateKey = encryptionService.encrypt(privateKey);

            // Update user record
            await pool.query(
                `UPDATE users SET 
                    public_key = $1, 
                    private_key_encrypted = $2,
                    updated_at = NOW()
                 WHERE id = $3`,
                [publicKey, JSON.stringify(encryptedPrivateKey), user.id]
            );

            await auditService.log({
                actorId: user.id,
                actorRole: user.role,
                action: 'KEYS_REGENERATED',
                resourceType: 'user',
                resourceId: user.id,
                metadata: { reason: 'Missing keys (likely after password reset)' },
                ipAddress,
                userAgent,
            });
        }

        // Reset failed attempts on success
        await pool.query(
            `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, 
             last_login_at = NOW(), last_login_ip = $1, last_login_user_agent = $2
             WHERE id = $3`,
            [ipAddress, userAgent, user.id]
        );

        // Create session
        const sessionId = uuid();
        const refreshToken = uuid();
        const refreshTokenHash = HashingService.sha256(refreshToken);
        const deviceFingerprint = HashingService.sha256(
            `${ipAddress}-${userAgent}`
        );

        await pool.query(
            `INSERT INTO sessions (id, user_id, refresh_token_hash, ip_address, 
             user_agent, device_fingerprint, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '7 days')`,
            [sessionId, user.id, refreshTokenHash, ipAddress, userAgent, deviceFingerprint]
        );

        // Generate JWT access token (short-lived)
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is required');
        }
        const accessToken = jwt.sign(
            {
                sub: user.id,
                email: user.email,
                role: user.role,
                sessionId: sessionId,
            },
            secret,
            { expiresIn: SECURITY_CONFIG.jwt.accessTokenExpiry as any }
        );

        await auditService.log({
            actorId: user.id,
            actorRole: user.role,
            action: 'LOGIN_SUCCESS',
            resourceType: 'auth',
            resourceId: sessionId,
            ipAddress,
            userAgent,
        });

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
            },
        };
    }

    async refreshToken(refreshToken: string) {
        const refreshTokenHash = HashingService.sha256(refreshToken);

        const result = await pool.query(
            `SELECT s.*, u.email, u.role, u.full_name 
             FROM sessions s 
             JOIN users u ON s.user_id = u.id
             WHERE s.refresh_token_hash = $1 AND s.is_active = true AND s.expires_at > NOW()`,
            [refreshTokenHash]
        );

        if (result.rows.length === 0) {
            throw new Error('Invalid or expired refresh token');
        }

        const session = result.rows[0];

        // Rotate refresh token (one-time use)
        const newRefreshToken = uuid();
        const newRefreshTokenHash = HashingService.sha256(newRefreshToken);

        await pool.query(
            `UPDATE sessions SET refresh_token_hash = $1, last_activity = NOW() WHERE id = $2`,
            [newRefreshTokenHash, session.id]
        );

        // Issue new access token
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is required');
        }
        const accessToken = jwt.sign(
            {
                sub: session.user_id,
                email: session.email,
                role: session.role,
                sessionId: session.id,
            },
            secret,
            { expiresIn: SECURITY_CONFIG.jwt.accessTokenExpiry as any }
        );

        return { accessToken, refreshToken: newRefreshToken };
    }

    async logout(sessionId: string, userId: string) {
        await pool.query(
            'UPDATE sessions SET is_active = false WHERE id = $1 AND user_id = $2',
            [sessionId, userId]
        );

        await auditService.log({
            actorId: userId,
            actorRole: 'patient', // will be overridden
            action: 'LOGOUT',
            resourceType: 'auth',
            resourceId: sessionId,
        });
    }
}

export const authService = new AuthService();
