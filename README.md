
# 🔐 SplitRx — Tamper-Proof Prescription System

> **Tagline:** "Every pill verified. Every prescription signed. Every access logged."

## 🚀 Project Overview

**SplitRx** is a next-generation medical system designed to fix security holes in how prescriptions are handled today. It protects against identity theft, fake prescriptions, and data leaks.

### How It Works (Simple Explanation)
1.  **Doctors** write prescriptions that are digitally signed (like a secure digital wax seal).
2.  **Patients** receive them instantly on their phone/dashboard.
3.  **Pharmacists** scan a QR code to verify the "digital seal" hasn't been broken before giving out medicine.

Everything is **Encrypted** (scrambled so hackers can't read it) and logged in an **Audit Trail** (a permanent history book that no one can erase).

---

## ✨ Key Features
-   **For Doctors**: Easy-to-use digital prescription pad.
-   **For Patients**: Full control over your medical data. "Right to Erasure" button included.
-   **For Pharmacists**: One-click verification to stop fraud.
-   **For Admins**: 
    -   **Audit Integrity Check**: Verify that the history logs haven't been hacked.
    -   **Database Viewer**: View live system data directly from the dashboard.

---

## 🛠️ How to Run This Project (Local Setup)

This project has two parts: the **Backend** (Server) and the **Frontend** (User Interface). You will need to start both.

### Prerequisites
-   **Node.js** (Version 20 or higher) installed on your computer.

### Step 1: Install & Setup
1.  **Download the code**:
    ```bash
    git clone https://github.com/yourusername/splitrx.git
    cd splitrx
    ```

2.  **Setup the Backend**:
    ```bash
    cd backend
    npm install
    # Ensure your .env file is configured (ask admin for keys)
    ```

3.  **Setup the Frontend**:
    ```bash
    cd ../frontend
    npm install
    # Ensure your .env.local file is configured
    ```

### Step 2: Start the Application
You need to open **two terminal windows**.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```
*Wait until you see "SplitRx Server Running"*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev -- -p 3001
```

### Step 3: Open in Browser
-   **Frontend (App)**: Go to [http://localhost:3001](http://localhost:3001)
-   **Backend (API)**: Running at [http://localhost:3000](http://localhost:3000)

---

## 📚 Documentation
-   **[User Guide](USER_GUIDE.md)**: Detailed step-by-step instructions for Doctors, Patients, Pharmacists, and Admins.

---

## 🔧 Technical Details (For Developers)
-   **Encryption**: AES-256-GCM for data at rest.
-   **Signatures**: RSA-SHA256 for prescription authenticity.
-   **Database**: PostgreSQL (Managed).
-   **Frameworks**: Express.js (Backend) and Next.js (Frontend).

## 🚨 Administrative Tools (For Demo Only)

### Audit Integrity Fix Script
We have included a script to manually recalculate and fix the cryptographic hash chain of the audit log. **This is included for demonstration purposes only** to show how the system can self-repair broken chains in a controlled environment.

**WARNING:** In a real production environment, a broken audit chain indicates a serious security breach. Using this script would "legitimize" potentially tampered data by updating the hashes to match the current (tampered) state.

To run the script:
```bash
npx ts-node backend/scripts/fix_audit_integrity.ts
```

### Admin Password Reset (Demo/Recovery)
For demonstration and emergency recovery purposes (admin memory aid), we have included a script to hard-reset the admin password to a known default value.

**NOTE:** This script is intentionally hardcoded with credentials for the demo environment. 

To run the script:
```bash
npx ts-node backend/src/scripts/reset_admin_password_demo.ts
```
