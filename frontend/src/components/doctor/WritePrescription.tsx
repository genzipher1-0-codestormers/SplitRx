
'use client';

import { useState } from 'react';
import { prescriptionAPI } from '@/services/api';
import toast from 'react-hot-toast';

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
            toast.success('✅ Prescription created and digitally signed!');

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
            <h2 className="text-2xl font-bold mb-4 text-white">✍️ Write New Prescription</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm muted mb-1">Patient ID (UUID)</label>
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
                    <label className="block text-sm muted mb-1">Diagnosis</label>
                    <input
                        type="text"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="Primary diagnosis"
                        required
                        className="input"
                    />
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">Medications</h3>
                    {medications.map((med, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 panel-strong p-3 rounded-xl">
                            <input
                                placeholder="Medication name"
                                value={med.name}
                                onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                required
                                className="input"
                            />
                            <input
                                placeholder="Dosage (e.g., 500mg)"
                                value={med.dosage}
                                onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                required
                                className="input"
                            />
                            <input
                                placeholder="Frequency"
                                value={med.frequency}
                                onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                required
                                className="input"
                            />
                            <div className="flex gap-2">
                                <input
                                    placeholder="Duration"
                                    value={med.duration}
                                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                    required
                                    className="input"
                                />
                                {medications.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeMedication(index)}
                                        className="text-[#dc143c] hover:text-[#ff3b61] font-bold px-2"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addMedication}
                        className="btn-secondary py-1 px-3 rounded-lg text-sm transition"
                    >
                        + Add Medication
                    </button>
                </div>

                <div>
                    <label className="block text-sm muted mb-1">Notes (optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional notes"
                        className="input h-24"
                    />
                </div>

                <div>
                    <label className="block text-sm muted mb-1">Valid for (days)</label>
                    <input
                        type="number"
                        value={expiresInDays}
                        onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                        min={1}
                        max={365}
                        className="input w-24"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary font-bold py-3 px-4 rounded-xl transition disabled:opacity-50"
                >
                    {loading ? '🔒 Signing & Encrypting...' : '🔏 Sign & Create Prescription'}
                </button>
            </form>

            {result && (
                <div className="mt-6 border border-[#2e8b57] bg-[#102f55]/70 p-4 rounded-xl text-[#e0ffff]">
                    <h3 className="text-xl font-bold mb-2">✅ Prescription Created</h3>
                    <p><strong>ID:</strong> {result.id}</p>
                    <p><strong>Content Hash:</strong> <code className="bg-black/30 px-1 rounded">{result.payloadHash || result.contentHash}</code></p>
                    <p><strong>Status:</strong> {result.status}</p>
                    <p><strong>Expires:</strong> {new Date(result.expiresAt).toLocaleDateString()}</p>
                    <p className="mt-2 text-sm text-[#e0ffff] italic">
                        🔒 Prescription data is encrypted and digitally signed.
                        Only authorized parties can read it.
                    </p>
                </div>
            )}
        </div>
    );
}
