import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { SECURITY_CONFIG } from '../config/security';

export class HashingService {
    /**
     * Hash password with bcrypt
     */
    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, SECURITY_CONFIG.password.saltRounds);
    }

    /**
     * Verify password against hash
     */
    static async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * SHA-256 hash for non-password data
     */
    static sha256(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}
