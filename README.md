
# 🔐 SplitRx — Tamper-Proof Prescription System

> **"Every pill verified. Every prescription signed. Every access logged."**

## 🚀 Overview

**SplitRx** is a next-generation medical prescription system designed to eliminate security vulnerabilities in how prescriptions are handled. It protects against identity theft, prescription fraud, and data leaks.

### How It Works
1. **Doctors** write prescriptions that are digitally signed (like a secure digital wax seal)
2. **Patients** receive them instantly on their dashboard
3. **Pharmacists** scan a QR code to verify authenticity before dispensing medicine

Everything is **encrypted** and logged in a **tamper-proof audit trail**.

---

## ✨ Key Features

| Role | Features |
|------|----------|
| **Doctors** | Digital prescription pad with cryptographic signatures |
| **Patients** | Full data control, privacy controls, Right to Erasure |
| **Pharmacists** | One-click QR verification to prevent fraud |
| **Admins** | Audit integrity checks, database viewer, user management |

---

## 🛠️ Quick Start

### Prerequisites
- **Node.js** v20+ 
- **PostgreSQL** database

### Installation

```bash
# Clone the repository
git clone https://github.com/genzipher1-0-codestormers/SplitRx.git
cd SplitRx

# Setup Backend
cd backend
npm install
cp .env.example .env  # Configure your database and secrets

# Setup Frontend
cd ../frontend
npm install
cp .env.example .env.local  # Configure API URL
```

### Running Locally

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Wait for "SplitRx Server Running"
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev -- -p 3001
```

### Access Points
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000

---

## 🐳 Docker Deployment

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

See [deploy.sh](deploy.sh) for automated server deployment.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [USER_GUIDE.md](USER_GUIDE.md) | Step-by-step instructions for all user roles |
| [SECURITY.md](SECURITY.md) | Complete security architecture (8 layers) |
| [TECH_STACK.md](TECH_STACK.md) | Technical stack and architecture overview |

---

## 🔧 Technical Details

| Component | Technology |
|-----------|------------|
| **Encryption** | AES-256-GCM (data at rest) |
| **Signatures** | RSA-SHA256 (prescription authenticity) |
| **Database** | PostgreSQL (managed) |
| **Backend** | Express.js + TypeScript |
| **Frontend** | Next.js 16 + TypeScript |

## 🚨 Administrative Tools (Demo Only)

### Audit Integrity Fix
To manually verify and fix the cryptographic hash chain of the audit log (for demonstration/recovery), run this command inside the Docker container:

```bash
docker exec -it splitrx_backend npx ts-node scripts/fix_audit_integrity.ts
```

> **Note:** In a real production environment, this capability would be restricted. It is included here for demonstration purposes to show how the system can self-repair broken chains in a controlled environment.

### Create Admin Account
To create a new administrator account (if none exists), run the following command in the backend container or directory:

```bash
# Set credentials and run seed script
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="secure_password123"
docker exec -it splitrx_backend npx ts-node src/scripts/admin.seed.ts
# OR locally:
# ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="secure_password123" npx ts-node src/scripts/admin.seed.ts
```

> **Note:** The script will skip creation if an administrator account already exists.

---

## 📁 Project Structure

```
SplitRx/
├── backend/         # Express.js API server
│   ├── src/         # Source code
│   └── scripts/     # Utility scripts
├── frontend/        # Next.js application
│   └── src/         # Source code
├── database/        # SQL schema and migrations
├── nginx/           # Reverse proxy configuration
└── docker-compose.yml
```

---

## 📄 License

This project is proprietary software developed for secure medical prescription management.

---

*Built with ❤️ for healthcare security*
