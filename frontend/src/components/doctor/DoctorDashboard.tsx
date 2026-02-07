
'use client';

import { useState } from 'react';
import WritePrescription from './WritePrescription';
import { useAuth } from '@/context/AuthContext';

export default function DoctorDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('write');

    return (
        <div className="space-y-6">
            <div className="panel p-6 rounded-2xl">
                <h1 className="text-3xl font-bold text-white">👨‍⚕️ Doctor Dashboard</h1>
                <p className="muted">Welcome, Dr. {user?.fullName}</p>
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    className={`${activeTab === 'write' ? 'tab tab-active' : 'tab'}`}
                    onClick={() => setActiveTab('write')}
                >
                    ✍️ Write Prescription
                </button>
                <button
                    className={`${activeTab === 'history' ? 'tab tab-active' : 'tab'}`}
                    onClick={() => setActiveTab('history')}
                >
                    📋 History
                </button>
            </div>

            {activeTab === 'write' && <WritePrescription />}
            {activeTab === 'history' && (
                <div className="panel-strong rounded-2xl p-8 text-center muted">
                    History feature coming soon...
                </div>
            )}
        </div>
    );
}
