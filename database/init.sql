-- =============================================
-- SplitRx Database Schema
-- Tamper-Proof Prescription System
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TYPE user_role AS ENUM ('doctor', 'patient', 'pharmacist', 'admin');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    public_key TEXT,                    -- RSA public key for verification
    private_key_encrypted TEXT,        -- Encrypted private key (encrypted with user's password-derived key)
    is_active BOOLEAN DEFAULT true,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    last_login_user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PRESCRIPTIONS TABLE
-- Scenario #1: Encrypted payload
-- =============================================
CREATE TYPE prescription_status AS ENUM (
    'active', 'dispensed', 'expired', 'revoked', 'cancelled'
);

CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_number VARCHAR(255) UNIQUE NOT NULL,  -- Human readable ID
    doctor_id UUID NOT NULL REFERENCES users(id),
    patient_id UUID NOT NULL REFERENCES users(id),
    
    -- ENCRYPTED PAYLOAD (Scenario #1)
    -- Server stores ONLY ciphertext. Contains:
    -- medication name, dosage, frequency, duration, notes
    encrypted_payload TEXT NOT NULL,
    encryption_iv VARCHAR(32) NOT NULL,
    encryption_tag VARCHAR(32) NOT NULL,
    
    -- DIGITAL SIGNATURE (tamper proof)
    doctor_signature TEXT NOT NULL,     -- RSA signature of the payload
    payload_hash VARCHAR(64) NOT NULL,  -- SHA-256 hash of original payload
    
    status prescription_status DEFAULT 'active',
    prescribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    dispensed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- DISPENSING RECORDS TABLE
-- =============================================
CREATE TABLE dispensing_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id),
    pharmacist_id UUID NOT NULL REFERENCES users(id),
    
    -- Verification proof
    signature_verified BOOLEAN NOT NULL,
    verification_hash VARCHAR(64) NOT NULL,  -- Hash of verification moment
    
    dispensed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- =============================================
-- CONSENT RECORDS TABLE (GDPR Art. 7)
-- =============================================
CREATE TYPE consent_status AS ENUM ('active', 'revoked', 'expired');

CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id),
    granted_to UUID NOT NULL REFERENCES users(id),
    purpose VARCHAR(255) NOT NULL,
    data_categories TEXT[] NOT NULL,     -- e.g., {'prescriptions', 'allergies'}
    status consent_status DEFAULT 'active',
    legal_basis VARCHAR(50) DEFAULT 'explicit_consent',
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP
);

-- =============================================
-- IMMUTABLE AUDIT LOG (Scenario #3)
-- Hash-chained, append-only
-- =============================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID,
    actor_role user_role,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    resource_owner_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- HASH CHAIN (Scenario #3)
    previous_hash VARCHAR(64) NOT NULL,
    entry_hash VARCHAR(64) NOT NULL,
    
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SESSION TRACKING (Scenario #5 - Adaptive Auth)
-- =============================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    refresh_token_hash VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_fingerprint VARCHAR(64),
    risk_score INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_consent_patient ON consent_records(patient_id);

-- =============================================
-- SECURITY: Restrict audit_log modifications
-- Create a read-only + insert-only role for audit
-- =============================================
-- The application connects with a role that CANNOT
-- UPDATE or DELETE from audit_log

-- Trigger to prevent updates/deletes on audit_log
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log entries cannot be modified or deleted';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_audit_update
    BEFORE UPDATE ON audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER no_audit_delete
    BEFORE DELETE ON audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modification();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_prescriptions_timestamp
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
