// =============================================
// SCENARIO #3: Immutable Hash-Chained Audit Log
// "A system that cannot guarantee the integrity 
//  of its logs has zero knowledge of its own 
//  security state."
// =============================================

import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import pool from '../../config/database';

interface AuditLogEntry {
    actorId: string | null;
    actorRole: 'doctor' | 'patient' | 'pharmacist' | 'admin' | 'system';
    action: string;
    resourceType: string;
    resourceId?: string;
    resourceOwnerId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

class AuditService {

    /**
     * Append an entry to the immutable audit log
     * Each entry is hash-chained to the previous one
     */
    /**
     * Append an entry to the immutable audit log
     * Each entry is hash-chained to the previous one
     * @param client Optional database client for transactional integrity
     */
    async log(entry: AuditLogEntry, client?: any): Promise<void> {
        // Use provided client or get a new one from the pool
        const dbClient = client || await pool.connect();
        const isExternalTransaction = !!client;

        try {
            if (!isExternalTransaction) {
                await dbClient.query('BEGIN');
                // Lock the table to prevent concurrent inserts from creating race conditions
                await dbClient.query('LOCK TABLE audit_log IN SHARE ROW EXCLUSIVE MODE');
            }

            // Get the hash of the last entry
            const lastEntry = await dbClient.query(
                'SELECT entry_hash FROM audit_log ORDER BY timestamp DESC LIMIT 1'
            );
            const previousHash = lastEntry.rows[0]?.entry_hash || '0'.repeat(64);

            const id = uuid();
            const timestamp = new Date().toISOString();

            // Create the entry object for hashing
            const hashPayload = {
                id,
                timestamp,
                actorId: entry.actorId,
                actorRole: entry.actorRole,
                action: entry.action,
                resourceType: entry.resourceType,
                resourceId: entry.resourceId || null,
                previousHash,
            };

            // Compute hash of this entry (chained to previous)
            const entryHash = crypto
                .createHash('sha256')
                .update(JSON.stringify(hashPayload))
                .digest('hex');

            // INSERT only — triggers prevent UPDATE/DELETE
            await dbClient.query(
                `INSERT INTO audit_log 
                 (id, actor_id, actor_role, action, resource_type, resource_id, 
                  resource_owner_id, metadata, ip_address, user_agent, 
                  previous_hash, entry_hash, timestamp)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [
                    id,
                    entry.actorId,
                    entry.actorRole,
                    entry.action,
                    entry.resourceType,
                    entry.resourceId || null,
                    entry.resourceOwnerId || null,
                    JSON.stringify(entry.metadata || {}),
                    entry.ipAddress || null,
                    entry.userAgent || null,
                    previousHash,
                    entryHash,
                    timestamp,
                ]
            );

            if (!isExternalTransaction) {
                await dbClient.query('COMMIT');
            }
        } catch (error) {
            if (!isExternalTransaction) {
                await dbClient.query('ROLLBACK');
            }
            console.error('Audit log error:', error);
            // Audit failures should never crash the app
            // but should be reported to monitoring
            // If external transaction, we let the caller handle the error (or we could rethrow so they rollback)
            if (isExternalTransaction) throw error;
        } finally {
            if (!isExternalTransaction) {
                dbClient.release();
            }
        }
    }

    /**
     * Verify the integrity of the entire audit chain
     * If ANY entry was tampered with, this will detect it
     */
    async verifyChainIntegrity(): Promise<{
        valid: boolean;
        totalEntries: number;
        brokenAt?: string;
    }> {
        const result = await pool.query(
            'SELECT * FROM audit_log ORDER BY timestamp ASC'
        );

        const entries = result.rows;
        let previousHash = '0'.repeat(64);

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];

            // Check chain link
            if (entry.previous_hash !== previousHash) {
                return {
                    valid: false,
                    totalEntries: entries.length,
                    brokenAt: entry.id,
                };
            }

            // Recompute hash to verify integrity
            const hashPayload = {
                id: entry.id,
                timestamp: entry.timestamp.toISOString(),
                actorId: entry.actor_id,
                actorRole: entry.actor_role,
                action: entry.action,
                resourceType: entry.resource_type,
                resourceId: entry.resource_id,
                previousHash: entry.previous_hash,
            };

            const computedHash = crypto
                .createHash('sha256')
                .update(JSON.stringify(hashPayload))
                .digest('hex');

            if (computedHash !== entry.entry_hash) {
                return {
                    valid: false,
                    totalEntries: entries.length,
                    brokenAt: entry.id,
                };
            }

            previousHash = entry.entry_hash;
        }

        return { valid: true, totalEntries: entries.length };
    }

    /**
     * Get audit logs for a specific resource
     */
    async getLogsForResource(resourceId: string): Promise<any[]> {
        const result = await pool.query(
            `SELECT id, actor_id, actor_role, action, resource_type, 
                    resource_id, resource_owner_id, metadata, timestamp, entry_hash
             FROM audit_log 
             WHERE resource_id = $1 
             ORDER BY timestamp DESC`,
            [resourceId]
        );
        return result.rows;
    }

    /**
     * Get audit logs for a specific user (GDPR Art. 15 - Right of Access)
     * Only shows logs from after the user's most recent registration/reactivation
     * to provide a "fresh start" experience after erasure and re-registration.
     */
    async getLogsForUser(userId: string): Promise<any[]> {
        // Find the timestamp of the user's most recent registration or reactivation
        const lastActivationResult = await pool.query(
            `SELECT timestamp FROM audit_log 
             WHERE resource_id = $1 
               AND action IN ('USER_REGISTERED', 'USER_REACTIVATED')
             ORDER BY timestamp DESC 
             LIMIT 1`,
            [userId]
        );

        const lastActivationTime = lastActivationResult.rows[0]?.timestamp || new Date(0);

        // Only return logs from after the last activation
        const result = await pool.query(
            `SELECT id, action, resource_type, resource_id, resource_owner_id,
                    metadata, timestamp, entry_hash
             FROM audit_log 
             WHERE resource_owner_id = $1 
               AND timestamp >= $2
             ORDER BY timestamp DESC
             LIMIT 100`,
            [userId, lastActivationTime]
        );
        return result.rows;
    }
}

export const auditService = new AuditService();
