
'use client';

import { useState } from 'react';
import WritePrescription from './WritePrescription';
import { useAuth } from '@/context/AuthContext';

export default function DoctorDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('write');

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">👨‍⚕️ Doctor Dashboard</h1>
                <p className="text-gray-400">Welcome, Dr. {user?.fullName}</p>
            </div>

            <div className="flex gap-4 mb-6">
                <button
                    className={`px-4 py-2 rounded font-medium transition ${activeTab === 'write'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    onClick={() => setActiveTab('write')}
                >
                    ✍️ Write Prescription
                </button>
                <button
                    className={`px-4 py-2 rounded font-medium transition ${activeTab === 'history'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    onClick={() => setActiveTab('history')}
                >
                    📋 History
                </button>
            </div>

            {activeTab === 'write' && <WritePrescription />}
            {activeTab === 'history' && (
                <div className="text-center text-gray-500 py-10">
                    History feature coming soon...
                </div>
            )}
        </div>
    );
}
