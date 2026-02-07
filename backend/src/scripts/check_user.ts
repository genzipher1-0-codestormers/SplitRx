
import pool from '../config/database';

async function checkUser(email?: string) {
    try {
        console.log('Connecting to database...');
        if (email) {
            console.log(`Checking specifically for user: ${email}`);
            const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (res.rows.length === 0) {
                console.log('User not found');
            } else {
                const user = res.rows[0];
                console.log('Password Hash:', user.password_hash);
                console.log('User found:', {
                    ...user,
                    password_hash: user.password_hash ? `${user.password_hash.substring(0, 7)}... (len=${user.password_hash.length})` : 'NULL'
                });
            }
        } else {
            console.log('Listing all users:');
            const res = await pool.query('SELECT email, role, is_active FROM users');
            console.log(res.rows);
        }
    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await pool.end();
    }
}

const email = process.argv[2];
checkUser(email);
