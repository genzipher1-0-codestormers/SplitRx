
# 📖 SplitRx User Manual

Welcome to **SplitRx**, sending and receiving secure, tamper-proof prescriptions.
This guide explains how to use the system for **Doctors**, **Patients**, and **Pharmacists**.

---

## 👨‍⚕️ For Doctors
**Goal**: Create secure, digitally signed prescriptions.

1.  **Log In**: Use your credentials to access the Doctor Dashboard.
2.  **Write a Prescription**:
    - Click **"✍️ Write Prescription"**.
    - **Patient ID**: Ask the patient for their **UUID** (found on their dashboard).
    - **Diagnosis & Meds**: Enter the diagnosis and add medication details (Name, Dosage, Frequency).
    - **Sign & Send**: Click **"Sign & Create Prescription"**.
    - *Security*: The system automatically encrypts the data and attaches your unique digital signature.

---

## 🤧 For Patients
**Goal**: Receive prescriptions, control access, and view your history.

1.  **Your Dashboard**:
    - **Patient ID**: At the top, you will see your **UUID**. Share this *only* with your doctor so they can prescribe to you.
2.  **View Prescriptions**:
    - Go to the **"💊 Prescriptions"** tab to see your active medications.
3.  **Pick Up Medication**:
    - Click **"📱 Generate QR"** next to a prescription.
    - Show this QR code to the pharmacist.
    - *Note*: This QR code contains a secure cryptographic proof, verifying the prescription is yours.
4.  **Audit Trail**:
    - Go to the **"📋 Audit"** tab to see exactly who accessed your data and when. This log cannot be changed by anyone.
5.  **Privacy Controls**:
    - In the **"🔒 Privacy"** tab, you can use **"Erase All My Data"** to permanently delete your medical records from the system (Crypto-Shredding).

---

## 💊 For Pharmacists
**Goal**: Verify authenticity and dispense medication.

1.  **Verification**:
    - Log in to the Pharmacist Dashboard.
    - **Scan QR**: Use a scanner (or paste the text) of the Patient's QR code.
2.  **Automatic Checks**:
    - The system checks the **Doctor's Signature** (Is it real?).
    - The system checks **Data Integrity** (Has it been changed?).
3.  **Dispense**:
    - If valid, you will see a green **"✅ VERIFIED"** badge.
    - You can now safely dispense the medication.
    - If invalid, you will see a red **"❌ WARNING"** alert. **Do not dispense.**

---

## 🆘 Troubleshooting
- **"Invalid Signature"**: The prescription may have been tampered with or the doctor's key is invalid.
- **"Prescription Expired"**: The validity period set by the doctor has passed.
- **"Access Denied"**: Ensure you are logged in with the correct role for the action you are trying to perform.
