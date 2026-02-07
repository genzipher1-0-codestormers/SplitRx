import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { consentService } from './consent.service';

export class ConsentController {

    static async grant(req: AuthenticatedRequest, res: Response) {
        try {
            const result = await consentService.grantConsent(
                req.user!.id,
                req.body.granted_to,
                req.body.purpose,
                req.body.data_categories,
                req.body.expires_in_days
            );
            res.status(201).json({ consent: result });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async revoke(req: AuthenticatedRequest, res: Response) {
        try {
            const result = await consentService.revokeConsent(
                req.params.consentId as string,
                req.user!.id
            );
            res.json({ consent: result });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getMyConsents(req: AuthenticatedRequest, res: Response) {
        try {
            const consents = await consentService.getMyConsents(req.user!.id);
            res.json({ consents });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async requestDeletion(req: AuthenticatedRequest, res: Response) {
        try {
            const result = await consentService.requestDataDeletion(req.user!.id);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async exportMyData(req: AuthenticatedRequest, res: Response) {
        try {
            const data = await consentService.exportMyData(req.user!.id);
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
