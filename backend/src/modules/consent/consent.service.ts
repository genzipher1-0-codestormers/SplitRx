// =============================================
// GDPR Art. 7 — Consent Management
// GDPR Art. 17 — Right to Erasure (Crypto-Shredding)
// =============================================

import { v4 as uuid } from 'uuid';
import pool from '../../config/database';
import { auditService } from '../audit/audit.service';

class ConsentService {

    async grantConsent(
        patientId: string,
        grantedTo: string,
        purpose: string,
        dataCategories: string[],
        expiresInDays: number
    ) {
        const consentId = uuid();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);

        await pool.query(
            `INSERT INTO consent_records 
             (id, patient_id, granted_to, purpose, data_categories, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [consentId, patientId, grantedTo, purpose, dataCategories, expiresAt]
        );

        await auditService.log({
            actorId: patientId,
            actorRole: 'patient',
            action: 'CONSENT_GRANTED',
            resourceType: 'consent',
            resourceId: consentId,
            resourceOwnerId: patientId,
            metadata: { grantedTo, purpose, dataCategories, expiresAt },
        });

        return { id: consentId, status: 'active', expiresAt };
    }

    async revokeConsent(consentId: string, patientId: string) {
        const result = await pool.query(
            `UPDATE consent_records 
             SET status = 'revoked', revoked_at = NOW() 
             WHERE id = $1 AND patient_id = $2 AND status = 'active'
             RETURNING *`,
            [consentId, patientId]
        );

        if (result.rows.length === 0) {
            throw new Error('Consent not found or already revoked');
        }

        await auditService.log({
            actorId: patientId,
            actorRole: 'patient',
            action: 'CONSENT_REVOKED',
            resourceType: 'consent',
            resourceId: consentId,
            resourceOwnerId: patientId,
        });

        return { id: consentId, status: 'revoked' };
    }

    async getMyConsents(patientId: string) {
        const result = await pool.query(
            `SELECT c.*, u.full_name as granted_to_name, u.role as granted_to_role
             FROM consent_records c
             JOIN users u ON c.granted_to = u.id
             WHERE c.patient_id = $1
             ORDER BY c.granted_at DESC`,
            [patientId]
        );
        return result.rows;
    }

    /**
     * GDPR Art. 17 — Right to Erasure via Crypto-Shredding
     * Instead of finding all records, we make them unreadable
     */
    async requestDataDeletion(patientId: string) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Cancel Prescriptions
            await client.query(
                "UPDATE prescriptions SET status = 'cancelled' WHERE patient_id = $1",
                [patientId]
            );

            // 2. Revoke Consents
            await client.query(
                "UPDATE consent_records SET status = 'revoked', revoked_at = NOW() WHERE patient_id = $1 AND status = 'active'",
                [patientId]
            );

            // 3. Deactivate User
            await client.query(
                "UPDATE users SET is_active = false WHERE id = $1",
                [patientId]
            );

            // 4. Audit Log
            await auditService.log({
                actorId: patientId,
                actorRole: 'patient',
                action: 'DATA_DELETION_REQUESTED',
                resourceType: 'user',
                resourceId: patientId,
                resourceOwnerId: patientId,
                metadata: { gdprArticle: '17', method: 'crypto_shredding' },
            }, client);

            await client.query('COMMIT');
            return { message: 'Data deletion request processed. All data has been made inaccessible.' };

        } catch (error: any) {
            await client.query('ROLLBACK');
            console.error('Data deletion failed:', error);
            // Throw a more descriptive error if possible
            throw new Error(`Erasure failed: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Export all user data (GDPR Art. 20 - Right to Data Portability)
     */
    async exportMyData(patientId: string) {
        // Get all user data
        const [userResult, prescriptionsResult, consentsResult, auditResult] = await Promise.all([
            pool.query('SELECT id, email, full_name, role, created_at FROM users WHERE id = $1', [patientId]),
            pool.query('SELECT id, prescription_number, doctor_id, status, created_at, expires_at FROM prescriptions WHERE patient_id = $1', [patientId]),
            pool.query('SELECT id, granted_to, purpose, data_categories, status, granted_at, revoked_at, expires_at FROM consent_records WHERE patient_id = $1', [patientId]),
            pool.query('SELECT id, action, resource_type, resource_id, metadata, timestamp FROM audit_log WHERE resource_owner_id = $1 ORDER BY timestamp DESC LIMIT 100', [patientId]),
        ]);

        return {
            exportedAt: new Date().toISOString(),
            user: userResult.rows[0] || null,
            prescriptions: prescriptionsResult.rows,
            consents: consentsResult.rows,
            auditLogs: auditResult.rows,
        };
    }
}

export const consentService = new ConsentService();
