
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
                patientId,
                diagnosis,
                notes,
                expiresInDays,
                medications
            });

            setResult(response.data);
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
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-white">✍️ Write New Prescription</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-300 mb-1">Patient ID (UUID)</label>
                    <input
                        type="text"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        placeholder="Enter patient UUID"
                        required
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-gray-300 mb-1">Diagnosis</label>
                    <input
                        type="text"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="Primary diagnosis"
                        required
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">Medications</h3>
                    {medications.map((med, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-gray-750 p-3 rounded">
                            <input
                                placeholder="Medication name"
                                value={med.name}
                                onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                required
                                className="bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            />
                            <input
                                placeholder="Dosage (e.g., 500mg)"
                                value={med.dosage}
                                onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                required
                                className="bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            />
                            <input
                                placeholder="Frequency"
                                value={med.frequency}
                                onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                required
                                className="bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            />
                            <div className="flex gap-2">
                                <input
                                    placeholder="Duration"
                                    value={med.duration}
                                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                    required
                                    className="bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500 w-full"
                                />
                                {medications.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeMedication(index)}
                                        className="text-red-500 hover:text-red-400 font-bold px-2"
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
                        className="bg-gray-600 hover:bg-gray-500 text-white py-1 px-3 rounded text-sm transition"
                    >
                        + Add Medication
                    </button>
                </div>

                <div>
                    <label className="block text-gray-300 mb-1">Notes (optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional notes"
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500 h-24"
                    />
                </div>

                <div>
                    <label className="block text-gray-300 mb-1">Valid for (days)</label>
                    <input
                        type="number"
                        value={expiresInDays}
                        onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                        min={1}
                        max={365}
                        className="w-24 bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition disabled:opacity-50"
                >
                    {loading ? '🔒 Signing & Encrypting...' : '🔏 Sign & Create Prescription'}
                </button>
            </form>

            {result && (
                <div className="mt-6 bg-green-900/30 border border-green-700 p-4 rounded text-green-100">
                    <h3 className="text-xl font-bold mb-2">✅ Prescription Created</h3>
                    <p><strong>ID:</strong> {result.id}</p>
                    <p><strong>Content Hash:</strong> <code className="bg-black/30 px-1 rounded">{result.contentHash}</code></p>
                    <p><strong>Status:</strong> {result.status}</p>
                    <p><strong>Expires:</strong> {new Date(result.expiresAt).toLocaleDateString()}</p>
                    <p className="mt-2 text-sm text-green-300 italic">
                        🔒 Prescription data is encrypted and digitally signed.
                        Only authorized parties can read it.
                    </p>
                </div>
            )}
        </div>
    );
}
