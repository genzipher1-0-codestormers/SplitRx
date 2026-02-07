import { Router } from 'express';
import { ConsentController } from './consent.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate, consentSchema } from '../../middleware/inputValidator';

const router = Router();

router.post('/', authenticate, authorize('patient'), validate(consentSchema), ConsentController.grant);
router.delete('/:consentId', authenticate, authorize('patient'), ConsentController.revoke);
router.get('/my', authenticate, authorize('patient'), ConsentController.getMyConsents);
router.post('/delete-my-data', authenticate, authorize('patient'), ConsentController.requestDeletion);
router.get('/export-my-data', authenticate, authorize('patient'), ConsentController.exportMyData);

export default router;
