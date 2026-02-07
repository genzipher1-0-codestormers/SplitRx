
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('Testing Database Connection...');
console.log('Host:', process.env.DB_HOST);
console.log('Port:', process.env.DB_PORT);
console.log('User:', process.env.DB_USER);
console.log('DB Name:', process.env.DB_NAME);
console.log('SSL:', process.env.DB_SSL);

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
    } : undefined,
    connectionTimeoutMillis: 5000,
});

async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ Successfully connected to the database!');
        const res = await client.query('SELECT NOW()');
        console.log('Database Time:', res.rows[0].now);
        client.release();
        process.exit(0);
    } catch (err: any) {
        console.error('❌ Connection Failed:', err.message);
        if (err.code) console.error('Error Code:', err.code);
        process.exit(1);
    }
}

testConnection();
