import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { dispensingService } from './dispensing.service';

export class DispensingController {

    static async verify(req: AuthenticatedRequest, res: Response) {
        try {
            const result = await dispensingService.verify(
                req.params.prescriptionId as string,
                req.user!.id
            );
            res.json({ verification: result });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async dispense(req: AuthenticatedRequest, res: Response) {
        try {
            const result = await dispensingService.verifyAndDispense(
                req.params.prescriptionId as string,
                req.user!.id,
                req.ip || '',
                req.headers['user-agent'] || ''
            );
            res.json({
                message: 'Prescription dispensed successfully',
                dispensing: result,
            });
        } catch (error: any) {
            const status = error.message.includes('TAMPERING') ||
                error.message.includes('INTEGRITY') ? 403 : 400;
            res.status(status).json({ error: error.message });
        }
    }

    static async history(req: AuthenticatedRequest, res: Response) {
        try {
            const records = await dispensingService.getDispensingHistory(req.user!.id);
            res.json({ records });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
