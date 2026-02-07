
import pool from '../config/database';

async function inspectTable(tableName: string) {
    try {
        console.log(`\n--- Inspecting ${tableName} ---`);
        const res = await pool.query(`
            SELECT column_name, data_type, character_maximum_length, is_nullable
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
        `, [tableName]);
        console.table(res.rows);

        // Check constraints
        const constraints = await pool.query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = $1)
        `, [tableName]);

        if (constraints.rows.length > 0) {
            console.log('Constraints:');
            constraints.rows.forEach(r => console.log(`${r.conname}: ${r.pg_get_constraintdef}`));
        }
    } catch (err) {
        console.error(`Error inspecting ${tableName}:`, err);
    }
}

async function run() {
    try {
        await inspectTable('audit_log');
    } finally {
        await pool.end();
    }
}

run();
