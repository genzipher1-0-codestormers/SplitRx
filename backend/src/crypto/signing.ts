// =============================================
// DIGITAL SIGNATURES
// Doctor signs prescriptions with their private key
// Anyone can verify with doctor's public key
// =============================================

import crypto from 'crypto';

export class SigningService {

    /**
     * Generate RSA key pair for a user
     */
    static generateKeyPair(): { publicKey: string; privateKey: string } {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            },
        });

        return { publicKey, privateKey };
    }

    /**
     * Doctor signs prescription data
     */
    static sign(data: string, privateKey: string): string {
        const sign = crypto.createSign('SHA256');
        sign.update(data);
        sign.end();
        return sign.sign(privateKey, 'hex');
    }

    /**
     * Pharmacist verifies prescription is genuinely from the doctor
     */
    static verify(data: string, signature: string, publicKey: string): boolean {
        try {
            const verify = crypto.createVerify('SHA256');
            verify.update(data);
            verify.end();
            return verify.verify(publicKey, signature, 'hex');
        } catch {
            return false;
        }
    }

    /**
     * Hash data (for payload integrity check)
     */
    static hash(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}
