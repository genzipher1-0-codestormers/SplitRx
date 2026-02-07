
'use client';

import { useState } from 'react';
import { dispensingAPI } from '@/services/api';
import toast from 'react-hot-toast';

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

            toast.success('✅ Prescription verified and dispensed!');

        } catch (error: any) {
            setVerificationResult({
                verified: false,
                error: error.response?.data?.error || error.message
            });
            toast.error('❌ Verification failed!');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="panel p-6 rounded-2xl">
                <h1 className="text-3xl font-bold text-white">💊 Pharmacist Dashboard</h1>
                <p className="muted">Verify prescriptions with cryptographic proof before dispensing.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Verification Form */}
                <div className="panel p-6 rounded-2xl">
                    <h2 className="text-xl font-bold text-white mb-4">🔍 Verify Prescription</h2>
                    <p className="muted text-sm mb-4">
                        Scan the patient's QR code or paste the JSON content manually.
                        This will verify the digital signature and integrity hash.
                    </p>

                    <form onSubmit={handleManualEntry} className="space-y-4">
                        <div>
                            <label className="block text-sm muted mb-1">QR Code Data (JSON)</label>
                            <textarea
                                value={scanData}
                                onChange={(e) => setScanData(e.target.value)}
                                placeholder='{"prescriptionId": "...", "contentHash": "...", "type": "SPLITRX_VERIFY"}'
                                rows={6}
                                required
                                className="input font-mono text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary font-bold py-3 px-4 rounded-xl transition disabled:opacity-50"
                        >
                            {loading ? '🔄 Verifying...' : '✅ Verify & Dispense'}
                        </button>
                    </form>
                </div>

                {/* Verification Result */}
                <div>
                    {verificationResult && (
                        <div className={`p-6 rounded-2xl border-2 ${verificationResult.verified ? 'panel border-[#2e8b57]' : 'panel-strong border-[#dc143c]'}`}>
                            {verificationResult.verified ? (
                                <>
                                    <h3 className="text-2xl font-bold text-[#2e8b57] mb-4">✅ VERIFIED</h3>

                                    <div className="space-y-2 mb-6 text-white/90">
                                        <p className="flex items-center gap-2">
                                            <span className="text-[#2e8b57]">🔏</span>
                                            <strong>Signature:</strong> {verificationResult.signatureVerified ? 'Valid' : 'Invalid'}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="text-[#2e8b57]">🔗</span>
                                            <strong>Integrity:</strong> {verificationResult.integrityVerified ? 'Valid' : 'Invalid'}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="text-[#2e8b57]">📅</span>
                                            <strong>Dispensed:</strong> {new Date(verificationResult.dispensedAt).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="panel-strong p-4 rounded-xl mb-4">
                                        <h4 className="text-white font-semibold mb-2">Prescription Details:</h4>
                                        <p className="text-white/90"><strong>Diagnosis:</strong> {verificationResult.prescriptionData.diagnosis}</p>
                                        <p className="text-white/90"><strong>Prescribed by:</strong> {verificationResult.prescriptionData.prescribedBy}</p>
                                    </div>

                                    <div className="panel-strong p-4 rounded-xl">
                                        <h4 className="text-white font-semibold mb-2">Medications to Dispense:</h4>
                                        {verificationResult.prescriptionData.medications.map((med: any, i: number) => (
                                            <div key={i} className="text-[#e0ffff] mb-1 border-b border-[#1c3c63] last:border-0 pb-1 last:pb-0">
                                                <strong>{med.name}</strong> — {med.dosage} — {med.frequency} — {med.duration}
                                            </div>
                                        ))}
                                    </div>

                                    <p className="text-xs muted mt-4 font-mono break-all">
                                        Dispensing ID: {verificationResult.dispensingId}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-bold text-[#dc143c] mb-4">❌ VERIFICATION FAILED</h3>
                                    <p className="text-white mb-4 bg-[#2a0f1b] p-3 rounded">{verificationResult.error}</p>
                                    <div className="bg-[#2a1c0f] border border-[#b45309] p-4 rounded text-[#fbd38d]">
                                        <p className="font-bold flex items-center gap-2">
                                            ⚠️ DO NOT DISPENSE
                                        </p>
                                        <p className="mt-2 text-sm">
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
