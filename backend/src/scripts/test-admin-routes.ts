
import axios from 'axios';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_URL = 'http://127.0.0.1:3000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_64_CHAR_RANDOM_STRING';

// Generate a fake admin token for testing
const adminToken = jwt.sign(
    {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'admin@splitrx.com',
        role: 'admin'
    },
    JWT_SECRET,
    { expiresIn: '1h' }
);

console.log('Admin Token:', adminToken);
process.exit(0);
