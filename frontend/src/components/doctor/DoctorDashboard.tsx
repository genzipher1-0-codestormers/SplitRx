'use client';

import { useState } from 'react';
import WritePrescription from './WritePrescription';
import { useAuth } from '@/context/AuthContext';
import { Stethoscope, PenLine, History, ClipboardList } from 'lucide-react';

export default function DoctorDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('write');

    const tabs = [
        { id: 'write', label: 'Write Prescription', icon: <PenLine className="w-4 h-4" /> },
        { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> }
    ];

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header Card */}
            <div className="panel p-6 rounded-2xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#2e8b57]/20 to-[#3a6ea5]/20 border border-[#2e8b57]/30">
                        <Stethoscope className="w-8 h-8 text-[#2e8b57]" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Doctor Dashboard</h1>
                        <p className="muted">Welcome back, Dr. {user?.fullName}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-3">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`${activeTab === tab.id ? 'tab tab-active' : 'tab'}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="animate-fade-in">
                {activeTab === 'write' && <WritePrescription />}
                {activeTab === 'history' && (
                    <div className="panel p-8 rounded-2xl text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-4 rounded-2xl bg-[#0b1d38] border border-[#1c3c63]">
                                <ClipboardList className="w-12 h-12 text-[#708090]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">Prescription History</h3>
                                <p className="muted">Your prescription history will appear here.</p>
                                <p className="text-sm text-[#3a6ea5] mt-2">Coming soon...</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
