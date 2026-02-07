import { Router } from 'express';
import { PrescriptionController } from './prescription.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { adaptiveAuth } from '../../middleware/adaptiveAuth';
import { prescriptionLimiter } from '../../middleware/rateLimiter';
import { validate, prescriptionSchema } from '../../middleware/inputValidator';

const router = Router();

// Doctor creates prescription
router.post(
    '/',
    authenticate,
    authorize('doctor'),
    adaptiveAuth('high'),          // High sensitivity — re-evaluate risk
    prescriptionLimiter,
    validate(prescriptionSchema),
    PrescriptionController.create
);

// Patient views their prescriptions
router.get(
    '/my',
    authenticate,
    authorize('patient'),
    PrescriptionController.getMyPrescriptions
);

// Doctor views their patient's prescriptions
router.get(
    '/patient/:patientId',
    authenticate,
    authorize('doctor'),
    adaptiveAuth('medium'),
    PrescriptionController.getPatientPrescriptions
);

// Patient generates QR code for pharmacist
router.get(
    '/:prescriptionId/qr',
    authenticate,
    authorize('patient'),
    PrescriptionController.generateQR
);

// Doctor gets list of patients
router.get(
    '/patients',
    authenticate,
    authorize('doctor'),
    PrescriptionController.getPatients
);

export default router;
