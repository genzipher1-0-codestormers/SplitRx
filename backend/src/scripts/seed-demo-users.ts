import { v4 as uuid } from 'uuid';
import pool from '../config/database';
import { HashingService } from '../crypto/hashing';
import { SigningService } from '../crypto/signing';
const { encryptionService } = require('../crypto/encryption');

interface DemoUser {
    email: string;
    password: string;
    fullName: string;
    role: 'doctor' | 'patient' | 'pharmacist' | 'admin';
}

const demoUsers: DemoUser[] = [
    {
        email: 'admin@demo.com',
        password: 'admin123',
        fullName: 'System Administrator',
        role: 'admin'
    },
    {
        email: 'doctor1@demo.com',
        password: 'doctor123',
        fullName: 'Dr. John Smith',
        role: 'doctor'
    },
    {
        email: 'patient1@demo.com',
        password: 'patient123',
        fullName: 'Jane Doe',
        role: 'patient'
    },
    {
        email: 'pharmacist1@demo.com',
        password: 'pharmacist123',
        fullName: 'Bob Johnson',
        role: 'pharmacist'
    }
];

async function seedDemoUsers() {
    console.log('🌱 Seeding demo user accounts...');

    try {
        for (const user of demoUsers) {
            // Check if user already exists
            const existing = await pool.query(
                'SELECT id FROM users WHERE email = $1',
                [user.email]
            );

            if (existing.rows.length > 0) {
                console.log(`⏭️  User ${user.email} already exists. Skipping.`);
                continue;
            }

            console.log(`Creating ${user.role}: ${user.email}`);

            // Hash password
            const passwordHash = await HashingService.hashPassword(user.password);

            // Generate RSA key pair
            const { publicKey, privateKey } = SigningService.generateKeyPair();

            // Encrypt private key
            const encryptedPrivateKey = encryptionService.encrypt(privateKey);

            const userId = uuid();

            await pool.query(
                `INSERT INTO users (id, email, password_hash, full_name, role, public_key, private_key_encrypted, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
                [
                    userId,
                    user.email,
                    passwordHash,
                    user.fullName,
                    user.role,
                    publicKey,
                    JSON.stringify(encryptedPrivateKey),
                ]
            );

            console.log(`✅ Created ${user.role}: ${user.email}`);
        }

        console.log('\n✅ All demo users created successfully!');
        console.log('\n📝 Demo Credentials:');
        demoUsers.forEach(user => {
            console.log(`  ${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to seed demo users:', error);
        process.exit(1);
    }
}

seedDemoUsers();
