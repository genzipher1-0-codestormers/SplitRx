
# 🔐 SplitRx — Tamper-Proof Prescription System

> **Tagline:** "Every pill verified. Every prescription signed. Every access logged."

## 🚀 Project Overview

SplitRx is a secure, tamper-proof prescription management system designed to prevent medical identity theft, supply chain sabotage, and unauthorized data access. It serves three key roles:
1.  **Doctors**: Issue digitally signed, encrypted prescriptions.
2.  **Patients**: Manage their prescriptions, grant/revoke consent, and view their audit trail.
3.  **Pharmacists**: Verify prescription integrity and dispense medication.

---

## 🛡️ Problem & Solution Mapping

We address critical security flaws found in legacy systems (like the NeoMed breach) through a "Secure by Design" approach.

| Problem Scenario | Vulnerability | SplitRx Solution |
| :--- | :--- | :--- |
| **#1 Data Breach** | Plaintext data storage allowed attackers to read all records once the perimeter was breached. | **AES-256-GCM Encryption**: Prescriptions are encrypted *before* storage. The database only holds ciphertext. Even if the DB is dumped, the data is unreadable. |
| **#2 Identity Theft** | Forged prescriptions using stolen doctor credentials. | **RSA-SHA256 Digital Signatures**: Every prescription is signed by the doctor's private key. Pharmacists verify this signature before dispensing. |
| **#3 Mutable Logs** | Attackers deleted logs to hide their tracks. | **Immutable Hash-Chained Audit Logs**: Every action is logged with a hash of the previous entry. Any deletion or modification breaks the chain, making tampering immediately detectable. |
| **#5 Static Auth** | One-time login allowed session hijacking (e.g., Trump/LinkedIn hack). | **Adaptive Authentication**: We calculate a "Risk Score" on every login (based on IP, time, behavior). High-risk actions trigger step-up verification. |
| **GDPR Compliance** | Users had no control over their data. | **Consent Management & Crypto-Shredding**: Patients explicitly grant/revoke access. "Right to Erasure" is implemented by destroying the encryption keys (crypto-shredding), making data permanently unrecoverable. |

---

## 🛠️ Getting Started

### Prerequisites
- **Docker** & **Docker Compose** (Recommended)
- **Node.js v20+** (If running locally without Docker)

### 1. Installation

Clone the repository and set up environment variables.

```bash
git clone https://github.com/yourusername/splitrx.git
cd splitrx
```

**Generate Secure Keys:**
Run this command twice to generate random 64-character hex strings for your `.env` file:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Create `.env` file (in `backend/`):**
```env
# Database
DB_HOST=db
DB_PORT=5432
DB_NAME=splitrx
DB_USER=splitrx_admin
DB_PASSWORD=Summ3r!2025_Secur3

# Secrets (Paste generated keys here)
JWT_SECRET=<your_generated_key_1>
ENCRYPTION_KEY=<your_generated_key_2>

# App Config
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
```

### 2. Run with Docker (Recommended)

This starts the Database, Backend (API), and Frontend (Next.js) in isolated containers.

```bash
docker-compose up --build
```

- **Frontend**: [http://localhost:3001](http://localhost:3001)
- **Backend API**: [http://localhost:3000](http://localhost:3000)
- **Database**: Port `5432`

---

## 🧪 Running Locally (Development)

If you prefer to run services individually:

1.  **Start Database**:
    ```bash
    docker-compose up -d db
    ```
2.  **Start Backend**:
    ```bash
    cd backend
    npm install
    npm run dev
    ```
3.  **Start Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    *Note: Ensure backend `.env` has `ALLOWED_ORIGINS` set to include your frontend URL.*

---

## 🔧 Maintenance & Operations

### Database Migrations
The database schema is initialized automatically via `database/init.sql` on the first Docker run. To reset the database:
```bash
docker-compose down -v
docker-compose up --build
```

### Key Rotation
1.  Generate new `ENCRYPTION_KEY` and `JWT_SECRET`.
2.  Update `backend/.env`.
3.  **Warning**: comprehensive key rotation strategy for *existing* encrypted data (re-encryption) is planned for v2.0. Changing the key now will render existing prescriptions unreadable.

### Troubleshooting "Connection Refused"
- If the backend cannot connect to the DB, ensure the `DB_HOST` in `.env` matches the service name in `docker-compose.yml` (default: `db`) or `localhost` if running locally.

---

## 📚 Application Flow (How to Demo)

1.  **Register Users**: Create account for a Doctor, Patient, and Pharmacist.
2.  **Doctor**: Log in and "Write Prescription" for the Patient (use their UUID).
3.  **Patient**: Log in to see the prescription. Click "Generate QR".
4.  **Pharmacist**: Log in, scan/paste the QR JSON. The system verifies the **Digital Signature** and **Content Hash**. If valid, the medication is dispensed.
5.  **Audit**: Check the "Audit Trail" tab in the Patient dashboard to see the immutable log of these actions.
