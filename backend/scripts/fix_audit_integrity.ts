import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Load environment variables
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
            ca: process.env.DB_SSL_CA_PATH
                ? fs.readFileSync(path.resolve(__dirname, '../', process.env.DB_SSL_CA_PATH)).toString()
                : process.env.DB_SSL_CA,
        }
        : undefined,
});

async function fixAuditIntegrity() {
    const client = await pool.connect();
    console.log('🔌 Connected to database...');

    try {
        await client.query('BEGIN');
        // Lock the table exclusively to prevent ANY concurrent reads/writes while we fix the chain
        await client.query('LOCK TABLE audit_log IN ACCESS EXCLUSIVE MODE');

        // Fetch all logs ordered by time
        const result = await client.query(
            'SELECT * FROM audit_log ORDER BY timestamp ASC'
        );
        const entries = result.rows;

        console.log(`📋 Found ${entries.length} audit entries. Verifying chain...`);

        let previousHash = '0'.repeat(64);
        let fixedCount = 0;

        for (const entry of entries) {
            let needsUpdate = false;

            // 1. Check Previous Hash Link
            if (entry.previous_hash !== previousHash) {
                console.log(`⚠️  Broken Link at ID: ${entry.id}`);
                console.log(`   Expected Prev: ${previousHash.substring(0, 8)}...`);
                console.log(`   Found Prev:    ${entry.previous_hash.substring(0, 8)}...`);
                needsUpdate = true;
            }

            // 2. Recompute Hash
            const hashPayload = {
                id: entry.id,
                timestamp: entry.timestamp.toISOString(),
                actorId: entry.actor_id,
                actorRole: entry.actor_role,
                action: entry.action,
                resourceType: entry.resource_type,
                resourceId: entry.resource_id,
                previousHash: needsUpdate ? previousHash : entry.previous_hash, // Use CORRECT previous hash
            };

            const computedHash = crypto
                .createHash('sha256')
                .update(JSON.stringify(hashPayload))
                .digest('hex');

            if (computedHash !== entry.entry_hash) {
                console.log(`⚠️  Hash Mismatch at ID: ${entry.id}`);
                console.log(`   Expected Hash: ${computedHash.substring(0, 8)}...`);
                console.log(`   Found Hash:    ${entry.entry_hash.substring(0, 8)}...`);
                needsUpdate = true;
            }

            if (needsUpdate) {
                console.log(`🛠️  Fixing entry ${entry.id}...`);
                await client.query(
                    `UPDATE audit_log 
                     SET previous_hash = $1, entry_hash = $2
                     WHERE id = $3`,
                    [previousHash, computedHash, entry.id]
                );
                fixedCount++;
                // Update in memory for next iteration
                entry.entry_hash = computedHash;
            }

            previousHash = computedHash;
        }

        await client.query('COMMIT');

        if (fixedCount > 0) {
            console.log(`✅ Successfully fixed ${fixedCount} broken audit entries.`);
        } else {
            console.log('✅ Audit chain is already valid. No changes made.');
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error fixing audit chain:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

fixAuditIntegrity();
