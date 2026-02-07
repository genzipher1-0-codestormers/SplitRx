
import fs from 'fs';
import path from 'path';
import pool from '../config/database';

async function initDb() {
    console.log('🔄 Initializing Database Schema...');

    try {
        const sqlPath = path.join(__dirname, '../../../database/init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);
        console.log('✅ Database schema initialized successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        process.exit(1);
    }
}

initDb();
