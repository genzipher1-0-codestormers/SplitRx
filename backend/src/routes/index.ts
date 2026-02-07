import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import prescriptionRoutes from '../modules/prescription/prescription.routes';
import dispensingRoutes from '../modules/dispensing/dispensing.routes';
import auditRoutes from '../modules/audit/audit.routes';
import consentRoutes from '../modules/consent/consent.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/dispensing', dispensingRoutes);
router.use('/audit', auditRoutes);
router.use('/consent', consentRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

export default router;
