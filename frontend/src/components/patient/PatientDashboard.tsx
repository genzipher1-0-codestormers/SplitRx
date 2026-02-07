'use client';

import { useState, useEffect } from 'react';
import { prescriptionAPI, consentAPI, auditAPI } from '@/services/api';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import {
    Building2, Pill, CheckCircle, ScrollText, Shield, Download, Trash2,
    QrCode, Copy, AlertTriangle, X, User, Clock, Hash, FileText,
    ShieldCheck, ShieldAlert, Eye, Calendar, ChevronRight
} from 'lucide-react';
import { LoadingScreen } from '@/components/common/LoadingSpinner';

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

    if (loading) return <LoadingScreen message="Loading your health data..." />;

    const tabs = [
        { id: 'prescriptions', label: 'Prescriptions', icon: <Pill className="w-4 h-4" />, count: prescriptions.length },
        { id: 'consents', label: 'Consents', icon: <CheckCircle className="w-4 h-4" />, count: consents.length },
        { id: 'audit', label: 'Audit Trail', icon: <ScrollText className="w-4 h-4" />, count: auditTrail.length },
        { id: 'privacy', label: 'Privacy', icon: <Shield className="w-4 h-4" /> }
    ];

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="panel p-6 rounded-2xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                            <Building2 className="w-8 h-8 text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">Patient Dashboard</h1>
                            <p className="muted">Welcome, {user?.fullName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="muted">Your ID:</span>
                        <code className="bg-[#071a33] px-3 py-1.5 rounded-lg font-mono text-xs">{user?.id}</code>
                        <button
                            onClick={() => user?.id && copyToClipboard(user.id, 'Patient ID copied')}
                            className="btn btn-outline px-3 py-1.5 rounded-lg text-xs"
                        >
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`${activeTab === tab.id ? 'tab tab-active' : 'tab'}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                        {tab.count !== undefined && (
                            <span className="ml-1 px-2 py-0.5 rounded-full bg-black/20 text-xs">{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* PRESCRIPTIONS TAB */}
            {activeTab === 'prescriptions' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <Pill className="w-5 h-5 text-[#3a6ea5]" />
                        <h2 className="text-xl font-bold text-white">My Prescriptions</h2>
                    </div>

                    {prescriptions.length === 0 ? (
                        <div className="panel p-8 rounded-2xl text-center">
                            <Pill className="w-12 h-12 text-[#708090] mx-auto mb-4" />
                            <p className="muted">No prescriptions yet</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {prescriptions.map((rx, index) => (
                                <div
                                    key={rx.id}
                                    className={`panel p-5 rounded-2xl border-l-4 ${rx.status === 'active' ? 'border-[#2e8b57]' : 'border-[#708090]'} animate-fade-in-up`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`badge ${rx.status === 'active' ? 'badge-success' : 'badge-default'}`}>
                                            {rx.status === 'active' ? <CheckCircle className="w-3 h-3" /> : null}
                                            {rx.status}
                                        </span>
                                        <span className="flex items-center gap-1 muted text-sm">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(rx.prescribedAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="space-y-1 mb-4">
                                        <p className="text-white"><strong className="muted">Doctor:</strong> {rx.doctorName}</p>
                                        <p className="text-white"><strong className="muted">Diagnosis:</strong> {(rx.data || rx.payload)?.diagnosis}</p>
                                    </div>

                                    <div className="panel-strong p-4 rounded-xl mb-4">
                                        <strong className="text-sm block mb-2 muted flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            Medications
                                        </strong>
                                        <div className="space-y-1">
                                            {(rx.data || rx.payload)?.medications?.map((med: any, i: number) => (
                                                <div key={i} className="text-sm text-white/90 flex items-center gap-2">
                                                    <ChevronRight className="w-3 h-3 text-[#3a6ea5]" />
                                                    <span>{med.name} — {med.dosage} ({med.frequency})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3 justify-between items-center">
                                        <p className="text-xs muted font-mono flex items-center gap-1">
                                            <Hash className="w-3 h-3" />
                                            {(rx.contentHash || rx.payloadHash || '').substring(0, 16)}...
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => copyToClipboard(buildShareableQrPayload(rx), 'QR data copied')}
                                                className="btn btn-secondary px-3 py-2 rounded-lg text-sm"
                                            >
                                                <Copy className="w-4 h-4" />
                                                Copy QR Data
                                            </button>
                                            {rx.status === 'active' && (
                                                <button
                                                    onClick={() => generateQR(rx.id)}
                                                    className="btn btn-primary px-3 py-2 rounded-lg text-sm"
                                                >
                                                    <QrCode className="w-4 h-4" />
                                                    Generate QR
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* CONSENTS TAB */}
            {activeTab === 'consents' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-[#2e8b57]" />
                        <h2 className="text-xl font-bold text-white">My Consent Records</h2>
                    </div>

                    <div className="panel-strong p-4 rounded-xl flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-[#3a6ea5]" />
                        <p className="text-sm muted">
                            <strong className="text-white">GDPR Art. 7</strong> — You control who can access your data
                        </p>
                    </div>

                    {consents.length === 0 ? (
                        <div className="panel p-8 rounded-2xl text-center">
                            <CheckCircle className="w-12 h-12 text-[#708090] mx-auto mb-4" />
                            <p className="muted">No consent records yet</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {consents.map((c, index) => (
                                <div
                                    key={c.id}
                                    className="panel p-5 rounded-2xl animate-fade-in-up"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex justify-between mb-3">
                                        <p className="text-white"><strong>Granted to:</strong> {c.granted_to_name} ({c.granted_to_role})</p>
                                        <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                            {c.status}
                                        </span>
                                    </div>
                                    <p className="text-sm muted mb-1"><strong>Purpose:</strong> {c.purpose}</p>
                                    <p className="text-sm muted mb-2"><strong>Data:</strong> {c.data_categories?.join(', ')}</p>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs muted flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Expires: {new Date(c.expires_at).toLocaleDateString()}
                                        </p>
                                        {c.status === 'active' && (
                                            <button
                                                onClick={() => revokeConsent(c.id)}
                                                className="btn btn-ghost text-[#dc143c] text-sm font-medium"
                                            >
                                                <X className="w-4 h-4" />
                                                Revoke Consent
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* AUDIT TRAIL TAB */}
            {activeTab === 'audit' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <ScrollText className="w-5 h-5 text-[#3a6ea5]" />
                        <h2 className="text-xl font-bold text-white">Audit Trail</h2>
                    </div>

                    <div className="panel-strong p-4 rounded-xl flex items-center gap-3">
                        <Eye className="w-5 h-5 text-[#3a6ea5]" />
                        <p className="text-sm muted">
                            <strong className="text-white">GDPR Art. 15</strong> — Every access to your data is logged immutably
                        </p>
                    </div>

                    {auditTrail.length === 0 ? (
                        <div className="panel p-8 rounded-2xl text-center">
                            <ScrollText className="w-12 h-12 text-[#708090] mx-auto mb-4" />
                            <p className="muted">No audit records yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {auditTrail.map((entry, index) => (
                                <div
                                    key={entry.id}
                                    className={`p-4 rounded-xl border-l-4 ${entry.risk_score > 50 ? 'bg-[#2a0f1b]/60 border-[#dc143c]' : 'panel-strong border-[#2b4f7a]'} animate-fade-in-up`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex justify-between text-xs muted mb-2">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {entry.created_at ? new Date(entry.created_at).toLocaleString() : 'N/A'}
                                        </span>
                                        <span className={`flex items-center gap-1 ${entry.risk_score > 50 ? 'text-[#dc143c]' : ''}`}>
                                            {entry.risk_score > 50 ? <ShieldAlert className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                            Risk: {entry.risk_score}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <strong className="text-white">{entry.action}</strong>
                                        {entry.risk_score > 50 && (
                                            <span className="badge badge-danger text-[10px]">High Risk</span>
                                        )}
                                    </div>
                                    <div className="text-sm muted">
                                        Resource: {entry.resource_type} | Owner: {entry.resource_owner || 'N/A'}
                                    </div>
                                    <div className="text-xs muted font-mono mt-2 flex items-center gap-1 truncate">
                                        <Hash className="w-3 h-3 shrink-0" />
                                        {entry.entry_hash || 'N/A'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* PRIVACY TAB */}
            {activeTab === 'privacy' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[#3a6ea5]" />
                        <h2 className="text-xl font-bold text-white">Privacy Controls</h2>
                    </div>

                    {/* Export Data Card */}
                    <div className="panel p-6 rounded-2xl">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-[#102f55] border border-[#2b4f7a]">
                                <Download className="w-6 h-6 text-[#3a6ea5]" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white mb-1">Export My Data</h3>
                                <p className="text-sm muted mb-1">GDPR Art. 20 — Data Portability</p>
                                <p className="muted text-sm mb-4">Download all your medical data in a portable JSON format.</p>
                                <button className="btn btn-secondary px-4 py-2 rounded-lg">
                                    <Download className="w-4 h-4" />
                                    Download My Data
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Erase Data Card */}
                    <div className="panel-strong p-6 rounded-2xl border border-[#5a1c2b]">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-[#2a0f1b] border border-[#5a1c2b]">
                                <Trash2 className="w-6 h-6 text-[#dc143c]" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-[#dc143c] mb-1">Right to Erasure</h3>
                                <p className="text-sm muted mb-1">GDPR Art. 17 — Right to be Forgotten</p>
                                <p className="muted text-sm mb-4">
                                    Permanently delete ALL your medical data via crypto-shredding.
                                    <strong className="text-[#dc143c]"> This action CANNOT be undone.</strong>
                                </p>
                                <button
                                    onClick={eraseAllData}
                                    className="btn btn-danger px-4 py-2 rounded-lg font-bold"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    Erase All My Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {selectedQR && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
                    onClick={() => setSelectedQR(null)}
                >
                    <div
                        className="panel p-6 rounded-2xl max-w-sm w-full text-center animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <QrCode className="w-5 h-5 text-[#3a6ea5]" />
                                Show to Pharmacist
                            </h3>
                            <button
                                onClick={() => setSelectedQR(null)}
                                className="btn btn-ghost p-2 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex justify-center mb-4 p-4 bg-white rounded-xl">
                            <img src={selectedQR.qrCode} alt="Prescription QR Code" className="w-56 h-56" />
                        </div>
                        <p className="text-sm muted mb-4 flex items-center justify-center gap-1">
                            <Clock className="w-4 h-4" />
                            Expires in: {selectedQR.expiresIn}
                        </p>
                        <button
                            onClick={() => setSelectedQR(null)}
                            className="btn btn-secondary px-6 py-2 rounded-lg w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
