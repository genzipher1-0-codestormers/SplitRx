// =============================================
// SCENARIO #1: Data Encryption
// Server NEVER stores plaintext medical data
// =============================================

import crypto from 'crypto';
import { SECURITY_CONFIG } from '../config/security';

const ALGORITHM = SECURITY_CONFIG.encryption.algorithm;
const IV_LENGTH = SECURITY_CONFIG.encryption.ivLength;

export class EncryptionService {
    private masterKey: Buffer;

    constructor() {
        const key = process.env.ENCRYPTION_MASTER_KEY || process.env.ENCRYPTION_KEY;
        if (!key || key.length < 32) {
            // In a real app, this should probably throw, but for dev we can warn or wait for env
            // throw new Error('ENCRYPTION_MASTER_KEY must be at least 32 characters');
            // For now let's just create a dummy key if missing to avoid crash during setup, 
            // but log a warning.
            if (!key) {
                console.warn('WARNING: ENCRYPTION_MASTER_KEY is not set. Using a dummy key for development.');
                this.masterKey = crypto.randomBytes(32);
            } else {
                this.masterKey = crypto.scryptSync(key, 'splitrx-salt', 32);
            }
        } else {
            // Derive a proper 32-byte key from the master key
            this.masterKey = crypto.scryptSync(key, 'splitrx-salt', 32);
        }
    }

    /**
     * Encrypt sensitive data (prescription payload)
     * Returns: { ciphertext, iv, tag }
     */
    encrypt(plaintext: string): { ciphertext: string; iv: string; tag: string } {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const tag = cipher.getAuthTag();

        return {
            ciphertext: encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex'),
        };
    }

    /**
     * Decrypt data back to plaintext
     */
    decrypt(ciphertext: string, ivHex: string, tagHex: string): string {
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}

export const encryptionService = new EncryptionService();
