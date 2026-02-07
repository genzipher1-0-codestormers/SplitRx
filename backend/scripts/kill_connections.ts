
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true'
        ? {
            rejectUnauthorized: true,
            // If path provided, read file. Otherwise use CA string directly if available, or undefined.
            ca: process.env.DB_SSL_CA_PATH
                ? require('fs').readFileSync(path.resolve(__dirname, '../', process.env.DB_SSL_CA_PATH)).toString()
                : process.env.DB_SSL_CA,
        }
        : undefined,
});

async function killConnections() {
    const client = await pool.connect();
    try {
        console.log('🔪 Terminating all other connections...');
        console.log('🔪 Terminating connections for current user...');

        // 1. Get PIDs first
        const pids = await client.query(`
            SELECT pid 
            FROM pg_stat_activity 
            WHERE usename = $1 
            AND pid <> pg_backend_pid() 
            AND datname = $2
        `, [process.env.DB_USER, process.env.DB_NAME]);

        console.log(`Found ${pids.rowCount} connections to terminate.`);

        let terminated = 0;
        for (const row of pids.rows) {
            try {
                await client.query('SELECT pg_terminate_backend($1)', [row.pid]);
                terminated++;
            } catch (e) {
                console.warn(`Failed to terminate PID ${row.pid}:`, e);
            }
        }

        console.log(`✅ Terminated ${terminated} connections.`);
    } catch (err) {
        console.error('❌ Error terminating connections:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

killConnections();
