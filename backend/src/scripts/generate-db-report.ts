
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
    } : undefined,
    connectionTimeoutMillis: 10000, // Use the increased timeout
});

async function generateReport() {
    console.log('Connecting to database...');
    const client = await pool.connect();
    try {
        console.log('Fetching tables...');
        // Get tables
        const tablesRes = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        const tables = tablesRes.rows.map(r => r.table_name);
        console.log(`Found ${tables.length} tables: ${tables.join(', ')}`);

        let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SplitRx - Database Dump</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333; }
                h1 { color: #2c3e50; }
                h2 { color: #34495e; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 40px; }
                .meta { background: #f8f9fa; padding: 10px; border-radius: 4px; border: 1px solid #dee2e6; margin-bottom: 20px; }
                table { border-collapse: collapse; width: 100%; margin-bottom: 20px; font-size: 14px; }
                th, td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
                th { background-color: #f8f9fa; font-weight: 600; position: sticky; top: 0; }
                tr:nth-child(even) { background-color: #f8f9fa; }
                tr:hover { background-color: #f1f3f5; }
                .empty { color: #868e96; font-style: italic; padding: 10px; border: 1px dashed #dee2e6; border-radius: 4px; }
                code { background: #e9ecef; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
                .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; color: white; background-color: #6c757d; }
            </style>
        </head>
        <body>
            <h1>SplitRx Database Snapshot</h1>
            <div class="meta">
                <strong>Generated at:</strong> ${new Date().toLocaleString()}<br>
                <strong>Database:</strong> ${process.env.DB_NAME} @ ${process.env.DB_HOST}
            </div>
        `;

        for (const table of tables) {
            console.log(`Processing table: ${table}`);
            html += `<h2>Table: <code>${table}</code></h2>`;

            // Get columns first to ensure order
            const columnsRes = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1 
                ORDER BY ordinal_position
            `, [table]);
            const columns = columnsRes.rows.map(c => c.column_name);

            // Get data
            const dataRes = await client.query(`SELECT * FROM "${table}" LIMIT 100`);
            const rows = dataRes.rows;

            html += `<p class="count">Row Count: ${rows.length} ${rows.length === 100 ? '(Limit Reached)' : ''}</p>`;

            if (rows.length === 0) {
                html += '<div class="empty">No data in this table.</div>';
                continue;
            }

            html += '<table><thead><tr>';
            columns.forEach(col => html += `<th>${col}</th>`);
            html += '</tr></thead><tbody>';

            rows.forEach(row => {
                html += '<tr>';
                columns.forEach(col => {
                    const val = row[col];
                    let displayVal = val;
                    if (val === null) displayVal = '<span style="color: #adb5bd">NULL</span>';
                    else if (val instanceof Date) displayVal = val.toISOString();
                    else if (typeof val === 'object') displayVal = JSON.stringify(val);
                    else if (typeof val === 'boolean') displayVal = val ? '✅' : '❌';

                    html += `<td>${displayVal}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table>';
        }

        html += '</body></html>';

        const outputPath = path.resolve(__dirname, '../../db-report.html');
        fs.writeFileSync(outputPath, html);
        console.log(`✅ Database report generated at: ${outputPath}`);

    } catch (err: any) {
        console.error('❌ Error generating report:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

generateReport();
