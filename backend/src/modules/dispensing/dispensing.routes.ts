import { Router } from 'express';
import { DispensingController } from './dispensing.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { adaptiveAuth } from '../../middleware/adaptiveAuth';

const router = Router();

// Pharmacist verifies a prescription (read-only check)
router.get(
    '/verify/:prescriptionId',
    authenticate,
    authorize('pharmacist'),
    DispensingController.verify
);

// Pharmacist dispenses (verify + mark dispensed)
router.post(
    '/dispense/:prescriptionId',
    authenticate,
    authorize('pharmacist'),
    adaptiveAuth('high'),
    DispensingController.dispense
);

// Pharmacist view dispensing history
router.get(
    '/history',
    authenticate,
    authorize('pharmacist'),
    DispensingController.history
);

export default router;
