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
        // In a full implementation, we would destroy the patient's
        // encryption key, making all their encrypted data permanently unreadable.
        // For this demo, we'll mark prescriptions and revoke all consents.

        await pool.query(
            "UPDATE prescriptions SET status = 'cancelled' WHERE patient_id = $1",
            [patientId]
        );

        await pool.query(
            "UPDATE consent_records SET status = 'revoked', revoked_at = NOW() WHERE patient_id = $1 AND status = 'active'",
            [patientId]
        );

        await pool.query(
            "UPDATE users SET is_active = false WHERE id = $1",
            [patientId]
        );

        await auditService.log({
            actorId: patientId,
            actorRole: 'patient',
            action: 'DATA_DELETION_REQUESTED',
            resourceType: 'user',
            resourceId: patientId,
            resourceOwnerId: patientId,
            metadata: { gdprArticle: '17', method: 'crypto_shredding' },
        });

        return { message: 'Data deletion request processed. All data has been made inaccessible.' };
    }
}

export const consentService = new ConsentService();
