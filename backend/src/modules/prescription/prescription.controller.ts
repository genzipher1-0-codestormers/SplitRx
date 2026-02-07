import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { prescriptionService } from './prescription.service';

export class PrescriptionController {

    static async create(req: AuthenticatedRequest, res: Response) {
        try {
            const medications = req.body.medications || [
                {
                    name: req.body.medication_name,
                    dosage: req.body.dosage,
                    frequency: req.body.frequency,
                    duration: req.body.duration,
                },
            ];

            const result = await prescriptionService.create(
                {
                    doctorId: req.user!.id,
                    patientId: req.body.patient_id,
                    diagnosis: req.body.diagnosis || '',
                    medications,
                    notes: req.body.notes,
                    expiresInDays: req.body.expires_in_days,
                },
                req.ip || '',
                req.headers['user-agent'] || ''
            );

            res.status(201).json({
                message: 'Prescription created and signed',
                prescription: result,
            });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getMyPrescriptions(req: AuthenticatedRequest, res: Response) {
        try {
            const prescriptions = await prescriptionService.getPatientPrescriptions(
                req.user!.id,
                req.user!.id,
                req.user!.role
            );
            res.json({ prescriptions });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getPatientPrescriptions(req: AuthenticatedRequest, res: Response) {
        try {
            const prescriptions = await prescriptionService.getPatientPrescriptions(
                req.params.patientId as string,
                req.user!.id,
                req.user!.role
            );
            res.json({ prescriptions });
        } catch (error: any) {
            res.status(403).json({ error: error.message });
        }
    }

    static async generateQR(req: AuthenticatedRequest, res: Response) {
        try {
            const qrCode = await prescriptionService.generateQR(
                req.params.prescriptionId as string,
                req.user!.id
            );
            res.json({ qrCode });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getPatients(req: AuthenticatedRequest, res: Response) {
        try {
            const { Pool } = require('pg');
            const pool = require('../../config/database').default;
            const result = await pool.query(
                "SELECT id, full_name, email FROM users WHERE role = 'patient' AND is_active = true"
            );
            res.json({ patients: result.rows });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
