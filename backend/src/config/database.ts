import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'splitrx',
    user: process.env.DB_USER || 'splitrx_admin',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // SSL Configuration
    // SSL Configuration
    ssl: process.env.DB_SSL === 'true'
        ? {
            rejectUnauthorized: true,
            ca: process.env.DB_SSL_CA_PATH
                ? fs.readFileSync(path.resolve(process.cwd(), process.env.DB_SSL_CA_PATH)).toString()
                : process.env.DB_SSL_CA,
        }
        : undefined,
});

// Test connection
pool.on('connect', () => {
    console.log('✅ Database connected');
});

pool.on('error', (err) => {
    console.error('❌ Database error:', err);
    process.exit(-1);
});

export default pool;
