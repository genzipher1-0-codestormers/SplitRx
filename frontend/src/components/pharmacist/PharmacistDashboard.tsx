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
        <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-8">💊 Pharmacist Dashboard</h1>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Verification Form */}
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4">🔍 Verify Prescription</h2>
                    <p className="text-gray-400 text-sm mb-4">
                        Scan the patient's QR code or paste the JSON content manually.
                        This will verify the digital signature and integrity hash.
                    </p>

                    <form onSubmit={handleManualEntry} className="space-y-4">
                        <div>
                            <label className="block text-gray-300 mb-1">QR Code Data (JSON)</label>
                            <textarea
                                value={scanData}
                                onChange={(e) => setScanData(e.target.value)}
                                placeholder='{"prescriptionId": "...", "contentHash": "...", "type": "SPLITRX_VERIFY"}'
                                rows={6}
                                required
                                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition disabled:opacity-50"
                        >
                            {loading ? '🔄 Verifying...' : '✅ Verify & Dispense'}
                        </button>
                    </form>
                </div>

                {/* Verification Result */}
                <div>
                    {verificationResult && (
                        <div className={`p-6 rounded-lg border-2 ${verificationResult.verified ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'}`}>
                            {verificationResult.verified ? (
                                <>
                                    <h3 className="text-2xl font-bold text-green-400 mb-4">✅ VERIFIED</h3>

                                    <div className="space-y-2 mb-6 text-gray-300">
                                        <p className="flex items-center gap-2">
                                            <span className="text-green-500">🔏</span>
                                            <strong>Signature:</strong> {verificationResult.signatureVerified ? 'Valid' : 'Invalid'}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="text-green-500">🔗</span>
                                            <strong>Integrity:</strong> {verificationResult.integrityVerified ? 'Valid' : 'Invalid'}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="text-green-500">📅</span>
                                            <strong>Dispensed:</strong> {new Date(verificationResult.dispensedAt).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="bg-gray-900/50 p-4 rounded mb-4">
                                        <h4 className="text-white font-semibold mb-2">Prescription Details:</h4>
                                        <p className="text-gray-300"><strong>Diagnosis:</strong> {verificationResult.prescriptionData.diagnosis}</p>
                                        <p className="text-gray-300"><strong>Prescribed by:</strong> {verificationResult.prescriptionData.prescribedBy}</p>
                                    </div>

                                    <div className="bg-gray-900/50 p-4 rounded">
                                        <h4 className="text-white font-semibold mb-2">Medications to Dispense:</h4>
                                        {verificationResult.prescriptionData.medications.map((med: any, i: number) => (
                                            <div key={i} className="text-blue-300 mb-1 border-b border-gray-700 last:border-0 pb-1 last:pb-0">
                                                <strong>{med.name}</strong> — {med.dosage} — {med.frequency} — {med.duration}
                                            </div>
                                        ))}
                                    </div>

                                    <p className="text-xs text-gray-600 mt-4 font-mono break-all">
                                        Dispensing ID: {verificationResult.dispensingId}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-bold text-red-500 mb-4">❌ VERIFICATION FAILED</h3>
                                    <p className="text-white mb-4 bg-red-900/50 p-3 rounded">{verificationResult.error}</p>
                                    <div className="bg-orange-900/20 border border-orange-600 p-4 rounded text-orange-200">
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