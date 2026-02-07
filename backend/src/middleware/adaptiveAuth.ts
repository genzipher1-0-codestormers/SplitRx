// =============================================
// SCENARIO #5: Adaptive / Continuous Authentication
// Re-evaluate risk during the session
// =============================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { SECURITY_CONFIG } from '../config/security';
import pool from '../config/database';
import { auditService } from '../modules/audit/audit.service';

interface RiskFactors {
    ipChanged: boolean;
    userAgentChanged: boolean;
    unusualHour: boolean;
    highActionFrequency: boolean;
    sensitiveResource: boolean;
}

export const adaptiveAuth = (sensitivityLevel: 'low' | 'medium' | 'high' = 'medium') => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            // Get the user's session
            const sessionResult = await pool.query(
                'SELECT * FROM sessions WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
                [req.user.id]
            );

            if (sessionResult.rows.length === 0) {
                return res.status(401).json({
                    error: 'No active session',
                    code: 'SESSION_NOT_FOUND'
                });
            }

            const session = sessionResult.rows[0];
            const currentIp = req.ip || req.socket.remoteAddress || '';
            const currentUserAgent = req.headers['user-agent'] || '';
            const currentHour = new Date().getHours();

            // Count recent actions (last 5 minutes)
            const recentActions = await pool.query(
                `SELECT COUNT(*) FROM audit_log 
                 WHERE actor_id = $1 AND timestamp > NOW() - INTERVAL '5 minutes'`,
                [req.user.id]
            );

            // Calculate risk factors
            const riskFactors: RiskFactors = {
                ipChanged: session.ip_address !== currentIp,
                userAgentChanged: session.user_agent !== currentUserAgent,
                unusualHour: currentHour < 6 || currentHour > 22,
                highActionFrequency: parseInt(recentActions.rows[0].count) > 50,
                sensitiveResource: sensitivityLevel === 'high',
            };

            // Calculate risk score (0-100)
            let riskScore = 0;
            if (riskFactors.ipChanged) riskScore += 30;
            if (riskFactors.userAgentChanged) riskScore += 25;
            if (riskFactors.unusualHour) riskScore += 10;
            if (riskFactors.highActionFrequency) riskScore += 20;
            if (riskFactors.sensitiveResource) riskScore += 15;

            // Update session risk score
            await pool.query(
                'UPDATE sessions SET risk_score = $1, last_activity = NOW() WHERE id = $2',
                [riskScore, session.id]
            );

            // Act on risk
            if (riskScore >= SECURITY_CONFIG.riskThresholds.critical) {
                // BLOCK — Session too risky
                await pool.query(
                    'UPDATE sessions SET is_active = false WHERE id = $1',
                    [session.id]
                );

                await auditService.log({
                    actorId: req.user.id,
                    actorRole: req.user.role as any,
                    action: 'SESSION_BLOCKED',
                    resourceType: 'session',
                    resourceId: session.id,
                    metadata: { riskScore, riskFactors },
                    ipAddress: currentIp,
                    userAgent: currentUserAgent,
                });

                return res.status(403).json({
                    error: 'Session blocked due to suspicious activity',
                    code: 'HIGH_RISK_SESSION',
                    action: 'RE_AUTHENTICATE'
                });
            }

            if (riskScore >= SECURITY_CONFIG.riskThresholds.warning) {
                // WARNING — Log but allow (in production: require step-up auth)
                await auditService.log({
                    actorId: req.user.id,
                    actorRole: req.user.role as any,
                    action: 'RISK_WARNING',
                    resourceType: 'session',
                    resourceId: session.id,
                    metadata: { riskScore, riskFactors },
                    ipAddress: currentIp,
                    userAgent: currentUserAgent,
                });

                // Add warning header
                res.setHeader('X-Risk-Score', riskScore.toString());
                res.setHeader('X-Step-Up-Auth-Required', 'true');
            }

            next();
        } catch (error) {
            console.error('Adaptive auth error:', error);
            next(); // Don't block on error, but log it
        }
    };
};
