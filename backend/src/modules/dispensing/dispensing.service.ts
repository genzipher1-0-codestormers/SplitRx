import { v4 as uuid } from 'uuid';
import pool from '../../config/database';
import { encryptionService } from '../../crypto/encryption';
import { SigningService } from '../../crypto/signing';
import { auditService } from '../audit/audit.service';

class DispensingService {

    /**
     * Verify and dispense a prescription
     * 1. Look up prescription
     * 2. Verify doctor's digital signature (TAMPER PROOF!)
     * 3. Check status and expiry
     * 4. Mark as dispensed
     * 5. Audit everything
     */
    async verifyAndDispense(
        prescriptionId: string,
        pharmacistId: string,
        ipAddress: string,
        userAgent: string
    ) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Get prescription with doctor's public key
            const result = await client.query(
                `SELECT p.*, d.public_key as doctor_public_key, 
                        d.full_name as doctor_name,
                        pt.full_name as patient_name
                 FROM prescriptions p
                 JOIN users d ON p.doctor_id = d.id
                 JOIN users pt ON p.patient_id = pt.id
                 WHERE p.id = $1
                 FOR UPDATE`,  // Lock row to prevent double dispensing
                [prescriptionId]
            );

            if (result.rows.length === 0) {
                throw new Error('Prescription not found');
            }

            const prescription = result.rows[0];

            // CHECK 1: Status
            if (prescription.status !== 'active') {
                await auditService.log({
                    actorId: pharmacistId,
                    actorRole: 'pharmacist',
                    action: 'DISPENSE_REJECTED_STATUS',
                    resourceType: 'prescription',
                    resourceId: prescriptionId,
                    resourceOwnerId: prescription.patient_id,
                    metadata: { reason: `Status is ${prescription.status}` },
                    ipAddress,
                    userAgent,
                });
                throw new Error(`Prescription is ${prescription.status}. Cannot dispense.`);
            }

            // CHECK 2: Expiry
            if (new Date(prescription.expires_at) < new Date()) {
                await client.query(
                    "UPDATE prescriptions SET status = 'expired' WHERE id = $1",
                    [prescriptionId]
                );
                throw new Error('Prescription has expired');
            }

            // CHECK 3: VERIFY DIGITAL SIGNATURE
            // This is the tamper-proof check!
            // If ANYONE modified the prescription, the signature won't match
            const signatureValid = SigningService.verify(
                prescription.payload_hash,
                prescription.doctor_signature,
                prescription.doctor_public_key
            );

            if (!signatureValid) {
                await auditService.log({
                    actorId: pharmacistId,
                    actorRole: 'pharmacist',
                    action: 'SIGNATURE_VERIFICATION_FAILED',
                    resourceType: 'prescription',
                    resourceId: prescriptionId,
                    resourceOwnerId: prescription.patient_id,
                    metadata: { alert: 'POSSIBLE TAMPERING DETECTED' },
                    ipAddress,
                    userAgent,
                });
                throw new Error('⚠️ SIGNATURE VERIFICATION FAILED — Prescription may have been tampered with!');
            }

            // CHECK 4: Verify payload hash
            const decryptedPayload = encryptionService.decrypt(
                prescription.encrypted_payload,
                prescription.encryption_iv,
                prescription.encryption_tag
            );
            const currentHash = SigningService.hash(decryptedPayload);

            if (currentHash !== prescription.payload_hash) {
                throw new Error('⚠️ PAYLOAD INTEGRITY CHECK FAILED — Data has been modified!');
            }

            // ALL CHECKS PASSED — Dispense!
            const verificationHash = SigningService.hash(
                `${prescriptionId}-${pharmacistId}-${Date.now()}`
            );

            // Update prescription status
            await client.query(
                "UPDATE prescriptions SET status = 'dispensed', dispensed_at = NOW() WHERE id = $1",
                [prescriptionId]
            );

            // Create dispensing record
            const dispensingId = uuid();
            await client.query(
                `INSERT INTO dispensing_records (id, prescription_id, pharmacist_id, 
                 signature_verified, verification_hash)
                 VALUES ($1, $2, $3, $4, $5)`,
                [dispensingId, prescriptionId, pharmacistId, true, verificationHash]
            );

            await client.query('COMMIT');

            // Audit the dispensing
            await auditService.log({
                actorId: pharmacistId,
                actorRole: 'pharmacist',
                action: 'PRESCRIPTION_DISPENSED',
                resourceType: 'prescription',
                resourceId: prescriptionId,
                resourceOwnerId: prescription.patient_id,
                metadata: {
                    signatureVerified: true,
                    integrityVerified: true,
                    verificationHash,
                    dispensingId,
                },
                ipAddress,
                userAgent,
            });

            return {
                dispensingId,
                prescriptionNumber: prescription.prescription_number,
                status: 'dispensed',
                doctorName: prescription.doctor_name,
                patientName: prescription.patient_name,
                signatureVerified: true,
                integrityVerified: true,
                payload: JSON.parse(decryptedPayload),
                dispensedAt: new Date().toISOString(),
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Just verify a prescription (without dispensing)
     */
    async verify(prescriptionId: string, pharmacistId: string) {
        const result = await pool.query(
            `SELECT p.*, d.public_key as doctor_public_key, 
                    d.full_name as doctor_name,
                    pt.full_name as patient_name
             FROM prescriptions p
             JOIN users d ON p.doctor_id = d.id
             JOIN users pt ON p.patient_id = pt.id
             WHERE p.id = $1`,
            [prescriptionId]
        );

        if (result.rows.length === 0) {
            throw new Error('Prescription not found');
        }

        const prescription = result.rows[0];

        // Verify signature
        const signatureValid = SigningService.verify(
            prescription.payload_hash,
            prescription.doctor_signature,
            prescription.doctor_public_key
        );

        // Decrypt and verify integrity
        const decryptedPayload = encryptionService.decrypt(
            prescription.encrypted_payload,
            prescription.encryption_iv,
            prescription.encryption_tag
        );
        const currentHash = SigningService.hash(decryptedPayload);
        const integrityValid = currentHash === prescription.payload_hash;

        await auditService.log({
            actorId: pharmacistId,
            actorRole: 'pharmacist',
            action: 'PRESCRIPTION_VERIFIED',
            resourceType: 'prescription',
            resourceId: prescriptionId,
            resourceOwnerId: prescription.patient_id,
            metadata: { signatureValid, integrityValid },
        });

        return {
            prescriptionId: prescription.id,
            prescriptionNumber: prescription.prescription_number,
            doctorName: prescription.doctor_name,
            patientName: prescription.patient_name,
            status: prescription.status,
            expiresAt: prescription.expires_at,
            signatureVerified: signatureValid,
            integrityVerified: integrityValid,
            payload: JSON.parse(decryptedPayload),
            canDispense: prescription.status === 'active' &&
                signatureValid && integrityValid &&
                new Date(prescription.expires_at) > new Date(),
        };
    }

    /**
     * Get dispensing history for pharmacist
     */
    async getDispensingHistory(pharmacistId: string) {
        const result = await pool.query(
            `SELECT dr.*, p.prescription_number, 
                    pt.full_name as patient_name,
                    d.full_name as doctor_name
             FROM dispensing_records dr
             JOIN prescriptions p ON dr.prescription_id = p.id
             JOIN users pt ON p.patient_id = pt.id
             JOIN users d ON p.doctor_id = d.id
             WHERE dr.pharmacist_id = $1
             ORDER BY dr.dispensed_at DESC
             LIMIT 50`,
            [pharmacistId]
        );
        return result.rows;
    }
}

export const dispensingService = new DispensingService();
