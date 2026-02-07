
import pool from '../config/database';
import { HashingService } from '../crypto/hashing';

async function resetPassword(email: string, newPassword: string) {
    try {
        console.log(`Resetting password for user: ${email}`);

        // Hash the new password
        const passwordHash = await HashingService.hashPassword(newPassword);

        // Update user record: reset password, clear lock, clear failed attempts
        const res = await pool.query(
            `UPDATE users 
             SET password_hash = $1, 
                 failed_login_attempts = 0, 
                 locked_until = NULL, 
                 updated_at = NOW()
             WHERE email = $2
             RETURNING id, email`,
            [passwordHash, email]
        );

        if (res.rows.length === 0) {
            console.error('User not found');
            process.exit(1);
        } else {
            console.log('Password reset successfully for:', res.rows[0]);
        }
    } catch (err) {
        console.error('Error resetting password:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
    console.error('Usage: npx ts-node src/scripts/reset_password.ts <email> <new_password>');
    process.exit(1);
}

resetPassword(email, password);
