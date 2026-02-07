'use client';

import { useState } from 'react';
import { prescriptionAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { PenLine, User, Stethoscope, FileText, Plus, Trash2, Lock, CheckCircle, Calendar, Hash } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    [key: string]: string;
}

export default function WritePrescription() {
    const [patientId, setPatientId] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [expiresInDays, setExpiresInDays] = useState(30);
    const [medications, setMedications] = useState<Medication[]>([
        { name: '', dosage: '', frequency: '', duration: '' }
    ]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const addMedication = () => {
        setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }]);
    };

    const removeMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const updateMedication = (index: number, field: string, value: string) => {
        const updated = [...medications];
        updated[index][field] = value;
        setMedications(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await prescriptionAPI.create({
                patient_id: patientId,
                diagnosis,
                notes,
                expires_in_days: expiresInDays,
                medications
            });

            setResult(response.data.prescription || response.data);
            toast.success('Prescription created and digitally signed!');

            // Reset form
            setPatientId('');
            setDiagnosis('');
            setNotes('');
            setMedications([{ name: '', dosage: '', frequency: '', duration: '' }]);

        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create prescription');
        }
        setLoading(false);
    };

    return (
        <div className="panel p-6 rounded-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-[#3a6ea5]/20 to-[#2e8b57]/20 border border-[#3a6ea5]/30">
                    <PenLine className="w-6 h-6 text-[#3a6ea5]" />
                </div>
                <h2 className="text-2xl font-bold text-white">Write New Prescription</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient & Diagnosis Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="flex items-center gap-2 text-sm muted mb-2 font-medium">
                            <User className="w-4 h-4" />
                            Patient ID (UUID)
                        </label>
                        <input
                            type="text"
                            value={patientId}
                            onChange={(e) => setPatientId(e.target.value)}
                            placeholder="Enter patient UUID"
                            required
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm muted mb-2 font-medium">
                            <Stethoscope className="w-4 h-4" />
                            Diagnosis
                        </label>
                        <input
                            type="text"
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            placeholder="Primary diagnosis"
                            required
                            className="input"
                        />
                    </div>
                </div>

                {/* Medications Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#3a6ea5]" />
                            Medications
                        </h3>
                        <button
                            type="button"
                            onClick={addMedication}
                            className="btn btn-secondary py-2 px-3 rounded-lg text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Medication
                        </button>
                    </div>

                    <div className="space-y-3">
                        {medications.map((med, index) => (
                            <div key={index} className="panel-strong p-4 rounded-xl grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                                <div className="md:col-span-1">
                                    <label className="text-xs muted mb-1 block">Name</label>
                                    <input
                                        placeholder="Medication name"
                                        value={med.name}
                                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                        required
                                        className="input text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs muted mb-1 block">Dosage</label>
                                    <input
                                        placeholder="e.g., 500mg"
                                        value={med.dosage}
                                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                        required
                                        className="input text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs muted mb-1 block">Frequency</label>
                                    <input
                                        placeholder="e.g., Twice daily"
                                        value={med.frequency}
                                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                        required
                                        className="input text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs muted mb-1 block">Duration</label>
                                    <input
                                        placeholder="e.g., 7 days"
                                        value={med.duration}
                                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                        required
                                        className="input text-sm"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    {medications.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeMedication(index)}
                                            className="btn btn-ghost text-[#dc143c] hover:bg-[#dc143c]/10 p-2 rounded-lg"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notes & Expiry */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm muted mb-2 font-medium">Notes (optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Additional notes for the prescription..."
                            className="input h-24 resize-none"
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm muted mb-2 font-medium">
                            <Calendar className="w-4 h-4" />
                            Valid for (days)
                        </label>
                        <input
                            type="number"
                            value={expiresInDays}
                            onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                            min={1}
                            max={365}
                            className="input"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn btn-primary font-bold py-4 px-4 rounded-xl transition-all duration-300 disabled:opacity-50"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <LoadingSpinner size="sm" />
                            Signing & Encrypting...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <Lock className="w-5 h-5" />
                            Sign & Create Prescription
                        </span>
                    )}
                </button>
            </form>

            {/* Success Result */}
            {result && (
                <div className="mt-6 p-6 rounded-xl border border-[#2e8b57] bg-gradient-to-br from-[#2e8b57]/10 to-[#3a6ea5]/10 animate-scale-in">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-[#2e8b57]/20">
                            <CheckCircle className="w-6 h-6 text-[#2e8b57]" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Prescription Created</h3>
                    </div>

                    <div className="space-y-2 text-white/90">
                        <p className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-[#3a6ea5]" />
                            <strong>ID:</strong> <code className="bg-black/30 px-2 py-0.5 rounded text-sm">{result.id}</code>
                        </p>
                        <p className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-[#3a6ea5]" />
                            <strong>Hash:</strong> <code className="bg-black/30 px-2 py-0.5 rounded text-sm truncate max-w-xs">{result.payloadHash || result.contentHash}</code>
                        </p>
                        <p><strong>Status:</strong> <span className="badge badge-success">{result.status}</span></p>
                        <p><strong>Expires:</strong> {new Date(result.expiresAt).toLocaleDateString()}</p>
                    </div>

                    <p className="mt-4 text-sm text-[#e0ffff]/80 flex items-center gap-2 bg-[#0b1d38] p-3 rounded-lg">
                        <Lock className="w-4 h-4 text-[#3a6ea5]" />
                        Prescription is encrypted and digitally signed. Only authorized parties can access it.
                    </p>
                </div>
            )}
        </div>
    );
}
