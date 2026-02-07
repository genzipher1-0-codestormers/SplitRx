
'use client';

import { useState, useEffect } from 'react';
import { prescriptionAPI, consentAPI, auditAPI } from '@/services/api';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function PatientDashboard() {
    const { user } = useAuth();
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [consents, setConsents] = useState<any[]>([]);
    const [auditTrail, setAuditTrail] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('prescriptions');
    const [selectedQR, setSelectedQR] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [rxRes, consentRes, auditRes] = await Promise.all([
                prescriptionAPI.getMyPrescriptions().catch(() => ({ data: { prescriptions: [] } })),
                consentAPI.getMyConsents().catch(() => ({ data: { consents: [] } })),
                auditAPI.getMyAuditTrail().catch(() => ({ data: { logs: [] } }))
            ]);
            setPrescriptions(rxRes.data.prescriptions || []);
            setConsents(consentRes.data.consents || []);
            const rawLogs = auditRes.data.logs || auditRes.data.auditTrail || [];
            const normalizedLogs = rawLogs.map((entry: any) => ({
                ...entry,
                risk_score: entry.metadata?.risk_score ?? entry.risk_score ?? 0,
                created_at: entry.timestamp ?? entry.created_at,
                resource_owner: entry.resource_owner_id ?? entry.resource_owner
            }));
            setAuditTrail(normalizedLogs);
        } catch (error) {
            console.error("Failed to load data", error);
            toast.error('Failed to load data');
        }
        setLoading(false);
    };

    const generateQR = async (prescriptionId: string) => {
        try {
            const response = await prescriptionAPI.getQRCode(prescriptionId);
            setSelectedQR(response.data);
            toast.success('QR Code generated! Show this to your pharmacist.');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to generate QR');
        }
    };

    const copyToClipboard = async (value: string, successMessage: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success(successMessage);
        } catch (error) {
            console.error('Clipboard error', error);
            toast.error('Copy failed. Please try again.');
        }
    };

    const buildShareableQrPayload = (rx: any) => {
        const payloadHash = rx.contentHash || rx.payloadHash || '';
        return JSON.stringify({
            type: 'SPLITRX_VERIFY',
            prescriptionId: rx.id,
            prescriptionNumber: rx.prescriptionNumber,
            payloadHash,
            patientId: user?.id,
            timestamp: Date.now()
        });
    };

    const revokeConsent = async (consentId: string) => {
        if (!confirm('Are you sure you want to revoke this consent?')) return;
        try {
            await consentAPI.revoke(consentId);
            toast.success('Consent revoked');
            loadData();
        } catch (error) {
            toast.error('Failed to revoke consent');
        }
    };

    const eraseAllData = async () => {
        if (!confirm('⚠️ This will PERMANENTLY delete ALL your medical data. This cannot be undone. Continue?')) return;
        if (!confirm('Are you absolutely sure? Type YES to confirm.')) return;
        try {
            await consentAPI.eraseAllData();
            toast.success('All data erased (GDPR Art. 17)');
            loadData();
        } catch (error) {
            toast.error('Failed to erase data');
        }
    };

    if (loading) return <div className="p-8 text-white">Loading...</div>;

    const tabs = [
        { id: 'prescriptions', label: `💊 Prescriptions (${prescriptions.length})` },
        { id: 'consents', label: `✅ Consents (${consents.length})` },
        { id: 'audit', label: `📋 Audit Trail (${auditTrail.length})` },
        { id: 'privacy', label: '🔒 Privacy' }
    ];

    return (
        <div className="space-y-6">
            <div className="panel p-6 rounded-2xl">
                <h1 className="text-3xl font-bold text-white">🏥 Patient Dashboard</h1>
                <p className="muted">Welcome, {user?.fullName}</p>
                <div className="flex items-center gap-2 text-xs muted mt-2">
                    <span>Your ID:</span>
                    <code className="bg-[#071a33] px-2 py-1 rounded">{user?.id}</code>
                    <button
                        onClick={() => user?.id && copyToClipboard(user.id, 'Patient ID copied')}
                        className="btn-outline px-2 py-0.5 rounded"
                    >
                        Copy
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`${activeTab === tab.id ? 'tab tab-active' : 'tab'}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* PRESCRIPTIONS TAB */}
            {activeTab === 'prescriptions' && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white">💊 My Prescriptions</h2>
                    {prescriptions.length === 0 ? (
                        <p className="muted italic">No prescriptions yet</p>
                    ) : (
                        prescriptions.map(rx => (
                            <div key={rx.id} className={`panel p-4 rounded-2xl border-l-4 ${rx.status === 'active' ? 'border-[#2e8b57]' : 'border-[#708090]'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${rx.status === 'active' ? 'bg-[#102f55] text-[#e0ffff]' : 'bg-[#0b1d38] text-[#708090]'
                                        }`}>
                                        {rx.status}
                                    </span>
                                    <span className="muted text-sm">{new Date(rx.prescribedAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-white"><strong className="muted">Doctor:</strong> {rx.doctorName}</p>
                                <p className="text-white"><strong className="muted">Diagnosis:</strong> {(rx.data || rx.payload)?.diagnosis}</p>

                                <div className="mt-3 panel-strong p-3 rounded-xl">
                                    <strong className="text-sm block mb-1 muted">Medications:</strong>
                                    {(rx.data || rx.payload)?.medications?.map((med: any, i: number) => (
                                        <div key={i} className="text-sm text-white/90 ml-2">
                                            • {med.name} — {med.dosage} ({med.frequency})
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2 justify-between items-end">
                                    <p className="text-xs muted font-mono">
                                        Hash: {(rx.contentHash || rx.payloadHash || '').substring(0, 12)}...
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => copyToClipboard(buildShareableQrPayload(rx), 'QR data copied')}
                                            className="btn-secondary px-3 py-1 rounded-lg text-sm transition"
                                        >
                                            📋 Copy QR Data
                                        </button>
                                        {rx.status === 'active' && (
                                            <button
                                                onClick={() => generateQR(rx.id)}
                                                className="btn-primary px-3 py-1 rounded-lg text-sm transition"
                                            >
                                                📱 Generate QR
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* CONSENTS TAB */}
            {activeTab === 'consents' && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white">✅ My Consent Records</h2>
                    <p className="text-sm bg-[#102f55]/80 p-3 rounded-xl muted">
                        GDPR Art. 7 — You control who can access your data
                    </p>
                    {consents.map(c => (
                        <div key={c.id} className="panel p-4 rounded-2xl">
                            <div className="flex justify-between mb-2">
                                <p className="text-white"><strong>Granted to:</strong> {c.granted_to_name} ({c.granted_to_role})</p>
                                <span className={`px-2 py-0.5 rounded text-xs uppercase ${c.status === 'active' ? 'bg-[#102f55] text-[#e0ffff]' : 'bg-[#2a0f1b] text-[#dc143c]'}`}>{c.status}</span>
                            </div>
                            <p className="text-sm muted"><strong>Purpose:</strong> {c.purpose}</p>
                            <p className="text-sm muted"><strong>Data:</strong> {c.data_categories?.join(', ')}</p>
                            <p className="text-xs muted mt-2">Expires: {new Date(c.expires_at).toLocaleDateString()}</p>
                            {c.status === 'active' && (
                                <button onClick={() => revokeConsent(c.id)} className="mt-2 text-[#dc143c] hover:text-[#ff3b61] text-sm font-medium">
                                    🚫 Revoke Consent
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* AUDIT TRAIL TAB */}
            {activeTab === 'audit' && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white">📋 Audit Trail</h2>
                    <p className="text-sm bg-[#102f55]/80 p-3 rounded-xl muted">
                        GDPR Art. 15 — Every access to your data is logged immutably
                    </p>
                    <div className="space-y-2">
                        {auditTrail.map(entry => (
                            <div key={entry.id} className={`p-3 rounded-xl border-l-4 ${entry.risk_score > 50 ? 'bg-[#2a0f1b] border-[#dc143c]' : 'panel-strong border-[#2b4f7a]'}`}>
                                <div className="flex justify-between text-xs muted mb-1">
                                    <span>{entry.created_at ? new Date(entry.created_at).toLocaleString() : 'N/A'}</span>
                                    <span>Risk Score: {entry.risk_score}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <strong className="text-white">{entry.action}</strong>
                                    {entry.risk_score > 50 && <span className="bg-[#dc143c] text-white text-[10px] px-1 rounded">High Risk</span>}
                                </div>
                                <div className="text-sm muted mt-1">
                                    Resource: {entry.resource_type} | Owner: {entry.resource_owner || 'N/A'}
                                </div>
                                <div className="text-xs muted font-mono mt-1 w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                    Hash: {entry.entry_hash || 'N/A'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PRIVACY TAB */}
            {activeTab === 'privacy' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white">🔒 Privacy Controls</h2>

                    <div className="panel p-4 rounded-2xl">
                        <h3 className="text-lg font-semibold text-white mb-2">📤 Export My Data (GDPR Art. 20)</h3>
                        <p className="muted text-sm mb-4">Download all your medical data in a portable JSON format.</p>
                        <button className="btn-secondary px-4 py-2 rounded-lg transition">
                            Download My Data
                        </button>
                    </div>

                    <div className="panel-strong p-4 rounded-2xl border border-[#5a1c2b]">
                        <h3 className="text-lg font-semibold text-[#dc143c] mb-2">🗑️ Right to Erasure (GDPR Art. 17)</h3>
                        <p className="muted text-sm mb-4">
                            Permanently delete ALL your medical data via crypto-shredding.
                            This action CANNOT be undone.
                        </p>
                        <button onClick={eraseAllData} className="btn-danger px-4 py-2 rounded-lg transition font-bold">
                            ⚠️ Erase All My Data
                        </button>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {selectedQR && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedQR(null)}>
                    <div className="panel p-6 rounded-2xl max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4">📱 Show to Pharmacist</h3>
                        <div className="flex justify-center mb-4">
                            {/* Using img tag because the API returns a data URL or we render it from string */}
                            {/* If the API returns a raw string for QR, we use QRCode component. 
                               The API in fullcode.txt returns { qrCode: "data:image/png;base64..." } or similar.
                               Wait, fullcode.txt logic was:
                               `const qr = await prescriptionService.generateQRCode...`
                               Back end sends: `{ qrCode: await QRCode.toDataURL(...) }`
                               So it is an image source.
                           */}
                            <img src={selectedQR.qrCode} alt="Prescription QR Code" className="w-64 h-64 rounded-lg border border-[#1c3c63]" />
                        </div>
                        <p className="text-sm muted mb-4">Expires in: {selectedQR.expiresIn}</p>
                        <button
                            onClick={() => setSelectedQR(null)}
                            className="btn-secondary px-4 py-2 rounded-lg w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
