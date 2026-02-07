import { v4 as uuid } from 'uuid';
import pool from '../../config/database';
import { encryptionService } from '../../crypto/encryption';
import { SigningService } from '../../crypto/signing';
import { auditService } from '../audit/audit.service';
import QRCode from 'qrcode';

interface CreatePrescriptionInput {
    doctorId: string;
    patientId: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
    expiresInDays: number;
}

class PrescriptionService {

    /**
     * Create a new prescription
     * 1. Build the payload
     * 2. Encrypt it (Scenario #1 — server stores ciphertext only)
     * 3. Sign it (doctor's digital signature)
     * 4. Store everything
     * 5. Log to immutable audit (Scenario #3)
     */
    async create(input: CreatePrescriptionInput, ipAddress: string, userAgent: string) {
        // Build prescription payload
        const payload = {
            medication_name: input.medicationName,
            dosage: input.dosage,
            frequency: input.frequency,
            duration: input.duration,
            notes: input.notes || '',
            prescribed_at: new Date().toISOString(),
            doctor_id: input.doctorId,
            patient_id: input.patientId,
        };

        const payloadString = JSON.stringify(payload);

        // STEP 1: Hash the payload (for integrity verification)
        const payloadHash = SigningService.hash(payloadString);

        // STEP 2: Get doctor's private key to sign
        const doctorResult = await pool.query(
            'SELECT private_key_encrypted, public_key FROM users WHERE id = $1 AND role = $2',
            [input.doctorId, 'doctor']
        );

        if (doctorResult.rows.length === 0) {
            throw new Error('Doctor not found');
        }

        // Verify patient exists
        const patientResult = await pool.query(
            'SELECT id FROM users WHERE id = $1 AND role = $2',
            [input.patientId, 'patient']
        );

        if (patientResult.rows.length === 0) {
            throw new Error('Patient not found');
        }

        // Decrypt doctor's private key
        const encryptedKey = JSON.parse(doctorResult.rows[0].private_key_encrypted);
        const doctorPrivateKey = encryptionService.decrypt(
            encryptedKey.ciphertext,
            encryptedKey.iv,
            encryptedKey.tag
        );

        // STEP 3: Sign the payload hash
        const doctorSignature = SigningService.sign(payloadHash, doctorPrivateKey);

        // STEP 4: Encrypt the payload (server stores ONLY ciphertext)
        const encrypted = encryptionService.encrypt(payloadString);

        // Generate prescription number
        const prescriptionNumber = `RX-${Date.now().toString(36).toUpperCase()}-${uuid().slice(0, 4).toUpperCase()}`;

        // STEP 5: Store in database
        const prescriptionId = uuid();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

        await pool.query(
            `INSERT INTO prescriptions 
             (id, prescription_number, doctor_id, patient_id, 
              encrypted_payload, encryption_iv, encryption_tag,
              doctor_signature, payload_hash, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                prescriptionId,
                prescriptionNumber,
                input.doctorId,
                input.patientId,
                encrypted.ciphertext,
                encrypted.iv,
                encrypted.tag,
                doctorSignature,
                payloadHash,
                expiresAt,
            ]
        );

        // STEP 6: Immutable audit log
        await auditService.log({
            actorId: input.doctorId,
            actorRole: 'doctor',
            action: 'PRESCRIPTION_CREATED',
            resourceType: 'prescription',
            resourceId: prescriptionId,
            resourceOwnerId: input.patientId,
            metadata: {
                prescriptionNumber,
                payloadHash,
                // NEVER log the actual medication data
            },
            ipAddress,
            userAgent,
        });

        return {
            id: prescriptionId,
            prescriptionNumber,
            status: 'active',
            expiresAt,
            payloadHash,
        };
    }

    /**
     * Get prescriptions for a patient (decrypted)
     */
    async getPatientPrescriptions(patientId: string, requesterId: string, requesterRole: string) {
        // Check if requester is the patient themselves or their doctor
        let query: string;
        let params: string[];

        if (requesterRole === 'patient') {
            query = 'SELECT p.*, u.full_name as doctor_name FROM prescriptions p JOIN users u ON p.doctor_id = u.id WHERE p.patient_id = $1 ORDER BY p.created_at DESC';
            params = [patientId];
        } else if (requesterRole === 'doctor') {
            query = 'SELECT p.*, u.full_name as doctor_name FROM prescriptions p JOIN users u ON p.doctor_id = u.id WHERE p.patient_id = $1 AND p.doctor_id = $2 ORDER BY p.created_at DESC';
            params = [patientId, requesterId];
        } else {
            throw new Error('Unauthorized');
        }

        const result = await pool.query(query, params);

        // Decrypt each prescription
        const prescriptions = result.rows.map(row => {
            const decryptedPayload = encryptionService.decrypt(
                row.encrypted_payload,
                row.encryption_iv,
                row.encryption_tag
            );

            return {
                id: row.id,
                prescriptionNumber: row.prescription_number,
                doctorName: row.doctor_name,
                payload: JSON.parse(decryptedPayload),
                status: row.status,
                prescribedAt: row.prescribed_at,
                expiresAt: row.expires_at,
                dispensedAt: row.dispensed_at,
                payloadHash: row.payload_hash,
                isSigned: !!row.doctor_signature,
            };
        });

        // Audit the access
        await auditService.log({
            actorId: requesterId,
            actorRole: requesterRole as any,
            action: 'PRESCRIPTIONS_VIEWED',
            resourceType: 'prescription',
            resourceOwnerId: patientId,
            metadata: { count: prescriptions.length },
        });

        return prescriptions;
    }

    /**
     * Generate QR code for a prescription
     * Contains prescription ID + verification hash
     */
    async generateQR(prescriptionId: string, patientId: string): Promise<string> {
        const result = await pool.query(
            'SELECT * FROM prescriptions WHERE id = $1 AND patient_id = $2',
            [prescriptionId, patientId]
        );

        if (result.rows.length === 0) {
            throw new Error('Prescription not found');
        }

        const prescription = result.rows[0];

        if (prescription.status !== 'active') {
            throw new Error(`Prescription is ${prescription.status}`);
        }

        // QR contains: prescription ID + hash for verification
        const qrData = JSON.stringify({
            prescriptionId: prescription.id,
            prescriptionNumber: prescription.prescription_number,
            payloadHash: prescription.payload_hash,
            doctorId: prescription.doctor_id,
            patientId: prescription.patient_id,
            timestamp: Date.now(),
        });

        const qrCode = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'H',
            width: 300,
        });

        await auditService.log({
            actorId: patientId,
            actorRole: 'patient',
            action: 'QR_GENERATED',
            resourceType: 'prescription',
            resourceId: prescriptionId,
            resourceOwnerId: patientId,
        });

        return qrCode;
    }

    /**
     * Get a single prescription by ID (for pharmacist verification)
     */
    async getById(prescriptionId: string) {
        const result = await pool.query(
            `SELECT p.*, 
                    d.full_name as doctor_name, d.public_key as doctor_public_key,
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

        return result.rows[0];
    }
}

export const prescriptionService = new PrescriptionService();
