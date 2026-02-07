import { v4 as uuid } from 'uuid';
import pool from '../config/database';
import { HashingService } from '../crypto/hashing';
import { SigningService } from '../crypto/signing';
// Using require for encryption service as seen in auth.service.ts
const { encryptionService } = require('../crypto/encryption');

async function seedAdmin() {
    console.log('🌱 Seeding administrator account...');

    try {
        // Check if admin already exists
        const existing = await pool.query(
            "SELECT id FROM users WHERE role = 'admin'"
        );

        if (existing.rows.length > 0) {
            console.log('✅ Administrator account already exists. Skipping.');
            process.exit(0);
        }

        if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
            console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
            process.exit(1);
        }

        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        const fullName = 'System Administrator';

        console.log(`Creating admin user: ${email}`);

        // Hash password
        const passwordHash = await HashingService.hashPassword(password);

        // Generate RSA key pair
        const { publicKey, privateKey } = SigningService.generateKeyPair();

        // Encrypt private key
        const encryptedPrivateKey = encryptionService.encrypt(privateKey);

        const userId = uuid();

        await pool.query(
            `INSERT INTO users (id, email, password_hash, full_name, role, public_key, private_key_encrypted, is_active)
             VALUES ($1, $2, $3, $4, 'admin', $5, $6, true)`,
            [
                userId,
                email,
                passwordHash,
                fullName,
                publicKey,
                JSON.stringify(encryptedPrivateKey),
            ]
        );

        console.log('✅ Administrator account created successfully!');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log('⚠️  Please change this password immediately after logging in.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to seed admin:', error);
        process.exit(1);
    }
}

seedAdmin();
