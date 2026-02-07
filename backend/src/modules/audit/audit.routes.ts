import { Router } from 'express';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth';
import { adaptiveAuth } from '../../middleware/adaptiveAuth';
import { auditService } from './audit.service';
import { Response } from 'express';

const router = Router();

// Verify audit chain integrity (admin only)
router.get(
    '/verify',
    authenticate,
    authorize('admin'),
    async (req: AuthenticatedRequest, res: Response) => {
        const result = await auditService.verifyChainIntegrity();
        res.json(result);
    }
);

const getMyLogs = async (req: AuthenticatedRequest, res: Response) => {
    const logs = await auditService.getLogsForUser(req.user!.id);
    res.json({ logs });
};

// Get my audit logs (GDPR Art. 15)
router.get('/my-logs', authenticate, getMyLogs);

// Backward-compatible alias
router.get('/my', authenticate, getMyLogs);

// Get logs for a specific prescription
router.get(
    '/resource/:resourceId',
    authenticate,
    adaptiveAuth('medium'),
    async (req: AuthenticatedRequest, res: Response) => {
        const logs = await auditService.getLogsForResource(req.params.resourceId as string);
        res.json({ logs });
    }
);

export default router;
