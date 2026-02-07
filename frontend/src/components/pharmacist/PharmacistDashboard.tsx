'use client';

import { useState } from 'react';
import { dispensingAPI } from '@/services/api';
import toast from 'react-hot-toast';
import {
    Pill, Search, CheckCircle, XCircle, ShieldCheck, ShieldAlert,
    AlertTriangle, Lock, Link, Calendar, User, FileText, Hash
} from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function PharmacistDashboard() {
    const [scanData, setScanData] = useState('');
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleManualEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const parsed = JSON.parse(scanData);

            if (!parsed.prescriptionId) {
                throw new Error('Invalid QR code format');
            }

            const response = await dispensingAPI.dispense(parsed.prescriptionId);
            const dispensing = response.data?.dispensing;

            if (!dispensing) {
                throw new Error('Unexpected response from server');
            }

            setVerificationResult({
                verified: true,
                dispensedAt: dispensing.dispensedAt,
                dispensingId: dispensing.dispensingId,
                signatureVerified: dispensing.signatureVerified,
                integrityVerified: dispensing.integrityVerified,
                prescriptionData: {
                    diagnosis: dispensing.payload?.diagnosis,
                    prescribedBy: dispensing.doctorName,
                    medications: dispensing.payload?.medications || []
                }
            });

            toast.success('Prescription verified and dispensed!');

        } catch (error: any) {
            setVerificationResult({
                verified: false,
                error: error.response?.data?.error || error.message
            });
            toast.error('Verification failed!');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="panel p-6 rounded-2xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                        <Pill className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Pharmacist Dashboard</h1>
                        <p className="muted">Verify prescriptions with cryptographic proof before dispensing.</p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Verification Form */}
                <div className="panel p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-[#102f55] border border-[#2b4f7a]">
                            <Search className="w-5 h-5 text-[#3a6ea5]" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Verify Prescription</h2>
                    </div>

                    <p className="muted text-sm mb-6">
                        Scan the patient's QR code or paste the JSON content manually.
                        This will verify the digital signature and integrity hash.
                    </p>

                    <form onSubmit={handleManualEntry} className="space-y-4">
                        <div>
                            <label className="block text-sm muted mb-2 font-medium">QR Code Data (JSON)</label>
                            <textarea
                                value={scanData}
                                onChange={(e) => setScanData(e.target.value)}
                                placeholder='{"prescriptionId": "...", "payloadHash": "...", "type": "SPLITRX_VERIFY"}'
                                rows={6}
                                required
                                className="input font-mono text-sm resize-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn btn-primary font-bold py-4 px-4 rounded-xl transition-all duration-300 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <LoadingSpinner size="sm" />
                                    Verifying...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Verify & Dispense
                                </span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Verification Result */}
                <div>
                    {!verificationResult && (
                        <div className="panel-strong p-8 rounded-2xl h-full flex items-center justify-center">
                            <div className="text-center">
                                <ShieldCheck className="w-16 h-16 text-[#708090] mx-auto mb-4 opacity-50" />
                                <p className="muted">Verification results will appear here</p>
                            </div>
                        </div>
                    )}

                    {verificationResult && (
                        <div className={`p-6 rounded-2xl border-2 animate-scale-in ${verificationResult.verified ? 'panel border-[#2e8b57]' : 'panel-strong border-[#dc143c]'}`}>
                            {verificationResult.verified ? (
                                <>
                                    {/* Success Header */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 rounded-xl bg-[#2e8b57]/20 border border-[#2e8b57]/50">
                                            <CheckCircle className="w-8 h-8 text-[#2e8b57]" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-[#2e8b57]">VERIFIED</h3>
                                            <p className="text-sm muted">Prescription is authentic</p>
                                        </div>
                                    </div>

                                    {/* Verification Details */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-white/90">
                                            <Lock className="w-5 h-5 text-[#2e8b57]" />
                                            <span><strong>Signature:</strong> {verificationResult.signatureVerified ? 'Valid' : 'Invalid'}</span>
                                            {verificationResult.signatureVerified && <CheckCircle className="w-4 h-4 text-[#2e8b57]" />}
                                        </div>
                                        <div className="flex items-center gap-3 text-white/90">
                                            <Link className="w-5 h-5 text-[#2e8b57]" />
                                            <span><strong>Integrity:</strong> {verificationResult.integrityVerified ? 'Valid' : 'Invalid'}</span>
                                            {verificationResult.integrityVerified && <CheckCircle className="w-4 h-4 text-[#2e8b57]" />}
                                        </div>
                                        <div className="flex items-center gap-3 text-white/90">
                                            <Calendar className="w-5 h-5 text-[#2e8b57]" />
                                            <span><strong>Dispensed:</strong> {new Date(verificationResult.dispensedAt).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Prescription Details */}
                                    <div className="panel-strong p-4 rounded-xl mb-4">
                                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-[#3a6ea5]" />
                                            Prescription Details
                                        </h4>
                                        <div className="space-y-2 text-white/90">
                                            <p><strong className="muted">Diagnosis:</strong> {verificationResult.prescriptionData.diagnosis}</p>
                                            <p className="flex items-center gap-1">
                                                <User className="w-4 h-4 text-[#3a6ea5]" />
                                                <strong className="muted">Prescribed by:</strong> {verificationResult.prescriptionData.prescribedBy}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Medications */}
                                    <div className="panel-strong p-4 rounded-xl">
                                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                                            <Pill className="w-4 h-4 text-[#3a6ea5]" />
                                            Medications to Dispense
                                        </h4>
                                        <div className="space-y-2">
                                            {verificationResult.prescriptionData.medications.map((med: any, i: number) => (
                                                <div key={i} className="p-3 bg-[#071a33]/50 rounded-lg border border-[#1c3c63]">
                                                    <p className="text-[#e0ffff] font-medium">{med.name}</p>
                                                    <p className="text-sm muted">{med.dosage} — {med.frequency} — {med.duration}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <p className="text-xs muted mt-4 font-mono flex items-center gap-1">
                                        <Hash className="w-3 h-3" />
                                        Dispensing ID: {verificationResult.dispensingId}
                                    </p>
                                </>
                            ) : (
                                <>
                                    {/* Failure Header */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 rounded-xl bg-[#dc143c]/20 border border-[#dc143c]/50">
                                            <XCircle className="w-8 h-8 text-[#dc143c]" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-[#dc143c]">VERIFICATION FAILED</h3>
                                            <p className="text-sm muted">Prescription cannot be verified</p>
                                        </div>
                                    </div>

                                    {/* Error Message */}
                                    <div className="p-4 bg-[#2a0f1b] rounded-xl mb-4 border border-[#5a1c2b]">
                                        <p className="text-white flex items-center gap-2">
                                            <ShieldAlert className="w-5 h-5 text-[#dc143c]" />
                                            {verificationResult.error}
                                        </p>
                                    </div>

                                    {/* Warning */}
                                    <div className="p-4 bg-[#2a1c0f] border border-[#b45309] rounded-xl">
                                        <p className="font-bold text-[#fbbf24] flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-5 h-5" />
                                            DO NOT DISPENSE
                                        </p>
                                        <p className="text-sm text-[#fbd38d]">
                                            This prescription may be tampered with, expired, or forged.
                                            This security incident has been logged in the audit trail.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
