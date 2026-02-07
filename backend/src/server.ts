import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════╗
    ║          SplitRx Server Running           ║
    ║                                           ║
    ║   Port: ${PORT}                              ║
    ║   Env:  ${process.env.NODE_ENV || 'development'}                   ║
    ║                                           ║
    ║   🔒 Helmet: Active                       ║
    ║   🚦 Rate Limiter: Active                 ║
    ║   📝 Audit Logging: Active                ║
    ║   🔐 Encryption: AES-256-GCM              ║
    ║   ✍️  Signatures: RSA-SHA256               ║
    ╚═══════════════════════════════════════════╝
    `);
});
