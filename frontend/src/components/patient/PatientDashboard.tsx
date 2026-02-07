
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
        <div className="p-6">
            <div className="mb-8 border-b border-gray-700 pb-4">
                <h1 className="text-3xl font-bold text-white">🏥 Patient Dashboard</h1>
                <p className="text-gray-400">Welcome, {user?.fullName}</p>
                <p className="text-xs text-gray-500 mt-1">Your ID: <code className="bg-gray-800 px-1 rounded">{user?.id}</code></p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`px-4 py-2 rounded font-medium transition ${activeTab === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
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
                        <p className="text-gray-500 italic">No prescriptions yet</p>
                    ) : (
                        prescriptions.map(rx => (
                            <div key={rx.id} className={`bg-gray-800 p-4 rounded-lg border-l-4 ${rx.status === 'active' ? 'border-green-500' : 'border-gray-500'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${rx.status === 'active' ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'
                                        }`}>
                                        {rx.status}
                                    </span>
                                    <span className="text-gray-400 text-sm">{new Date(rx.prescribedAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-white"><strong className="text-gray-400">Doctor:</strong> {rx.doctorName}</p>
                                <p className="text-white"><strong className="text-gray-400">Diagnosis:</strong> {(rx.data || rx.payload)?.diagnosis}</p>

                                <div className="mt-3 bg-gray-900/50 p-2 rounded">
                                    <strong className="text-gray-300 text-sm block mb-1">Medications:</strong>
                                    {(rx.data || rx.payload)?.medications?.map((med: any, i: number) => (
                                        <div key={i} className="text-sm text-gray-200 ml-2">
                                            • {med.name} — {med.dosage} ({med.frequency})
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-3 flex justify-between items-end">
                                    <p className="text-xs text-gray-600 font-mono">
                                        Hash: {(rx.contentHash || rx.payloadHash || '').substring(0, 12)}...
                                    </p>
                                    {rx.status === 'active' && (
                                        <button
                                            onClick={() => generateQR(rx.id)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                                        >
                                            📱 Generate QR
                                        </button>
                                    )}
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
                    <p className="text-sm text-blue-300 bg-blue-900/20 p-2 rounded">
                        GDPR Art. 7 — You control who can access your data
                    </p>
                    {consents.map(c => (
                        <div key={c.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <div className="flex justify-between mb-2">
                                <p className="text-white"><strong>Granted to:</strong> {c.granted_to_name} ({c.granted_to_role})</p>
                                <span className={`px-2 py-0.5 rounded text-xs uppercase ${c.status === 'active' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>{c.status}</span>
                            </div>
                            <p className="text-gray-300 text-sm"><strong>Purpose:</strong> {c.purpose}</p>
                            <p className="text-gray-300 text-sm"><strong>Data:</strong> {c.data_categories?.join(', ')}</p>
                            <p className="text-gray-500 text-xs mt-2">Expires: {new Date(c.expires_at).toLocaleDateString()}</p>
                            {c.status === 'active' && (
                                <button onClick={() => revokeConsent(c.id)} className="mt-2 text-red-400 hover:text-red-300 text-sm font-medium">
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
                    <p className="text-sm text-blue-300 bg-blue-900/20 p-2 rounded">
                        GDPR Art. 15 — Every access to your data is logged immutably
                    </p>
                    <div className="space-y-2">
                        {auditTrail.map(entry => (
                            <div key={entry.id} className={`p-3 rounded border-l-4 ${entry.risk_score > 50 ? 'bg-red-900/20 border-red-500' : 'bg-gray-800 border-gray-600'}`}>
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>{entry.created_at ? new Date(entry.created_at).toLocaleString() : 'N/A'}</span>
                                    <span>Risk Score: {entry.risk_score}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <strong className="text-white">{entry.action}</strong>
                                    {entry.risk_score > 50 && <span className="bg-red-600 text-white text-[10px] px-1 rounded">⚠️ High Risk</span>}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">
                                    Resource: {entry.resource_type} | Owner: {entry.resource_owner || 'N/A'}
                                </div>
                                <div className="text-xs text-gray-600 font-mono mt-1 w-full overflow-hidden text-ellipsis whitespace-nowrap">
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

                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-2">📤 Export My Data (GDPR Art. 20)</h3>
                        <p className="text-gray-400 text-sm mb-4">Download all your medical data in a portable JSON format.</p>
                        <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition">
                            Download My Data
                        </button>
                    </div>

                    <div className="bg-red-900/10 p-4 rounded-lg border border-red-800">
                        <h3 className="text-lg font-semibold text-red-400 mb-2">🗑️ Right to Erasure (GDPR Art. 17)</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Permanently delete ALL your medical data via crypto-shredding.
                            This action CANNOT be undone.
                        </p>
                        <button onClick={eraseAllData} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition font-bold">
                            ⚠️ Erase All My Data
                        </button>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {selectedQR && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedQR(null)}>
                    <div className="bg-white p-6 rounded-lg max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">📱 Show to Pharmacist</h3>
                        <div className="flex justify-center mb-4">
                            {/* Using img tag because the API returns a data URL or we render it from string */}
                            {/* If the API returns a raw string for QR, we use QRCode component. 
                               The API in fullcode.txt returns { qrCode: "data:image/png;base64..." } or similar.
                               Wait, fullcode.txt logic was:
                               `const qr = await prescriptionService.generateQRCode...`
                               Back end sends: `{ qrCode: await QRCode.toDataURL(...) }`
                               So it is an image source.
                           */}
                            <img src={selectedQR.qrCode} alt="Prescription QR Code" className="w-64 h-64" />
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Expires in: {selectedQR.expiresIn}</p>
                        <button
                            onClick={() => setSelectedQR(null)}
                            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
