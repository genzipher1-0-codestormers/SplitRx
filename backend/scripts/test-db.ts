
import pool from '../src/config/database';

async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ Successfully connected to database!');
        const res = await client.query('SELECT NOW()');
        console.log('Current Database Time:', res.rows[0].now);
        client.release();
    } catch (err) {
        console.error('❌ Failed to connect to database:', err);
        process.exitCode = 1;
    } finally {
        // Ensure logs are flushed
        setTimeout(() => process.exit(), 1000);
    }
}

testConnection();
