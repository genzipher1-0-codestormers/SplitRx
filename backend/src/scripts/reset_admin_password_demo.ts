import pool from '../config/database';
import { HashingService } from '../crypto/hashing';

async function resetAdminPassword() {
    const email = 'admin@splitrx.com';
    const newPassword = 'SecureAdminPassword2026!'; // Strong temporary password

    console.log(`Password Reset Tool`);
    console.log(`===================`);
    console.log(`Target Email: ${email}`);

    try {
        // limit connection time
        const client = await pool.connect();

        try {
            // Check if user exists first
            const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);

            if (userCheck.rows.length === 0) {
                console.error(`❌ User with email ${email} does not exist in the database.`);
                // Optional: Create the user if needed, but for now just error out as requested
                process.exit(1);
            }

            console.log(`found user with ID: ${userCheck.rows[0].id}`);

            // Hash new password
            console.log('Hashing new password...');
            const passwordHash = await HashingService.hashPassword(newPassword);

            // Update user
            console.log('Updating database...');
            await client.query(
                `UPDATE users SET password_hash = $1, is_active = true WHERE email = $2`,
                [passwordHash, email]
            );

            console.log('\n✅ Password reset successfully!');
            console.log(`📧 Email:    ${email}`);
            console.log(`🔑 Password: ${newPassword}`);
            console.log('\n⚠️  Please change this password immediately after logging in.');

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Error resetting password:', error);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

resetAdminPassword();
