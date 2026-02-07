
import { Router } from 'express';
import { authenticate, authorize, AuthenticatedRequest } from '../../middleware/auth';
import pool from '../../config/database';


import { HashingService } from '../../crypto/hashing';

const router = Router();

// Get list of users (admin only)
router.get(
    '/users',
    authenticate,
    authorize('admin'),
    async (req: AuthenticatedRequest, res) => {
        try {
            const result = await pool.query(
                `SELECT id, email, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC`
            );
            res.json({ users: result.rows });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    }
);

// Reset user password (admin only)
router.post(
    '/users/:userId/reset-password',
    authenticate,
    authorize('admin'),
    async (req: AuthenticatedRequest, res) => {
        const userId = req.params.userId;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        try {
            // Check if user exists
            const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
            if (userCheck.rowCount === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const passwordHash = await HashingService.hashPassword(newPassword);

            await pool.query(
                `UPDATE users SET password_hash = $1 WHERE id = $2`,
                [passwordHash, userId]
            );

            res.json({ message: 'Password reset successfully' });
        } catch (error) {
            console.error('Error resetting password:', error);
            res.status(500).json({ error: 'Failed to reset password' });
        }
    }
);

// Get list of tables (admin only)
router.get(
    '/tables',
    authenticate,
    authorize('admin'),
    async (req: AuthenticatedRequest, res) => {
        try {
            const result = await pool.query(`
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
            `);
            const tables = result.rows.map(r => r.table_name);
            res.json({ tables });
        } catch (error) {
            console.error('Error fetching tables:', error);
            res.status(500).json({ error: 'Failed to fetch tables' });
        }
    }
);

// Get data for a specific table (admin only)
router.get(
    '/tables/:tableName',
    authenticate,
    authorize('admin'),
    async (req: AuthenticatedRequest, res) => {
        const tableName = req.params.tableName as string;

        // Basic SQL injection prevention: only allow alphanumeric and underscores
        if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
            return res.status(400).json({ error: 'Invalid table name' });
        }

        try {
            // Verify table exists first
            const tableExists = await pool.query(
                `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
                [tableName]
            );

            if (tableExists.rowCount === 0) {
                return res.status(404).json({ error: 'Table not found' });
            }

            // Fetch columns for structure
            const columnsRes = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1 
                ORDER BY ordinal_position
            `, [tableName]);
            const columns = columnsRes.rows.map(c => c.column_name);

            // Fetch data (limit 100 for performance)
            // Note: Cannot use parameterized query for table name, but we validated it above
            const dataRes = await pool.query(`SELECT * FROM "${tableName}" LIMIT 100`);

            res.json({
                tableName,
                columns,
                rowCount: dataRes.rowCount,
                rows: dataRes.rows
            });

        } catch (error) {
            console.error(`Error fetching table ${tableName}:`, error);
            res.status(500).json({ error: 'Failed to fetch table data' });
        }
    }
);

export default router;
